/* صمّم · المُصيِّر
   بياخد ملف الموقع (قالب + تعديلات الزبون أو الذكاء الاصطناعي) وبيبني الصفحة.
   شكل الإعدادات اللي بيبعتها الذكاء الاصطناعي:
   { t: "restaurant", palette: "luxe", name: "...", tagline: "...", phone: "...", whatsapp: "...", off: ["pricing"] } */
(function () {
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function build(cfg = {}) {
    const all = window.SAMMEM_TEMPLATES;
    const base = all[cfg.t] || all[Object.keys(all)[0]];
    const site = clone(base);
    const pal = site.palettes[cfg.palette] || (window.SAMMEM_EXTRA_PALETTES || {})[cfg.palette] || site.palettes[site.defaultPalette];
    site.theme.colors = Object.assign({}, site.theme.colors, pal);
    if (cfg.name) { site.brand.name = cfg.name; site.brand.mark = cfg.name.trim().replace(/^(ال)/, "")[0] || site.brand.mark; }
    if (cfg.tagline) site.brand.tagline = cfg.tagline;
    if (cfg.logo) site.brand.logo = cfg.logo;
    site.images = Array.isArray(cfg.images) ? cfg.images : [];
    ["phone", "whatsapp", "email", "address", "hours"].forEach((k) => { if (cfg[k]) site.brand[k] = cfg[k]; });
    // تعديلات الذكاء الاصطناعي: { type: data } بتنضاف فوق بيانات القالب (المعرّف id بيضل نفسه)
    if (cfg.content) site.sections.forEach((s) => { const d = cfg.content[s.type]; if (d) s.data = Object.assign({}, s.data, d, s.data && s.data.id ? { id: s.data.id } : {}); });
    const off = new Set(cfg.off || []);
    site.sections = site.sections.filter((s) => !off.has(s.type) && !off.has(s.data && s.data.id));
    // الهيرو بياخد اسم المشروع إذا ما في عنوان مخصص
    const hero = site.sections.find((s) => s.type === "hero");
    if (hero && cfg.name && hero.data.useName) hero.data.title = hero.data.titleTpl.replace("{name}", cfg.name);
    if (hero && cfg.tagline) hero.data.lead = cfg.tagline;
    // القائمة بتنبني من الأقسام الموجودة
    const nav = site.sections.find((s) => s.type === "nav");
    if (nav) nav.data.links = nav.data.links.filter((l) => site.sections.some((s) => (s.data && s.data.id) === l.id || s.type === l.id));
    return site;
  }

  function applyTheme(site) {
    const c = site.theme.colors, r = document.documentElement.style;
    Object.entries({ bg: c.bg, surface: c.surface, ink: c.ink, muted: c.muted, accent: c.accent, accent2: c.accent2, line: c.line, "on-accent": c.onAccent }).forEach(([k, v]) => v && r.setProperty("--" + k, v));
    r.setProperty("--font-display", site.theme.fonts.display);
    r.setProperty("--font-body", site.theme.fonts.body);
    if (site.theme.radius) r.setProperty("--radius", site.theme.radius);
    const h = c.bg.replace("#", ""), lum = (0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16)) / 255;
    document.documentElement.style.colorScheme = lum < 0.45 ? "dark" : "light";
    document.title = site.brand.name + " · " + (site.brand.tagline || "");
  }

  function render(cfg, mount = document.getElementById("site")) {
    const site = build(cfg);
    applyTheme(site);
    const S = window.SAMMEM.sections;
    mount.innerHTML = '<div class="progress" aria-hidden="true"></div>' +
      site.sections.map((s) => (S[s.type] ? S[s.type](Object.assign({ variant: s.variant }, s.data || {}), site) : "")).join("");
    // صور الزبون بتاخد مكان الصور البديلة بالترتيب
    const slots = [...mount.querySelectorAll(".s-about .art .ph, .s-gallery figure .ph, .s-team .ph")];
    site.images.forEach((src, i) => { const el = slots[i]; if (!el) return; el.classList.add("has-img"); el.style.backgroundImage = `url("${src}")`; const lab = el.parentElement.querySelector(".ph-label"); if (lab) lab.remove(); });
    if (site.brand.logo) mount.querySelectorAll(".logo .mark").forEach((m) => { m.classList.add("img"); m.innerHTML = `<img src="${site.brand.logo}" alt="">`; });
    const stageEl = mount.querySelector("[data-scene]");
    if (stageEl) window.SAMMEM.mountScene(stageEl, site.theme.scene, site.theme.colors, { center: (site.sections.find((s) => s.type === "hero") || {}).variant === "center" });
    window.SAMMEM.motion.init(mount);
    return site;
  }

  function readConfig() {
    const q = new URLSearchParams(location.search), cfg = {};
    q.forEach((v, k) => { cfg[k] = k === "off" ? v.split(",").filter(Boolean) : v; });
    return cfg;
  }

  window.SAMMEM = window.SAMMEM || {};
  Object.assign(window.SAMMEM, { build, render, readConfig, applyTheme });
})();
