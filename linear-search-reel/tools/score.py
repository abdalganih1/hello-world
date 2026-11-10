"""Original music for the reel, no voice: a light, playful marimba groove (100 bpm, C-G-Am-F) whose density follows the scenes,
plus notes that play the algorithm itself: every card that opens sounds a higher note, a soft "bonk" for "not it",
a bright arpeggio + sparkle when it is found. Synthesized here with numpy/scipy, so it is royalty-free.
Usage: python3 tools/score.py events.json out.wav        (events.json comes from window.collectSfx())  -> -14 LUFS"""
import json, subprocess, sys, wave
import numpy as np
from scipy import signal

EV = json.load(open(sys.argv[1], encoding="utf8")); OUT = sys.argv[2]
SR = 44100; TOT = EV["total"]; N = int((TOT + 0.4) * SR); BPM = 100; BEAT = 60 / BPM; BAR = 4 * BEAT
SC = {s["name"]: s for s in EV["scenes"]}
rng = np.random.default_rng(3); L = np.zeros(N); R = np.zeros(N); RV = np.zeros(N)
tt = lambda d: np.arange(int(d * SR)) / SR; midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def env(d, a=0.004, r=0.05): n = int(d * SR); e = np.ones(n); a, r = max(1, min(n // 2, int(a * SR))), max(1, min(n // 2, int(r * SR))); e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e
def put(x, t, g=1.0, pan=0.0, rv=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0 or g == 0: return
    a = max(0, -i); i = max(0, i); j = min(N, i + len(x) - a); s = np.asarray(x[a:a + j - i]) * g; th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    L[i:j] += s * np.cos(th) * 1.4142; R[i:j] += s * np.sin(th) * 1.4142
    if rv: RV[i:j] += s * rv
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "lp", fs=SR, output="sos"), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "hp", fs=SR, output="sos"), x)
def bp(x, a, b): return signal.sosfilt(signal.butter(2, [a, b], "bp", fs=SR, output="sos"), x)
def noise(d): return rng.standard_normal(int(d * SR))

# ---------------- instruments
def marimba(m, d=0.6, bright=1.0):
    t = tt(d); f = midi(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 6.5) + 0.42 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)) * env(d, 0.002, 0.03)
def bell(m, d=1.6):
    t = tt(d); f = midi(m); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc) for r, a, dc in [(1, 1, 2.4), (2.76, 0.4, 4.5), (5.4, 0.2, 7), (8.9, 0.1, 10)]) * env(d, 0.002, 0.1)
def pluck(m, d=0.3, dec=12): t = tt(d); return lp(signal.sawtooth(2 * np.pi * midi(m) * t) * np.exp(-t * dec), 2800) * env(d, 0.002, 0.03)
def bass(m, d): t = tt(d); f = midi(m); return (np.sin(2 * np.pi * f * t) + 0.25 * lp(signal.sawtooth(2 * np.pi * f * t), 400)) * np.exp(-t * 2.4) * env(d, 0.006, 0.04)
def kick(): t = tt(0.28); return np.sin(2 * np.pi * np.cumsum(48 + 95 * np.exp(-t * 32)) / SR) * np.exp(-t * 12) * env(0.28, 0.001, 0.05)
def clap(): t = tt(0.2); n = bp(noise(0.2), 1000, 4200); return n * (np.exp(-t * 28) + 0.5 * sum(np.exp(-np.clip(t - d, 0, None) * 150) * (t >= d) for d in (0.0, 0.012, 0.024))) * 0.45
def shaker(acc=1.0): d = 0.07; return hp(noise(d), 6000) * np.exp(-tt(d) * 55) * acc
def rim(): t = tt(0.05); return (np.sin(2 * np.pi * 1800 * t) + 0.5 * np.sin(2 * np.pi * 900 * t)) * np.exp(-t * 95)
def pad(notes, d, cut=1500):
    t = tt(d); x = np.zeros(len(t))
    for m in notes:
        for det in (-0.005, 0.005): x += np.sin(2 * np.pi * midi(m) * (1 + det) * t + rng.uniform(0, 6)) + 0.3 * signal.sawtooth(2 * np.pi * midi(m) * (1 + det) * t)
    return lp(x, cut) / len(notes) * env(d, min(0.5, d / 3), min(0.7, d / 3))

