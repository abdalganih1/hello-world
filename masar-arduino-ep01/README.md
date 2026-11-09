# ما هو الأردوينو؟ · الحلقة 01 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps، MP4)، مدته حوالي 7:40، ومبني بالكامل بالكود:
- **الصورة:** أنيميشن Canvas2D، بيتصيّر إطار إطار بـ Chromium headless.
- **الصوت:** تعليق صوتي بـ ElevenLabs، وموسيقى ومؤثرات أصلية مولّدة بـ numpy.

| الملف | شو هو |
|---|---|
| `masar-arduino-ep01.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكربت كامل، مع شو بيظهر على الشاشة مع كل جملة، والتوقيت الحقيقي |
| `masar-arduino-ep01.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف مع الفصول، وفكرة الغلاف |
| `cover.png` | اقتراح غلاف |

## البنية

```
script/script.json     السكربت: {scene, text, tts?, sfx?, count?}
                       text = الترجمة على الشاشة · tts = نطق بديل للصوت · sfx = مؤثر مع الجملة · count = عدّ تنازلي
tools/build_audio.py   صوت ElevenLabs لكل جملة (مع cache بـ audio/cache) ← build/voice.wav + timeline.json + SRT
tools/music.py         موسيقى pad هادئة + مؤثرات + ducking تحت الكلام + تطبيع -14 LUFS ← build/soundtrack.wav
tools/export_docs.py   بيولّد script_and_scenes.md وقائمة الفصول من التوقيت الحقيقي
tools/sheet.py         بيجمع لقطات المراجعة بشبكات
index.html + js/       core.js (المحرك، الخلفية، الترجمة، الانتقالات) · art.js (اللوحة والأيقونات) · scenes.js (المشاهد الـ 12)
render.mjs             التصيير بـ 4 عمّال + ffmpeg
assets/fonts/          Cairo وJetBrains Mono
```

**المبدأ:** كل حركة مربوطة ببداية الجملة اللي بتحكي عنها (`L(k)` بـ `scenes.js`)، والتوقيت بييجي من `timeline.json`.
يعني إذا غيّرت جملة أو الصوت، بتشغّل `build_audio.py` وبيلحق الأنيميشن الصوت لحاله.

## التشغيل

```bash
pip install numpy scipy opencv-python-headless
ln -sfn "$(npm root -g)" node_modules              # playwright مثبّت global
export ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=...
python3 tools/build_audio.py      # الجمل الموجودة بالـ cache ما بتنطلب مرة تانية
python3 tools/music.py
python3 tools/export_docs.py
LINES=1 node render.mjs           # لقطة لكل جملة بـ build/stills للمراجعة (ثواني)
node render.mjs                   # الفيديو الكامل (حوالي 6 دقايق على 4 أنوية)
```

**تعديل جملة:** عدّل `script/script.json`، وبعدين شغّل الأوامر الأربعة. إذا تغيّر عدد الجمل بمشهد،
لازم تعدّل أرقام `L(k)` بنفس المشهد بـ `js/scenes.js`.

**تسجيل بصوتك بدل TTS:** حط `rec/001.wav` و`rec/002.wav`… (ملف لكل جملة، بنفس ترتيب `script.json`)،
وشغّل `build_audio.py`. كل ملف بياخد مكان جملته، وبينبني التوقيت والترجمة من جديد لحالهم.

## أشياء من عندي (بتقدر تغيّرها بسرعة)
- **محطات خريطة الدورة ومحتوى الحلقة 02** («أول كود وأول ضو بيرمش»): بـ `script.json` ومشهدي `map` و`teaser`.
- **الرسم:** لوحة Uno مرسومة بشكل عام، بدون شعار Arduino التجاري.
- **الأحجام:** Uno حوالي 68.6×53.4 ملم، وNano حوالي 45×18، وMega حوالي 101.6×53.3. مرسومين بنفس المقياس تقريباً.
- **السعر:** تركته عام («نسخ متوافقة بسعر قليل») بدون رقم.
