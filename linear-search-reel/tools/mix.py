"""Sound: خوارزمو's voice up front, a quiet warm pad underneath (ducked while he speaks), soft UI sounds on the picture's events.
Usage: python3 tools/mix.py events.json voice.wav out.wav      -> -14 LUFS, true peak -1.5 dB"""
import json, subprocess, sys, wave
import numpy as np
from scipy import signal
EV = json.load(open(sys.argv[1], encoding="utf8")); SR = 44100; TOT = EV["total"]; N = int((TOT + 0.3) * SR)
with wave.open(sys.argv[2]) as w: voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]; voice = signal.sosfilt(signal.butter(2, 85, "hp", fs=SR, output="sos"), voice)
rng = np.random.default_rng(5); tt = lambda d: np.arange(int(d * SR)) / SR; midi = lambda m: 440 * 2 ** ((m - 69) / 12)
L = np.zeros(N); R = np.zeros(N)
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR); j = min(N, i + len(x)); th = (pan + 1) * np.pi / 4
    if i < N: L[i:j] += x[:j - i] * g * np.cos(th) * 1.414; R[i:j] += x[:j - i] * g * np.sin(th) * 1.414
def lp(x, f): return signal.sosfilt(signal.butter(2, f, "lp", fs=SR, output="sos"), x)
def env(n, a, r): e = np.ones(n); a, r = max(1, min(n // 2, int(a * SR))), max(1, min(n // 2, int(r * SR))); e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e
# pad: C - Am - F - G, 4 s each, soft and low-passed
CH = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]; bed = np.zeros(N); k = 0; t0 = 0.0
while t0 < TOT:
    d = min(4.6, TOT - t0 + 0.3); x = tt(d); s = np.zeros(len(x))
    for m in CH[k % 4]:
        for det in (-0.004, 0.004): s += np.sin(2 * np.pi * midi(m) * (1 + det) * x + rng.uniform(0, 6)) + 0.25 * np.sin(4 * np.pi * midi(m) * (1 + det) * x)
    s += 0.8 * np.sin(2 * np.pi * midi(CH[k % 4][0] - 24) * x); s *= env(len(x), 1.0, 1.2)
    i = int(t0 * SR); j = min(N, i + len(s)); bed[i:j] += s[:j - i]; t0 += 4.0; k += 1
bed = lp(bed, 1600) * 0.012
# soft UI sounds
def pluck(m, d=0.35, dec=9): x = tt(d); return (np.sin(2 * np.pi * midi(m) * x) + 0.3 * np.sin(4 * np.pi * midi(m) * x)) * np.exp(-x * dec) * env(len(x), 0.003, 0.03)
def noise(d, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], "bp", fs=SR, output="sos"), rng.standard_normal(int(d * SR)))
def swish(d=0.32): x = tt(d); return noise(d, 600, 5000) * np.sin(np.pi * x / d) ** 2 * 0.5
SFX = {"hit": lambda v: sum(np.pad(pluck(m, 1.2, 3.5), (int(i * 0.03 * SR), int(0.12 * SR) - int(i * 0.03 * SR))) for i, m in enumerate([72, 79, 84, 88])) * 0.6, "pop": lambda v: pluck(84, 0.25, 16) * 0.5, "card": lambda v: noise(0.12, 900, 4000) * np.exp(-tt(0.12) * 30) * 0.5, "drop": lambda v: pluck(55, 0.4, 10),
       "swish": lambda v: swish(), "flip": lambda v: noise(0.07, 1500, 6000) * np.exp(-tt(0.07) * 50) * 0.6, "tick": lambda v: pluck(76 + 2 * (v % 5), 0.2, 18) * 0.5,
       "no": lambda v: pluck(52, 0.25, 14) * 0.7, "found": lambda v: sum(np.pad(pluck(m, 1.0, 4), (int(i * 0.06 * SR), int(0.3 * SR) - int(i * 0.06 * SR))) for i, m in enumerate([72, 76, 79, 84])) * 0.45,
       "rise": lambda v: np.sin(2 * np.pi * np.cumsum(np.geomspace(300, 1200, int(0.9 * SR))) / SR) * np.linspace(0, 1, int(0.9 * SR)) ** 2 * 0.12}
for e in EV["events"]:
    if e["k"] in SFX: put(SFX[e["k"]](int(e["v"])), e["t"], 0.16, 0.25 * np.sin(e["t"] * 3))
# duck the bed under the voice
envv = lp(np.abs(voice), 8); envv = np.clip(envv / (np.percentile(envv, 95) + 1e-9), 0, 1); bedg = bed * (1 - 0.6 * envv)
mix = np.stack([voice + bedg + L, voice + bedg + R]); mix *= np.clip(np.arange(N) / (0.02 * SR), 0, 1) * np.clip((TOT - np.arange(N) / SR) / 0.5, 0, 1)
tmp = sys.argv[3] + ".raw.wav"
with wave.open(tmp, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix.T / (np.abs(mix).max() + 1e-9) * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"):m.rfind("}") + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), sys.argv[3]], check=True); print("soundtrack", sys.argv[3])