CH = [("C", 48, [60, 64, 67]), ("G", 43, [55, 59, 62]), ("Am", 45, [57, 60, 64]), ("F", 41, [53, 57, 60])]
ARP = {"C": [72, 76, 79, 76, 84, 79, 76, 79], "G": [71, 74, 79, 74, 83, 79, 74, 79], "Am": [72, 76, 81, 76, 84, 81, 76, 81], "F": [72, 77, 81, 77, 84, 81, 77, 81]}
MEL = {"C": [(0, 84, 1), (1.5, 79, .5), (2, 81, 1), (3, 84, 1)], "G": [(0, 83, 1), (1.5, 79, .5), (2, 86, 1.5)], "Am": [(0, 84, 1), (1.5, 81, .5), (2, 88, 1), (3, 84, 1)], "F": [(0, 81, 1), (2, 84, 1), (3, 86, 1)]}

def level(t):  # how full the band is at time t (scene-driven)
    def sc(name): s = SC[name]; return s["t0"] <= t < s["t1"]
    if sc("hook"): return dict(mar=0.8, pad=0.9, shaker=1 if t > 1.6 else 0, kick=0.6 if t > 3.4 else 0, bass=0.6 if t > 3.4 else 0)
    if sc("intro") or sc("idea"): return dict(mar=1, pad=1, shaker=1, kick=0.9, clap=0.8, bass=1)
    if sc("demo"): return dict(mar=0.0, pad=1, shaker=0.8, kick=0.5, bass=0.6)          # the flips play the melody here
    if sc("name"): return dict(mar=1.1, pad=1, shaker=1, kick=1, clap=1, bass=1, mel=1)
    if sc("rule"): return dict(mar=0.8, pad=0.9, shaker=1, kick=0.8, clap=0.7, bass=0.9)
    if sc("code"): return dict(mar=0.5, pad=1, rim=1, kick=0.7, bass=0.8, lofi=1)       # lo-fi under the code
    if sc("speed"): return dict(mar=0.9, pad=1, shaker=1, kick=1, clap=0.9, bass=1)
    return dict(mar=0.6, pad=1, shaker=0.6, kick=0.5, bass=0.7, mel=0.7)                # teaser

nbars = int(np.ceil(TOT / BAR)) + 1
for b in range(nbars):
    tb = b * BAR; name, root, tri = CH[b % 4]
    for k in range(8):  # eighth notes
        t = tb + k * BEAT / 2; lv = level(t)
        if t >= TOT: break
        if lv.get("mar"):
            x = marimba(ARP[name][k], 0.45); x = lp(x, 1600) if lv.get("lofi") else x
            put(x, t + (0.01 if k % 2 else 0), (0.2 if k % 2 == 0 else 0.13) * lv["mar"], 0.45 * np.sin(k * 1.7), 0.3)
        if lv.get("shaker"): put(shaker(1 if k % 2 else 0.55), t, 0.12 * lv["shaker"], 0.4)
        if k % 2 == 0:
            beat = k // 2
            if lv.get("kick") and beat in (0, 2): put(kick(), t, 0.7 * lv["kick"])
            if lv.get("clap") and beat in (1, 3): put(clap(), t, 0.35 * lv["clap"], -0.1, 0.25)
            if lv.get("rim") and beat in (1, 3): put(rim(), t, 0.25 * lv["rim"], 0.2, 0.2)
    lv = level(tb)
    if lv.get("pad"): put(pad([m + 12 for m in tri], BAR + 0.3, 1200 if lv.get("lofi") else 1700), tb, 0.12 * lv["pad"], 0, 0.5)
    if lv.get("bass"):
        for off, m, d in [(0, root, 1.4), (1.5, root + 12, 0.4), (2, root, 0.9), (3, root + 7, 0.5), (3.5, root + 12, 0.4)]: put(bass(m, d * BEAT), tb + off * BEAT, 0.42 * lv["bass"])
    if lv.get("mel"):
        for off, m, d in MEL[name]: put(bell(m, 0.8 * d + 0.6), tb + off * BEAT, 0.17 * lv["mel"], -0.15, 0.6)

