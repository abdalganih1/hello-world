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

## النشر على كلاودفلير (منشور حالياً)

- المنصة: https://build.md2.dev (ونفسها على https://sammem.abdalganih1.workers.dev)
- مواقع الزبائن: `https://<العنوان>.md2.dev` ، Worker واحد (`sammem`) على المسار `*.md2.dev/*` مع سجل DNS `*` (AAAA 100:: مع البروكسي).
- md2.dev نفسه و`www` ما بيتأثروا: الجذر عليه Worker تاني (`md2-edge`)، و`www` بيتحوّل للجذر.

### دورة الموقع

1. الزبون بيكتب فكرته، بيجاوب البطاقات، والذكاء الاصطناعي بيكتب النصوص (`POST /api/write`، طلبات متوازية لكل قسمين).
2. بيعدّل بالكلمات (`POST /api/edit`)، بيختار العنوان ورقم واتساب، وبيضغط «أرسل للمراجعة» (`POST /api/submit`).
3. الموقع بينحفظ بـ R2 (`sammem-sites/sites/<العنوان>.json`) بحالة pending، والعنوان بيعرض «قيد المراجعة».
4. لوحة المراجعة: `https://build.md2.dev/admin?key=ADMIN_KEY` : معاينة، موافقة (تشغيل 3 أيام)، +30 يوم، إيقاف، رفض، حذف.
5. بعد 3 أيام العنوان بيعرض «انتهت الفترة التجريبية، تواصل معنا».

### الإعداد

```bash
cd site-builder
npx wrangler secret put AI_KEY      # مفتاح مزود الذكاء الاصطناعي
npx wrangler secret put ADMIN_KEY   # مفتاح لوحة المراجعة
npx wrangler deploy
curl https://build.md2.dev/api/health
```

- الإعدادات بـ `wrangler.jsonc`: `AI_BASE_URL` و`AI_MODEL` و`AI_NO_THINK` (بيطفي التفكير بـ GLM فبيصير أسرع)، `SITE_DOMAIN`، `TRIAL_DAYS`، `CONTACT_URL`.
- إذا مزودك وقف، الـ Worker بيرجع تلقائياً لـ Workers AI.
- الحد اليومي لكل زائر بـ KV (`LIMITS`): 5 كتابات و20 تعديل.
