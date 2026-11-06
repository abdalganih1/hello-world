# صمّم · منصة بناء المواقع (نموذج أولي)

نموذج أولي لواجهة العميل ومحرك القوالب. كله ملفات ثابتة، بتنرفع كما هي على Cloudflare (Worker مع static assets أو Pages).

## الملفات

| الملف | شو فيه |
| --- | --- |
| `index.html` + `platform/` | واجهة المنصة: مربع الفكرة، بطاقات الأسئلة، شاشة التوليد، والمعاينة (كمبيوتر/موبايل) مع خطوات المراجعة والتشغيل التجريبي 3 أيام |
| `site.html` | بيعرض أي موقع من الإعدادات: `site.html?t=clinic&palette=luxe&name=...&off=pricing,faq` |
| `sections.html` | مكتبة كل الأقسام مع تبديل القالب والطابع: `sections.html?t=restaurant&palette=calm` |
| `templates/templates.js` | القوالب الثلاثة (مطعم، عيادة، شركة) بمحتواها وألوانها |
| `engine/sections.js` | 15 قسم: nav, hero (split/center), marquee, about, services, menu, process, gallery, team, testimonials, pricing, faq, cta, contact, footer |
| `engine/scenes.js` | مشاهد 3D للبطل: `petals` (زبدية وبتلات ياسمين)، `helix` (حلزون لامع)، `blob` (كتلة سائلة) |
| `engine/motion.js` | الحركة عند الانزلاق: عناوين كلمة كلمة، ظهور متتابع، بارالاكس، عدّادات، خطوات أفقية مثبتة، ميلان البطاقات، أزرار مغناطيسية |
| `engine/render.js` | بياخد الإعدادات وبيبني الصفحة |

## كيف بيشتغل الذكاء الاصطناعي لاحقاً

الذكاء الاصطناعي ما بيكتب HTML. بيرجّع JSON صغير، والمحرك بيبني منه الموقع:

```json
{ "t": "restaurant", "palette": "luxe", "name": "بيت الياسمين", "tagline": "...", "phone": "...", "whatsapp": "...", "off": ["pricing"] }
```

الخطوة الجاية: نوسّع هالـ JSON ليشمل نصوص كل قسم (`sections[].data`)، ونستبدل `chooseTemplate()` بـ `platform/platform.js` بطلب لـ Worker بيسأل Claude.

## التجربة محلياً

افتح `index.html` بالمتصفح مباشرة. المكتبات (Three.js r158 و GSAP 3.12.5) بتنحمّل من jsDelivr.

## النشر على كلاودفلير (مع الذكاء الاصطناعي)

الـ Worker (`worker/index.js`) بيخدم ملفات المنصة وفيه نقطتين:
`POST /api/write` (كتابة النصوص من فكرة الزبون) و`POST /api/edit` (التعديل بالكلمات).
الموديل بيرجّع JSON صغير بالأقسام اللي تغيّرت بس، والـ Worker بيتحقق منه قبل ما يرجعه.

```bash
cd site-builder
npx wrangler login
npx wrangler secret put AI_KEY        # الصق مفتاح مزودك هون، ما بينكتب بأي ملف
npx wrangler deploy
curl https://sammem.<حسابك>.workers.dev/api/health
```

- الرابط والموديل بـ `wrangler.jsonc` (`AI_BASE_URL` و`AI_MODEL`). الرابط لازم ينتهي بـ `/v1`.
- إذا مزودك وقف، الـ Worker بيرجع تلقائياً لـ Workers AI.
- للحد اليومي: `npx wrangler kv namespace create LIMITS` وحط رقمه بـ `wrangler.jsonc`.
