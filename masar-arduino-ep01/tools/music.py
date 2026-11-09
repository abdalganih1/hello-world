"""Original soundtrack: calm synthesized pad + soft arpeggio + synced SFX, ducked under the voice, normalised to -14 LUFS.

Reads timeline.json + build/voice.wav, writes build/soundtrack.wav (stereo 44.1 kHz). No samples, no downloads: no rights issues.
Usage: python3 tools/music.py
"""
import json, os, subprocess, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
tl = json.load(open(os.path.join(ROOT, "timeline.json"), encoding="utf8"))
TOT = tl["total"]; N = int(TOT * SR) + SR
t_all = np.arange(N) / SR

with wave.open(os.path.join(ROOT, "build/voice.wav")) as w:
    voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice = sosfilt(butter(2, 80, "hp", fs=SR, output="sos"), voice)

midi = lambda m: 440 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(7)

# ---------------- pad: Am - F - C - G (and a brighter Fmaj7 - G - Am - Em at the puzzle/ending)
CH = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
BAR = 4.8
music = np.zeros((N, 2), np.float32)
def env_seg(n, a, r):
    e = np.ones(n, np.float32); a, r = int(a * SR), int(r * SR)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2; e[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2; return e
k = 0; t0 = 0.0
while t0 < TOT:
    notes = CH[k % 4]; a0 = int(t0 * SR); n = int((BAR + 1.2) * SR); n = min(n, N - a0)
    if n <= 0: break
    tt = np.arange(n) / SR; seg = np.zeros((n, 2), np.float32)
    for j, m in enumerate(notes):
        f = midi(m)
        for d, pan in ((-0.0035, 0.25), (0.0035, 0.75)):
            ph = rng.uniform(0, 2 * np.pi); x = np.zeros(n, np.float32)
            for h in range(1, 6):
                x += (1 / h ** 1.6) * np.sin(2 * np.pi * f * (1 + d) * h * tt + ph * h)
            x *= 0.75 + 0.25 * np.sin(2 * np.pi * (0.13 + 0.03 * j) * tt + ph)
            seg[:, 0] += x * (1 - pan); seg[:, 1] += x * pan
    bass = 0.9 * np.sin(2 * np.pi * midi(notes[0] - 12) * tt) + 0.2 * np.sin(2 * np.pi * midi(notes[0] - 12) * 2 * tt)
    seg += bass[:, None] * 0.5
    seg *= env_seg(n, 1.1, 1.3)[:, None]
    music[a0:a0 + n] += seg * 0.032
    # soft arpeggio plucks on 8ths of a 100 bpm feel
    step = 0.6
    for i in range(int(BAR / step)):
        st = a0 + int(i * step * SR); m = notes[[0, 2, 1, 3, 2, 1, 3, 2][i % 8]] + 12
        L = int(0.9 * SR)
        if st + L >= N: break
        x = np.sin(2 * np.pi * midi(m) * np.arange(L) / SR) * np.exp(-np.arange(L) / SR * 5.5)
        x += 0.3 * np.sin(2 * np.pi * midi(m) * 2 * np.arange(L) / SR) * np.exp(-np.arange(L) / SR * 9)
        pan = 0.3 if i % 2 else 0.7
        music[st:st + L, 0] += x * 0.014 * (1 - pan); music[st:st + L, 1] += x * 0.014 * pan
    t0 += BAR; k += 1
music = sosfilt(butter(2, 3800, "lp", fs=SR, output="sos"), music, axis=0).astype(np.float32)

# ---------------- SFX
def add(x, at, g=1.0, pan=0.5, buf=None):
    buf = sfx if buf is None else buf
    a = int(at * SR); b = min(N, a + len(x));
    if a >= N or a < 0: return
    buf[a:b, 0] += x[:b - a] * g * (1 - pan) * 2 ** 0.5 * 0.7; buf[a:b, 1] += x[:b - a] * g * pan * 2 ** 0.5 * 0.7
def tone(f, d, dec=8.0, h2=0.0):
    tt = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * f * tt) + h2 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * dec)
def noise(d, lo, hi, shape):
    x = rng.standard_normal(int(d * SR)); x = sosfilt(butter(2, [lo, hi], "bp", fs=SR, output="sos"), x); return x * shape(np.linspace(0, 1, len(x)))
