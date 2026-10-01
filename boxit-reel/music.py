"""Original, royalty-free soundtrack for the BOXIT reel, synthesized and locked to timeline.json.

120 BPM, so every scene is exactly one bar (2 s). Bright, clean pop/house bed:
  bar 1  sparse pluck + sub (hook)            bar 2-4  four-on-the-floor groove, bass, chord stabs
  ~7.9   0.12 s of silence before the reveal   bar 5    warm reveal chord, half-time
  bar 6  rising plucks on اختار/اطلب/استلم, final chord on the CTA, clean tail
Plus a synced SFX for every on-screen event (whoosh, UI clicks, tap, thud, swell, pops, chime).

Usage: python3 music.py timeline.json out.wav
"""
import json, sys, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
cfg = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
beat = 60 / cfg["bpm"]
bar = 4 * beat
total = cfg["total"]
N = int((total + 0.02) * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]; i = 0
    j = min(N, i + len(sig))
    s = gain * sig[: j - i]
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414


def env_exp(n, tau): return np.exp(-np.arange(n) / SR / tau)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def noise(n): return rng.standard_normal(n)
def hp(x, f, o=2): return sosfilt(butter(o, f, "hp", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "lp", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "bp", fs=SR, output="sos"), x)


def osc(freq, dur, shape="saw", detune=0.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    out = np.zeros(n)
    for d in ((-detune, 0, detune) if detune else (0,)):
        ph = (freq * (1 + d) * tt) % 1.0
        out += (2 * ph - 1) if shape == "saw" else np.sin(2 * np.pi * ph) if shape == "sin" else np.sign(np.sin(2 * np.pi * ph))
    return out / (3 if detune else 1)


def adsr(n, a=0.005, d=0.1, s=0.6, r=0.1):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n: e[n - nr:] *= np.linspace(1, 0, nr)
    return e


# ---------------- drums ----------------
def kick():
    n = int(0.42 * SR); tt = np.arange(n) / SR
    f = 46 + 110 * np.exp(-tt / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.18)
    click = hp(noise(n), 2000) * env_exp(n, 0.004) * 0.25
    return np.tanh((body + click) * 1.6) * 0.9


def clap():
    n = int(0.35 * SR)
    x = bp(noise(n), 900, 5000)
    e = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.022)):
        i = int(off * SR); e[i:] += env_exp(n - i, 0.012 if k < 2 else 0.11)
    return x * e * 0.8


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    return hp(noise(n), 7000, 4) * env_exp(n, 0.07 if open_ else 0.015) * 0.5


# ---------------- sfx ----------------
def whoosh(dur=0.45):
    n = int(dur * SR); x = np.linspace(0, 1, n)
    sw = noise(n)
    # moving band-pass via two passes blended along the sweep
    lo, hi = bp(sw, 300, 1400), bp(sw, 1500, 7000)
    shape = np.sin(np.pi * x ** 0.7) ** 2
    return (lo * (1 - x) + hi * x) * shape * 0.9


def tick():
    n = int(0.08 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * tt) * env_exp(n, 0.012) * 0.35 + hp(noise(n), 5000) * env_exp(n, 0.003) * 0.25


def click():
    n = int(0.07 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * tt) * env_exp(n, 0.008) * 0.4 + hp(noise(n), 3000) * env_exp(n, 0.002) * 0.4)


def select():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    return np.pad(click(), (0, n - int(0.07 * SR))) + np.sin(2 * np.pi * midi(88) * tt) * env_exp(n, 0.06) * 0.22


def tap():
    n = int(0.3 * SR); tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(180 + 400 * np.exp(-tt / 0.01)) / SR) * env_exp(n, 0.05)
    snap = hp(noise(n), 2500) * env_exp(n, 0.004)
    bell = np.sin(2 * np.pi * midi(84) * tt) * env_exp(n, 0.09) * 0.25
    return thump * 0.7 + snap * 0.5 + bell


def hit():
    return kick() * 0.8 + hp(noise(int(0.42 * SR)), 4000) * env_exp(int(0.42 * SR), 0.05) * 0.3


def thud():
    n = int(0.6 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-tt / 0.04)) / SR) * env_exp(n, 0.16)
    box = lp(noise(n), 700) * env_exp(n, 0.03) * 0.8
    return body + box


def swell():
    d = 0.48; n = int(d * SR); x = np.linspace(0, 1, n)
    return hp(noise(n), 1500) * x ** 3 * 0.5 + osc(midi(60), d, "sin") * x ** 2 * 0.2


def reveal():
    n = int(2.2 * SR); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(42 + 40 * np.exp(-tt / 0.08)) / SR) * env_exp(n, 0.5)
    air = lp(hp(noise(n), 2500), 9000) * env_exp(n, 0.35) * 0.12
    return sub * 0.9 + air


def pop(note=0):
    m = [79, 83, 86][note]
    d = 0.35; n = int(d * SR); tt = np.arange(n) / SR
    tone = (osc(midi(m), d, "sin") + 0.35 * osc(midi(m) * 2, d, "sin")) * env_exp(n, 0.12)
    return tone * 0.5 + np.pad(click(), (0, n - int(0.07 * SR))) * 0.6


def chime():
    d = 1.6; n = int(d * SR); out = np.zeros(n)
    for k, m in enumerate((86, 91, 95)):
        i = int(k * 0.05 * SR)
        tt = np.arange(n - i) / SR
        out[i:] += np.sin(2 * np.pi * midi(m) * tt) * np.exp(-tt / 0.5) * (0.3 - 0.06 * k)
    return out


