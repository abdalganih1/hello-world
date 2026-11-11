"""Generate every line of a narration with George (vibi.pro, eleven_v4) and pick, per line, the cleanest take.

Input  script.json: {"lines": [{"id": "hook", "say": ["<fully diacritized spelling>", "<alternative spelling>", ...]}, ...]}
       (a plain string for "say" is fine too). Lines with "dur" instead of "say" are silences and are skipped.
Output <out>/takes.json: {"<id>": {"pick": {...}, "all": [...]}} and the mp3s in <out>/clips/ (cached by text, so re-runs are free).

Check: faster-whisper (medium, Arabic) transcribes every take; the take whose transcript matches the written line best wins
(ties: word count closest to the script). Whisper cannot judge the accent, only dropped / added / garbled words: listen to the
lines it flags (sim < 0.9). Without faster-whisper installed the first spelling is used as is.
George is deterministic for a given text: a second "take" of the same text is the same audio, so vary the SPELLING, not the seed.

Usage: VIBI_API_KEY=sk_... python3 george_voice.py script.json out_dir [--lines hook,idea] [--threads 3]"""
import difflib, hashlib, json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vibi_tts import tts, GEORGE, MODEL, SETTINGS

src, out = sys.argv[1], sys.argv[2]
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
only = set(arg("--lines").split(",")) if arg("--lines") else None
lines = [l for l in json.load(open(src, encoding="utf8"))["lines"] if "dur" not in l]
for n, l in enumerate(lines): l.setdefault("id", str(n)); l["say"] = [l["say"]] if isinstance(l["say"], str) else l["say"]
clips = os.path.join(out, "clips"); os.makedirs(clips, exist_ok=True)
path = lambda s: os.path.join(clips, hashlib.sha1(json.dumps([s, MODEL, GEORGE, SETTINGS], ensure_ascii=False).encode()).hexdigest()[:12] + ".mp3")
jobs = [s for l in lines if only is None or l["id"] in only for s in l["say"]]
with ThreadPoolExecutor(int(arg("--threads", 3))) as ex: list(ex.map(lambda s: os.path.exists(path(s)) or tts(s, path(s)), jobs))
print("generated", len(jobs), flush=True)

try:
    from faster_whisper import WhisperModel; ASR = WhisperModel("medium", device="cpu", compute_type="int8")
except Exception: ASR = None; print("faster-whisper not installed: using the first spelling of every line")
def norm(s):
    s = re.sub(r"[ً-ْٰ]", "", s.lower())
    for a, b in [("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ة", "ه"), ("ى", "ي"), ("ـ", "")]: s = s.replace(a, b)
    return re.sub(r"[^ء-يa-z0-9 ]", "", s)
def pcm16(p):  # decode with ffmpeg (faster-whisper's own decoder breaks on some PyAV versions)
    import numpy as np
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def check(p, text):
    segs, _ = ASR.transcribe(pcm16(p), language="ar", beam_size=3); hyp = " ".join(x.text for x in segs).strip()
    r, h = norm(text).split(), norm(hyp).split()
    return round(difflib.SequenceMatcher(None, "".join(r), "".join(h)).ratio(), 2), round(len(h) / max(1, len(r)), 2), hyp
dur = lambda p: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout or 0)

res_p = os.path.join(out, "takes.json"); res = json.load(open(res_p, encoding="utf8")) if os.path.exists(res_p) else {}
for l in lines:
    if only is not None and l["id"] not in only: continue
    rows = []
    for s in l["say"]:
        p = path(s); row = {"file": os.path.relpath(p, out), "say": s, "dur": round(dur(p), 2)}
        if ASR: row["sim"], row["wr"], row["heard"] = check(p, s)
        rows.append(row)
    pick = max(rows, key=lambda r: (r.get("sim", 0), -abs(r.get("wr", 1) - 1))) if ASR else rows[0]
    res[l["id"]] = {"pick": pick, "all": rows}
    flag = "  <- listen" if ASR and pick["sim"] < 0.9 else ""
    print(f"{l['id']:>10}  sim {pick.get('sim', '-')}  {pick['dur']:.1f}s | {pick.get('heard', pick['say'])[:70]}{flag}", flush=True)
    json.dump(res, open(res_p, "w", encoding="utf8"), ensure_ascii=False, indent=1)
