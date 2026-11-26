# المتغيرات · الحلقة 08 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 3:26، ومبني بنفس محرك الحلقات السابقة.
حسب خطة الدورة (`../masar-course-plan.md`): أول حلقة بالمستوى 2 (بالخطة رقمها 07، وبالفيديوهات 08 لأنو «اختبر نفسك 1» صارت الحلقة 07).
الفكرة الجوهرية: «المتغير صندوق إله اسم». والتجربة: إشارة المرور بالمتغيرات.

| الملف | شو هو |
|---|---|
| `masar-arduino-ep08.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي كامل مع التوقيت |
| `masar-arduino-ep08.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**الدقة:**
- رسالة المترجم حقيقية من avr-gcc: `error: assignment of read-only variable 'ledPin'`.
- `int` بـ Uno حجمه 16 بت: من −32768 لـ 32767. و`int t = 40000;` بيفيض (overflow).
- `5 / 2` بين عددين صحيحين بيعطي 2، و`5.0 / 2` بـ float بيعطي 2.5.
- جواب التحدي: 3000 / 4 = 750.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
