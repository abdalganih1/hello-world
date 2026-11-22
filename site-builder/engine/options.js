/* صمّم · خيارات المنتجات (ألوان، مقاسات، نمر، أحجام، أو أي خيار بيعرّفه صاحب المتجر)
   شكل البيانات بكل منتج (products / menu / catalog):
     options:  [{ name: "اللون", kind: "color", values: [{ v: "أحمر", hex: "#c0392b" }, "أزرق"] }, { name: "المقاس", kind: "size", values: ["S", "M"] }]
     variants: [{ k: "أحمر|M", price, old, stock, img, off }]   (k = القيم بترتيب الخيارات، مفصولة بـ |)
     stock:    كمية المنتج البسيط (بلا خيارات). فاضي = ما في عدّ.
   كل تركيبة ما إلها سطر بـ variants بتاخد سعر المنتج وبتعتبر متوفرة.
   الملف بيشتغل بالموقع (نافذة اختيار + رسالة واتساب) وبلوحة الإدارة (نفس الدوال). */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SEP = "|";
  const has = (v) => v !== undefined && v !== null && v !== "";

  // ألوان معروفة بالاسم، حتى الزبون يشوف دائرة اللون بلا ما يختار شي
  const HEX = { "أحمر": "#c0392b", "احمر": "#c0392b", "أسود": "#1d1d1f", "اسود": "#1d1d1f", "أبيض": "#f6f6f4", "ابيض": "#f6f6f4", "أزرق": "#2f6fd6", "ازرق": "#2f6fd6", "كحلي": "#1f2c4c", "سماوي": "#7cc4f0", "أخضر": "#2e8b57", "اخضر": "#2e8b57", "زيتي": "#6b7a3a", "أصفر": "#f2c230", "اصفر": "#f2c230", "برتقالي": "#ee7f2d", "زهري": "#f29bb8", "وردي": "#f29bb8", "بنفسجي": "#8e5bc9", "ليلكي": "#c3a6e0", "بني": "#7b4b2a", "بيج": "#d9c3a0", "سكري": "#efe6d2", "رمادي": "#8e9196", "رصاصي": "#8e9196", "فضي": "#c7cbd1", "ذهبي": "#d4af37", "خمري": "#7b1e3a", "نبيتي": "#7b1e3a", "عسلي": "#c58a3a", "تركواز": "#32b8b0", "فيروزي": "#32b8b0", "موف": "#b07cc6", "كريمي": "#f3e9d2", "نيلي": "#3b3f9e", "جملي": "#c19a6b", "شفاف": "#e8f1f5" };
  const hexOf = (name) => { const n = String(name || "").trim(); if (HEX[n]) return HEX[n]; const w = n.split(/\s+/).find((x) => HEX[x]); return w ? HEX[w] : ""; };
  const isColorOpt = (o) => o.kind === "color" || /لون|ألوان|الوان/.test(o.name || "");

  // الخيارات بشكل موحّد: قيم كائنات {v, hex}
  function options(it) {
    return (Array.isArray(it && it.options) ? it.options : []).map((o) => {
      const color = isColorOpt(o || {});
      const values = (Array.isArray(o && o.values) ? o.values : []).map((x) => (typeof x === "string" || typeof x === "number" ? { v: String(x) } : x || {}))
        .map((x) => ({ v: String(x.v ?? "").replace(/\|/g, "/").trim(), hex: x.hex || (color ? hexOf(x.v) : ""), img: x.img || "" })).filter((x) => x.v);
      return { name: String((o && o.name) || "").trim(), kind: color ? "color" : (o && o.kind) || "", values };
    }).filter((o) => o.name && o.values.length);
  }
  function combos(opts, cap = 200) {
    if (!opts.length) return [];
    let out = [[]];
    for (const o of opts) { const n = []; for (const c of out) for (const x of o.values) n.push([...c, x.v]); out = n.slice(0, cap); }
    return out;
  }
  const keyOf = (vals) => vals.join(SEP);
  const variantOf = (it, vals) => (Array.isArray(it.variants) ? it.variants : []).find((x) => x && x.k === keyOf(vals));
  const num = (p) => {
    if (typeof p === "number") return p;
    const s = String(p ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[,،]/g, "");
    const m = s.match(/\d+(?:\.\d+)?/); return m ? +m[0] : NaN;
  };
  // سعر/كمية/صورة تركيبة معيّنة (أو المنتج نفسه إذا ما إلو خيارات)
  function pick(it, vals) {
    const opts = options(it);
    if (!opts.length || !vals) {
      const stock = has(it.stock) ? +it.stock : null;
      return { price: it.price, old: it.old, stock, img: it.img || "", on: stock === null || stock > 0 };
    }
    const v = variantOf(it, vals) || {};
    const own = has(v.price);
    const stock = has(v.stock) ? +v.stock : null;
    let img = v.img || "";
    if (!img) opts.forEach((o, i) => { const x = o.values.find((y) => y.v === vals[i]); if (!img && x && x.img) img = x.img; });
    return { price: own ? v.price : it.price, old: own ? v.old || "" : it.old, stock, img: img || it.img || "", on: !v.off && (stock === null || stock > 0) };
  }
  // ملخّص للبطاقة: سعر "من"، نفدت الكمية، ودوائر الألوان
  function summary(it) {
    const opts = options(it);
    if (!opts.length) { const p = pick(it); return { opts, soldOut: !p.on, price: it.price, from: false, stock: p.stock }; }
    const all = combos(opts).map((c) => pick(it, c)), avail = all.filter((x) => x.on);
    const pool = (avail.length ? avail : all).filter((x) => has(x.price));
    const nums = pool.map((x) => num(x.price)).filter((n) => !isNaN(n));
    const min = nums.length ? Math.min(...nums) : NaN, max = nums.length ? Math.max(...nums) : NaN;
    const minP = pool.find((x) => num(x.price) === min);
    const stocks = all.map((x) => x.stock);
    return { opts, soldOut: !avail.length, price: minP ? minP.price : it.price, from: nums.length > 1 && min !== max, stock: stocks.some((s) => s === null) ? null : stocks.reduce((a, b) => a + b, 0) };
  }
  const money = (p, cur) => (has(p) ? (typeof p === "number" ? p.toLocaleString("en-US") : String(p)) + (cur && typeof p === "number" ? " " + cur : cur && !/[^\d,.\s]/.test(String(p)) ? " " + cur : "") : "");

  // دوائر الألوان + عدد القيم، بتنحط تحت اسم المنتج
  function chipsHtml(it) {
    const opts = options(it); if (!opts.length) return "";
    const col = opts.find((o) => o.kind === "color");
    const others = opts.filter((o) => o !== col);
    return `<div class="so-mini" aria-hidden="true">${col ? col.values.slice(0, 6).map((x) => `<i style="background:${esc(x.hex || "#ccc")}" title="${esc(x.v)}"></i>`).join("") + (col.values.length > 6 ? `<em>+${col.values.length - 6}</em>` : "") : ""}${others.map((o) => `<span>${o.values.length <= 4 ? o.values.map((x) => esc(x.v)).join(" · ") : `${o.values.length} ${esc(o.name)}`}</span>`).join("")}</div>`;
  }

  /* ---------- نافذة الاختيار بالموقع ---------- */
  const REG = [];
  // بيرجّع data-so="n" لزر الطلب إذا المنتج إلو خيارات (أو كميته محسوبة)، حتى يفتح النافذة بدل الرابط المباشر
  function tag(it, ctx) {
    if (!options(it).length) return "";
    REG.push({ it, ctx }); return ` data-so="${REG.length - 1}"`;
  }
  const waNum = (n) => { let d = String(n || "").replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); if (d.startsWith("0")) d = "963" + d.slice(1); return d; };
  const waLink = (site, text) => { const n = waNum(site && site.brand && site.brand.whatsapp); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "#contact"; };
  function orderText(site, it, sel, qty, ctx = {}) {
    const opts = options(it), p = pick(it, opts.length ? sel : null), cur = ctx.cur || "";
    let t = `مرحبا ${site.brand.name}، بدي ${ctx.verb || "اطلب"}:\n• ${it.name}`;
    opts.forEach((o, i) => { if (sel[i]) t += `\n${o.name}: ${sel[i]}`; });
    t += `\nالكمية: ${qty}`;
    if (has(p.price)) { const n = num(p.price); t += `\nالسعر: ${money(p.price, cur)}${qty > 1 ? " للقطعة" + (!isNaN(n) && typeof p.price === "number" ? ` (المجموع ${money(n * qty, cur)})` : "") : ""}`; }
    if (it.url) t += `\n🔗 ${it.url}`;
    return t;
  }

  let sheet = null;
  function open(it, ctx = {}) {
    const site = ctx.site, opts = options(it);
    const sel = opts.map((o) => (o.values.length === 1 ? o.values[0].v : ""));
    let qty = 1;
    if (sheet) sheet.remove();
    sheet = document.createElement("div"); sheet.className = "so-sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", it.name);
    const imgs = (Array.isArray(it.imgs) && it.imgs.length ? it.imgs : it.img ? [it.img] : []).map(ctx.imgUrl || ((s) => s));
    sheet.innerHTML = `<div class="so-box">
      <button type="button" class="so-x" data-x aria-label="إغلاق">×</button>
      <div class="so-top"><div class="so-pic">${imgs.length ? `<img src="${esc(imgs[0])}" alt="">` : ""}</div>
        <div class="so-ttl"><b>${esc(it.name)}</b><span class="so-price"></span><small class="so-stock"></small></div></div>
      ${imgs.length > 1 ? `<div class="so-thumbs">${imgs.map((s) => `<button type="button" data-src="${esc(s)}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
      ${opts.map((o, i) => `<div class="so-grp" role="radiogroup" aria-label="${esc(o.name)}"><div class="so-lab">${esc(o.name)}: <b data-cur="${i}"></b></div>
        <div class="so-vals">${o.values.map((x) => `<button type="button" class="so-v${o.kind === "color" ? " col" : ""}" role="radio" data-o="${i}" data-v="${esc(x.v)}">${o.kind === "color" ? `<i style="background:${esc(x.hex || "#ccc")}"></i>` : ""}<span>${esc(x.v)}</span></button>`).join("")}</div></div>`).join("")}
      <div class="so-qty"><span>الكمية</span><div class="so-step"><button type="button" data-q="-1" aria-label="أقل">−</button><output>1</output><button type="button" data-q="1" aria-label="أكتر">+</button></div></div>
      <div class="so-acts"><a class="btn so-wa" target="_blank" rel="noopener"></a>${ctx.cart ? '<button type="button" class="btn ghost so-add">أضف للسلة</button>' : ""}</div>
    </div>`;
    document.body.appendChild(sheet); document.documentElement.classList.add("so-lock");
    requestAnimationFrame(() => sheet.classList.add("on"));
    const close = () => { sheet.classList.remove("on"); document.documentElement.classList.remove("so-lock"); const s = sheet; setTimeout(() => s.remove(), 250); sheet = null; removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    const all = combos(opts);
    // هالقيمة ممكنة مع باقي الاختيارات؟ (في تركيبة متوفرة)
    const possible = (i, v) => all.some((c) => c[i] === v && c.every((x, j) => j === i || !sel[j] || sel[j] === x) && pick(it, c).on);
    const missing = () => opts.findIndex((o, i) => !sel[i]);
    const paint = () => {
      const done = missing() < 0, p = done ? pick(it, sel) : null, s = summary(it);
      sheet.querySelectorAll(".so-v").forEach((b) => { const i = +b.dataset.o, v = b.dataset.v; b.setAttribute("aria-checked", sel[i] === v); b.classList.toggle("na", !possible(i, v)); });
      opts.forEach((o, i) => { sheet.querySelector(`[data-cur="${i}"]`).textContent = sel[i] || ""; });
      const pr = p ? p.price : s.price;
      sheet.querySelector(".so-price").innerHTML = has(pr) ? (!p && s.from ? "<small>من </small>" : "") + esc(money(pr, ctx.cur)) + (p && has(p.old) ? ` <s>${esc(money(p.old, ctx.cur))}</s>` : "") : "";
      const st = sheet.querySelector(".so-stock");
      st.textContent = p ? (!p.on ? "مو متوفر هلق" : p.stock !== null && p.stock <= 5 ? `باقي ${p.stock} بس` : "متوفر") : "";
      st.className = "so-stock" + (p && !p.on ? " no" : p && p.stock !== null && p.stock <= 5 ? " low" : "");
      if (p && p.img) { const im = sheet.querySelector(".so-pic img"), u = (ctx.imgUrl || ((x) => x))(p.img); if (im && im.getAttribute("src") !== u) im.src = u; else if (!im) sheet.querySelector(".so-pic").innerHTML = `<img src="${esc(u)}" alt="">`; }
      const max = p && p.stock !== null ? Math.max(1, p.stock) : 99; if (qty > max) qty = max;
      sheet.querySelector(".so-step output").textContent = qty;
      const wa = sheet.querySelector(".so-wa"), add = sheet.querySelector(".so-add");
      const miss = missing(), ok = miss < 0 && p.on;
      wa.classList.toggle("off", !ok);
      wa.innerHTML = (SM.icon ? SM.icon("wa") : "") + "<span>" + esc(miss >= 0 ? `اختار ${opts[miss].name}` : !p.on ? "اسأل عن توفره" : ctx.label || "اطلب ع واتساب") + "</span>";
      wa.href = miss >= 0 ? "#" : waLink(site, p.on ? orderText(site, it, sel, qty, ctx) : `مرحبا ${site.brand.name}، بدي اسأل إذا «${it.name}» (${sel.join(" / ")}) رح يتوفر؟`);
      if (add) add.disabled = !ok;
    };
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet || e.target.closest("[data-x]")) return close();
      const v = e.target.closest(".so-v"); if (v) { const i = +v.dataset.o; sel[i] = sel[i] === v.dataset.v && opts[i].values.length > 1 ? "" : v.dataset.v; return paint(); }
      const q = e.target.closest("[data-q]"); if (q) { qty = Math.max(1, Math.min(99, qty + +q.dataset.q)); return paint(); }
      const th = e.target.closest("[data-src]"); if (th) { sheet.querySelector(".so-pic").innerHTML = `<img src="${esc(th.dataset.src)}" alt="">`; return; }
      const wa = e.target.closest(".so-wa"); if (wa && wa.classList.contains("off")) { e.preventDefault(); const m = missing(); const g = sheet.querySelectorAll(".so-grp")[m]; if (g) { g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake"); } return; }
      if (wa) { setTimeout(close, 300); return; }
      if (e.target.closest(".so-add") && ctx.cart) { const p = pick(it, sel); ctx.cart(Object.assign({}, it, { name: `${it.name} (${sel.join(" / ")})`, price: p.price, img: p.img || it.img }), qty); close(); }
    });
    paint();
    setTimeout(() => { const b = sheet && sheet.querySelector(".so-v, .so-wa"); if (b) b.focus({ preventScroll: true }); }, 60);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-so]"); if (!a) return;
    const r = REG[+a.dataset.so]; if (!r) return;
    e.preventDefault(); open(r.it, Object.assign({}, r.ctx, { cart: SM.pxCart ? (it, q) => { for (let k = 0; k < q; k++) SM.pxCart.add(it, {}); } : null }));
  });

  SM.opts = { options, combos, keyOf, variantOf, pick, summary, money, num, hexOf, isColorOpt, chipsHtml, tag, open, orderText, HEX };
})();
