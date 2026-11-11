"""Lay the picked George takes end to end: one voice track + the timeline the picture is keyed to.

Reads script.json (same file as george_voice.py; optional per line: "scene", "pause" = extra silence after it in seconds,
"squeeze" = max pause inside the line, "dur" = a silent line of that length) and <out>/takes.json.
Writes <out>/voice.wav (mono 44.1 kHz, peak -1.5 dBFS) and <out>/timeline.json:
  {"total", "scenes": [{name, t0, t1}], "lines": [{id, scene, say, t0, t1, segs}], "env": [30 fps voice envelope]}
  say  = the spoken text without diacritics (look words up in it to time an animation to a word)
  segs = start of every voiced phrase inside the line (pauses > 0.15 s split them)
Pacing that worked on the Bubble Sort reel (59 s, 14 lines): TEMPO 1.12, SQUEEZE 0.22 s, gaps 0.15 s / 0.35 s between scenes.
Usage: python3 assemble.py script.json out_dir [--tempo 1.12] [--squeeze 0.22]"""
import json, os, re, subprocess, sys, wave
import numpy as np
src, out = sys.argv[1], sys.argv[2]
arg = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
SR, TEMPO, SQ = 44100, arg("--tempo", 1.12), arg("--squeeze", 0.22)
LEAD, GAP, SCENE_GAP, TAIL = 0.25, 0.15, 0.35, 0.2
lines = json.load(open(src, encoding="utf8"))["lines"]; takes = json.load(open(os.path.join(out, "takes.json"), encoding="utf8"))
for n, l in enumerate(lines): l.setdefault("id", str(n)); l.setdefault("scene", l["id"])

def decode(p):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-af", f"atempo={TEMPO}", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).copy()
def trim(x):
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same"); on = np.where(env > 10 ** (-40 / 20))[0]
    if not len(on): return x
    y = x[max(0, on[0] - int(0.02 * SR)):on[-1] + int(0.06 * SR)].copy(); f = int(0.008 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
def squeeze(x, mx):
    e = np.convolve(np.abs(x), np.ones(441) / 441, "same") > 10 ** (-40 / 20); res, i, n, keep = [], 0, len(x), int(mx * SR)
    while i < n:
        j = i
        while j < n and e[j] == e[i]: j += 1
        res.append(x[i:j] if e[i] or j - i <= keep else np.concatenate([x[i:i + keep // 2], x[j - keep // 2:j]])); i = j
    return np.concatenate(res)
def onsets(x):
    e = np.sqrt(np.convolve(x * x, np.ones(882) / 882, "same")); on = e > 0.02; res, last_off, st = [], -1e9, None
    for i in range(0, len(on), 220):
        if on[i] and st is None:
            if i - last_off > 0.15 * SR or not res: res.append(i / SR)
            st = i
        elif not on[i] and st is not None: last_off, st = i, None
    return res

clips = []
for l in lines:
    if "dur" in l: clips.append(np.zeros(int(l["dur"] * SR), np.float32)); continue
    x = trim(decode(os.path.join(out, takes[l["id"]]["pick"]["file"]))); sq = l.get("squeeze", SQ)
    clips.append(squeeze(x, sq) if sq else x)
t, rows, scenes = (0.0 if "dur" in lines[0] else LEAD), [], []
for i, (l, c) in enumerate(zip(lines, clips)):
    if i and l["scene"] != lines[i - 1]["scene"]: t += SCENE_GAP - GAP
    if not scenes or scenes[-1]["name"] != l["scene"]:
        if scenes: scenes[-1]["t1"] = round(t - 0.12, 3)
        scenes.append({"name": l["scene"], "t0": round(max(0, t - 0.12), 3)})
    d = len(c) / SR; said = "" if "dur" in l else re.sub(r"[ً-ْ]", "", takes[l["id"]]["pick"]["say"])
    rows.append({"id": l["id"], "scene": l["scene"], "say": said, "t0": round(t, 3), "t1": round(t + d, 3), "segs": [round(t + s, 3) for s in (onsets(c) if said else [0.0])]})
    t += d + GAP + l.get("pause", 0)
total = round(t - GAP + TAIL, 3); scenes[0]["t0"] = 0.0; scenes[-1]["t1"] = total
v = np.zeros(int(total * SR) + SR, np.float32)
for r, c in zip(rows, clips): a = int(r["t0"] * SR); v[a:a + len(c)] += c
v = v / (np.abs(v).max() + 1e-9) * 10 ** (-1.5 / 20)
with wave.open(os.path.join(out, "voice.wav"), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes())
fr = SR // 30; nf = int(total * 30) + 1; env = np.array([np.sqrt(np.mean(v[i * fr:(i + 1) * fr] ** 2)) if i * fr < len(v) else 0 for i in range(nf)])
env = np.clip(env / (np.percentile(env[env > 1e-3], 92) + 1e-9), 0, 1.2); sm = np.zeros_like(env); g = 0.0
for i, x in enumerate(env): g = x if x > g else g * 0.55 + x * 0.45; sm[i] = g
json.dump({"total": total, "scenes": scenes, "lines": rows, "env": [round(float(x), 3) for x in sm]}, open(os.path.join(out, "timeline.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{len(rows)} lines, total {total:.1f}s" + ("   (over 60 s: raise --tempo to 1.15-1.2 or shorten the text)" if total > 60 else ""))
