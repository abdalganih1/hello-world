/* دجانة: الواجهة الجديدة على نفس دومين المتجر.
   الملفات الثابتة (الصفحة، المحرك، الصور المصغّرة) من assets.
   كل شي تاني (لوحة الإدارة /admin، الـ API، صور المنتجات /img/<id>، الطلبات والإشعارات) بيروح للمتجر القديم dojana-store
   عبر service binding، فلوحة الإدارة بتضل شغالة متل ما هي. */
const BOT = /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|googlebot|bingbot/i;
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    // صفحة المنتج: /product/<id> بتفتح صفحة المنتج بالواجهة الجديدة (نفس الرابط، بينحفظ وبيتشارك).
    // روبوتات المعاينة (واتساب، فيسبوك...) بتاخد الصفحة القديمة لأن فيها صورة وعنوان المنتج جاهزين
    const m = u.pathname.match(/^\/product\/([\w-]+)\/?$/);
    if (m && req.method === "GET" && env.ASSETS && !BOT.test(req.headers.get("user-agent") || "") && !u.searchParams.has("old")) {
      const r = await env.ASSETS.fetch(new Request(new URL("/", u)));
      return new Response(r.body, { status: 200, headers: r.headers });
    }
    if (env.STORE) return env.STORE.fetch(req);
    return new Response("Not found", { status: 404 });
  },
};