SFX = dict(whoosh=whoosh, tick=tick, click=click, select=select, tap=tap, hit=hit, thud=thud, swell=swell, reveal=reveal, pop=pop, chime=chime)

# ---------------- music ----------------
# progression (one chord per bar): Dmaj9 → Bm7 → Gmaj7 → A6 | Gmaj9 (reveal) | D (end)
CH = [[62, 66, 69, 73, 76], [59, 62, 66, 69, 74], [55, 59, 62, 66, 71], [57, 61, 64, 66, 69], [55, 59, 62, 66, 69], [50, 57, 62, 66, 69]]
ROOT = [38, 35, 31, 33, 31, 38]
nbars = int(round(total / bar))
silence_at = 8.0 - 0.12


def pad(notes, t0, dur, g):
    for m in notes:
        s = lp(osc(midi(m), dur, "saw", 0.004), 2200) * adsr(int(dur * SR), 0.12, 0.3, 0.8, 0.4)
        add(s, t0, g, pan=((m % 5) - 2) * 0.2)


def stab(notes, t0, g):
    d = 0.22
    for m in notes:
        s = lp(osc(midi(m + 12), d, "saw", 0.006), 4000) * env_exp(int(d * SR), 0.07)
        add(s, t0, g, pan=((m % 3) - 1) * 0.35)


def bass(m, t0, d, g):
    n = int(d * SR)
    s = (osc(midi(m), d, "sin") + 0.3 * lp(osc(midi(m), d, "saw"), 600)) * adsr(n, 0.004, 0.08, 0.7, 0.03)
    add(s, t0, g)


def pluck(m, t0, g, pan=0.0):
    d = 0.3
    s = lp(osc(midi(m), d, "saw"), 3000) * env_exp(int(d * SR), 0.09)
    add(s, t0, g, pan)


for b in range(nbars):
    t0 = b * bar
    ch, rt = CH[b], ROOT[b]
    if b == 0:  # hook: sparse
        add(kick(), 0.0, 0.8)
        pad(ch, 0.0, bar, 0.034)
        for i, m in enumerate([ch[4] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[4] + 12]):
            pluck(m, 0.5 + i * beat / 2, 0.11, (-0.4, 0.4)[i % 2])
        for e in range(4, 8):
            add(hat(), e * beat / 2, 0.14, 0.3)
        add(kick(), 2 * beat, 0.5)
        bass(rt, 0.0, 1.0, 0.25)
        add(hp(noise(int(bar * SR)), 3000) * np.linspace(0, 1, int(bar * SR)) ** 3 * 0.06, 0.0)  # tiny riser into the groove
        continue
    if b in (1, 2, 3):
        pad(ch, t0, bar, 0.018)
        for q in range(4):
            tq = t0 + q * beat
            if tq < silence_at - 0.01:
                add(kick(), tq, 0.85)
            if q in (1, 3) and tq < silence_at:
                add(clap(), tq, 0.55, 0.05)
        for e in range(8):
            te = t0 + e * beat / 2
            if te >= silence_at:
                continue
            add(hat(open_=(e % 2 == 1)), te, 0.28 if e % 2 else 0.18, 0.3)
            bass(rt + (12 if e in (3, 7) else 0), te + beat / 4 if e % 2 == 0 else te, beat / 4 * 0.9, 0.22)
        for s_t in (0.5, 1.25, 1.75) if b != 3 else (0.5, 1.25):
            stab(ch[1:], t0 + s_t, 0.03)
    if b == 4:  # reveal: half-time, warm
        pad(ch, 8.45, 1.6, 0.03)
        bass(rt, 8.45, 1.4, 0.3)
        for q in (0, 2):
            add(kick(), 8.45 + q * beat, 0.55)
        for e in range(6):
            add(hat(), 8.95 + e * beat / 2, 0.12, 0.3)
    if b == 5:
        pad(ch, t0, bar, 0.016)
        bass(rt, 10.0, 0.9, 0.22)
        for q in range(3):
            add(kick(), t0 + q * beat, 0.6)
            add(hat(open_=True), t0 + q * beat + beat / 2, 0.14, 0.3)
        # end chord on the CTA
        pad([50, 57, 62, 66, 69, 74], 11.35, 0.75, 0.03)
        bass(26, 11.35, 0.6, 0.3)
        add(kick(), 11.35, 0.7)

for e in cfg["sfx"]:
    f = SFX[e["type"]]
    sig = f(e["dur"]) if e["type"] == "whoosh" else f(e["note"]) if e["type"] == "pop" else f()
    pan = {"whoosh": 0.0, "click": 0.2, "pop": [0.3, 0.0, -0.3][e.get("note", 0)]}.get(e["type"], 0.0)
    add(sig, e["t"], e.get("gain", 1.0) * 0.9, pan)

# ---------------- master ----------------
mix = np.stack([L, R])
# short convolution reverb (stereo-decorrelated noise IR)
ir_n = int(0.9 * SR)
for c in range(2):
    ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.25)
    ir = lp(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
    mix[c] = mix[c] + 0.12 * fftconvolve(mix[c], ir)[:N]
mix = hp(mix, 28)
# gentle compression: envelope follower
envl = np.abs(mix).max(0)
envl = lp(envl, 12) + 1e-6
gain = np.minimum(1, (0.5 / envl) ** 0.3)
mix *= gain
mix = np.tanh(mix * 1.2)
mix *= 10 ** (-1.2 / 20) / np.max(np.abs(mix))
fi, fo = int(0.03 * SR), int(0.35 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
mix[:, -fo:] *= np.linspace(1, 0, fo)
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"wrote {out} ({total:.1f}s)")
