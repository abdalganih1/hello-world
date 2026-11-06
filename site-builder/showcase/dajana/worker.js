/* دجانة: الواجهة الجديدة على نفس دومين المتجر.
   الملفات الثابتة (الصفحة، المحرك، الصور المصغّرة) من assets.
   كل شي تاني (لوحة الإدارة /admin، الـ API، صور المنتجات /img/<id>، الطلبات والإشعارات) بيروح للمتجر القديم dojana-store
   عبر service binding، فلوحة الإدارة بتضل شغالة متل ما هي. */
const BOT = /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|googlebot|bingbot/i;
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    // رابط منتج قديم بيفتح نفس المنتج بالواجهة الجديدة (والمعاينات بالواتساب بتضل من الصفحة القديمة)
    const m = u.pathname.match(/^\/product\/([\w-]+)/);
    if (m && req.method === "GET" && !BOT.test(req.headers.get("user-agent") || "") && !u.searchParams.has("old")) return Response.redirect(`${u.origin}/?p=${m[1]}`, 302);
    if (env.STORE) return env.STORE.fetch(req);
    return new Response("Not found", { status: 404 });
  },
};
