"""Synthesizes an original, royalty-free soundtrack for the video, locked to its timeline.

Usage: python3 music.py <events.json> <out.wav>
events.json = timeline.json fields plus "starts" (slide start seconds), "total" (seconds)
and "sfx" ([{t, type}]) collected from slides.html by render.mjs.
"""
import json, sys, wave
import numpy as np

SR = 44100
cfg = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
beat = 60 / cfg["bpm"]
bar = 4 * beat
total = cfg["total"]
N = int((total + 0.05) * SR)
mix = np.zeros(N)
rng = np.random.default_rng(7)


def add(sig, t, gain=1.0):
    i = int(t * SR)
    if i < 0 or i >= N:
        return
    j = min(N, i + len(sig))
    mix[i:j] += gain * sig[: j - i]


def decay(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def noise(n):
    return rng.standard_normal(n)


def bright_noise(n):
    return np.diff(noise(n + 1))  # crude high-pass


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def tone(freq, dur, harmonics=(1,), tau=None, attack=0.005):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * freq * h * tt) / h for h in harmonics)
    a = np.minimum(1, tt / attack)
    e = np.exp(-tt / tau) if tau else np.clip((dur - tt) / 0.08, 0, 1)
    return s * a * e


def sweep(f0, f1, dur, curve=1.0):
    n = int(dur * SR)
    x = np.linspace(0, 1, n) ** curve
    f = f0 + (f1 - f0) * x
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# --- drums --------------------------------------------------------------------
def kick():
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    f = 44 + 120 * np.exp(-tt / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(n, 0.16) * 1.1


def snare():
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    return 0.55 * bright_noise(n) * decay(n, 0.07) + 0.5 * np.sin(2 * np.pi * 190 * tt) * decay(n, 0.05)


def hat(open_=False):
    n = int((0.2 if open_ else 0.05) * SR)
    return 0.35 * bright_noise(n) * decay(n, 0.07 if open_ else 0.014)


# --- sfx ----------------------------------------------------------------------
def impact():
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 70 * np.exp(-tt / 0.08)) / SR) * decay(n, 0.55)
    crash = bright_noise(n) * decay(n, 0.5) * 0.35
    return boom + crash


def whoosh(dur=0.6):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    bell = np.sin(np.pi * x) ** 2
    return (0.5 * noise(n) + 0.5 * bright_noise(n)) * bell * 0.45


def riser(dur=1.5):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    return (bright_noise(n) * 0.35 + sweep(220, 1800, dur, 2.0) * 0.25) * x ** 2.5


def slam():
    return impact()[: int(0.9 * SR)] * 0.9 + np.pad(snare(), (0, int(0.6 * SR)))[: int(0.9 * SR)] * 0.8


def pop():
    return sweep(700, 1500, 0.09) * decay(int(0.09 * SR), 0.03) * 0.5


def ding():
    return tone(midi(88), 0.5, (1, 2.01), tau=0.15) * 0.35 + tone(midi(95), 0.5, (1,), tau=0.1) * 0.15


def drop():
    return sweep(900, 200, 0.25) * decay(int(0.25 * SR), 0.12) * 0.4 + kick()[: int(0.25 * SR)] * 0.5


def alarm():
    b = tone(988, 0.14, (1, 3), attack=0.002)
    return np.concatenate([b, np.zeros(int(0.08 * SR)), b])


def cash():
    return tone(midi(84), 0.35, (1, 2.4), tau=0.08) * 0.35 + np.pad(tone(midi(91), 0.3, (1, 2.4), tau=0.08), (int(0.07 * SR), 0))[: int(0.35 * SR)] * 0.3


SFX = {"pop": pop, "slam": slam, "ding": ding, "drop": drop, "alarm": alarm, "cash": cash, "whoosh": whoosh}

# --- music --------------------------------------------------------------------
chords = [(57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59)]  # Am F Dm E
roots = [45, 41, 38, 40]
bars_total = sum(cfg["bars"])
intro_bars = cfg["bars"][0]
last_bar = bars_total - 1
danger = [(cfg["starts"][i], cfg["starts"][i] + cfg["bars"][i] * bar) for i in cfg["danger"]]

for b in range(bars_total):
    t0 = b * bar
    c = b % 4
    # pad: detuned chord, swells in each bar
    for m in chords[c]:
        for det in (0.997, 1.003):
            add(tone(midi(m) * det, bar + 0.3, (1, 2, 3), attack=0.25), t0, 0.035)
    if b == last_bar:
        continue
    main = b >= intro_bars
    for s in range(8):  # eighth notes
        te = t0 + s * beat / 2
        oct_ = [0, 0, 12, 0, 0, 12, 0, 12][s]
        add(tone(midi(roots[c] + oct_), beat / 2 * 0.9, (1, 2, 3), tau=0.14), te, 0.22 if main else 0.12)
        add(hat(open_=(s == 7 and main)), te, 0.8 if main else 0.5)
    for q in range(4):
        tq = t0 + q * beat
        if main or q == 0:
            add(kick(), tq, 0.9)
        if main and q in (1, 3):
            add(snare(), tq, 0.7)
    if main:  # sixteenth-note arp on top
        notes = [m + 12 for m in chords[c]]
        for s in range(16):
            add(tone(midi(notes[s % 3]), beat / 4, (1, 3, 5), tau=0.06), t0 + s * beat / 4, 0.045)

# siren over danger slides
for a, z in danger:
    n = int((z - a) * SR)
    tt = np.arange(n) / SR
    f = 720 + 160 * np.sin(2 * np.pi * 0.9 * tt)
    env = np.minimum(1, tt / 0.6) * np.minimum(1, (z - a - tt) / 0.4)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * env, a, 0.05)

# transitions: whoosh + impact on every slide change, risers into key slides
for i, s in enumerate(cfg["starts"]):
    if i == 0:
        add(impact(), 0, 0.6)
        continue
    add(whoosh(), s - 0.3, 0.9)
    add(impact(), s, 0.55)
    if i in cfg["riserInto"]:
        add(riser(), s - 1.5, 0.8)
add(impact(), last_bar * bar, 0.8)

for e in cfg["sfx"]:
    add(SFX[e["type"]](), e["t"], 1.0)

# master: soft clip, normalize, fade out
mix = np.tanh(mix * 1.1)
mix *= 0.89 / np.max(np.abs(mix))
fade = int(1.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
pcm = (mix * 32767).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {out} ({total:.1f}s)")
