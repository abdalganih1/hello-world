/* صمّم · صفحة خاصة لكل منتج (قالب البلكسي)
   بدل النافذة المنبثقة: كل قطعة إلها رابط (?p=<id> افتراضياً، أو cfg.productUrl متل "/product/{id}").
   الصفحة على الموبايل شاشة وحدة بلا نزول: فوق العارض (صور القطعة، 3D باسمك، قبل القص)،
   وتحت أدوات الكتابة والشكل واللون، وبآخرها صف واحد: اطلب على واتساب + أضف للسلة + شارك.
   لما الزبون يكتب، الكيبورد بيطلع والعارض بيصغر بس بيضل قدامه، والشريط السفلي بيختفي.
   بتنحمّل بعد plexi-studio.js (بتستعمل نفس محرك الـ 3D) وقبل plexi-shop.js. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const S = SM.sections, esc = SM.esc;
  if (!S) return;

  let PURL = "?p={id}", HOME = "";
  const homeHref = () => HOME || location.pathname + (() => { const q = new URLSearchParams(location.search); q.delete("p"); const s = q.toString(); return s ? "?" + s : ""; })();
  const productHref = (it, i) => {
    const id = it && it.id != null && it.id !== "" ? it.id : i;
    if (PURL.startsWith("?")) { const q = new URLSearchParams(location.search); q.set("p", id); return location.pathname + "?" + q.toString(); }
    return PURL.replace("{id}", encodeURIComponent(id));
  };
  SM.pxProductHref = productHref;
  SM.pxGo = (it, i) => { location.href = productHref(it, i); };

  const ic = (n) => (SM.pxIc ? SM.pxIc(n) : SM.icon(n));
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = { back: '<path d="M9 6l6 6-6 6"/>', cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>', photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>', cut: '<path d="M4 4h16v16H4z" stroke-dasharray="3 2"/>', img: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 9v6M9 12h6"/>' };

  const guessMat = (it) => { const n = (it.name || "") + " " + (it.desc || ""); if (/أسود|اسود/.test(n)) return "black"; if (/وردي|زهري|روز/.test(n)) return "rose"; if (it.cat === "mdf" || /خشب|أبيض|ابيض/.test(n)) return "white"; return ""; };

  const findItem = (site, pid) => {
    const items = SM.pxUtil.catalogOf(site).items || [];
    let i = items.findIndex((x) => String(x.id) === String(pid));
    if (i < 0 && /^\d+$/.test(String(pid)) && items[+pid] && items[+pid].id == null) i = +pid;
    return { it: items[i], i };
  };

  S.product = (d, site) => {
    const U = SM.pxUtil, K = SM.pxKit, { it, i } = findItem(site, d.pid), cur = U.catalogOf(site).currency;
    if (!it) return `<section class="px-pp px-pp-miss" id="product"><div class="wrap"><h1 class="h-lg">ما لقينا هالقطعة</h1><p class="lead">يمكن انشالت أو تغيّر رابطها.</p><a class="btn" href="${esc(homeHref())}#catalog">شوف كل المنتجات</a></div></section>`;
    const imgs = it.imgs && it.imgs.length ? it.imgs : U.imgOf(it) ? [U.imgOf(it)] : [];
    const shape = K ? K.guess(it.name, it) : "arch", md = (K && K.SHAPES[shape]) || {}, gm = guessMat(it), mat = gm || md.mat || "clear", ink = md.ink || "gold", pearls = !!md.pearls || /لؤلؤ|لولو/.test(it.name + (it.desc || ""));
    // مثال مناسب لنوع القطعة (تخرج، مولود، عرس، هدية، شعار) بدل نفس الأسامي بكل مكان
    const ex = K ? K.exampleFor(it, md) : { kind: "wedding", labels: ["الاسم الأول", "الاسم التاني", "التاريخ أو عبارة"], n1: "محمد", n2: "سارة", line: "14 · 2 · 2027" };
    const inks = md.inks || (K && K.INKS), lampy = !!md.inks, shapes = K ? (lampy ? Object.keys(K.SHAPES).filter((k) => K.SHAPES[k].inks) : [shape, ...K.STUDIO.filter((k) => k !== shape)]) : [];
    const lab = (k, opt) => esc(ex.labels[k]).replace(/ \((اختياري)\)/, ' <small>($1)</small>');
    const sw = (obj, key, sel) => Object.entries(obj).map(([k, v]) => `<button type="button" class="px-pp-dot" data-${key}="${k}" aria-pressed="${k === sel}" aria-label="${esc(v[0])}" title="${esc(v[0])}"><i style="background:${v[1]}"></i></button>`).join("");
    return `
  <section class="px-pp" id="product" data-px-product data-i="${i}" data-shape="${shape}" data-mat="${mat}" data-ink="${ink}" data-pearls="${pearls ? 1 : 0}" data-kind="${ex.kind}">
    <div class="px-pp-in"><div class="px-pp-screen">
      <div class="px-pp-head">
        <a class="px-pp-back" href="${esc(homeHref())}#catalog" aria-label="رجوع لكل المنتجات">${svg(I.back)}<span>المنتجات</span></a>
        <div class="px-pp-title"><h1>${esc(it.name)}</h1>${it.price ? `<b class="px-price">${U.money(it.price, cur)}</b>` : ""}</div>
        <button type="button" class="px-pp-cart" data-pp-cart aria-label="السلة">${ic("bag")}<b class="px-cart-n" hidden></b></button>
      </div>
      <div class="px-pp-view">
        <div class="px-pp-pane px-pp-photos" data-pane="photo">
          ${imgs.length ? `<div class="px-pp-track">${imgs.map((s, k) => `<img src="${esc(s)}" alt="${esc(it.name)}${k ? " " + (k + 1) : ""}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" draggable="false">`).join("")}</div>
          ${imgs.length > 1 ? `<div class="px-pp-dots" aria-hidden="true">${imgs.map((_, k) => `<i${k ? "" : ' class="on"'}></i>`).join("")}</div>` : ""}` : `<span class="px-ph">${SM.icon("spark")}</span>`}
        </div>
        <div class="px-pp-pane px-pp-3d" data-pane="3d" hidden role="img" aria-label="معاينة ثلاثية الأبعاد باسمك"></div>
        <div class="px-pp-pane px-pp-2d" data-pane="2d" hidden></div>
        ${K ? `<div class="px-pp-tabs" role="group" aria-label="طريقة العرض">
          <button type="button" data-v="photo" aria-pressed="true">${svg(I.photo)}<span>الصور</span></button>
          <button type="button" data-v="3d" aria-pressed="false">${svg(I.cube)}<span>3D باسمك</span></button>
          <button type="button" data-v="2d" aria-pressed="false">${svg(I.cut)}<span>قبل القص</span></button>
        </div>
        <button type="button" class="px-pp-try" data-v="3d">${ic("pen")}<span>اكتب اسمك وشوفه عليها</span></button>
        ${imgs.length ? `<button type="button" class="px-pp-pip" data-v="photo" hidden aria-label="رجوع لصورة القطعة"><img src="${esc(U.thumbOf(it))}" alt=""></button>` : ""}
        <span class="px-pp-hint" hidden>اسحب لتلفّها · المعاينة تقريبية</span>` : ""}
      </div>
      <form class="px-pp-panel" onsubmit="return false" autocomplete="off">
        ${K ? `<div class="px-pp-fields">
          <label><span>${lab(0)}</span><input name="n1" dir="auto" placeholder="${esc(ex.n1)}" maxlength="22" enterkeyhint="next"></label>
          <label><span>${lab(1)}</span><input name="n2" dir="auto" placeholder="${esc(ex.n2)}" maxlength="22" enterkeyhint="next"></label>
          <label><span>${lab(2)}</span><input name="line" dir="auto" placeholder="${esc(ex.line)}" maxlength="28" enterkeyhint="done"></label>
        </div>
        <div class="px-pp-strip" aria-label="خيارات القطعة">
          <div class="px-pp-grp" role="group" aria-label="الشكل"><small>الشكل</small>${shapes.map((k) => [k, K.SHAPES[k]]).map(([k, v]) => `<button type="button" class="px-pp-shape" data-shape="${k}" aria-pressed="${k === shape}" aria-label="${esc(v.label)}" title="${esc(v.label)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${K.icons[k]}"/></svg></button>`).join("")}</div>
          <div class="px-pp-grp" role="group" aria-label="${lampy ? "لون الإضاءة" : "لون الحروف"}"><small>${lampy ? "الإضاءة" : "الحروف"}</small>${sw(inks, "ink", ink)}</div>
          ${lampy ? "" : `<div class="px-pp-grp" role="group" aria-label="الخامة"><small>الخامة</small>${sw(K.MATS, "mat", mat)}</div>`}
          <div class="px-pp-grp"><label class="px-pp-chip"${md.rim === "pearl" ? "" : " hidden"}><input type="checkbox" name="pearls"${pearls ? " checked" : ""}><span>لؤلؤ</span></label>
            <label class="px-pp-chip">${svg(I.img)}<span data-file-label>صورتك</span><input type="file" name="photo" accept="image/*"></label></div>
        </div>` : ""}
        <div class="px-pp-acts">
          <a class="btn px-pp-wa" href="${esc(U.waLink(site, U.orderText(site, it, cur)))}" target="_blank" rel="noopener">${SM.icon("wa")}<span>اطلب على واتساب</span></a>
          <button type="button" class="btn ghost px-pp-add" data-pp-add>${ic("bag")}<span>أضف للسلة</span></button>
          <button type="button" class="px-pp-share" data-pp-share aria-label="شارك القطعة">${ic("share")}</button>
        </div>
      </form>
    </div>
    ${it.desc || it.details ? `<div class="px-pp-info">
      <h2>عن القطعة</h2>
      ${it.desc ? `<p class="px-desc">${esc(it.desc)}</p>` : ""}
      ${it.details ? `<div class="px-details">${esc(it.details)}</div>` : ""}
      <p class="px-pp-note">المعاينة 3D تقريبية لتتخيّل الكتابة، ومنرجع منأكدلك التصميم النهائي على واتساب قبل القص.</p>
    </div>` : ""}
    </div>
  </section>`;
  };

  function init(root, site) {
    const sec = root.querySelector("[data-px-product]"); if (!sec) return;
    const U = SM.pxUtil, K = SM.pxKit, cat = U.catalogOf(site), cur = cat.currency, it = (cat.items || [])[+sec.dataset.i];
    if (!it) return;
    document.title = it.name + " · " + site.brand.name;
    const f = sec.querySelector(".px-pp-panel"), view = sec.querySelector(".px-pp-view"), host = sec.querySelector(".px-pp-3d"), flat = sec.querySelector(".px-pp-2d");
    const wa = sec.querySelector(".px-pp-wa"), html = document.documentElement, colors = site.theme.colors;
    const st = { shape: sec.dataset.shape, mat: sec.dataset.mat, ink: sec.dataset.ink || "gold", pearls: sec.dataset.pearls === "1", photo: null, photoUrl: "", kind: sec.dataset.kind };
    const inkName = () => { const o = (K && K.SHAPES[st.shape] && K.SHAPES[st.shape].inks) || (K && K.INKS) || {}; return (o[st.ink] || [""])[0]; };
    const labs = [...sec.querySelectorAll(".px-pp-fields span")].map((x) => x.firstChild.textContent.trim());
    let v = "photo", eng = null, touched = false, timer = 0;

    // معرض الصور: سحب أفقي مع نقاط
    const track = sec.querySelector(".px-pp-track"), dots = sec.querySelectorAll(".px-pp-dots i");
    if (track && dots.length) track.addEventListener("scroll", () => { const k = Math.round(Math.abs(track.scrollLeft) / track.clientWidth); dots.forEach((d, j) => d.classList.toggle("on", j === k)); }, { passive: true });

    const names = () => [f.n1 && f.n1.value.trim(), f.n2 && f.n2.value.trim()].filter(Boolean);
    // المعاينة: إذا ما كتب شي منورجيه مثال، وإذا كتب منورجيه كلامه بس
    const prev = () => { const typed = names().length || (f.line && f.line.value.trim()); return Object.assign({}, st, typed ? { n1: f.n1.value, n2: f.n2.value, line: f.line.value } : { n1: f.n1.placeholder, n2: f.n2.placeholder, line: f.line.placeholder }); };
    const has3d = !!K && SM.pxHas3d !== undefined ? SM.pxHas3d : (SM.pxHas3d = (() => { try { return !!(window.WebGL2RenderingContext && window.THREE); } catch (e) { return false; } })());
    if (K && !has3d) { const b = sec.querySelector('.px-pp-tabs [data-v="3d"]'); if (b) b.hidden = true; sec.querySelector(".px-pp-try span").textContent = "اكتب اسمك وشوفه قبل القص"; sec.querySelector(".px-pp-try").dataset.v = "2d"; }

    const msg = () => {
      const n = names(), line = f.line ? f.line.value.trim() : "";
      let t = U.orderText(site, it, cur).replace(/\n\nالاسم والتاريخ اللي بدي ياهن: $/, "");
      if (n.length || line) t += "\n" + [[0, f.n1], [1, f.n2], [2, f.line]].filter(([, i]) => i && i.value.trim()).map(([k, i]) => `\n✍️ ${labs[k]}: ${i.value.trim()}`).join("");
      if (touched && K) t += `\n🎨 ${K.SHAPES[st.shape].inks ? "الإضاءة" : "الحروف"}: ${inkName()}${K.SHAPES[st.shape].inks ? "" : " · الخامة: " + K.MATS[st.mat][0]}${st.pearls ? " · مع لؤلؤ" : ""}${st.shape !== sec.dataset.shape ? ` · الشكل: ${K.SHAPES[st.shape].label}` : ""}${st.photo ? "\n🖼️ مع صورة (رح ابعتها هون)" : ""}`;
      if (!n.length && !line) t += "\n\nالاسم والتاريخ اللي بدي ياهن: ";
      return t;
    };
    const refresh = () => {
      wa.href = U.waLink(site, msg());
      if (!K) return;
      if (v === "3d" && eng) eng.build(prev());
      if (v === "2d") flat.innerHTML = K.svg2d(prev(), colors);
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(refresh, 140); };
    const setView = (nv) => {
      if (nv === "3d" && !has3d) nv = "2d";
      v = nv; view.dataset.v = v;
      sec.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== v));
      sec.querySelectorAll(".px-pp-tabs [data-v]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
      const pip = sec.querySelector(".px-pp-pip"); if (pip) pip.hidden = v === "photo";
      const tryB = sec.querySelector(".px-pp-try"); if (tryB) tryB.hidden = v !== "photo";
      const hint = sec.querySelector(".px-pp-hint"); if (hint) hint.hidden = v !== "3d";
      if (v === "3d" && !eng) eng = K.engine(host, colors);
      refresh();
    };
    view.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) { setView(b.dataset.v); if (b.classList.contains("px-pp-try") && f.n1 && matchMedia("(hover: hover)").matches) f.n1.focus(); } });

    if (K) {
      const press = (sel, key) => sec.querySelectorAll(sel).forEach((b) => b.addEventListener("click", () => {
        sec.querySelectorAll(sel).forEach((x) => x.setAttribute("aria-pressed", x === b)); st[key] = b.dataset[key]; touched = true;
        if (v === "photo") setView("3d"); else refresh();
      }));
      press(".px-pp-shape", "shape"); press("[data-ink]", "ink"); press("[data-mat]", "mat");
      f.pearls.addEventListener("change", () => { st.pearls = f.pearls.checked; touched = true; if (v === "photo") setView("3d"); else refresh(); });
      const ins = [f.n1, f.n2, f.line];
      ins.forEach((inp, k) => {
        inp.addEventListener("input", () => { if (v === "photo") setView("3d"); later(); });
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (ins[k + 1]) ins[k + 1].focus(); else inp.blur(); } });
      });
      // وضع الكتابة: الكيبورد طالع، منخبّي الزوائد ومنخلّي العارض والحقول بشاشة وحدة
      const vv = window.visualViewport;
      const fit = () => { if (!html.classList.contains("px-typing") || !vv) return; sec.style.setProperty("--pp-h", Math.round(vv.height) + "px"); };
      f.addEventListener("focusin", (e) => {
        if (!e.target.matches("input[name=n1], input[name=n2], input[name=line]")) return;
        html.classList.add("px-typing"); if (v === "photo") setView("3d");
        if (matchMedia("(max-width: 899px)").matches) setTimeout(() => { fit(); scrollTo({ top: sec.getBoundingClientRect().top + scrollY, behavior: "instant" }); }, 260);
      });
      f.addEventListener("focusout", () => setTimeout(() => { if (!f.contains(document.activeElement) || !document.activeElement.matches("input[name=n1], input[name=n2], input[name=line]")) { html.classList.remove("px-typing"); sec.style.removeProperty("--pp-h"); } }, 120));
      if (vv) vv.addEventListener("resize", fit);
      // صورة الزبون (طباعة UV)
      const lab = sec.querySelector("[data-file-label]");
      f.photo.addEventListener("change", () => {
        const file = f.photo.files[0]; if (!file) return;
        const rd = new FileReader();
        rd.onload = () => { const im = new Image(); im.onload = () => {
          const c = document.createElement("canvas"), s = Math.min(1, 1024 / Math.max(im.width, im.height)); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          st.photo = c; st.photoUrl = c.toDataURL("image/jpeg", 0.85); touched = true; lab.textContent = "صورتك ✓"; if (v === "photo") setView("3d"); else refresh(); };
          im.src = rd.result; };
        rd.readAsDataURL(file);
      });
    }

    sec.querySelector("[data-pp-add]").addEventListener("click", () => {
      if (!SM.pxCart) return;
      const n = names(), line = f.line ? f.line.value.trim() : "";
      SM.pxCart.add(it, { names: n.join(" و ") + (line ? " · " + line : ""), color: touched && K ? inkName() : "", design: touched && K ? `${K.MATS[st.mat][0]}${st.pearls ? " · لؤلؤ" : ""}${st.photo ? " · مع صورة" : ""}` : "" });
    });
    sec.querySelector("[data-pp-cart]").addEventListener("click", () => SM.pxCart && SM.pxCart.open());
    sec.querySelector("[data-pp-share]").addEventListener("click", () => {
      const url = location.href, item = Object.assign({}, it, { url });
      if (SM.pxShare) SM.pxShare(item); else if (navigator.share) navigator.share({ title: it.name, url }).catch(() => {});
    });
    // الشريط السفلي بيرجع بس لما ينزل لتحت صفحة المنتج
    new IntersectionObserver(([e]) => html.classList.toggle("px-pp-past", !e.isIntersecting), { threshold: 0.15 }).observe(sec.querySelector(".px-pp-screen"));
    refresh();
    // المحرك تقيل شوي: منسخّنه بهدوء بعد ما الصفحة تهدا حتى يكون جاهز أول ما يكبس 3D
    if (has3d) (window.requestIdleCallback || setTimeout)(() => { if (!eng) eng = K.engine(host, colors); }, { timeout: 4000 });
  }

  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg = {}, mount) {
    if (cfg.productUrl) PURL = cfg.productUrl;
    if (cfg.homeUrl) HOME = cfg.homeUrl;
    const all = window.SAMMEM_TEMPLATES || {}, tpl = all[cfg.t];
    const pid = cfg.product != null && cfg.product !== "" ? String(cfg.product) : new URLSearchParams(location.search).get("p");
    if (tpl && pid && tpl.sections.some((s) => s.type === "catalog")) {
      // وضع صفحة المنتج: القائمة، المنتج، «قطع تانية»، والذيل
      const key = cfg.t + "~product", keep = ["nav", "catalog", "footer", "whatsapp"];
      all[key] = Object.assign({}, tpl, { sections: tpl.sections.filter((s) => keep.includes(s.type)).flatMap((s) => (s.type === "nav" ? [s, { type: "product", data: { pid } }] : [s])) });
      const content = Object.assign({}, cfg.content);
      content.catalog = Object.assign({}, content.catalog, { eyebrow: "تصفّح أكتر", title: "قطع تانية ممكن تعجبك", lead: "" });
      cfg = Object.assign({}, cfg, { t: key, content });
      document.documentElement.classList.add("px-pmode");
    }
    const site = baseRender.call(this, cfg, mount);
    init(mount || document.getElementById("site"), site);
    return site;
  };
})();
