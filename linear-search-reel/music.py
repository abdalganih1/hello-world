"""Original soundtrack for the Linear Search reel, synthesized from scratch (numpy/scipy) and locked to the picture.

Usage: python3 music.py <events.json> <out.wav>     (events.json comes from window.collectSfx() in js/scenes.js)
A playful marimba/music-box tune at 112 bpm; during the search the sounds follow the algorithm itself:
a rising note for every box opened, a soft "bonk" for every mismatch, a hop, and a full major-chord payoff when found.
No samples: everything is generated here, so the track is royalty-free.
"""
import json, sys, wave
import numpy as np
from scipy import signal

SR = 44100
E = json.load(open(sys.argv[1], encoding="utf-8")); OUT = sys.argv[2]
BEAT = 60 / E["bpm"]; TOTAL = E["total"]; N = int((TOTAL + 0.5) * SR)
SCN = {s["name"]: s for s in E["scenes"]}; FOUND = E["found"]
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N); RV = np.zeros(N)


def put(x, t, g=1.0, pan=0.0, rv=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    a = max(0, -i); i = max(0, i); j = min(N, i + len(x) - a); s = np.asarray(x[a:a + j - i]) * g; th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    L[i:j] += s * np.cos(th) * 1.4142; R[i:j] += s * np.sin(th) * 1.4142
    if rv: RV[i:j] += s * rv


tt = lambda d: np.arange(int(d * SR)) / SR
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def env(d, a=0.005, r=0.05): n = int(d * SR); e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "lp", fs=SR, output="sos"), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "hp", fs=SR, output="sos"), x)
def bp(x, a, b): return signal.sosfilt(signal.butter(2, [a, b], "bp", fs=SR, output="sos"), x)
def noise(d): return rng.standard_normal(int(d * SR))
def sweep(f0, f1, d): t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / SR)

# ---------------- instruments
def marimba(m, d=0.6, bright=1.0):
    t = tt(d); f = midi(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.45 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + 0.2 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)) * env(d, 0.002, 0.03)
def bell(m, d=1.6):
    t = tt(d); f = midi(m); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc) for r, a, dc in [(1, 1, 2.6), (2.76, 0.45, 4.5), (5.4, 0.25, 7), (8.9, 0.12, 10)]) * env(d, 0.002, 0.1)
def pluck(m, d=0.35):
    t = tt(d); f = midi(m); x = signal.sawtooth(2 * np.pi * f * t) * np.exp(-t * 12); return lp(x, 3200) * env(d, 0.002, 0.03)
def bass(m, d):
    t = tt(d); f = midi(m); x = np.sin(2 * np.pi * f * t) + 0.35 * lp(signal.sawtooth(2 * np.pi * f * t), 500); return x * np.exp(-t * 2.2) * env(d, 0.005, 0.04)
def kick(): t = tt(0.3); return (np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 34)) / SR) * np.exp(-t * 11) + 0.25 * hp(noise(0.3), 2500) * np.exp(-t * 180)) * env(0.3, 0.001, 0.05)
def clap(): x = np.zeros(int(0.22 * SR)); n = bp(noise(0.22), 900, 3800); t = tt(0.22); x += n * (np.exp(-t * 26) + sum(np.exp(-np.clip(t - d, 0, None) * 140) * (t >= d) for d in (0.0, 0.011, 0.023)) * 0.5); return x * 0.6
def hat(o=False): d = 0.16 if o else 0.05; return hp(noise(d), 7500) * np.exp(-tt(d) * (22 if o else 85))
def rim(): t = tt(0.06); return (np.sin(2 * np.pi * 1750 * t) + 0.5 * np.sin(2 * np.pi * 870 * t)) * np.exp(-t * 90)
def pad(notes, d, cut=1400):
    t = tt(d); x = np.zeros(len(t))
    for m in notes:
        for det in (-0.006, 0.006): x += signal.sawtooth(2 * np.pi * midi(m) * (1 + det) * t + rng.uniform(0, 6))
    return lp(x, cut) / len(notes) * env(d, min(0.5, d / 3), min(0.6, d / 3))

