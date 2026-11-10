"""خوارزمو's voice: one ElevenLabs request per line (eleven_v3, plain text + a Damascene accent tag, the owner's voice: "file 10",
the version he picked), cached in audio/cache/.
Writes build/voice.wav and voice/timeline.json (start/end of every line and scene: the picture is keyed to these).
Usage: ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... python3 tools/build_voice.py"""
import hashlib, json, os, subprocess, time, urllib.request, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100
MODEL = "eleven_v3"; TEMPO = 1.04; TAG = "[Syrian Damascene accent] "
LEAD, GAP, SCENE_GAP, TAIL = 0.3, 0.18, 0.4, 0.2
KEY, VOICE = os.environ.get("ELEVENLABS_API_KEY"), os.environ.get("ELEVENLABS_VOICE_ID")
lines = json.load(open(os.path.join(ROOT, "voice/script.json"), encoding="utf8"))["lines"]
cache = os.path.join(ROOT, "audio/cache"); os.makedirs(cache, exist_ok=True); os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
say = [l.get("tts", l["text"]) for l in lines]
def key_of(i): return os.path.join(cache, hashlib.sha1(json.dumps([TAG + say[i], MODEL, VOICE, lines[i].get("take", 1)], ensure_ascii=False).encode()).hexdigest()[:12] + ".mp3")
def tts(i):
    p = key_of(i)
    if os.path.exists(p): return p
    # the exact takes he approved (variant 10 + the picked line options) live in audio/variants_cache: reuse them as they are
    if lines[i].get("take", 1) == 1:
        q = os.path.join(ROOT, "audio/variants_cache", hashlib.sha1(json.dumps([TAG + say[i], MODEL, VOICE]).encode()).hexdigest()[:12] + ".mp3")
        if os.path.exists(q): open(p, "wb").write(open(q, "rb").read()); print("  approved take", i + 1); return p
    body = {"text": TAG + say[i], "model_id": MODEL, "seed": 1000 + lines[i].get("take", 1)}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", data=json.dumps(body, ensure_ascii=False).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    for k in range(8):
        try: open(p, "wb").write(urllib.request.urlopen(req, timeout=120).read()); print("  tts", i + 1, lines[i]["text"]); return p
        except Exception as e: print("  retry", i + 1, e); time.sleep(2 * (k + 1))
    raise SystemExit("tts failed")
def decode(p):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-af", f"atempo={TEMPO}", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).copy()
def trim(x):
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same"); on = np.where(env > 10 ** (-40 / 20))[0]
    if not len(on): return x
    y = x[max(0, on[0] - int(0.02 * SR)):on[-1] + int(0.06 * SR)].copy(); f = int(0.008 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
def onsets(x):  # start of each voiced phrase (pauses > 0.15 s split them): lets the picture hit "لأ" exactly
    e = np.sqrt(np.convolve(x * x, np.ones(882) / 882, "same")); on = e > 0.02; res, last_off, st = [], -1e9, None
    for i in range(0, len(on), 220):
        if on[i] and st is None:
            if i - last_off > 0.15 * SR or not res: res.append(i / SR)
            st = i
        elif not on[i] and st is not None: last_off, st = i, None
    return res
clips = [trim(decode(tts(i))) for i in range(len(lines))]
t, out, scenes = LEAD, [], []
for i, (l, c) in enumerate(zip(lines, clips)):
    if i and l["scene"] != lines[i - 1]["scene"]: t += SCENE_GAP - GAP
    if not scenes or scenes[-1]["name"] != l["scene"]:
        if scenes: scenes[-1]["t1"] = round(t - 0.12, 3)
        scenes.append({"name": l["scene"], "t0": round(max(0, t - 0.12), 3)})
    d = len(c) / SR; out.append({"i": i, "scene": l["scene"], "text": l["text"], "hl": l.get("hl", []), "t0": round(t, 3), "t1": round(t + d, 3), "segs": [round(t + x, 3) for x in onsets(c)]})
    t += d + GAP + l.get("pause", 0)
total = round(t - GAP + TAIL, 3); scenes[0]["t0"] = 0.0; scenes[-1]["t1"] = total
v = np.zeros(int(total * SR) + SR, np.float32)
for e, c in zip(out, clips): a = int(e["t0"] * SR); v[a:a + len(c)] += c
v = v / (np.abs(v).max() + 1e-9) * 10 ** (-1.5 / 20)
with wave.open(os.path.join(ROOT, "build/voice.wav"), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes())
json.dump({"total": total, "scenes": scenes, "lines": out}, open(os.path.join(ROOT, "voice/timeline.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{len(out)} lines, total {total:.1f}s")
