"""Original score + sound design for the Techno Injaz intro, synthesized from scratch and locked to timeline.json.

Usage: python3 music.py <timeline.json> <out.wav>
No samples, no loops from anywhere else: every sound is generated here, so the track is royalty-free.
"""
import json, sys, wave
import numpy as np
from scipy import signal

SR = 44100
T = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
TOTAL = T["total"]
N = int((TOTAL + 1.0) * SR)
rng = np.random.default_rng(7)


class Bus:
    def __init__(self):
        self.L = np.zeros(N); self.R = np.zeros(N); self.rv = np.zeros(N)

    def add(self, sig, t, g=1.0, pan=0.0, rv=0.0):
        sig = np.asarray(sig, dtype=float)
        i = int(round(t * SR))
        if i >= N or i + len(sig) <= 0:
            return
        a = max(0, -i); i = max(0, i); j = min(N, i + len(sig) - a)
        s = sig[a:a + (j - i)] * g
        th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        self.L[i:j] += s * np.cos(th) * 1.4142
        self.R[i:j] += s * np.sin(th) * 1.4142
        if rv:
            self.rv[i:j] += s * rv


main, lofi = Bus(), Bus()


# ------------------------------------------------------------------ helpers
def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-5), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-5)))
    return e * np.clip((dur - t) / max(r, 1e-5), 0, 1)


def expdec(n, tau, a=0.002):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / tau)


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x)


def sweep_lp(x, fc, block=256):
    """Low-pass with a time-varying cutoff (array, Hz), processed in blocks with carried state."""
    y = np.zeros_like(x); zi = None
    for s in range(0, len(x), block):
        f = float(np.clip(fc[min(s, len(fc) - 1)], 30, SR * 0.45))
        sos = signal.butter(2, f, "low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[s:s + block], zi = signal.sosfilt(sos, x[s:s + block], zi=zi)
    return y


def norm(x, p=1.0):
    m = np.max(np.abs(x)); return x / m * p if m > 0 else x


def saw(f, d, voices=(0,), harm=24):
    t = tt(d); out = np.zeros_like(t)
    for cents in voices:
        ff = f * 2 ** (cents / 1200)
        nh = int(min(harm, (SR * 0.45) // max(ff, 1)))
        ph = rng.random() * 6.28
        for k in range(1, nh + 1):
            out += np.sin(2 * np.pi * ff * k * t + ph * k) / k
    return out / len(voices)


def noise(d):
    return rng.standard_normal(int(d * SR))


# ------------------------------------------------------------------ instruments
def rhodes(f, d=1.8, vel=1.0):
    t = tt(d)
    mod = np.sin(2 * np.pi * f * 1.0 * t) * 1.6 * np.exp(-t / 0.35)
    s = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 1.4)
    s += 0.2 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.06)
    return s * np.minimum(1, t / 0.003) * vel * 0.45


def pluck(f, d=0.9, bright=1.0):
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + k * 5 / bright)) / k for k in range(1, 7))
    return s * np.minimum(1, t / 0.002) * 0.5


def bell(f, d=2.4, vel=1.0):
    t = tt(d)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9) + 0.5 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t / 0.4)
         + 0.25 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t / 0.15) + 0.12 * np.sin(2 * np.pi * f * 8.93 * t) * np.exp(-t / 0.07))
    return s * np.minimum(1, t / 0.0015) * vel * 0.35


def pad(f, d, a=0.8, r=1.0, cutoff=2400, voices=(-9, 0, 8)):
    s = saw(f, d, voices, harm=16)
    s = lp(s, cutoff)
    return s * adsr(len(s), a, 1.0, 1.0, r) * 0.22


def choir(f, d, a=0.6, r=1.0):
    """Vowel-ish 'aah' pad: saw source through two formant band-passes."""
    s = saw(f, d, (-6, 0, 7), harm=40)
    v = bp(s, 650, 1100, 2) * 1.0 + bp(s, 1000, 1400, 2) * 0.6 + bp(s, 2400, 2900, 2) * 0.25
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * tt(d))
    return v * vib * adsr(len(v), a, 1.0, 1.0, r) * 0.5


def sub(f, d, tau=0.6):
    t = tt(d); return np.sin(2 * np.pi * f * t) * expdec(len(t), tau, 0.005)