CH = {"C": (48, [60, 64, 67]), "Am": (45, [57, 60, 64]), "F": (41, [53, 57, 60]), "G": (43, [55, 59, 62]), "Dm": (50, [50, 53, 57]), "E": (40, [52, 56, 59])}
def hook(ch):  # 8 eighth-notes of the music-box figure over a chord
    r, (a, b, c) = CH[ch][0], CH[ch][1]; up = lambda m: m + 12 if m < 64 else m
    a, b, c = up(a) + 12, up(b) + 12, up(c) + 12; six = a + 9 if ch in ("C", "F", "G") else a + 10
    return [b, c, a + 12, c, b, c, six if six > c else six + 12, c]
LEAD = {"C": [(0, 79, 1), (1.5, 76, .5), (2, 79, 1), (3, 81, 1)], "G": [(0, 83, 1), (1.5, 79, .5), (2, 81, 1), (3, 79, 1)], "F": [(0, 81, 1), (1.5, 77, .5), (2, 81, 1), (3, 84, 1)], "Am": [(0, 76, 1), (1.5, 81, .5), (2, 84, 1), (3, 81, 1)], "Dm": [(0, 77, 1), (2, 81, 1)], "E": [(0, 80, 1), (2, 83, 1.5)]}


def groove(t0, chords, lvl):
    """One bar per chord. lvl: dict of gains kick/clap/hat/bass/mar/lead/pad/rimm (0 = off)."""
    for bi, ch in enumerate(chords):
        tb = t0 + bi * 4 * BEAT; root, tri = CH[ch]
        if lvl.get("pad"): put(pad([m + 12 for m in tri] + [root + 24], 4 * BEAT + 0.3, lvl.get("cut", 1500)), tb, 0.2 * lvl["pad"], 0, 0.5)
        for b in range(4):
            t = tb + b * BEAT
            if lvl.get("kick") and (b in (0, 2)): put(kick(), t, 0.95 * lvl["kick"])
            if lvl.get("kick") and b == 2: put(kick(), t + BEAT * 0.5, 0.6 * lvl["kick"])
            if lvl.get("clap") and b in (1, 3): put(clap(), t, 0.5 * lvl["clap"], 0.1, 0.25)
            if lvl.get("rimm") and b in (1, 3): put(rim(), t, 0.35 * lvl["rimm"], -0.2, 0.2)
            if lvl.get("hat"):
                put(hat(), t, 0.16 * lvl["hat"], 0.35); put(hat(b == 3), t + BEAT / 2, 0.22 * lvl["hat"], 0.35)
                put(hat(), t + BEAT * 0.25, 0.06 * lvl["hat"], -0.35); put(hat(), t + BEAT * 0.75, 0.08 * lvl["hat"], -0.35)
        if lvl.get("bass"):
            for off, m, d in [(0, root, 1.4), (1.5, root + 12, 0.4), (2, root, 0.9), (3, root + 7, 0.45), (3.5, root + 12, 0.4)]: put(bass(m, d * BEAT), tb + off * BEAT, 0.5 * lvl["bass"])
        if lvl.get("mar"):
            for i, m in enumerate(hook(ch)): put(marimba(m, 0.5), tb + i * BEAT / 2 + (0.012 if i % 2 else 0), (0.3 if i % 2 == 0 else 0.2) * lvl["mar"], 0.5 * np.sin(i * 1.7), 0.35)
        if lvl.get("lead"):
            for off, m, d in LEAD[ch]: put(bell(m, 0.9 * d + 0.6), tb + off * BEAT, 0.2 * lvl["lead"], -0.15, 0.6)


# ---------------- the arrangement
t0 = SCN["hook"]["t0"]                                              # hook: mystery pad + pulse
put(pad([57, 60, 64, 71], 8 * BEAT + 0.4, 900), t0, 0.26, 0, 0.6); put(bass(33, 6 * BEAT), t0, 0.35)
for b in range(4, 8): put(kick(), t0 + b * BEAT, 0.35 + 0.1 * (b - 4)); put(hat(), t0 + (b + 0.5) * BEAT, 0.1, 0.3)
full = dict(kick=1, clap=1, hat=1, bass=1, mar=1, lead=1, pad=1)
groove(SCN["title"]["t0"], ["C", "G"], full)                         # title: the tune arrives
groove(SCN["setup"]["t0"], ["Am", "F", "G"], dict(kick=0.9, hat=0.8, bass=0.9, mar=0.75, pad=0.8, rimm=1))
s3 = SCN["search"]["t0"]                                             # search: sparse bed, the algorithm plays the notes
put(pad([57, 60, 64, 69], FOUND - s3 + 0.1, 1100), s3, 0.24, 0, 0.5)
nb = int(round((FOUND - s3) / BEAT))
for b in range(nb):
    t = s3 + b * BEAT; put(hat(), t, 0.12, 0.3); put(hat(), t + BEAT / 2, 0.16, -0.3); put(hat(), t + BEAT * 0.75, 0.06, 0.3)
    if b >= nb - 3: [put(hat(), t + k * BEAT / 4, 0.1 + 0.03 * k, 0) for k in range(4)]
