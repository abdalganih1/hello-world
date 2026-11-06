/* صمّم · Worker
   - بيخدم ملفات المنصة (static assets)
   - POST /api/edit  : بياخد طلب الزبون بالكلمات + محتوى الموقع، وبيرجّع بس الأقسام اللي تغيّرت
   - POST /api/write : نفس الشي، بس لكتابة نصوص الموقع أول مرة من فكرة الزبون
   الموديل: مزود متوافق مع OpenAI (AI_BASE_URL + AI_MODEL + السر AI_KEY)، واحتياط Workers AI إذا فشل. */

const EDITABLE = ["hero", "marquee", "about", "services", "menu", "process", "gallery", "team", "testimonials", "pricing", "products", "craft", "showcase", "faq", "cta", "contact"];
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
function clean(v, depth = 0) {
  if (depth > 5) return undefined;
  if (typeof v === "string") return v.slice(0, 600);
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 12).map((x) => clean(x, depth + 1)).filter((x) => x !== undefined);
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v).slice(0, 30)) { const c = clean(x, depth + 1); if (c !== undefined) o[k] = c; } return o; }
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

async function callProvider(env, messages) {
  const base = (env.AI_BASE_URL || "").replace(/\/$/, "");
  if (!base || !env.AI_KEY) throw new Error("provider not configured");
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(base + "/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + env.AI_KEY },
      body: JSON.stringify(Object.assign({ model: env.AI_MODEL || "glm-5.3-flash", messages, temperature: 0.4, max_tokens: 6000 }, env.AI_NO_THINK === "1" ? { thinking: { type: "disabled" } } : {})),
    });
    if (!r.ok) throw new Error("provider " + r.status + ": " + (await r.text()).slice(0, 200));
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } finally { clearTimeout(timer); }
}
async function callWorkersAI(env, messages) {
  if (!env.AI) throw new Error("no workers ai binding");
  const d = await env.AI.run(env.FALLBACK_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages, max_tokens: 4000, temperature: 0.4 });
  return d.response;
}

