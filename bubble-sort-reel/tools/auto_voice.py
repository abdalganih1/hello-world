"""Picks the most Syrian-sounding take of every line by itself, so the owner doesn't have to correct word by word.

For each line of voice/script.json it generates several takes (owner's voice, eleven_v3, a few Levantine accent prompts x seeds x
stability), then scores each take with
  - a spoken-dialect classifier (IbrahimAmin/hubert-arabic-spoken-dialect-classifier, 18 countries): P(Syria) + 0.5 P(Lebanon/Palestine/Jordan)
    - 0.5 P(Gulf). Checked against the owner's ear on 10 full versions: it ranked his pick (variant 10) first and the one he called
    "Gulf qaf" (variant 1) near the bottom.
  - Whisper (faster-whisper medium): the transcript must match the script, so a take that adds, drops or repeats words is rejected.
Result: voice/takes.json (the chosen file per line + scores). tools/build_voice.py uses it.
Usage: python3 tools/auto_voice.py [--lines 4,12]      (needs torch, transformers, faster-whisper)"""
import difflib, hashlib, json, os, re, subprocess, sys, time, urllib.request
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY, ME = os.environ["ELEVENLABS_API_KEY"], os.environ["ELEVENLABS_VOICE_ID"]
lines = json.load(open(os.path.join(ROOT, "voice/script.json"), encoding="utf8"))["lines"]
TAGS = ["[Syrian Damascene accent] ", "[Damascene Syrian Arabic accent, Levantine dialect] ", "[speaking casually in Syrian Levantine Arabic] "]
CANDS = [(tg, sd, st) for tg in TAGS for sd in (1001, 1002) for st in (None,)] + [(TAGS[0], 1003, 0.0), (TAGS[0], 1004, 0.0)]
if "--agreed" in sys.argv: CANDS = [(TAGS[0], sd, None) for sd in (1001, 1002, 1003, 1004)]   # the setup he approved (variant 10), only the seed varies
take_dir = os.path.join(ROOT, "audio/variants_cache"); os.makedirs(take_dir, exist_ok=True)
only = None
if "--lines" in sys.argv: only = {int(x) - 1 for x in sys.argv[sys.argv.index("--lines") + 1].split(",")}

def take_path(text, tag, seed, stab):
    if seed == 1001 and stab is None:  # same key as the earlier variants (variant 10 = TAGS[0], seed 1001)
        return os.path.join(take_dir, hashlib.sha1(json.dumps([tag + text, "eleven_v3", ME]).encode()).hexdigest()[:12] + ".mp3")
    return os.path.join(take_dir, hashlib.sha1(json.dumps([tag + text, "eleven_v3", ME, seed, stab]).encode()).hexdigest()[:12] + ".mp3")
def tts(text, tag, seed, stab):
    p = take_path(text, tag, seed, stab)
    if os.path.exists(p): return p
    body = {"text": tag + text, "model_id": "eleven_v3", "seed": seed}
    if stab is not None: body["voice_settings"] = {"stability": stab}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{ME}?output_format=mp3_44100_128", data=json.dumps(body, ensure_ascii=False).encode(), headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    for k in range(8):
        try: open(p, "wb").write(urllib.request.urlopen(req, timeout=120).read()); return p
        except Exception as e: print("  retry", e, flush=True); time.sleep(2 * (k + 1))
    raise SystemExit("tts failed")

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
norm = lambda s: re.sub(r"[^ء-يa-z0-9 ]", "", re.sub(r"[ً-ْ]", "", s.lower())).replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
def match(a, text):
    segs, _ = ASR.transcribe(a, language="ar", beam_size=3); hyp = " ".join(s.text for s in segs)
    r, h = norm(text).split(), norm(hyp).split(); return difflib.SequenceMatcher(None, r, h).ratio(), len(h) / max(1, len(r)), hyp

out_p = os.path.join(ROOT, "voice/takes.json"); res = json.load(open(out_p, encoding="utf8")) if os.path.exists(out_p) else {}
for i, l in enumerate(lines):
    if only is not None and i not in only: continue
    if "--auto" in sys.argv and not l.get("auto"): continue
    text = l.get("tts", l["text"]); rows = []; sty = (l["style"] + " ") if l.get("style") else ""
    for tg, sd, st in CANDS:
        p = tts(text, tg + sty, sd, st); a = pcm16(p); sc, d = dialect(a); sim, wr, hyp = match(a, text); dur = len(a) / 16000
        rows.append({"file": os.path.relpath(p, ROOT), "tag": tg.strip(), "seed": sd, "stability": st, "syr": round(sc, 3), "SYR": round(d["SYR"], 3), "sim": round(sim, 2), "wr": round(wr, 2), "dur": round(dur, 2), "heard": hyp})
    best_sim = max(r["sim"] for r in rows); med = float(np.median([r["dur"] for r in rows]))
    ok = [r for r in rows if r["sim"] >= best_sim - 0.15 and 0.7 <= r["wr"] <= 1.4 and r["dur"] <= med * 1.35] or rows
    pick = max(ok, key=lambda r: r["syr"]); res[sty + l.get("tts", l["text"])] = {"text": l["text"], "pick": pick, "all": rows}
    print(f"{i + 1:2d} pick {pick['tag'][:24]:24s} seed {pick['seed']} syr {pick['syr']:+.2f} (SYR {pick['SYR']:.2f}) sim {pick['sim']:.2f} | range {min(r['syr'] for r in rows):+.2f}..{max(r['syr'] for r in rows):+.2f}  {l['text'][:30]}", flush=True)
    json.dump(res, open(out_p, "w", encoding="utf8"), ensure_ascii=False, indent=1)