groove(FOUND, ["C", "F"], dict(full, mar=1.1, lead=1.2))             # found: full band, downbeat on the hit
put(pad([55, 59, 62, 67], 2 * BEAT + 0.2), FOUND + 8 * BEAT, 0.2, 0, 0.5); [put(kick(), FOUND + (8 + k) * BEAT, 0.9) for k in (0, 1)]; [put(clap(), FOUND + (9 + k / 2) * BEAT, 0.4, 0, 0.3) for k in (0, 1)]
[put(marimba(m, 0.5), FOUND + 8 * BEAT + i * BEAT / 2, 0.3, 0, 0.3) for i, m in enumerate([67, 71, 74, 79])]
groove(SCN["rule"]["t0"], ["C", "F", "G"], dict(kick=1, clap=0.8, hat=0.9, bass=1, mar=0.9, pad=0.8, lead=0.6))
groove(SCN["code"]["t0"], ["Am", "F", "C", "G"], dict(kick=0.8, rimm=1, hat=0.6, bass=0.8, pad=1, cut=1100, mar=0.45))   # lo-fi under the typing
groove(SCN["speed"]["t0"], ["Am", "F", "Dm", "E"], dict(kick=1, clap=0.7, hat=1, bass=1, mar=0.8, pad=0.9, lead=0.5))
f0 = SCN["finale"]["t0"]
groove(f0, ["C"], full); put(pad([60, 64, 67, 72], 2 * BEAT), f0 + 4 * BEAT, 0.2, 0, 0.5); [put(kick(), f0 + (4 + k) * BEAT, 0.9) for k in (0, 1)]; put(clap(), f0 + 5 * BEAT, 0.5, 0, 0.3)
[put(marimba(m, 0.5), f0 + 4 * BEAT + i * BEAT / 2, 0.3, 0, 0.3) for i, m in enumerate([76, 79, 84, 79])]
tz = f0 + 6 * BEAT                                                   # teaser: half-time, dark
put(pad([57, 60, 64, 71], 4.5 * BEAT + 0.2, 800), tz, 0.3, 0, 0.6); put(bass(33, 4 * BEAT), tz, 0.5); [put(kick(), tz + k * BEAT, 0.7) for k in (0, 2, 3.5)]; [put(rim(), tz + k * BEAT, 0.3, 0.2, 0.3) for k in (1, 3)]
te = f0 + 10.5 * BEAT                                                # end card: resolve
put(pad([60, 64, 67, 72, 76], TOTAL - te, 2200), te, 0.3, 0, 0.7); put(bass(36, 3 * BEAT), te, 0.6)
for b in range(0, 5): t = te + b * BEAT; put(kick(), t, 0.9) if b < 4 else None; put(clap(), t + BEAT, 0.45, 0, 0.3) if b in (0, 2) else None; [put(hat(), t + k * BEAT / 2, 0.16, 0.3) for k in range(2)] if b < 4 else None
for i, m in enumerate([76, 79, 84, 79, 76, 79, 81, 79, 84]): put(marimba(m, 0.5), te + i * BEAT / 2, 0.3 if i < 8 else 0.4, 0.4 * np.sin(i), 0.4)
for off, m in [(0, 84), (1.5, 79), (2, 84), (3, 88), (4, 91)]: put(bell(m, 2.2), te + off * BEAT, 0.22, 0, 0.7)

