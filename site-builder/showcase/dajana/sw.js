/* دجانة: تخزين مؤقت حتى يفتح الموقع بسرعة وكأنه تطبيق */
const V = "dajana-v6";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(["./", "products.js", "dajana.js"]).catch(() => {}))); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  const cacheable = u.origin === location.origin || /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if (!cacheable) return;
  // الصفحة: الشبكة أولاً. الباقي: من التخزين فوراً مع تحديث بالخلفية
  // الصفحة وملفات الموقع نفسه (js/css): الشبكة أولاً حتى أي تحديث يبين فوراً، والتخزين بس إذا ما في نت
  if (r.mode === "navigate" || (u.origin === location.origin && /\.(js|css)$/.test(u.pathname))) { e.respondWith(fetch(r).then((res) => { caches.open(V).then((c) => c.put(r, res.clone())); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || caches.match("./")))); return; }
  e.respondWith(caches.match(r).then((m) => { const net = fetch(r).then((res) => { if (res.ok || res.type === "opaque") caches.open(V).then((c) => c.put(r, res.clone())); return res; }).catch(() => m); return m || net; }));
});
