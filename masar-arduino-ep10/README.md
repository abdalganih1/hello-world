# دوالك الخاصة · الحلقة 10 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 3:43، ومبني بنفس محرك الحلقات السابقة.
حسب خطة الدورة (`../masar-course-plan.md`): المستوى 2 (بالخطة رقمها 09). الفكرة الجوهرية: «قسّم الكود لأوامر إلها أسماء». والتجربة: ضو SOS بإشارة مورس، على الضو L (القطب 13) وبدون أي قطع.

| الملف | شو هو |
|---|---|
| `masar-arduino-ep10.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي كامل مع التوقيت |
| `masar-arduino-ep10.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**توقيت المورس الصحيح (وحدة = 200ms):**
- النقطة: 1 وحدة ضو، وبعدها 1 وحدة عتمة.
- الشحطة: 3 وحدات ضو.
- بين الحروف: 3 وحدات (200 + 400).
- بين الكلمات: 7 وحدات (1400).

والضو بالفيديو ماشي على نفس هالتوقيت.

**رسالة المترجم حقيقية:** `error: too few arguments to function 'void flash(int)'`.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