def kick(punch=1.0, tau=0.2):
    t = tt(0.55)
    f = 44 + 150 * np.exp(-t / 0.028) * punch
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    click = hp(noise(0.55), 3000) * np.exp(-t / 0.003) * 0.3
    return s + click


def lofi_kick():
    return lp(kick(0.8, 0.16), 2500) * 0.9


def snare(d=0.3, tone=185, tau=0.09):
    t = tt(d)
    n = bp(noise(d), 1200, 9000) * np.exp(-t / tau)
    b = np.sin(2 * np.pi * tone * t) * np.exp(-t / 0.05)
    return norm(n) * 0.75 + b * 0.55


def hat(open_=False):
    d = 0.25 if open_ else 0.05
    t = tt(d); return hp(noise(d), 7000) * np.exp(-t / (0.08 if open_ else 0.012)) * 0.35


def tom(f):
    t = tt(0.6)
    ff = f * (1 + 0.6 * np.exp(-t / 0.04))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / 0.25) + lp(noise(0.6), 2000) * np.exp(-t / 0.03) * 0.3


def keyclick(hard=0.5):
    t = tt(0.07)
    tick = hp(noise(0.07), 2500) * np.exp(-t / 0.004)
    thock = np.sin(2 * np.pi * (140 + 60 * hard) * t) * np.exp(-t / 0.015)
    bottom = lp(noise(0.07), 900) * np.exp(-t / 0.01) * 0.5
    return norm(tick) * 0.5 + thock * (0.5 + 0.3 * hard) + bottom


def mouse(down=True):
    t = tt(0.08)
    return norm(hp(noise(0.08), 3500) * np.exp(-t / 0.002)) * 0.8 + np.sin(2 * np.pi * (260 if down else 360) * t) * np.exp(-t / 0.012) * 0.6


def impact(d=3.0, weight=1.0):
    t = tt(d)
    f = 24 + 95 * np.exp(-t / 0.12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.7 * weight))
    body = lp(noise(d), 900) * np.exp(-t / 0.18)
    crash = hp(noise(d), 4000) * np.exp(-t / 0.9) * 0.3
    return norm(boom) + norm(body) * 0.5 + norm(crash) * 0.35


def braam(root, d=1.6):
    s = sum(saw(midi(root + k), d, (-12, 0, 11), harm=30) for k in (0, 7, 12))
    s = sweep_lp(s, np.linspace(3000, 300, len(s)) ** 1.0)
    return norm(s) * adsr(len(s), 0.01, 0.4, 0.6, 0.6)


def whoosh(d, f0, f1, shape=1.0):
    n = int(d * SR); x = np.linspace(0, 1, n)
    src = noise(d)
    y = sweep_lp(src, f0 * (f1 / f0) ** x) - sweep_lp(src, f0 * (f1 / f0) ** x * 0.3)
    return norm(y) * np.sin(np.pi * x) ** shape


def riser(d, f0=250, f1=9000):
    n = int(d * SR); x = np.linspace(0, 1, n)
    y = hp(sweep_lp(noise(d), f0 * (f1 / f0) ** x), 150)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 2400 * x ** 2) / SR) * 0.3
    return (norm(y) + tone) * x ** 2.4


def reverse_swell(d, f=None):
    s = impact(d)[::-1] if f is None else bell(f, d)[::-1]
    return s * np.linspace(0, 1, len(s)) ** 1.5


def heartbeat():
    return sub(52, 0.25, 0.07) * 1.0 + lp(noise(0.25), 200) * expdec(int(0.25 * SR), 0.03) * 0.5


def blip(f, d=0.07):
    t = tt(d); return np.sin(2 * np.pi * f * t) * adsr(len(t), 0.002, 0.03, 0.4, 0.02) * 0.5


def zap(f0, f1, d):
    x = np.linspace(0, 1, int(d * SR))
    return np.sign(np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** x) / SR)) * (1 - x) ** 2 * 0.25


# ------------------------------------------------------------------ 0. cold open
main.add(lp(noise(TOTAL), 300) * 0.02, 0, 1.0)                                          # room tone
main.add(sub(41.2, 1.6, 3) * np.linspace(0, 1, int(1.6 * SR)) ** 2, 0, 0.35)
for i in range(len(T["cmd"])):
    main.add(keyclick(rng.random()), T["type0"] + i * T["typeStep0"] + rng.uniform(-0.01, 0.01), 0.45, pan=rng.uniform(-0.2, 0.2))
