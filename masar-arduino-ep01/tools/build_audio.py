"""Voice + timing for the episode.

script/script.json  ->  ElevenLabs TTS per line (cached in audio/cache/)  ->
    build/voice.wav          the narration, every line placed on the timeline
    timeline.json            start/end of every line and scene (the video reads this, so motion follows the voice)
    masar-arduino-ep01.srt   subtitles

Usage:  ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... python3 tools/build_audio.py
Lines already in the cache are not requested again; edit a line and only that line is re-generated.
Without a key, lines missing from the cache become silence of an estimated length (so you can record your own voice:
put rec/001.wav, rec/002.wav ... next to the script and they replace the TTS line by line).
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, wave
from concurrent.futures import ThreadPoolExecutor
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
MODEL = "eleven_v3"   # the user picked v3 with the plain text (no tashkeel, no respelling) as the best-sounding Syrian reading
SETTINGS = {}          # v3: default voice settings
LEAD, GAP, SCENE_GAP, TAIL = 0.6, 0.4, 1.2, 4.5
KEY, VOICE = os.environ.get("ELEVENLABS_API_KEY"), os.environ.get("ELEVENLABS_VOICE_ID")

lines = json.load(open(os.path.join(ROOT, "script/script.json"), encoding="utf8"))["lines"]
cache = os.path.join(ROOT, "audio/cache"); os.makedirs(cache, exist_ok=True)
build = os.path.join(ROOT, "build"); os.makedirs(build, exist_ok=True)
PUN = "،.؟!…:"
PRON = {k.strip(PUN): v.strip(PUN) for k, v in json.load(open(os.path.join(ROOT, "script/script.json"), encoding="utf8")).get("pron", {}).items()}
def pron(text):  # optional whole-word swaps from a "pron" map in script.json (empty now: v3 reads the plain text best)
    out = []
    for w in text.split(" "):
        core = w.rstrip(PUN); out.append(PRON.get(core, core) + w[len(core):])
    return " ".join(out)
say = [pron(l.get("tts", l["text"])) for l in lines]


def key_of(i):
    h = hashlib.sha1(json.dumps([say[i], MODEL, SETTINGS, VOICE, lines[i].get("take", 1)], ensure_ascii=False).encode()).hexdigest()[:12]
    return os.path.join(cache, f"{h}.mp3")


def tts(i):
    path = key_of(i)
    if os.path.exists(path) or not (KEY and VOICE):
        return path
    same = lambda j: 0 <= j < len(lines) and lines[j]["scene"] == lines[i]["scene"]
    body = {"text": say[i], "model_id": MODEL, "seed": 1000 + lines[i].get("take", 1)}
    if SETTINGS: body["voice_settings"] = SETTINGS
    if MODEL != "eleven_v3":  # v3 does not take neighbouring text
        if same(i - 1): body["previous_text"] = say[i - 1]
        if same(i + 1): body["next_text"] = say[i + 1]
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        data=json.dumps(body, ensure_ascii=False).encode(), method="POST",
        headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    for attempt in range(8):
        try:
            data = urllib.request.urlopen(req, timeout=120).read()
            open(path, "wb").write(data)
            print(f"  tts {i + 1:03d}  {lines[i]['text'][:40]}", flush=True)
            return path
        except Exception as e:  # noqa
            print(f"  retry {i + 1}: {e}", flush=True)
            time.sleep(2 * (attempt + 1))
    raise SystemExit(f"TTS failed for line {i + 1}")


TEMPO = 1.05  # extra pace after generation (pitch preserved)


def decode(path, tempo=1.0):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", f"atempo={tempo}", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).copy()


def trim(x):
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same")
    on = np.where(env > 10 ** (-42 / 20))[0]
    if not len(on):
        return x
    a, b = max(0, on[0] - int(0.03 * SR)), min(len(x), on[-1] + int(0.08 * SR))
    y = x[a:b].copy()
    f = int(0.01 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y


with ThreadPoolExecutor(2) as ex:
    paths = list(ex.map(tts, range(len(lines))))

clips = []
for i, p in enumerate(paths):
    rec = os.path.join(ROOT, "rec", f"{i + 1:03d}.wav")
    if os.path.exists(rec):
        clips.append(trim(decode(rec)))
    elif os.path.exists(p):
        clips.append(trim(decode(p, TEMPO)))
    else:  # no key, no cache: silence sized like speech (~13 chars/s)
        clips.append(np.zeros(int(SR * max(1.5, len(lines[i]["text"]) / 13))))

t, out, scenes = LEAD, [], []
for i, (l, c) in enumerate(zip(lines, clips)):
    if i and l["scene"] != lines[i - 1]["scene"]:
        t += SCENE_GAP - GAP
    if not scenes or scenes[-1]["name"] != l["scene"]:
        if scenes: scenes[-1]["t1"] = round(t, 3)
        scenes.append({"name": l["scene"], "t0": round(t - (0 if i == 0 else SCENE_GAP / 2), 3)})
    d = len(c) / SR
    e = {"i": i, "scene": l["scene"], "text": l["text"], "t0": round(t, 3), "t1": round(t + d, 3), "sfx": l.get("sfx")}
    t += d + GAP
    if l.get("count"):
        e["count"] = {"t0": round(t, 3), "n": l["count"]}
        t += l["count"] + 0.25
    out.append(e)
total = round(t - GAP + TAIL, 3)
scenes[0]["t0"] = 0.0
scenes[-1]["t1"] = total

voice = np.zeros(int(total * SR) + SR, np.float32)
for e, c in zip(out, clips):
    a = int(e["t0"] * SR); voice[a:a + len(c)] += c
pk = np.abs(voice).max() or 1
voice = voice / pk * 10 ** (-3 / 20)
with wave.open(os.path.join(build, "voice.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(voice, -1, 1) * 32767).astype(np.int16).tobytes())

json.dump({"fps": 30, "width": 1920, "height": 1080, "total": total, "scenes": scenes, "lines": out},
          open(os.path.join(ROOT, "timeline.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)


def ts(x):
    ms = int(round(x * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


with open(os.path.join(ROOT, "masar-arduino-ep01.srt"), "w", encoding="utf8") as f:
    for k, e in enumerate(out):
        f.write(f"{k + 1}\n{ts(e['t0'])} --> {ts(e['t1'] + 0.25)}\n{e['text']}\n\n")

print(f"{len(out)} lines, total {total:.1f}s ({int(total // 60)}:{total % 60:04.1f})")
