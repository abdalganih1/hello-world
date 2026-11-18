# لغة الأردوينو · الحلقة 02 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 4:56، ومبني بنفس محرك الحلقة 01 (`../masar-arduino-ep01`).
الحلقة تمهيدية بدون تجارب، حسب خطة الدورة (`../masar-course-plan.md`): قواعد اللغة قبل أول تجربة.

| الملف | شو هو |
|---|---|
| `masar-arduino-ep02.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي كامل مع التوقيت |
| `masar-arduino-ep02.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**المشاهد (12):** الافتتاحية، والعنوان، وما هو البرنامج (وصفة الطبخ)، واللغة والمترجم، والقواعد (`;` والحروف)، و`setup`/`loop`،
والدالة `delay(1000)`، والتعليقات `//`، وقراءة برنامج Blink سطرًا سطرًا، واللغز، والخلاصة، والحلقة القادمة.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
