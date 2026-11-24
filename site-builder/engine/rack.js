/* صمّم · قسم «الرف» (قالب rack)
   رف حديد معلّق عليه منتجات قسم products: كل قطعة على علّاقة، بتنزلق عالرف لمكانها بالدخول،
   وبتتمرجح (فيزياء نواس) لما يمرّ عليها الماوس أو لما ينسحب الرف بالإصبع.
   القطعة بتنرسم SVG حسب نوعها (تيشرت، هودي، جاكيت، قميص، فانيلة، فستان، بنطلون، تنورة، معطف) ولونها،
   وإذا صاحب المحل رفع صورة بتطلع الصورة معلّقة مكان الرسمة. الضغط = نافذة الخيارات أو رسالة واتساب.
   كل حركة بتنتهي بموضع ثابت: القطع بترجع لزاوية صفر ومكانها ما بيتغير. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const S = SM.sections, esc = SM.esc;
  if (!S) return;

  /* ---------- نوع القطعة ولونها ---------- */
  const KINDS = [
    ["hoodie", /هودي|هوديز|كنزة بقبعة|سويت ?شيرت|سويتر/],
    ["jacket", /جاكيت|جاكيتات|جاكت|فارسيتي|بومبر|جلد|بليزر|سترة/],
    ["coat", /معطف|كبوت|عباية|عباءة|ترانش|بالطو|مانطو/],
    ["dress", /فستان|فساتين|جلابية|جلابيه/],
    ["skirt", /تنورة|تنورات|جيبة/],
    ["pants", /بنطلون|بنطال|بناطيل|جينز|كارغو|شورت|ترينينغ|جوغر|سروال/],
    ["jersey", /فانيلة|فانيلا|رياضي|رياضية|جيرسي|قميص نادي/],
    ["shirt", /قميص|قمصان|شيميز|بلوزة|بلوز/],
    ["tee", /تيشرت|تيشيرت|تي شيرت|تيشرتات|كنزة|بودي|بلوفر|ألبسة|توب/],
  ];
  const kindOf = (it) => {
    if (it.garment && /^(tee|hoodie|jacket|coat|dress|skirt|pants|jersey|shirt)$/.test(it.garment)) return it.garment;
    const t = `${it.name || ""} ${it.cat || ""}`;
    // أول كلمة بالاسم هي اللي بتحدد النوع («قميص جينز» قميص، مو بنطلون)
    let best = "tee", at = 1e9;
    KINDS.forEach(([k, re]) => { const m = t.search(re); if (m >= 0 && m < at) { at = m; best = k; } });
    return best;
  };
  const EXTRA = { "فحمي": "#26272b", "جينز": "#4f78ad", "دنيم": "#4f78ad", "نيون": "#2fdc3f", "كاكي": "#8a8455", "زيتوني": "#6b7a3a", "خردلي": "#d4a52a", "عنابي": "#6d1f2c", "طوبي": "#b4553a", "مشمشي": "#f3a46b", "نعناعي": "#9fe0c0", "لافندر": "#b9a6e6", "صفرا": "#f4d330", "حمرا": "#c0392b", "زرقا": "#2f6fd6", "خضرا": "#2e8b57", "سودا": "#1d1e21", "بيضا": "#f6f6f4", "سكّري": "#efe6d2" };
  const toneOf = (it, i, site) => {
    if (typeof it.color === "string" && /^#[0-9a-f]{3,8}$/i.test(it.color)) return it.color;
    const words = String(it.name || "").split(/\s+/);
    for (const w of words) { if (EXTRA[w]) return EXTRA[w]; const h = SM.opts && SM.opts.hexOf(w); if (h) return h; }
    const op = SM.opts ? SM.opts.options(it).find((o) => o.kind === "color") : null;
    if (op && op.values[0] && op.values[0].hex) return op.values[0].hex;
    const c = site.theme.colors, cyc = ["#f5f5f2", "#1d1e21", c.accent, "#4f78ad", c.accent2, "#cdb48e", "#6b7a3a", "#b4553a"];
    return cyc[i % cyc.length];
  };
  const lum = (hex) => { let h = hex.replace("#", ""); if (h.length === 3) h = h.split("").map((x) => x + x).join(""); const n = parseInt(h.slice(0, 6), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const shade = (hex, k) => { let h = hex.replace("#", ""); if (h.length === 3) h = h.split("").map((x) => x + x).join(""); const n = parseInt(h.slice(0, 6), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join(""); };

  /* ---------- رسم القطعة (viewBox 200x300، العلّاقة بأعلى المنتصف) ---------- */
  let uid = 0;
  function garmentSVG(kind, tone, o = {}) {
    const id = "rk" + ++uid, dark = lum(tone) < 0.42, line = dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.13)";
    const ink = dark ? "#f4f4f1" : "#141416", acc = o.accent || "#2fdc3f", acc2 = o.accent2 || "#ff4f9a", mark = esc(o.mark || "");
    const D = shade(tone, -0.18), L = shade(tone, 0.14);
    const fill = `url(#${id}g)`;
    const defs = `<defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="${D}"/><stop offset=".35" stop-color="${tone}"/><stop offset=".62" stop-color="${L}"/><stop offset="1" stop-color="${D}"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".25" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
    const P = (d, f = fill, extra = "") => `<path d="${d}" fill="${f}" ${extra}/>`;
    const fold = (d) => `<path d="${d}" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/>`;
    let body = "";
    switch (kind) {
      case "hoodie": {
        body = P("M58 52 Q100 24 142 52 L150 78 Q100 92 50 78Z", shade(tone, -0.28)) +
          P("M66 44 Q100 60 134 44 L166 58 Q186 120 188 214 L164 218 L156 120 L154 246 L46 246 L44 120 L36 218 L12 214 Q14 120 34 58Z") +
          P("M66 44 Q100 60 134 44 L166 58 Q186 120 188 214 L164 218 L156 120 L154 246 L46 246 L44 120 L36 218 L12 214 Q14 120 34 58Z", `url(#${id}s)`) +
          P("M72 168 L128 168 L136 208 L64 208Z", shade(tone, -0.1)) + fold("M100 168 V208") +
          `<path d="M90 60 L88 104 M110 60 L112 104" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>` +
          P("M44 236 H156 V248 H44Z", shade(tone, -0.16)) + P("M12 206 L36 210 L35 222 L11 218Z", shade(tone, -0.16)) + P("M164 210 L188 206 L189 218 L165 222Z", shade(tone, -0.16)) +
          (mark ? `<text x="100" y="140" text-anchor="middle" font-family="Changa,sans-serif" font-weight="800" font-size="30" fill="${ink}" opacity=".9">${mark}</text>` : "");
        break;
      }
      case "jacket": {
        const sl = dark ? "#f2f2ee" : shade(tone, -0.5);
        body = P("M60 40 Q100 56 140 40 L148 250 L52 250Z") +
          P("M60 40 L36 52 Q16 120 12 222 L40 226 L50 112 L52 250 L60 250Z", sl) + P("M140 40 L164 52 Q184 120 188 222 L160 226 L150 112 L148 250 L140 250Z", sl) +
          P("M60 40 Q100 56 140 40 L148 250 L52 250Z", `url(#${id}s)`) +
          `<path d="M66 42 Q100 62 134 42" fill="none" stroke="${acc}" stroke-width="7"/>` +
          `<path d="M52 236 H148 M52 244 H148" stroke="${acc}" stroke-width="4"/><path d="M11 212 L41 216 M10 220 L40 224 M159 216 L189 212 M160 224 L190 220" stroke="${acc}" stroke-width="3.5"/>` +
          fold("M100 56 V250") + [80, 112, 144, 176, 208].map((y) => `<circle cx="104" cy="${y}" r="3.2" fill="${sl}"/>`).join("") +
          `<text x="78" y="120" text-anchor="middle" font-family="Changa,sans-serif" font-weight="800" font-size="34" fill="${sl}" stroke="${acc}" stroke-width="1.6" paint-order="stroke">${mark}</text>`;
        break;
      }
      case "coat": {
        body = P("M64 40 Q100 54 136 40 L166 54 Q184 130 186 236 L162 240 L154 128 L158 286 L42 286 L46 128 L38 240 L14 236 Q16 130 34 54Z") +
          P("M64 40 Q100 54 136 40 L166 54 Q184 130 186 236 L162 240 L154 128 L158 286 L42 286 L46 128 L38 240 L14 236 Q16 130 34 54Z", `url(#${id}s)`) +
          P("M64 40 L100 116 L84 120 L58 48Z", shade(tone, -0.14)) + P("M136 40 L100 116 L116 120 L142 48Z", shade(tone, -0.08)) +
          fold("M100 116 V286") + P("M48 164 H152 V176 H48Z", shade(tone, -0.12)) + fold("M70 120 Q66 200 72 280") + fold("M130 120 Q134 200 128 280");
        break;
      }
      case "dress": {
        body = P("M76 40 Q100 58 124 40 L132 44 L130 112 Q164 196 176 284 Q100 296 24 284 Q36 196 70 112 L68 44Z") +
          P("M76 40 Q100 58 124 40 L132 44 L130 112 Q164 196 176 284 Q100 296 24 284 Q36 196 70 112 L68 44Z", `url(#${id}s)`) +
          P("M68 104 H132 L131 118 H69Z", shade(tone, -0.22)) + `<circle cx="100" cy="111" r="6" fill="${shade(tone, -0.32)}"/>` +
          fold("M86 122 Q76 200 62 284") + fold("M114 122 Q124 200 138 284") + fold("M100 124 V288");
        break;
      }
      case "skirt": {
        body = `<path d="M60 34 H140" stroke="#9aa0a8" stroke-width="5" stroke-linecap="round"/><path d="M68 34 V48 M132 34 V48" stroke="#9aa0a8" stroke-width="3"/>` +
          P("M66 48 H134 L176 236 Q100 252 24 236Z") + P("M66 48 H134 L176 236 Q100 252 24 236Z", `url(#${id}s)`) + P("M66 48 H134 V62 H66Z", shade(tone, -0.2)) +
          fold("M84 64 L66 238") + fold("M100 64 V246") + fold("M116 64 L134 238");
        break;
      }
      case "pants": {
        body = `<path d="M54 34 H146" stroke="#9aa0a8" stroke-width="5" stroke-linecap="round"/><path d="M62 34 V48 M138 34 V48" stroke="#9aa0a8" stroke-width="3"/>` +
          P("M58 48 H142 L150 290 H108 L100 120 L92 290 H50Z") + P("M58 48 H142 L150 290 H108 L100 120 L92 290 H50Z", `url(#${id}s)`) + P("M58 48 H142 V64 H58Z", shade(tone, -0.18)) +
          P("M54 150 L76 146 L80 196 L56 200Z", shade(tone, -0.1)) + P("M146 150 L124 146 L120 196 L144 200Z", shade(tone, -0.1)) +
          fold("M100 64 V120") + fold("M72 76 Q80 90 92 92") + fold("M128 76 Q120 90 108 92") + fold("M72 210 L70 286") + fold("M128 210 L130 286");
        break;
      }
      case "shirt": {
        body = P("M64 40 Q100 52 136 40 L166 54 Q184 130 186 226 L162 230 L154 124 L156 252 Q100 262 44 252 L46 124 L38 230 L14 226 Q16 130 34 54Z") +
          P("M64 40 Q100 52 136 40 L166 54 Q184 130 186 226 L162 230 L154 124 L156 252 Q100 262 44 252 L46 124 L38 230 L14 226 Q16 130 34 54Z", `url(#${id}s)`) +
          P("M64 38 L100 52 L84 72Z", shade(tone, -0.2)) + P("M136 38 L100 52 L116 72Z", shade(tone, -0.12)) +
          fold("M100 54 V258") + [76, 108, 140, 172, 204, 236].map((y) => `<circle cx="104" cy="${y}" r="2.6" fill="${ink}" opacity=".55"/>`).join("") +
          P("M62 96 H88 V122 H62Z", shade(tone, -0.08)) + P("M12 218 L38 222 L37 232 L11 228Z", shade(tone, -0.18)) + P("M162 222 L188 218 L189 228 L163 232Z", shade(tone, -0.18));
        break;
      }
      case "jersey": {
        const st = shade(acc, -0.1);
        body = P("M70 40 L100 70 L130 40 L162 52 L188 96 L160 110 L150 92 L150 232 L50 232 L50 92 L40 110 L12 96 L38 52Z") +
          P("M70 40 L100 70 L130 40 L162 52 L188 96 L160 110 L150 92 L150 232 L50 232 L50 92 L40 110 L12 96 L38 52Z", `url(#${id}s)`) +
          `<path d="M70 40 L100 70 L130 40" fill="none" stroke="${st}" stroke-width="7" stroke-linejoin="round"/>` +
          `<path d="M54 96 V230 M146 96 V230" stroke="${st}" stroke-width="7"/><path d="M14 92 L38 104 M186 92 L162 104" stroke="${st}" stroke-width="6"/>` +
          `<text x="100" y="170" text-anchor="middle" font-family="Changa,sans-serif" font-weight="800" font-size="64" fill="${st}">${o.n || 10}</text>`;
        break;
      }
      default: { // tee
        const pr = o.print || 0;
        body = P("M70 40 Q100 56 130 40 L162 52 L188 96 L160 110 L150 92 L150 234 L50 234 L50 92 L40 110 L12 96 L38 52Z") +
          P("M70 40 Q100 56 130 40 L162 52 L188 96 L160 110 L150 92 L150 234 L50 234 L50 92 L40 110 L12 96 L38 52Z", `url(#${id}s)`) +
          `<path d="M70 40 Q100 58 130 40" fill="none" stroke="${shade(tone, -0.2)}" stroke-width="5"/>` +
          fold("M64 120 Q70 180 62 230") + fold("M138 130 Q132 190 140 230") +
          (pr === 1 ? `<circle cx="124" cy="92" r="11" fill="none" stroke="${ink}" stroke-width="2.4"/><text x="124" y="98" text-anchor="middle" font-family="Changa,sans-serif" font-weight="800" font-size="15" fill="${ink}">${mark}</text>`
            : pr === 2 ? `<text x="100" y="150" text-anchor="middle" font-family="Changa,sans-serif" font-weight="800" font-size="40" fill="${acc2}" stroke="${ink}" stroke-width="1.4" paint-order="stroke">${esc(o.word || mark)}</text>`
            : pr === 3 ? `<path d="M50 132 H150 M50 146 H150" stroke="${ink}" stroke-width="6" opacity=".85"/>` : "");
      }
    }
    return `<svg class="rk-g" viewBox="0 0 200 300" aria-hidden="true">${defs}${body}</svg>`;
  }
  const HANGER = `<svg class="rk-h" viewBox="0 0 200 60" aria-hidden="true"><path d="M100 30 V20 Q100 13 106 11 Q114 8 113 0" fill="none" stroke="#5b4636" stroke-width="3.4" stroke-linecap="round"/><path d="M100 26 L30 52 Q24 55 30 56 H170 Q176 55 170 52Z" fill="none" stroke="#6b4f3a" stroke-width="5" stroke-linejoin="round"/></svg>`;

  /* ---------- القسم ---------- */
  const isUp = (v) => typeof v === "string" && /^(https?:\/\/|data:image\/|\/m\/)/.test(v);
  const imgOf = (it) => [it.img, ...(Array.isArray(it.imgs) ? it.imgs : [])].find(isUp) || "";
  const productsOf = (site) => { const s = site.sections.find((x) => x.type === "products"); return s ? s.data : { items: [] }; };
  const orderMsg = (site, it) => `مرحبا ${site.brand.name}، بدي اطلب:\n• ${it.name}${it.price ? " = " + it.price : ""}\n\nالمقاس والكمية: `;

  function pieceHtml(it, i, site, prods) {
    const c = site.theme.colors, img = imgOf(it), sum = SM.opts ? SM.opts.summary(it) : { price: it.price, soldOut: false };
    const art = img ? `<span class="rk-photo"><img src="${esc(img)}" alt="${esc(it.name)}" loading="${i < 6 ? "eager" : "lazy"}" decoding="async"></span>`
      : garmentSVG(kindOf(it), toneOf(it, i, site), { accent: c.accent, accent2: c.accent2, mark: site.brand.mark, word: site.brand.name, print: [1, 2, 0, 3][i % 4], n: 7 + i * 3 });
    // نافذة الخيارات بتعرض الرسمة نفسها إذا ما في صورة
    const sheetIt = img ? it : Object.assign({}, it, { img: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(art.replace('<svg class="rk-g"', '<svg xmlns="http://www.w3.org/2000/svg"')) });
    const so = SM.opts && !sum.soldOut ? SM.opts.tag(sheetIt, { site, label: prods.addLabel || "اطلب ع واتساب" }) : "";
    const href = SM.waLink(site, sum.soldOut ? `مرحبا ${site.brand.name}، بدي اسأل إذا «${it.name}» رح يرجع يتوفر؟` : orderMsg(site, it));
    const ext = href.startsWith("https:") ? ' target="_blank" rel="noopener"' : "";
    return `<a class="rk-piece${sum.soldOut ? " out" : ""}" draggable="false" href="${esc(href)}"${ext}${so} data-rk="${i}" data-name="${esc(it.name)}" data-price="${esc(sum.price || "")}" data-from="${sum.from ? 1 : ""}" aria-label="${esc(it.name)}${sum.price ? "، " + esc(sum.price) : ""}">
      <span class="rk-swing">${HANGER}${art}${sum.soldOut ? '<span class="rk-out">نفدت</span>' : ""}</span></a>`;
  }

  S.rack = (d, site) => {
    const prods = productsOf(site), items = (prods.items || []).slice(0, 12);
    const tick = (d.ticker || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const logo = site.brand.logo ? `<img src="${esc(site.brand.logo)}" alt="${esc(site.brand.name)}">` : `<b>${esc(site.brand.name)}</b>`;
    return `
  <section class="s-rack" id="${esc(d.id || "rack")}" data-rack>
    <header class="rk-top">
      <a href="#${esc(d.aboutTarget || "about")}" class="rk-link">${esc(d.aboutLabel || "عنّا")}</a>
      <a href="#" class="rk-logo" aria-label="${esc(site.brand.name)}">${logo}</a>
      <a href="#${esc(d.contactTarget || "contact")}" class="rk-link">${esc(d.contactLabel || "تواصل")}</a>
    </header>
    <div class="rk-copy">
      ${d.eyebrow ? `<span class="rk-eyebrow" data-hero-in>${esc(d.eyebrow)}</span>` : ""}
      ${d.title ? `<h1 class="rk-title" data-split="hero">${esc(d.title)}</h1>` : ""}
    </div>
    <div class="rk-stage">
      <div class="rk-scroll" tabindex="-1">
        <div class="rk-rail" style="--n:${Math.max(1, items.length)}">
          <i class="rk-bar" aria-hidden="true"></i>
          ${items.map((it, i) => pieceHtml(it, i, site, prods)).join("")}
        </div>
      </div>
      <p class="rk-cap" aria-live="polite"><span class="rk-cap-n"></span><span class="rk-cap-p"></span></p>
    </div>
    <div class="rk-cta" data-hero-in>
      <a class="rk-btn" href="#${esc(d.buttonTarget || "products")}">${esc(d.button || "شوف كل القطع")}</a>
      ${d.hint ? `<small class="rk-hint">${esc(d.hintTouch && matchMedia("(pointer: coarse)").matches ? d.hintTouch : d.hint)}</small>` : ""}
    </div>
    ${tick ? `<div class="rk-ticker" aria-hidden="true"><div class="rk-tt">${tick}${tick}${tick}${tick}</div></div>` : ""}
  </section>`;
  };

  /* ---------- الفيزياء والتفاعل ---------- */
  function init(root, site) {
    const sec = root.querySelector("[data-rack]"); if (!sec) return;
    root.classList.add("rk-site");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pieces = [...sec.querySelectorAll(".rk-piece")];
    const st = pieces.map(() => ({ a: 0, w: 0, x: 0, vx: 0 })); // a: زاوية المرجحة، x: إزاحة الدخول عالرف
    const cap = sec.querySelector(".rk-cap"), capN = cap.querySelector(".rk-cap-n"), capP = cap.querySelector(".rk-cap-p"), scroller = sec.querySelector(".rk-scroll"), rail = sec.querySelector(".rk-rail");
    let raf = 0, last = 0;
    const K = 38, DAMP = 3.2, MAXA = 24;
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    function tick(t) {
      const dt = Math.min(0.033, (t - last) / 1000); last = t; let moving = false;
      st.forEach((s, i) => {
        s.w += (-K * s.a - DAMP * s.w) * dt; s.a = Math.max(-MAXA, Math.min(MAXA, s.a + s.w * dt));
        // القطع المتجاورة بتتلاطش إذا تمرجحت كتير
        const n = st[i + 1]; if (n && s.a - n.a > 14) { const push = (s.a - n.a - 14) * 0.5; n.w += push * 6; s.w -= push * 6; }
        if (Math.abs(s.a) > 0.05 || Math.abs(s.w) > 0.05) moving = true; else { s.a = 0; s.w = 0; }
        pieces[i].firstElementChild.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    }
    const kick = (i, v) => { if (!st[i] || reduce) return; st[i].w += v; wake(); };

    // الماوس: سرعة المرور فوق القطعة بتعطيها دفشة بنفس الاتجاه
    let px = null, pt = 0;
    sec.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const now = performance.now(), vx = px === null ? 0 : (e.clientX - px) / Math.max(8, now - pt); px = e.clientX; pt = now;
      pieces.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top + r.height * 0.12 && e.clientY < r.bottom) kick(i, vx * 26);
      });
    }, { passive: true });
    sec.addEventListener("pointerleave", () => { px = null; });
    // الإصبع: سحب الرف بيمرجح القطع كلها عكس اتجاه السحب
    let sl = scroller.scrollLeft;
    scroller.addEventListener("scroll", () => { const dv = scroller.scrollLeft - sl; sl = scroller.scrollLeft; if (Math.abs(dv) > 0.5) pieces.forEach((p, i) => kick(i, Math.max(-60, Math.min(60, dv * 2.2)))); }, { passive: true });

    // العنوان تحت الرف: اسم القطعة وسعرها تحت القطعة اللي عليها الماوس
    const show = (p) => {
      if (!p) { cap.classList.remove("on"); pieces.forEach((x) => x.classList.remove("hot")); sec.classList.remove("focus"); return; }
      capN.textContent = p.dataset.name; capP.textContent = p.dataset.price ? (p.dataset.from ? "من " : "") + p.dataset.price : "";
      const r = p.getBoundingClientRect(), sr = sec.querySelector(".rk-stage").getBoundingClientRect();
      cap.style.setProperty("--cx", (r.left + r.width / 2 - sr.left).toFixed(0) + "px");
      pieces.forEach((x) => x.classList.toggle("hot", x === p)); sec.classList.add("focus"); cap.classList.add("on");
    };
    pieces.forEach((p, i) => {
      p.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") show(p); });
      p.addEventListener("focus", () => show(p));
      p.addEventListener("pointerdown", () => kick(i, 40));
    });
    rail.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") show(null); });
    rail.addEventListener("focusout", (e) => { if (!rail.contains(e.relatedTarget)) show(null); });
    // بالموبايل: القطعة اللي بنص الشاشة هي اللي اسمها ظاهر
    if (matchMedia("(pointer: coarse)").matches) {
      let tm = 0; const mid = () => { const c = innerWidth / 2; let best = null, bd = 1e9; pieces.forEach((p) => { const r = p.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - c); if (dd < bd) { bd = dd; best = p; } }); show(best); };
      scroller.addEventListener("scroll", () => { clearTimeout(tm); tm = setTimeout(mid, 90); }, { passive: true });
      setTimeout(mid, 1600);
    }

    // الدخول: القطع بتنزلق عالرف من الطرف لمكانها وحدة ورا التانية، وبتتمرجح لما توقف
    if (!reduce && window.gsap) {
      const g = window.gsap, bar = sec.querySelector(".rk-bar");
      g.from(bar, { scaleX: 0, duration: 1.1, ease: "expo.out", delay: 0.1 });
      pieces.forEach((p, i) => {
        const from = innerWidth * 0.62 + i * 28; // RTL: من يمين الشاشة لمكانها
        g.fromTo(p, { x: from, opacity: 0 }, { x: 0, opacity: 1, duration: 1.15, ease: "power3.out", delay: 0.35 + (pieces.length - 1 - i) * 0.09, clearProps: "transform,opacity", onComplete: () => kick(i, -120 - Math.random() * 60) });
      });
      // الشريط بيمشي أسرع شوي مع الانزلاق
    }
    // نسخ للمكتبة والتجربة
    sec._rk = { kick, st };
  }

  // القطع بقسم المنتجات بتاخد نفس الرسمة بدل الصورة البديلة
  function decorateProducts(root, site) {
    const prods = productsOf(site), c = site.theme.colors;
    root.querySelectorAll(".s-products .prod").forEach((el, i) => {
      const it = (prods.items || [])[i]; if (!it) return;
      const ph = el.querySelector(".pimg"); if (!ph || ph.querySelector(".has-up")) return;
      const old = ph.querySelector(".ph"); if (old) old.remove();
      const lab = ph.querySelector(".ph-label"); if (lab) lab.remove();
      ph.insertAdjacentHTML("afterbegin", `<span class="rk-card">${HANGER}${garmentSVG(kindOf(it), toneOf(it, i, site), { accent: c.accent, accent2: c.accent2, mark: site.brand.mark, word: site.brand.name, print: [1, 2, 0, 3][i % 4], n: 7 + i * 3 })}</span>`);
    });
  }

  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg, mount) {
    const site = baseRender.call(this, cfg, mount);
    const root = mount || document.getElementById("site");
    if (root.querySelector("[data-rack]")) { decorateProducts(root, site); init(root, site); }
    return site;
  };
  SM.rack = { garmentSVG, kindOf, toneOf };
})();