# ---------------- sound effects from the picture's own schedule
PENT = [72, 74, 76, 79, 81, 84, 86, 88, 91]
def whoosh(d=0.5, up=True): n = noise(d); t = tt(d); f = np.geomspace(500, 5000, len(t)) if up else np.geomspace(5000, 500, len(t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + bp(n, 700, 5000) * 0.6; return x * np.sin(np.pi * t / d) ** 2
def riser(d): t = tt(d); x = bp(noise(d), 800, 7000) * (t / d) ** 2 * 0.6 + sweep(220, 1760, d) * (t / d) ** 2 * 0.25; return x * env(d, 0.05, 0.02)
def impact(): t = tt(1.4); return (np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 9)) / SR) * np.exp(-t * 3.2) + lp(noise(1.4), 1800) * np.exp(-t * 7) * 0.5) * env(1.4, 0.001, 0.2)
def bonk(k): t = tt(0.32); f = midi(58 - (k % 3)); return (np.sin(2 * np.pi * np.cumsum(f * (1 - 0.25 * np.clip(t / 0.3, 0, 1))) / SR) + 0.4 * signal.square(2 * np.pi * f / 2 * t)) * np.exp(-t * 12) * env(0.32, 0.002, 0.05)
def boing(): t = tt(0.3); return np.sin(2 * np.pi * np.cumsum(300 + 500 * t / 0.3 + 40 * np.sin(2 * np.pi * 18 * t)) / SR) * np.exp(-t * 7) * env(0.3, 0.004, 0.06)
def keyclick(k): d = 0.03; return (bp(noise(d), 1800, 6500) * np.exp(-tt(d) * 130) + 0.3 * np.sin(2 * np.pi * (2300 + 400 * rnd(k)) * tt(d)) * np.exp(-tt(d) * 200))
def rnd(i): x = np.sin(i * 127.1 + 311.7) * 43758.5453; return x - np.floor(x)
def glitch(): d = 0.4; t = tt(d); x = signal.square(2 * np.pi * np.repeat(rng.choice([110, 220, 440, 880, 1760], 16), len(t) // 16 + 1)[:len(t)] * t) * 0.3 + noise(d) * (rng.random(len(t)) > 0.6) * 0.3; return lp(x, 6000) * env(d, 0.001, 0.02)

for e in E["events"]:
    t, k, v = e["t"], e["k"], e.get("v", 0)
    if k == "tick": put(pluck(PENT[(int(v) * 3) % 7] - 12, 0.25), t, 0.32, 0.6 * np.sin(v * 2.1), 0.4)
    elif k == "lock": [put(bell(m, 1.4), t + i * 0.06, 0.3, 0, 0.6) for i, m in enumerate([76, 81, 88])]
    elif k == "pop": put(sweep(420, 1300, 0.09) * env(0.09, 0.002, 0.03), t, 0.35, 0.2, 0.2); put(marimba(84 + 2 * int(v), 0.3), t + 0.02, 0.2, 0.2, 0.3)
    elif k == "riser": put(riser(v), t, 0.55, 0, 0.3)
    elif k == "impact": put(impact(), t, 1.0, 0, 0.5); put(hp(noise(1.6), 5000) * np.exp(-tt(1.6) * 2.4), t, 0.3, 0, 0.5); [put(bell(m, 2.0), t, 0.2, p, 0.7) for m, p in ((72, -0.4), (76, 0), (79, 0.4), (84, 0))]
    elif k == "sweep": put(whoosh(0.7), t, 0.3, 0, 0.4)
    elif k == "whoosh": put(whoosh(0.45), t, 0.42, 0, 0.3)
    elif k == "land": put(kick(), t, 0.8); put(lp(noise(0.25), 900) * np.exp(-tt(0.25) * 14), t, 0.5, 0, 0.3)
    elif k == "drop": put(marimba(PENT[int(v)] - 12, 0.7), t, 0.5, -0.6 + 0.2 * v, 0.4); put(kick(), t, 0.4, -0.6 + 0.2 * v)
    elif k == "target": put(impact(), t, 0.55, 0, 0.4); [put(bell(m, 1.8), t + i * 0.05, 0.26, 0, 0.7) for i, m in enumerate([69, 76, 81])]
    elif k == "wiggle": [put(pluck(72 + (i % 2) * 2, 0.12), t + i * 0.09, 0.18, 0.5 * (-1) ** i, 0.3) for i in range(8)]
    elif k == "jump": put(boing(), t, 0.4, 0, 0.3); put(whoosh(0.5, v == 0), t + 0.05, 0.3, 0, 0.3)
    elif k == "open": m = PENT[int(v)]; put(marimba(m, 0.9, 1.4), t, 0.6, 0, 0.5); put(marimba(m - 12, 0.9), t, 0.35, 0, 0.4); put(sweep(900, 2600, 0.12) * env(0.12, 0.002, 0.04), t - 0.05, 0.2, 0, 0.3); put(kick(), t - 0.12, 0.7); put(bass(45, BEAT * 1.6), t - 0.12, 0.45)
    elif k == "no": put(bonk(int(v)), t, 0.55, 0, 0.25); put(rim(), t, 0.4, 0, 0.3)
    elif k == "hop": put(boing(), t, 0.3, 0, 0.3); put(whoosh(0.4), t + 0.1, 0.26, 0, 0.3); put(marimba(60 + 2 * int(v), 0.2), t + BEAT - 0.03, 0.2, 0, 0.2)
    elif k == "yes":
        put(impact(), t, 1.0, 0, 0.5); put(hp(noise(2.2), 4500) * np.exp(-tt(2.2) * 1.8), t, 0.34, 0, 0.6)
        [put(bell(m, 2.6), t + i * 0.045, 0.3, 0.5 * np.sin(i * 2.2), 0.8) for i, m in enumerate([72, 76, 79, 84, 88, 91])]
        [put(marimba(m, 0.7, 1.5), t + i * 0.045, 0.4, 0, 0.5) for i, m in enumerate([60, 64, 67, 72])]
    elif k == "card": put(sweep(300, 900, 0.1) * env(0.1, 0.002, 0.03), t - 0.08, 0.3, 0, 0.2); put(kick(), t, 0.6); [put(bell(m, 1.3), t, 0.2, 0, 0.6) for m in (76 + 2 * int(v), 83 + 2 * int(v))]
    elif k == "key": put(keyclick(int(v)), t, 0.3 + 0.12 * rnd(v), 0.5 * np.sin(v), 0.1)
    elif k == "step": put(pluck(PENT[int(v) % 9], 0.2), t, 0.34, -0.6 + 0.2 * v, 0.3)
    elif k == "stepno": put(pluck(PENT[int(v) % 9] - 13, 0.18), t, 0.26, -0.6 + 0.2 * v, 0.3)
    elif k == "stepyes": [put(bell(m, 1.2), t, 0.24, 0, 0.6) for m in (79, 84)]
    elif k == "ret": [put(bell(m, 2.0), t + i * 0.05, 0.3, 0, 0.7) for i, m in enumerate([72, 79, 84, 88])]; put(kick(), t, 0.7)
    elif k == "boom": put(impact(), t, 1.0, 0, 0.5); put(bonk(1), t, 0.5, 0, 0.3)
    elif k == "glitch": put(glitch(), t, 0.4, 0, 0.3); put(sweep(2400, 120, 0.45) * env(0.45, 0.002, 0.1), t, 0.26, 0, 0.3)

# tiny breath of silence right before the find (contrast makes the hit land)
gap = np.ones(N); a, b = int((FOUND - 0.13) * SR), int((FOUND - 0.005) * SR); gap[a:b] = 0.12; gap = lp(gap, 60, 1)

# ---------------- reverb + master
ir_n = int(1.9 * SR); ir = rng.standard_normal((2, ir_n)) * np.exp(-np.arange(ir_n) / SR * 3.4); ir = np.stack([hp(lp(c, 6500), 250) for c in ir])
wet = [signal.fftconvolve(RV, ir[c])[:N] * 0.05 for c in range(2)]
mix = np.stack([(L + wet[0]) * gap, (R + wet[1]) * gap])
mix = hp(mix, 28)
# glue: gentle compressor + soft clip
pk = np.percentile(np.abs(mix), 99.9); mix = mix / pk * 1.0
envf = lp(np.abs(mix).max(0), 12, 1); gain = 1 / np.maximum(1, (envf / 0.42) ** 0.4); mix = mix * gain
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
mix *= 10 ** (-1.0 / 20) / np.abs(mix).max()
fade = np.clip(np.arange(N) / (0.05 * SR), 0, 1) * np.clip((TOTAL - np.arange(N) / SR) / 0.9, 0, 1); mix *= fade
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype(np.int16).tobytes())
for sc in E["scenes"]:
    seg = mix[:, int(sc["t0"] * SR):int(sc["t1"] * SR)]; print(f"  {sc['name']:8s} rms {20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9):6.1f} dB")
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9); print(f"soundtrack {TOTAL:.1f}s  rms {rms:.1f} dB  peak {20 * np.log10(np.abs(mix).max()):.1f} dB")
