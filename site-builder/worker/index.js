/* صمّم · Worker
   - بيخدم ملفات المنصة (static assets)
   - POST /api/edit  : بياخد طلب الزبون بالكلمات + محتوى الموقع، وبيرجّع بس الأقسام اللي تغيّرت
   - POST /api/write : نفس الشي، بس لكتابة نصوص الموقع أول مرة من فكرة الزبون
   الموديل: Z.ai مباشرة (السر ZAI_API_KEY)، واحتياط OpenRouter أو المزود القديم. بدون Workers AI. */

const EDITABLE = ["hero", "marquee", "about", "services", "menu", "process", "gallery", "team", "testimonials", "pricing", "products", "craft", "showcase", "faq", "cta", "contact"];
// الأقسام اللي بتنحفظ بمحتوى الموقع (الذكاء الاصطناعي ما بيعدّل catalog، بس لوحة الإدارة)
const CONTENT_TYPES = () => [...EDITABLE, "catalog"];
const PALETTES = ["luxe", "calm", "bold", "olive", "sea", "rose", "sand", "night", "ruby"];
const ICONS = ["leaf", "fire", "truck", "party", "tooth", "spark", "shield", "heart", "child", "calendar", "code", "pen", "chart", "cart", "megaphone", "rocket"];

const SYSTEM = `إنت محرر مواقع بمنصة "صمّم". بيوصلك محتوى موقع كـ JSON وطلب من صاحب الموقع.
رجّع JSON فقط، بدون أي شرح وبدون علامات \`\`\`، بهالشكل:
{"reply":"جملة قصيرة بالعامية الشامية بتقول شو غيّرت","palette":"(اختياري)","brand":{"name":"(اختياري)","tagline":"(اختياري)"},"sections":[{"type":"...","data":{...}}],"off":["(اختياري) أنواع أقسام بدها تنطفى"],"on":["(اختياري) أنواع أقسام بدها ترجع"]}
القواعد:
- رجّع بـ "sections" بس الأقسام اللي غيّرتها، وكل قسم برجع بالـ data كاملة بنفس شكل المفاتيح الموجودة.
- ممنوع تخترع أنواع أقسام جديدة. الأنواع المسموحة: ${EDITABLE.join(", ")}.
- الطوابع المسموحة لـ palette: ${PALETTES.join(", ")} (luxe=فخم غامق، calm=هادي فاتح، bold=جريء).
- الأيقونات المسموحة لـ icon: ${ICONS.join(", ")}.
- اكتب بنفس لهجة ونبرة النص الأصلي، جمل قصيرة وواضحة، وبلا مبالغة.
- إذا الطلب مو ممكن (متل إضافة نوع قسم مو موجود، أو محتوى مخالف أو احتيالي)، ما تغيّر شي واشرح بـ reply.
- الأسعار: حافظ على العملة الموجودة، وإذا ما في أسعار لا تخترع.`;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function extractJSON(text) {
  if (!text) throw new Error("empty");
  const t = String(text).replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("no json");
  return JSON.parse(t.slice(a, b + 1));
}

// تنظيف: نقبل بس المفاتيح والأنواع المعروفة، ونقص النصوص الطويلة
// lim: أكبر عدد عناصر بكل قائمة (الذكاء الاصطناعي 12، لوحة الإدارة أكتر حتى يضيف منتجاته كلها)
function clean(v, depth = 0, lim = 12) {
  if (depth > 5) return undefined;
  if (typeof v === "string") return v.slice(0, 600);
  if (typeof v === "number" || typeof v === "boolean") return Number.isFinite(v) || typeof v === "boolean" ? v : undefined;
  if (Array.isArray(v)) return v.slice(0, lim).map((x) => clean(x, depth + 1, lim)).filter((x) => x !== undefined);
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v).slice(0, 30)) { const c = clean(x, depth + 1, lim); if (c !== undefined) o[k] = c; } return o; }
  return undefined;
}
function validate(out, content) {
  const types = new Set((content.sections || []).map((s) => s.type));
  const res = { reply: typeof out.reply === "string" ? out.reply.slice(0, 300) : "تم." };
  if (PALETTES.includes(out.palette)) res.palette = out.palette;
  if (out.brand && typeof out.brand === "object") { res.brand = {}; ["name", "tagline"].forEach((k) => { if (typeof out.brand[k] === "string" && out.brand[k].trim()) res.brand[k] = out.brand[k].slice(0, 80); }); }
  res.sections = (Array.isArray(out.sections) ? out.sections : [])
    .filter((s) => s && EDITABLE.includes(s.type) && types.has(s.type) && s.data && typeof s.data === "object")
    .map((s) => {
      const data = clean(s.data);
      if (s.type === "services" && Array.isArray(data.items)) data.items.forEach((it) => { if (!ICONS.includes(it.icon)) it.icon = "spark"; });
      return { type: s.type, data };
    });
  ["off", "on"].forEach((k) => { if (Array.isArray(out[k])) res[k] = out[k].filter((t) => EDITABLE.includes(t)); });
  return res;
}

