"""Original, royalty-free soundtrack for the Hexapod Mochi reel, synthesized and locked to the picture.

Story of the score (128 BPM, D minor):
  0-2.5   dark drone + riser, reversed swell into the first slam
  2.5-16  driving build beat; a layer is added at every stage (body, joints, legs, feet)
  16.3    big hit + open chord (robot complete), short breakdown
  17.3    power-on sweep and boot chime, 18.5 servo whine as it stands, 0.15 s silence
  19.75   drop: full beat while it walks, a tick for every foot touchdown
  27.6    end chord with bells, clean tail
Every part landing has its own sound (snap / servo insert / screw / slam / thud) at the exact frame it lands.

Usage: python3 music.py events.json out.wav   (events.json = timeline.json + "sfx" from reel.html)
"""
import json, sys, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
cfg = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
beat = 60 / cfg["bpm"]
total = cfg["total"]
N = int((total + 0.05) * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(5)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = gain * sig[: j - i]
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414


def ex(n, tau): return np.exp(-np.arange(n) / SR / tau)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def noise(n): return rng.standard_normal(n)
def hp(x, f, o=2): return sosfilt(butter(o, f, "hp", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "lp", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "bp", fs=SR, output="sos"), x)
def tt(d): return np.arange(int(d * SR)) / SR


def saw(f, d, det=0.0):
    t = tt(d); o = np.zeros(len(t))
    for k in ((-det, 0, det) if det else (0,)):
        o += 2 * ((f * (1 + k) * t) % 1) - 1
    return o / (3 if det else 1)


def env(n, a, r):
    e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr); return e


# ---------------- drums ----------------
def kick(big=1.0):
    d = 0.5; t = tt(d); f = 44 + 130 * np.exp(-t / 0.028)
    b = np.sin(2 * np.pi * np.cumsum(f) / SR) * ex(len(t), 0.2 * big)
    c = hp(noise(len(t)), 2500) * ex(len(t), 0.003) * 0.3
    return np.tanh((b + c) * 1.8) * 0.9


def clap():
    n = int(0.3 * SR); x = bp(noise(n), 1000, 6000); e = np.zeros(n)
    for k, o in enumerate((0, 0.012, 0.024)):
        i = int(o * SR); e[i:] += ex(n - i, 0.01 if k < 2 else 0.12)
    return x * e * 0.7


def hat(o=False):
    n = int((0.22 if o else 0.05) * SR); return hp(noise(n), 7500, 4) * ex(n, 0.06 if o else 0.012) * 0.45


# ---------------- sfx ----------------
def snap(pitch=1.0):
    d = 0.09; t = tt(d); n = len(t)
    click = hp(noise(n), 2500) * ex(n, 0.004) * 0.8
    body = np.sin(2 * np.pi * 1300 * pitch * t) * ex(n, 0.012) * 0.35 + np.sin(2 * np.pi * 420 * pitch * t) * ex(n, 0.02) * 0.3
    return click + body


def servo_in():
    d = 0.22; n = int(d * SR); x = np.linspace(0, 1, n)
    slide = bp(noise(n), 800, 3500) * x ** 2 * 0.25
    return slide + np.pad(snap(0.8), (int(0.13 * SR), 0))[:n] * 1.2


def screw():
    d = 0.22; n = int(d * SR); t = tt(d)
    r = np.zeros(n)
    for k in range(9):
        i = int(k * 0.022 * SR); r[i:] += hp(noise(n - i), 3000) * ex(n - i, 0.003)
    return r * 0.45 + np.sin(2 * np.pi * 900 * t) * ex(n, 0.05) * 0.06


def whoosh(d=0.4):
    n = int(d * SR); x = np.linspace(0, 1, n); s = noise(n)
    return (bp(s, 300, 1500) * (1 - x) + bp(s, 1500, 7000) * x) * np.sin(np.pi * x ** 0.6) ** 2 * 0.8


def slam():
    d = 1.6; t = tt(d); n = len(t)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 90 * np.exp(-t / 0.07)) / SR) * ex(n, 0.5)
    metal = sum(np.sin(2 * np.pi * f * t) * ex(n, 0.25 + 0.1 * k) for k, f in enumerate((310, 523, 787, 1210))) * 0.06
    crack = hp(noise(n), 1500) * ex(n, 0.05) * 0.6
    return boom + metal + crack


