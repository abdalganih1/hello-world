/* صمّم · مكتبة الأقسام
   كل قسم = دالة بتاخد data وبترجع HTML. الذكاء الاصطناعي بيختار type و variant وبيعبّي data فقط. */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // سياسة المتجر: الشراء = رسالة واتساب جاهزة فيها اسم المنتج وسعره (بلا سلة ولا دفع)
  const waNum = (n) => { let d = String(n || "").replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); if (d.startsWith("0")) d = "963" + d.slice(1); return d; };
  const waLink = (site, text) => { const n = waNum(site && site.brand && site.brand.whatsapp); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "#contact"; };
  const waAttrs = (href) => href.startsWith("https:") ? `href="${esc(href)}" target="_blank" rel="noopener"` : `href="${esc(href)}"`;
  const orderMsg = (site, it, verb = "اطلب") => `مرحبا ${site.brand.name}، بدي ${verb}:\n• ${it.name}${it.price ? " = " + it.price : ""}\n\nالكمية: `;

  const I = {
    arrow: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.6 1.4 2.7 2.5 2.7z"/>',
    truck: '<path d="M10 17h4V5H2v12h3M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    party: '<path d="M5.8 11.3 2 22l10.7-3.8M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.2.8a3 3 0 0 0-1.8 3.6c.2.8-.4 1.6-1.2 1.6H16M11 2l.3 1.3a3 3 0 0 1-1.5 3.3L9 7"/><path d="M11 13c1.9 1.9 2.8 4.1 2 4.9-.8.8-3-.1-4.9-2-1.9-1.9-2.8-4.1-2-4.9.8-.8 3 .1 4.9 2z"/>',
    tooth: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.5 3 1 6 2.5 6s1.8-3 2.5-5c.4-1 .8-1.5 2-1.5s1.6.5 2 1.5c.7 2 1 5 2.5 5s2-3 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
    spark: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    child: '<circle cx="12" cy="5" r="3"/><path d="M12 8v7M8 22l4-7 4 7M7 11h10"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    megaphone: '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    wa: '<path d="M20.5 3.5A11.8 11.8 0 0 0 1.8 17.7L.2 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5zM12 21.5a9.6 9.6 0 0 1-4.9-1.3l-.4-.2-3.6.9 1-3.5-.2-.4A9.6 9.6 0 1 1 12 21.5zm5.3-7.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1a7.9 7.9 0 0 1-3.9-3.4c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5c0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="currentColor" stroke="none"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.spark}</svg>`;
  // صورة حقيقية سريعة: لمحة ضبابية فورية (24px)، بعدها 480/960/1600 حسب الشاشة، والدقة الكاملة لما يكبّرها الزائر
  const pic = (key, o = {}) => {
    const M = window.SAMMEM_MEDIA || {}, m = M[key]; if (!m) return "";
    const b = "media/" + key, ws = [480, 960, 1600].filter((w) => w <= Math.max(480, m.max || 1600));
    const src = o.sq ? `${b}-sq.webp` : `${b}-480.webp`;
    const set = o.sq ? `${b}-sq.webp 240w, ${b}-480.webp 480w` : ws.map((w) => `${b}-${w}.webp ${w}w`).join(", ");
    return `<span class="ph pic-w" style="--lq:url(${m.lqip})"${o.parallax === false ? "" : ' data-parallax="-0.08"'}><img class="pic" src="${src}" srcset="${set}" sizes="${o.sizes || "(max-width: 760px) 100vw, 50vw"}" width="${o.sq ? 240 : m.w}" height="${o.sq ? 240 : m.h}" loading="lazy" decoding="async" alt="${esc(o.alt || "")}" data-zoom="${b}-${ws[ws.length - 1]}.webp" onload="this.classList.add('in')"></span>`;
  };
  const ph = (label, x = 30, y = 30) => `<div class="ph" style="--px:${x}%;--py:${y}%" data-parallax="-0.12"></div>${label ? `<span class="ph-label">${esc(label)}</span>` : ""}`;
  const head = (d, center) => `
    <div class="sec-head${center ? " center" : ""}" data-reveal>
      ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
      <h2 class="h-lg" data-split>${esc(d.title)}</h2>
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ""}
    </div>`;

  const S = {};

  S.nav = (d, site) => `
  <header class="s-nav" id="top">
    <div class="wrap"><div class="bar">
      <a class="logo" href="#top"><span class="mark">${esc(site.brand.mark)}</span><span>${esc(site.brand.name)}</span></a>
      <nav aria-label="روابط الموقع">${(d.links || []).map((l) => `<a href="#${esc(l.id)}">${esc(l.label)}</a>`).join("")}</nav>
      <span style="display:flex;gap:8px;align-items:center"><a class="btn" href="#${esc(d.ctaTarget || "contact")}" data-magnetic>${esc(d.cta || "تواصل معنا")}</a></span>
    </div></div>
  </header>`;

  S.hero = (d, site) => `
  <section class="s-hero${d.variant === "center" ? " center" : ""}" id="hero"${d.pin ? " data-pin" : ""}${d.pinLen ? ` data-pin-len="${+d.pinLen}"` : ""}>
    <div class="stage" data-scene="${esc(site.theme.scene)}"></div>
    ${d.steps ? `<ol class="hero-steps" aria-hidden="true">${d.steps.map((t, i) => `<li data-at="${esc(t.at)}"><i>${i + 1}</i>${esc(t.label)}</li>`).join("")}</ol>` : ""}
    <div class="veil"></div>
    <div class="wrap">
      <div class="copy">
        ${d.eyebrow ? `<span class="eyebrow" data-hero-in>${esc(d.eyebrow)}</span>` : ""}
        <h1 class="h-xl" data-split="hero">${esc(d.title)}</h1>
        <p class="lead" data-hero-in>${esc(d.lead)}</p>
        <div class="actions" data-hero-in>
          <a class="btn" href="#${esc(d.primaryTarget || "contact")}" data-magnetic>${esc(d.primary)} ${icon("arrow")}</a>
          ${d.secondary ? `<a class="btn ghost" href="#${esc(d.secondaryTarget || "about")}">${esc(d.secondary)}</a>` : ""}
        </div>
        ${d.badges ? `<div class="badges" data-hero-in>${d.badges.map((b) => `<span class="chip"><b>${esc(b.k)}</b> ${esc(b.v)}</span>`).join("")}</div>` : ""}
      </div>
    </div>
    <div class="scroll-hint" aria-hidden="true">انزل<i></i></div>
  </section>`;

  S.marquee = (d) => {
    const items = (d.items || []).map((t) => `<span>${esc(t)}</span>`).join("");
    return `<div class="s-marquee" aria-hidden="true"><div class="track" data-marquee>${items}${items}${items}</div></div>`;
  };

  S.about = (d) => `
  <section class="sec s-about" id="${esc(d.id || "about")}">
    <div class="wrap grid">
      <div class="body" data-reveal>
        ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}
        <h2 class="h-lg" data-split>${esc(d.title)}</h2>
        ${(d.paragraphs || []).map((p) => `<p class="lead">${esc(p)}</p>`).join("")}
        ${d.stats ? `<div class="stats" data-stagger>${d.stats.map((s) => `<div class="stat"><b data-count="${esc(s.n)}">${esc(s.n)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
      </div>
      <div class="art" data-reveal="scale">${d.img ? pic(d.img, { alt: d.image || d.title }) : ph(d.image, 35, 25)}</div>
    </div>
  </section>`;

  S.services = (d) => `
  <section class="sec s-services" id="${esc(d.id || "services")}">
    <div class="wrap">
      ${head(d)}
      <div class="cards" data-stagger>
        ${(d.items || []).map((it, i) => `
          <article class="card" data-tilt>
            <span class="num">${String(i + 1).padStart(2, "0")}</span>
            <span class="ico">${icon(it.icon)}</span>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.text)}</p>
          </article>`).join("")}
      </div>
    </div>
  </section>`;

  S.menu = (d, site) => {
    const cats = d.categories || [];
    return `
  <section class="sec s-menu" id="${esc(d.id || "menu")}">
    <div class="wrap">
      ${head(d)}
      <div class="tabs" role="tablist" data-reveal>
        ${cats.map((c, i) => `<button class="tab" role="tab" id="tab-${i}" aria-selected="${i === 0}" data-tab="${i}">${esc(c.name)}</button>`).join("")}
      </div>
      ${cats.map((c, i) => `
        <div class="menu-list" role="tabpanel" aria-labelledby="tab-${i}" data-panel="${i}" ${i ? "hidden" : ""}>
          ${c.items.map((it, j) => `
            <div class="dish" data-reveal>
              <div class="thumb">${it.img ? pic(it.img, { sq: true, alt: it.name, sizes: "120px", parallax: false }) : `<div class="ph" style="--px:${30 + j * 9}%;--py:${60 - j * 7}%"></div>`}</div>
              <div><h4>${esc(it.name)}${it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ""}</h4><p>${esc(it.desc)}</p></div>
              <span class="price">${esc(it.price)}${site.brand.whatsapp ? `<a class="dish-order" ${waAttrs(waLink(site, orderMsg(site, it, d.orderLabel || "اطلب")))} aria-label="${esc(d.orderLabel || "اطلب")} ${esc(it.name)} ع واتساب">${icon("wa")}${esc(d.orderLabel || "اطلب")}</a>` : ""}</span>
            </div>`).join("")}
        </div>`).join("")}
      ${d.note ? `<p class="lead" style="margin-top:28px;font-size:15px">${esc(d.note)}</p>` : ""}
    </div>
  </section>`;
  };

  S.products = (d, site) => {
    const cats = [...new Set((d.items || []).map((it) => it.cat).filter(Boolean))];
    return `
  <section class="sec s-products" id="${esc(d.id || "products")}">
    <div class="wrap">
      ${head(d)}
      ${cats.length > 1 ? `<div class="tabs" role="tablist" data-reveal><button class="tab" data-cat="*" aria-selected="true">الكل</button>${cats.map((c) => `<button class="tab" data-cat="${esc(c)}" aria-selected="false">${esc(c)}</button>`).join("")}</div>` : ""}
      <div class="prods" data-stagger>
        ${(d.items || []).map((it, i) => `
          <article class="prod" data-c="${esc(it.cat || "")}" data-tilt>
            <div class="pimg">${ph("", 25 + (i * 23) % 60, 30 + (i * 17) % 40)}${it.tag ? `<span class="ptag">${esc(it.tag)}</span>` : ""}</div>
            <div class="pbody">
              <h3>${esc(it.name)}</h3>
              ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
              <div class="prow"><span class="pprice">${esc(it.price)}${it.old ? ` <s>${esc(it.old)}</s>` : ""}</span><a class="padd" ${waAttrs(waLink(site, orderMsg(site, it)))} data-order>${icon("wa")}${esc(d.addLabel || "اطلب ع واتساب")}</a></div>
            </div>
          </article>`).join("")}
      </div>
      ${d.note ? `<p class="lead" style="margin-top:28px;font-size:15px">${esc(d.note)}</p>` : ""}
    </div>
  </section>`;
  };

  S.process = (d) => `
  <section class="sec s-process" id="${esc(d.id || "process")}" data-hscroll>
    <div class="wrap">${head(d)}</div>
    <div class="rail" data-rail>
      ${(d.steps || []).map((s, i) => `
        <article class="step"><span class="glow"></span>
          <span class="n">${i + 1}</span>
          <div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>
        </article>`).join("")}
    </div>
  </section>`;

  S.gallery = (d) => `
  <section class="sec s-gallery" id="${esc(d.id || "gallery")}">
    <div class="wrap">
      ${head(d)}
      <div class="gallery" data-stagger>
        ${(d.items || []).slice(0, 5).map((t, i) => typeof t === "object" && t.img ? `<figure>${pic(t.img, { alt: t.label, sizes: "(max-width: 760px) 100vw, 40vw" })}<figcaption class="ph-label">${esc(t.label || "")}</figcaption></figure>` : `<figure>${ph(typeof t === "object" ? t.label : t, 20 + i * 15, 70 - i * 12)}</figure>`).join("")}
      </div>
    </div>
  </section>`;

  S.team = (d) => `
  <section class="sec s-team" id="${esc(d.id || "team")}">
    <div class="wrap">
      ${head(d)}
      <div class="team" data-stagger>
        ${(d.people || []).map((p, i) => `<div class="person"><div class="ph" style="--px:${40 + i * 10}%;--py:35%"></div><div><h3>${esc(p.name)}</h3><p>${esc(p.role)}</p></div></div>`).join("")}
      </div>
    </div>
  </section>`;

  S.testimonials = (d) => `
  <section class="sec s-testimonials" id="${esc(d.id || "reviews")}">
    <div class="wrap">
      ${head(d, true)}
      <div class="quotes" data-stagger>
        ${(d.items || []).map((q) => `
          <figure class="quote" data-tilt>
            <blockquote>${esc(q.text)}</blockquote>
            <figcaption class="who"><span class="av">${esc(q.name.trim()[0])}</span><span><b>${esc(q.name)}</b><small>${esc(q.meta || "")}</small></span><span class="stars" style="margin-inline-start:auto" aria-label="5 نجوم">★★★★★</span></figcaption>
          </figure>`).join("")}
      </div>
    </div>
  </section>`;

  S.pricing = (d) => `
  <section class="sec s-pricing" id="${esc(d.id || "pricing")}">
    <div class="wrap">
      ${head(d, true)}
      <div class="plans" data-stagger>
        ${(d.plans || []).map((p) => `
          <article class="plan${p.hot ? " hot" : ""}" data-tilt>
            ${p.hot ? `<span class="flag">${esc(p.hot)}</span>` : ""}
            <h3 class="h-md">${esc(p.name)}</h3>
            <div class="amt">${esc(p.price)} <small>${esc(p.per || "")}</small></div>
            <ul>${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            <a class="btn${p.hot ? "" : " ghost"}" href="#contact">${esc(p.cta || "اطلب الآن")}</a>
          </article>`).join("")}
      </div>
    </div>
  </section>`;

  S.faq = (d) => `
  <section class="sec s-faq" id="${esc(d.id || "faq")}">
    <div class="wrap">
      ${head(d, true)}
      <div class="faq" data-stagger>
        ${(d.items || []).map((q, i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(q.q)}<i aria-hidden="true">+</i></summary><div class="ans">${esc(q.a)}</div></details>`).join("")}
      </div>
    </div>
  </section>`;

  S.cta = (d) => `
  <section class="sec s-cta" id="${esc(d.id || "cta")}">
    <div class="wrap">
      <div class="box" data-reveal="scale">
        <span class="orb" data-parallax="0.25"></span>
        <h2 class="h-lg" data-split>${esc(d.title)}</h2>
        <p class="lead">${esc(d.lead)}</p>
        <a class="btn" href="#${esc(d.target || "contact")}" data-magnetic>${esc(d.button)} ${icon("arrow")}</a>
      </div>
    </div>
  </section>`;

  S.contact = (d, site) => {
    const b = site.brand;
    const rows = [
      b.phone && ["phone", "الهاتف", b.phone],
      b.whatsapp && ["wa", "واتساب", b.whatsapp],
      b.email && ["mail", "البريد", b.email],
      b.address && ["pin", "العنوان", b.address],
      b.hours && ["clock", "ساعات العمل", b.hours],
    ].filter(Boolean);
    return `
  <section class="sec s-contact" id="contact">
    <div class="wrap">
      ${head(d)}
      <div class="grid">
        <div class="info" data-stagger>
          ${rows.map((r) => `<div class="row">${icon(r[0])}<div><small>${r[1]}</small><b dir="auto">${esc(r[2])}</b></div></div>`).join("")}
        </div>
        <form class="form" data-form data-reveal novalidate data-wa="${esc(waNum(site.brand.whatsapp))}" data-brand="${esc(site.brand.name)}">
          <div class="two">
            <div class="field"><label for="f-name">الاسم</label><input id="f-name" name="name" required autocomplete="name" placeholder="اسمك الكريم"></div>
            <div class="field"><label for="f-phone">رقم الهاتف</label><input id="f-phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="09xx xxx xxx" dir="ltr" style="text-align:right"></div>
          </div>
          ${d.subjects ? `<div class="field"><label for="f-subj">${esc(d.subjectLabel || "الموضوع")}</label><select id="f-subj" name="subject">${d.subjects.map((s) => `<option>${esc(s)}</option>`).join("")}</select></div>` : ""}
          <div class="field"><label for="f-msg">رسالتك</label><textarea id="f-msg" name="message" placeholder="${esc(d.placeholder || "اكتب رسالتك هون")}"></textarea></div>
          <button class="btn" type="submit" data-magnetic>${esc(d.button || "أرسل الرسالة")}</button>
          <p class="ok" role="status">وصلت رسالتك، منرد عليك بأقرب وقت. </p>
        </form>
      </div>
    </div>
  </section>`;
  };

  S.footer = (d, site) => `
  <footer class="s-footer">
    <div class="wrap">
      <div class="top">
        <div style="display:grid;gap:12px;max-width:420px">
          <a class="logo" href="#top"><span class="mark">${esc(site.brand.mark)}</span><span>${esc(site.brand.name)}</span></a>
          <p style="color:var(--muted)">${esc(d.about || site.brand.tagline || "")}</p>
        </div>
        <div class="socials">
          <a href="#" aria-label="إنستغرام">${icon("insta")}</a>
          <a href="#" aria-label="فيسبوك">${icon("fb")}</a>
          <a href="#contact" aria-label="واتساب">${icon("wa")}</a>
        </div>
      </div>
      <div class="big" aria-hidden="true" data-parallax="0.08">${esc(site.brand.name)}</div>
      <div class="bottom">
        <span>© ${new Date().getFullYear()} ${esc(site.brand.name)}. جميع الحقوق محفوظة.</span>
        <span>صُمّم بمنصة <a href="#top">صمّم</a></span>
      </div>
    </div>
  </footer>`;

  S.whatsapp = (d, site) => site.brand.whatsapp ? `<a class="wa" ${waAttrs(waLink(site, `مرحبا ${site.brand.name}، `))} aria-label="راسلنا على واتساب">${icon("wa")}</a>` : "";

  window.SAMMEM = window.SAMMEM || {};
  window.SAMMEM.sections = S;
  window.SAMMEM.icon = icon;
  window.SAMMEM.esc = esc;
  window.SAMMEM.waNum = waNum;
  window.SAMMEM.pic = pic;
  window.SAMMEM.waLink = waLink;
})();