// كل طلبات الذكاء الاصطناعي بتمر عبر OpenRouter (متوافق مع OpenAI). الاحتياط موديلات تانية بنفس الطلب (models[]).
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// جسر مؤقت: إذا سر OPENROUTER_API_KEY لسا مو مضاف، منكمّل على مزودك القديم (AI_KEY). ما في Workers AI أبداً.
async function callLegacy(env, messages) {
  const base = (env.LEGACY_BASE_URL || "").replace(/\/$/, "");
  if (!base || !env.AI_KEY) throw new Error("legacy provider not configured");
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(base + "/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + env.AI_KEY },
      body: JSON.stringify({ model: env.LEGACY_MODEL || "glm-5.3-flash", messages, temperature: 0.4, max_tokens: 6000, thinking: { type: "disabled" } }),
    });
    if (!r.ok) throw new Error("legacy " + r.status + ": " + (await r.text()).slice(0, 200));
    return (await r.json()).choices?.[0]?.message?.content;
  } finally { clearTimeout(timer); }
}
async function callOpenRouter(env, messages) {
  const models = [env.AI_MODEL || "z-ai/glm-5.3-flash", ...String(env.AI_FALLBACK_MODELS || "").split(",").map((m) => m.trim()).filter(Boolean)].slice(0, 3);
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + env.OPENROUTER_API_KEY, "HTTP-Referer": "https://build." + (env.SITE_DOMAIN || "md2.dev"), "X-Title": "Sammem" },
      // GLM موديل تفكير وما بيقبل نطفي التفكير، فمنخليه بأقل حد ومنخفي نصه
      body: JSON.stringify({ models, messages, temperature: 0.4, max_tokens: 6000, reasoning: { effort: env.AI_REASONING || "minimal", exclude: true } }),
    });
    if (!r.ok) throw new Error("openrouter " + r.status + ": " + (await r.text()).slice(0, 200));
    const d = await r.json();
    if (d.error) throw new Error("openrouter: " + String(d.error.message || "").slice(0, 200));
    return d.choices?.[0]?.message?.content;
  } finally { clearTimeout(timer); }
}

// Z.ai مباشرة (متوافق مع OpenAI): GLM بدون وسيط
async function callZai(env, messages) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch((env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4").replace(/\/$/, "") + "/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + env.ZAI_API_KEY },
      body: JSON.stringify({ model: env.ZAI_MODEL || "glm-5.3-flash", messages, temperature: 0.4, max_tokens: 6000, thinking: { type: "disabled" } }),
    });
    if (!r.ok) throw new Error("zai " + r.status + ": " + (await r.text()).slice(0, 200));
    return (await r.json()).choices?.[0]?.message?.content;
  } finally { clearTimeout(timer); }
}

// الترتيب: Z.ai (إذا ZAI_API_KEY موجود) ← OpenRouter (إذا OPENROUTER_API_KEY موجود) ← مزودك القديم. ما في Workers AI أبداً.
function aiChain(env) {
  const c = [];
  if (env.ZAI_API_KEY) c.push(["zai", callZai]);
  if (env.OPENROUTER_API_KEY) c.push(["openrouter", callOpenRouter]);
  if (env.AI_KEY && env.LEGACY_BASE_URL) c.push(["legacy", callLegacy]);
  return c;
}
async function callAI(env, messages) {
  const chain = aiChain(env);
  if (!chain.length) throw new Error("no AI provider key set");
  let last;
  for (const [name, fn] of chain) {
    try { const t = await fn(env, messages); if (t) return t; last = new Error(name + ": empty"); }
    catch (e) { last = e; console.warn(name + " failed:", e.message); }
  }
  throw last;
}

