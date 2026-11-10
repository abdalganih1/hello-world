"""Sanity check of the generated voice, line by line (needs: pip install faster-whisper).
Flags lines whose pace is abnormal or whose Whisper transcript has clearly more/fewer words than the script
(eleven_v3 sometimes adds, drops or repeats words). To redo a flagged line: bump its "take" in script/script.json
and run tools/build_audio.py again. Whisper normalises dialect, so this does NOT judge pronunciation: only your ear can.
Usage: python3 tools/check_voice.py [whisper_model=small]"""
import difflib, hashlib, json, os, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "tools/build_audio.py"), encoding="utf8").read().split("def tts")[0].replace("__file__", repr(os.path.join(ROOT, "tools/x.py")))
ns = {}; exec(src, ns)
lines, say, key_of = ns["lines"], ns["say"], ns["key_of"]
m = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^ء-يa-zA-Z0-9 ]", "", re.sub(r"[ً-ْ]", "", s)).replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي").lower()
rows = []
for i, l in enumerate(lines):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", key_of(i), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(a, language="ar", beam_size=3); hyp = " ".join(s.text.strip() for s in segs)
    ref = norm(l["text"]); h = norm(hyp); nz = np.where(np.abs(a) > 0.01)[0]; dur = (nz[-1] - nz[0]) / 16000 if len(nz) else 0
    rows.append(dict(i=i + 1, rate=len(ref) / max(dur, 0.1), wr=len(h.split()) / max(1, len(ref.split())), sim=difflib.SequenceMatcher(None, ref, h).ratio(), dur=dur, ref=l["text"], hyp=hyp))
med = float(np.median([r["rate"] for r in rows])); bad = []
for r in rows:
    why = []
    if r["rate"] < med * 0.72: why.append("slow/extra audio")
    if r["rate"] > med * 1.35: why.append("too fast/cut")
    if r["wr"] > 1.45 or r["wr"] < 0.6: why.append(f"word count x{r['wr']:.2f}")
    if r["sim"] < 0.5: why.append(f"similarity {r['sim']:.2f}")
    if why: bad.append(r["i"]); print(f"!! {r['i']:03d} {', '.join(why)}  [{r['dur']:.1f}s]\n     script: {r['ref']}\n     heard : {r['hyp']}")
print(f"median pace {med:.1f} chars/s · flagged {len(bad)}/{len(rows)}: {bad}")
json.dump(rows, open(os.path.join(ROOT, "build/voice_check.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
