"""Review a rendered video the way a viewer sees it: a contact sheet of frames + an audio spectrogram.

Claude cannot watch or listen, so every render is checked with this before it is delivered.

Usage:
  python3 review.py VIDEO.mp4 --times 0.8,2.3,6.1 [--out DIR] [--width 300] [--timeline timeline.json]
  python3 review.py VIDEO.mp4 --every 1.5            # a frame every 1.5 s
Outputs (in --out, default: the scratchpad or ./review):
  sheet.jpg        frames side by side (rows of up to 7), each labelled with its time
  spectrogram.png  log-frequency spectrogram, with a line for every event in timeline.json (if given)
  levels.txt       RMS per second (catches silent gaps and clipping)
Needs: pip install imageio-ffmpeg numpy opencv-python-headless
"""
import argparse, json, os, subprocess, wave
import numpy as np
import cv2
import imageio_ffmpeg

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--times", default="")
ap.add_argument("--every", type=float, default=0)
ap.add_argument("--out", default="review")
ap.add_argument("--width", type=int, default=300)
ap.add_argument("--timeline", default="")
a = ap.parse_args()
FF = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs(a.out, exist_ok=True)

probe = subprocess.run([FF, "-i", a.video], capture_output=True, text=True).stderr
h, m, s = [x for x in probe.split("Duration: ")[1].split(",")[0].split(":")]
dur = int(h) * 3600 + int(m) * 60 + float(s)
print(probe[probe.find("Duration"):].split("\n")[0].strip())
for line in probe.splitlines():
    if "Stream #" in line:
        print(line.strip())
print(f"size: {os.path.getsize(a.video) / 1048576:.1f} MiB")

times = [float(x) for x in a.times.split(",") if x.strip()]
if a.every:
    times += list(np.arange(0, dur, a.every))
times = sorted(set(round(t, 3) for t in times if t < dur))

# ---- contact sheet
tiles = []
for t in times:
    raw = subprocess.run([FF, "-v", "error", "-ss", f"{t}", "-i", a.video, "-frames:v", "1", "-vf", f"scale={a.width}:-2",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        continue
    cv2.rectangle(img, (0, 0), (92, 26), (0, 0, 0), -1)
    cv2.putText(img, f"{t:.2f}s", (4, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    tiles.append(img)
if tiles:
    per = 7
    rows = []
    for i in range(0, len(tiles), per):
        row = tiles[i:i + per]
        while len(row) < per and len(tiles) > per:
            row.append(np.zeros_like(tiles[0]))
        rows.append(np.hstack(row))
    cv2.imwrite(os.path.join(a.out, "sheet.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print("wrote", os.path.join(a.out, "sheet.jpg"), f"({len(tiles)} frames)")

# ---- audio
wav = os.path.join(a.out, "_audio.wav")
r = subprocess.run([FF, "-v", "error", "-y", "-i", a.video, "-vn", "-ac", "1", "-ar", "44100", wav])
if r.returncode == 0 and os.path.exists(wav):
    w = wave.open(wav)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    os.remove(wav)
    with open(os.path.join(a.out, "levels.txt"), "w") as f:
        for sec in range(int(np.ceil(len(x) / sr))):
            seg = x[sec * sr:(sec + 1) * sr]
            rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
            pk = 20 * np.log10(np.max(np.abs(seg)) + 1e-9)
            f.write(f"{sec:3d}s  rms {rms:6.1f} dB  peak {pk:6.1f} dB\n")
    print(open(os.path.join(a.out, "levels.txt")).read().rstrip())
    hop, nfft = int(sr / 50), 2048
    S = np.array([np.abs(np.fft.rfft(x[i:i + nfft] * np.hanning(nfft))) for i in range(0, len(x) - nfft, hop)]).T
    S = np.clip((20 * np.log10(S + 1e-6) + 20) / 80, 0, 1)
    bins = np.unique(np.geomspace(2, nfft // 2, 320).astype(int))
    Wd = 2000
    img = cv2.applyColorMap(cv2.resize((S[bins][::-1] * 255).astype(np.uint8), (Wd, 360), interpolation=cv2.INTER_AREA), cv2.COLORMAP_INFERNO)
    marks = {}
    if a.timeline and os.path.exists(a.timeline):
        def walk(k, v):
            if isinstance(v, (int, float)) and k not in ("total", "fps", "bpm") and 0 < v < dur:
                marks[k] = v
            elif isinstance(v, list):
                for i, e in enumerate(v):
                    walk(f"{k}{i}", e)
            elif isinstance(v, dict):
                for kk, e in v.items():
                    walk(f"{k}.{kk}", e)
        for k, v in json.load(open(a.timeline)).items():
            walk(k, v)
    for i, (k, t) in enumerate(sorted(marks.items(), key=lambda kv: kv[1])):
        xx = int(t / dur * Wd)
        cv2.line(img, (xx, 0), (xx, 359), (255, 255, 255), 1)
        cv2.putText(img, k, (xx + 2, 12 + (i % 3) * 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    cv2.imwrite(os.path.join(a.out, "spectrogram.png"), img)
    print("wrote", os.path.join(a.out, "spectrogram.png"))
else:
    print("no audio stream")
