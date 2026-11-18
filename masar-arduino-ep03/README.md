# بيئة العمل وأول ضوء · الحلقة 03 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 4:51، ومبني بنفس محرك الحلقتين 01 و02.
حسب خطة الدورة (`../masar-course-plan.md`): أول تجربة، وأول 3 أوامر (`pinMode` و`digitalWrite` و`delay`).

| الملف | شو هو |
|---|---|
| `masar-arduino-ep03.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي كامل مع التوقيت |
| `masar-arduino-ep03.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**ملاحظة:** واجهة Arduino IDE وموقع المحاكي مرسومين كرسم توضيحي مبسّط، مو لقطة شاشة حقيقية.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
