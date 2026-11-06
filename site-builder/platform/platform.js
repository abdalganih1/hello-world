/* صمّم · منطق واجهة العميل
   الفكرة ← بطاقات الأسئلة ← التوليد ← المعاينة.
   chooseTemplate() هون تقليد بسيط بالكلمات المفتاحية؛ بالنسخة الحقيقية بيستبدلها طلب لـ Worker بيسأل الذكاء الاصطناعي. */
(function () {
  const TPL = window.SAMMEM_TEMPLATES;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAL_NAMES = { luxe: ["فخم", "ألوان غامقة ولمسة ذهبية"], calm: ["هادي", "فاتح ومريح للعين"], bold: ["جريء", "ألوان قوية بتلفت النظر"] };
  const SECTION_NAMES = { marquee: "شريط كلمات متحرك", about: "من نحن", services: "الخدمات", menu: "المنيو", process: "خطوات العمل", gallery: "معرض صور", team: "الفريق", testimonials: "آراء الزبائن", pricing: "الأسعار والباقات", products: "المنتجات والسلة", faq: "أسئلة شائعة", cta: "دعوة للتواصل" };

  /* ---------- رسم موقع مصغّر على canvas (للبطاقات العائمة وصور القوالب) ---------- */
  function drawMini(c, pal, seed = 1, title) {
    const x = c.getContext("2d"), w = c.width, h = c.height, u = w / 100;
    const rnd = (n) => { const s = Math.sin(seed * 999 + n * 77) * 10000; return s - Math.floor(s); };
    x.fillStyle = pal.bg; x.fillRect(0, 0, w, h);
    // ضوء المجسم
    const cx = w * (0.22 + rnd(1) * 0.08), cy = h * 0.42, r = h * (0.26 + rnd(2) * 0.06);
    const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.25, pal.accent); g.addColorStop(1, pal.accent2);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.globalAlpha = 0.18; x.fillStyle = pal.accent; x.beginPath(); x.arc(cx, cy, r * 1.6, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    // شريط القائمة
    const rr = (X, Y, W, H, R, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(X, Y, W, H, R); x.fill(); };
    rr(4 * u, 4 * u, 92 * u, 7 * u, 3.5 * u, pal.surface);
    rr(89 * u, 5.2 * u, 4.6 * u, 4.6 * u, 1.4 * u, pal.accent);
    rr(6 * u, 5.4 * u, 12 * u, 4.2 * u, 2.1 * u, pal.accent);
    for (let i = 0; i < 4; i++) rr((40 + i * 9) * u, 7 * u, 6 * u, 1.2 * u, 0.6 * u, pal.muted);
    // العنوان
    if (title) {
      x.fillStyle = pal.ink; x.textAlign = "right"; x.direction = "rtl";
      x.font = `700 ${9 * u}px Alexandria, "IBM Plex Sans Arabic", sans-serif`;
      x.fillText(title, 93 * u, 30 * u);
    } else { rr(48 * u, 22 * u, 45 * u, 6 * u, 1.5 * u, pal.ink); rr(60 * u, 31 * u, 33 * u, 6 * u, 1.5 * u, pal.ink); }
    rr(55 * u, 41 * u, 38 * u, 1.6 * u, 0.8 * u, pal.muted); rr(63 * u, 45 * u, 30 * u, 1.6 * u, 0.8 * u, pal.muted);
    rr(76 * u, 51 * u, 17 * u, 5.5 * u, 2.75 * u, pal.accent); rr(62 * u, 51 * u, 12 * u, 5.5 * u, 2.75 * u, pal.surface);
    // بطاقات
    for (let i = 0; i < 3; i++) { rr((4 + i * 31.3) * u, 66 * u, 29 * u, h - 70 * u, 2.4 * u, pal.surface); rr((24 + i * 31.3) * u, 70 * u, 5 * u, 5 * u, 1.4 * u, pal.accent); }
  }

  /* ---------- حقل البطاقات العائمة 3D ---------- */
  function field(canvas) {
    const T = window.THREE; if (!T) return;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.1, 100); cam.position.z = 12;
    const pals = []; Object.values(TPL).forEach((t) => Object.values(t.palettes).forEach((p) => pals.push(p)));
    const N = innerWidth < 700 ? 14 : 26, cards = [];
    const geo = new T.PlaneGeometry(3.2, 2.0);
    for (let i = 0; i < N; i++) {
      const c = document.createElement("canvas"); c.width = 512; c.height = 320; drawMini(c, pals[i % pals.length], i + 1);
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95 }));
      const ang = (i / N) * Math.PI * 2, rad = 5.5 + (i % 3) * 1.6;
      m.userData = { ang, rad, y: (Math.random() - 0.5) * 7, z: -2 - Math.random() * 9, sp: 0.04 + Math.random() * 0.05, rot: (Math.random() - 0.5) * 0.4 };
      scene.add(m); cards.push(m);
    }
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener("pointermove", (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(canvas); size();
    let vis = true; new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(canvas);
    let t = 0;
    (function loop() {
      requestAnimationFrame(loop);
      if (!vis || document.body.classList.contains("busy")) return;
      t += reduce ? 0.002 : 0.016;
      ptr.sx += (ptr.x - ptr.sx) * 0.04; ptr.sy += (ptr.y - ptr.sy) * 0.04;
      const sc = Math.min(1, scrollY / innerHeight);
      cards.forEach((m) => {
        const d = m.userData, a = d.ang + t * d.sp;
        m.position.set(Math.cos(a) * d.rad * (cam.aspect > 1 ? 1.25 : 0.7), d.y + Math.sin(t * 0.5 + d.ang) * 0.3 + sc * 3, d.z + Math.sin(a) * 2);
        m.rotation.set(ptr.sy * 0.25, -Math.cos(a) * 0.5 + ptr.sx * 0.35, d.rot);
      });
      cam.position.x = ptr.sx * 0.8; cam.position.y = -ptr.sy * 0.5; cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    })();
  }

  /* ---------- القوالب بالصفحة الرئيسية ---------- */
  function renderTemplateCards() {
    const box = $("#tpls"); if (!box) return;
    const all = Object.values(TPL), LIMIT = 6;
    box.innerHTML = all.map((t, i) => {
      const p = t.palettes[t.defaultPalette];
      return `<article class="tpl">
        <div class="shot"><canvas width="640" height="400" data-mini="${t.id}" data-seed="${i + 3}"></canvas></div>
        <div class="meta">
          <div class="row"><h3>${esc(t.label)}</h3><span class="sw">${Object.values(t.palettes).map((q) => `<i style="background:${q.accent}"></i>`).join("")}</span></div>
          <p>${esc(t.brand.name)} · ${esc(t.brand.tagline)}</p>
          <div class="row"><button class="pbtn ghost" data-try="${t.id}">جرّب القالب</button><a class="pbtn ghost" href="site.html?t=${t.id}" target="_blank" rel="noopener">افتح كامل</a></div>
        </div></article>`;
    }).join("");
    // منعرض أول 6 قوالب وزر «اعرض كل القوالب»
    const cards = [...box.children];
    if (cards.length > LIMIT) {
      cards.slice(LIMIT).forEach((c) => (c.hidden = true));
      const more = document.createElement("button"); more.className = "more tpls-more"; more.type = "button";
      more.innerHTML = `اعرض كل القوالب <span>(${cards.length - LIMIT} كمان)</span>`;
      more.onclick = () => { cards.forEach((c) => (c.hidden = false)); more.remove(); draw(); };
      box.after(more);
    }
    const draw = () => box.querySelectorAll("[data-mini]").forEach((c) => { const t = TPL[c.dataset.mini]; drawMini(c, t.palettes[t.defaultPalette], +c.dataset.seed, t.brand.name); });
    draw(); document.fonts && document.fonts.ready.then(draw);
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-try]"); if (b) startWizard(TPL[b.dataset.try].keywords[0] + " " + TPL[b.dataset.try].brand.name, b.dataset.try); });
  }

  /* ---------- "الذكاء الاصطناعي" (تقليد محلي) ---------- */
  function chooseTemplate(idea) {
    let best = "agency", score = 0;
    Object.values(TPL).forEach((t) => { const s = t.keywords.reduce((n, k) => n + (idea.includes(k) ? 1 : 0), 0); if (s > score) { score = s; best = t.id; } });
    return best;
  }
  function guessName(idea) {
    const m = idea.match(/(?:اسمها|اسمه|بإسم|باسم)\s+[«"']?([^\s،,.«»"']+(?:\s+[^\s،,.«»"']+)?)/);
    return m ? m[1].replace(/[»"']/g, "") : "";
  }
  const TR = { ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "w", ي: "y", ى: "a", ء: "", ئ: "e", ؤ: "o", " ": "-" };
  const slugify = (s) => (s || "").trim().split("").map((ch) => (TR[ch] !== undefined ? TR[ch] : /[a-z0-9-]/i.test(ch) ? ch.toLowerCase() : "")).join("").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "mysite";

  // تصغير الصورة بالمتصفح قبل ما تنبعت (أخف للمعاينة وللرفع لاحقاً على R2)
  function shrink(file, max, type) {
    return new Promise((res) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL(type, 0.85)); };
      img.onerror = () => res("");
      img.src = url;
    });
  }

  /* ---------- المعالج ---------- */
  let DOMAIN = "md2.dev";
  fetch("/api/health").then((r) => r.json()).then((d) => { if (d.domain) DOMAIN = d.domain; }).catch(() => {});
  const st = { contact: "", owner: "", content: {}, logo: "", images: [], morePal: false, idea: "", t: "agency", palette: "bold", name: "", tagline: "", off: [], phone: "", whatsapp: "", slug: "", step: 0 };
  const layer = $("#layer");

  function steps() {
    const t = TPL[st.t];
    const optional = [...new Set(t.sections.map((s) => s.type))].filter((k) => SECTION_NAMES[k]);
    return [
      { key: "النوع", title: "شو نوع مشروعك؟", get hint() { return st.thinking ? "الذكاء الاصطناعي عم يقرا فكرتك ويختار الأنسب…" : (st.aiWhy ? "اخترنالك: " + esc(st.aiWhy.replace(/[.،]\s*$/, "")) + ". غيّرو إذا بدك." : "اخترنالك الأقرب حسب فكرتك. غيّرو إذا بدك."); }, valid: () => !!st.t,
        html: () => {
          // الاقتراح والمختار أولاً، وبعدين الباقي؛ منعرض 6 وبزر «اعرض المزيد» الباقي
          const all = Object.values(TPL), first = [st.ai, st.t].filter((v, i, a) => a.indexOf(v) === i);
          const list = [...first.map((id) => TPL[id]), ...all.filter((x) => !first.includes(x.id))];
          const shown = st.moreT ? list : list.slice(0, 6), rest = list.length - shown.length;
          return `<div class="opts">${shown.map((x) => `<button class="opt" data-t="${x.id}" aria-pressed="${x.id === st.t}">${x.id === st.ai ? `<span class="tagai">${st.thinking ? "عم نفهم فكرتك…" : "اقتراح الذكاء الاصطناعي"}</span>` : ""}<b>${esc(x.label)}</b><small>${esc(x.keywords.slice(0, 5).join("، "))}</small></button>`).join("")}</div>
            ${rest ? `<button class="more" data-more>اعرض المزيد <span>(${rest} أنواع)</span></button>` : ""}`;
        },
        bind: (el) => { el.querySelectorAll("[data-t]").forEach((b) => b.onclick = () => { st.picked = true; st.t = b.dataset.t; st.palette = TPL[st.t].defaultPalette; st.off = []; paint(); });
          const m = $("[data-more]", el); if (m) m.onclick = () => { st.moreT = true; paint(); animIn(); }; } },
      { key: "الاسم", title: "شو اسم مشروعك؟", hint: "هالاسم رح يطلع باللوغو وبعنوان الموقع.", valid: () => st.name.trim().length > 1,
        html: () => `<div class="fld"><label for="w-name">اسم المشروع</label><input id="w-name" value="${esc(st.name)}" placeholder="${esc(TPL[st.t].brand.name)}" autocomplete="organization"></div>
          <div class="fld"><label for="w-tag">جملة قصيرة بتوصفه (اختياري)</label><input id="w-tag" value="${esc(st.tagline)}" placeholder="${esc(TPL[st.t].brand.tagline)}"></div>`,
        bind: (el) => { const n = $("#w-name", el), g = $("#w-tag", el); n.oninput = () => { st.name = n.value; st.nameTouched = true; navState(); }; g.oninput = () => (st.tagline = g.value); setTimeout(() => n.focus(), 350); } },
      { key: "الطابع", title: "أي طابع بيشبهك؟", hint: "الألوان والخطوط بتتغير، والتصميم بيضل متناسق.", valid: () => !!st.palette,
        html: () => {
          const card = (k, p, name, desc) => `<button class="opt" data-p="${k}" aria-pressed="${k === st.palette}"><span class="pal"><i style="background:${p.bg}"></i><i style="background:${p.surface}"></i><i style="background:${p.accent}"></i><i style="background:${p.accent2}"></i></span><b>${esc(name)}</b><small>${esc(desc)}</small></button>`;
          const base = Object.entries(TPL[st.t].palettes).map(([k, p]) => card(k, p, PAL_NAMES[k][0], PAL_NAMES[k][1]));
          const extra = Object.entries(window.SAMMEM_EXTRA_PALETTES || {}).map(([k, p]) => card(k, p, p.label, p.desc));
          const showAll = st.morePal || extra.some((x) => x.includes(`data-p="${st.palette}"`));
          return `<div class="opts three">${base.join("")}${showAll ? extra.join("") : ""}</div>
            ${extra.length && !showAll ? `<button class="more" data-more>اعرض المزيد <span>(${extra.length} طوابع)</span></button>` : ""}`;
        },
        bind: (el) => { el.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { st.palette = b.dataset.p; paint(); });
          const m = $("[data-more]", el); if (m) m.onclick = () => { st.morePal = true; paint(); animIn(); }; } },
      { key: "الصور", title: "عندك لوغو أو صور؟", hint: "اختياري. إذا ما رفعت شي، منحطلك صور بديلة بتمشي مع الألوان.", valid: () => true,
        html: () => `<div class="up-grid">
            <label class="drop logo-drop" for="w-logo">${st.logo ? `<img src="${st.logo}" alt="اللوغو">` : `<b>اللوغو</b><small>PNG أو JPG</small>`}</label>
            <input id="w-logo" type="file" accept="image/*" hidden>
            <div class="photos">
              ${st.images.map((src, i) => `<span class="thumb"><img src="${src}" alt="صورة ${i + 1}"><button data-rm="${i}" aria-label="شيل الصورة">×</button></span>`).join("")}
              ${st.images.length < 6 ? `<label class="drop" for="w-imgs"><b>+ صور</b><small>لحد 6 صور</small></label>` : ""}
            </div>
            <input id="w-imgs" type="file" accept="image/*" multiple hidden>
          </div>
          <p class="fine">أول صورة بتطلع بقسم «من نحن»، والباقي بمعرض الصور والفريق.</p>`,
        bind: (el) => {
          $("#w-logo", el).onchange = async (e) => { const f = e.target.files[0]; if (f) { st.logo = await shrink(f, 400, "image/png"); paint(); } };
          $("#w-imgs", el).onchange = async (e) => { for (const f of [...e.target.files].slice(0, 6 - st.images.length)) st.images.push(await shrink(f, 1400, "image/jpeg")); paint(); };
          el.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => { st.images.splice(+b.dataset.rm, 1); paint(); });
        } },
      { key: "الأقسام", title: "شو بدك يكون بموقعك؟", hint: "شلنا المطلوب لنوع مشروعك. طفّي اللي ما بدك ياه.", valid: () => true,
        html: () => `<div class="toggles">${optional.map((k) => `<button data-s="${k}" aria-pressed="${!st.off.includes(k)}">${SECTION_NAMES[k]}</button>`).join("")}</div><p class="fine">التواصل والخريطة وزر الواتساب موجودين دايماً.</p>`,
        bind: (el) => el.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { const k = b.dataset.s; st.off = st.off.includes(k) ? st.off.filter((x) => x !== k) : [...st.off, k]; b.setAttribute("aria-pressed", !st.off.includes(k)); }) },
      { key: "التواصل", title: "كيف بيتواصلوا معك الزبائن؟", hint: "الرسائل من نموذج التواصل بتوصلك على لوحتك وعلى بريدك.", valid: () => st.slug.length > 2,
        html: () => `<div class="two-f"><div class="fld"><label for="w-ph">رقم الهاتف</label><input id="w-ph" inputmode="tel" dir="ltr" style="text-align:right" value="${esc(st.phone)}" placeholder="011 xxx xxxx"></div>
          <div class="fld"><label for="w-wa">رقم الواتساب</label><input id="w-wa" inputmode="tel" dir="ltr" style="text-align:right" value="${esc(st.whatsapp)}" placeholder="09xx xxx xxx"></div></div>
          <div class="fld"><label for="w-slug">رابط موقعك المجاني</label><div class="sub-in"><input id="w-slug" value="${esc(st.slug)}" spellcheck="false" autocapitalize="off"><span>.${esc(DOMAIN)}</span></div></div>`,
        bind: (el) => { $("#w-ph", el).oninput = (e) => (st.phone = e.target.value); $("#w-wa", el).oninput = (e) => (st.whatsapp = e.target.value);
          const s = $("#w-slug", el); s.oninput = () => { st.slug = slugify(s.value.replace(/\./g, "-")); st.slugTouched = true; navState(); }; s.onblur = () => (s.value = st.slug); } },
    ];
  }

  function startWizard(idea, forceT) {
    st.idea = idea.trim(); st.ai = chooseTemplate(st.idea); st.t = forceT || st.ai; st.palette = TPL[st.t].defaultPalette;
    st.name = guessName(st.idea); st.slug = slugify(st.name) || TPL[st.t].id; st.off = []; st.step = 0; st.logo = ""; st.images = []; st.morePal = false; st.moreT = false; st.content = {}; st.tagline = ""; st.nameTouched = false; st.slugTouched = false; st.aiWhy = "";
    layer.hidden = false; document.body.classList.add("busy"); document.body.style.overflow = "hidden";
    st.picked = !!forceT; st.thinking = !forceT;
    paint(true);
    if (!forceT) askPlan(st.idea);
  }
  // الذكاء الاصطناعي بيقرا الفكرة وبيختار القالب والاسم والرابط (الكلمات المفتاحية بس احتياط لحد ما يرد)
  async function askPlan(idea) {
    const templates = Object.values(TPL).map((t) => ({ id: t.id, label: t.label, keywords: t.keywords }));
    let d = null;
    try {
      const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch("/api/plan", { method: "POST", signal: ctrl.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ idea, templates }) });
      clearTimeout(timer); if (r.ok) d = await r.json();
    } catch (e) {}
    if (st.idea !== idea) return; // الزبون بلّش فكرة تانية
    st.thinking = false;
    if (d && TPL[d.t]) {
      st.ai = d.t; st.aiWhy = d.why || "";
      if (!st.picked) { st.t = d.t; st.palette = TPL[d.t].defaultPalette; }
      if (d.name && !st.nameTouched) { st.name = d.name; }
      if (d.slug && !st.slugTouched) st.slug = d.slug; else if (!st.slugTouched) st.slug = slugify(st.name) || TPL[st.t].id;
      if (d.tagline && !st.tagline) st.tagline = d.tagline;
    }
    if (!layer.hidden && st.step === 0) paint();
  }

  function shell(inner) {
    return `<div class="wz pw">
      <div class="wz-top"><a class="plogo" href="#" data-close><i>ص</i>صمّم</a><div class="idea-pill">فكرتك: <span>${esc(st.idea)}</span></div></div>
      ${inner}</div>`;
  }

  function paint(first) {
    const S = steps(), s = S[st.step];
    if (!st.slug) st.slug = slugify(st.name) || st.t;
    layer.innerHTML = shell(`
      <div class="deck">
        <div class="dots" style="position:absolute;top:0;inset-inline:0">${S.map((_, i) => `<i class="${i === st.step ? "on" : i < st.step ? "done" : ""}"></i>`).join("")}</div>
        <span class="ghost-card g1"></span><span class="ghost-card g2"></span>
        <section class="qcard" aria-live="polite"><span class="q-k">سؤال ${st.step + 1} من ${S.length} · ${s.key}</span><h2>${s.title}</h2><p class="hint">${s.hint}</p>${s.html()}</section>
      </div>
      <div class="wz-nav"><button class="pbtn ghost" data-back>${st.step ? "رجوع" : "إلغاء"}</button><button class="pbtn accent" data-next>${st.step === S.length - 1 ? "صمّم موقعي" : "التالي"}</button></div>`);
    s.bind(layer);
    navState();
    $("[data-back]", layer).onclick = () => { if (st.step) { st.step--; paint(); } else close(); };
    $("[data-next]", layer).onclick = () => { if (!s.valid()) return; if (st.step < S.length - 1) { st.step++; paint(); animIn(1); } else generate(); };
    $("[data-close]", layer).onclick = (e) => { e.preventDefault(); close(); };
    if (first) animIn(1);
  }
  function navState() { const b = $("[data-next]", layer); if (b) b.disabled = !steps()[st.step].valid(); }
  function animIn() {
    const c = $(".qcard", layer); if (!c || reduce || !window.gsap) return;
    gsap.from(c, { y: 60, rotateX: -14, opacity: 0, duration: 0.7, ease: "expo.out" });
    gsap.from(c.querySelectorAll(".opt, .toggles button, .fld"), { y: 16, opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.15, ease: "power3.out" });
  }
  function close() { layer.hidden = true; layer.innerHTML = ""; document.body.classList.remove("busy"); document.body.style.overflow = ""; }

  /* ---------- الذكاء الاصطناعي عبر الـ Worker ---------- */
  const EDITABLE = ["hero", "marquee", "about", "services", "menu", "process", "gallery", "team", "testimonials", "pricing", "products", "craft", "showcase", "faq", "cta", "contact"];
  function editableContent() {
    const site = window.SAMMEM.build(Object.assign(cfg(), { off: [] }));
    return { palette: st.palette, brand: { name: site.brand.name, tagline: site.brand.tagline }, off: st.off,
      sections: site.sections.filter((x) => EDITABLE.includes(x.type)).map((x) => ({ type: x.type, data: x.data })) };
  }
  async function askAI(kind, instruction) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      const r = await fetch("/api/" + kind, { method: "POST", signal: ctrl.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction, name: st.name, content: editableContent() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, reply: d.reply };
      return { ok: true, ...d };
    } catch (e) { return { ok: false }; } finally { clearTimeout(timer); }
  }
  function applyAI(d) {
    if (d.palette) st.palette = d.palette;
    if (d.brand && d.brand.name) st.name = d.brand.name;
    if (d.brand && d.brand.tagline) st.tagline = d.brand.tagline;
    (d.sections || []).forEach((x) => { st.content[x.type] = x.data; });
    (d.off || []).forEach((t) => { if (!st.off.includes(t)) st.off.push(t); });
    (d.on || []).forEach((t) => { st.off = st.off.filter((x) => x !== t); });
    return (d.sections || []).length || d.palette || d.brand || (d.off || []).length || (d.on || []).length;
  }

  /* ---------- التوليد ---------- */
  function generate() {
    const lines = ["عم نفهم فكرتك ونختار القالب", "عم نكتب النصوص بالعربي", "عم نركّب الأقسام والحركة", "عم نجهّز المعاينة"];
    layer.innerHTML = shell(`<div class="gen"><div class="box"><div class="orbit"><i></i><i></i><i></i></div><h2>عم نصمّم «${esc(st.name)}»</h2><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul></div></div>`);
    const li = layer.querySelectorAll(".gen li"); let i = 0, done = false;
    const job = askAI("write", st.idea + (st.tagline ? " — " + st.tagline : "")).then((d) => { if (d.ok) applyAI(d); st.wrote = d.ok; done = true; });
    const tick = () => {
      if (i === 2 && !done) { setTimeout(tick, 400); return; } // منستنى الكتابة عند خطوة النصوص
      if (i) li[i - 1].className = "ok";
      if (i < li.length) { li[i].className = "run"; i++; setTimeout(tick, reduce ? 200 : 750); } else job.then(() => setTimeout(preview, 350));
    };
    tick();
  }

  /* ---------- المعاينة ---------- */
  function cfg() { return { t: st.t, palette: st.palette, name: st.name.trim(), tagline: st.tagline.trim(), phone: st.phone.trim(), whatsapp: st.whatsapp.trim(), off: st.off, logo: st.logo, images: st.images, content: st.content }; }
  function siteUrl() { const c = cfg(), q = new URLSearchParams(); Object.entries(c).forEach(([k, v]) => { if (Array.isArray(v) ? v.length : v) q.set(k, Array.isArray(v) ? v.join(",") : v); }); return "site.html?" + q.toString(); }

  function preview() {
    const host = `${st.slug}.${DOMAIN}`;
    layer.innerHTML = `<div class="pv">
      <div class="pv-main">
        <div class="pv-bar">
          <button class="pbtn ghost" data-edit style="min-height:42px">تعديل الإجابات</button>
          <div class="url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>https://<b>${esc(host)}</b></span></div>
          <div class="seg" role="group" aria-label="حجم المعاينة"><button aria-pressed="true" data-dev="desk">كمبيوتر</button><button aria-pressed="false" data-dev="mob">موبايل</button></div>
        </div>
        <div class="frame-wrap" id="fw"><iframe id="pf" title="معاينة موقعك" src="site.html?embed=1"></iframe></div>
      </div>
      <aside class="pv-side">
        <span class="status" id="stt">مسودة · جاهزة للنشر</span>
        <h2>موقع «${esc(st.name)}» جاهز للمعاينة</h2>
        <div class="timeline">
          <div><span>1</span><p><b>المسودة جاهزة</b>جرّب الموقع، وغيّر أي شي بدك ياه.</p></div>
          <div><span>2</span><p><b>نشر فوري</b>بتضغط «انشر» وبينفتح موقعك على رابطه فوراً، والذكاء الاصطناعي بيراجع المحتوى بالخلفية.</p></div>
          <div><span>3</span><p><b>تشغيل تجريبي 3 أيام</b>على الرابط ${esc(host)}</p></div>
          <div><span>4</span><p><b>اعتمد موقعك</b>تواصل معنا قبل ما يخلص الوقت، منحددلك التكلفة، والدومين الخاص بـ 20$ بالسنة.</p></div>
        </div>
        <div class="edit-box"><label class="fine" for="ask-edit">بدك تعديل؟ اكتبه بكلماتك</label><textarea id="ask-edit" placeholder="مثلاً: خلي الألوان أفتح، وزيد قسم عروض"></textarea><button class="pbtn ghost" data-redo>طبّق التعديل</button><p class="fine" id="edit-msg" role="status"></p></div>
        <div class="edit-box pub">
          <label class="fine" for="pv-slug">عنوان موقعك</label>
          <div class="sub-in"><input id="pv-slug" value="${esc(st.slug)}" maxlength="30" autocomplete="off" spellcheck="false"><span>.${esc(DOMAIN)}</span></div>
          <label class="fine" for="w-contact">رقم واتساب للتواصل معك</label>
          <input id="w-contact" dir="ltr" inputmode="tel" value="${esc(st.contact || st.whatsapp || st.phone)}" placeholder="+963 9xx xxx xxx">
          <p class="fine" id="pub-msg" role="status"></p>
        </div>
        <div class="acts"><button class="pbtn accent" data-send>انشر موقعي هلق</button></div>
        <p class="note">${st.wrote ? "النصوص كتبها الذكاء الاصطناعي حسب فكرتك. راجعها قبل الإرسال." : "ما قدرنا نوصل للذكاء الاصطناعي هالمرة، فالنصوص الحالية من القالب. فيك تعدّلها بالكلمات من المربع فوق."}</p>
      </aside></div>`;
    const f = $("#pf"), fw = $("#fw");
    addEventListener("message", function onMsg(e) { if (e.data && e.data.type === "sammem:ready" && e.source === f.contentWindow) f.contentWindow.postMessage({ type: "sammem:config", cfg: cfg() }, "*"); });
    layer.querySelectorAll("[data-dev]").forEach((b) => b.onclick = () => { layer.querySelectorAll("[data-dev]").forEach((x) => x.setAttribute("aria-pressed", x === b)); fw.classList.toggle("mobile", b.dataset.dev === "mob"); });
    $("[data-edit]", layer).onclick = () => { st.step = 0; paint(true); };
    const reload = () => (f.src = "site.html?embed=1&r=" + Date.now());
    $("[data-redo]", layer).onclick = async (e) => {
      const v = $("#ask-edit").value, msg = $("#edit-msg"), btn = e.currentTarget;
      if (v.trim().length < 3) { msg.textContent = "اكتب شو بدك نغيّر."; return; }
      btn.disabled = true; msg.textContent = "عم نعدّل…";
      const d = await askAI("edit", v);
      btn.disabled = false;
      if (d.ok) { if (applyAI(d)) { reload(); layer.dispatchEvent(new Event("sammem:changed")); } msg.textContent = d.reply || "تم."; if (d.ok) $("#ask-edit").value = ""; return; }
      // بدون اتصال بالـ Worker (متل هالمعاينة): بس الألوان بتتغير محلياً
      const before = st.palette;
      if (/فاتح|أفتح|افتح|هادي|ابيض|أبيض/.test(v)) st.palette = "calm"; else if (/غامق|فخم|ذهبي|اسود|أسود/.test(v)) st.palette = "luxe"; else if (/جريء|قوي|حماس|ملفت/.test(v)) st.palette = "bold";
      if (st.palette !== before) { reload(); msg.textContent = "غيّرنا الألوان. باقي التعديلات بتحتاج الذكاء الاصطناعي، وبيشتغل بعد ما ننشر المنصة على حسابك."; }
      else msg.textContent = d.reply || "هالنسخة مو مربوطة بالذكاء الاصطناعي. بعد ما ننشرها على حسابك بكلاودفلير، هالطلب بيتنفّذ مباشرة.";
    };
    const slugIn = $("#pv-slug"), pmsg = $("#pub-msg"), urlB = $(".pv-bar .url b");
    let slugT;
    slugIn.oninput = () => {
      slugIn.value = slugIn.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      st.slug = slugIn.value; urlB.textContent = `${st.slug}.${DOMAIN}`;
      clearTimeout(slugT); slugT = setTimeout(async () => {
        try { const r = await (await fetch(`/api/slug?s=${encodeURIComponent(st.slug)}&o=${encodeURIComponent(st.owner || "")}`)).json(); pmsg.textContent = r.ok ? "العنوان متاح ✓" : r.reason === "taken" ? "هالعنوان محجوز، جرّب غيره." : "أحرف إنكليزية صغيرة وأرقام و - (من 3 لـ 30)."; } catch { pmsg.textContent = ""; }
      }, 350);
    };
    const sendBtn = $("[data-send]", layer);
    const publish = async () => {
      const btn = sendBtn; st.contact = $("#w-contact").value.trim();
      btn.disabled = true; btn.textContent = "عم ننشر…"; pmsg.textContent = "";
      try {
        const r = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: st.slug, contact: st.contact, idea: st.idea, owner: st.owner, cfg: cfg() }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { btn.disabled = false; btn.textContent = "انشر موقعي هلق"; pmsg.textContent = d.reply || "ما قدرنا نبعت هلق، جرّب بعد شوي."; return; }
        st.owner = d.owner;
        btn.disabled = false; btn.onclick = () => window.open(d.url, "_blank", "noopener");
        btn.textContent = "افتح موقعك";
        $("#stt").textContent = "منشور · تجريبي " + (d.days || 3) + " أيام";
        const end = new Date(d.liveUntil), when = end.toLocaleDateString("ar-SY-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }) + " " + end.toLocaleTimeString("ar-SY-u-nu-latn", { hour: "numeric", minute: "2-digit" });
        pmsg.innerHTML = `موقعك صار شغّال على <a href="${esc(d.url)}" target="_blank" rel="noopener" dir="ltr">${esc(d.url.replace("https://", ""))}</a><br>بيتوقف ${esc(when)} · باقي <b data-left></b><br>تواصل معنا قبلها لتعتمده.`;
        const left = pmsg.querySelector("[data-left]"), pad = (n) => String(n).padStart(2, "0");
        (function tick() { if (!left.isConnected) return; let s = Math.max(0, Math.floor((d.liveUntil - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; left.textContent = (dd ? dd + "ي " : "") + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60); setTimeout(tick, 1000); })();
      } catch { btn.disabled = false; btn.textContent = "انشر موقعي هلق"; pmsg.textContent = "انقطع الاتصال، جرّب مرة تانية."; }
    };
    sendBtn.onclick = publish;
    // بعد أي تعديل على موقع منشور: الزر بيرجع «حدّث موقعك»
    layer.addEventListener("sammem:changed", () => { if (st.owner) { sendBtn.onclick = publish; sendBtn.textContent = "حدّث موقعك المنشور"; } });
    if (window.gsap && !reduce) { gsap.from(".pv-side > *", { x: -30, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power3.out" }); gsap.from("#fw", { scale: 0.96, opacity: 0, duration: 0.8, ease: "expo.out" }); }
  }

  /* ---------- الصفحة الرئيسية ---------- */
  function init() {
    field($("canvas.field"));
    renderTemplateCards();
    const ta = $("#idea"), form = $("#askf");
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; };
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener("submit", (e) => { e.preventDefault(); if (ta.value.trim().length < 4) { ta.focus(); return; } startWizard(ta.value); });
    document.querySelectorAll("[data-ex]").forEach((b) => b.onclick = () => { ta.value = b.dataset.ex; grow(); ta.focus(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !layer.hidden) close(); });
    if (window.gsap && !reduce) {
      gsap.from(".phero .pw > *", { y: 40, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out" });
    }
  }
  window.SAMMEM_PLATFORM = { startWizard, drawMini };
  init();
})();
