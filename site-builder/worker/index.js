/* صمّم · Worker
   - بيخدم ملفات المنصة (static assets)
   - POST /api/edit  : بياخد طلب الزبون بالكلمات + محتوى الموقع، وبيرجّع بس الأقسام اللي تغيّرت
   - POST /api/write : نفس الشي، بس لكتابة نصوص الموقع أول مرة من فكرة الزبون
   الموديل: مزود متوافق مع OpenAI (AI_BASE_URL + AI_MODEL + السر AI_KEY)، واحتياط Workers AI إذا فشل. */

const EDITABLE = ["hero", "marquee", "about", "services", "menu", "process", "gallery", "team", "testimonials", "pricing", "faq", "cta", "contact"];
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
      body: JSON.stringify({ model: env.AI_MODEL || "glm-5.3-flash", messages, temperature: 0.4, max_tokens: 4000 }),
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

  const ask = kind === "write"
    ? `هاد محتوى قالب جاهز. أعد كتابة نصوص كل الأقسام لتناسب مشروع الزبون، وحافظ على نفس شكل المفاتيح. ما تخترع أرقام هواتف أو عناوين.\nفكرة الزبون: ${instruction}\nاسم المشروع: ${body.name || ""}`
    : `طلب صاحب الموقع: ${instruction}`;
  const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: ask + "\n\nالمحتوى الحالي:\n" + JSON.stringify(content) }];

  let text, via = "provider";
  try { text = await callProvider(env, messages); extractJSON(text); }
  catch (e1) {
    console.warn("provider failed:", e1.message);
    try { text = await callWorkersAI(env, messages); via = "workers-ai"; }
    catch (e2) { return json({ error: "ai unavailable", detail: e1.message, reply: "الذكاء الاصطناعي مو متاح هلق، جرّب بعد شوي." }, 502); }
  }
  try { return json({ ...validate(extractJSON(text), content), via }); }
  catch { return json({ error: "bad ai output", reply: "ما فهمت الطلب منيح، جرّب تكتبه بطريقة تانية." }, 502); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") return json({ ok: true, model: env.AI_MODEL || "glm-5.3-flash", provider: !!(env.AI_BASE_URL && env.AI_KEY), fallback: !!env.AI });
    if (req.method === "POST" && url.pathname === "/api/edit") return handleAI(req, env, "edit");
    if (req.method === "POST" && url.pathname === "/api/write") return handleAI(req, env, "write");
    if (url.pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(req);
  },
};

export { extractJSON, validate };