// حد يومي لكل زائر (إذا في KV مربوط باسم LIMITS)
async function overLimit(env, req, kind) {
  if (!env.LIMITS) return false;
  const ip = req.headers.get("cf-connecting-ip") || "anon";
  const key = `${kind}:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const n = parseInt((await env.LIMITS.get(key)) || "0", 10);
  const max = kind === "plan" ? 40 : parseInt(env[kind === "write" ? "DAILY_WRITES" : "DAILY_EDITS"] || (kind === "write" ? "5" : "20"), 10);
  if (n >= max) return true;
  await env.LIMITS.put(key, String(n + 1), { expirationTtl: 90000 });
  return false;
}

async function handleAI(req, env, kind) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const content = body.content;
  const instruction = String(body.instruction || "").trim().slice(0, 800);
  if (!content || !Array.isArray(content.sections) || instruction.length < 2) return json({ error: "missing content or instruction" }, 400);
  if (JSON.stringify(content).length > 60000) return json({ error: "content too large" }, 413);
  if (await overLimit(env, req, kind)) return json({ error: "limit", reply: "وصلت للحد اليومي للتعديلات. جرّب بكرا أو تواصل معنا." }, 429);

  const askFor = (c) => (kind === "write"
    ? `هاد محتوى قالب جاهز. أعد كتابة نصوص كل الأقسام لتناسب مشروع الزبون، وحافظ على نفس شكل المفاتيح. ما تخترع أرقام هواتف أو عناوين.\nفكرة الزبون: ${instruction}\nاسم المشروع: ${body.name || ""}`
    : `طلب صاحب الموقع: ${instruction}`) + "\n\nالمحتوى الحالي:\n" + JSON.stringify(c);

  // الكتابة الأولى: منقسم الأقسام لمجموعات ومنبعتها بالتوازي (أسرع بكتير من طلب واحد طويل)
  const groups = [];
  if (kind === "write") { const S = content.sections; const n = 2; for (let i = 0; i < S.length; i += n) groups.push({ ...content, sections: S.slice(i, i + n) }); }
  else groups.push(content);

  const results = await Promise.all(groups.map(async (c, gi) => {
    const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: askFor(c) + (gi ? "\n(هاد جزء من الموقع، رجّع بس هالأقسام.)" : "") }];
    try { const t = await callAI(env, messages); return { out: extractJSON(t), via: "ai" }; }
    catch (e1) { console.warn("ai failed:", e1.message); return { err: e1.message }; }
  }));
  const ok = results.filter((r) => r.out);
  if (!ok.length) return json({ error: "ai unavailable", detail: results[0].err, reply: "الذكاء الاصطناعي مو متاح هلق، جرّب بعد شوي." }, 502);
  const merged = Object.assign({}, ok[0].out, { sections: ok.flatMap((r) => (Array.isArray(r.out.sections) ? r.out.sections : [])) });
  return json({ ...validate(merged, content), via: [...new Set(ok.map((r) => r.via))].join("+"), partial: ok.length < results.length });
}

/* ---------- فهم الفكرة: الذكاء الاصطناعي بيختار القالب والاسم والرابط ---------- */
const PLAN_SYSTEM = `إنت مساعد بمنصة مواقع. بيوصلك وصف الزبون لمشروعه وقائمة قوالب (كل قالب مع نوعه وأقسامه). افهم شو المشروع بالضبط، ورجّع JSON فقط بدون شرح:
{"options":[{"label":"نوع المشروع بكلماتك، دقيق ومحدد","examples":["4 لـ 6 أمثلة حقيقية عن اللي بيبيعه أو بيقدمه، كلمة أو كلمتين"],"t":"معرّف القالب الأنسب لهالفهم"}],"t":"معرّف القالب لأول خيار","sections":["الأقسام اللي بتناسب هالمشروع من أقسام القالب المختار"],"name":"اسم المشروع إذا ذكره الزبون وإلا اقترح اسم عربي قصير","slug":"رابط بأحرف إنكليزية صغيرة وأرقام و - (3-24 حرف)، ترجمة صوتية للاسم","tagline":"جملة قصيرة بالعامية الشامية بتوصف المشروع","fit":"high|low","why":"سبب قصير بالعربي بدون معرّفات القوالب"}
- اختار القالب حسب طبيعة الشغل: المحل اللي بيبيع منتجات بياخد قالب نوعه "متجر"، والأكل قالب "منيو"، والخدمات قالب "خدمات". لا تختار قالب خدمات لمتجر، ولا قالب أكل لمشروع مو أكل.
- إذا ما في قالب لنفس النشاط، اختار الأقرب بالنوع والشكل (مثلاً متجر أجهزة كهربائية أقرب لمتجر لابتوبات أو أدوات منزلية من شركة خدمات)، و fit=low.
- options إجبارية دايماً. فيها من 2 لـ 3 فهمات مختلفة للفكرة إذا الكلام بيحتمل أكتر من معنى، والأرجح أولاً. مثال: "متجر أدوات كهربائية" ممكن يعني أجهزة كهربائية منزلية (غسالات، برادات، مكيفات، أفران) أو مستلزمات تمديدات كهربائية (كوابل، قواطع، إنارة). إذا الفكرة واضحة، خيار واحد بيكفي.
- الأمثلة لازم تطابق كلام الزبون، وما تخلط بين الفهمات.`;
async function handlePlan(req, env) {
  let b; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const idea = String(b.idea || "").trim().slice(0, 600);
  const list = Array.isArray(b.templates) ? b.templates.slice(0, 40).map((t) => ({ id: String(t.id).slice(0, 30), label: String(t.label || "").slice(0, 60), kind: String(t.kind || "").slice(0, 20), sections: (t.sections || []).slice(0, 16).map(String).filter((x) => EDITABLE.includes(x)), keywords: (t.keywords || []).slice(0, 8).map(String) })) : [];
  if (idea.length < 3 || !list.length) return json({ error: "missing" }, 400);
  if (await overLimit(env, req, "plan")) return json({ error: "limit" }, 429);
  const messages = [{ role: "system", content: PLAN_SYSTEM }, { role: "user", content: "القوالب:\n" + list.map((t) => `${t.id}: ${t.label} [نوعه: ${t.kind || "-"}] (أقسامه: ${t.sections.join("، ")}) (${t.keywords.join("، ")})`).join("\n") + "\n\nوصف الزبون: " + idea }];
  let out; const via = "ai";
  try { out = extractJSON(await callAI(env, messages)); }
  catch (e1) { console.warn("plan ai failed:", e1.message); return json({ error: "ai unavailable" }, 502); }
  const ids = new Set(list.map((t) => t.id));
  const t = ids.has(out.t) ? out.t : "agency";
  const tSecs = new Set((list.find((x) => x.id === t) || {}).sections || []);
  const slug = String(out.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const strs = (a, n, len) => (Array.isArray(a) ? a : []).filter((x) => typeof x === "string" && x.trim()).slice(0, n).map((x) => x.trim().slice(0, len));
  const options = (Array.isArray(out.options) ? out.options : []).slice(0, 3).filter((o) => o && typeof o.label === "string" && o.label.trim())
    .map((o) => ({ label: o.label.trim().slice(0, 60), examples: strs(o.examples, 6, 30), t: ids.has(o.t) ? o.t : t }));
  return json({ t, options, label: options[0] ? options[0].label : "", examples: options[0] ? options[0].examples : [], sections: strs(out.sections, 16, 20).filter((x) => tSecs.has(x)),
    name: String(out.name || "").slice(0, 40), slug: slug.length >= 3 ? slug : "", tagline: String(out.tagline || "").slice(0, 120), fit: out.fit === "low" ? "low" : "high", why: String(out.why || "").slice(0, 160), via });
}

/* ---------- المواقع المنشورة: <slug>.SITE_DOMAIN من R2 ---------- */
const RESERVED = new Set(["www", "build", "app", "api", "admin", "mail", "email", "smtp", "ftp", "cdn", "static", "dashboard", "panel", "support", "help", "blog", "md2", "sammem", "test"]);
const DAY = 86400000;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const siteKey = (slug) => `sites/${slug}.json`;
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function getSite(env, slug) { const o = await env.SITES.get(siteKey(slug)); return o ? o.json() : null; }
const putSite = (env, rec) => env.SITES.put(siteKey(rec.slug), JSON.stringify(rec), { httpMetadata: { contentType: "application/json" } });

function page(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escH(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap">
<style>:root{color-scheme:light dark;--bg:#f6f3ee;--ink:#1b1a17;--mu:#6b665d;--card:#fff;--ac:#c2410c}@media(prefers-color-scheme:dark){:root{--bg:#121110;--ink:#f2efe9;--mu:#a39d93;--card:#1d1b19}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font-family:Tajawal,system-ui,sans-serif;padding:16px}
.c{background:var(--card);max-width:520px;width:100%;border-radius:20px;padding:32px;box-shadow:0 20px 60px #0002}h1{margin:0 0 8px;font-size:1.6rem}p{color:var(--mu);line-height:1.8;margin:.4em 0}a{color:var(--ac)}
table{width:100%;border-collapse:collapse;font-size:.92rem}td,th{padding:8px 6px;border-bottom:1px solid #8883;text-align:start;vertical-align:top}button{font:inherit;padding:6px 12px;border-radius:10px;border:1px solid #8886;background:transparent;color:inherit;cursor:pointer}button.ok{background:var(--ac);color:#fff;border:0}.wide{max-width:1100px}</style></head>
<body>${body}</body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
function contactLink(env, rec) {
  const msg = `مرحبا، بدي اعتمد موقعي ${rec.slug}.${env.SITE_DOMAIN} وبدي دومين خاص`;
  if (env.CONTACT_WA) return `https://wa.me/${String(env.CONTACT_WA).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  return env.CONTACT_URL || "#";
}
const CONTACT = (env) => env.CONTACT_URL ? `<p><a href="${escH(env.CONTACT_URL)}">تواصل معنا</a></p>` : "";