main.add(keyclick(1.0), T["enter0"], 0.85, rv=0.2)
c0, c1 = T["collapse"]
main.add(reverse_swell(c1 - c0 + 0.05), c0, 0.35, rv=0.2)
main.add(bell(midi(96), 2.5), c1, 0.55, rv=0.8)                                          # the dot is born
main.add(sub(55, 0.6, 0.25), c1, 0.6)
d0, d1 = T["dive"]
main.add(whoosh(d1 - d0 + 0.2, 300, 6000, 1.2), d0, 0.5, rv=0.3)
main.add(riser(d1 - d0, 400, 12000), d0, 0.35)

# ------------------------------------------------------------------ 1. the room: lofi groove (on its own bus for the tape stop)
bpm = 84; beat = 60 / bpm; bar = beat * 4
g0 = d1 - 0.02
prog = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]      # Fmaj7 Em7 Dm7 Cmaj7
bass = [41, 40, 38, 36]
for b in range(3):
    tb = g0 + b * bar
    ch = prog[b % 4]
    for k, m in enumerate(ch):
        lofi.add(rhodes(midi(m), bar * 1.1, 0.9), tb + k * 0.018, 0.34, pan=-0.3 + k * 0.2, rv=0.25)
    lofi.add(rhodes(midi(ch[-1] + 12), 1.2, 0.5), tb + beat * 2.5, 0.2, pan=0.4, rv=0.4)
    lofi.add(lp(saw(midi(bass[b % 4]), bar * 0.95, (0,), 8), 400) * adsr(int(bar * 0.95 * SR), 0.01, 0.3, 0.7, 0.1), tb, 0.35)
    for q in range(4):
        tq = tb + q * beat
        swing = 0.035
        if q in (0, 2) or (q == 3 and b % 2):
            lofi.add(lofi_kick(), tq + (beat * 0.5 if q == 3 else 0), 0.75)
        if q in (1, 3):
            lofi.add(lp(snare(0.3, 200, 0.07), 5000), tq, 0.4, rv=0.15)
        lofi.add(lp(hat(), 9000), tq, 0.18, pan=0.25)
        lofi.add(lp(hat(), 9000), tq + beat / 2 + swing, 0.12, pan=0.25)
rain = lp(hp(noise(4.0), 800), 6000)
lofi.add(rain * np.minimum(1, tt(4.0) / 0.6) * 0.06, g0, 1.0)
crackle = (rng.random(int(4.0 * SR)) > 0.9993) * rng.standard_normal(int(4.0 * SR))
lofi.add(hp(crackle, 1500) * 0.35, g0, 1.0)
# typing on the programmer's keyboard
t = 2.35
while t < T["roomEnter"] - 0.05:
    for _ in range(int(rng.integers(3, 8))):
        if t >= T["roomEnter"] - 0.05:
            break
        lofi.add(keyclick(rng.random() * 0.6), t, 0.22, pan=rng.uniform(-0.15, 0.15)); t += 0.075 + rng.random() * 0.05
    t += 0.15 + rng.random() * 0.25
lofi.add(keyclick(1.0), T["roomEnter"], 0.5)
for i, m in enumerate([72, 76, 79, 84]):                                                  # BUILD SUCCESS chime
    main.add(bell(midi(m), 1.6, 0.9), T["roomEnter"] + 0.08 + i * 0.07, 0.32, pan=-0.3 + i * 0.2, rv=0.6)

# tape stop: the lofi bus slows to a halt as the camera starts pulling back
p0, p1 = T["pull"]
ts0 = int(p0 * SR); tsd = int(0.55 * SR)
for ch in ("L", "R"):
    x = getattr(lofi, ch)
    seg = x[ts0:ts0 + int(3 * SR)].copy()
    speed = np.clip(1 - np.linspace(0, 1, tsd) ** 1.4, 0, 1)
    pos = np.cumsum(speed)
    stopped = np.interp(pos, np.arange(len(seg)), seg) * np.linspace(1, 0, tsd) ** 0.5
    x[ts0:ts0 + tsd] = stopped
    x[ts0 + tsd:] = 0
lofi.rv[ts0 + tsd:] = 0

