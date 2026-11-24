/* صمّم · لوحة إدارة موقع الزبون (https://<العنوان>.md2.dev/admin)
   الدخول بكلمة سر جاهزة وصلت للزبون وقت النشر (ما بتتغير من هون).
   بيدير: المنتجات والأصناف (أو المنيو)، الخدمات، الأسعار، الأسئلة، الآراء، من نحنا، معلومات المحل، الشعار والصور، وإظهار الأقسام.
   البيانات بتنحفظ بـ cfg الموقع نفسه (content.<نوع القسم>)، والموقع بيتحدّث فوراً. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
  const app = $("#app");
  const API = "/admin/api/";
  const host = location.hostname;
  const I = {
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  };
  const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  let toastT = 0;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }
  async function api(path, opt = {}) {
    const r = await fetch(API + path, Object.assign({ credentials: "same-origin" }, opt));
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== "login") { showLogin("انتهت الجلسة، فوت من جديد."); throw new Error("auth"); }
    if (!r.ok) { const e = new Error(d.reply || "صار خطأ، جرّب كمان مرة."); e.status = r.status; e.data = d; throw e; }
    return d;
  }

  /* ---------- الدخول ---------- */
  function showLogin(err = "") {
    app.innerHTML = `<div class="login"><form autocomplete="on">
      <span class="mark">${esc((host.split(".")[0][0] || "S").toUpperCase())}</span>
      <div><h1>لوحة إدارة موقعك</h1><p class="host">${esc(host)}</p></div>
      <p>اكتب كلمة السر اللي وصلتك لما نشرت موقعك. منها بتضيف أصنافك ومنتجاتك وأسعارك، وبتعدّل معلومات محلك.</p>
      <input type="text" name="username" value="${esc(host)}" autocomplete="username" hidden>
      <label class="f"><span>كلمة السر</span><input name="password" type="password" dir="ltr" autocomplete="current-password" required autofocus placeholder="xxxx-xxxx-xxxx"></label>
      <button class="btn pri" type="submit">ادخل</button>
      <p class="err" role="alert">${esc(err)}</p>
      <p style="font-size:13px">كلمة السر ثابتة وما بتتغير. إذا ضاعت منك تواصل معنا.</p>
    </form></div>`;
    const f = $("form", app);
    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = $("button", f); b.disabled = true; b.textContent = "لحظة…"; $(".err", f).textContent = "";
      try { await api("login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: f.password.value }) }); await load(); }
      catch (er) { b.disabled = false; b.textContent = "ادخل"; $(".err", f).textContent = er.message; f.password.select(); }
    };
  }

  /* ---------- الحالة ---------- */
  const S = { site: null, cfg: null, base: null, data: {}, dirty: new Set(), tab: "", catType: "", cat: null, filter: "*", q: "" };
  const T = () => window.SAMMEM_TEMPLATES || {};
  const baseSec = (type) => (S.base.sections || []).find((s) => s.type === type);
  const has = (type) => !!baseSec(type);
  // البيانات الفعلية للقسم = بيانات القالب + تعديلات الموقع (متل ما بيعمل المُصيِّر)
  function data(type) {
    if (!S.data[type]) S.data[type] = clone(Object.assign({}, (baseSec(type) || {}).data || {}, (S.cfg.content || {})[type] || {}));
    return S.data[type];
  }
  function touch(key) { S.dirty.add(key); saveBar(); }
  const brand = (k) => (S.cfg[k] ? S.cfg[k] : (S.cfg.blank || []).includes(k) ? "" : (S.base.brand || {})[k] || "");

  async function load() {
    app.innerHTML = '<div class="boot"><span class="spin"></span></div>';
    const d = await api("site");
    S.site = d; S.cfg = d.cfg || {}; S.data = {}; S.dirty.clear();
    S.base = T()[S.cfg.t] || T()[Object.keys(T())[0]];
    const pal = (S.base.palettes || {})[S.cfg.palette] || (S.base.palettes || {})[S.base.defaultPalette] || {};
    if (pal.accent) { document.documentElement.style.setProperty("--accent", pal.accent); document.documentElement.style.setProperty("--on-accent", pal.onAccent || "#fff"); }
    S.catType = ["catalog", "products", "menu"].find(has) || "";
    if (S.catType) S.cat = fromSection(S.catType, data(S.catType));
    S.tab = S.tab || (S.catType ? "items" : "info");
    shell();
  }

  /* ---------- المنتجات والأصناف: نموذج واحد لكل الأنواع ---------- */
  let uid = 0; const nid = (p = "c") => p + Date.now().toString(36).slice(-4) + (uid++).toString(36);
  function fromSection(type, d) {
    if (type === "menu") {
      const cats = (d.categories || []).map((c) => ({ id: nid(), name: c.name || "", raw: Object.assign({}, c, { items: undefined }) }));
      const items = []; (d.categories || []).forEach((c, i) => (c.items || []).forEach((it) => items.push(Object.assign({}, it, { cat: cats[i].id }))));
      return { cats, items };
    }
    if (type === "catalog") {
      const all = (d.categories || []).find((c) => c.id === "all");
      return { allLabel: all ? all.label : "الكل", cats: (d.categories || []).filter((c) => c.id !== "all").map((c) => ({ id: c.id, name: c.label || "" })), items: clone(d.items || []) };
    }
    const names = Array.isArray(d.cats) ? d.cats : [...new Set((d.items || []).map((it) => it.cat).filter(Boolean))];
    const cats = names.map((n) => ({ id: nid(), name: n })), by = Object.fromEntries(cats.map((c) => [c.name, c.id]));
    return { cats, items: (d.items || []).map((it) => Object.assign({}, it, { cat: by[it.cat] || "" })) };
  }
  function toSection() {
    const type = S.catType, d = data(type), m = S.cat;
    const strip = (it) => { const o = Object.assign({}, it); Object.keys(o).forEach((k) => (o[k] === "" || o[k] === undefined || o[k] === false) && k !== "name" && delete o[k]); return o; };
    if (type === "menu") d.categories = m.cats.map((c) => Object.assign({}, c.raw || {}, { name: c.name, items: m.items.filter((it) => it.cat === c.id).map((it) => { const o = strip(it); delete o.cat; return o; }) }));
    else if (type === "catalog") { d.categories = [{ id: "all", label: m.allLabel || "الكل" }, ...m.cats.map((c) => ({ id: c.id, label: c.name }))]; d.items = m.items.map(strip); }
    else { const nm = Object.fromEntries(m.cats.map((c) => [c.id, c.name])); d.cats = m.cats.map((c) => c.name); d.items = m.items.map((it) => { const o = strip(it); if (nm[it.cat]) o.cat = nm[it.cat]; else delete o.cat; return o; }); }
    touch("content." + type);
  }
  const catName = (id) => (S.cat.cats.find((c) => c.id === id) || {}).name || "";
  const isUrl = (v) => typeof v === "string" && /^(https:\/\/|data:image\/|\/)/.test(v);
  function thumb(it) {
    const v = it.thumb || it.img || (it.imgs && it.imgs[0]) || "";
    if (!v) return "";
    if (isUrl(v)) return v;
    const M = window.SAMMEM_MEDIA || {};
    if (M[v]) return `/media/${v}-sq.webp`;
    return "/" + v.replace(/^\.?\//, "");
  }
  const cur = () => (S.catType === "catalog" ? data("catalog").currency || "" : "");
  const priceTxt = (p) => (p === undefined || p === "" ? "" : (typeof p === "number" ? p.toLocaleString("en-US") : p) + (cur() ? " " + cur() : ""));

  /* ---------- الهيكل ---------- */
  const LIST = {
    services: { tab: "الخدمات", key: "items", one: "خدمة", fields: [["title", "العنوان"], ["text", "الوصف", "area"]], blank: { icon: "spark", title: "", text: "" } },
    pricing: { tab: "الأسعار", key: "plans", one: "باقة", fields: [["name", "اسم الباقة"], ["price", "السعر"], ["per", "العملة أو المدة (مثلاً: ل.س / شهرياً)"], ["features", "المميزات (كل سطر ميزة)", "lines"], ["hot", "شارة مميزة (اختياري، مثلاً: الأكتر طلباً)"]], blank: { name: "", price: "", per: "", features: [] } },
    faq: { tab: "الأسئلة", key: "items", one: "سؤال", fields: [["q", "السؤال"], ["a", "الجواب", "area"]], blank: { q: "", a: "" } },
    testimonials: { tab: "آراء الزبائن", key: "items", one: "رأي", fields: [["name", "الاسم"], ["text", "الرأي", "area"]], blank: { name: "", text: "" } },
  };
  const SEC_LABEL = { marquee: "الشريط المتحرك", about: "من نحنا", services: "الخدمات", menu: "المنيو", products: "المنتجات", catalog: "المنتجات", process: "خطوات العمل", gallery: "معرض الصور", team: "الفريق", testimonials: "آراء الزبائن", pricing: "الأسعار", faq: "الأسئلة الشائعة", cta: "دعوة للتواصل", contact: "التواصل والخريطة", craft: "كيف منصنعها", showcase: "عرض المختارات", studio: "جرّب قطعتك", rack: "واجهة الرف", whatsapp: "زر واتساب العائم" };

  function tabs() {
    const t = [];
    if (S.catType) { t.push(["items", S.catType === "menu" ? "المنيو" : "المنتجات", S.cat.items.length]); t.push(["cats", "الأصناف", S.cat.cats.length]); if (window.SAMMEM && window.SAMMEM.opts) t.push(["stock", "المخزون"]); }
    Object.keys(LIST).forEach((k) => has(k) && t.push([k, LIST[k].tab]));
    if (has("about")) t.push(["about", "من نحنا"]);
    t.push(["info", "معلومات المحل"], ["images", "الشعار والصور"], ["sections", "الأقسام"]);
    return t;
  }
  function status() {
    const s = S.site;
    if (s.status === "flagged") return '<span class="pill warn"><i></i>موقوف للمراجعة</span>';
    if (s.paid) return '<span class="pill ok"><i></i>معتمد</span>';
    let ms = s.liveUntil - Date.now();
    if (ms <= 0) return `<span class="pill warn"><i></i>انتهت الفترة التجريبية</span> <a href="${esc(s.contact)}" target="_blank" rel="noopener">تواصل معنا</a>`;
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `<span class="pill ok"><i></i>تجريبي · باقي ${d ? d + " يوم و" : ""}${h} ساعة${d ? "" : " و" + m + " دقيقة"}</span>`;
  }
  function shell() {
    const logo = S.cfg.logo;
    app.innerHTML = `<header class="top"><div class="in">
        <span class="mark">${logo ? `<img src="${esc(logo)}" alt="">` : esc((brand("name").replace(/^ال/, "")[0]) || "م")}</span>
        <div class="who"><h1>${esc(brand("name"))}</h1><div class="st" data-st>${status()}</div></div>
        <a class="btn sm open-site" href="/?v=${Date.now()}" target="_blank" rel="noopener">${svg("ext")}<span>افتح موقعي</span></a>
        <button class="btn sm ico" data-logout title="خروج" aria-label="خروج">${svg("out")}</button>
      </div>
      <nav class="tabs" role="tablist">${tabs().map(([id, label, n]) => `<button role="tab" data-tab="${id}" aria-selected="${S.tab === id}">${esc(label)}${n !== undefined ? `<b>${n}</b>` : ""}</button>`).join("")}</nav>
    </header>
    <main><div class="panel" data-panel></div></main>
    <div class="save" data-save><div class="in"><p>عندك تعديلات ما انحفظت لسا.</p><button class="btn" data-undo>تراجع</button><button class="btn pri" data-dosave>احفظ وانشر</button></div></div>`;
    $$("[data-tab]").forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; $$("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b)); panel(); scrollTo({ top: 0 }); }));
    $("[data-logout]").onclick = async () => { if (S.dirty.size && !confirm("في تعديلات ما انحفظت. أكيد بدك تطلع؟")) return; await fetch(API + "logout", { method: "POST" }); S.dirty.clear(); showLogin(); };
    $("[data-dosave]").onclick = save;
    $("[data-undo]").onclick = () => { if (confirm("ترجع كل التعديلات اللي ما انحفظت؟")) { S.dirty.clear(); S.data = {}; S.cat = S.catType ? fromSection(S.catType, data(S.catType)) : null; shell(); } };
    clearInterval(S.stT); S.stT = setInterval(() => { const e = $("[data-st]"); if (e) e.innerHTML = status(); }, 30000);
    panel(); saveBar();
  }
  function saveBar() { const b = $("[data-save]"); if (b) b.classList.toggle("on", S.dirty.size > 0); }
  function counts() { $$("[data-tab]").forEach((b) => { const n = b.querySelector("b"); if (!n) return; n.textContent = b.dataset.tab === "items" ? S.cat.items.length : S.cat.cats.length; }); }

  function panel() {
    const p = $("[data-panel]");
    const v = S.tab;
    if (v === "items") return itemsView(p);
    if (v === "cats") return catsView(p);
    if (v === "stock") return stockView(p);
    if (LIST[v]) return listView(p, v);
    if (v === "about") return aboutView(p);
    if (v === "info") return infoView(p);
    if (v === "images") return imagesView(p);
    if (v === "sections") return sectionsView(p);
  }

  /* حقول عنوان القسم (فوق كل قسم بالموقع) */
  function headFields(type) {
    const d = data(type);
    return `<details class="head"><summary>عنوان القسم بالموقع</summary><div class="card">
      <label class="f"><span>الكلمة الصغيرة فوق العنوان</span><input data-h="eyebrow" value="${esc(d.eyebrow)}"></label>
      <label class="f"><span>العنوان</span><input data-h="title" value="${esc(d.title)}"></label>
      <label class="f"><span>جملة تحت العنوان (اختياري)</span><textarea data-h="lead" rows="2">${esc(d.lead)}</textarea></label>
    </div></details>`;
  }
  function bindHead(p, type) { $$("[data-h]", p).forEach((el) => (el.oninput = () => { data(type)[el.dataset.h] = el.value; touch("content." + type); })); }

  /* ---------- المنتجات ---------- */
  function itemsView(p) {
    const m = S.cat, q = S.q.trim();
    const list = m.items.map((it, i) => [it, i]).filter(([it]) => (S.filter === "*" || it.cat === S.filter) && (!q || (it.name + " " + (it.desc || "")).includes(q)));
    p.innerHTML = `
      <div class="bar"><input class="grow f-in" type="search" placeholder="دوّر على منتج…" value="${esc(S.q)}" data-q style="height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface);padding:0 14px">
        <button class="btn pri" data-add>${svg("plus")}${S.catType === "menu" ? "صنف جديد بالمنيو" : "منتج جديد"}</button></div>
      ${m.cats.length ? `<div class="chips">${[["*", "الكل"], ...m.cats.map((c) => [c.id, c.name])].map(([id, n]) => `<button data-f="${esc(id)}" aria-pressed="${S.filter === id}">${esc(n)} <small>${id === "*" ? m.items.length : m.items.filter((it) => it.cat === id).length}</small></button>`).join("")}</div>` : ""}
      ${list.length ? `<div class="items">${list.map(([it, i]) => { const src = thumb(it); return `<button class="item" data-i="${i}">
          <span class="th">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : svg("img")}</span>
          <span class="tx"><b>${it.featured ? '<span class="star">★</span> ' : ""}${esc(it.name || "بلا اسم")}</b><small>${esc(catName(it.cat) || (it.desc || ""))}</small>${optLine(it)}<span class="pr">${OP() && OP().summary(it).from ? "من " : ""}${esc(priceTxt(OP() ? OP().summary(it).price : it.price))}${it.old ? ` <s style="color:var(--muted);font-weight:400">${esc(it.old)}</s>` : ""}</span></span>
        </button>`; }).join("")}</div>` : `<div class="empty">${m.items.length ? "ما في نتائج." : "لسا ما في منتجات. اضغط «منتج جديد»."}</div>`}
      ${headFields(S.catType)}`;
    const qi = $("[data-q]", p); qi.oninput = () => { S.q = qi.value; const pos = qi.selectionStart; itemsView(p); const n = $("[data-q]", p); n.focus(); n.setSelectionRange(pos, pos); };
    $$("[data-f]", p).forEach((b) => (b.onclick = () => { S.filter = b.dataset.f; itemsView(p); }));
    $$("[data-i]", p).forEach((b) => (b.onclick = () => editItem(+b.dataset.i)));
    $("[data-add]", p).onclick = () => {
      if (S.catType === "menu" && !m.cats.length) m.cats.push({ id: nid(), name: "عام" });
      const it = { name: "", desc: "", price: S.catType === "catalog" ? "" : "", cat: S.filter !== "*" ? S.filter : (m.cats[0] || {}).id || "" };
      editItem(-1, it);
    };
    bindHead(p, S.catType);
  }

  function editItem(i, fresh) {
    const m = S.cat, it = fresh || clone(m.items[i]), type = S.catType;
    const box = document.createElement("div"); box.className = "sheet";
    const catOpts = (type === "menu" ? "" : '<option value="">بدون صنف</option>') + m.cats.map((c) => `<option value="${esc(c.id)}" ${c.id === it.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    box.innerHTML = `<form class="box" novalidate>
      <h2>${fresh ? "منتج جديد" : "تعديل المنتج"}</h2>
      <div class="gal" data-gal></div>
      <label class="f"><span>الاسم</span><input name="name" value="${esc(it.name)}" required></label>
      <label class="f"><span>الوصف</span><textarea name="desc" rows="3">${esc(it.desc)}</textarea></label>
      <div class="row2">
        <label class="f"><span>السعر${cur() ? " (" + esc(cur()) + ")" : ""}</span><input name="price" inputmode="${type === "catalog" ? "numeric" : "text"}" value="${esc(it.price)}" placeholder="${type === "catalog" ? "مثلاً 250000" : "مثلاً 25,000 ل.س"}"></label>
        ${type === "products" ? `<label class="f"><span>السعر قبل الخصم (اختياري)</span><input name="old" value="${esc(it.old)}"></label>` : ""}
        ${type !== "catalog" ? `<label class="f"><span>شارة (اختياري، مثلاً: جديد)</span><input name="tag" value="${esc(it.tag)}"></label>` : ""}
        ${m.cats.length || type !== "menu" ? `<label class="f"><span>الصنف</span><select name="cat">${catOpts}</select></label>` : ""}
      </div>
      ${type === "catalog" ? `<label class="check"><input type="checkbox" name="featured" ${it.featured ? "checked" : ""}> منتج مميّز (بيطلع بالمختارات)</label>` : ""}
      <div class="opts" data-opts></div>
      <p class="err" style="color:var(--danger);margin:0;min-height:1em"></p>
      <div class="acts">
        <button class="btn pri grow" type="submit">تمام</button>
        <button class="btn" type="button" data-cancel>إلغاء</button>
        ${fresh ? "" : `<button class="btn sm ico" type="button" data-mv="-1" title="لقدّام" aria-label="لقدّام">${svg("up")}</button><button class="btn sm ico" type="button" data-mv="1" title="لورا" aria-label="لورا">${svg("down")}</button><button class="btn sm ico" type="button" data-dup title="نسخة" aria-label="نسخة">${svg("copy")}</button><button class="btn sm ico danger" type="button" data-del title="احذف" aria-label="احذف">${svg("trash")}</button>`}
      </div></form>`;
    document.body.appendChild(box); document.body.style.overflow = "hidden";
    const f = $("form", box), close = () => { box.remove(); document.body.style.overflow = ""; };
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $("[data-cancel]", box).onclick = close;
    addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); removeEventListener("keydown", k); } });
    gallery($("[data-gal]", box), it);
    optsEditor($("[data-opts]", box), it, () => f.price.value.trim());
    f.onsubmit = (e) => {
      e.preventDefault();
      const name = f.name.value.trim();
      if (!name) { $(".err", box).textContent = "اكتب اسم المنتج."; f.name.focus(); return; }
      it.name = name; it.desc = f.desc.value.trim();
      const pr = f.price.value.trim();
      it.price = type === "catalog" && /^[\d,.\s]+$/.test(pr) && pr ? Number(pr.replace(/[,\s]/g, "")) : pr;
      if (f.old) it.old = f.old.value.trim();
      if (f.tag) it.tag = f.tag.value.trim();
      if (f.cat) it.cat = f.cat.value;
      if (f.featured) it.featured = f.featured.checked;
      tidyOpts(it, type);
      if (fresh) m.items.unshift(it); else m.items[i] = it;
      toSection(); close(); panel(); counts();
    };
    if (!fresh) {
      $$("[data-mv]", box).forEach((b) => (b.onclick = () => { const j = i + +b.dataset.mv; if (j < 0 || j >= m.items.length) return; [m.items[i], m.items[j]] = [m.items[j], m.items[i]]; toSection(); close(); panel(); toast("انتقل"); }));
      $("[data-dup]", box).onclick = () => { const c = clone(m.items[i]); c.name += " (نسخة)"; m.items.splice(i + 1, 0, c); toSection(); close(); panel(); counts(); toast("انعملت نسخة"); };
      $("[data-del]", box).onclick = () => { if (!confirm(`تحذف «${m.items[i].name}»؟`)) return; m.items.splice(i, 1); toSection(); close(); panel(); counts(); toast("انحذف"); };
    }
    setTimeout(() => f.name.focus({ preventScroll: true }), 50);
  }

  /* ---------- صور المنتج: أول صورة هي الرئيسية ---------- */
  function gallery(el, it) {
    const list = () => (Array.isArray(it.imgs) && it.imgs.length ? it.imgs.slice() : it.img || it.thumb ? [it.img || it.thumb] : []);
    const set = (L) => { delete it.thumb; if (L.length) it.img = L[0]; else delete it.img; if (L.length > 1) it.imgs = L; else delete it.imgs; draw(); };
    const src = (v) => thumb({ img: v });
    function draw() {
      const L = list();
      el.innerHTML = `<div class="gal-h"><b>الصور</b><small class="hint">أول صورة هي اللي بتطلع بالبطاقة. لحد 8 صور.</small></div>
        <div class="gal-row">${L.map((v, i) => `<div class="img-slot sq"><img src="${esc(src(v))}" alt="">${i ? `<button type="button" class="star" data-main="${i}" title="خليها الرئيسية" aria-label="خليها الرئيسية">★</button>` : '<span class="main">الرئيسية</span>'}<button type="button" class="x" data-rm="${i}" aria-label="احذف">×</button></div>`).join("")}
        ${L.length < 8 ? `<label class="img-slot sq add">${L.length ? "+ صورة" : "اضغط لتضيف صورة"}<input class="hidden" type="file" accept="image/*" multiple></label>` : ""}</div>`;
      $$("[data-rm]", el).forEach((b) => (b.onclick = () => { const L = list(); L.splice(+b.dataset.rm, 1); set(L); }));
      $$("[data-main]", el).forEach((b) => (b.onclick = () => { const L = list(), [x] = L.splice(+b.dataset.main, 1); L.unshift(x); set(L); }));
      const inp = $("input[type=file]", el);
      if (inp) inp.onchange = async () => {
        const slot = inp.closest(".img-slot"); slot.classList.add("busy");
        const L = list();
        for (const file of [...inp.files].slice(0, 8 - L.length)) { try { L.push(await upload(file, 1000)); } catch (e) { toast(e.message); } }
        set(L);
      };
    }
    draw();
  }

  /* ---------- الخيارات: ألوان، مقاسات، نمر، أحجام، أو أي شي ---------- */
  const OPT_PRESETS = [
    { id: "color", label: "ألوان", name: "اللون", kind: "color", sugg: ["أسود", "أبيض", "أحمر", "أزرق", "كحلي", "أخضر", "بيج", "رمادي", "زهري", "بني", "ذهبي", "فضي"] },
    { id: "size", label: "مقاسات", name: "المقاس", kind: "size", sugg: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { id: "shoe", label: "نمر أحذية", name: "النمرة", kind: "size", sugg: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
    { id: "vol", label: "حجم", name: "الحجم", kind: "", sugg: ["صغير", "وسط", "كبير"] },
    { id: "other", label: "خيار تاني", name: "", kind: "", sugg: [] },
  ];
  const suggFor = (o) => { const p = OPT_PRESETS.find((x) => x.name && x.name === o.name) || (o.kind === "color" ? OPT_PRESETS[0] : null); return p ? p.sugg : []; };
  const normOpts = (it) => { it.options = (Array.isArray(it.options) ? it.options : []).map((o) => ({ name: o.name || "", kind: o.kind || (OP().isColorOpt(o) ? "color" : ""), values: (o.values || []).map((x) => (typeof x === "object" ? Object.assign({}, x) : { v: String(x) })) })); return it.options; };
  const OP = () => window.SAMMEM.opts;

  function optsEditor(el, it, basePrice) {
    const opts = normOpts(it);
    it.variants = Array.isArray(it.variants) ? it.variants : [];
    const vGet = (k, make) => { let v = it.variants.find((x) => x.k === k); if (!v && make) { v = { k }; it.variants.push(v); } return v; };
    const ready = () => opts.filter((o) => o.name.trim() && o.values.length);
    const isCat = S.catType === "catalog";
    const toNum = (x) => (isCat && /^[\d,.\s]+$/.test(x) && x ? Number(x.replace(/[,\s]/g, "")) : x);
    function draw() {
      const R = ready(), list = OP().combos(R, 150);
      const total = R.reduce((n, o) => n * o.values.length, R.length ? 1 : 0);
      el.innerHTML = `
        <div class="opt-h"><b>خيارات المنتج</b><small class="hint">إذا المنتج إلو ألوان أو مقاسات أو أحجام، ضيفها هون. الزبون بيختار منها، والاختيار بيوصلك برسالة الواتساب.</small></div>
        ${opts.map((o, i) => `<div class="opt" data-k="${i}">
          <div class="opt-top"><input class="opt-name" data-name value="${esc(o.name)}" placeholder="اسم الخيار (مثلاً: اللون، المقاس، النوع)" aria-label="اسم الخيار">
            <button type="button" class="btn sm ico danger" data-delopt aria-label="احذف الخيار">${svg("trash")}</button></div>
          <div class="vals">${o.values.map((x, j) => `<span class="val">${o.kind === "color" ? `<label class="dot" style="background:${esc(x.hex || OP().hexOf(x.v) || "#ccc")}" title="غيّر اللون"><input type="color" data-hex="${j}" value="${esc(x.hex || OP().hexOf(x.v) || "#cccccc")}"></label>` : ""}${esc(x.v)}<button type="button" data-rmv="${j}" aria-label="شيل ${esc(x.v)}">×</button></span>`).join("")}
            <input class="val-in" data-addv placeholder="${o.values.length ? "قيمة تانية…" : "اكتب قيمة واضغط Enter"}" enterkeyhint="done" aria-label="أضف قيمة"></div>
          ${suggFor(o).filter((v) => !o.values.some((x) => x.v === v)).length ? `<div class="sugg">${suggFor(o).filter((v) => !o.values.some((x) => x.v === v)).map((v) => `<button type="button" data-sugg="${esc(v)}">+ ${esc(v)}</button>`).join("")}</div>` : ""}
        </div>`).join("")}
        ${opts.length < 3 ? `<div class="opt-add"><span>${opts.length ? "خيار كمان:" : "ضيف:"}</span>${OPT_PRESETS.filter((p) => !p.name || !opts.some((o) => o.name === p.name)).map((p) => `<button type="button" class="btn sm" data-preset="${p.id}">${svg("plus")}${esc(p.label)}</button>`).join("")}</div>` : ""}
        ${R.length ? `<div class="vt">
          <div class="vt-h"><b>السعر والكمية لكل ${R.length > 1 ? "تركيبة" : esc(R[0].name)}</b><small class="hint">السعر الفاضي = سعر المنتج${basePrice() ? ` (${esc(basePrice())})` : ""}. الكمية الفاضية = بلا عدّ. ${total > 150 ? "<b>أول 150 تركيبة بس.</b>" : ""}</small></div>
          <div class="vt-bulk"><input data-bp placeholder="سعر للكل" inputmode="${isCat ? "numeric" : "text"}"><input data-bs placeholder="كمية للكل" inputmode="numeric"><button type="button" class="btn sm" data-bulk>طبّق عالكل</button></div>
          <div class="vrows">${list.map((c) => { const k = OP().keyOf(c), v = vGet(k) || {}; const col = R.findIndex((o) => o.kind === "color"); const hex = col >= 0 ? (R[col].values.find((x) => x.v === c[col]) || {}) : null;
            return `<div class="vr${v.off ? " off" : ""}${v.stock === 0 ? " zero" : ""}" data-v="${esc(k)}">
              <span class="vn">${hex ? `<i style="background:${esc(hex.hex || OP().hexOf(hex.v) || "#ccc")}"></i>` : ""}${esc(c.join(" · "))}</span>
              <label class="vimg" title="صورة لهالتركيبة">${v.img ? `<img src="${esc(thumb({ img: v.img }))}" alt="">` : svg("img")}<input class="hidden" type="file" accept="image/*"></label>
              <input data-f="price" value="${esc(v.price ?? "")}" placeholder="${esc(basePrice() || "السعر")}" inputmode="${isCat ? "numeric" : "text"}" aria-label="السعر">
              <input data-f="stock" value="${esc(v.stock ?? "")}" placeholder="∞" inputmode="numeric" aria-label="الكمية">
              <label class="vt-on" title="متوفر"><input type="checkbox" data-f="on" ${v.off ? "" : "checked"}><span>${v.off ? "مخفي" : "متوفر"}</span></label>
            </div>`; }).join("")}</div></div>` : `<label class="f stock-f"><span>الكمية المتوفرة (اختياري)</span><input data-simple-stock value="${esc(it.stock ?? "")}" inputmode="numeric" placeholder="فاضي = ما بدي عدّ · 0 = نفدت"></label>`}`;
    }
    const addVals = (o, raw) => { String(raw).split(/[,،\n]/).map((x) => x.replace(/\|/g, "/").trim()).filter(Boolean).forEach((v) => { if (!o.values.some((x) => x.v === v)) o.values.push(o.kind === "color" ? { v, hex: OP().hexOf(v) } : { v }); }); };
    const keepFocus = (sel) => { const n = el.querySelector(sel); if (n) n.focus({ preventScroll: true }); };
    el.addEventListener("click", (e) => {
      const t = e.target, box = t.closest("[data-k]"), o = box && opts[+box.dataset.k];
      const pre = t.closest("[data-preset]");
      if (pre) { const p = OPT_PRESETS.find((x) => x.id === pre.dataset.preset); opts.push({ name: p.name, kind: p.kind, values: [] }); draw(); keepFocus(`[data-k="${opts.length - 1}"] ${p.name ? "[data-addv]" : "[data-name]"}`); return; }
      if (t.closest("[data-delopt]")) { if (o.values.length && !confirm(`تشيل خيار «${o.name || "بلا اسم"}» بكل قيمه؟`)) return; opts.splice(+box.dataset.k, 1); draw(); return; }
      const rv = t.closest("[data-rmv]"); if (rv) { o.values.splice(+rv.dataset.rmv, 1); draw(); keepFocus(`[data-k="${box.dataset.k}"] [data-addv]`); return; }
      const sg = t.closest("[data-sugg]"); if (sg) { addVals(o, sg.dataset.sugg); draw(); return; }
      if (t.closest("[data-bulk]")) {
        const bp = $("[data-bp]", el).value.trim(), bs = $("[data-bs]", el).value.trim();
        if (!bp && !bs) { toast("اكتب سعر أو كمية لتطبّقها عالكل."); return; }
        OP().combos(ready(), 150).forEach((c) => { const v = vGet(OP().keyOf(c), true); if (bp) v.price = toNum(bp); if (bs !== "") v.stock = Math.max(0, parseInt(bs, 10) || 0); });
        draw(); toast("انطبّق عالكل"); return;
      }
    });
    el.addEventListener("keydown", (e) => {
      const inp = e.target.closest("[data-addv]"); if (!inp || e.key !== "Enter") return;
      e.preventDefault(); const k = inp.closest("[data-k]").dataset.k; if (!inp.value.trim()) return; addVals(opts[+k], inp.value); draw(); keepFocus(`[data-k="${k}"] [data-addv]`);
    });
    el.addEventListener("change", async (e) => {
      const t = e.target;
      const add = t.closest("[data-addv]"); if (add && add.value.trim()) { const k = add.closest("[data-k]").dataset.k; addVals(opts[+k], add.value); draw(); return; }
      const hx = t.closest("[data-hex]"); if (hx) { const o = opts[+hx.closest("[data-k]").dataset.k]; o.values[+hx.dataset.hex].hex = hx.value; draw(); return; }
      const nm = t.closest("[data-name]"); if (nm) { const o = opts[+nm.closest("[data-k]").dataset.k]; o.name = nm.value.trim(); if (OP().isColorOpt(o)) o.kind = "color"; draw(); return; }
      const row = t.closest("[data-v]");
      if (row && t.type === "file") {
        const file = t.files[0]; if (!file) return; const lab = t.closest(".vimg"); lab.classList.add("busy");
        try { vGet(row.dataset.v, true).img = await upload(file, 1000); } catch (er) { toast(er.message); }
        draw(); return;
      }
      if (row && t.dataset.f === "on") { const v = vGet(row.dataset.v, true); if (t.checked) delete v.off; else v.off = true; row.classList.toggle("off", !t.checked); t.nextElementSibling.textContent = t.checked ? "متوفر" : "مخفي"; return; }
    });
    el.addEventListener("input", (e) => {
      const t = e.target, row = t.closest("[data-v]");
      if (row && (t.dataset.f === "price" || t.dataset.f === "stock")) {
        const v = vGet(row.dataset.v, true), x = t.value.trim();
        if (t.dataset.f === "price") { if (x) v.price = toNum(x); else delete v.price; }
        else { if (x !== "" && /^\d+$/.test(x)) v.stock = +x; else delete v.stock; row.classList.toggle("zero", v.stock === 0); }
        return;
      }
      if (t.matches("[data-simple-stock]")) { const x = t.value.trim(); if (x !== "" && /^\d+$/.test(x)) it.stock = +x; else delete it.stock; }
      if (t.matches("[data-name]")) opts[+t.closest("[data-k]").dataset.k].name = t.value.trim();
    });
    draw();
  }
  // قبل الحفظ: منشيل الخيارات الفاضية والتركيبات اللي ما عاد إلها وجود
  function tidyOpts(it) {
    const opts = (it.options || []).map((o) => ({ name: String(o.name || "").trim(), kind: o.kind || undefined, values: (o.values || []).map((x) => { const y = { v: x.v }; if (o.kind === "color" && x.hex) y.hex = x.hex; return y; }).filter((x) => x.v) })).filter((o) => o.name && o.values.length);
    opts.forEach((o) => { if (!o.kind) delete o.kind; });
    if (!opts.length) { delete it.options; delete it.variants; return; }
    it.options = opts; delete it.stock;
    const keys = new Set(OP().combos(opts, 150).map(OP().keyOf));
    it.variants = (it.variants || []).filter((v) => keys.has(v.k) && ["price", "stock", "img", "off"].some((f) => v[f] !== undefined && v[f] !== ""));
    if (!it.variants.length) delete it.variants;
  }
  // سطر صغير تحت اسم المنتج باللوحة: الخيارات والكمية
  function optLine(it) {
    const O = OP(); if (!O) return "";
    const sm = O.summary(it), opts = sm.opts;
    const parts = opts.map((o) => `${o.values.length} ${o.name}`);
    const st = sm.soldOut ? '<span class="st0">نفدت</span>' : sm.stock !== null && sm.stock !== undefined ? `<span class="${sm.stock <= 3 ? "st1" : "st2"}">باقي ${sm.stock}</span>` : "";
    return parts.length || st ? `<span class="ol">${esc(parts.join(" · "))}${st}</span>` : "";
  }

  /* ---------- المخزون: كل الكميات بمكان واحد ---------- */
  function stockView(p) {
    const O = OP(), m = S.cat;
    const rows = m.items.map((it, i) => ({ it, i, sm: O.summary(it) }));
    const tracked = rows.filter((r) => r.sm.stock !== null && r.sm.stock !== undefined);
    const out = rows.filter((r) => r.sm.soldOut).length, low = tracked.filter((r) => !r.sm.soldOut && r.sm.stock <= 3).length;
    const F = S.sf || "*";
    const show = rows.filter((r) => F === "*" || (F === "out" ? r.sm.soldOut : F === "low" ? !r.sm.soldOut && r.sm.stock !== null && r.sm.stock <= 3 : r.sm.stock === null));
    const step = (key, val) => `<div class="stp" data-sk="${esc(key)}"><button type="button" data-d="-1" aria-label="أقل">−</button><input value="${esc(val ?? "")}" inputmode="numeric" placeholder="∞" aria-label="الكمية"><button type="button" data-d="1" aria-label="أكتر">+</button></div>`;
    p.innerHTML = `<div class="card"><h2>المخزون</h2><p class="hint">عدّل الكميات بسرعة. لما توصل الكمية لـ 0 المنتج بيطلع «نفدت الكمية» بالموقع. الفاضي (∞) يعني ما بدك تعدّ. الطلبات عالواتساب ما بتنقّص الكمية لحالها، نقّصها لما تبيع.</p>
      <div class="chips">${[["*", "الكل", rows.length], ["out", "نفدت", out], ["low", "قليلة", low], ["free", "بلا عدّ", rows.length - tracked.length]].map(([id, n, c]) => `<button data-sf="${id}" aria-pressed="${F === id}">${n} <small>${c}</small></button>`).join("")}</div></div>
      <div class="stock">${show.map(({ it, i, sm }) => { const src = thumb(it), opts = sm.opts;
        return `<div class="srow" data-i="${i}"><div class="sh"><span class="th">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : svg("img")}</span><b>${esc(it.name || "بلا اسم")}</b>${sm.soldOut ? '<span class="st0">نفدت</span>' : ""}${opts.length ? "" : step("", it.stock)}</div>
          ${opts.length ? `<div class="svars">${O.combos(opts, 150).map((c) => { const k = O.keyOf(c), v = O.variantOf(it, c) || {}; return `<div class="svr${v.off ? " off" : ""}"><span>${esc(c.join(" · "))}${v.off ? " <small>(مخفي)</small>" : ""}</span>${step(k, v.stock)}</div>`; }).join("")}</div>` : ""}</div>`; }).join("") || '<div class="empty">ما في منتجات بهالفلتر.</div>'}</div>`;
    $$("[data-sf]", p).forEach((b) => (b.onclick = () => { S.sf = b.dataset.sf; stockView(p); }));
    const setStock = (row, key, val) => {
      const it = m.items[+row.dataset.i];
      if (!key) { if (val === null) delete it.stock; else it.stock = val; }
      else { it.variants = it.variants || []; let v = it.variants.find((x) => x.k === key); if (!v) { v = { k: key }; it.variants.push(v); } if (val === null) delete v.stock; else v.stock = val; }
      toSection();
      const sm = O.summary(it), sh = $(".sh", row), badge = $(".st0", sh);
      if (sm.soldOut && !badge) $("b", sh).insertAdjacentHTML("afterend", '<span class="st0">نفدت</span>'); else if (!sm.soldOut && badge) badge.remove();
    };
    $$(".stp", p).forEach((w) => {
      const inp = $("input", w), row = w.closest("[data-i]"), key = w.dataset.sk;
      inp.oninput = () => { const x = inp.value.trim(); setStock(row, key, /^\d+$/.test(x) ? +x : null); };
      $$("[data-d]", w).forEach((b) => (b.onclick = () => { const n = Math.max(0, (parseInt(inp.value, 10) || 0) + +b.dataset.d); inp.value = n; setStock(row, key, n); }));
    });
  }

  /* ---------- الأصناف ---------- */
  function catsView(p) {
    const m = S.cat, n = (id) => m.items.filter((it) => it.cat === id).length;
    p.innerHTML = `<div class="card"><h2>الأصناف</h2><p class="hint">الأصناف بتطلع كأزرار فلترة فوق ${S.catType === "menu" ? "المنيو" : "المنتجات"}. غيّر الاسم مباشرة، رتّبها بالأسهم.</p>
      <div class="rows">${m.cats.map((c, i) => `<div class="cat-row" data-c="${i}"><input value="${esc(c.name)}" aria-label="اسم الصنف"><span class="cnt">${n(c.id)} منتج</span>
        <button class="btn sm ico" data-mv="-1" aria-label="لفوق">${svg("up")}</button><button class="btn sm ico" data-mv="1" aria-label="لتحت">${svg("down")}</button><button class="btn sm ico danger" data-del aria-label="احذف">${svg("trash")}</button></div>`).join("") || '<div class="empty">ما في أصناف لسا.</div>'}</div>
      <form class="bar" data-new><input class="grow" name="n" placeholder="اسم صنف جديد" style="height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);padding:0 14px"><button class="btn pri">${svg("plus")}أضف</button></form></div>`;
    $$("[data-c]", p).forEach((row) => {
      const i = +row.dataset.c, c = m.cats[i];
      $("input", row).oninput = (e) => { c.name = e.target.value; toSection(); };
      $$("[data-mv]", row).forEach((b) => (b.onclick = () => { const j = i + +b.dataset.mv; if (j < 0 || j >= m.cats.length) return; [m.cats[i], m.cats[j]] = [m.cats[j], m.cats[i]]; toSection(); catsView(p); }));
      $("[data-del]", row).onclick = () => {
        const k = n(c.id);
        if (k) {
          const other = m.cats.find((x) => x !== c);
          if (S.catType === "menu" && !other) { toast("المنيو لازم يضل فيه صنف واحد عالأقل."); return; }
          const msg = other ? `بالصنف ${k} منتج. موافق = ننقلهم لـ «${other.name}»، إلغاء = ما منحذف شي.` : `بالصنف ${k} منتج. رح يضلوا بدون صنف. منكمّل؟`;
          if (!confirm(msg)) return;
          m.items.forEach((it) => { if (it.cat === c.id) it.cat = other ? other.id : ""; });
        } else if (!confirm(`تحذف صنف «${c.name}»؟`)) return;
        m.cats.splice(i, 1); if (S.filter === c.id) S.filter = "*"; toSection(); catsView(p); counts();
      };
    });
    $("[data-new]", p).onsubmit = (e) => { e.preventDefault(); const v = e.target.n.value.trim(); if (!v) return; m.cats.push({ id: S.catType === "catalog" ? nid("k") : nid(), name: v }); toSection(); catsView(p); counts(); toast("انضاف الصنف"); };
  }

  /* ---------- قوائم عامة ---------- */
  function listView(p, type) {
    const L = LIST[type], d = data(type), arr = (d[L.key] = d[L.key] || []);
    const field = (it, [k, label, kind], i) => {
      const v = kind === "lines" ? (it[k] || []).join("\n") : it[k];
      return `<label class="f"><span>${esc(label)}</span>${kind === "area" || kind === "lines" ? `<textarea data-k="${k}" data-kind="${kind || ""}" data-r="${i}" rows="${kind === "lines" ? 4 : 3}">${esc(v)}</textarea>` : `<input data-k="${k}" data-r="${i}" value="${esc(v)}">`}</label>`;
    };
    p.innerHTML = `<div class="rows">${arr.map((it, i) => `<div class="rowc"><div class="rh"><span class="n">${i + 1}</span><span class="grow"></span>
        <button class="btn sm ico" data-mv="-1" data-i="${i}" aria-label="لفوق">${svg("up")}</button><button class="btn sm ico" data-mv="1" data-i="${i}" aria-label="لتحت">${svg("down")}</button><button class="btn sm ico danger" data-del="${i}" aria-label="احذف">${svg("trash")}</button></div>
        ${L.fields.map((fd) => field(it, fd, i)).join("")}</div>`).join("") || `<div class="empty">ما في شي لسا.</div>`}</div>
      <button class="btn pri" data-add>${svg("plus")}أضف ${esc(L.one)}</button>
      ${headFields(type)}`;
    $$("[data-k]", p).forEach((el) => (el.oninput = () => { const it = arr[+el.dataset.r]; it[el.dataset.k] = el.dataset.kind === "lines" ? el.value.split("\n").map((s) => s.trim()).filter(Boolean) : el.value; touch("content." + type); }));
    $$("[data-mv]", p).forEach((b) => (b.onclick = () => { const i = +b.dataset.i, j = i + +b.dataset.mv; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; touch("content." + type); listView(p, type); }));
    $$("[data-del]", p).forEach((b) => (b.onclick = () => { if (!confirm(`تحذف ${L.one} رقم ${+b.dataset.del + 1}؟`)) return; arr.splice(+b.dataset.del, 1); touch("content." + type); listView(p, type); }));
    $("[data-add]", p).onclick = () => { arr.push(clone(L.blank)); touch("content." + type); listView(p, type); const last = $$(".rowc", p).pop(); if (last) { last.scrollIntoView({ block: "center", behavior: "smooth" }); $("input,textarea", last).focus({ preventScroll: true }); } };
    bindHead(p, type);
  }

  function aboutView(p) {
    const d = data("about");
    p.innerHTML = `<div class="card"><h2>من نحنا</h2>
      <label class="f"><span>العنوان</span><input data-a="title" value="${esc(d.title)}"></label>
      <label class="f"><span>النص (كل فقرة بسطر)</span><textarea data-a="paragraphs" rows="6">${esc((d.paragraphs || []).join("\n"))}</textarea></label>
      ${(d.stats || []).length ? `<div class="rows">${d.stats.map((s, i) => `<div class="row2"><label class="f"><span>رقم</span><input data-s="${i}" data-sk="n" value="${esc(s.n)}"></label><label class="f"><span>شو بيعني</span><input data-s="${i}" data-sk="label" value="${esc(s.label)}"></label></div>`).join("")}</div>` : ""}
      <p class="hint">صورة «من نحنا» بتتغير من تبويب «الشعار والصور» (أول صورة).</p></div>`;
    $$("[data-a]", p).forEach((el) => (el.oninput = () => { d[el.dataset.a] = el.dataset.a === "paragraphs" ? el.value.split("\n").map((s) => s.trim()).filter(Boolean) : el.value; touch("content.about"); }));
    $$("[data-s]", p).forEach((el) => (el.oninput = () => { d.stats[+el.dataset.s][el.dataset.sk] = el.value; touch("content.about"); }));
  }

  /* ---------- معلومات المحل ---------- */
  function infoView(p) {
    const F = [["name", "اسم المحل"], ["tagline", "جملة تعريفية قصيرة", "area"], ["whatsapp", "رقم واتساب (عليه بتوصل الطلبات)", "ltr"], ["phone", "رقم الهاتف", "ltr"], ["email", "البريد الإلكتروني", "ltr"], ["address", "العنوان"], ["hours", "أوقات الدوام"]];
    p.innerHTML = `<div class="card"><h2>معلومات المحل</h2><p class="hint">هالمعلومات بتطلع بالموقع، وطلبات الزبائن بتوصلك على رقم الواتساب.</p>
      ${F.map(([k, label, kind]) => `<label class="f"><span>${label}</span>${kind === "area" ? `<textarea data-b="${k}" rows="2">${esc(brand(k))}</textarea>` : `<input data-b="${k}" value="${esc(brand(k))}" ${kind === "ltr" ? 'dir="ltr" inputmode="' + (k === "email" ? "email" : "tel") + '"' : ""}>`}</label>`).join("")}</div>`;
    $$("[data-b]", p).forEach((el) => (el.oninput = () => {
      const k = el.dataset.b, v = el.value.trim(), bl = new Set(S.cfg.blank || []);
      S.cfg[k] = v; touch(k);
      if (k !== "name") { v ? bl.delete(k) : bl.add(k); S.cfg.blank = [...bl]; touch("blank"); } if (el.dataset.b === "name") $(".top h1").textContent = el.value; }));
  }

  /* ---------- الشعار والصور ---------- */
  function imagesView(p) {
    const imgs = S.cfg.images || [];
    p.innerHTML = `<div class="card"><h2>الشعار</h2><div class="pimg"><label class="img-slot logo-slot" data-logo>${S.cfg.logo ? `<img src="${esc(S.cfg.logo)}" alt="">` : "ضيف شعار"}<input class="hidden" type="file" accept="image/*"></label>
        ${S.cfg.logo ? '<button class="btn sm danger" data-rmlogo>شيل الشعار</button>' : '<p class="hint">مربع وخلفيته سادة أحسن شي.</p>'}</div></div>
      <div class="card"><h2>صور الموقع</h2><p class="hint">لحد 6 صور. بالترتيب: صورة «من نحنا»، بعدها معرض الصور والفريق.</p>
        <div class="imgs">${imgs.map((src, i) => `<div class="img-slot"><img src="${esc(src)}" alt=""><button class="x" data-rm="${i}" aria-label="احذف">×</button></div>`).join("")}
        ${imgs.length < 6 ? '<label class="img-slot" data-addimg>+ صورة<input class="hidden" type="file" accept="image/*" multiple></label>' : ""}</div></div>`;
    const li = $("[data-logo] input", p);
    li.onchange = async () => { const f = li.files[0]; if (!f) return; $("[data-logo]", p).classList.add("busy"); try { S.cfg.logo = await upload(f, 512); touch("logo"); imagesView(p); const mk = $(".top .mark"); mk.innerHTML = `<img src="${esc(S.cfg.logo)}" alt="">`; } catch (e) { toast(e.message); imagesView(p); } };
    const rl = $("[data-rmlogo]", p); if (rl) rl.onclick = () => { S.cfg.logo = ""; touch("logo"); imagesView(p); };
    $$("[data-rm]", p).forEach((b) => (b.onclick = () => { imgs.splice(+b.dataset.rm, 1); S.cfg.images = imgs; touch("images"); imagesView(p); }));
    const ai = $("[data-addimg] input", p);
    if (ai) ai.onchange = async () => {
      $("[data-addimg]", p).classList.add("busy");
      for (const f of [...ai.files].slice(0, 6 - imgs.length)) { try { imgs.push(await upload(f, 1600)); } catch (e) { toast(e.message); } }
      S.cfg.images = imgs; touch("images"); imagesView(p);
    };
  }

  /* ---------- الأقسام ---------- */
  function sectionsView(p) {
    const off = new Set(S.cfg.off || []);
    const secs = [...new Set((S.base.sections || []).map((s) => s.type))].filter((t) => SEC_LABEL[t]);
    p.innerHTML = `<div class="card"><h2>شو يطلع بالموقع</h2><p class="hint">طفّي أي قسم ما بدك ياه. ما بينحذف محتواه، فيك ترجّعه وقت ما بدك.</p>
      <div class="rows">${secs.map((t) => `<label class="toggle"><span>${esc(SEC_LABEL[t])}</span><input type="checkbox" data-t="${t}" ${off.has(t) ? "" : "checked"}></label>`).join("")}</div></div>`;
    $$("[data-t]", p).forEach((el) => (el.onchange = () => { const o = new Set(S.cfg.off || []); el.checked ? o.delete(el.dataset.t) : o.add(el.dataset.t); S.cfg.off = [...o]; touch("off"); }));
  }

  /* ---------- رفع الصور: منصغّرها بالمتصفح قبل ما نرفعها ---------- */
  async function upload(file, max) {
    if (!/^image\//.test(file.type)) throw new Error("لازم تختار صورة.");
    let blob = file;
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bmp, 0, 0, w, h);
      const out = await new Promise((r) => c.toBlob(r, "image/webp", 0.84));
      blob = out && out.type === "image/webp" ? out : await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
    } catch (e) { /* متصفح قديم: منرفع الأصلية إذا صغيرة */ }
    if (!blob || blob.size > 2_400_000) throw new Error("الصورة كبيرة كتير.");
    const r = await api("upload", { method: "POST", headers: { "content-type": blob.type || "image/jpeg" }, body: blob });
    return r.url;
  }

  /* ---------- الحفظ ---------- */
  async function save() {
    const b = $("[data-dosave]"); b.disabled = true; b.textContent = "عم نحفظ…";
    const cfg = { content: {} };
    S.dirty.forEach((k) => { if (k.startsWith("content.")) { const t = k.slice(8), d = Object.assign({}, data(t)); delete d.id; cfg.content[t] = d; } else cfg[k] = S.cfg[k]; });
    try {
      const d = await api("save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ updated: S.site.updated, cfg }) });
      S.site.updated = d.updated; S.cfg = d.cfg; S.dirty.clear(); saveBar();
      toast("انحفظ ✓ وصار عالموقع");
      const o = $(".open-site"); if (o) o.href = "/?v=" + Date.now();
    } catch (e) {
      if (e.status === 409) { if (confirm(e.message + "\nبدك نحدّث هلق؟ (التعديلات اللي ما انحفظت رح تروح)")) { S.dirty.clear(); load(); } }
      else if (e.message !== "auth") toast(e.message);
    }
    b.disabled = false; b.textContent = "احفظ وانشر";
  }
  addEventListener("beforeunload", (e) => { if (S.dirty.size) { e.preventDefault(); e.returnValue = ""; } });

  load().catch((e) => { if (e.message !== "auth") app.innerHTML = `<div class="login"><form><h1>ما قدرنا نفتح اللوحة</h1><p>${esc(e.message)}</p><button class="btn" type="button" onclick="location.reload()">جرّب كمان مرة</button></form></div>`; });
})();
