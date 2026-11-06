/* صمّم · إضافة البلكسي والأكريليك
   بتنحمّل بعد engine/*.js وبتضيف:
   - مشهد acrylic: ستاند قوس بلكسي شفاف (طبقات: مرآة، أكريليك، حروف ذهبية، إطار ولؤلؤ) بيتفكك ويتركب مع الانزلاق
   - أقسام: catalog (منتجات مع فلترة ونافذة تفاصيل وطلب واتساب)، craft (طبقات القطعة بتتفكك مع الانزلاق)، showcase (عرض دوّار ثلاثي الأبعاد)
   كل حركة بتنتهي بموضع ثابت، والمحتوى ظاهر كامل لو الحركة متوقفة. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const S = SM.sections, esc = SM.esc, icon = SM.icon;
  if (!S) return;

  /* ---------- أدوات ---------- */
  // وضع خفيف للموبايل والأجهزة الضعيفة: زجاج بلا transmission، دقة أقل، قطع أقل
  const LITE = SM.pxLite = matchMedia("(pointer: coarse)").matches || innerWidth < 860 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  document.documentElement.classList.toggle("px-lite", LITE);
  const thumbOf = (it) => it.thumb || it.img || (it.imgs && it.imgs[0]) || "";
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const ease = (x) => 1 - Math.pow(1 - clamp01(x), 4);
  const waNum = (n) => { let d = String(n || "").replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); if (d.startsWith("0")) d = "963" + d.slice(1); return d; };
  const waLink = (site, text) => { const n = waNum(site.brand.whatsapp); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "#contact"; };
  const money = (p, cur) => (typeof p === "number" ? p.toLocaleString("en-US") : esc(p)) + (cur ? ` <small>${esc(cur)}</small>` : "");
  const moneyTxt = (p, cur) => (typeof p === "number" ? p.toLocaleString("en-US") : p) + (cur ? " " + cur : "");
  const orderText = (site, it, cur) => `مرحبا ${site.brand.name}، بدي اطلب:\n• ${it.name}${it.price ? " = " + moneyTxt(it.price, cur) : ""}${it.url ? "\n🔗 " + it.url : ""}\n\nالاسم والتاريخ اللي بدي ياهن: `;
  const imgOf = (it) => it.img || (it.imgs && it.imgs[0]) || "";
  const archPath = (w, h, inset = 0) => { const r = w / 2 - inset, x0 = inset, x1 = w - inset, yb = h - inset, ya = r + inset; return `M${x0} ${yb}V${ya}A${r} ${r} 0 0 1 ${x1} ${ya}V${yb}Z`; };
  // الكتالوج المشترك بين الأقسام (showcase بياخد منه المختارات)
  const catalogOf = (site) => { const s = site.sections.find((x) => x.type === "catalog"); return s ? s.data : { items: [] }; };
  SM.pxUtil = { waLink, orderText, money, moneyTxt, imgOf, thumbOf, catalogOf };

  /* ---------- قسم المنتجات ---------- */
  S.catalog = (d, site) => {
    const items = d.items || [], cats = (d.categories || []).filter((c) => c.id === "all" || items.some((it) => it.cat === c.id));
    const label = Object.fromEntries(cats.map((c) => [c.id, c.label]));
    const page = d.pageSize || 12;
    const card = (it, i) => {
      const src = thumbOf(it);
      return `<article class="px-card${i >= page ? " px-off" : ""}" data-cat="${esc(it.cat || "")}" data-i="${i}" data-tilt>
        <button class="px-img" type="button" data-px-open="${i}" aria-label="تفاصيل ${esc(it.name)}">
          ${src ? `<img src="${esc(src)}" alt="${esc(it.name)}" loading="lazy" decoding="async">` : `<span class="px-ph" aria-hidden="true">${icon("spark")}</span>`}
          <i class="px-shine" aria-hidden="true"></i>
          ${it.featured ? '<span class="px-badge">مميّز</span>' : ""}
        </button>
        <div class="px-meta">
          ${label[it.cat] ? `<span class="px-tag">${esc(label[it.cat])}</span>` : ""}
          <h3><button type="button" class="px-name" data-px-open="${i}">${esc(it.name)}</button></h3>
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
          <div class="px-row">
            ${it.price ? `<b class="px-price">${money(it.price, d.currency)}</b>` : "<span></span>"}
            <a class="px-order" href="${esc(waLink(site, orderText(site, it, d.currency)))}" target="_blank" rel="noopener">${icon("wa")}<span>اطلب</span></a>
          </div>
        </div>
      </article>`;
    };
    return `
  <section class="sec px-catalog" id="${esc(d.id || "catalog")}" data-px-catalog data-page="${page}">
    <div class="wrap">
      <div class="sec-head" data-reveal>
        ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
        <h2 class="h-lg" data-split>${esc(d.title)}</h2>
        ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ""}
      </div>
      ${cats.length > 2 ? `<div class="px-filters" role="group" aria-label="الأقسام">${cats.map((c, i) => `<button type="button" class="px-chip" data-cat="${esc(c.id)}" aria-pressed="${i === 0}">${esc(c.label)}${c.id === "all" ? ` <small>${items.length}</small>` : ` <small>${items.filter((x) => x.cat === c.id).length}</small>`}</button>`).join("")}</div>` : ""}
      <div class="px-grid">${items.map(card).join("")}</div>
      <div class="px-more"${items.length > page ? "" : " hidden"}><button type="button" class="btn ghost" data-px-more>اعرض منتجات أكتر</button></div>
    </div>
  </section>`;
  };

  /* ---------- قسم طبقات القطعة (كيف منصنعها) ---------- */
  S.craft = (d, site) => {
    const W = 240, H = 330, name = site.brand.name;
    const pearls = []; // لؤلؤ على طول الإطار
    for (let i = 0; i <= 30; i++) { const a = Math.PI * (i / 30); pearls.push([W / 2 - Math.cos(a) * (W / 2 - 13), W / 2 - Math.sin(a) * (W / 2 - 13)]); }
    for (let y = W / 2 + 14; y < H - 10; y += 14) { pearls.push([13, y], [W - 13, y]); }
    const svg = (inner, cls = "") => `<svg class="${cls}" viewBox="-6 -6 ${W + 12} ${H + 12}" aria-hidden="true">${inner}</svg>`;
    const id = "pxg" + Math.random().toString(36).slice(2, 7);
    const gold = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset=".35" stop-color="var(--accent)"/><stop offset=".6" stop-color="#7a5418"/><stop offset="1" stop-color="#f6dc93"/></linearGradient></defs>`;
    return `
  <section class="sec px-craft" id="${esc(d.id || "craft")}" data-px-craft>
    <div class="wrap px-craft-grid">
      <div class="px-craft-copy">
        <div class="sec-head" data-reveal>
          ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
          <h2 class="h-lg" data-split>${esc(d.title)}</h2>
        </div>
        <ol class="px-steps">${(d.steps || []).map((s, i) => `<li class="px-step${i === 0 ? " on" : ""}"><span class="n">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`).join("")}</ol>
      </div>
      <div class="px-stack-wrap" aria-hidden="true">
        <div class="px-stack">
          <div class="px-layer l1">${svg(`${gold}<path d="${archPath(W, H)}" fill="rgba(20,10,14,.82)" stroke="url(#${id})" stroke-width="2"/><path d="${archPath(W, H, 14)}" fill="none" stroke="rgba(255,255,255,.18)"/>`)}<span class="px-lbl">مرآة خلفية</span></div>
          <div class="px-layer l2">${svg(`<path d="${archPath(W, H)}" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/><path class="px-laser" d="${archPath(W, H)}" fill="none" stroke="#ff4d6d" stroke-width="2.5" pathLength="1"/>`)}<span class="px-lbl">لوح بلكسي بالليزر</span></div>
          <div class="px-layer l3">${svg(`${gold}<text x="${W / 2}" y="${H * 0.52}" text-anchor="middle" font-size="${Math.max(30, Math.min(64, 300 / Math.max(3, name.length)))}" fill="url(#${id})" style="font-family:var(--font-display)">${esc(name)}</text><path d="M${W / 2 - 50} ${H * 0.62}h100M${W / 2} ${H * 0.66}l-7 -7 7 -7 7 7z" stroke="url(#${id})" stroke-width="2" fill="url(#${id})"/><text x="${W / 2}" y="${H * 0.76}" text-anchor="middle" direction="ltr" unicode-bidi="bidi-override" font-size="15" fill="url(#${id})" style="font-family:var(--font-body)">${esc(d.date || "2026 · 11 · 06")}</text>`)}<span class="px-lbl">حروف مرآة ذهبية</span></div>
          <div class="px-layer l4">${svg(`${gold}<path d="${archPath(W, H)} ${archPath(W, H, 26).replace(/^M/, "M")}" fill="url(#${id})" fill-rule="evenodd"/>${pearls.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5.2" fill="#fffdf8" stroke="rgba(120,90,60,.35)" stroke-width=".6"/>`).join("")}`)}<span class="px-lbl">إطار ولؤلؤ</span></div>
          <div class="px-base"></div>
        </div>
      </div>
    </div>
  </section>`;
  };

  /* ---------- قسم المختارات: عرض دوّار ---------- */
  S.showcase = (d, site) => {
    const cat = catalogOf(site);
    let list = (d.items && d.items.length ? d.items : (cat.items || []).map((it, i) => Object.assign({ i }, it)).filter((it) => it.featured)).filter((it) => imgOf(it) || !d.items);
    if (!list.length) list = (cat.items || []).slice(0, 6).map((it, i) => Object.assign({ i }, it));
    return `
  <section class="sec px-show" id="${esc(d.id || "showcase")}" data-px-show>
    <div class="wrap">
      <div class="sec-head center" data-reveal>
        ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
        <h2 class="h-lg" data-split>${esc(d.title)}</h2>
        ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ""}
      </div>
    </div>
    <div class="px-rail-nav"><button type="button" data-rail-go="1" aria-label="السابق">→</button><button type="button" data-rail-go="-1" aria-label="التالي">←</button></div>
    <div class="px-rail-wrap"><div class="px-rail">
      ${list.map((it) => `<figure class="px-slide">
        <button type="button" class="px-slide-img" ${it.i != null ? `data-px-open="${it.i}"` : ""} aria-label="${esc(it.name)}">
          ${imgOf(it) ? `<img src="${esc(thumbOf(it))}" alt="${esc(it.name)}" loading="lazy" decoding="async">` : `<span class="px-ph">${icon("spark")}</span>`}
          <i class="px-shine" aria-hidden="true"></i>
        </button>
        <figcaption><b>${esc(it.name)}</b>${it.price ? `<span>${money(it.price, cat.currency)}</span>` : ""}</figcaption>
      </figure>`).join("")}
    </div></div>
  </section>`;
  };

  /* ---------- بطل سينمائي: hero بـ variant "cinema" ----------
     شاشة مثبتة طويلة: القوس بيتركب، بيتفكك، البابين بينفتحوا، والكاميرا بتفوت لنفق المنتجات.
     النصوص بتظهر وبتختفي حسب التقدّم (data-at="ظهور-بداية,ظهور-نهاية,اختفاء-بداية,اختفاء-نهاية"). */
  const baseHero = S.hero;
  S.hero = (d, site) => {
    if (d.variant !== "cinema") return baseHero(d, site);
    const cat = catalogOf(site), items = cat.items || [];
    const feat = items.filter((x) => x.featured && imgOf(x));
    const rest = items.filter((x) => !x.featured && imgOf(x));
    const tunnel = (feat.length ? feat.concat(rest) : items).slice(0, 16).map((x) => ({ img: thumbOf(x), name: x.name }));
    const n = items.length;
    const L = d.lines || {};
    return `
  <section class="s-hero px-cinema" id="hero" data-px-cinema>
    <div class="px-sticky">
      <div class="stage" data-scene="${esc(site.theme.scene)}"></div>
      <script type="application/json" class="px-cine-data">${JSON.stringify(tunnel).replace(/</g, "\\u003c")}</script>
      <div class="px-cine-veil px-c" data-at="0,0,0.1,0.22"></div>
      <div class="wrap px-c px-c1" data-at="0,0,0.1,0.17">
        <div class="copy">
          ${d.eyebrow ? `<span class="eyebrow" data-hero-in>${esc(d.eyebrow)}</span>` : ""}
          <h1 class="h-xl" data-split="hero">${esc(d.title)}</h1>
          <p class="lead" data-hero-in>${esc(d.lead)}</p>
          <div class="actions" data-hero-in>
            <a class="btn" href="#${esc(d.primaryTarget || "catalog")}" data-magnetic>${esc(d.primary)} ${icon("arrow")}</a>
            ${d.secondary ? `<a class="btn ghost" href="#${esc(d.secondaryTarget || "about")}">${esc(d.secondary)}</a>` : ""}
          </div>
          ${d.badges ? `<div class="badges" data-hero-in>${d.badges.map((b) => `<span class="chip"><b>${esc(b.k)}</b> ${esc(b.v)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
      <div class="px-c px-c2 px-side" data-at="0.17,0.22,0.36,0.41"><span class="eyebrow">${esc(L.k2 || "طبقة فوق طبقة")}</span><p class="px-huge">${esc(L.t2 || "مرآة، كريستال، وحروف من دهب")}</p></div>
      <div class="px-c px-c3 px-mid" data-at="0.43,0.48,0.56,0.6"><p class="px-huge">${esc(L.t3 || "تفضّلوا لجوّا")}</p></div>
      <div class="px-c px-c4 px-mid" data-at="0.66,0.72,0.86,0.9"><p class="px-count"><b data-px-n="${n}">${n}</b></p><p class="px-huge sm">${esc(L.t4 || "قطعة بتستنّى أساميكم")}</p></div>
      <div class="px-c px-c5 px-mid" data-at="0.9,0.95,2,2"><p class="px-huge">${esc(L.t5 || "اختاروا قطعتكم")}</p><a class="btn" href="#${esc(d.primaryTarget || "catalog")}" data-magnetic>${esc(d.primary)} ${icon("arrow")}</a></div>
      <div class="px-meter" aria-hidden="true"><i></i></div>
      <div class="scroll-hint" aria-hidden="true">انزل لتفوت<i></i></div>
      <a class="px-skip" href="#${esc(d.primaryTarget || "catalog")}">تخطّى للمنتجات</a>
    </div>
  </section>`;
  };

  /* ---------- نافذة تفاصيل المنتج ---------- */
  function openProduct(root, site, i) {
    const d = catalogOf(site), it = (d.items || [])[i];
    if (!it) return;
    // صفحة خاصة لكل منتج (engine/plexi-product.js)، والنافذة بس احتياط إذا الملف مش محمّل
    if (SM.pxGo) { SM.pxGo(it, i); return; }
    let dlg = document.querySelector(".px-dialog");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "px-dialog";
      dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-px-close]")) dlg.close(); });
      document.body.appendChild(dlg);
    }
    const imgs = it.imgs && it.imgs.length ? it.imgs : imgOf(it) ? [imgOf(it)] : [];
    dlg.innerHTML = `<div class="px-dlg-in">
      <button type="button" class="px-x" data-px-close aria-label="إغلاق">×</button>
      <div class="px-dlg-media">${imgs.length ? `<img class="px-dlg-main" src="${esc(imgs[0])}" alt="${esc(it.name)}">` : `<span class="px-ph">${icon("spark")}</span>`}
        ${imgs.length > 1 ? `<div class="px-thumbs">${imgs.map((s, k) => `<button type="button" data-src="${esc(s)}" aria-pressed="${k === 0}"><img src="${esc(s)}" alt=""></button>`).join("")}</div>` : ""}</div>
      <div class="px-dlg-body">
        <h3>${esc(it.name)}</h3>
        ${it.price ? `<b class="px-price">${money(it.price, d.currency)}</b>` : ""}
        ${it.desc ? `<p class="px-desc">${esc(it.desc)}</p>` : ""}
        ${it.details ? `<div class="px-details">${esc(it.details)}</div>` : ""}
        <div class="px-dlg-note"><label><span>الأسماء أو التاريخ <small>(اختياري)</small></span><input data-note="names" placeholder="مثلاً: محمد و سارة · 14/2" enterkeyhint="done"></label>
          <label><span>اللون <small>(اختياري)</small></span><input data-note="color" placeholder="ذهبي، فضي، وردي..." enterkeyhint="done"></label></div>
        <div class="px-dlg-acts"><a class="btn px-wa-btn" href="${esc(waLink(site, orderText(site, it, d.currency)))}" target="_blank" rel="noopener">${icon("wa")} اطلب على واتساب</a>
          ${SM.pxCart ? `<button type="button" class="btn ghost" data-px-add>أضف للسلة</button>` : ""}</div>
        <div class="px-dlg-more">${document.querySelector("[data-px-studio]") ? `<button type="button" data-px-try>${icon("pen")} جرّب اسمك عليها</button>` : ""}${SM.pxShare ? `<button type="button" data-px-share>شارك القطعة</button>` : ""}</div>
      </div></div>`;
    dlg.querySelectorAll(".px-thumbs button").forEach((b) => b.addEventListener("click", () => { dlg.querySelector(".px-dlg-main").src = b.dataset.src; dlg.querySelectorAll(".px-thumbs button").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
    const note = () => { const v = (k) => (dlg.querySelector(`[data-note="${k}"]`).value || "").trim(); return { names: v("names"), color: v("color") }; };
    const waBtn = dlg.querySelector(".px-wa-btn");
    dlg.querySelectorAll("[data-note]").forEach((inp) => {
      inp.addEventListener("input", () => { const n = note(); waBtn.href = waLink(site, orderText(site, it, d.currency).replace(/\n\nالاسم والتاريخ اللي بدي ياهن: $/, "") + `\n\n✍️ الأسماء/البيانات: ${n.names}\n🎨 اللون: ${n.color}`); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") inp.blur(); });
    });
    const addB = dlg.querySelector("[data-px-add]"); if (addB) addB.addEventListener("click", () => { SM.pxCart.add(it, note()); dlg.close(); });
    const shB = dlg.querySelector("[data-px-share]"); if (shB) shB.addEventListener("click", () => SM.pxShare(it));
    const tryB = dlg.querySelector("[data-px-try]"); if (tryB) tryB.addEventListener("click", () => { dlg.close(); SM.pxStudio && SM.pxStudio.open(it.name); });
    // عرض 3D للصورة: لوح أكريليك سميك بيلف مع الماوس أو الإصبع
    const media = dlg.querySelector(".px-dlg-media");
    if (media && matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) media.addEventListener("pointermove", (e) => { const r = media.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; media.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg"); media.style.setProperty("--ry", (x * 10).toFixed(2) + "deg"); });
    if (media) media.addEventListener("pointerleave", () => { media.style.setProperty("--rx", "0deg"); media.style.setProperty("--ry", "0deg"); });
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    dlg.scrollTop = 0; const din = dlg.querySelector(".px-dlg-in"); if (din) din.scrollTop = 0;
    if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) window.gsap.from(dlg.querySelector(".px-dlg-in"), { y: 40, rotateX: -10, opacity: 0, duration: 0.7, ease: "expo.out" });
  }

  /* ---------- التفاعل والحركة ---------- */
  function init(root, site) {
    const g = window.gsap, ST = window.ScrollTrigger, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anim = g && ST && !reduce;

    // آخر كلمة بكل عنوان بلمعة ذهب
    root.querySelectorAll("h1[data-split], h2[data-split]").forEach((h) => { const w = h.querySelectorAll(".w"); (w.length ? w[w.length - 1] : h).classList.add("px-g"); });

    // البطل السينمائي
    root.querySelectorAll("[data-px-cinema]").forEach((sec) => {
      const has3d = !!sec.querySelector(".stage canvas");
      if (!has3d || reduce) { sec.classList.add("px-flat"); return; }
      const parts = [...sec.querySelectorAll("[data-at]")].map((el) => ({ el, at: el.dataset.at.split(",").map(Number) }));
      const meter = sec.querySelector(".px-meter i"), hint = sec.querySelector(".scroll-hint"), num = sec.querySelector("[data-px-n]");
      let last = -1;
      const tick = () => {
        requestAnimationFrame(tick);
        const r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
        if (Math.abs(p - last) < 0.0005) return; last = p;
        parts.forEach(({ el, at }) => {
          const a = at[1] > at[0] ? seg(p, at[0], at[1]) : 1, b = 1 - seg(p, at[2], at[3]), v = Math.min(a, b);
          el.style.opacity = v.toFixed(3);
          el.style.transform = `translateY(${((1 - a) * 40 - (1 - b) * 40).toFixed(1)}px) scale(${(0.96 + v * 0.04).toFixed(3)})`;
          el.style.visibility = v < 0.01 ? "hidden" : "visible";
          el.style.filter = v < 0.999 ? `blur(${((1 - v) * 10).toFixed(1)}px)` : "none";
        });
        if (meter) meter.style.transform = `scaleY(${p.toFixed(4)})`;
        if (hint) hint.style.opacity = (1 - seg(p, 0, 0.05)).toFixed(3);
        if (num) num.textContent = Math.round(+num.dataset.pxN * ease(seg(p, 0.66, 0.8)));
      };
      tick();
    });

    // فتح التفاصيل
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-px-open]"); if (b) { e.preventDefault(); openProduct(root, site, +b.dataset.pxOpen); return; }
      const c = e.target.closest(".px-card"); if (c && !e.target.closest("a, button, input")) openProduct(root, site, +c.dataset.i);
    });

    // فلترة ومزيد
    root.querySelectorAll("[data-px-catalog]").forEach((sec) => {
      const page = +sec.dataset.page || 12, cards = [...sec.querySelectorAll(".px-card")], more = sec.querySelector(".px-more");
      let cat = "all", shown = page;
      const apply = (animate) => {
        const match = cards.filter((c) => cat === "all" || c.dataset.cat === cat);
        cards.forEach((c) => c.classList.add("px-off"));
        const vis = match.slice(0, shown); vis.forEach((c) => c.classList.remove("px-off"));
        more.hidden = match.length <= shown;
        if (animate && anim) g.fromTo(vis.slice(animate === "more" ? shown - page : 0), { y: 40, opacity: 0, rotateX: -14 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: "expo.out", stagger: 0.04, clearProps: "transform,opacity" });
        ST && ST.refresh();
      };
      sec.querySelectorAll(".px-chip").forEach((b) => b.addEventListener("click", () => {
        sec.querySelectorAll(".px-chip").forEach((x) => x.setAttribute("aria-pressed", x === b));
        cat = b.dataset.cat; shown = page; apply(true);
      }));
      sec.querySelector("[data-px-more]").addEventListener("click", () => { shown += page; apply("more"); });
      if (anim) {
        ST.batch(cards, { start: "top 92%", once: true, onEnter: (els) => g.fromTo(els, { y: 70, opacity: 0, rotateX: -18, transformOrigin: "50% 100%" }, { y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, clearProps: "transform,opacity" }) });
      }
    });

    // الطلب من نموذج التواصل بيفتح واتساب
    if (site.brand.whatsapp) {
      root.querySelectorAll("[data-form]").forEach((f) => {
        const ok = f.querySelector(".ok"); if (ok) ok.textContent = "فتحنالك واتساب لتكمل الطلب. إذا ما انفتح، راسلنا على " + site.brand.whatsapp;
        f.addEventListener("submit", () => {
          const v = (n) => (f.elements[n] && f.elements[n].value.trim()) || "";
          const t = `مرحبا ${site.brand.name}\nالاسم: ${v("name")}\nالهاتف: ${v("phone")}${v("subject") ? "\nالطلب: " + v("subject") : ""}\n${v("message")}`;
          window.open(waLink(site, t), "_blank", "noopener");
        });
      });
      root.querySelectorAll(".wa, .s-cta .btn").forEach((a) => { a.href = waLink(site, `مرحبا ${site.brand.name}، عندي استفسار عن طلب`); a.target = "_blank"; a.rel = "noopener"; });
    }

    if (!anim) return;

    // طبقات القطعة: بتتفكك بالمنظور، الليزر بيرسم، الحروف بتنزل، وبعدين بتتركب وبتلف لقدام
    root.querySelectorAll("[data-px-craft]").forEach((sec) => {
      const L = (n) => sec.querySelector(".l" + n), steps = [...sec.querySelectorAll(".px-step")], stack = sec.querySelector(".px-stack");
      const setStep = (k) => steps.forEach((s, i) => s.classList.toggle("on", i === k));
      const laser = sec.querySelector(".px-laser");
      const tl = g.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: sec, start: "top top", end: "+=130%", pin: true, scrub: 0.8, anticipatePin: 1,
        onUpdate: (s) => setStep(Math.min(steps.length - 1, Math.floor(s.progress * steps.length * 0.999))) } });
      g.set(stack, { rotateX: 58, rotateZ: -32, rotateY: 0 });
      g.set([L(1), L(2), L(3), L(4)], { z: 0, opacity: 0 });
      g.set(laser, { strokeDasharray: 1, strokeDashoffset: 1 });
      tl.to(L(1), { opacity: 1, z: -60, duration: 1 }, 0)
        .to(L(2), { opacity: 1, z: 20, duration: 1 }, 0.5)
        .to(laser, { strokeDashoffset: 0, duration: 1.6, ease: "none" }, 1)
        .to(laser, { opacity: 0, duration: 0.3 }, 2.6)
        .fromTo(L(3), { opacity: 0, z: 260 }, { opacity: 1, z: 100, duration: 1.2, ease: "expo.out" }, 2.4)
        .fromTo(L(4), { opacity: 0, z: 380 }, { opacity: 1, z: 180, duration: 1.2, ease: "expo.out" }, 3.4)
        .to(sec.querySelectorAll(".px-lbl"), { opacity: 0, duration: 0.4 }, 4.6)
        .to([L(1), L(2), L(3), L(4)], { z: (i) => [-6, 0, 6, 12][i], duration: 1.4, ease: "expo.inOut" }, 4.8)
        .to(stack, { rotateX: 0, rotateZ: 0, rotateY: -14, duration: 1.6, ease: "expo.inOut" }, 4.8)
        .to(sec.querySelector(".px-base"), { opacity: 1, duration: 0.6 }, 5.6)
        .to(stack, { rotateY: 0, duration: 0.8 }, 6.4);
    });

    // المختارات: انزلاق أفقي مثبت مع دوران ثلاثي الأبعاد حسب البعد عن النص
    root.querySelectorAll("[data-px-show]").forEach((sec) => {
      const wrap = sec.querySelector(".px-rail-wrap"), rail = sec.querySelector(".px-rail"), slides = [...rail.children];
      const dist = () => Math.max(0, rail.scrollWidth - innerWidth);
      const bend = () => {
        const cx = innerWidth / 2;
        slides.forEach((s) => {
          const r = s.getBoundingClientRect(), k = Math.max(-1.6, Math.min(1.6, (r.left + r.width / 2 - cx) / (innerWidth * 0.5)));
          s.style.transform = `perspective(1100px) translateZ(${-Math.abs(k) * 160}px) rotateY(${-k * 32}deg) scale(${1 - Math.abs(k) * 0.08})`;
          s.style.setProperty("--lit", (1 - Math.min(1, Math.abs(k))).toFixed(3));
        });
      };
      // انزلاق أفقي عادي بالإصبع أو الأسهم، بدون ما نثبّت الصفحة
      wrap.addEventListener("scroll", () => requestAnimationFrame(bend), { passive: true });
      sec.querySelectorAll("[data-rail-go]").forEach((b) => b.addEventListener("click", () => wrap.scrollBy({ left: +b.dataset.railGo * (slides[0].offsetWidth + 30), behavior: "smooth" })));
      bend();
      addEventListener("resize", bend);
    });

    // لمعة على البطاقات مع الانزلاق (متل ضو بيمرق على بلكسي)
    if (!LITE) root.querySelectorAll(".px-card .px-shine").forEach((el) => {
      g.fromTo(el, { "--sweep": "-60%" }, { "--sweep": "160%", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  // شاشة تحميل: الشعار مع خط ذهب، وبعدين ستارة بتنرفع
  function preload(site) {
    if (document.querySelector(".px-pre")) return;
    const el = document.createElement("div"); el.className = "px-pre"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<div class="px-pre-in">${site.brand.logo ? `<img src="${esc(site.brand.logo)}" alt="">` : `<b>${esc(site.brand.mark)}</b>`}<span>${esc(site.brand.name)}</span><i><u></u></i></div>`;
    document.body.appendChild(el);
    const done = () => { el.classList.add("out"); setTimeout(() => el.remove(), 1400); };
    let ok = false; const go = () => { if (!ok) { ok = true; setTimeout(done, 450); } };
    if (document.readyState === "complete") go(); else addEventListener("load", go);
    setTimeout(go, 3500);
  }

  // بنربط حالنا بعد الحركة الأساسية، فقط إذا الصفحة فيها أقسامنا
  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg, mount) {
    const site = baseRender.call(this, cfg, mount);
    const root = mount || document.getElementById("site");
    if (root.querySelector("[data-px-catalog], [data-px-craft], [data-px-show], [data-px-cinema]")) { init(root, site); preload(site); }
    return site;
  };

  /* ---------- مشهد acrylic ----------
     ستاند قوس: مرآة غامقة + لوح أكريليك (كبابين بينفتحوا) + حروف مرآة ذهبية + إطار ذهبي ولؤلؤ + قاعدة.
     بوضع السينما (القسم [data-px-cinema]): مع الانزلاق الطبقات بتتفكك، البابين بينفتحوا،
     والكاميرا بتعبر القوس لنفق من ألواح بلكسي عليها صور المنتجات، مع غبار ذهبي. */
  const T = window.THREE;
  function textTexture(name) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 1024;
    const tex = new T.CanvasTexture(c);
    const draw = () => {
      const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 1024, 1024);
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = "rtl";
      const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display") || "serif";
      let fs = 300; x.font = `700 ${fs}px ${fam}`;
      while (x.measureText(name).width > 760 && fs > 80) { fs -= 10; x.font = `700 ${fs}px ${fam}`; }
      x.fillText(name, 512, 470);
      x.fillRect(332, 640, 360, 6);
      x.save(); x.translate(512, 643); x.rotate(Math.PI / 4); x.fillRect(-18, -18, 36, 36); x.restore();
      x.beginPath(); x.arc(312, 643, 9, 0, 7); x.arc(712, 643, 9, 0, 7); x.fill();
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts) document.fonts.ready.then(draw);
    return tex;
  }
  function labelTexture(name, colors) {
    // صورة بديلة للوح إذا المنتج بلا صورة
    const c = document.createElement("canvas"); c.width = 512; c.height = 640;
    const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 512, 640);
    g.addColorStop(0, colors.surface); g.addColorStop(1, colors.accent); x.fillStyle = g; x.fillRect(0, 0, 512, 640);
    x.fillStyle = colors.ink; x.textAlign = "center"; x.direction = "rtl"; x.font = "700 40px Tajawal, sans-serif"; x.fillText(name.slice(0, 22), 256, 330);
    return new T.CanvasTexture(c);
  }

  function archShape(w, h, inset = 0) {
    const r = w / 2 - inset, s = new T.Shape();
    s.moveTo(-r, -h / 2 + inset); s.lineTo(r, -h / 2 + inset); s.lineTo(r, h / 2 - w / 2); s.absarc(0, h / 2 - w / 2, r, 0, Math.PI, false); s.lineTo(-r, -h / 2 + inset);
    return s;
  }
  // نص القوس (باب): side = -1 يسار، 1 يمين. المحور عند المفصلة (الحافة الخارجية)
  function doorShape(w, h, side) {
    const r = w / 2, cy = h / 2 - w / 2, s = new T.Shape();
    s.moveTo(0, -h / 2); s.lineTo(side * r, -h / 2); s.lineTo(side * r, cy);
    s.absarc(0, cy, r, side > 0 ? 0 : Math.PI, Math.PI / 2, side < 0);
    s.lineTo(0, -h / 2);
    return s;
  }

  const inout = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  function acrylic(container, colors, o) {
    const cine = container.closest("[data-px-cinema]");
    const st = SM.stage(container, colors, { exposure: 1.15 });
    if (LITE) { st.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); st.renderer.setSize(container.clientWidth || 1, container.clientHeight || 1, false); }
    const { scene, camera, renderer } = st;
    const bg = new T.Color(colors.bg), night = new T.Color("#140c10");
    scene.background = bg.clone();
    renderer.setClearColor(bg, 1);
    if (cine) { scene.fog = new T.Fog(bg, 9, 30); camera.far = 120; camera.updateProjectionMatrix(); }
    scene.add(new T.HemisphereLight(0xffffff, new T.Color(colors.accent2), 0.8));
    const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 5, 6); scene.add(key);
    const warm = new T.PointLight(new T.Color(colors.accent), 40, 18); warm.position.set(3, 2, 3); scene.add(warm);
    const rose = new T.PointLight(new T.Color(colors.accent2), 25, 14); rose.position.set(-3, -2, 2); scene.add(rose);
    const camLight = new T.PointLight(0xffffff, 30, 12); scene.add(camLight);

    const W = 2.3, H = 3.3, cy = H / 2 - W / 2;
    const root = new T.Group(), group = new T.Group(); root.add(group); scene.add(root);
    const goldC = new T.Color(colors.accent).lerp(new T.Color("#ffd98a"), 0.35);
    const gold = new T.MeshPhysicalMaterial({ color: goldC, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
    const glass = LITE ? new T.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.38, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false })
      : new T.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.35, ior: 1.49, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, attenuationColor: new T.Color(colors.accent2).lerp(new T.Color("#ffffff"), 0.75), attenuationDistance: 2.5, side: T.DoubleSide });
    const darkMirror = new T.MeshPhysicalMaterial({ color: new T.Color(colors.ink).lerp(new T.Color("#000"), 0.4), metalness: 1, roughness: 0.06, clearcoat: 1, transparent: true });
    const ex = (shape, depth, bevel = 0.02) => { const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: LITE ? 24 : 48 }); g.translate(0, 0, -depth / 2); return g; };

    // البابين: كل باب = نص مرآة + نص أكريليك، بيلفّ حول مفصلته
    const doors = [-1, 1].map((side) => {
      const pivot = new T.Group(); pivot.position.x = side * W / 2;
      const m = new T.Mesh(ex(doorShape(W, H, side), 0.05, 0.01), darkMirror); m.position.set(-side * W / 2, 0, -0.12);
      const g = new T.Mesh(ex(doorShape(W, H, side), 0.14, 0.025), glass); g.position.set(-side * W / 2, 0, 0);
      pivot.add(m, g); pivot.userData = { side, m, g }; group.add(pivot); return pivot;
    });
    const words = new T.Mesh(new T.PlaneGeometry(W * 0.92, W * 0.92), new T.MeshPhysicalMaterial({ color: goldC, metalness: 1, roughness: 0.18, clearcoat: 1, alphaMap: textTexture((o.name || document.title.split(" · ")[0]).trim()), transparent: true, alphaTest: 0.4, side: T.DoubleSide }));
    words.position.y = 0.05;
    const frameS = archShape(W, H); frameS.holes.push(archShape(W, H, 0.16));
    const frame = new T.Group();
    frame.add(new T.Mesh(ex(frameS, 0.06, 0.015), gold));
    const pts = [], r0 = W / 2 - 0.08;
    for (let i = 0; i <= 34; i++) { const a = Math.PI * (i / 34); pts.push([Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
    for (let y = cy - 0.13; y > -H / 2 + 0.1; y -= 0.13) pts.push([r0, y], [-r0, y]);
    const pearl = new T.InstancedMesh(new T.SphereGeometry(0.055, LITE ? 10 : 20, LITE ? 8 : 14), new T.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 1, sheenColor: new T.Color("#ffe6f0"), iridescence: 0.5 }), pts.length);
    const m4 = new T.Matrix4(); pts.forEach((p, i) => { m4.makeTranslation(p[0], p[1], 0.05); pearl.setMatrixAt(i, m4); });
    frame.add(pearl);
    const base = new T.Mesh(new T.BoxGeometry(W + 0.5, 0.16, 0.7), gold); base.position.y = -H / 2 - 0.08;
    const baseGlass = new T.Mesh(new T.BoxGeometry(W + 0.3, 0.12, 0.55), glass); baseGlass.position.y = -H / 2 - 0.22;
    group.add(words, frame, base, baseGlass);

    // قطع صغيرة طايرة: قلوب ونجوم ودوائر
    const heart = new T.Shape(); heart.moveTo(0, -0.18); heart.bezierCurveTo(-0.3, 0.02, -0.18, 0.26, 0, 0.12); heart.bezierCurveTo(0.18, 0.26, 0.3, 0.02, 0, -0.18);
    const star = new T.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.08 : 0.19; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const disc = new T.Shape(); disc.absarc(0, 0, 0.15, 0, Math.PI * 2);
    const bits = [], shapes = [heart, star, disc];
    for (let i = 0; i < (LITE ? 8 : 16); i++) {
      const m = new T.Mesh(ex(shapes[i % 3], 0.05, 0.012), i % 4 === 0 ? gold : glass);
      m.userData = { a: (i / 16) * Math.PI * 2, r: 2.1 + (i % 3) * 0.45, y: Math.sin(i * 2.3) * 1.8, sp: 0.15 + (i % 5) * 0.04, rs: 0.4 + (i % 3) * 0.3 };
      m.scale.setScalar(0.7 + (i % 4) * 0.2);
      root.add(m); bits.push(m);
    }

    // نفق المنتجات (السينما فقط)
    const panels = [], Z0 = -5, GAP = 3.1;
    let dust = null, tunnelEnd = 0;
    if (cine) {
      let list = [];
      try { list = JSON.parse((cine.querySelector(".px-cine-data") || {}).textContent || "[]"); } catch (e) {}
      const small = innerWidth < 700;
      list = list.slice(0, LITE ? 9 : 16);
      const loader = new T.TextureLoader();
      const frameMat = gold;
      list.forEach((it, i) => {
        const p = new T.Group(), side = i % 2 ? 1 : -1;
        const pw = 1.7, ph = 2.12;
        const mat = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, map: it.img ? null : labelTexture(it.name || "", colors) });
        if (it.img) loader.load(it.img, (tx) => { tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; const a = tx.image.width / tx.image.height; const r = pw / ph; tx.repeat.set(a > r ? r / a : 1, a > r ? 1 : a / r); tx.offset.set((1 - tx.repeat.x) / 2, (1 - tx.repeat.y) / 2); mat.map = tx; mat.needsUpdate = true; });
        const photo = new T.Mesh(new T.PlaneGeometry(pw, ph), mat); photo.position.z = 0.051;
        const slab = new T.Mesh(new T.BoxGeometry(pw + 0.24, ph + 0.24, 0.1), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.35, side: T.DoubleSide }));
        const edge = new T.Mesh(new T.BoxGeometry(pw + 0.3, 0.05, 0.12), frameMat); edge.position.y = -ph / 2 - 0.15;
        p.add(slab, photo, edge);
        const R = small ? 1.55 : 2.35;
        p.position.set(side * R + (small ? 0 : Math.sin(i * 1.7) * 0.25), Math.sin(i * 2.1) * (small ? 0.5 : 0.7), Z0 - i * GAP);
        p.rotation.y = -side * (small ? 0.55 : 0.7);
        p.userData = { y: p.position.y, k: i };
        root.add(p); panels.push(p);
      });
      tunnelEnd = Z0 - Math.max(1, list.length) * GAP;
      // غبار ذهبي على طول النفق
      const n = LITE ? 350 : 900, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 9; pos[i * 3 + 1] = (Math.random() - 0.5) * 6; pos[i * 3 + 2] = 6 - Math.random() * (Math.abs(tunnelEnd) + 14); }
      const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
      dust = new T.Points(dg, new T.PointsMaterial({ color: goldC, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false }));
      root.add(dust);
    }

    let prog = 0;
    const progress = () => { const r = cine.getBoundingClientRect(); return clamp01(-r.top / Math.max(1, r.height - innerHeight)); };
    st.update = (dt, t) => {
      const k = ease((t - 0.2) / 2.2); // دخول: الطبقات بتتركب
      if (!cine) {
        const A = SM.anchor(st, o.center), s = st.scroll;
        root.position.set(A.x, A.y, 0); root.scale.setScalar(A.s);
        const sep = (1 - k) * 2.2 + s * 1.6;
        doors.forEach((d) => { d.userData.m.position.z = -0.12 - sep * 0.9; d.rotation.y = 0; });
        words.position.z = 0.1 + sep * 0.7; frame.position.z = 0.16 + sep * 1.3;
        words.rotation.y = 0; frame.rotation.y = (1 - k) * 0.6;
        group.rotation.y = -0.38 + (1 - k) * 1.2 + st.pointer.sx * 0.35 + s * 1.1 + Math.sin(t * 0.5) * 0.05;
        group.rotation.x = 0.05 - st.pointer.sy * 0.15 + s * 0.25;
        group.position.y = Math.sin(t * 0.8) * 0.06 - s * 0.6;
        bits.forEach((b) => { const u = b.userData, a = u.a + t * u.sp; b.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.6 + u.a) * 0.25 + s * 2 * (u.sp * 4), Math.sin(a) * u.r * 0.6); b.rotation.set(t * u.rs, t * u.rs * 0.7, 0); });
        camera.position.set(st.pointer.sx * 0.3, st.pointer.sy * 0.2, 10); camera.lookAt(root.position.x * 0.15, 0, 0);
        camLight.position.copy(camera.position);
        return;
      }
      // ---- السينما ----
      prog += (progress() - prog) * Math.min(1, dt * 6);
      const p = prog, small = !st.wide;
      root.scale.setScalar(small ? 0.74 : 1.12);
      root.position.set(small ? 0 : -2.55 * (1 - inout(seg(p, 0.36, 0.5))), small ? -1.75 * (1 - inout(seg(p, 0.1, 0.3))) : 0, 0);
      // جوّا القوس: صالة عرض غامقة والمنتجات بتضوي، وبالآخر منرجع للون الصفحة
      const dk = inout(seg(p, 0.47, 0.6)) * (1 - inout(seg(p, 0.9, 0.995)));
      scene.background.copy(bg).lerp(night, dk); scene.fog.color.copy(scene.background); renderer.setClearColor(scene.background, 1);
      const ex1 = inout(seg(p, 0.1, 0.32)) * (1 - inout(seg(p, 0.34, 0.46))); // تفكك ثم رجعة
      const sep = (1 - k) * 2.2 + ex1 * 2.4;
      const open = inout(seg(p, 0.42, 0.58)); // البابين
      doors.forEach((d) => {
        const sd = d.userData.side;
        d.userData.m.position.z = -0.12 - sep * 0.9;
        d.rotation.y = sd * open * 1.95;
        d.userData.m.material.opacity = 1 - seg(p, 0.5, 0.6);
      });
      words.position.z = 0.1 + sep * 0.7; words.material.opacity = 1 - seg(p, 0.42, 0.5); words.visible = words.material.opacity > 0.01;
      frame.position.z = 0.16 + sep * 1.3; frame.rotation.y = (1 - k) * 0.6;
      const spin = Math.sin(ex1 * Math.PI) * 0.9;
      group.rotation.y = (1 - k) * 1.2 + (-0.32 + st.pointer.sx * 0.3) * (1 - seg(p, 0.3, 0.45)) + spin * 0.6;
      group.rotation.x = 0.04 - st.pointer.sy * 0.12 * (1 - seg(p, 0.3, 0.45)) + ex1 * 0.35;
      group.position.y = Math.sin(t * 0.8) * 0.05 * (1 - seg(p, 0.4, 0.5));
      // الكاميرا: بتقرّب، بتعبر القوس، وبتمشي بالنفق
      const fly = inout(seg(p, 0.5, 1));
      const zA = 10 - inout(seg(p, 0.3, 0.52)) * 3.4;
      const camZ = zA - fly * (zA - (tunnelEnd - 2));
      const doorY = -0.25 * (small ? 0.74 : 1.12);
      camera.position.set(st.pointer.sx * 0.3 + Math.sin(camZ * 0.18) * 0.35 * fly, doorY * seg(p, 0.4, 0.55) + st.pointer.sy * 0.15 + Math.cos(camZ * 0.15) * 0.2 * fly, camZ);
      camera.lookAt(camera.position.x * 0.5 + root.position.x * (1 - fly), camera.position.y * 0.6, camZ - 8);
      camera.rotation.z = Math.sin(camZ * 0.08) * 0.05 * fly;
      camLight.position.set(camera.position.x, camera.position.y + 1, camZ - 1.5);
      bits.forEach((b) => { const u = b.userData, a = u.a + t * u.sp; b.position.set(Math.cos(a) * u.r * (1 + ex1 * 0.6), u.y + Math.sin(t * 0.6 + u.a) * 0.25, Math.sin(a) * u.r * 0.6); b.rotation.set(t * u.rs, t * u.rs * 0.7, 0); b.visible = p < 0.75; });
      panels.forEach((pn) => {
        const d = pn.position.z - camZ; // سالب = قدام الكاميرا
        const near = clamp01(1 - (-d - 2) / 14);
        pn.position.y = pn.userData.y + Math.sin(t * 0.7 + pn.userData.k) * 0.08;
        pn.scale.setScalar(0.85 + near * 0.15);
        pn.visible = d < 1.5 && p > 0.38;
      });
      if (dust) { dust.rotation.z = t * 0.02; dust.material.opacity = 0.85 * seg(p, 0.35, 0.5); }
    };
    return st;
  }
  if (T && SM.stage) {
    SM.scenes = SM.scenes || {};
    SM.scenes.acrylic = acrylic;
  }
})();