def sweep(f0, f1, d, dec=3):
    tt = np.arange(int(d * SR)) / SR; f = np.geomspace(f0, f1, len(tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * dec)
def mx(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
S = {
    "pop": lambda: mx(tone(880, 0.25, 22) * 0.5, sweep(500, 1200, 0.08, 30) * 0.3),
    "ding": lambda: mx(tone(1318.5, 1.2, 4.5, 0.25) * 0.4, tone(1975.5, 0.8, 6) * 0.15),
    "click": lambda: noise(0.04, 2000, 6000, lambda u: np.exp(-u * 8)) * 0.8,
    "whoosh": lambda: noise(0.7, 400, 4000, lambda u: np.sin(np.pi * u) ** 2) * 0.55,
    "hit": lambda: mx(tone(55, 1.2, 3.5) * 0.9, noise(0.25, 80, 600, lambda u: np.exp(-u * 6)) * 0.4, tone(220, 0.8, 5) * 0.2),
    "rise": lambda: mx(sweep(200, 1200, 1.0, 0) * np.linspace(0, 1, int(SR)) ** 2 * 0.18, noise(1.0, 1000, 6000, lambda u: u ** 2) * 0.2),
    "zap": lambda: sweep(1800, 300, 0.25, 10) * 0.35,
    "beep": lambda: np.concatenate([tone(1600, 0.12, 2) * 0.3, np.zeros(int(0.05 * SR)), tone(1600, 0.12, 2) * 0.3]),
    "servo": lambda: (np.sign(np.sin(2 * np.pi * 140 * np.arange(int(0.6 * SR)) / SR)) * 0.06 * np.sin(np.linspace(0, np.pi, int(0.6 * SR)))),
    "drop": lambda: sweep(1400, 500, 0.18, 14) * 0.4,
    "type": lambda: sum(np.pad(noise(0.03, 2500, 7000, lambda u: np.exp(-u * 9)) * 0.5, (int(i * 0.11 * SR), int((12 - i) * 0.11 * SR))) for i in range(12)),
    "tick": lambda: mx(noise(0.03, 3000, 8000, lambda u: np.exp(-u * 10)) * 0.9, tone(2400, 0.05, 40) * 0.3),
    "win": lambda: sum(np.pad(tone(midi(m), 1.2, 3.2, 0.2) * 0.25, (int(i * 0.09 * SR), int((4 - i) * 0.09 * SR))) for i, m in enumerate([72, 76, 79, 84, 88])),
    "coin": lambda: np.concatenate([tone(988, 0.08, 5) * 0.35, tone(1319, 0.5, 6) * 0.35]),
}
sfx = np.zeros((N, 2), np.float32)
for i, l in enumerate(tl["lines"]):
    if l.get("sfx") in S: add(S[l["sfx"]](), max(0, l["t0"] - 0.05), 0.4, 0.35 + 0.3 * ((i * 7) % 5) / 4)
    if l.get("count"):
        c = l["count"]
        for j in range(c["n"]): add(S["tick"](), c["t0"] + j, 0.9, 0.5); add(tone(880 if j < c["n"] - 1 else 1320, 0.2, 12) * 0.25, c["t0"] + j, 0.8)
for s in tl["scenes"][1:]: add(S["whoosh"](), s["t0"] - 0.35, 0.5, 0.5)
add(S["win"](), tl["lines"][-1]["t0"] + 0.1, 0.6)

# reverb (generated impulse response)
L = int(2.4 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR * 2.6)[:, None]; ir[0] = 1
wet = np.stack([fftconvolve(music[:, c] + sfx[:, c] * 0.4, ir[:, c])[:N] for c in range(2)], 1) * 0.025
bed = music + wet

# ducking under the voice
env = np.abs(voice); win = int(0.03 * SR); env = np.convolve(env, np.ones(win) / win, "same")
env = np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
duck = np.zeros_like(env); g = 0.0; att, rel = np.exp(-1 / (0.05 * SR)), np.exp(-1 / (0.6 * SR))
for i in range(0, N, 64):  # control-rate smoothing
    target = env[i]; c = att if target > g else rel; g = c * g + (1 - c) * target; duck[i:i + 64] = g
gain = (1 - 0.35 * duck)
# intro: music a bit louder before the first word; outro swell
gain *= 1 + 0.4 * np.clip(1 - t_all / 0.9, 0, 1)
fade = np.clip(t_all / 0.6, 0, 1) * np.clip((TOT - t_all) / 1.2, 0, 1)
mix = (bed * gain[:, None] + sfx) * fade[:, None] * 0.9 + voice[:, None] * 0.9
mix = np.tanh(mix * 1.1) / 1.1

tmp = os.path.join(ROOT, "build/mix_raw.wav")
with wave.open(tmp, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
out = os.path.join(ROOT, "build/soundtrack.wav")
# two-pass loudness normalisation to YouTube's ~ -14 LUFS, true peak -1.5 dBTP
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"):m.rfind("}") + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), out], check=True)
print("soundtrack:", out, "input LUFS", js["input_i"])