async function adminShell(env, url) {
  const r = await env.ASSETS.fetch(new Request(new URL("/site-admin/panel.html", url)));
  return new Response(await r.text(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "x-frame-options": "DENY", "referrer-policy": "same-origin" } });
}

async function serveSite(req, env, slug, ctx) {
  const url = new URL(req.url);
  // لوحة إدارة الموقع (لكل موقع لوحته، بكلمة سر جاهزة)
  if (url.pathname === "/admin" || url.pathname === "/admin/") return adminShell(env, url);
  if (url.pathname.startsWith("/admin/api/")) return handleSiteAdmin(req, env, ctx, slug, url);
  if (url.pathname.startsWith("/m/")) return serveMedia(env, slug, url.pathname.slice(3));
  // ملفات المحرك (engine/ templates/) بتنخدم من نفس الـ Worker
  if (url.pathname !== "/" && url.pathname !== "/index.html") {
    if (/^\/(engine|templates|media|site-admin)\//.test(url.pathname)) return env.ASSETS.fetch(req);
    return new Response("Not found", { status: 404 });
  }
  const rec = await getSite(env, slug);
  if (!rec || rec.status === "rejected") return page("الموقع غير موجود", `<div class="c"><h1>هالموقع مو موجود</h1><p>العنوان ${escH(slug)}.${escH(env.SITE_DOMAIN)} مو محجوز لأي موقع.</p></div>`, 404);
  if (rec.status === "flagged") return page("الموقع موقوف", `<div class="c"><h1>الموقع موقوف مؤقتاً</h1><p>المراجعة التلقائية لقت بالمحتوى شي لازم نتأكد منه. إذا إنت صاحب الموقع، تواصل معنا ومنحلها بسرعة.</p>${CONTACT(env)}</div>`, 451);
  if (rec.status === "pending") return page("قيد المراجعة", `<div class="c"><h1>الموقع قيد المراجعة</h1><p>«${escH(rec.cfg.name)}» وصلنا، وفريقنا عم يراجعه. رح ينفتح هون خلال 24 ساعة بالعادة.</p></div>`);
  if (rec.status === "live" && Date.now() > rec.liveUntil) return page("انتهت الفترة التجريبية", `<div class="c"><h1>انتهت الفترة التجريبية</h1><p>موقع «${escH(rec.cfg.name)}» خلص تشغيله التجريبي (3 أيام). إذا إنت صاحب الموقع، تواصل معنا لنكمّل ونحددلك التكلفة.</p>${CONTACT(env)}</div>`);
  const html = await (await env.ASSETS.fetch(new Request(new URL("/site.html", url)))).text();
  const trial = rec.paid ? "" : `<script>window.SAMMEM_TRIAL=${JSON.stringify({ until: rec.liveUntil, days: parseInt(env.TRIAL_DAYS || "3", 10), contact: contactLink(env, rec) }).replace(/</g, "\\u003c")};</script><script src="/engine/trial.js" defer></script>`;
  const inject = `<script>window.SAMMEM_SITE=${JSON.stringify(rec.cfg).replace(/</g, "\\u003c")};</script>` + trial;
  return new Response(html.replace("<main id=\"site\"></main>", "<main id=\"site\"></main>" + inject), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
}

function cleanCfg(c) {
  const out = {};
  ["t", "palette", "name", "tagline", "phone", "whatsapp", "email", "address", "hours"].forEach((k) => { if (typeof c[k] === "string") out[k] = c[k].slice(0, k === "tagline" ? 200 : 80); });
  if (Array.isArray(c.off)) out.off = c.off.filter((x) => typeof x === "string").slice(0, 20);
  if (Array.isArray(c.blank)) out.blank = c.blank.filter((x) => ["phone", "whatsapp", "email", "address", "hours", "tagline"].includes(x));
  const img = (s) => typeof s === "string" && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(s);
  if (img(c.logo)) out.logo = c.logo;
  if (Array.isArray(c.images)) out.images = c.images.filter(img).slice(0, 6);
  if (c.content && typeof c.content === "object") { out.content = {}; const ok = CONTENT_TYPES(); for (const [k, v] of Object.entries(c.content)) if (ok.includes(k)) out.content[k] = clean(v, 0, 150); }
  return out;
}

/* ---------- مراجعة المحتوى بالذكاء الاصطناعي ---------- */
const MOD_SYSTEM = `إنت مراجع محتوى لمنصة مواقع. بيوصلك نص موقع زبون. قرر إذا الموقع مقبول للنشر.
ارفض فقط إذا فيه: احتيال أو نصب (استثمار وهمي، أرباح مضمونة، انتحال جهة رسمية أو بنك أو علامة تجارية)، أو محتوى جنسي، أو مخدرات أو سلاح، أو قمار، أو كراهية وعنف، أو جمع بيانات بطاقات وكلمات سر.
المشاريع العادية (مطاعم، متاجر، خدمات، شركات) مقبولة حتى لو النص ضعيف.
رجّع JSON فقط: {"ok":true|false,"reason":"جملة قصيرة بالعربي"}`;
function siteText(rec) {
  const out = [rec.cfg.name, rec.cfg.tagline, rec.idea];
  const walk = (v) => { if (typeof v === "string") out.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(rec.cfg.content || {});
  return out.filter(Boolean).join("\n").slice(0, 8000);
}
async function moderate(env, slug) {
  const rec = await getSite(env, slug); if (!rec) return;
  const messages = [{ role: "system", content: MOD_SYSTEM }, { role: "user", content: `القالب: ${rec.cfg.t}\nالعنوان: ${slug}\n\n${siteText(rec)}` }];
  let out;
  try { out = extractJSON(await callAI(env, messages)); }
  catch (e1) { console.warn("review ai failed:", e1.message); out = null; }
  const cur = await getSite(env, slug); if (!cur || cur.updated !== rec.updated) return; // انعدّل بالنص، المراجعة الجاية بتغطيه
  if (!out) cur.moderation = { state: "error", at: Date.now() };
  else {
    cur.moderation = { state: out.ok === false ? "flagged" : "ok", reason: String(out.reason || "").slice(0, 200), at: Date.now() };
    if (out.ok === false) cur.status = "flagged";
  }
  await putSite(env, cur);
}

async function handleSubmit(req, env, ctx) {
  if (!env.SITES) return json({ error: "storage not configured" }, 500);
  const raw = await req.text();
  if (raw.length > 6_000_000) return json({ error: "too large", reply: "الصور كبيرة كتير، شيل كم صورة وجرّب." }, 413);
  let b; try { b = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }
  const slug = String(b.slug || "").toLowerCase().trim();
  if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return json({ error: "bad slug", reply: "العنوان لازم يكون أحرف إنكليزية صغيرة وأرقام و - (من 3 لـ 30)." }, 400);
  const contact = String(b.contact || "").trim().slice(0, 60);
  if (contact.replace(/\D/g, "").length < 7) return json({ error: "contact", reply: "اكتب رقم واتساب أو موبايل لنتواصل معك." }, 400);
  if (!b.cfg || typeof b.cfg !== "object" || !b.cfg.t) return json({ error: "bad cfg" }, 400);
  const old = await getSite(env, slug);
  if (old && old.status !== "rejected" && old.owner !== b.owner) return json({ error: "taken", reply: "هالعنوان محجوز، اختار غيره." }, 409);
  const owner = (old && old.owner === b.owner && b.owner) || crypto.randomUUID();
  const same = !!(old && old.owner === owner && old.status !== "rejected");
  const days = parseInt(env.TRIAL_DAYS || "3", 10);
  const cfg = cleanCfg(b.cfg);
  // اللي عدّله الزبون من لوحة الإدارة (منتجات، أصناف، أرقام...) ما بيرجع للقديم لما يعيد النشر من المنصة
  if (same && Array.isArray(old.adminKeys)) keepAdminEdits(cfg, old);
  const rec = { slug, owner, status: "live", liveUntil: same && old.liveUntil && old.status === "live" ? old.liveUntil : Date.now() + days * DAY, approvedAt: (same && old.approvedAt) || Date.now(), moderation: { state: "checking" }, contact, idea: String(b.idea || "").slice(0, 800), cfg, created: (same && old.created) || Date.now(), updated: Date.now(), ip: req.headers.get("cf-connecting-ip") || "",
    // لوحة إدارة الموقع: كلمة سر جاهزة بتنولّد مرة وحدة، والزبون ما بيقدر يغيّرها
    adminPass: (same && old.adminPass) || genPass(), adminKeys: (same && old.adminKeys) || [], adminUpdated: (same && old.adminUpdated) || 0, paid: !!(same && old.paid) };
  if (!rec.paid) delete rec.paid;
  await putSite(env, rec);
  // المراجعة بالذكاء الاصطناعي بالخلفية: الموقع بينفتح فوراً، وإذا طلع مخالف بيتوقف
  if (ctx) ctx.waitUntil(moderate(env, slug).catch((e) => console.warn("moderation failed:", e.message)));
  const url = `https://${slug}.${env.SITE_DOMAIN}`;
  return json({ ok: true, slug, owner, url, liveUntil: rec.liveUntil, days, admin: { url: url + "/admin", password: rec.adminPass } });
}

async function handleSlug(url, env) {
  const s = (url.searchParams.get("s") || "").toLowerCase();
  if (!SLUG_RE.test(s) || RESERVED.has(s)) return json({ ok: false, reason: "invalid" });
  const rec = env.SITES ? await getSite(env, s) : null;
  return json({ ok: !rec || rec.status === "rejected" || rec.owner === url.searchParams.get("o"), reason: rec ? "taken" : "" });
}

/* ---------- لوحة المراجعة: /admin?key=ADMIN_KEY ---------- */
async function handleAdmin(req, env, url) {
  const key = url.searchParams.get("key") || req.headers.get("x-admin-key") || "";
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return page("ممنوع", `<div class="c"><h1>ممنوع</h1><p>هالصفحة للإدارة بس.</p></div>`, 403);
  if (req.method === "POST") {
    const f = await req.formData(); const slug = String(f.get("slug")), act = String(f.get("act"));
    const rec = await getSite(env, slug);
    if (rec) {
      const days = parseInt(env.TRIAL_DAYS || "3", 10);
      if (act === "approve") Object.assign(rec, { status: "live", approvedAt: Date.now(), liveUntil: Date.now() + days * DAY });
      else if (act === "extend") Object.assign(rec, { status: "live", liveUntil: Math.max(Date.now(), rec.liveUntil || 0) + 30 * DAY });
      else if (act === "stop") Object.assign(rec, { liveUntil: Date.now() - 1, paid: false });
      else if (act === "paid") Object.assign(rec, { status: "live", paid: true, liveUntil: Date.now() + 366 * DAY });
      else if (act === "reject") rec.status = "rejected";
      else if (act === "newpass") rec.adminPass = genPass(); // بس من هون: الزبون ما بيقدر يغيّرها
      if (act === "delete") { await env.SITES.delete(siteKey(slug)); const m = await env.SITES.list({ prefix: `media/${slug}/`, limit: 1000 }); if (m.objects.length) await env.SITES.delete(m.objects.map((o) => o.key)); } else await putSite(env, rec);
    }
    return Response.redirect(`${url.origin}/admin?key=${encodeURIComponent(key)}`, 303);
  }
  const list = []; let cursor;
  do { const r = await env.SITES.list({ prefix: "sites/", cursor }); for (const o of r.objects) { const x = await env.SITES.get(o.key); if (x) list.push(await x.json()); } cursor = r.truncated ? r.cursor : null; } while (cursor && list.length < 500);
  // المواقع القديمة اللي انعملت قبل لوحة الإدارة: منولّدلها كلمة سر
  await Promise.all(list.filter((r) => !r.adminPass && r.status !== "rejected").map((r) => { r.adminPass = genPass(); return putSite(env, r); }));
  const pri = (r) => (r.status === "flagged" ? -2 : r.status === "pending" ? -1 : 0); list.sort((a, b) => pri(a) - pri(b) || b.updated - a.updated);
  const mod = (r) => !r.moderation ? "" : r.moderation.state === "ok" ? "<br><small>✓ الذكاء الاصطناعي: مقبول</small>" : r.moderation.state === "flagged" ? `<br><small>⚠ الذكاء الاصطناعي: ${escH(r.moderation.reason)}</small>` : r.moderation.state === "checking" ? "<br><small>… عم يتراجع</small>" : "<br><small>؟ المراجعة ما اشتغلت</small>";
  const st = (r) => (r.status === "flagged" ? "⚠ موقوف تلقائياً" : r.paid && r.status === "live" ? "★ معتمد لـ " + new Date(r.liveUntil).toISOString().slice(0, 10) : r.status === "pending" ? "⏳ بانتظار المراجعة" : r.status === "rejected" ? "✗ مرفوض" : Date.now() > r.liveUntil ? "⌛ منتهي" : "● تجريبي لـ " + new Date(r.liveUntil).toISOString().slice(0, 16).replace("T", " ")) + mod(r);
  const btn = (r, act, label, cls = "") => `<form method="post" style="display:inline"><input type="hidden" name="slug" value="${escH(r.slug)}"><input type="hidden" name="act" value="${act}"><button class="${cls}">${label}</button></form>`;
  const rows = list.map((r) => `<tr><td><a href="https://${escH(r.slug)}.${escH(env.SITE_DOMAIN)}" target="_blank">${escH(r.slug)}</a><br><small>${escH(r.cfg.name)}</small></td><td>${escH(r.contact)}${r.adminPass ? `<br><small><a href="https://${escH(r.slug)}.${escH(env.SITE_DOMAIN)}/admin" target="_blank">لوحة الزبون</a> · كلمة السر: <code dir="ltr">${escH(r.adminPass)}</code></small>${r.adminUpdated ? `<br><small>آخر تعديل من اللوحة: ${new Date(r.adminUpdated).toISOString().slice(0, 16).replace("T", " ")}</small>` : ""}` : ""}</td><td><small>${escH(r.idea)}</small></td><td>${st(r)}</td><td>
    <a href="/admin/preview?key=${encodeURIComponent(key)}&s=${encodeURIComponent(r.slug)}" target="_blank">معاينة</a>
    ${r.status !== "live" ? btn(r, "approve", "وافق وشغّل 3 أيام", "ok") : ""} ${r.status === "live" ? btn(r, "paid", "اعتمد (سنة بلا شريط)", "ok") + btn(r, "extend", "+30 يوم") + btn(r, "stop", "أوقف") : ""} ${r.status !== "rejected" ? btn(r, "reject", "ارفض") : btn(r, "delete", "احذف")} ${r.adminPass && r.status !== "rejected" ? btn(r, "newpass", "كلمة سر جديدة") : ""}</td></tr>`).join("");
  return page("مراجعة المواقع", `<div class="c wide"><h1>مراجعة المواقع (${list.length})</h1><table><tr><th>العنوان</th><th>التواصل</th><th>الفكرة</th><th>الحالة</th><th></th></tr>${rows || '<tr><td colspan="5">ما في مواقع لسا.</td></tr>'}</table></div>`);
}

async function adminPreview(req, env, url) {
  if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) return new Response("forbidden", { status: 403 });
  const rec = await getSite(env, (url.searchParams.get("s") || "").toLowerCase());
  if (!rec) return new Response("not found", { status: 404 });
  const html = await (await env.ASSETS.fetch(new Request(new URL("/site.html", url)))).text();
  return new Response(html.replace("<main id=\"site\"></main>", `<main id="site"></main><script>window.SAMMEM_SITE=${JSON.stringify(rec.cfg).replace(/</g, "\\u003c")};</script>`), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

/* ---------- لوحة إدارة موقع الزبون: https://<slug>.SITE_DOMAIN/admin ----------
   كل موقع إلو كلمة سر جاهزة (adminPass) بتنولّد وقت النشر وبتنعرض للزبون. ما في تغيير كلمة سر من اللوحة.
   الزبون بيدير منها: المنتجات والأصناف (أو المنيو)، الخدمات، الأسعار، الأسئلة، معلومات التواصل، الشعار والصور، وإظهار الأقسام. */
const PASS_ABC = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genPass() {
  let s = "";
  while (s.length < 12) for (const x of crypto.getRandomValues(new Uint8Array(24))) if (x < 220 && s.length < 12) s += PASS_ABC[x % PASS_ABC.length];
  return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
}
const INFO_KEYS = ["name", "tagline", "phone", "whatsapp", "email", "address", "hours", "logo", "images", "off", "blank"];
function keepAdminEdits(cfg, old) {
  for (const k of old.adminKeys) {
    if (k.startsWith("content.")) { const t = k.slice(8); if (old.cfg.content && old.cfg.content[t] !== undefined) { cfg.content = cfg.content || {}; cfg.content[t] = old.cfg.content[t]; } }
    else if (INFO_KEYS.includes(k)) { if (old.cfg[k] !== undefined) cfg[k] = old.cfg[k]; else delete cfg[k]; }
  }
}
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmac(env, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET || env.ADMIN_KEY || "sammem-dev"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
function eqSafe(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  if (x.length !== y.length) return false;
  return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(x, y) : x.every((v, i) => v === y[i]);
}
const COOKIE = "sm_admin";
const cookieOf = (req) => { const m = (req.headers.get("cookie") || "").match(/(?:^|;\s*)sm_admin=([^;]+)/); return m ? m[1] : ""; };
async function sessionOk(req, env, rec) {
  const [exp, sig] = cookieOf(req).split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return eqSafe(sig, await hmac(env, `${rec.slug}|${exp}|${rec.adminPass}`));
}
const MEDIA_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

async function handleSiteAdmin(req, env, ctx, slug, url) {
  const p = url.pathname.slice("/admin/api/".length);
  if (req.method === "POST" && req.headers.get("origin") && req.headers.get("origin") !== url.origin) return json({ error: "origin" }, 403);
  const rec = await getSite(env, slug);
  if (!rec || rec.status === "rejected") return json({ error: "no site", reply: "هالموقع مو موجود." }, 404);
  if (!rec.adminPass) { rec.adminPass = genPass(); await putSite(env, rec); }

  if (p === "login" && req.method === "POST") {
    const ip = req.headers.get("cf-connecting-ip") || "anon", lk = `login:${slug}:${ip}:${Math.floor(Date.now() / 900000)}`;
    const n = env.LIMITS ? parseInt((await env.LIMITS.get(lk)) || "0", 10) : 0;
    if (n >= 8) return json({ error: "limit", reply: "محاولات كتير. استنى ربع ساعة وجرّب." }, 429);
    let b; try { b = await req.json(); } catch { b = {}; }
    const pass = String(b.password || "").trim();
    // بنتجاهل الأحرف الكبيرة والصغيرة والشرطات والفراغات (كيبورد الموبايل بيكبّر أول حرف)
    const norm = (x) => String(x).replace(/[\s-]/g, "").toLowerCase();
    if (!eqSafe(norm(pass), norm(rec.adminPass))) {
      if (env.LIMITS) await env.LIMITS.put(lk, String(n + 1), { expirationTtl: 1000 });
      return json({ error: "wrong", reply: "كلمة السر غلط." }, 401);
    }
    const exp = Date.now() + 30 * DAY, val = `${exp}.${await hmac(env, `${slug}|${exp}|${rec.adminPass}`)}`;
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "set-cookie": `${COOKIE}=${val}; Path=/; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict` } });
  }
  if (p === "logout") return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` } });

  if (!(await sessionOk(req, env, rec))) return json({ error: "auth", reply: "سجّل دخول من جديد." }, 401);
  const days = parseInt(env.TRIAL_DAYS || "3", 10);

  if (p === "site" && req.method === "GET") {
    return json({ slug, url: url.origin, status: rec.status, liveUntil: rec.liveUntil, paid: !!rec.paid, days, cfg: rec.cfg, updated: rec.updated, contact: contactLink(env, rec) });
  }
  if (p === "save" && req.method === "POST") {
    if (rec.status === "flagged") return json({ error: "flagged", reply: "الموقع موقوف للمراجعة، تواصل معنا." }, 423);
    const raw = await req.text();
    if (raw.length > 1_500_000) return json({ error: "too large", reply: "البيانات كبيرة كتير." }, 413);
    let b; try { b = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }
    const inc = b.cfg && typeof b.cfg === "object" ? b.cfg : {};
    if (b.updated && rec.updated && b.updated !== rec.updated) return json({ error: "stale", reply: "الموقع انعدّل من مكان تاني. حدّث الصفحة وجرّب.", updated: rec.updated }, 409);
    const next = Object.assign({}, rec.cfg, { t: rec.cfg.t, palette: rec.cfg.palette });
    const touched = new Set(rec.adminKeys || []);
    for (const k of INFO_KEYS) if (k in inc) { next[k] = inc[k]; touched.add(k); }
    if (inc.content && typeof inc.content === "object") {
      next.content = Object.assign({}, rec.cfg.content || {});
      for (const [t, v] of Object.entries(inc.content)) if (CONTENT_TYPES().includes(t)) { next.content[t] = v; touched.add("content." + t); }
    }
    rec.cfg = cleanCfg(next);
    for (const k of ["logo", "images"]) if (k in inc && !inc[k]) delete rec.cfg[k];
    Object.assign(rec, { adminKeys: [...touched], adminUpdated: Date.now(), updated: Date.now(), moderation: { state: "checking" } });
    await putSite(env, rec);
    if (ctx) ctx.waitUntil(moderate(env, slug).catch((e) => console.warn("moderation failed:", e.message)));
    return json({ ok: true, updated: rec.updated, cfg: rec.cfg });
  }
  if (p === "upload" && req.method === "POST") {
    const type = (req.headers.get("content-type") || "").split(";")[0].trim();
    if (!MEDIA_TYPES[type]) return json({ error: "type", reply: "الصورة لازم تكون JPG أو PNG أو WEBP." }, 415);
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 2_500_000) return json({ error: "too large", reply: "الصورة كبيرة كتير." }, 413);
    if (buf.byteLength < 100) return json({ error: "empty" }, 400);
    const dk = `upl:${slug}:${new Date().toISOString().slice(0, 10)}`;
    if (env.LIMITS) { const n = parseInt((await env.LIMITS.get(dk)) || "0", 10); if (n >= 300) return json({ error: "limit", reply: "وصلت لحد رفع الصور اليوم." }, 429); await env.LIMITS.put(dk, String(n + 1), { expirationTtl: 90000 }); }
    const name = Date.now().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + "." + MEDIA_TYPES[type];
    await env.SITES.put(`media/${slug}/${name}`, buf, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } });
    return json({ ok: true, url: `${url.origin}/m/${name}` });
  }
  return json({ error: "not found" }, 404);
}

async function serveMedia(env, slug, file) {
  if (!/^[a-z0-9]+\.(webp|jpg|png)$/.test(file)) return new Response("Not found", { status: 404 });
  const o = await env.SITES.get(`media/${slug}/${file}`);
  if (!o) return new Response("Not found", { status: 404 });
  return new Response(o.body, { headers: { "content-type": o.httpMetadata?.contentType || "image/webp", "cache-control": "public, max-age=31536000, immutable", etag: o.httpEtag } });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const host = url.hostname.toLowerCase(), dom = (env.SITE_DOMAIN || "").toLowerCase();
    if (dom && host.endsWith("." + dom)) {
      const sub = host.slice(0, -dom.length - 1);
      if (sub === "www") return Response.redirect(`https://${dom}${url.pathname}${url.search}`, 301);
      if (!(env.PLATFORM_SUBS || "build").split(",").includes(sub)) {
        if (sub.includes(".")) return new Response("Not found", { status: 404 });
        return serveSite(req, env, sub, ctx);
      }
    }
    if (url.pathname === "/admin") return handleAdmin(req, env, url);
    if (url.pathname === "/admin/preview") return adminPreview(req, env, url);
    if (req.method === "POST" && url.pathname === "/api/submit") return handleSubmit(req, env, ctx);
    if (url.pathname === "/api/slug") return handleSlug(url, env);
    if (req.method === "POST" && url.pathname === "/api/plan") return handlePlan(req, env);
    if (url.pathname === "/api/health") return json({ ok: true, domain: env.SITE_DOMAIN, storage: !!env.SITES, providers: aiChain(env).map((p) => p[0]), model: env.ZAI_API_KEY ? (env.ZAI_MODEL || "glm-5.3-flash") : (env.AI_MODEL || "z-ai/glm-5.3-flash") });
    if (req.method === "POST" && url.pathname === "/api/edit") return handleAI(req, env, "edit");
    if (req.method === "POST" && url.pathname === "/api/write") return handleAI(req, env, "write");
    if (url.pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(req);
  },
};

export { extractJSON, validate };
