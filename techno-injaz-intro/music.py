"""Synthesizes an original, royalty-free soundtrack + sound effects for the intro, locked to timeline.json.

Usage: python3 music.py <events.json> <out.wav>
events.json = timeline.json fields plus "ticks" (keyboard tick times for the opening shot).
Everything is generated with numpy, so there are no samples and no licensing to worry about.
"""
import json, sys, wave
import numpy as np

SR = 44100
cfg = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
T = cfg
total = T["total"]
N = int((total + 0.6) * SR)
rng = np.random.default_rng(2024)
L = np.zeros(N)
R = np.zeros(N)
RV = np.zeros(N)  # reverb send bus (mono)


def place(sig, t, g=1.0, pan=0.0, rv=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    a = max(0, -i)
    j = min(N, i + len(sig))
    seg = sig[a : a + (j - max(i, 0))]
    i = max(i, 0)
    th = (pan + 1) * np.pi / 4
    L[i:j] += seg * g * np.cos(th) * 1.4142
    R[i:j] += seg * g * np.sin(th) * 1.4142
    if rv:
        RV[i:j] += seg * g * rv


def env_ad(n, a, tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / tau)


def env_asr(n, a, r):
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc):
    """One-pole low-pass with a constant or per-sample cutoff (Hz)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def hp(x, fc):
    return x - lp(x, fc)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x / m * peak if m > 0 else x


# ------------------------------------------------------------------ instruments
def epiano(f, dur=1.6, vel=1.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.1) + 0.32 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.4) + 0.1 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.18)
    s += 0.25 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.03)  # tine
    return s * np.minimum(1, t / 0.004) * vel * 0.5


def pad(f, dur, a=0.6, r=0.8, bright=4):
    t = tt(dur)
    s = 0
    for det in (0.994, 1.0, 1.006):
        for h in range(1, bright + 1):
            s = s + np.sin(2 * np.pi * f * det * h * t + h) / h**1.3
    return s * env_asr(len(t), a, r) * 0.18


def bell(f, dur=1.4, vel=1.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.1)
    return s * np.minimum(1, t / 0.002) * vel * 0.4


def sub(f, dur, tau=0.5):
    t = tt(dur)
    return np.sin(2 * np.pi * f * t) * env_ad(len(t), 0.01, tau)


def key_click(hi=1.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    tick = hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.004)
    thump = np.sin(2 * np.pi * (170 + 40 * hi) * t) * np.exp(-t / 0.012)
    return norm(tick) * 0.55 + thump * 0.5


def mouse_click(down=True):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    tick = hp(rng.standard_normal(n), 3000) * np.exp(-t / (0.0025 if down else 0.0018))
    body = np.sin(2 * np.pi * (240 if down else 320) * t * np.exp(-t * 6)) * np.exp(-t / (0.02 if down else 0.012))
    return norm(tick) * 0.8 + body * (0.9 if down else 0.5)


def beep(f, dur=0.13):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return s * env_asr(len(t), 0.004, 0.05) * 0.5


def boom(dur=1.6, f0=95, f1=26):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    n = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.22)
    return norm(s) * 0.9 + norm(n) * 0.55


def impact(dur=2.2):
    t = tt(dur)
    b = boom(dur)
    crash = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.7)
    return b + norm(crash) * 0.28


def whoosh(dur, f0, f1, peak=0.5, shape=1.0):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** x
    noise = rng.standard_normal(n)
    y = lp(noise, fc) - lp(noise, fc * 0.35)
    bell_ = np.sin(np.pi * x) ** shape
    return norm(y) * bell_ * peak


def riser(dur, f0=300, f1=6000, peak=0.5):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** x
    y = hp(lp(rng.standard_normal(n), fc), 200)
    tone_ = np.sin(2 * np.pi * np.cumsum(180 + 1800 * x**2) / SR) * 0.35
    return (norm(y) + tone_) * x**2.2 * peak


def kick(gain=1.0):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 42 + 130 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * gain


def hat(open_=False):
    n = int((0.16 if open_ else 0.04) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 6500) * np.exp(-t / (0.06 if open_ else 0.01)) * 0.25


def sparkle_run(t0, notes, step=0.07, g=0.5, rv=0.7, pan_spread=0.7):
    for i, m in enumerate(notes):
        place(bell(midi(m), 1.6, 1.0 - i * 0.03), t0 + i * step, g, pan=np.sin(i * 2.1) * pan_spread, rv=rv)


# ------------------------------------------------------------------ cue points
zs, ze = T["zoomStart"], T["zoomEnd"]
press, release = T["press"], T["release"]
lift, cut = T["liftoff"], T["cut"]
emoji, typeStart, step = T["emoji"], T["typeStart"], T["typeStep"]

# ------------------------------------------------------------------ 1. cozy opening (0 - zoomStart)
chords = {
    "Am9": [45, 57, 60, 64, 67, 71],
    "Fmaj7": [41, 53, 57, 60, 64],
    "G": [43, 55, 59, 62, 67],
}
def comp(name, t0, vel=0.9):
    notes = chords[name]
    place(sub(midi(notes[0]), 1.4, 0.7), t0, 0.5, rv=0.1)
    for i, m in enumerate(notes[1:]):
        place(epiano(midi(m), 1.9, vel), t0 + 0.02 + i * 0.045, 0.34, pan=-0.35 + i * 0.18, rv=0.35)

comp("Am9", 0.5)
comp("Fmaj7", 1.7)
comp("G", 2.85, 1.0)
for t0, names in [(0.2, [57, 64, 71]), (1.5, [53, 60, 64])]:
    for m in names:
        place(pad(midi(m), 1.9, 0.7, 0.9), t0, 0.28, rv=0.4)
# vinyl-ish air + soft hats
air = lp(rng.standard_normal(int(3.2 * SR)), 5000)
place(norm(air) * env_asr(len(air), 0.8, 0.5), 0, 0.028, rv=0.05)
for i in range(6):
    place(hat(), 0.5 + i * 0.5, 0.35, pan=0.3)
# keyboard
ticks = T["ticks"]
for i, tk in enumerate(ticks):
    place(key_click(rng.random()), tk, 0.42 + 0.15 * rng.random(), pan=-0.1 + 0.2 * rng.random())
# "run" -> Enter key and power-up
place(key_click(1), zs - 0.42, 0.75, rv=0.1)
place(whoosh(0.42, 400, 5000, 0.5, 2.0), zs - 0.42, 0.7, rv=0.3)

# ------------------------------------------------------------------ 2. zoom-out + assembly
place(riser(ze - zs - 0.25, 260, 7000, 0.75), zs, 0.6, rv=0.25)
place(whoosh(ze - zs, 180, 2600, 0.8, 1.4), zs, 0.55, rv=0.25)
place(sub(midi(31), 1.8, 1.0), zs, 0.55)
for k, (name, base) in enumerate([("top", 79), ("left", 83), ("right", 86)]):
    ts = T["asm"][name]
    place(whoosh(0.5, 500, 4500, 0.6, 1.0), ts, 0.4, pan=[0, -0.6, 0.6][k], rv=0.2)
    tl = ts + 0.55
    n = int(0.3 * SR); t = np.arange(n) / SR
    clack = hp(rng.standard_normal(n), 2000) * np.exp(-t / 0.01)
    ping = np.sin(2 * np.pi * midi(base) * t) * np.exp(-t / 0.12) + 0.4 * np.sin(2 * np.pi * midi(base + 12) * t) * np.exp(-t / 0.08)
    place(norm(clack) * 0.5 + ping * 0.55, tl, 0.6, pan=[0, -0.5, 0.5][k], rv=0.3)
    place(sub(midi(36 + k * 2), 0.5, 0.15), tl, 0.5)
# reveal: Cmaj9 + big sparkle
place(impact(2.4), ze - 0.04, 0.6, rv=0.2)
for i, m in enumerate([48, 55, 60, 64, 67, 71, 74]):
    place(pad(midi(m), 2.6, 0.15, 1.4, 5), ze - 0.02, 0.22, rv=0.45)
sparkle_run(ze, [84, 88, 91, 95, 98, 100], 0.07, 0.42)
place(whoosh(0.7, 2500, 11000, 0.5, 1.2), T["glint"], 0.5, rv=0.3)

# ------------------------------------------------------------------ 3. tension: cursor, beeps, press
place(whoosh(0.7, 300, 1400, 0.35, 1.0), T["cursorIn"], 0.4, pan=0.5, rv=0.2)
drone = sub(55, press - 5.15, 3.0) * np.linspace(0.05, 1, int((press - 5.15) * SR)) ** 1.5
place(drone, 5.15, 0.55)
tension_hi = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 2300, int(0.7 * SR))) / SR) * np.linspace(0, 1, int(0.7 * SR)) ** 2
place(tension_hi, press - 0.78, 0.09, rv=0.3)
for i, b in enumerate(T["beeps"]):
    place(beep([660, 660, 880][i]), b, 0.5, rv=0.3)
    place(sub(55, 0.22, 0.08), b, 0.7)
place(mouse_click(True), press, 0.95)
place(sub(48, 0.35, 0.12), press, 0.7)
place(mouse_click(False), release, 0.7)

# ------------------------------------------------------------------ 4. ignition + launch
place(impact(2.6), release, 1.0, rv=0.15)
crackle = hp(rng.standard_normal(int(0.9 * SR)), 1500) * np.exp(-tt(0.9) / 0.25)
place(norm(crackle), release, 0.55)
place(whoosh(0.6, 3000, 700, 0.7, 0.6), release, 0.45)

rn = int((cut - release + 0.25) * SR)
x = np.linspace(0, 1, rn)
raw = rng.standard_normal(rn)
fc = 260 + 2600 * np.minimum(1, x * (cut - release + 0.25) / 1.8) ** 0.8
roar = lp(lp(raw, fc), fc * 1.4)
wob = lp(rng.standard_normal(rn), 30)
roar *= 0.7 + 0.3 * wob / max(1e-6, np.max(np.abs(wob)))
amp = np.minimum(1, (np.arange(rn) / SR) / 0.55) * (1 - np.clip((np.arange(rn) / SR - (cut - release)) / 0.22, 0, 1))
place(norm(roar) * amp, release, 0.6, rv=0.08)
# crackle texture on the roar
imp = (rng.random(rn) > 0.9985).astype(float) * rng.standard_normal(rn)
place(hp(imp, 1500) * amp * 0.4, release, 0.5)
low = np.sin(2 * np.pi * 43 * np.arange(rn) / SR) * (0.7 + 0.3 * np.sin(2 * np.pi * 21 * np.arange(rn) / SR))
place(low * amp, release, 0.55)

# rising harmony + driving pulse from lift-off
beat = 0.5
t = lift
prog = [("Am", [45, 52, 57, 60, 64]), ("F", [41, 48, 53, 57, 60]), ("C", [36, 48, 55, 60, 64]), ("G", [43, 50, 55, 59, 62]), ("Am", [45, 52, 57, 60, 64]), ("F", [41, 48, 53, 57, 60])]
ci = 0
while t < cut - 0.05:
    name, notes = prog[min(ci, len(prog) - 1)]
    dur = min(beat * 2, cut - t)
    sh = int(ci * 1.5)  # pitch keeps climbing
    for m in notes[1:]:
        place(pad(midi(m + sh), dur + 0.4, 0.1, 0.4, 4), t, 0.2, rv=0.25)
    place(sub(midi(notes[0]), dur, 0.4), t, 0.5)
    for s in range(8):
        te = t + s * beat / 4
        if te < cut - 0.02:
            m = notes[1 + (s * 2) % 4] + 24 + sh
            place(epiano(midi(m), 0.4, 0.8), te, 0.18, pan=np.sin(s) * 0.4, rv=0.2)
    ci += 1
    t += beat * 2
k = lift
while k < cut - 0.1:
    place(kick(), k, 0.7)
    place(hat(True), k + beat / 2, 0.5)
    k += beat
place(riser(cut - lift, 200, 9000, 0.9), lift, 0.55, rv=0.15)
for tw, f0, f1 in [(7.35, 400, 5000), (8.05, 500, 6500), (8.65, 600, 8000)]:
    place(whoosh(0.7, f0, f1, 0.7, 1.0), tw, 0.45, pan=np.sin(tw), rv=0.15)

# ------------------------------------------------------------------ 5. engine cut -> space
place(impact(3.4), cut, 0.85, rv=0.3)
place(whoosh(0.9, 6000, 200, 0.6, 0.6), cut, 0.5, rv=0.3)
for i, m in enumerate([36, 48, 55, 60, 64, 67, 71, 74]):
    place(pad(midi(m), 4.6, 0.7, 1.6, 6), cut + 0.05, 0.24, pan=(i - 4) * 0.12, rv=0.55)
rs = np.random.default_rng(5)
pent = [72, 76, 79, 81, 84, 88, 91]
for i in range(9):
    place(bell(midi(pent[rs.integers(len(pent))]), 1.8, 0.7), cut + 0.5 + i * 0.16, 0.26, pan=rs.uniform(-0.8, 0.8), rv=0.85)
place(whoosh(0.8, 2500, 11000, 0.5, 1.2), T["settleEnd"] - 0.1, 0.4, rv=0.3)

# ------------------------------------------------------------------ 6. "Hello world" typing + resolve
n_chars = len(T["text"])
for i in range(n_chars):
    tc = typeStart + i * step
    place(key_click(rs.random()), tc, 0.6, pan=rs.uniform(-0.15, 0.15))
    place(beep(midi(84 + [0, 2, 4, 7, 9][i % 5]), 0.05), tc, 0.12, rv=0.3)
place(riser(emoji - typeStart - 0.15, 400, 9000, 0.7), typeStart + 0.1, 0.5, rv=0.25)
for i, m in enumerate([41, 53, 57, 60, 64, 67, 72]):
    place(pad(midi(m), emoji - typeStart, 0.5, 0.05, 5), typeStart, 0.16, rv=0.35)
# resolve
place(impact(3.0), emoji, 0.95, rv=0.3)
place(mouse_click(True), emoji, 0.25)
pop_ = np.sin(2 * np.pi * np.cumsum(np.linspace(350, 1700, int(0.14 * SR))) / SR) * np.exp(-tt(0.14) / 0.05)
place(pop_, emoji, 0.55, rv=0.2)
for i, m in enumerate([36, 48, 55, 60, 64, 67, 71, 74, 79]):
    place(pad(midi(m), total - emoji + 0.5, 0.06, 2.0, 6), emoji, 0.26, pan=(i - 4) * 0.1, rv=0.55)
place(sub(midi(24), 3.0, 1.4), emoji, 0.7)
sparkle_run(emoji + 0.05, [84, 88, 91, 95, 98, 100, 103, 107], 0.06, 0.45)
# brand sting
for i, (m, dt) in enumerate([(84, 0), (88, 0.13), (91, 0.26), (96, 0.42)]):
    place(bell(midi(m), 2.0, 1.0), T["brand"] + dt, 0.5, pan=(i - 1.5) * 0.25, rv=0.7)

# ------------------------------------------------------------------ master
def convolve_fft(x, ir):
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]

def make_ir(seed, dur=2.6):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / 0.75)
    ir = lp(ir[: n], np.linspace(9000, 1800, n)) if n < 200000 else ir
    ir[: int(0.018 * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2))

wetL = convolve_fft(RV, make_ir(1))
wetR = convolve_fft(RV, make_ir(2))
mixL = L + wetL * 0.6
mixR = R + wetR * 0.6

peak = max(np.max(np.abs(mixL)), np.max(np.abs(mixR)))
mixL, mixR = mixL / peak, mixR / peak
drive = 1.45
mixL, mixR = np.tanh(mixL * drive) / np.tanh(drive), np.tanh(mixR * drive) / np.tanh(drive)
mixL *= 0.93; mixR *= 0.93
fade_in = int(0.12 * SR); mixL[:fade_in] *= np.linspace(0, 1, fade_in); mixR[:fade_in] *= np.linspace(0, 1, fade_in)
fade = int(0.9 * SR); end = int(total * SR)
mixL[end - fade : end] *= np.linspace(1, 0, fade); mixR[end - fade : end] *= np.linspace(1, 0, fade)
mixL, mixR = mixL[:end], mixR[:end]
pcm = (np.stack([mixL, mixR], axis=1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

# quick level report (RMS in dBFS per second) so mix problems are visible without listening
for s in range(0, int(total), 1):
    seg = pcm[s * SR : (s + 1) * SR, 0].astype(float) / 32767
    print(f"{s:2d}s  rms {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f} dB  peak {20*np.log10(np.max(np.abs(seg))+1e-9):6.1f} dB")
print(f"wrote {OUT} ({total:.1f}s)")