def thud():
    d = 0.8; t = tt(d); n = len(t)
    return np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-t / 0.05)) / SR) * ex(n, 0.22) + lp(noise(n), 600) * ex(n, 0.04) * 0.6


def step():
    d = 0.12; t = tt(d); n = len(t)
    return np.sin(2 * np.pi * np.cumsum(140 + 300 * np.exp(-t / 0.008)) / SR) * ex(n, 0.03) * 0.5 + hp(noise(n), 3000) * ex(n, 0.003) * 0.35


def chime(notes, gain=0.25):
    d = 2.2; n = int(d * SR); o = np.zeros(n)
    for k, m in enumerate(notes):
        i = int(k * 0.07 * SR); t = np.arange(n - i) / SR
        o[i:] += (np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(2 * np.pi * midi(m) * 2.76 * t)) * np.exp(-t / 0.7) * gain
    return o


# ---------------- score ----------------
D = cfg
STAGES = [2.55, 6.1, 9.4, 13.5]
BUILD_END, POWER, STAND, DROP, STOP, END = 16.3, 17.3, 18.5, 19.75, 26.9, 27.6
CH = [[50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [45, 49, 52, 57]]  # Dm Bb C A
ROOTS = [38, 34, 36, 33]
bar = 4 * beat


def pad(notes, t0, d, g, cut=1800):
    for m in notes:
        add(lp(saw(midi(m), d, 0.005), cut) * env(int(d * SR), 0.25, 0.5), t0, g, ((m % 5) - 2) * 0.2)


def bass(m, t0, d, g):
    n = int(d * SR); add((np.sin(2 * np.pi * midi(m) * tt(d)) + 0.35 * lp(saw(midi(m), d), 500)) * env(n, 0.004, 0.03), t0, g)


def arp(m, t0, g, pan):
    d = 0.16; add(lp(saw(midi(m), d), 3500) * ex(int(d * SR), 0.05), t0, g, pan)


# hook: drone + riser + reversed swell
add(lp(saw(midi(26), 2.6, 0.01), 300) * env(int(2.6 * SR), 1.0, 0.2), 0, 0.25)
n = int(2.5 * SR); x = np.linspace(0, 1, n)
add(hp(noise(n), 2000) * x ** 3 * 0.18 + np.sin(2 * np.pi * np.cumsum(200 + 1400 * x ** 2) / SR) * x ** 3 * 0.05, 0.05)
pad([50, 57, 62, 65], 0.2, 2.3, 0.02, 900)

# build section: beat from the first slam, layers per stage
t = STAGES[0]
k = 0
while t < BUILD_END - 0.01:
    b = int((t - STAGES[0]) / beat)
    lvl = sum(t >= s for s in STAGES)
    add(kick(), t, 0.75)
    if lvl >= 2 and b % 2 == 1: add(clap(), t, 0.5)
    for h in range(2 if lvl < 3 else 4):
        add(hat(o=(h == 1 and lvl >= 2)), t + h * beat / (2 if lvl < 3 else 4), 0.22 if h % 2 else 0.14, 0.3)
    c = (b // 4) % 4
    bass(ROOTS[c] + (12 if b % 2 else 0), t, beat * 0.45, 0.3)
    bass(ROOTS[c], t + beat / 2, beat * 0.4, 0.24)
    if b % 4 == 0: pad(CH[c], t, bar, 0.014 + 0.004 * lvl)
    if lvl >= 3:
        for s in range(4):
            arp(CH[c][(s + b) % 4] + 24, t + s * beat / 4, 0.03, (-0.5, 0.5)[s % 2])
    t += beat
# complete: hit + open chord, breakdown
add(slam(), BUILD_END, 0.7); add(kick(1.6), BUILD_END, 0.9)
pad([50, 57, 62, 65, 69], BUILD_END, 1.6, 0.03, 2500)
add(chime([74, 81, 86], 0.18), BUILD_END)
# power on: sweep + boot chime
n = int(1.1 * SR); x = np.linspace(0, 1, n)
add(np.sin(2 * np.pi * np.cumsum(150 + 1200 * x ** 1.5) / SR) * np.sin(np.pi * x) * 0.12 + hp(noise(n), 4000) * np.sin(np.pi * x) * 0.05, POWER)
add(chime([69, 74, 78, 81], 0.22), POWER + 0.35)
# stand up: servo whine (18 servos) + riser, then silence before the drop
d = DROP - STAND - 0.15; n = int(d * SR); x = np.linspace(0, 1, n)
wh = np.zeros(n)
for k, f0 in enumerate((620, 655, 700, 742)):
    wh += np.sign(np.sin(2 * np.pi * np.cumsum(f0 * (0.8 + 0.5 * x) + 30 * np.sin(2 * np.pi * 9 * np.arange(n) / SR)) / SR)) * 0.25
add(lp(wh, 2500) * env(n, 0.08, 0.05) * 0.08, STAND)
add(hp(noise(n), 2500) * x ** 3 * 0.2, STAND)
for k in range(4): add(kick(0.6), STAND + k * beat * 0.5 + 0.4, 0.3 + 0.1 * k)
# drop: walking groove
add(slam(), DROP, 0.6)
t = DROP
while t < STOP + 0.3:
    b = int(round((t - DROP) / beat))
    add(kick(1.2 if b % 4 == 0 else 1.0), t, 0.85)
    if b % 2 == 1: add(clap(), t, 0.6)
    for h in range(4): add(hat(o=(h == 2)), t + h * beat / 4, 0.2 if h % 2 else 0.12, 0.3)
    c = (b // 4) % 4
    for s in range(4):
        bass(ROOTS[c] + (0, 12, 7, 12)[s], t + s * beat / 4, beat / 4 * 0.85, 0.27)
        arp(CH[c][(s * 2 + b) % 4] + 24, t + s * beat / 4, 0.035, (-0.5, 0.5)[s % 2])
    if b % 4 == 0: pad(CH[c], t, bar, 0.02, 2600)
    t += beat
# end card: open major chord + bells
add(whoosh(0.5), END - 0.45, 0.6)
pad([50, 57, 62, 66, 69, 74], END, total - END, 0.03, 2600)
bass(26, END, 2.5, 0.35); add(kick(1.5), END, 0.9)
add(chime([74, 78, 81, 86], 0.24), END + 0.05)
add(chime([86, 90, 93], 0.14), END + 0.9)

# ---------------- sfx from the picture ----------------
PITCH = {"base": 0.7, "walls": 0.9, "clamps": 1.0, "joint": 1.15, "horns": 1.3, "leg": 1.05, "foot": 1.25, "top": 0.7}
for e in cfg["sfx"]:
    ty = e["type"]; pan = ((e.get("i", 0) % 6) - 2.5) * 0.18
    if ty == "snap": add(snap(PITCH.get(e.get("stage"), 1.0)), e["t"], 0.55, pan)
    elif ty == "servo": add(servo_in(), e["t"] - 0.13, 0.6, pan)
    elif ty == "screw": add(screw(), e["t"] - 0.08, 0.5, pan)
    elif ty == "slam": add(slam(), e["t"], 0.9)
    elif ty == "thud": add(thud(), e["t"], 0.8)
    elif ty == "whoosh": add(whoosh(max(0.25, e.get("dur", 0.4))), e["t"], 0.5)
    elif ty == "step": add(step(), e["t"], 0.35, pan)

# ---------------- master ----------------
mix = np.stack([L, R])
for c in range(2):
    ir_n = int(1.1 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.3)
    ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    mix[c] = mix[c] + 0.14 * fftconvolve(mix[c], ir)[:N]
mix = hp(mix, 25)
envl = lp(np.abs(mix).max(0), 10) + 1e-6
mix *= np.minimum(1, (0.45 / envl) ** 0.35)
mix = np.tanh(mix * 1.25)
mix *= 10 ** (-1.2 / 20) / np.max(np.abs(mix))
fi, fo = int(0.02 * SR), int(1.2 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi); mix[:, -fo:] *= np.linspace(1, 0, fo)
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"wrote {out} ({total:.1f}s, {len(cfg['sfx'])} sfx)")