# ------------------------------------------------------------------ 2. pull back + hologram build
main.add(whoosh(p1 - p0 + 0.3, 200, 5000, 1.3), p0 + 0.05, 0.6, rv=0.3)
main.add(riser(p1 - p0 - 0.1, 150, 7000), p0 + 0.1, 0.45, rv=0.2)
main.add(sub(36.7, 2.5, 1.2) * np.linspace(0.2, 1, int(2.5 * SR)), p0 + 0.3, 0.35)
main.add(impact(3.0, 1.2), p1 - 0.02, 0.75, rv=0.25)
main.add(braam(38, 2.2), p1 - 0.02, 0.28, rv=0.3)
for k, (name, root) in enumerate([("top", 79), ("left", 83), ("right", 86)]):
    th = T["holo"][name]; pan = [0, -0.6, 0.6][k]
    main.add(zap(300, 2400, 0.62), th, 0.12, pan=pan, rv=0.3)                              # laser drawing the outline
    for j in range(10):
        main.add(blip(midi(root + [0, 3, 7, 10, 12][j % 5] + 12 * (j // 5)), 0.05), th + j * 0.06, 0.1, pan=pan, rv=0.4)
    arc = bp(noise(1.0), 2000, 9000) * (rng.random(int(SR)) > 0.6) * np.exp(-tt(1.0) / 0.4)
    main.add(arc, th + 0.1, 0.1, pan=pan * 0.5)                                            # electric arc crackle
    main.add(whoosh(0.55, 800, 7000, 0.8), th + 0.55, 0.3, pan=pan, rv=0.3)                # material fills in
    main.add(bell(midi(root - 12), 1.8, 0.8), th + 1.1, 0.25, pan=pan, rv=0.6)
    main.add(sub(midi(36 + k * 2), 0.4, 0.1), th + 1.12, 0.4)
main.add(whoosh(0.9, 3000, 14000, 1.5), T["glint"], 0.25, rv=0.4)
for i, m in enumerate([84, 88, 91, 96, 100]):
    main.add(bell(midi(m), 2.0, 0.6), T["glint"] + 0.05 + i * 0.05, 0.14, pan=-0.5 + i * 0.25, rv=0.8)

# ------------------------------------------------------------------ 3. charge + countdown
hud, press, rel = T["hud"], T["press"], T["release"]
d = press - hud
ten = sum(saw(midi(m), d, (-10, 0, 9), 20) for m in (38, 45, 50, 53))
ten = sweep_lp(ten, 200 + 3200 * np.linspace(0, 1, len(ten)) ** 2) * np.linspace(0.1, 1, len(ten)) ** 1.5
main.add(norm(ten) * 0.9, hud, 0.22, rv=0.2)
hb = hud + 0.1; gap = 0.62
while hb < press - 0.25:
    main.add(heartbeat(), hb, 0.9); main.add(heartbeat(), hb + 0.16, 0.6)
    hb += gap; gap = max(0.3, gap * 0.86)
for i, c in enumerate(T["count"]):
    main.add(braam([38, 39, 41][i], 1.0), c, 0.35, rv=0.3)
    main.add(impact(1.2, 0.5), c, 0.45)
    main.add(blip(1760, 0.09), c, 0.35, rv=0.3)
main.add(riser(press - T["count"][-1] - 0.05, 300, 12000) * 1.0, T["count"][-1] + 0.05, 0.4)
main.add(reverse_swell(0.9), press - 0.9, 0.4, rv=0.2)
main.add(mouse(True), press, 0.9); main.add(mouse(False), rel - 0.04, 0.6)

# ------------------------------------------------------------------ 4. ignition + launch
lo, meco = T["liftoff"], T["meco"]
main.add(impact(4.0, 1.6), rel, 1.2, rv=0.35)
main.add(braam(33, 2.5), rel, 0.4, rv=0.3)
dur = meco - rel + 0.25
rn = int(dur * SR); x = np.linspace(0, 1, rn)
roar = sweep_lp(noise(dur), 250 + 3000 * np.minimum(1, x * dur / 1.2) ** 0.7)
roar *= 0.75 + 0.25 * norm(lp(noise(dur), 18))
env = np.minimum(1, tt(dur) / 0.4) * (1 - np.clip((tt(dur) - (meco - rel)) / 0.12, 0, 1))
main.add(norm(roar) * env, rel, 0.55)
main.add(np.sin(2 * np.pi * 42 * tt(dur)) * (0.7 + 0.3 * np.sin(2 * np.pi * 17 * tt(dur))) * env, rel, 0.4)
# epic drums + harmony from lift-off
bpm2 = 128; b2 = 60 / bpm2
tk = lo
while tk < meco - 0.05:
    main.add(kick(1.2, 0.22), tk, 0.85)
    tk += b2
ts = lo + b2
while ts < meco - 0.05:
    main.add(snare(0.4, 180, 0.12), ts, 0.5, rv=0.25); ts += 2 * b2
for i, tt0 in enumerate(np.arange(lo, meco - 0.05, b2 / 2)):
    main.add(hat(i % 4 == 2), tt0, 0.35, pan=0.3)
for i, (tt0, f) in enumerate([(meco - 0.5, 110), (meco - 0.38, 92), (meco - 0.26, 78), (meco - 0.14, 65)]):
    main.add(tom(f), tt0, 0.6, pan=-0.4 + i * 0.25, rv=0.2)
chords = [(45, [57, 60, 64]), (41, [57, 60, 65]), (36, [55, 60, 64]), (43, [55, 59, 62])]   # Am F C G
tc = lo; ci = 0
while tc < meco - 0.05:
    root, ch = chords[ci % 4]; dd = min(b2 * 4, meco - tc)
    main.add(lp(saw(midi(root), dd, (0,), 12), 600) * adsr(int(dd * SR), 0.01, 0.2, 0.8, 0.05), tc, 0.4)
    for m in ch:
        main.add(choir(midi(m + (ci // 4) * 2), dd + 0.3, 0.2, 0.3), tc, 0.28, rv=0.4)
    for s in range(16):
        te = tc + s * b2 / 4
        if te < meco - 0.05:
            main.add(pluck(midi(ch[s % 3] + 24), 0.3, 1.5), te, 0.14, pan=np.sin(s) * 0.5, rv=0.3)
    tc += b2 * 4; ci += 1
lead = [(0, 76, 2), (2, 79, 1), (3, 81, 1), (4, 84, 3), (7, 83, 1), (8, 79, 4)]
for st, m, ln in lead:
    tl = lo + st * b2
    if tl < meco - 0.1:
        dd = min(ln * b2, meco - tl)
        s = lp(saw(midi(m), dd, (-7, 0, 7), 20), 3500) * adsr(int(dd * SR), 0.02, 0.2, 0.8, 0.08)
        main.add(s, tl, 0.16, rv=0.4)
main.add(riser(meco - lo, 200, 12000), lo, 0.35, rv=0.2)
cl = T["cloud"]
main.add(whoosh(1.0, 400, 12000, 1.0), cl - 0.55, 0.7, rv=0.3)
main.add(whoosh(0.6, 9000, 400, 0.8), cl, 0.5, rv=0.3)

# ------------------------------------------------------------------ 5. engine cut -> silence -> sunrise
main.add(impact(4.5, 2.0), meco, 0.8, rv=0.6)
main.add(heartbeat(), meco + 0.55, 0.35)
air = lp(hp(noise(3.0), 3000), 9000) * adsr(int(3.0 * SR), 1.0, 1.0, 1.0, 1.0)
main.add(air, meco + 0.1, 0.03, rv=0.5)
s0, s1 = T["sunrise"]
for i, m in enumerate([48, 55, 60, 64, 67, 71, 74]):                                      # Cmaj9 swell
    main.add(pad(midi(m), TOTAL - s0 + 0.5, 1.4, 1.5, 2600 + i * 300), s0, 0.2, pan=(i - 3) * 0.14, rv=0.6)
for m in (60, 64, 67):
    main.add(choir(midi(m), TOTAL - s0, 1.2, 1.5), s0 + 0.3, 0.15, rv=0.6)
main.add(sub(midi(24), 3.0, 2.0) * np.minimum(1, tt(3.0) / 1.0), s0, 0.4)
main.add(reverse_swell(1.0, midi(88)), s1 - 1.0, 0.3, rv=0.5)
for i, m in enumerate([79, 84, 88, 91]):
    main.add(bell(midi(m), 2.6, 0.8), s1 + i * 0.09, 0.22, pan=0.2 + i * 0.12, rv=0.8)

# ------------------------------------------------------------------ 6. Hello world
mel = [72, 74, 76, 79, 81, 79, 84, 81, 86, 88, 91]
for i in range(len(T["text"])):
    tc = T["typeStart"] + i * T["typeStep"]
    main.add(keyclick(rng.random()), tc, 0.45, pan=rng.uniform(-0.15, 0.15))
    if T["text"][i] != " ":
        main.add(pluck(midi(mel[i]), 0.8, 2.0), tc, 0.26, pan=-0.4 + i * 0.08, rv=0.5)
em = T["emoji"]
main.add(riser(em - T["typeStart"], 500, 12000), T["typeStart"], 0.25)
main.add(impact(3.0, 1.0), em, 0.7, rv=0.5)
pop = np.sin(2 * np.pi * np.cumsum(np.linspace(300, 1900, int(0.15 * SR))) / SR) * np.exp(-tt(0.15) / 0.05)
main.add(pop, em, 0.5, rv=0.3)
for i, m in enumerate([84, 88, 91, 96, 100, 103, 108]):
    main.add(bell(midi(m), 2.2, 0.7), em + 0.04 + i * 0.045, 0.2, pan=np.sin(i * 1.7) * 0.7, rv=0.8)
for m in (36, 43, 48, 52, 55, 59, 62):
    main.add(pad(midi(m), TOTAL - em, 0.05, 1.6, 4000), em, 0.16, rv=0.5)

# ------------------------------------------------------------------ 7. brand sting + tagline
br = T["brand"]
main.add(reverse_swell(0.8), br - 0.8, 0.35, rv=0.3)
main.add(sub(midi(24), 3.0, 1.5), br, 0.7)
for i, (m, dt) in enumerate([(72, 0), (79, 0.12), (84, 0.24), (88, 0.36), (91, 0.52)]):
    main.add(bell(midi(m), 3.0, 1.0), br + dt, 0.36, pan=-0.4 + i * 0.2, rv=0.9)
main.add(whoosh(0.9, 3000, 14000, 1.5), br + 0.5, 0.2, rv=0.4)
for i, m in enumerate([88, 91, 96]):
    main.add(bell(midi(m), 2.4, 0.6), T["tagline"] + i * 0.1, 0.16, pan=0.3, rv=0.9)

# ------------------------------------------------------------------ mix
def ir(seed, dur=3.2, tau=0.9):
    r = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-t / tau)
    x = lp(x, 7000); x[: int(0.02 * SR)] = 0
    return x / np.sqrt(np.sum(x ** 2))

L = main.L + lofi.L; R = main.R + lofi.R; RV = main.rv + lofi.rv
L += signal.fftconvolve(RV, ir(1), mode="full")[:N] * 0.55
R += signal.fftconvolve(RV, ir(2), mode="full")[:N] * 0.55

# glue: gentle RMS compressor
def compress(x, y, thr=0.35, ratio=3.0, att=0.01, rel=0.2):
    lvl = np.sqrt(lp((x ** 2 + y ** 2) / 2, 12, 1).clip(0))
    g = np.ones_like(lvl); over = lvl > thr
    g[over] = (thr + (lvl[over] - thr) / ratio) / lvl[over]
    g = lp(g, 6, 1)
    return x * g, y * g

peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak, R / peak
L, R = compress(L, R)
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak * 1.25, R / peak * 1.25
L, R = np.tanh(L * 1.1) / np.tanh(1.1), np.tanh(R * 1.1) / np.tanh(1.1)
end = int(TOTAL * SR)
L, R = L[:end], R[:end]
fi = int(0.05 * SR); L[:fi] *= np.linspace(0, 1, fi); R[:fi] *= np.linspace(0, 1, fi)
fo = int((TOTAL - T["fadeOut"]) * SR); L[-fo:] *= np.linspace(1, 0, fo) ** 1.5; R[-fo:] *= np.linspace(1, 0, fo) ** 1.5
m = max(np.max(np.abs(L)), np.max(np.abs(R))); L, R = L / m * 0.93, R / m * 0.93
pcm = (np.stack([L, R], axis=1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
for s in range(int(TOTAL)):
    seg = pcm[s * SR:(s + 1) * SR].astype(float) / 32767
    print(f"{s:2d}s  rms {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f} dB")
print(f"wrote {OUT} ({TOTAL:.1f}s)")
