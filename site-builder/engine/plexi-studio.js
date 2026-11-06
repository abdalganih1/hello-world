/* صمّم · «جرّب قطعتك»: استوديو تصميم بلكسي مباشر
   الزبون بيختار شكل القطعة (قوس، قلب، فراشة، دائرة، درع، لوحة، علبة ضيافة)، بيكتب الأسماء والتاريخ،
   بيختار الخامة ولون الحروف، بيضيف لؤلؤ أو صورته (طباعة UV)، وبيشوفها 3D (بتلف بالسحب) أو 2D قبل القص بالليزر.
   الطلب بيروح على واتساب مع ملخص التصميم، وفي زر بيحمّل صورة التصميم ليبعتها. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const S = SM.sections, esc = SM.esc, icon = SM.icon, T = window.THREE;
  if (!S) return;

  const K = SM.pxKit; if (!K) return;
  const { SHAPES, MATS, INKS, icons, engine, svg2d, guess, STUDIO } = K;

  S.studio = (d, site) => `
  <section class="sec px-studio" id="${esc(d.id || "studio")}" data-px-studio>
    <div class="wrap">
      <div class="sec-head" data-reveal>
        ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
        <h2 class="h-lg" data-split>${esc(d.title || "جرّب قطعتك قبل ما تنقص")}</h2>
        ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ""}
      </div>
      <div class="px-st">
        <div class="px-st-view" data-reveal="scale">
          <div class="px-st-canvas" aria-label="معاينة ثلاثية الأبعاد للقطعة" role="img"></div>
          <div class="px-st-2d" hidden></div>
          <div class="px-st-tabs" role="group" aria-label="طريقة العرض">
            <button type="button" data-view="3d" aria-pressed="true">3D</button>
            <button type="button" data-view="2d" aria-pressed="false">قبل القص</button>
          </div>
          <span class="px-st-hint">اسحب لتلفّ القطعة</span>
          <span class="px-st-size"></span>
        </div>
        <form class="px-st-panel" data-reveal onsubmit="return false">
          <fieldset><legend>الشكل</legend><div class="px-st-shapes">${STUDIO.map((k) => [k, SHAPES[k]]).map(([k, v], i) => `<button type="button" data-shape="${k}" aria-pressed="${i === 0}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[k]}"/></svg><span>${v.label}</span></button>`).join("")}</div></fieldset>
          <div class="px-st-two">
            <label class="field"><span>الاسم الأول</span><input name="n1" enterkeyhint="done" maxlength="18" value="${esc(d.n1 || "محمد")}" autocomplete="off"></label>
            <label class="field"><span>الاسم التاني <small>(اختياري)</small></span><input name="n2" enterkeyhint="done" maxlength="18" value="${esc(d.n2 || "سارة")}" autocomplete="off"></label>
          </div>
          <label class="field"><span>التاريخ أو عبارة قصيرة</span><input name="line" enterkeyhint="done" maxlength="28" value="${esc(d.line || "14 · 2 · 2027")}" autocomplete="off"></label>
          <fieldset><legend>الخامة</legend><div class="px-st-sw">${Object.entries(MATS).map(([k, v], i) => `<button type="button" data-mat="${k}" aria-pressed="${i === 0}" title="${v[0]}"><i style="background:${v[1]}"></i><span>${v[0]}</span></button>`).join("")}</div></fieldset>
          <fieldset><legend>لون الحروف</legend><div class="px-st-sw">${Object.entries(INKS).map(([k, v], i) => `<button type="button" data-ink="${k}" aria-pressed="${i === 0}" title="${v[0]}"><i style="background:${v[1]}"></i><span>${v[0]}</span></button>`).join("")}</div></fieldset>
          <div class="px-st-extras">
            <label class="px-st-toggle"><input type="checkbox" name="pearls" checked><span>لؤلؤ عالحواف</span></label>
            <label class="px-st-file">${icon("spark")}<span data-file-label>ضيف صورتك عالقطعة (طباعة UV)</span><input type="file" name="photo" accept="image/*"></label>
            <button type="button" class="px-st-clear" data-clear-photo hidden>شيل الصورة</button>
          </div>
          <div class="px-st-actions">
            <a class="btn" data-st-order href="#" target="_blank" rel="noopener">${icon("wa")} اطلب هالتصميم</a>
            <button type="button" class="btn ghost" data-st-cart>أضف تصميمي للسلة</button>
            <button type="button" class="btn ghost" data-st-save>حمّل صورة التصميم</button>
          </div>
          <p class="px-st-note">بعد ما تبعت الطلب، ابعتلنا صورة التصميم${""} بنفس المحادثة لنطلعلك ياها متل ما شفتها.</p>
        </form>
      </div>
    </div>
  </section>`;

  function init(root, site) {
    const sec = root.querySelector("[data-px-studio]"); if (!sec) return;
    const f = sec.querySelector(".px-st-panel"), host = sec.querySelector(".px-st-canvas"), flat = sec.querySelector(".px-st-2d"), size = sec.querySelector(".px-st-size");
    const st = { shape: "arch", mat: "clear", ink: "gold", pearls: true, photo: null, photoUrl: "", n1: f.n1.value, n2: f.n2.value, line: f.line.value };
    const colors = site.theme.colors;
    let eng = null, view = "3d", timer = 0;
    const has3d = SM.pxHas3d !== undefined ? SM.pxHas3d : (SM.pxHas3d = (() => { try { return !!(window.WebGL2RenderingContext && window.THREE); } catch (e) { return false; } })());
    if (!has3d) { view = "2d"; sec.querySelector(".px-st-tabs").hidden = true; sec.querySelector(".px-st-hint").hidden = true; }
    const order = sec.querySelector("[data-st-order]");
    const refresh = () => {
      size.textContent = SHAPES[st.shape].cm;
      if (view === "3d" && eng) eng.build(st);
      if (view === "2d") flat.innerHTML = svg2d(st, colors);
      host.hidden = view !== "3d"; flat.hidden = view !== "2d";
      const txt = `مرحبا ${site.brand.name}، صممت قطعة بالموقع وبدي اطلبها:\n• الشكل: ${SHAPES[st.shape].label} (${SHAPES[st.shape].cm})\n• الخامة: ${MATS[st.mat][0]}\n• الحروف: ${INKS[st.ink][0]}\n• الأسماء: ${[st.n1, st.n2].filter((x) => x.trim()).join(" و ") || "-"}\n• التاريخ/العبارة: ${st.line || "-"}\n• لؤلؤ: ${st.pearls ? "إي" : "لا"}${st.photo ? "\n• مع صورة (رح ابعتها هون)" : ""}\n\nرح ابعتلكم صورة التصميم هون.`;
      const n = String(site.brand.whatsapp || "").replace(/\D/g, "").replace(/^00/, "").replace(/^0/, "963");
      order.href = n ? `https://wa.me/${n}?text=${encodeURIComponent(txt)}` : "#contact";
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(refresh, 160); };
    const press = (sel, key) => sec.querySelectorAll(sel).forEach((b) => b.addEventListener("click", () => { sec.querySelectorAll(sel).forEach((x) => x.setAttribute("aria-pressed", x === b)); st[key] = b.dataset[key]; refresh(); }));
    press("[data-shape]", "shape"); press("[data-mat]", "mat"); press("[data-ink]", "ink");
    ["n1", "n2", "line"].forEach((k) => f[k].addEventListener("input", () => { st[k] = f[k].value; later(); }));
    f.pearls.addEventListener("change", () => { st.pearls = f.pearls.checked; refresh(); });
    const lab = sec.querySelector("[data-file-label]"), clr = sec.querySelector("[data-clear-photo]");
    f.photo.addEventListener("change", () => {
      const file = f.photo.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => { const im = new Image(); im.onload = () => {
        // منصغّر الصورة لـ 1024 حتى تضل خفيفة
        const c = document.createElement("canvas"), s = Math.min(1, 1024 / Math.max(im.width, im.height)); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        st.photo = c; st.photoUrl = c.toDataURL("image/jpeg", 0.85); lab.textContent = "تمت إضافة الصورة ✓"; clr.hidden = false; refresh(); };
        im.src = rd.result; };
      rd.readAsDataURL(file);
    });
    clr.addEventListener("click", () => { st.photo = null; st.photoUrl = ""; f.photo.value = ""; lab.textContent = "ضيف صورتك عالقطعة (طباعة UV)"; clr.hidden = true; refresh(); });
    sec.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { sec.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b)); view = b.dataset.view; refresh(); }));
    sec.querySelector("[data-st-cart]").addEventListener("click", () => {
      if (!SM.pxCart) return;
      SM.pxCart.add({ name: "تصميم خاص: " + SHAPES[st.shape].label, price: 0 }, { names: [st.n1, st.n2].filter((x) => x.trim()).join(" و ") + (st.line ? " · " + st.line : ""), color: INKS[st.ink][0], design: `${MATS[st.mat][0]} · ${SHAPES[st.shape].cm.replace(/[\u2066\u2069]/g, "")}${st.pearls ? " · لؤلؤ" : ""}${st.photo ? " · مع صورة" : ""}` });
    });
    f.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } }));
    sec.querySelector("[data-st-save]").addEventListener("click", () => {
      const a = document.createElement("a"); a.download = `${site.brand.name}-تصميمي.png`;
      if (eng && view === "3d") { a.href = eng.png(); a.click(); return; }
      const svg = flat.querySelector("svg"); if (!svg) return;
      const im = new Image(), c = document.createElement("canvas"); c.width = 1200; c.height = 1200 * svg.viewBox.baseVal.height / svg.viewBox.baseVal.width;
      im.onload = () => { const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); a.href = c.toDataURL("image/png"); a.click(); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    });
    // المحرك بيشتغل لما يقرب القسم من الشاشة
    // المحرك بيتجهّز بس لما القسم يكون قدامه والسحب واقف، حتى السحب السريع يضل ناعم
    if (has3d) { let seen = false, tm = 0; const kick = () => { clearTimeout(tm); if (seen && !eng) tm = setTimeout(() => { if (seen && !eng) { eng = engine(host, colors); refresh(); removeEventListener("scroll", kick); } }, 450); };
      new IntersectionObserver(([e]) => { seen = e.isIntersecting; kick(); }, { threshold: 0.25 }).observe(host); addEventListener("scroll", kick, { passive: true });
      sec.addEventListener("pointerdown", () => { if (!eng) { eng = engine(host, colors); refresh(); } }, { once: true }); }
    refresh();
    // من نافذة منتج: «جرّب اسمك على هالقطعة»
    SM.pxStudio = { open(name) { const k = guess(name), b = sec.querySelector(`[data-shape="${k}"]`); if (b) b.click(); sec.scrollIntoView({ behavior: "smooth", block: "start" }); } };
  }

  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg, mount) { const site = baseRender.call(this, cfg, mount); init(mount || document.getElementById("site"), site); return site; };
})();
