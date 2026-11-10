"""Builds several full narrations of the reel to compare by ear: same lines, one thing changed per version.
Usage: python3 tools/voice_variants.py      -> voice/variants/*.mp3 (+ README of what each one is)"""
import hashlib, json, os, subprocess, sys, time, urllib.request
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100
KEY, ME = os.environ["ELEVENLABS_API_KEY"], os.environ["ELEVENLABS_VOICE_ID"]
plain = [l.get("tts", l["text"]) for l in json.load(open(os.path.join(ROOT, "voice/script.json"), encoding="utf8"))["lines"]]
syr = json.load(open(os.path.join(ROOT, "voice/syrian.json"), encoding="utf8"))["lines"]
GEORGE, SARAH = "JBFqnCBsd6RMkjVDRZzb", "EXAVITQu4vr4xnSDxMaL"
V = [  # name, model, voice, texts, prefix tag, description
    ("1_current_v3_plain", "eleven_v3", ME, plain, "", "الحالي: صوتك + v3 + النص العادي"),
    ("2_v3_syrian_spelling", "eleven_v3", ME, syr, "", "صوتك + v3 + كتابة شامية (ق ← ء، إزا، ميت…)"),
    ("3_v3_syrian_excited", "eleven_v3", ME, syr, "[excited] ", "صوتك + v3 + كتابة شامية + أسلوب حماسي"),
    ("4_v3_syrian_warm", "eleven_v3", ME, syr, "[warm, calm, friendly] ", "صوتك + v3 + كتابة شامية + أسلوب هادي ودافي"),
    ("5_v2_syrian_spelling", "eleven_multilingual_v2", ME, syr, "", "صوتك + موديل multilingual_v2 + كتابة شامية"),
    ("6_v3_male_voice", "eleven_v3", GEORGE, syr, "", "صوت رجالي جاهز تاني + v3 + كتابة شامية"),
    ("7_v3_female_voice", "eleven_v3", SARAH, syr, "", "صوت نسائي جاهز + v3 + كتابة شامية"),
]
cache = os.path.join(ROOT, "audio/variants_cache"); os.makedirs(cache, exist_ok=True); outd = os.path.join(ROOT, "voice/variants"); os.makedirs(outd, exist_ok=True)
def tts(text, model, voice):
    p = os.path.join(cache, hashlib.sha1(json.dumps([text, model, voice]).encode()).hexdigest()[:12] + ".mp3")
    if os.path.exists(p): return p
    body = {"text": text, "model_id": model, "seed": 1001}
    if model == "eleven_multilingual_v2": body["voice_settings"] = {"stability": 0.5, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128", data=json.dumps(body, ensure_ascii=False).encode(), headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    for k in range(8):
        try: open(p, "wb").write(urllib.request.urlopen(req, timeout=120).read()); return p
        except Exception as e: print("  retry", e); time.sleep(2 * (k + 1))
    raise SystemExit("tts failed")
def pcm(p): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
def trim(x):
    e = np.convolve(np.abs(x), np.ones(441) / 441, "same"); on = np.where(e > 0.01)[0]
    return x[max(0, on[0] - 600):on[-1] + 2600] if len(on) else x
readme = ["# نسخ صوتية للمقارنة", "", "كل نسخة فيها الريل كامل (19 جملة بنفس الترتيب)، وكل وحدة بتغيّر شغلة وحدة عن اللي قبلها.", "", "| الملف | شو فيه |", "|---|---|"]
for name, model, voice, texts, tag, desc in V:
    parts = []
    for i, t in enumerate(texts):
        parts.append(trim(pcm(tts(tag + t, model, voice)))); parts.append(np.zeros(int(SR * (0.6 if i in (1, 3, 8, 9, 11, 13, 16) else 0.35)), np.float32))
    x = np.concatenate(parts); x = x / (np.abs(x).max() + 1e-9) * 0.89
    raw = os.path.join(cache, name + ".raw"); x.astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "128k", os.path.join(outd, name + ".mp3")], check=True)
    readme.append(f"| `{name}.mp3` | {desc} |"); print("built", name, f"{len(x) / SR:.0f}s", flush=True)
open(os.path.join(outd, "README.md"), "w", encoding="utf8").write("\n".join(readme) + "\n")