# ---------------- the picture's events play notes
PENT = [72, 74, 76, 79, 81, 84, 86, 88]
def whoosh(d=0.38): t = tt(d); return (bp(noise(d), 700, 5200) * 0.55 + np.sin(2 * np.pi * np.cumsum(np.geomspace(500, 3000, len(t))) / SR) * 0.08) * np.sin(np.pi * t / d) ** 2
def bonk(): t = tt(0.3); f = midi(55); return (np.sin(2 * np.pi * np.cumsum(f * (1 - 0.3 * np.clip(t / 0.25, 0, 1))) / SR)) * np.exp(-t * 13) * env(0.3, 0.002, 0.05)
def chord_arp(notes, step=0.05, d=1.4): out = np.zeros(int((d + step * len(notes)) * SR)); [out.__setitem__(slice(int(i * step * SR), int(i * step * SR) + int(d * SR)), out[int(i * step * SR):int(i * step * SR) + int(d * SR)] + bell(m, d)) for i, m in enumerate(notes)]; return out
def riser(d): t = tt(d); return (bp(noise(d), 900, 7000) * 0.5 + np.sin(2 * np.pi * np.cumsum(np.geomspace(220, 1320, len(t))) / SR) * 0.25) * (t / d) ** 2 * env(d, 0.05, 0.02)
def sparkle(): out = np.zeros(int(1.0 * SR)); [out.__setitem__(slice(int(i * 0.045 * SR), int(i * 0.045 * SR) + int(0.4 * SR)), out[int(i * 0.045 * SR):int(i * 0.045 * SR) + int(0.4 * SR)] + np.sin(2 * np.pi * midi(96 + (i * 5) % 12) * tt(0.4)) * np.exp(-tt(0.4) * 14) * 0.3) for i in range(12)]; return out
flips = 0
for e in EV["events"]:
    t, k, v = e["t"], e["k"], int(e.get("v", 0))
    if k == "pop": put(marimba(88, 0.3), t, 0.28, 0.2, 0.3)
    elif k == "card": put(marimba(60 + 2 * v, 0.18), t, 0.16, -0.6 + 0.2 * v, 0.1); put(shaker(), t, 0.1)
    elif k == "drop": put(marimba(55, 0.8), t, 0.5, 0, 0.4); put(kick(), t, 0.5)
    elif k == "swish": put(whoosh(), t - 0.05, 0.32 if v != 9 else 0.22, 0.3 * np.sin(t), 0.25)
    elif k == "tick": put(marimba(PENT[v % 8], 0.4, 1.3), t, 0.32, -0.6 + 0.2 * (v % 7), 0.35)
    elif k == "flip": put(marimba(PENT[min(v, 7)], 0.9, 1.4), t, 0.55, 0, 0.45); put(marimba(PENT[min(v, 7)] - 12, 0.9), t, 0.3, 0, 0.4)
    elif k == "no": put(bonk(), t, 0.45, 0, 0.2); put(rim(), t, 0.25)
    elif k == "found":
        g = 1.0 if v in (4, 9) else 0.7
        put(chord_arp([72, 76, 79, 84, 88]), t, 0.32 * g, 0, 0.7); put(sparkle(), t + 0.05, 0.35 * g, 0.3, 0.6); put(kick(), t, 0.7 * g); put(bass(36, 1.2), t, 0.5 * g)
    elif k == "rise": put(riser(1.2), t - 0.3, 0.4, 0, 0.3)

# a tiny breath right before the find, so it lands
fnd = [e["t"] for e in EV["events"] if e["k"] == "found" and int(e.get("v", 0)) == 4]
gate = np.ones(N)
for f in fnd: a, b = int((f - 0.12) * SR), int((f - 0.005) * SR); gate[a:b] = 0.25
gate = lp(gate, 50, 1)

ir_n = int(1.8 * SR); ir = rng.standard_normal((2, ir_n)) * np.exp(-np.arange(ir_n) / SR * 3.6); ir = np.stack([hp(lp(c, 6000), 250) for c in ir])
wet = [signal.fftconvolve(RV, ir[c])[:N] * 0.045 for c in range(2)]
mix = hp(np.stack([(L + wet[0]) * gate, (R + wet[1]) * gate]), 30)
mix = np.tanh(mix / (np.percentile(np.abs(mix), 99.9) + 1e-9) * 1.1) * 0.9
fade = np.clip(np.arange(N) / (0.03 * SR), 0, 1) * np.clip((TOT - np.arange(N) / SR) / 0.8, 0, 1); mix *= fade
tmp = OUT + ".raw.wav"
with wave.open(tmp, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype(np.int16).tobytes())
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"):m.rfind("}") + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), OUT], check=True); print("soundtrack", OUT)
