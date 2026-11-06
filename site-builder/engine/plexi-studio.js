/* صمّم · «جرّب قطعتك»: استوديو تصميم بلكسي مباشر
   الزبون بيختار شكل القطعة (قوس، قلب، فراشة، دائرة، درع، لوحة، علبة ضيافة)، بيكتب الأسماء والتاريخ،
   بيختار الخامة ولون الحروف، بيضيف لؤلؤ أو صورته (طباعة UV)، وبيشوفها 3D (بتلف بالسحب) أو 2D قبل القص بالليزر.
   الطلب بيروح على واتساب مع ملخص التصميم، وفي زر بيحمّل صورة التصميم ليبعتها. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const S = SM.sections, esc = SM.esc, icon = SM.icon, T = window.THREE;
  if (!S) return;

  const SHAPES = {
    arch: { label: "قوس", cm: "\u206630×40\u2069 سم" },
    heart: { label: "قلب", cm: "\u206635×33\u2069 سم" },
    butterfly: { label: "فراشة", cm: "\u206640×35\u2069 سم" },
    circle: { label: "دائرة", cm: "قطر 35 سم" },
    shield: { label: "درع", cm: "\u206622×33\u2069 سم" },
    plaque: { label: "لوحة", cm: "\u206640×28\u2069 سم" },
    box: { label: "علبة ضيافة", cm: "\u206626×18×14\u2069 سم" },
  };
  const MATS = { clear: ["شفاف كريستال", "linear-gradient(135deg,#fff,#e7eef3 50%,#fff)"], frost: ["مغشّى", "linear-gradient(135deg,#f3f3f3,#dcdcdc)"], white: ["أبيض", "#fbfbf8"], black: ["أسود لامع", "#141114"], rose: ["وردي", "#f2c7d3"], gold: ["مرآة ذهبي", "linear-gradient(135deg,#fff1c2,#c9973f 45%,#7a5418 70%,#f6dc93)"] };
  const INKS = { gold: ["ذهبي مرآة", "linear-gradient(135deg,#fff1c2,#c9973f 45%,#7a5418 70%,#f6dc93)"], silver: ["فضي مرآة", "linear-gradient(135deg,#fff,#a9adb6 45%,#5e626b 70%,#e9ebef)"], rosegold: ["روز جولد", "linear-gradient(135deg,#ffe3dc,#d9958a 45%,#93564e 70%,#f6c9bf)"], black: ["أسود", "#151215"], white: ["أبيض", "#ffffff"] };

  const icons = {
    arch: "M6 22V10a6 6 0 0 1 12 0v12z", heart: "M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z",
    butterfly: "M12 8c-1-4-7-6-8-2s2 5 6 5c-4 1-5 5-3 6s4-1 5-4c1 3 3 5 5 4s1-5-3-6c4 0 7-1 6-5s-7-2-8 2z", circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    shield: "M7 21V9q0-5 5-6 5 1 5 6v12z", plaque: "M3 7h18v11H3z", box: "M4 9h16v11H4zM3 6h18v3H3zM10 4h4v2h-4z",
  };

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
          <fieldset><legend>الشكل</legend><div class="px-st-shapes">${Object.entries(SHAPES).map(([k, v], i) => `<button type="button" data-shape="${k}" aria-pressed="${i === 0}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[k]}"/></svg><span>${v.label}</span></button>`).join("")}</div></fieldset>
          <div class="px-st-two">
            <label class="field"><span>الاسم الأول</span><input name="n1" maxlength="18" value="${esc(d.n1 || "محمد")}" autocomplete="off"></label>
            <label class="field"><span>الاسم التاني <small>(اختياري)</small></span><input name="n2" maxlength="18" value="${esc(d.n2 || "سارة")}" autocomplete="off"></label>
          </div>
          <label class="field"><span>التاريخ أو عبارة قصيرة</span><input name="line" maxlength="28" value="${esc(d.line || "14 · 2 · 2027")}" autocomplete="off"></label>
          <fieldset><legend>الخامة</legend><div class="px-st-sw">${Object.entries(MATS).map(([k, v], i) => `<button type="button" data-mat="${k}" aria-pressed="${i === 0}" title="${v[0]}"><i style="background:${v[1]}"></i><span>${v[0]}</span></button>`).join("")}</div></fieldset>
          <fieldset><legend>لون الحروف</legend><div class="px-st-sw">${Object.entries(INKS).map(([k, v], i) => `<button type="button" data-ink="${k}" aria-pressed="${i === 0}" title="${v[0]}"><i style="background:${v[1]}"></i><span>${v[0]}</span></button>`).join("")}</div></fieldset>
          <div class="px-st-extras">
            <label class="px-st-toggle"><input type="checkbox" name="pearls" checked><span>لؤلؤ عالحواف</span></label>
            <label class="px-st-file">${icon("spark")}<span data-file-label>ضيف صورتك عالقطعة (طباعة UV)</span><input type="file" name="photo" accept="image/*"></label>
            <button type="button" class="px-st-clear" data-clear-photo hidden>شيل الصورة</button>
          </div>
          <div class="px-st-actions">
            <a class="btn" data-st-order href="#" target="_blank" rel="noopener">${icon("wa")} اطلب هالتصميم</a>
            <button type="button" class="btn ghost" data-st-save>حمّل صورة التصميم</button>
          </div>
          <p class="px-st-note">بعد ما تبعت الطلب، ابعتلنا صورة التصميم${""} بنفس المحادثة لنطلعلك ياها متل ما شفتها.</p>
        </form>
      </div>
    </div>
  </section>`;

  /* ---------- أشكال ---------- */
  function shapeOf(k) {
    const s = new T.Shape();
    if (k === "heart") {
      s.moveTo(0, -1.5); s.bezierCurveTo(-0.3, -1.1, -1.6, -0.4, -1.6, 0.55); s.bezierCurveTo(-1.6, 1.35, -0.95, 1.65, -0.5, 1.6); s.bezierCurveTo(-0.2, 1.57, 0, 1.35, 0, 1.15);
      s.bezierCurveTo(0, 1.35, 0.2, 1.57, 0.5, 1.6); s.bezierCurveTo(0.95, 1.65, 1.6, 1.35, 1.6, 0.55); s.bezierCurveTo(1.6, -0.4, 0.3, -1.1, 0, -1.5);
    } else if (k === "butterfly") {
      const f = 0.82, m = (x, y) => [x * f, y * f + 0.1];
      s.moveTo(...m(0, -0.9)); s.bezierCurveTo(...m(-0.3, -1.9), ...m(-1.7, -1.9), ...m(-1.45, -0.6)); s.bezierCurveTo(...m(-1.35, -0.2), ...m(-0.9, -0.08), ...m(-0.6, 0));
      s.bezierCurveTo(...m(-2.1, 0.2), ...m(-2.2, 1.9), ...m(-1.15, 1.75)); s.bezierCurveTo(...m(-0.5, 1.65), ...m(-0.15, 0.95), ...m(0, 0.55));
      s.bezierCurveTo(...m(0.15, 0.95), ...m(0.5, 1.65), ...m(1.15, 1.75)); s.bezierCurveTo(...m(2.2, 1.9), ...m(2.1, 0.2), ...m(0.6, 0));
      s.bezierCurveTo(...m(0.9, -0.08), ...m(1.35, -0.2), ...m(1.45, -0.6)); s.bezierCurveTo(...m(1.7, -1.9), ...m(0.3, -1.9), ...m(0, -0.9));
    } else if (k === "circle") { s.absarc(0, 0, 1.55, 0, Math.PI * 2, false); }
    else if (k === "shield") { s.moveTo(-1.05, -1.6); s.lineTo(1.05, -1.6); s.lineTo(1.05, 0.85); s.quadraticCurveTo(1.05, 1.55, 0, 1.75); s.quadraticCurveTo(-1.05, 1.55, -1.05, 0.85); s.lineTo(-1.05, -1.6); }
    else if (k === "plaque" || k === "box") { const w = k === "box" ? 1.3 : 1.75, h = k === "box" ? 0.72 : 1.2, r = 0.12; s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h); }
    else { const W = 2.5, H = 3.3, r = W / 2; s.moveTo(-r, -H / 2); s.lineTo(r, -H / 2); s.lineTo(r, H / 2 - r); s.absarc(0, H / 2 - r, r, 0, Math.PI, false); s.lineTo(-r, -H / 2); }
    return s;
  }
  const bboxOf = (shape) => { const b = new T.Box2(); shape.getPoints(64).forEach((p) => b.expandByPoint(p)); return b; };

  /* ---------- نص الأسماء كصورة (أبيض على أسود = alphaMap) ---------- */
  function textCanvas(st, w, h, forSvg) {
    const R = 1024, c = document.createElement("canvas"); c.width = R; c.height = Math.round(R * h / w);
    const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = "rtl";
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display") || "serif";
    const fit = (t, size, maxW, weight = 700, f = fam) => { let fs = size; x.font = `${weight} ${fs}px ${f}`; while (x.measureText(t).width > maxW && fs > 20) { fs -= 6; x.font = `${weight} ${fs}px ${f}`; } return fs; };
    const H = c.height, maxW = R * 0.78, n1 = st.n1.trim(), n2 = st.n2.trim(), line = st.line.trim();
    const big = Math.min(230, H * 0.2);
    if (n1 && n2) {
      fit(n1, big, maxW); x.fillText(n1, R / 2, H * 0.34);
      x.font = `400 ${Math.round(big * 0.55)}px ${fam}`; x.fillText("&", R / 2, H * 0.5);
      fit(n2, big, maxW); x.fillText(n2, R / 2, H * 0.64);
    } else if (n1 || n2) { fit(n1 || n2, big * 1.25, maxW); x.fillText(n1 || n2, R / 2, H * 0.45); }
    if (line) { fit(line, Math.min(70, H * 0.06), maxW * 0.9, 500, '"Tajawal", sans-serif'); x.fillText(line, R / 2, H * 0.8); x.fillRect(R * 0.38, H * 0.73, R * 0.24, Math.max(3, H * 0.004)); }
    return c;
  }

  /* ---------- المحرك ثلاثي الأبعاد ---------- */
  function engine(host, colors) {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    const scene = new T.Scene(), bg = new T.Color(colors.surface).lerp(new T.Color(colors.bg), 0.4);
    scene.background = bg;
    scene.environment = SM.makeEnv ? SM.makeEnv(renderer, colors) : null;
    scene.add(new T.HemisphereLight(0xffffff, new T.Color(colors.accent2), 0.7));
    const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 5, 6); scene.add(key);
    const warm = new T.PointLight(new T.Color(colors.accent), 30, 16); warm.position.set(3, 1, 4); scene.add(warm);
    // أرضية ناعمة مع ظل
    const floor = new T.Mesh(new T.CircleGeometry(6, 64), new T.MeshBasicMaterial({ color: bg.clone().multiplyScalar(0.92), transparent: true, opacity: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.05; scene.add(floor);
    const shadowC = document.createElement("canvas"); shadowC.width = shadowC.height = 128; { const g = shadowC.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,.35)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
    const shadow = new T.Mesh(new T.PlaneGeometry(5, 2.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowC), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.04; scene.add(shadow);

    const camera = new T.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0.3, 10.5);
    const holder = new T.Group(); scene.add(holder);
    let piece = null, lid = null, pop = 1;
    const rot = { x: 0.08, y: -0.5, vx: 0, vy: 0, drag: false, idle: 0 };

    const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = w / h < 0.9 ? 13 : 10.5; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(host); resize();
    // سحب للّف
    let lx = 0, ly = 0;
    host.addEventListener("pointerdown", (e) => { rot.drag = true; lx = e.clientX; ly = e.clientY; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", (e) => { if (!rot.drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; rot.vy = dx * 0.008; rot.vx = dy * 0.004; rot.y += rot.vy; rot.x = Math.max(-0.5, Math.min(0.6, rot.x + rot.vx)); rot.idle = 0; });
    const up = () => (rot.drag = false); host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);

    const goldMat = (c) => new T.MeshPhysicalMaterial({ color: new T.Color(c), metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06 });
    const sheetMat = (k) => ({
      clear: () => new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, transmission: 1, thickness: 0.4, ior: 1.49, clearcoat: 1, specularIntensity: 1, attenuationColor: new T.Color("#eaf6ff"), attenuationDistance: 3, side: T.DoubleSide }),
      frost: () => new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, transmission: 0.92, thickness: 0.4, ior: 1.49, clearcoat: 0.6, side: T.DoubleSide }),
      white: () => new T.MeshPhysicalMaterial({ color: 0xfbfbf8, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }),
      black: () => new T.MeshPhysicalMaterial({ color: 0x0f0c0f, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
      rose: () => new T.MeshPhysicalMaterial({ color: 0xf2c7d3, roughness: 0.12, transmission: 0.45, thickness: 0.4, clearcoat: 1 }),
      gold: () => goldMat("#e2b45c"),
    }[k] || (() => goldMat("#e2b45c")))();
    const inkMat = (k, alpha) => {
      const base = { gold: ["#e8bb62", 1, 0.14], silver: ["#e8eaef", 1, 0.12], rosegold: ["#e7a99f", 1, 0.16], black: ["#141114", 0, 0.2], white: ["#ffffff", 0, 0.3] }[k] || ["#e8bb62", 1, 0.14];
      return new T.MeshPhysicalMaterial({ color: new T.Color(base[0]), metalness: base[1], roughness: base[2], clearcoat: 1, alphaMap: alpha, transparent: true, alphaTest: 0.35, side: T.DoubleSide });
    };
    const shapeUV = (geo, b) => { const uv = geo.attributes.uv, p = geo.attributes.position, sx = b.max.x - b.min.x, sy = b.max.y - b.min.y; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / sx, (p.getY(i) - b.min.y) / sy); uv.needsUpdate = true; };
    const coverTex = (img, aspect) => { const tx = new T.Texture(img); tx.colorSpace = T.SRGBColorSpace; tx.needsUpdate = true; const a = img.width / img.height; tx.repeat.set(a > aspect ? aspect / a : 1, a > aspect ? 1 : a / aspect); tx.offset.set((1 - tx.repeat.x) / 2, (1 - tx.repeat.y) / 2); return tx; };

    function build(st) {
      if (piece) { holder.remove(piece); piece.traverse((o) => { o.geometry && o.geometry.dispose(); }); }
      piece = new T.Group(); lid = null;
      const D = 0.14;
      if (st.shape === "box") {
        const w = 2.6, dpt = 1.8, h = 1.35, t = 0.07, m = sheetMat(st.mat);
        const add = (gw, gh, gd, x, y, z, mat = m) => { const b = new T.Mesh(new T.BoxGeometry(gw, gh, gd), mat); b.position.set(x, y, z); piece.add(b); return b; };
        add(w, t, dpt, 0, -h / 2, 0); add(w, h, t, 0, 0, -dpt / 2); add(t, h, dpt, -w / 2, 0, 0); add(t, h, dpt, w / 2, 0, 0); add(w, h, t, 0, 0, dpt / 2);
        // حلو جوّا
        const candy = [goldMat("#e2b45c"), new T.MeshPhysicalMaterial({ color: 0xf2c7d3, roughness: 0.3, clearcoat: 1 }), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 })];
        for (let i = 0; i < 12; i++) { const s = new T.Mesh(new T.SphereGeometry(0.2, 20, 14), candy[i % 3]); s.position.set(-0.95 + (i % 4) * 0.63, -h / 2 + 0.24 + Math.floor(i / 8) * 0.3, -0.5 + (Math.floor(i / 4) % 2) * 0.75 + (i >= 8 ? 0.35 : 0)); s.scale.y = 0.8; piece.add(s); }
        // الغطا بمقبض ذهب، بينفتح على المفصلة الخلفية
        lid = new T.Group(); lid.position.set(0, h / 2, -dpt / 2);
        const lp = new T.Mesh(new T.BoxGeometry(w + 0.12, 0.09, dpt + 0.12), sheetMat(st.mat === "gold" ? "clear" : st.mat)); lp.position.set(0, 0.05, dpt / 2); lid.add(lp);
        const knob = new T.Mesh(new T.TorusGeometry(0.16, 0.05, 16, 40), goldMat("#e2b45c")); knob.position.set(0, 0.25, dpt / 2); lid.add(knob);
        piece.add(lid);
        // الكتابة والصورة على الواجهة
        const fw = w * 0.92, fh = h * 0.86;
        if (st.photo) { const ph = new T.Mesh(new T.PlaneGeometry(fw, fh), new T.MeshBasicMaterial({ map: coverTex(st.photo, fw / fh), toneMapped: false })); ph.position.set(0, 0, dpt / 2 + t / 2 + 0.003); piece.add(ph); }
        const tx = new T.CanvasTexture(textCanvas(st, fw, fh)); const txt = new T.Mesh(new T.PlaneGeometry(fw, fh), inkMat(st.ink, tx)); txt.position.set(0, 0, dpt / 2 + t / 2 + 0.03); piece.add(txt);
        piece.position.y = -2.05 + h / 2 + 0.04;
      } else {
        const shape = shapeOf(st.shape), b = bboxOf(shape), bw = b.max.x - b.min.x, bh = b.max.y - b.min.y, cx = (b.max.x + b.min.x) / 2, cy = (b.max.y + b.min.y) / 2;
        const g = new T.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 64 }); g.translate(0, 0, -D / 2);
        piece.add(new T.Mesh(g, sheetMat(st.mat)));
        if (st.photo) { const pg = new T.ShapeGeometry(shape, 64); shapeUV(pg, b); const tex = coverTex(st.photo, bw / bh); tex.repeat.set(tex.repeat.x, tex.repeat.y); const ph = new T.Mesh(pg, new T.MeshBasicMaterial({ map: tex, toneMapped: false })); ph.position.z = D / 2 + 0.03; piece.add(ph); }
        const tw = bw * 0.9, th = bh * 0.9, tx = new T.CanvasTexture(textCanvas(st, tw, th));
        const txt = new T.Mesh(new T.PlaneGeometry(tw, th), inkMat(st.ink, tx)); txt.position.set(cx, cy, D / 2 + 0.06); piece.add(txt);
        if (st.pearls) {
          const pts = shape.getSpacedPoints(st.shape === "butterfly" ? 110 : 84), k = Math.min(bw, bh);
          const pearl = new T.InstancedMesh(new T.SphereGeometry(0.06, 18, 12), new T.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.25, clearcoat: 1, sheen: 1, sheenColor: new T.Color("#ffe6f0"), iridescence: 0.4 }), pts.length);
          const m4 = new T.Matrix4();
          pts.forEach((p, i) => { const dx = p.x - cx, dy = p.y - cy, L = Math.hypot(dx, dy) || 1, ins = 0.14 * (2.6 / k); m4.makeTranslation(p.x - (dx / L) * ins, p.y - (dy / L) * ins, D / 2 + 0.05); pearl.setMatrixAt(i, m4); });
          piece.add(pearl);
        }
        // قاعدة ذهبية
        const base = new T.Mesh(new T.BoxGeometry(Math.min(bw, 2.8) + 0.5, 0.16, 0.75), goldMat("#d9a94f")); base.position.set(cx, b.min.y - 0.08, 0); piece.add(base);
        piece.position.set(-cx, -2.05 + 0.16 - b.min.y, 0);
      }
      holder.add(piece);
      pop = 0;
    }

    let running = true, t = 0, lastT = performance.now();
    new IntersectionObserver(([e]) => (running = e.isIntersecting)).observe(host);
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      if (!running) return; t += dt;
      if (!rot.drag) { rot.idle += dt; rot.vy *= 0.94; rot.y += rot.vy; if (rot.idle > 2) rot.y += Math.sin(t * 0.5) * 0.0025; }
      pop = Math.min(1, pop + dt * 2.2);
      const e = 1 - Math.pow(1 - pop, 3), over = Math.sin(pop * Math.PI) * 0.06;
      holder.rotation.set(rot.x, rot.y, 0); holder.scale.setScalar(0.9 + e * 0.1 + over);
      holder.position.y = (1 - e) * 0.4;
      if (lid) lid.rotation.x = -(0.5 + 0.5 * Math.sin(t * 0.9)) * 1.1;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);
    return { build, png: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png"); } };
  }

  /* ---------- عرض 2D قبل القص ---------- */
  function svg2d(st, colors) {
    const k = st.shape === "box" ? "plaque" : st.shape, shape = shapeOf(k), b = bboxOf(shape), pad = 0.35;
    const vb = [b.min.x - pad, -b.max.y - pad, b.max.x - b.min.x + pad * 2, b.max.y - b.min.y + pad * 2];
    const d = "M" + shape.getPoints(80).map((p) => `${p.x.toFixed(3)} ${(-p.y).toFixed(3)}`).join("L") + "Z";
    const tc = textCanvas(st, b.max.x - b.min.x, b.max.y - b.min.y);
    const inkCol = { gold: "#b8893b", silver: "#8d929c", rosegold: "#c27c71", black: "#151215", white: "#ffffff" }[st.ink];
    const id = "c" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="${vb.join(" ")}" aria-hidden="true">
      <defs><clipPath id="${id}"><path d="${d}"/></clipPath><pattern id="${id}g" width=".25" height=".25" patternUnits="userSpaceOnUse"><path d="M.25 0H0V.25" fill="none" stroke="rgba(0,0,0,.06)" stroke-width=".006"/></pattern>
      <mask id="${id}m"><image href="${tc.toDataURL()}" x="${(b.min.x + (b.max.x - b.min.x) * 0.05).toFixed(3)}" y="${(-b.max.y + (b.max.y - b.min.y) * 0.05).toFixed(3)}" width="${((b.max.x - b.min.x) * 0.9).toFixed(3)}" height="${((b.max.y - b.min.y) * 0.9).toFixed(3)}" preserveAspectRatio="none"/></mask></defs>
      <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="url(#${id}g)"/>
      <path d="${d}" fill="${st.mat === "black" ? "#1a1619" : st.mat === "white" ? "#fff" : st.mat === "rose" ? "#f6d6df" : st.mat === "gold" ? "#e9c37a" : "rgba(220,235,245,.45)"}" stroke="rgba(0,0,0,.15)" stroke-width=".01"/>
      ${st.photo ? `<image href="${st.photoUrl}" x="${b.min.x}" y="${-b.max.y}" width="${b.max.x - b.min.x}" height="${b.max.y - b.min.y}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>` : ""}
      <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${inkCol}" mask="url(#${id}m)"/>
      <path class="px-cut" d="${d}" fill="none" stroke="#ff2d55" stroke-width=".022" stroke-dasharray=".08 .05"/>
      <g class="px-dim" stroke="${colors.muted}" stroke-width=".01" fill="${colors.muted}" font-size=".16" font-family="Tajawal, sans-serif" text-anchor="middle">
        <path d="M${b.min.x} ${-b.min.y + 0.2}H${b.max.x}M${b.min.x} ${-b.min.y + 0.12}v.16M${b.max.x} ${-b.min.y + 0.12}v.16" fill="none"/>
        <text x="${(b.min.x + b.max.x) / 2}" y="${-b.min.y + 0.33}" stroke="none">${esc(SHAPES[st.shape].cm)}</text>
      </g></svg>`;
  }

  function guess(name) {
    const n = String(name || "");
    if (/قلب/.test(n)) return "heart"; if (/فراش/.test(n)) return "butterfly"; if (/درع/.test(n)) return "shield";
    if (/علب|بوكس|صندوق|ضياف|صين/.test(n)) return "box"; if (/مراي|مرآ|دائر|طار|ميدالي/.test(n)) return "circle"; if (/لوح|كانف|استقبال|تعليق/.test(n)) return "plaque";
    return "arch";
  }

  function init(root, site) {
    const sec = root.querySelector("[data-px-studio]"); if (!sec) return;
    const f = sec.querySelector(".px-st-panel"), host = sec.querySelector(".px-st-canvas"), flat = sec.querySelector(".px-st-2d"), size = sec.querySelector(".px-st-size");
    const st = { shape: "arch", mat: "clear", ink: "gold", pearls: true, photo: null, photoUrl: "", n1: f.n1.value, n2: f.n2.value, line: f.line.value };
    const colors = site.theme.colors;
    let eng = null, view = "3d", timer = 0;
    const has3d = (() => { try { return !!(T && document.createElement("canvas").getContext("webgl2")); } catch (e) { return false; } })();
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
    sec.querySelector("[data-st-save]").addEventListener("click", () => {
      const a = document.createElement("a"); a.download = `${site.brand.name}-تصميمي.png`;
      if (eng && view === "3d") { a.href = eng.png(); a.click(); return; }
      const svg = flat.querySelector("svg"); if (!svg) return;
      const im = new Image(), c = document.createElement("canvas"); c.width = 1200; c.height = 1200 * svg.viewBox.baseVal.height / svg.viewBox.baseVal.width;
      im.onload = () => { const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); a.href = c.toDataURL("image/png"); a.click(); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    });
    // المحرك بيشتغل لما يقرب القسم من الشاشة
    if (has3d) new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); eng = engine(host, colors); refresh(); }, { rootMargin: "300px" }).observe(sec);
    refresh();
    // من نافذة منتج: «جرّب اسمك على هالقطعة»
    SM.pxStudio = { open(name) { const k = guess(name), b = sec.querySelector(`[data-shape="${k}"]`); if (b) b.click(); sec.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => f.n1.focus({ preventScroll: true }), 900); } };
  }

  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg, mount) { const site = baseRender.call(this, cfg, mount); init(mount || document.getElementById("site"), site); return site; };
})();
