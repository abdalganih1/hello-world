# الكهرباء ببساطة · الحلقة 04 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 4:22، ومبني بنفس محرك الحلقات السابقة.
حسب خطة الدورة (`../masar-course-plan.md`): المستوى 1، الكهرباء قبل أي قطعة خارجية. بدون تجربة بقطع حقيقية، كل شي بالمحاكاة والرسم.

| الملف | شو هو |
|---|---|
| `masar-arduino-ep04.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي كامل مع التوقيت |
| `masar-arduino-ep04.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**الأرقام:**
- **مثال قانون أوم:** 5V ÷ 1000Ω = 5mA.
- **اللغز:** 5V ÷ 0.020A = 250Ω.
- **كهرباء البيت:** 220V، متل ما هي بسوريا.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
