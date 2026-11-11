"""خوارزمو's voice, George edition: ElevenLabs "George" (JBFqnCBsd6RMkjVDRZzb) through the vibi.pro wrapper, eleven_v4, fully
diacritized Syrian text (the recipe the owner liked). Every line of voice/script.json has "george": [spelling with qaf, spelling with
the Damascene hamza for qaf]. Each spelling is generated TAKES times; the take is picked like tools/auto_voice.py does it
(spoken-dialect classifier, Whisper guard against dropped / added words). Result: voice/takes_george.json; tools/build_voice.py
uses it with VOICE_SRC=george.
vibi.pro is async: POST /v1/text-to-speech/{voice} -> 202 {id}; poll GET /v1/history/{id}; download result.audio_url at once
(links expire). Auth header xi-api-key; Cloudflare needs a browser User-Agent.
Usage: VIBI_API_KEY=sk_... python3 tools/vibi_voice.py [--lines 1,5] [--takes 2]"""
import difflib, hashlib, json, os, re, subprocess, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY = os.environ["VIBI_API_KEY"]
VOICE, MODEL, BASE = "JBFqnCBsd6RMkjVDRZzb", "eleven_v4", "https://vibi.pro"
SET = {"stability": 0.5, "similarity_boost": 0.75, "speed": 1.0}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
TAKES = int(sys.argv[sys.argv.index("--takes") + 1]) if "--takes" in sys.argv else 2
lines = json.load(open(os.path.join(ROOT, "voice/script.json"), encoding="utf8"))["lines"]
only = {int(x) - 1 for x in sys.argv[sys.argv.index("--lines") + 1].split(",")} if "--lines" in sys.argv else None
take_dir = os.path.join(ROOT, "audio/george"); os.makedirs(take_dir, exist_ok=True)

def call(method, url, body=None, raw=False):
    req = urllib.request.Request(url, data=json.dumps(body, ensure_ascii=False).encode() if body else None, method=method,
                                 headers={"xi-api-key": KEY, "User-Agent": UA, "Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=180).read(); return r if raw else json.loads(r)
def tts(text, take):
    p = os.path.join(take_dir, hashlib.sha1(json.dumps([text, MODEL, VOICE, SET, take], ensure_ascii=False).encode()).hexdigest()[:12] + ".mp3")
    if os.path.exists(p): return p
    for k in range(6):
        try:
            tid = call("POST", f"{BASE}/v1/text-to-speech/{VOICE}", {"text": text, "provider": "elevenlabs", "model_id": MODEL, "language_code": "ar", "voice_settings": SET})["id"]
            for _ in range(150):
                h = call("GET", f"{BASE}/v1/history/{tid}")
                if h["status"] == "completed": open(p, "wb").write(call("GET", h["result"]["audio_url"], raw=True)); return p
                if h["status"] == "failed": raise RuntimeError(h.get("error"))
                time.sleep(2)
        except Exception as e: print("  retry", e, flush=True); time.sleep(3 * (k + 1))
    raise SystemExit("tts failed: " + text)

jobs = [(i, s, t) for i, l in enumerate(lines) if only is None or i in only for s in l["george"] for t in range(1, TAKES + 1)]
with ThreadPoolExecutor(3) as ex: files = dict(zip(jobs, ex.map(lambda j: tts(j[1], j[2]), jobs)))
print("generated", len(files), flush=True)

import torch
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
from faster_whisper import WhisperModel
FE = AutoFeatureExtractor.from_pretrained("IbrahimAmin/hubert-arabic-spoken-dialect-classifier"); CLF = AutoModelForAudioClassification.from_pretrained("IbrahimAmin/hubert-arabic-spoken-dialect-classifier").eval()
LAB = CLF.config.id2label; ASR = WhisperModel("medium", device="cpu", compute_type="int8")
def pcm16(p): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def dialect(a):
    with torch.no_grad(): pr = torch.softmax(CLF(**FE(a, sampling_rate=16000, return_tensors="pt")).logits, -1)[0].numpy()
    d = {LAB[i]: float(pr[i]) for i in range(len(pr))}
    return d["SYR"] + 0.5 * (d["LEB"] + d["PAL"] + d["JOR"]) - 0.5 * (d["KSA"] + d["UAE"] + d["KUW"] + d["QAT"] + d["OMA"]), d
def norm(s):  # qaf and hamza count as the same sound: the Damascene qaf IS a hamza
    s = re.sub(r"[ً-ْٰ]", "", s.lower())
    for a, b in [("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ء", "ا"), ("ئ", "ا"), ("ؤ", "ا"), ("ق", "ا"), ("ة", "ه"), ("ى", "ي")]: s = s.replace(a, b)
    return re.sub(r"[^ء-يa-z0-9 ]", "", s)
def match(a, text):
    segs, _ = ASR.transcribe(a, language="ar", beam_size=3); hyp = " ".join(s.text for s in segs)
    r, h = norm(text).split(), norm(hyp).split(); return difflib.SequenceMatcher(None, "".join(r), "".join(h)).ratio(), len(h) / max(1, len(r)), hyp

out_p = os.path.join(ROOT, "voice/takes_george.json"); res = json.load(open(out_p, encoding="utf8")) if os.path.exists(out_p) else {}
for i, l in enumerate(lines):
    if only is not None and i not in only: continue
    rows = []
    for s in l["george"]:
        for t in range(1, TAKES + 1):
            p = files[(i, s, t)]; a = pcm16(p); sc, d = dialect(a); sim, wr, hyp = match(a, s)
            rows.append({"file": os.path.relpath(p, ROOT), "say": s, "hamza": s != l["george"][0], "take": t, "syr": round(sc, 3), "SYR": round(d["SYR"], 3), "sim": round(sim, 2), "wr": round(wr, 2), "dur": round(len(a) / 16000, 2), "heard": hyp})
    # the owner's rule: in Damascene every qaf is a hamza, so a line that has the hamza spelling always uses it (consistent across lines)
    if any(r["hamza"] for r in rows): rows_all, rows = rows, [r for r in rows if r["hamza"]]
    else: rows_all = rows
    best = max(r["sim"] for r in rows); med = float(np.median([r["dur"] for r in rows]))
    ok = [r for r in rows if r["sim"] >= best - 0.1 and 0.7 <= r["wr"] <= 1.4 and r["dur"] <= med * 1.3] or rows
    pick = max(ok, key=lambda r: r["syr"]); res[str(i)] = {"text": l["text"], "pick": pick, "all": rows_all}
    print(f"{i + 1:2d} {'hamza' if pick['hamza'] else 'qaf  '} t{pick['take']} syr {pick['syr']:+.2f} sim {pick['sim']:.2f} | {pick['heard'][:60]}", flush=True)
    json.dump(res, open(out_p, "w", encoding="utf8"), ensure_ascii=False, indent=1)