// حد يومي لكل زائر (إذا في KV مربوط باسم LIMITS)
async function overLimit(env, req, kind) {
  if (!env.LIMITS) return false;
  const ip = req.headers.get("cf-connecting-ip") || "anon";
  const key = `${kind}:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const n = parseInt((await env.LIMITS.get(key)) || "0", 10);
  const max = parseInt(env[kind === "write" ? "DAILY_WRITES" : "DAILY_EDITS"] || (kind === "write" ? "5" : "20"), 10);
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
    try { const t = await callProvider(env, messages); return { out: extractJSON(t), via: "provider" }; }
    catch (e1) {
      console.warn("provider failed:", e1.message);
      try { return { out: extractJSON(await callWorkersAI(env, messages)), via: "workers-ai" }; }
      catch (e2) { console.warn("fallback failed:", e2.message); return { err: e1.message }; }
    }
  }));
  const ok = results.filter((r) => r.out);
  if (!ok.length) return json({ error: "ai unavailable", detail: results[0].err, reply: "الذكاء الاصطناعي مو متاح هلق، جرّب بعد شوي." }, 502);
  const merged = Object.assign({}, ok[0].out, { sections: ok.flatMap((r) => (Array.isArray(r.out.sections) ? r.out.sections : [])) });
  return json({ ...validate(merged, content), via: [...new Set(ok.map((r) => r.via))].join("+"), partial: ok.length < results.length });
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

async function serveSite(req, env, slug) {
  const url = new URL(req.url);
  // ملفات المحرك (engine/ templates/) بتنخدم من نفس الـ Worker
  if (url.pathname !== "/" && url.pathname !== "/index.html") {
    if (/^\/(engine|templates|media)\//.test(url.pathname)) return env.ASSETS.fetch(req);
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
  const img = (s) => typeof s === "string" && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(s);
  if (img(c.logo)) out.logo = c.logo;
  if (Array.isArray(c.images)) out.images = c.images.filter(img).slice(0, 6);
  if (c.content && typeof c.content === "object") { out.content = {}; for (const [k, v] of Object.entries(c.content)) if (EDITABLE.includes(k)) out.content[k] = clean(v); }
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
  try { out = extractJSON(await callProvider(env, messages)); }
  catch (e1) { try { out = extractJSON(await callWorkersAI(env, messages)); } catch (e2) { out = null; } }
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
  const days = parseInt(env.TRIAL_DAYS || "3", 10);
  const rec = { slug, owner, status: "live", liveUntil: old?.liveUntil && old.status === "live" ? old.liveUntil : Date.now() + days * DAY, approvedAt: old?.approvedAt || Date.now(), moderation: { state: "checking" }, contact, idea: String(b.idea || "").slice(0, 800), cfg: cleanCfg(b.cfg), created: old?.created || Date.now(), updated: Date.now(), ip: req.headers.get("cf-connecting-ip") || "" };
  await putSite(env, rec);
  // المراجعة بالذكاء الاصطناعي بالخلفية: الموقع بينفتح فوراً، وإذا طلع مخالف بيتوقف
  if (ctx) ctx.waitUntil(moderate(env, slug).catch((e) => console.warn("moderation failed:", e.message)));
  return json({ ok: true, slug, owner, url: `https://${slug}.${env.SITE_DOMAIN}`, liveUntil: rec.liveUntil, days });
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
      if (act === "delete") await env.SITES.delete(siteKey(slug)); else await putSite(env, rec);
    }
    return Response.redirect(`${url.origin}/admin?key=${encodeURIComponent(key)}`, 303);
  }
  const list = []; let cursor;
  do { const r = await env.SITES.list({ prefix: "sites/", cursor }); for (const o of r.objects) { const x = await env.SITES.get(o.key); if (x) list.push(await x.json()); } cursor = r.truncated ? r.cursor : null; } while (cursor && list.length < 500);
  const pri = (r) => (r.status === "flagged" ? -2 : r.status === "pending" ? -1 : 0); list.sort((a, b) => pri(a) - pri(b) || b.updated - a.updated);
  const mod = (r) => !r.moderation ? "" : r.moderation.state === "ok" ? "<br><small>✓ الذكاء الاصطناعي: مقبول</small>" : r.moderation.state === "flagged" ? `<br><small>⚠ الذكاء الاصطناعي: ${escH(r.moderation.reason)}</small>` : r.moderation.state === "checking" ? "<br><small>… عم يتراجع</small>" : "<br><small>؟ المراجعة ما اشتغلت</small>";
  const st = (r) => (r.status === "flagged" ? "⚠ موقوف تلقائياً" : r.paid && r.status === "live" ? "★ معتمد لـ " + new Date(r.liveUntil).toISOString().slice(0, 10) : r.status === "pending" ? "⏳ بانتظار المراجعة" : r.status === "rejected" ? "✗ مرفوض" : Date.now() > r.liveUntil ? "⌛ منتهي" : "● تجريبي لـ " + new Date(r.liveUntil).toISOString().slice(0, 16).replace("T", " ")) + mod(r);
  const btn = (r, act, label, cls = "") => `<form method="post" style="display:inline"><input type="hidden" name="slug" value="${escH(r.slug)}"><input type="hidden" name="act" value="${act}"><button class="${cls}">${label}</button></form>`;
  const rows = list.map((r) => `<tr><td><a href="https://${escH(r.slug)}.${escH(env.SITE_DOMAIN)}" target="_blank">${escH(r.slug)}</a><br><small>${escH(r.cfg.name)}</small></td><td>${escH(r.contact)}</td><td><small>${escH(r.idea)}</small></td><td>${st(r)}</td><td>
    <a href="/admin/preview?key=${encodeURIComponent(key)}&s=${encodeURIComponent(r.slug)}" target="_blank">معاينة</a>
    ${r.status !== "live" ? btn(r, "approve", "وافق وشغّل 3 أيام", "ok") : ""} ${r.status === "live" ? btn(r, "paid", "اعتمد (سنة بلا شريط)", "ok") + btn(r, "extend", "+30 يوم") + btn(r, "stop", "أوقف") : ""} ${r.status !== "rejected" ? btn(r, "reject", "ارفض") : btn(r, "delete", "احذف")}</td></tr>`).join("");
  return page("مراجعة المواقع", `<div class="c wide"><h1>مراجعة المواقع (${list.length})</h1><table><tr><th>العنوان</th><th>التواصل</th><th>الفكرة</th><th>الحالة</th><th></th></tr>${rows || '<tr><td colspan="5">ما في مواقع لسا.</td></tr>'}</table></div>`);
}

async function adminPreview(req, env, url) {
  if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) return new Response("forbidden", { status: 403 });
  const rec = await getSite(env, (url.searchParams.get("s") || "").toLowerCase());
  if (!rec) return new Response("not found", { status: 404 });
  const html = await (await env.ASSETS.fetch(new Request(new URL("/site.html", url)))).text();
  return new Response(html.replace("<main id=\"site\"></main>", `<main id="site"></main><script>window.SAMMEM_SITE=${JSON.stringify(rec.cfg).replace(/</g, "\\u003c")};</script>`), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
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
        return serveSite(req, env, sub);
      }
    }
    if (url.pathname === "/admin") return handleAdmin(req, env, url);
    if (url.pathname === "/admin/preview") return adminPreview(req, env, url);
    if (req.method === "POST" && url.pathname === "/api/submit") return handleSubmit(req, env, ctx);
    if (url.pathname === "/api/slug") return handleSlug(url, env);
    if (url.pathname === "/api/health") return json({ ok: true, domain: env.SITE_DOMAIN, storage: !!env.SITES, model: env.AI_MODEL || "glm-5.3-flash", provider: !!(env.AI_BASE_URL && env.AI_KEY), fallback: !!env.AI });
    if (req.method === "POST" && url.pathname === "/api/edit") return handleAI(req, env, "edit");
    if (req.method === "POST" && url.pathname === "/api/write") return handleAI(req, env, "write");
    if (url.pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(req);
  },
};

export { extractJSON, validate };
