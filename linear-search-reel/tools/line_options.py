"""Candidate readings for the lines the owner flagged (same setup as variant 10: owner's voice, eleven_v3, Damascene accent tag).
Each line -> one mp3 with the options in order, a soft beep between them.  Usage: python3 tools/line_options.py"""
import hashlib, json, os, subprocess, time, urllib.request
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100; KEY, ME = os.environ["ELEVENLABS_API_KEY"], os.environ["ELEVENLABS_VOICE_ID"]
TAG = "[Syrian Damascene accent] "
OPT = {
    "04_menftah": ["مْنِفتَح البطاقات وحدة وحدة، من الأوّل للآخِر.", "منِفْتَح البطاقات وحدة وحدة، من الأول للآخر.", "رح نفتح البطاقات وحدة وحدة، من الأول للآخر.", "خلّينا نفتح البطاقات وحدة وحدة، من الأول للآخر."],
    "12_iza_hu": ["إذا هوّي، وقّف. إذا لأ، كمّل عاللي بعدو.", "إزا هُوّي، وَقِّف. إزا لأ، كَمِّل عاللي بعدو.", "إذا طلع هوّي، وقّف. وإذا لأ، كمّل عاللي بعدو.", "إذا لقيتو، وقّف. وإذا لأ، كمّل عاللي بعدو."],
    "14_shart": ["وشَرْط بيْقارِن، وأوّل ما يلاقيه بيرجّع مكانو.", "وشرط بيقارِن، وأول ما يلاقيه بيرجّع مكانو.", "وفي شرط بيقارن، وأول ما يلاقيه بيرجّع مكانو.", "وشرط بيعمل مقارنة، وأول ما يلاقيه بيرجّع مكانو."],
}
cache = os.path.join(ROOT, "audio/variants_cache"); os.makedirs(cache, exist_ok=True)
def tts(text):
    p = os.path.join(cache, hashlib.sha1(json.dumps([TAG + text, "eleven_v3", ME]).encode()).hexdigest()[:12] + ".mp3")
    if not os.path.exists(p):
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{ME}?output_format=mp3_44100_128", data=json.dumps({"text": TAG + text, "model_id": "eleven_v3", "seed": 1001}, ensure_ascii=False).encode(), headers={"xi-api-key": KEY, "Content-Type": "application/json"})
        for k in range(8):
            try: open(p, "wb").write(urllib.request.urlopen(req, timeout=120).read()); break
            except Exception as e: print("retry", e); time.sleep(2 * (k + 1))
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
t = np.arange(int(0.12 * SR)) / SR; beep = (np.sin(2 * np.pi * 1320 * t) * np.exp(-t * 30) * 0.25).astype(np.float32); gap = np.zeros(int(0.7 * SR), np.float32)
md = ["# خيارات للجمل اللي فيها غلط", "", "كل ملف فيه 4 قراءات بالترتيب، وبين كل وحدة والتانية صفّارة صغيرة.", ""]
for name, opts in OPT.items():
    parts = [gap]
    for o in opts: x = tts(o); x = x / (np.abs(x).max() + 1e-9) * 0.85; parts += [x, gap, beep, gap]
    y = np.concatenate(parts); raw = os.path.join(cache, name + ".raw"); y.tofile(raw)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw, "-b:a", "128k", os.path.join(ROOT, f"voice/options/line{name}.mp3")], check=True)
    md += [f"## `line{name}.mp3`", ""] + [f"{i + 1}. {o}" for i, o in enumerate(opts)] + [""]; print("built", name)
open(os.path.join(ROOT, "voice/options/README.md"), "w", encoding="utf8").write("\n".join(md))
