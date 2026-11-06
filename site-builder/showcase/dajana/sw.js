/* دجانة: تخزين بالمتصفح من أول زيارة حتى الموقع يفتح فوراً، والرجوع للخلف ما يستنى تحميل */
const V = "dajana-v7";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(["/"]).catch(() => {}))); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
const put = (key, res) => { if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(V).then((c) => c.put(key, cp)); } return res; };
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (same && /^\/(api|admin)\b/.test(u.pathname)) return; // المتجر ولوحة الإدارة دايماً من الشبكة
  if (!same && !/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host)) return;
  // الصفحة: الرئيسية وكل صفحات المنتجات هي نفس الملف، فبتنفتح فوراً من المخزّن وبتتحدّث بالخلفية للمرة الجاية
  if (r.mode === "navigate") {
    const key = /^\/(product\/[\w-]+\/?)?$/.test(u.pathname) ? "/" : r;
    e.respondWith(caches.match(key, { ignoreSearch: true }).then((m) => { const net = fetch(r).then((res) => put(key, res)).catch(() => m); if (m) { e.waitUntil(net); return m; } return net; }));
    return;
  }
  // الباقي (ملفات بنسخة ?v=، صور، خطوط، مكتبات): من المخزّن فوراً، ومن الشبكة إذا مش موجود
  e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => put(r, res))));
});
