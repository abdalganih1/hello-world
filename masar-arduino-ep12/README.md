# اختبر نفسك: المستوى 2 · الحلقة 12 · أردوينو من الصفر · منصة مسار

فيديو تعليمي أفقي (1920×1080، 30fps)، مدته حوالي 3:15، ومبني بنفس محرك الحلقات السابقة.
هي حلقة «★ اختبر نفسك 2» من خطة الدورة (`../masar-course-plan.md`)، ومشروعها «جرس باب بلحن».

| الملف | شو هو |
|---|---|
| `masar-arduino-ep12.mp4` | الفيديو النهائي |
| `script_and_scenes.md` | السكريبت الصوتي (⏳ عدّاد، 🔊 أنغام مسموعة) |
| `masar-arduino-ep12.srt` | الترجمة المتزامنة |
| `publishing.md` | 3 عناوين، والوصف، والفصول |

**الأجوبة:** 3 · 5 مرات · 330 · 12 · Passive. **واللغز:** `i < 7` بيوقف قبل القطب 7، والحل `i <= 7`.

**المشروع:**
- النغمات: 659 · 523 · 587 · 392 · 392 · 587 · 659 · 523، كل نغمة 400ms، وبعدها `delay(d + 50)`.
- اللحن جوّا `setup`، فبينعزف مرة وحدة عند التشغيل، و`loop` فاضية. الزر بيجي بالمستوى 3.
- البازر السلبي على القطب 8، مع مقاوم 100Ω.

**التوليد:**
```bash
export VIBI_API_KEY=...
THREADS=5 python3 tools/vibi_voice.py --field fusha --takes 1
TEMPO=1.1 VOICE_SRC=fusha python3 tools/build_audio.py && python3 tools/music.py
ln -sfn /opt/node22/lib/node_modules node_modules && node render.mjs
```
