/* صمّم · مشاهد 3D إضافية (Three.js r158)
   كل مشهد إلو حركة خاصة بتتقدّم مع الانزلاق (st.sp من 0 لـ 1، والبطل مثبّت لحد ما تخلص):
   pizza     المكونات بتنزل على العجينة، بتنخبز بفرن حطب، وعجلة بتقطعها، وشريحة بتطلع مع خيوط الجبنة
   shawarma  سيخ بيدور وسكين بتقص شرائح بتنزل على الخبز
   products  أدوات مطبخ على صينية دوّارة بتتفكّك وبتطير
   washer    غسالة بينفتح بابها والحلّة بتدور، مع مسنن ومفتاح
   barber    عمود حلاق مخطط ومقص بيقص، والشعر بيتساقط
   grocery   خضرة وفواكه بتوقع بالصندوق وبتطير منه
   drop      قطرة شفافة بتتقسم لقطرات أصغر
   bottle    عبوة سيروم بيطلع غطاها وبتنقط، وعلبة كريم
   cloth     قماش قطني معلّق بيتموّج، وقطن بيطير
   carpet    سجادة بنقشة شرقية بتنفرد مع الانزلاق
   laptop    لابتوب بينفتح وبيدور وشاشته شغّالة */
(function () {
  const T = window.THREE;
  if (!T || !window.SAMMEM || !window.SAMMEM.three) return;
  const { stage, anchor } = window.SAMMEM.three;
  const C = (c) => new T.Color(c);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  // transmission بيطلع أبيض مصمت على كروت ضعيفة وبيتقّل الموبايل، فمنحوّله لزجاج شفاف عادي ملوّن
  const phys = (o) => {
    o = Object.assign({ roughness: 0.4, metalness: 0 }, o);
    if (o.transmission) {
      const tint = o.attenuationColor ? new T.Color(o.color !== undefined ? o.color : 0xffffff).lerp(o.attenuationColor, 0.35) : o.color;
      Object.assign(o, { color: tint, transparent: true, opacity: Math.min(o.opacity !== undefined ? o.opacity : 1, 1 - o.transmission * 0.55), clearcoat: o.clearcoat !== undefined ? o.clearcoat : 1, envMapIntensity: 1.4, depthWrite: false });
      ["transmission", "thickness", "attenuationColor", "attenuationDistance", "ior"].forEach((k) => delete o[k]);
    }
    return new T.MeshPhysicalMaterial(o);
  };
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  function lights(scene, colors, k = 1) {
    scene.add(new T.HemisphereLight(0xffffff, C(colors.bg), 0.6 * k));
    const key = new T.DirectionalLight(0xffffff, 2.2 * k); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new T.PointLight(C(colors.accent), 26 * k, 18); rim.position.set(3, 1, -3); scene.add(rim);
    const fill = new T.PointLight(C(colors.accent2), 14 * k, 16); fill.position.set(-3, -2, 4); scene.add(fill);
  }
  function shadowDisc(r = 2.4, op = 0.45) {
    const tex = canvasTex(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, `rgba(0,0,0,${op})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, w); });
    const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  function place(st, group, o, extraY = 0) {
    const an = anchor(st, o.center);
    group.position.x += (an.x - group.position.x) * 0.08;
    const narrow = !st.wide && !o.center; // عالموبايل المشهد بالنص التحتاني تحت الأزرار
    group.position.y += (an.y + (narrow ? 0.05 : 0) + extraY - group.position.y) * 0.08;
    group.scale.setScalar(an.s * (o.scale || 1) * (narrow ? 0.92 : 1));
  }
  function orient(mesh, a, b) { // سلندر بين نقطتين
    const d = new T.Vector3().subVectors(b, a), len = d.length();
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    mesh.scale.set(1, Math.max(0.001, len), 1);
  }
  function steam(group, n, color, spread = 1.5, h = 3) {
    const g = new T.BufferGeometry(), pos = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * spread; pos[i * 3 + 1] = rnd() * h; pos[i * 3 + 2] = (rnd() - 0.5) * spread; seed.push(0.2 + rnd() * 0.5); }
    g.setAttribute("position", new T.BufferAttribute(pos, 3));
    const p = new T.Points(g, new T.PointsMaterial({ color: C(color), size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }));
    p.userData.tick = (dt) => { for (let i = 0; i < n; i++) { pos[i * 3 + 1] += dt * seed[i]; pos[i * 3] += Math.sin(pos[i * 3 + 1] * 2 + i) * dt * 0.1; if (pos[i * 3 + 1] > h) pos[i * 3 + 1] = 0; } g.attributes.position.needsUpdate = true; };
    group.add(p); return p;
  }

  /* ---------- PIZZA ----------
     قصة كاملة مع الانزلاق (st.sp من 0 لـ 1):
     0.00 عجينة نيّة وصلصة بتنفرد · 0.10 جبنة مبشورة بتنزل وبتدوب · 0.22 بيبروني وخضرة بتوقع
     0.42 فرن حطب بيطلع والبيتزا بتفوت · 0.52 خَبز: الحواف بتحمر والجبنة بتفقّع · 0.68 بتطلع سخنة
     0.76 عجلة التقطيع بتقص 4 خطوط · 0.92 الشرائح بتنفرط وشريحة بتطلع مع خيوط الجبنة */
  function pizza(el, colors, o) {
    const st = stage(el, colors, { exposure: 1.08 }), { scene, camera } = st;
    lights(scene, colors, 0.95);
    const root = new T.Group(); scene.add(root);
    const tray = new T.Group(); tray.rotation.x = 0.66; root.add(tray);
    const R = 2.05, N = 8, A = (Math.PI * 2) / N;
    const seg = (a, b, k) => clamp((k - a) / (b - a));
    const mix = (c1, c2, k) => new T.Color(c1).lerp(new T.Color(c2), k);

    /* خامات مرسومة: عجينة، صلصة، جبنة، تحمير، بيبروني، طوب، أرضية حجر */
    const noise = (x, w, h, n, f) => { for (let i = 0; i < n; i++) { f(x, rnd() * w, rnd() * h, rnd()); } };
    const tDough = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = "#f1dcb2"; x.fillRect(0, 0, w, h);
      noise(x, w, h, 2600, (x, a, b, r) => { x.fillStyle = r > 0.5 ? "rgba(255,250,236,.5)" : "rgba(170,120,60,.14)"; x.beginPath(); x.arc(a, b, 0.6 + r * 2.2, 0, 7); x.fill(); });
      noise(x, w, h, 60, (x, a, b, r) => { x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(a, b, 4 + r * 10, 2 + r * 4, r * 3, 0, 7); x.fill(); });
    });
    const tChar = canvasTex(512, 512, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      noise(x, w, h, 320, (x, a, b, r) => { const g = x.createRadialGradient(a, b, 0, a, b, 3 + r * 16); g.addColorStop(0, `rgba(${40 + r * 30},${22 + r * 10},8,${0.55 + r * 0.4})`); g.addColorStop(1, "rgba(80,40,10,0)"); x.fillStyle = g; x.beginPath(); x.arc(a, b, 3 + r * 16, 0, 7); x.fill(); });
      noise(x, w, h, 900, (x, a, b, r) => { x.fillStyle = `rgba(120,64,20,${0.18 + r * 0.2})`; x.fillRect(a, b, 2 + r * 6, 1 + r * 3); });
    });
    const tSauce = canvasTex(512, 512, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, "#c2371f"); g.addColorStop(1, "#9e2412"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      noise(x, w, h, 500, (x, a, b, r) => { x.strokeStyle = `rgba(${r > 0.5 ? "230,90,50" : "110,20,10"},.35)`; x.lineWidth = 1 + r * 3; x.beginPath(); x.arc(a, b, 6 + r * 30, r * 6, r * 6 + 1.2); x.stroke(); });
      noise(x, w, h, 420, (x, a, b, r) => { x.fillStyle = r > 0.4 ? "rgba(40,80,20,.8)" : "rgba(70,110,30,.7)"; x.fillRect(a, b, 1.5 + r * 2.5, 1 + r * 1.5); });
    });
    const tCheese = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = "#fff4d6"; x.fillRect(0, 0, w, h);
      noise(x, w, h, 700, (x, a, b, r) => { const g = x.createRadialGradient(a, b, 0, a, b, 6 + r * 18); g.addColorStop(0, "rgba(255,255,245,.9)"); g.addColorStop(1, "rgba(240,215,150,0)"); x.fillStyle = g; x.beginPath(); x.arc(a, b, 6 + r * 18, 0, 7); x.fill(); });
      noise(x, w, h, 260, (x, a, b, r) => { x.fillStyle = "rgba(230,190,110,.35)"; x.beginPath(); x.ellipse(a, b, 8 + r * 20, 3 + r * 8, r * 3, 0, 7); x.fill(); });
    });
    const tBlister = canvasTex(512, 512, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      noise(x, w, h, 260, (x, a, b, r) => { const rr = 4 + r * 14, g = x.createRadialGradient(a, b, rr * 0.2, a, b, rr); g.addColorStop(0, `rgba(${150 + r * 40},${80 + r * 20},20,${0.65 + r * 0.3})`); g.addColorStop(0.7, "rgba(200,120,30,.35)"); g.addColorStop(1, "rgba(200,120,30,0)"); x.fillStyle = g; x.beginPath(); x.arc(a, b, rr, 0, 7); x.fill(); });
    });
    const tPep = canvasTex(256, 256, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, "#b8321f"); g.addColorStop(0.85, "#9a2214"); g.addColorStop(1, "#6e150b"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      noise(x, w, h, 140, (x, a, b, r) => { x.fillStyle = `rgba(255,${200 + r * 40},${180 + r * 40},${0.5 + r * 0.3})`; x.beginPath(); x.ellipse(a, b, 2 + r * 5, 1.5 + r * 3, r * 3, 0, 7); x.fill(); });
      noise(x, w, h, 200, (x, a, b) => { x.fillStyle = "rgba(40,10,5,.45)"; x.fillRect(a, b, 2, 2); });
    });
    const tBrick = canvasTex(1024, 512, (x, w, h) => {
      x.fillStyle = "#3a2018"; x.fillRect(0, 0, w, h);
      const bh = 32, bw = 84;
      for (let r = 0; r * bh < h; r++) for (let c = -1; c * bw < w; c++) {
        const ox = (r % 2) * bw / 2, l = 30 + rnd() * 16;
        x.fillStyle = `hsl(${12 + rnd() * 10}, ${45 + rnd() * 15}%, ${l}%)`; x.fillRect(c * bw + ox + 3, r * bh + 3, bw - 6, bh - 6);
        x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(c * bw + ox + 3, r * bh + bh - 9, bw - 6, 6);
      }
      noise(x, w, h, 2000, (x, a, b, r) => { x.fillStyle = `rgba(0,0,0,${r * 0.25})`; x.fillRect(a, b, 2, 2); });
    });
    tBrick.wrapS = tBrick.wrapT = T.RepeatWrapping; tBrick.repeat.set(3, 1.5);
    const tStone = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = "#5b4a3d"; x.fillRect(0, 0, w, h);
      noise(x, w, h, 3000, (x, a, b, r) => { x.fillStyle = `rgba(${r > 0.5 ? "255,240,220" : "0,0,0"},${0.05 + r * 0.08})`; x.fillRect(a, b, 2 + r * 3, 2 + r * 3); });
      noise(x, w, h, 80, (x, a, b, r) => { x.fillStyle = `rgba(20,10,5,${0.15 + r * 0.25})`; x.beginPath(); x.arc(a, b, 4 + r * 18, 0, 7); x.fill(); });
    });
    const tFlame = canvasTex(128, 256, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h * 0.72, 4, w / 2, h * 0.6, h * 0.55);
      g.addColorStop(0, "rgba(255,250,210,1)"); g.addColorStop(0.25, "rgba(255,190,70,.95)"); g.addColorStop(0.6, "rgba(240,90,20,.55)"); g.addColorStop(1, "rgba(160,30,0,0)");
      x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, 0); x.quadraticCurveTo(w * 1.05, h * 0.65, w / 2, h); x.quadraticCurveTo(-w * 0.05, h * 0.65, w / 2, 0); x.fill();
    });

    /* لوح الخشب */
    const board = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 0.12, 72), phys({ color: C("#86552d"), roughness: 0.7, clearcoat: 0.2 }));
    board.position.y = -0.2; tray.add(board);
    const handle = new T.Mesh(new T.BoxGeometry(0.7, 0.1, 1.5), board.material); handle.position.set(0, -0.2, 3.1); tray.add(handle);
    const sh = shadowDisc(3.3); sh.position.y = -0.27; tray.add(sh);

    /* البيتزا: 8 شرائح، كل وحدة فيها طبقاتها ومكوناتها (حتى تتحرك سوا لما تنقطع) */
    const pz = new T.Group(); tray.add(pz);
    const mCrust = phys({ color: C("#f0d9ae"), map: tDough, roughness: 0.85 });
    const mChar = new T.MeshStandardMaterial({ map: tChar, transparent: true, opacity: 0, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
    const mSauce = phys({ map: tSauce, roughness: 0.45, clearcoat: 0.5 });
    const mCheese = phys({ color: C("#fff7e0"), map: tCheese, roughness: 0.5, clearcoat: 0.35, transparent: true, opacity: 0 });
    const mBlister = new T.MeshStandardMaterial({ map: tBlister, transparent: true, opacity: 0, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 });
    const mPep = phys({ map: tPep, roughness: 0.5, clearcoat: 0.6 });
    const mOl = phys({ color: C("#17140f"), roughness: 0.25, clearcoat: 1 });
    const mMush = phys({ color: C("#d9c3a2"), roughness: 0.7 });
    const mPepper = phys({ color: C("#3f8a2b"), roughness: 0.35, clearcoat: 0.6 });
    const mBasil = phys({ color: C("#2f6e22"), roughness: 0.5, clearcoat: 0.3, side: T.DoubleSide });
    const slices = [], drops = [];
    const at = (r, th, y) => new T.Vector3(r * Math.sin(th), y, r * Math.cos(th));
    const addDrop = (g, mesh, pos, a, b, spin = 1) => { mesh.position.copy(pos); g.add(mesh); drops.push({ mesh, to: pos.clone(), a, b, spin: (rnd() - 0.5) * 8 * spin, rot0: mesh.rotation.clone(), h: 2.6 + rnd() * 1.4 }); };
    for (let i = 0; i < N; i++) {
      const s0 = i * A, len = A, mid = s0 + len / 2, g = new T.Group();
      const wedge = (r, h, y, m, radial = 24) => { const mm = new T.Mesh(new T.CylinderGeometry(r, r, h, radial, 1, false, s0, len), m); mm.position.y = y; g.add(mm); return mm; };
      wedge(R, 0.16, 0, mCrust); const charTop = wedge(R + 0.002, 0.162, 0, mChar);
      const sauce = wedge(R - 0.2, 0.03, 0.095, mSauce);
      const cheese = wedge(R - 0.24, 0.05, 0.125, mCheese); const blister = wedge(R - 0.24, 0.052, 0.126, mBlister);
      const rimW = new T.Group(); rimW.rotation.y = s0 - Math.PI / 2;
      const rim = new T.Mesh(new T.TorusGeometry(R - 0.1, 0.14, 12, 10, len), mCrust); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.09; rim.scale.z = 0.8; rimW.add(rim);
      const rimC = new T.Mesh(rim.geometry, mChar); rimC.rotation.copy(rim.rotation); rimC.position.copy(rim.position); rimC.scale.set(1.01, 1.01, 0.81); rimW.add(rimC); g.add(rimW);
      // مكونات بتنزل من فوق
      for (let k = 0; k < 2; k++) { const pp = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.05, 28), mPep); addDrop(g, pp, at(0.7 + k * 0.62 + rnd() * 0.12, s0 + 0.2 + rnd() * (len - 0.4), 0.17), 0.22 + rnd() * 0.06, 0.32 + rnd() * 0.04); }
      const ol = new T.Mesh(new T.TorusGeometry(0.075, 0.035, 8, 18), mOl); ol.rotation.x = Math.PI / 2; addDrop(g, ol, at(1.2 + rnd() * 0.4, s0 + 0.12 + rnd() * (len - 0.24), 0.18), 0.28 + rnd() * 0.05, 0.38);
      const mu = new T.Mesh(new T.SphereGeometry(0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mMush); mu.scale.set(1, 0.35, 0.8); mu.rotation.y = rnd() * 3; addDrop(g, mu, at(0.4 + rnd() * 0.5, mid + (rnd() - 0.5) * 0.3, 0.16), 0.3 + rnd() * 0.05, 0.4);
      const pr = new T.Mesh(new T.TorusGeometry(0.14, 0.022, 6, 20, Math.PI * 1.4), mPepper); pr.rotation.x = Math.PI / 2; pr.rotation.z = rnd() * 6; addDrop(g, pr, at(1.5 + rnd() * 0.15, mid, 0.17), 0.32 + rnd() * 0.05, 0.42);
      const bs = new T.Mesh(new T.SphereGeometry(0.16, 14, 8), mBasil); bs.scale.set(1, 0.08, 0.55); bs.rotation.y = rnd() * 3; addDrop(g, bs, at(0.95 + rnd() * 0.3, s0 + 0.15 + rnd() * (len - 0.3), 0.2), 0.36 + rnd() * 0.03, 0.44, 0.5);
      g.userData = { dir: new T.Vector3(Math.sin(mid), 0, Math.cos(mid)), mid, ph: rnd(), sauce, cheese, blister, charTop };
      pz.add(g); slices.push(g);
    }
    // جبنة مبشورة بتنزل (InstancedMesh واحد خفيف)
    const NS = 260, shreds = new T.InstancedMesh(new T.BoxGeometry(0.03, 0.03, 0.22), phys({ color: C("#fff3cf"), roughness: 0.5 }), NS);
    const shredD = []; const M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), V = new T.Vector3(), S1 = new T.Vector3(1, 1, 1);
    for (let i = 0; i < NS; i++) { const r = Math.sqrt(rnd()) * (R - 0.3), th = rnd() * Math.PI * 2; shredD.push({ to: at(r, th, 0.16), a: 0.1 + rnd() * 0.1, rot: [rnd() * 3, rnd() * 3, rnd() * 3], h: 2.4 + rnd() * 1.6 }); }
    pz.add(shreds);

    /* فرن الحطب: قبة طوب مفتوحة من قدام، أرضية حجر، ونار بالخلف */
    const oven = new T.Group(); oven.position.set(0, -0.26, -1.9); tray.add(oven);
    const mBrick = phys({ map: tBrick, roughness: 0.9, side: T.DoubleSide, transparent: true, opacity: 0 });
    const dome = new T.Mesh(new T.SphereGeometry(2.8, 56, 22, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI / 2), mBrick); dome.scale.y = 0.6; oven.add(dome);
    const arch = new T.Mesh(new T.TorusGeometry(1.8, 0.2, 12, 40, Math.PI), mBrick); arch.position.set(0, 0, 2.15); arch.scale.y = 0.75; oven.add(arch);
    const mStone = new T.MeshStandardMaterial({ map: tStone, roughness: 0.95, transparent: true, opacity: 0 });
    const floor = new T.Mesh(new T.CircleGeometry(2.8, 56), mStone); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; oven.add(floor);
    const flames = [], mFl = new T.SpriteMaterial({ map: tFlame, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 });
    for (let i = 0; i < 9; i++) { const f = new T.Sprite(mFl); f.position.set((i - 4) * 0.34 + (rnd() - 0.5) * 0.2, 0.6, -2.1 + Math.abs(i - 4) * 0.12); f.userData = { s: 0.8 + rnd() * 0.8, ph: rnd() * 6 }; oven.add(f); flames.push(f); }
    const logs = new T.Group(); for (let i = 0; i < 3; i++) { const l = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 1.8, 10), phys({ color: C("#3a2414"), roughness: 0.9, emissive: C("#ff5a10"), emissiveIntensity: 0, transparent: true, opacity: 0 })); l.rotation.z = Math.PI / 2; l.rotation.y = (i - 1) * 0.5; l.position.set((i - 1) * 0.3, 0.18 + (i === 1) * 0.22, -2.2); logs.add(l); } oven.add(logs);
    const fireL = new T.PointLight(C("#ff8a2a"), 0, 9, 1.4); fireL.position.set(0, 1.0, -1.4); oven.add(fireL);
    const embers = steam(oven, 70, "#ffb45a", 3, 2.6); embers.material.size = 0.06; embers.material.opacity = 0; embers.material.blending = T.AdditiveBlending; embers.position.z = -1.2;
    oven.visible = false;

    /* عجلة التقطيع وخطوط القص */
    const cutter = new T.Group(); tray.add(cutter);
    const wheel = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.04, 48), phys({ color: C("#d8dde3"), metalness: 1, roughness: 0.18 })); wheel.rotation.z = Math.PI / 2; wheel.position.y = 0.42; cutter.add(wheel);
    const hub = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.1, 20), phys({ color: C("#222"), roughness: 0.4 })); hub.rotation.z = Math.PI / 2; hub.position.y = 0.42; cutter.add(hub);
    const hnd = new T.Mesh(new T.CapsuleGeometry(0.09, 1.1, 6, 12), phys({ color: C(colors.accent), roughness: 0.35, clearcoat: 0.8 })); hnd.position.set(0, 0.95, 0.55); hnd.rotation.x = 0.9; cutter.add(hnd);
    cutter.visible = false;
    const cuts = [], mCut = new T.MeshBasicMaterial({ color: C("#5a2d0e"), transparent: true, opacity: 0.85 });
    for (let j = 0; j < 4; j++) { const c = new T.Mesh(new T.BoxGeometry(0.035, 0.02, R * 2), mCut); c.rotation.y = j * A; c.position.y = 0.155; c.scale.z = 0.001; pz.add(c); cuts.push(c); }

    // خيوط الجبنة للشريحة اللي بتطلع
    const strings = [], mStr = phys({ color: C("#f8d97c"), roughness: 0.4 });
    for (let k = 0; k < 5; k++) { const m = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 1, 6), mStr); m.visible = false; pz.add(m); strings.push(m); }
    const vapor = steam(pz, 90, "#ffffff", 2.4, 2.6); vapor.material.opacity = 0;
    const va = new T.Vector3(), vb = new T.Vector3();
    const crustRaw = C("#f0d9ae"), crustBaked = C("#e0a861"), cheeseRaw = C("#fff7e0"), cheeseBaked = C("#f6c858");

    let spinA = 0;
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, o, 0.1); root.scale.multiplyScalar(0.74);
      const into = ease(seg(0.44, 0.52, p)) * (1 - ease(seg(0.66, 0.74, p))); // البيتزا جوّا الفرن
      const ovenIn = ease(seg(0.4, 0.48, p)) * (1 - ease(seg(0.7, 0.78, p)));
      const bake = ease(seg(0.52, 0.68, p));
      // دوران هادي بيوقف وقت التقطيع حتى تبيّن الخطوط
      if (p < 0.74) spinA += dt * 0.12;
      pz.rotation.y = spinA + Math.min(p, 0.74) * 1.2 + st.pointer.sx * 0.15;
      tray.rotation.x = 0.66 + st.pointer.sy * 0.08 - ovenIn * 0.12;
      pz.position.set(0, into * 0.06, -into * 1.9);

      // الصلصة بتنفرد، والجبنة بتدوب، والطبقات بتحمر
      const sauceK = ease(seg(0.02, 0.1, p)), cheeseK = ease(seg(0.16, 0.3, p));
      mCrust.color.copy(crustRaw).lerp(crustBaked, bake);
      mChar.opacity = bake * 0.95;
      mCheese.opacity = cheeseK; mCheese.color.copy(cheeseRaw).lerp(cheeseBaked, bake);
      mBlister.opacity = bake * 0.9;
      mPep.color.setRGB(1 - bake * 0.18, 1 - bake * 0.22, 1 - bake * 0.22);
      slices.forEach((g, i) => {
        const u = g.userData;
        u.sauce.scale.set(Math.max(0.01, sauceK), 1, Math.max(0.01, sauceK));
        u.cheese.scale.set(0.6 + 0.4 * cheeseK, Math.max(0.02, cheeseK), 0.6 + 0.4 * cheeseK); u.blister.scale.copy(u.cheese.scale);
        // بعد القص: الشرائح بتنفرط، وشريحة وحدة بتطلع
        const hero = i === 0, sep = ease(seg(0.9, 1, p)), lift = ease(seg(0.92, 1, p));
        g.position.copy(u.dir).multiplyScalar(hero ? sep * 0.3 + lift * 1.5 : sep * (0.16 + 0.1 * u.ph));
        g.position.y = hero ? lift * 1.2 : 0;
        g.rotation.x = hero ? -lift * 0.45 * u.dir.z : 0; g.rotation.z = hero ? lift * 0.45 * u.dir.x : 0;
      });
      // المكونات بتوقع وبتنط شوي
      drops.forEach((d) => {
        const k = seg(d.a, d.b, p), fall = 1 - k, bounce = k > 0.85 ? Math.sin((k - 0.85) / 0.15 * Math.PI) * 0.08 : 0;
        d.mesh.visible = k > 0.001;
        d.mesh.position.set(d.to.x, d.to.y + fall * fall * d.h + bounce, d.to.z);
        d.mesh.rotation.set(d.rot0.x + fall * d.spin, d.rot0.y + fall * d.spin * 0.7, d.rot0.z);
      });
      // الجبنة المبشورة: بتنزل وبتختفي جوّا طبقة الجبنة
      const shredVis = p > 0.09 && p < 0.33; shreds.visible = shredVis;
      if (shredVis) for (let i = 0; i < NS; i++) {
        const d = shredD[i], k = seg(d.a, d.a + 0.08, p), fall = 1 - k, melt = ease(seg(0.2, 0.32, p));
        V.set(d.to.x, d.to.y + fall * fall * d.h, d.to.z); E.set(d.rot[0] + fall * 4, d.rot[1], d.rot[2] * (1 - k) + Math.PI / 2 * k * 0); Q.setFromEuler(E);
        const s = k > 0.001 ? 1 - melt * 0.9 : 0.0001; S1.set(s, s * (1 - melt), s); M4.compose(V, Q, S1); shreds.setMatrixAt(i, M4);
      }
      shreds.instanceMatrix.needsUpdate = true;

      // الفرن
      oven.visible = ovenIn > 0.001;
      if (oven.visible) {
        const fade = ovenIn; mBrick.opacity = fade; mStone.opacity = fade; mFl.opacity = fade * 0.95;
        oven.scale.setScalar(0.75 + 0.25 * fade); oven.position.y = -0.26 - (1 - fade) * 1.2;
        logs.children.forEach((l) => { l.material.opacity = fade; l.material.emissiveIntensity = 0.4 + 0.3 * Math.sin(t * 7 + l.position.x * 9); });
        fireL.intensity = fade * (20 + 5 * Math.sin(t * 13) + 3 * Math.sin(t * 29));
        flames.forEach((f) => { const u = f.userData, fl = 0.85 + 0.25 * Math.sin(t * 9 + u.ph) + 0.1 * Math.sin(t * 23 + u.ph); f.scale.set(u.s * 0.55 * fl, u.s * 1.1 * fl, 1); f.position.y = 0.55 + u.s * 0.45 * fl; });
        embers.material.opacity = fade * 0.8; embers.userData.tick(dt * 1.5);
      }
      // عجلة التقطيع: 4 خطوط من الحافة للحافة
      const cutK = seg(0.76, 0.9, p); cutter.visible = cutK > 0 && cutK < 1;
      cuts.forEach((c, j) => { const k = clamp(cutK * 4 - j); c.scale.z = Math.max(0.001, k); c.position.x = 0; c.position.z = 0; c.visible = k > 0; });
      if (cutter.visible) {
        const j = Math.min(3, Math.floor(cutK * 4)), k = clamp(cutK * 4 - j), ang = j * A + pz.rotation.y, d = (k - 0.5) * 2 * (R + 0.2);
        cutter.position.set(Math.sin(ang) * -d + pz.position.x, 0.13 + pz.position.y, Math.cos(ang) * -d + pz.position.z);
        cutter.rotation.y = ang; wheel.rotation.x = -k * 18; hub.rotation.x = wheel.rotation.x;
      }
      // خيوط الجبنة
      const hs = slices[0], showS = p > 0.92;
      strings.forEach((m, k) => {
        m.visible = showS; if (!showS) return;
        const th = hs.userData.mid + (k - 2) * 0.07, r0 = 0.3 + k * 0.1;
        va.set(Math.sin(th) * r0, 0.15, Math.cos(th) * r0).applyEuler(hs.rotation).add(hs.position);
        vb.set(Math.sin(th) * r0 * 0.4, 0.15, Math.cos(th) * r0 * 0.4);
        orient(m, vb, va); const th2 = 0.6 + 0.4 * Math.sin(t * 4 + k); m.scale.x = m.scale.z = th2;
      });
      vapor.material.opacity = 0.5 * ease(seg(0.66, 0.74, p)); vapor.userData.tick(dt);
      camera.position.x = st.pointer.sx * 0.35; camera.position.y = st.pointer.sy * 0.22; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- SHAWARMA ---------- */
  function shawarma(el, colors, o) {
    const st = stage(el, colors, { exposure: 1.05 }), { scene, camera } = st;
    lights(scene, colors, 0.9);
    const heatL = new T.PointLight(C("#ff7a2a"), 40, 10); heatL.position.set(0, 0, -1.2); scene.add(heatL);
    const root = new T.Group(); scene.add(root);
    const meatTex = canvasTex(512, 512, (x, w, h) => {
      for (let y = 0; y < h; y += 2) { const v = Math.sin(y * 0.09) * 0.5 + Math.sin(y * 0.31) * 0.3 + rnd() * 0.4; const l = 28 + v * 16; x.fillStyle = `hsl(${22 + v * 6}, ${55 + v * 10}%, ${l}%)`; x.fillRect(0, y, w, 2); }
      for (let i = 0; i < 900; i++) { x.fillStyle = rnd() > 0.5 ? "rgba(30,12,4,.55)" : "rgba(255,190,110,.25)"; x.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 18, 1 + rnd() * 3); }
    });
    meatTex.wrapS = meatTex.wrapT = T.RepeatWrapping; meatTex.repeat.set(3, 1);
    const prof = []; for (let i = 0; i <= 40; i++) { const y = -1.9 + (i / 40) * 3.8; prof.push(new T.Vector2(0.85 + (i / 40) * 0.5 + Math.sin(i * 1.7) * 0.03, y)); }
    const mMeat = phys({ map: meatTex, bumpMap: meatTex, bumpScale: 0.04, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.6 });
    const spit = new T.Group(); root.add(spit);
    const meat = new T.Mesh(new T.LatheGeometry(prof, 64), mMeat); spit.add(meat);
    const capT = new T.Mesh(new T.CylinderGeometry(1.36, 1.36, 0.06, 64), mMeat); capT.position.y = 1.9; spit.add(capT);
    const onion = new T.Mesh(new T.SphereGeometry(0.3, 24, 16), phys({ color: C("#c33a2c"), roughness: 0.3, clearcoat: 1 })); onion.position.y = 2.18; spit.add(onion);
    const rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 5.6, 16), phys({ color: 0xcccccc, metalness: 1, roughness: 0.2 })); root.add(rod);
    const panel = new T.Mesh(new T.BoxGeometry(2.8, 4.2, 0.12), phys({ color: C("#1b1715"), metalness: 0.6, roughness: 0.4,
      emissiveMap: canvasTex(256, 384, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) { const g = x.createRadialGradient(c * 42 + 23, r * 32 + 16, 1, c * 42 + 23, r * 32 + 16, 16); g.addColorStop(0, "#ffd08a"); g.addColorStop(0.5, "#ff5a14"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(c * 42, r * 32, 46, 32); } }),
      emissive: 0xffffff, emissiveIntensity: 1.4 }));
    panel.position.set(0, 0, -1.75); root.add(panel);
    // سكين
    const knife = new T.Group(); root.add(knife);
    const blade = new T.Mesh(new T.BoxGeometry(0.03, 0.42, 1.7), phys({ color: 0xf2f4f6, metalness: 0.65, roughness: 0.22, emissive: 0x3a3e44, clearcoat: 1 })); blade.position.z = -0.4; knife.add(blade);
    const handle = new T.Mesh(new T.BoxGeometry(0.1, 0.22, 0.8), phys({ color: C("#2a1c12"), roughness: 0.6 })); handle.position.z = 0.8; knife.add(handle);
    knife.rotation.y = -0.6;
    // الخبز والشرائح
    const bread = new T.Mesh(new T.CylinderGeometry(1.25, 1.25, 0.05, 48), phys({ color: C("#e7c792"), roughness: 0.9 })); bread.position.set(1.9, -2.45, 1.0); root.add(bread);
    const K = 7, cuts = [];
    for (let k = 0; k < K; k++) {
      const s = new T.Mesh(new T.CylinderGeometry(1.3, 1.24, 0.75, 10, 1, true, -0.38, 0.76), mMeat.clone()); s.material.side = T.DoubleSide;
      s.visible = false; root.add(s); cuts.push(s);
    }
    const sparks = steam(root, 70, "#ffb070", 2.2, 4.4); sparks.position.set(0, -2.2, -1.3);
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.82 }, o));
      spit.rotation.y += dt * (0.6 + p * 1.6);
      root.rotation.y = -0.35 + st.pointer.sx * 0.25 + p * 0.25;
      const prog = p * K, done = Math.floor(prog), local = prog - done;
      meat.scale.x = meat.scale.z = capT.scale.x = capT.scale.z = 1 - Math.min(done, K) * 0.022;
      // السكين بتنزل على وش السيخ
      const ky = lerp(1.5, -1.5, local);
      knife.position.set(0.95, ky, 1.2); knife.rotation.z = -0.15 + Math.sin(t * 14) * 0.03 * (p > 0.01 ? 1 : 0);
      cuts.forEach((s, k) => {
        const lp = clamp(prog - k);
        s.visible = p > 0.01 && lp > 0;
        if (!s.visible) return;
        const fall = ease(clamp((lp - 0.55) / 0.45));
        const yCut = lerp(1.5, -1.5, Math.min(lp, 0.55) / 0.55);
        s.position.set(lerp(0.12, 1.9, fall), lerp(yCut * 0.5, -2.3 + k * 0.06, fall), lerp(0.25, 1.0, fall));
        s.rotation.set(lerp(0, -1.45, fall), lerp(0, 0.8 + k * 0.4, fall), 0);
        s.scale.set(1, lerp(Math.min(1, lp / 0.55), 0.35, fall), 1);
      });
      sparks.userData.tick(dt);
      camera.position.x = st.pointer.sx * 0.4; camera.position.y = 0.4 + st.pointer.sy * 0.25; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- PRODUCTS (أدوات منزلية) ---------- */
  function products(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors);
    const root = new T.Group(); scene.add(root);
    const tray = new T.Mesh(new T.CylinderGeometry(2.4, 2.5, 0.16, 72), phys({ color: C(colors.surface), roughness: 0.25, clearcoat: 1 })); tray.position.y = -1; root.add(tray);
    const sh = shadowDisc(3.2); sh.position.y = -1.09; root.add(sh);
    const enamel = (c) => phys({ color: C(c), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    const metal = phys({ color: 0xdedede, metalness: 1, roughness: 0.25 });
    const items = [];
    const lathe = (pts, m) => new T.Mesh(new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), 64), m);
    // قدر
    const pot = new T.Group(); pot.add(lathe([[0, -0.5], [0.85, -0.5], [0.9, -0.42], [0.9, 0.42], [0.95, 0.46], [0.86, 0.46], [0.84, -0.4], [0, -0.42]], enamel(colors.accent)));
    const lid = lathe([[0, 0.72], [0.12, 0.7], [0.12, 0.62], [0.92, 0.46], [0.92, 0.43], [0, 0.6]], enamel(colors.accent)); pot.add(lid);
    [-1, 1].forEach((s) => { const h = new T.Mesh(new T.TorusGeometry(0.16, 0.045, 10, 24, Math.PI), metal); h.position.set(s * 0.98, 0.25, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; pot.add(h); });
    // كاسة
    const mug = new T.Group(); mug.add(lathe([[0, -0.4], [0.42, -0.4], [0.46, 0.4], [0.41, 0.4], [0.38, -0.33], [0, -0.33]], enamel(colors.accent2)));
    const mh = new T.Mesh(new T.TorusGeometry(0.2, 0.05, 12, 24), enamel(colors.accent2)); mh.position.set(0.55, 0, 0); mug.add(mh);
    // إبريق
    const kettle = new T.Group(); kettle.add(lathe([[0, -0.55], [0.6, -0.55], [0.72, -0.2], [0.66, 0.2], [0.35, 0.52], [0.1, 0.56], [0, 0.6]], enamel("#f4f1ea")));
    const sp = new T.Mesh(new T.CylinderGeometry(0.05, 0.11, 0.7, 16), enamel("#f4f1ea")); sp.position.set(-0.78, 0.1, 0); sp.rotation.z = 0.9; kettle.add(sp);
    const kh = new T.Mesh(new T.TorusGeometry(0.42, 0.05, 10, 32, Math.PI), metal); kh.position.y = 0.55; kettle.add(kh);
    // صحون
    const plates = new T.Group(); for (let i = 0; i < 4; i++) { const pl = lathe([[0, 0], [0.55, 0], [0.75, 0.08], [0.78, 0.1], [0.74, 0.1], [0.53, 0.03], [0, 0.03]], enamel(i % 2 ? colors.ink : "#ffffff")); pl.position.y = -0.3 + i * 0.1; plates.add(pl); }
    // لوح تقطيع
    const board = new T.Mesh(new T.BoxGeometry(1.5, 0.08, 0.9), phys({ color: C("#b07a45"), roughness: 0.7 }));
    [[pot, 0], [mug, 1.6], [kettle, 3.1], [plates, 4.4], [board, 5.5]].forEach(([g, ang], i) => { const w = new T.Group(); w.add(g); root.add(w); items.push({ w, g, ang, i }); });
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.9 }, o), p * 0.4);
      root.rotation.x = 0.25 + st.pointer.sy * 0.1;
      tray.rotation.y = t * 0.2;
      items.forEach(({ w, g, ang, i }) => {
        const a = ang + t * 0.2 + p * 1.5, r = lerp(1.35, 2.6 + (i % 2) * 0.4, ease(p));
        w.position.set(Math.cos(a) * r, -0.45 + ease(p) * (0.6 + Math.sin(t * 1.3 + i) * 0.25) + (i === 3 ? 0.1 : 0) + (i === 4 ? -0.42 : 0), Math.sin(a) * r * 0.85);
        g.rotation.y = -a + st.pointer.sx * 0.3;
        g.rotation.z = ease(p) * Math.sin(t + i) * 0.4;
        g.scale.setScalar(i === 0 ? 0.95 : 0.85);
      });
      lid.position.y = ease(p) * 0.5; lid.rotation.z = ease(p) * 0.3;
      camera.position.x = st.pointer.sx * 0.4; camera.position.y = 0.6; camera.lookAt(0, -0.2, 0);
    };
    return st;
  }

  /* ---------- WASHER (مصلح أجهزة) ---------- */
  function gearShape(teeth, r1, r2, hole) {
    const s = new T.Shape(), n = teeth * 2;
    for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = Math.floor(i / 2) % 2 ? r1 : r2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const h = new T.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); return s;
  }
  function washer(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors);
    const root = new T.Group(); scene.add(root);
    const body = new T.Mesh(new T.BoxGeometry(2.3, 2.8, 2.1, 1, 1, 1), phys({ color: 0xf5f5f3, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 })); root.add(body);
    const panelTex = canvasTex(512, 96, (x, w, h) => { x.fillStyle = "#1d1f24"; x.fillRect(0, 0, w, h); x.fillStyle = colors.accent; x.font = "bold 34px monospace"; x.fillText("00:42", 300, 60); for (let i = 0; i < 5; i++) { x.fillStyle = i === 2 ? colors.accent : "#555"; x.beginPath(); x.arc(40 + i * 40, 48, 9, 0, 7); x.fill(); } });
    const panel = new T.Mesh(new T.PlaneGeometry(2.0, 0.38), new T.MeshBasicMaterial({ map: panelTex })); panel.position.set(0, 1.12, 1.051); root.add(panel);
    const knob = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.1, 32), phys({ color: 0xcfd3d8, metalness: 1, roughness: 0.2 })); knob.rotation.x = Math.PI / 2; knob.position.set(-0.75, 1.12, 1.1); root.add(knob);
    const drum = new T.Mesh(new T.CylinderGeometry(0.72, 0.72, 0.9, 48, 1, true), phys({ color: 0x9ea4ab, metalness: 0.9, roughness: 0.35, side: T.DoubleSide })); drum.rotation.x = Math.PI / 2; drum.position.set(0, -0.15, 0.55); root.add(drum);
    const back = new T.Mesh(new T.CircleGeometry(0.72, 48), phys({ color: 0x5a5f66, metalness: 0.8, roughness: 0.4 })); back.position.set(0, -0.15, 0.1); root.add(back);
    const clothes = new T.Group(); clothes.position.set(0, -0.15, 0.55); root.add(clothes);
    const cc = [colors.accent, colors.accent2, "#ffffff", "#2b6cb0", "#e8b04a"];
    for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(0.2 + rnd() * 0.08, 16, 12), phys({ color: C(cc[i % cc.length]), roughness: 0.9, sheen: 1 })); m.scale.set(1.3, 0.7, 1); m.userData.a = rnd() * 6.28; m.userData.r = 0.25 + rnd() * 0.3; clothes.add(m); }
    const hinge = new T.Group(); hinge.position.set(-0.82, -0.15, 1.08); root.add(hinge);
    const door = new T.Group(); door.position.x = 0.82; hinge.add(door);
    const ring = new T.Mesh(new T.TorusGeometry(0.8, 0.11, 20, 64), phys({ color: 0xd8dbe0, metalness: 1, roughness: 0.15 })); door.add(ring);
    const glass = new T.Mesh(new T.CylinderGeometry(0.72, 0.72, 0.1, 48), phys({ color: 0xbfe3ff, transmission: 1, thickness: 0.4, roughness: 0.05, ior: 1.4, transparent: true, opacity: 0.95 })); glass.rotation.x = Math.PI / 2; door.add(glass);
    const gear = new T.Mesh(new T.ExtrudeGeometry(gearShape(12, 0.62, 0.75, 0.28), { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), phys({ color: C(colors.accent), metalness: 0.7, roughness: 0.25 }));
    gear.position.set(1.9, 1.5, 0.2); root.add(gear);
    const gear2 = gear.clone(); gear2.scale.setScalar(0.55); gear2.position.set(2.62, 0.82, 0.25); root.add(gear2);
    const wrench = new T.Group(); root.add(wrench);
    const wm = phys({ color: 0xc8ccd2, metalness: 1, roughness: 0.2 });
    const shaft = new T.Mesh(new T.BoxGeometry(0.18, 1.6, 0.08), wm); wrench.add(shaft);
    const head = new T.Mesh(new T.TorusGeometry(0.22, 0.08, 12, 24, Math.PI * 1.6), wm); head.position.y = 0.9; head.rotation.z = -Math.PI * 0.3; wrench.add(head);
    wrench.position.set(-1.9, 1.2, 0.4);
    const sh = shadowDisc(2.6); sh.position.y = -1.42; root.add(sh);
    let drumA = 0;
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.85 }, o));
      root.rotation.y = -0.45 + ease(p) * 0.7 + st.pointer.sx * 0.25;
      root.rotation.x = 0.08 + st.pointer.sy * 0.08;
      hinge.rotation.y = -ease(p * 1.2) * 1.75;
      drumA += dt * (1.2 + p * 6);
      clothes.children.forEach((m, i) => { const a = m.userData.a + drumA * (0.8 + (i % 3) * 0.1); m.position.set(Math.cos(a) * m.userData.r, Math.sin(a) * m.userData.r * 0.9 - 0.1, (i % 3 - 1) * 0.2); m.rotation.z = a; });
      gear.rotation.z = t * 0.6 + p * 4; gear2.rotation.z = -(t * 0.6 + p * 4) * (12 / 6.6);
      wrench.rotation.z = Math.sin(t * 1.2) * 0.3 + p * 1.2; wrench.position.y = 1.2 + Math.sin(t) * 0.1;
      camera.position.x = st.pointer.sx * 0.4; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- BARBER ---------- */
  function barber(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors);
    const root = new T.Group(); scene.add(root);
    const uni = { uT: { value: 0 }, uA: { value: C(colors.accent2 || "#2b4fb8") }, uB: { value: C(colors.accent) } };
    const pole = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 3.2, 48, 1, true), new T.ShaderMaterial({ uniforms: uni,
      vertexShader: "varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: "uniform float uT; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv; varying vec3 vN; void main(){ float s = fract(vUv.x*3. + vUv.y*3.2 - uT); vec3 c = s < .33 ? vec3(.97) : (s < .66 ? uB : uA); float l = .55 + .45*max(dot(vN, normalize(vec3(-.4,.5,.8))),0.); gl_FragColor = vec4(c*l + pow(max(dot(vN, normalize(vec3(-.3,.2,1.))),0.),30.)*.6, 1.);\n#include <colorspace_fragment>\n}" }));
    root.add(pole);
    const sleeve = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 3.25, 48, 1, true), phys({ color: 0xffffff, transmission: 1, thickness: 0.1, roughness: 0.02, transparent: true, opacity: 0.35 })); root.add(sleeve);
    const chrome = phys({ color: 0xdcdcdc, metalness: 1, roughness: 0.12 });
    [1.7, -1.7].forEach((y) => { const cap = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.22, 48), chrome); cap.position.y = y; root.add(cap); });
    const dome = new T.Mesh(new T.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), chrome); dome.position.y = 1.81; root.add(dome);
    // مقص
    const sc = new T.Group(); root.add(sc); sc.position.set(1.6, 0.4, 0.9);
    const bladeShape = new T.Shape(); bladeShape.moveTo(0, -0.06); bladeShape.lineTo(1.6, -0.02); bladeShape.lineTo(1.75, 0.02); bladeShape.lineTo(0, 0.09); bladeShape.lineTo(-0.25, 0.04); bladeShape.closePath();
    const bg = new T.ExtrudeGeometry(bladeShape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
    const mkBlade = (flip) => { const g = new T.Group(); const b = new T.Mesh(bg, chrome); b.scale.y = flip ? -1 : 1; g.add(b);
      const ringM = new T.Mesh(new T.TorusGeometry(0.22, 0.05, 12, 32), phys({ color: C(colors.accent), roughness: 0.3, clearcoat: 1 })); ringM.position.set(-0.55, flip ? -0.2 : 0.2, 0.02); g.add(ringM);
      const arm = new T.Mesh(new T.BoxGeometry(0.4, 0.06, 0.04), chrome); arm.position.set(-0.3, flip ? -0.1 : 0.1, 0.02); arm.rotation.z = flip ? 0.5 : -0.5; g.add(arm); return g; };
    const b1 = mkBlade(false), b2 = mkBlade(true); b2.position.z = 0.06; sc.add(b1, b2);
    const screw = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.14, 16), chrome); screw.rotation.x = Math.PI / 2; screw.position.z = 0.04; sc.add(screw);
    // مشط
    const comb = new T.Group(); root.add(comb); comb.position.set(-1.7, -0.6, 0.6);
    const cm = phys({ color: C(colors.ink), roughness: 0.3, clearcoat: 1 });
    const spine = new T.Mesh(new T.BoxGeometry(1.6, 0.16, 0.06), cm); comb.add(spine);
    for (let i = 0; i < 22; i++) { const tth = new T.Mesh(new T.BoxGeometry(0.03, 0.36, 0.05), cm); tth.position.set(-0.75 + i * 0.07, -0.25, 0); comb.add(tth); }
    // شعر بيتساقط
    const HN = 120, hair = new T.InstancedMesh(new T.CylinderGeometry(0.006, 0.006, 0.22, 4), new T.MeshStandardMaterial({ color: 0x2a1d16 }), HN);
    const hd = Array.from({ length: HN }, () => ({ x: 1.6 + (rnd() - 0.5) * 1.2, y: rnd() * 4 - 2, z: 0.9 + (rnd() - 0.5), s: 0.3 + rnd() * 0.6, r: rnd() * 6 }));
    root.add(hair);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.9 }, o));
      uni.uT.value += dt * (0.25 + p * 1.2);
      root.rotation.y = st.pointer.sx * 0.3 + p * 0.4; root.rotation.z = -0.08;
      const snip = 0.05 + (0.5 + 0.5 * Math.sin(t * (3 + p * 8))) * 0.38;
      b1.rotation.z = snip; b2.rotation.z = -snip;
      sc.position.set(lerp(1.6, 0.9, ease(p)), 0.4 + Math.sin(t) * 0.12, lerp(0.9, 1.3, ease(p))); sc.rotation.set(0.2, -0.5 + st.pointer.sx * 0.2, -0.4 + p * 0.3);
      comb.rotation.z = 0.3 + Math.sin(t * 0.8) * 0.15; comb.position.y = -0.6 + Math.sin(t * 0.9) * 0.1;
      hair.visible = p > 0.02;
      hd.forEach((h, i) => { h.y -= dt * h.s * (0.4 + p * 2); if (h.y < -2.2) h.y = 1.6; v.set(lerp(1.6, 0.9, ease(p)) + (h.x - 1.6), h.y, h.z); e.set(h.r + t * h.s, h.r, h.r * 2); q.setFromEuler(e); m4.compose(v, q, one); hair.setMatrixAt(i, m4); });
      hair.instanceMatrix.needsUpdate = true;
      camera.position.x = st.pointer.sx * 0.4; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- GROCERY ---------- */
  function grocery(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors);
    const root = new T.Group(); scene.add(root);
    const wood = phys({ color: C("#a8743f"), roughness: 0.8 });
    const crate = new T.Group(); root.add(crate); crate.position.y = -1;
    for (let i = 0; i < 3; i++) { [[0, 1.2], [0, -1.2]].forEach(([x, z]) => { const s = new T.Mesh(new T.BoxGeometry(3, 0.24, 0.08), wood); s.position.set(x, 0.15 + i * 0.32, z); crate.add(s); }); [[1.5], [-1.5]].forEach(([x]) => { const s = new T.Mesh(new T.BoxGeometry(0.08, 0.24, 2.4), wood); s.position.set(x, 0.15 + i * 0.32, 0); crate.add(s); }); }
    const floor = new T.Mesh(new T.BoxGeometry(3, 0.06, 2.4), wood); crate.add(floor);
    const sh = shadowDisc(2.6); sh.position.y = -1.05; root.add(sh);
    const bump = canvasTex(128, 128, (x, w, h) => { for (let i = 0; i < 3000; i++) { const v = 120 + rnd() * 135; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } });
    const kinds = [
      { c: "#c8242c", s: [1, 0.92, 1], r: 0.34, stem: true },  // تفاح
      { c: "#f08a1c", s: [1, 1, 1], r: 0.36, bump: true },     // برتقال
      { c: "#f2d23a", s: [1.3, 0.92, 0.92], r: 0.3 },          // ليمون
      { c: "#7fbf3a", s: [1, 0.92, 1], r: 0.33, stem: true },  // تفاح أخضر
      { c: "#e2412d", s: [1, 0.85, 1], r: 0.3, leaf: true },   // بندورة
    ];
    const fruits = [], stemM = phys({ color: C("#5a3b1c") }), leafM = phys({ color: C("#3e8a2e"), roughness: 0.5 });
    for (let i = 0; i < 20; i++) {
      const k = kinds[i % kinds.length], g = new T.Group();
      const m = new T.Mesh(new T.SphereGeometry(k.r, 32, 24), phys({ color: C(k.c), roughness: k.bump ? 0.75 : 0.28, clearcoat: k.bump ? 0 : 0.8, bumpMap: k.bump ? bump : null, bumpScale: 0.02 }));
      m.scale.set(...k.s); g.add(m);
      if (k.stem) { const s = new T.Mesh(new T.CylinderGeometry(0.02, 0.025, 0.16, 6), stemM); s.position.y = k.r * 0.95; s.rotation.z = 0.2; g.add(s); }
      if (k.leaf) { const l = new T.Mesh(new T.SphereGeometry(0.12, 10, 6), leafM); l.scale.set(1.4, 0.15, 0.5); l.position.y = k.r * 0.85; g.add(l); }
      const col = i % 5, row = Math.floor(i / 5) % 2, lay = Math.floor(i / 10);
      const pile = new T.Vector3(-1.1 + col * 0.55 + (lay ? 0.27 : 0), -0.62 + lay * 0.5, -0.5 + row * 0.9 + (lay ? 0.2 : 0));
      const ang = (i / 20) * Math.PI * 2;
      g.userData = { pile, orbit: new T.Vector3(Math.cos(ang) * (2.2 + (i % 3) * 0.5), 0.4 + Math.sin(i * 1.3) * 1.1, Math.sin(ang) * 1.4), delay: i * 0.09, spin: rnd() * 6 };
      root.add(g); fruits.push(g);
    }
    const bounce = (x) => { x = clamp(x); if (x < 0.55) return 1 - (x / 0.55) ** 2; const y = (x - 0.775) / 0.225; return (1 - y * y) * 0.18; };
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.92 }, o));
      root.rotation.y = -0.4 + st.pointer.sx * 0.3 + p * 0.6; root.rotation.x = 0.35 + st.pointer.sy * 0.08;
      fruits.forEach((g, i) => {
        const d = g.userData, drop = bounce((t - 0.3 - d.delay) / 1.1), k = ease(p * 1.3 - (i % 5) * 0.04);
        const yPile = d.pile.y + drop * 4.5;
        g.position.set(lerp(d.pile.x, d.orbit.x, k), lerp(yPile, d.orbit.y + Math.sin(t * 1.4 + i) * 0.15, k), lerp(d.pile.z, d.orbit.z, k));
        g.rotation.set(k * (t + d.spin), d.spin + k * t * 0.7, 0);
      });
      camera.position.x = st.pointer.sx * 0.4; camera.position.y = 0.3; camera.lookAt(0, -0.2, 0);
    };
    return st;
  }

  /* ---------- DROP (مركز عناية بالبشرة) ---------- */
  function drop(el, colors, o) {
    const st = stage(el, colors, { exposure: 1.1 }), { scene, camera } = st;
    lights(scene, colors, 1.1);
    const root = new T.Group(); scene.add(root);
    // زجاج شفاف بدون transmission: أخف عالموبايل ونتيجته ثابتة على كل الكروت
    const water = () => phys({ color: C(colors.accent2).lerp(new T.Color(0xffffff), 0.35), transparent: true, opacity: 0.62, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.6, iridescenceIOR: 1.3, envMapIntensity: 1.3, depthWrite: false });
    const g = new T.SphereGeometry(1.2, 96, 64), pos = g.attributes.position, base = Float32Array.from(pos.array);
    const main = new T.Mesh(g, water()); root.add(main);
    const halo = new T.Mesh(new T.TorusGeometry(1.75, 0.05, 16, 160), new T.MeshBasicMaterial({ color: C(colors.accent) })); halo.position.z = -1.2; root.add(halo);
    const back = new T.Mesh(new T.SphereGeometry(0.9, 32, 24), phys({ color: C(colors.accent), roughness: 0.3, emissive: C(colors.accent), emissiveIntensity: 0.25 })); back.position.set(0.6, -0.2, -2.4); root.add(back);
    const minis = [];
    for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.SphereGeometry(0.32 + rnd() * 0.15, 48, 32), water()); const a = (i / 7) * Math.PI * 2; m.userData.dir = new T.Vector3(Math.cos(a), Math.sin(a) * 0.8, (rnd() - 0.5) * 0.6); m.visible = false; root.add(m); minis.push(m); }
    const rings = []; for (let i = 0; i < 3; i++) { const r = new T.Mesh(new T.TorusGeometry(1, 0.012, 8, 120), new T.MeshBasicMaterial({ color: C(colors.accent), transparent: true })); r.rotation.x = Math.PI / 2; r.position.y = -1.5; root.add(r); rings.push(r); }
    const bubbles = steam(root, 60, "#ffffff", 4, 5); bubbles.position.y = -2.5;
    const v = new T.Vector3();
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, o);
      // شكل القطرة مع تمويج خفيف
      for (let i = 0; i < pos.count; i++) {
        v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
        const yN = v.y / 1.2, taper = yN > 0 ? 1 - Math.pow(yN, 1.6) * 0.62 : 1;
        const w = 1 + Math.sin(v.y * 3 + t * 2) * 0.025 + Math.sin(v.x * 4 - t * 1.6) * 0.02;
        pos.setXYZ(i, v.x * taper * w, v.y * (yN > 0 ? 1.28 : 1) , v.z * taper * w);
      }
      pos.needsUpdate = true; g.computeVertexNormals();
      const k = ease(p * 1.2);
      main.scale.setScalar(lerp(1, 0.6, k)); main.rotation.y = t * 0.2; main.position.y = Math.sin(t * 1.2) * 0.08;
      minis.forEach((m, i) => { m.visible = k > 0.01; m.position.copy(m.userData.dir).multiplyScalar(k * (1.9 + (i % 2) * 0.5)); m.position.y += Math.sin(t * 1.5 + i) * 0.1; m.scale.setScalar(Math.max(0.01, k)); });
      halo.rotation.z = t * 0.1; halo.scale.setScalar(1 + k * 0.4);
      rings.forEach((r, i) => { const f = (t * 0.35 + i / 3) % 1; r.scale.setScalar(0.6 + f * 2.2); r.material.opacity = (1 - f) * 0.6; });
      bubbles.userData.tick(dt);
      camera.position.x = st.pointer.sx * 0.5; camera.position.y = st.pointer.sy * 0.3; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- BOTTLE (منتجات عناية) ---------- */
  function bottle(el, colors, o) {
    const st = stage(el, colors, { exposure: 1.1 }), { scene, camera } = st;
    lights(scene, colors, 1.1);
    const root = new T.Group(); scene.add(root);
    const lathe = (pts, m, seg = 64) => new T.Mesh(new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg), m);
    const glass = phys({ color: 0xffffff, transmission: 1, thickness: 0.5, roughness: 0.04, ior: 1.5, clearcoat: 1, attenuationColor: C(colors.accent2), attenuationDistance: 3 });
    const gold = phys({ color: C("#d6b06a"), metalness: 1, roughness: 0.22 });
    const serum = new T.Group(); root.add(serum); serum.position.x = -0.45;
    serum.add(lathe([[0, -1.3], [0.62, -1.3], [0.68, -1.2], [0.68, 0.55], [0.6, 0.8], [0.3, 0.95], [0.28, 1.15], [0, 1.15]], glass));
    const liquid = lathe([[0, -1.22], [0.6, -1.22], [0.6, 0.35], [0, 0.35]], phys({ color: C(colors.accent), roughness: 0.15, transmission: 0.6, thickness: 1, clearcoat: 1 })); serum.add(liquid);
    const label = new T.Mesh(new T.CylinderGeometry(0.69, 0.69, 0.7, 64, 1, true, -1, 2), phys({ color: C(colors.surface), roughness: 0.6, side: T.DoubleSide })); label.position.y = -0.45; serum.add(label);
    const cap = new T.Group(); serum.add(cap); cap.position.y = 1.15;
    const collar = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.35, 48), gold); collar.position.y = 0.17; cap.add(collar);
    const bulb = lathe([[0, 0.34], [0.22, 0.38], [0.25, 0.6], [0.2, 0.85], [0, 0.92]], phys({ color: C(colors.ink), roughness: 0.4, clearcoat: 0.6 })); cap.add(bulb);
    const pipette = new T.Mesh(new T.CylinderGeometry(0.05, 0.03, 1.6, 16), glass); pipette.position.y = -0.75; cap.add(pipette);
    const jar = new T.Group(); root.add(jar); jar.position.set(1.15, -0.85, 0.4);
    jar.add(lathe([[0, -0.45], [0.7, -0.45], [0.75, -0.38], [0.75, 0.25], [0.68, 0.3], [0, 0.3]], phys({ color: 0xffffff, transmission: 0.7, thickness: 0.8, roughness: 0.35, ior: 1.45 })));
    jar.add(lathe([[0, -0.4], [0.66, -0.4], [0.66, 0.2], [0, 0.2]], phys({ color: C("#fff4ec"), roughness: 0.5 })));
    const jlid = new T.Mesh(new T.CylinderGeometry(0.77, 0.77, 0.26, 64), gold); jar.add(jlid); jlid.position.y = 0.43;
    const drops = []; for (let i = 0; i < 6; i++) { const d = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), phys({ color: C(colors.accent), transmission: 0.5, roughness: 0.1, clearcoat: 1 })); d.scale.y = 1.3; d.visible = false; root.add(d); drops.push(d); }
    const leafM = phys({ color: C("#5e9a52"), roughness: 0.5, side: T.DoubleSide });
    const leaves = []; for (let i = 0; i < 6; i++) { const l = new T.Mesh(new T.SphereGeometry(0.4, 20, 10), leafM); l.scale.set(0.35, 0.05, 1); l.userData = { a: rnd() * 6.28, r: 2 + rnd() * 0.8, y: (rnd() - 0.5) * 2.6 }; root.add(l); leaves.push(l); }
    const sh = shadowDisc(2.4); sh.position.y = -1.32; root.add(sh);
    const tip = new T.Vector3();
    st.update = (dt, t) => {
      const p = st.sp, k = ease(p * 1.25);
      place(st, root, Object.assign({ scale: 0.95 }, o));
      root.rotation.y = -0.3 + st.pointer.sx * 0.35 + Math.sin(t * 0.3) * 0.1;
      serum.rotation.y = t * 0.25;
      cap.position.y = 1.15 + k * 1.3; cap.rotation.z = k * 0.35; cap.position.x = k * 0.35;
      jlid.position.y = 0.43 + k * 0.9; jlid.rotation.y = k * 3; jlid.rotation.x = k * 0.5;
      tip.set(0, -1.55, 0); cap.localToWorld(tip); root.worldToLocal(tip);
      drops.forEach((d, i) => { d.visible = k > 0.3; const f = (t * 0.6 + i / drops.length) % 1; d.position.set(tip.x, tip.y - f * 1.4, tip.z); d.scale.setScalar(Math.min(1, f * 4)); });
      leaves.forEach((l, i) => { const u = l.userData, a = u.a + t * 0.15; l.position.set(Math.cos(a) * u.r, u.y + Math.sin(t + i) * 0.2, Math.sin(a) * u.r - 0.5); l.rotation.set(t * 0.3 + i, a, 0.6); });
      camera.position.x = st.pointer.sx * 0.4; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- CLOTH (ألبسة قطنية) ---------- */
  function cloth(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors, 1.05);
    const root = new T.Group(); scene.add(root);
    const knit = (c) => canvasTex(256, 256, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 4) { x.fillStyle = i % 8 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"; x.fillRect(i, 0, 2, h); } for (let i = 0; i < 1500; i++) { x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(rnd() * w, rnd() * h, 1, 3); } });
    const make = (c, w, h) => { const geo = new T.PlaneGeometry(w, h, 36, 44); const tx = knit(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(3, 3);
      const m = new T.Mesh(geo, phys({ map: tx, roughness: 0.95, sheen: 1, sheenColor: C("#ffffff"), sheenRoughness: 0.5, side: T.DoubleSide }));
      m.userData.base = Float32Array.from(geo.attributes.position.array); m.userData.h = h; return m; };
    const c1 = make(colors.accent, 2.6, 3.2), c2 = make("#f7f3ec", 2.4, 3.0);
    const h1 = new T.Group(), h2 = new T.Group(); h1.add(c1); h2.add(c2); root.add(h1, h2);
    c1.position.y = -1.6; c2.position.y = -1.5; h1.position.set(-0.7, 1.4, 0.3); h2.position.set(0.8, 1.3, -0.6);
    const hangM = phys({ color: C("#c79a5e"), roughness: 0.5 });
    [h1, h2].forEach((h, i) => { const bar = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, i ? 2.5 : 2.7, 16), hangM); bar.rotation.z = Math.PI / 2; h.add(bar); const hook = new T.Mesh(new T.TorusGeometry(0.16, 0.025, 8, 24, Math.PI * 1.4), phys({ color: 0xcccccc, metalness: 1, roughness: 0.2 })); hook.position.y = 0.2; h.add(hook); });
    const bolls = [];
    for (let i = 0; i < 9; i++) { const g = new T.Group(); for (let j = 0; j < 5; j++) { const s = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), phys({ color: 0xffffff, roughness: 1, sheen: 1 })); const a = (j / 5) * 6.28; s.position.set(Math.cos(a) * 0.1, 0.04, Math.sin(a) * 0.1); g.add(s); } const b = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), phys({ color: C("#6b4a2b") })); b.position.y = -0.08; b.scale.y = 0.6; g.add(b); g.userData = { x: (rnd() - 0.5) * 5, y: (rnd() - 0.5) * 4, z: -1 + rnd() * 2, s: 0.2 + rnd() * 0.3 }; root.add(g); bolls.push(g); }
    const wave = (m, t, p, ph) => { const pa = m.geometry.attributes.position, b = m.userData.base, H = m.userData.h;
      for (let i = 0; i < pa.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], hang = (H / 2 - y) / H; const z = (Math.sin(x * 1.6 + t * 1.4 + ph) * 0.16 + Math.sin(y * 1.3 - t * 1.1 + ph) * 0.12) * hang * (1 + p) + Math.sin(x * 0.9) * p * 0.6 * hang;
        pa.setXYZ(i, x * (1 - p * 0.12 * hang), y, z); }
      pa.needsUpdate = true; m.geometry.computeVertexNormals(); };
    st.update = (dt, t) => {
      const p = st.sp;
      place(st, root, Object.assign({ scale: 0.95 }, o));
      wave(c1, t, p, 0); wave(c2, t, p, 2);
      h1.rotation.y = -0.3 + Math.sin(t * 0.5) * 0.12 + st.pointer.sx * 0.3 + p * 0.5; h2.rotation.y = 0.35 + Math.sin(t * 0.45 + 1) * 0.12 + st.pointer.sx * 0.3 - p * 0.4;
      h1.position.x = -0.7 - p * 0.5; h2.position.x = 0.8 + p * 0.5;
      bolls.forEach((g, i) => { const u = g.userData; u.y += dt * u.s * (0.5 + p * 2); if (u.y > 2.6) u.y = -2.6; g.position.set(u.x + Math.sin(t * 0.6 + i) * 0.2, u.y, u.z); g.rotation.set(t * 0.4 + i, t * 0.3, 0); });
      camera.position.x = st.pointer.sx * 0.4; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- CARPET ---------- */
  function carpetTex(colors) {
    return canvasTex(1024, 600, (x, w, h) => {
      const red = colors.accent, navy = colors.accent2, cream = "#efe2c4", gold = "#c99a4a";
      x.fillStyle = red; x.fillRect(0, 0, w, h);
      // حواف
      const band = (inset, wdt, col) => { x.strokeStyle = col; x.lineWidth = wdt; x.strokeRect(inset, inset, w - inset * 2, h - inset * 2); };
      band(18, 22, navy); band(44, 6, gold); band(70, 30, cream); band(98, 6, gold);
      for (let i = 0; i < 60; i++) { const px = 80 + (i % 30) * ((w - 160) / 29), py = i < 30 ? 70 : h - 70; x.fillStyle = navy; x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); x.restore(); }
      for (let i = 0; i < 16; i++) { const py = 110 + i * ((h - 220) / 15); [70, w - 70].forEach((px) => { x.fillStyle = navy; x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); x.restore(); }); }
      // الحقل: زخارف صغيرة
      for (let r = 0; r < 7; r++) for (let c = 0; c < 14; c++) { const px = 150 + c * 54, py = 140 + r * 54; x.fillStyle = (r + c) % 2 ? gold : cream; x.beginPath(); x.moveTo(px, py - 10); x.lineTo(px + 8, py); x.lineTo(px, py + 10); x.lineTo(px - 8, py); x.fill(); }
      // الميدالية بالنص
      const cx = w / 2, cy = h / 2;
      [[200, navy], [170, cream], [150, red], [120, gold], [95, navy], [60, cream], [30, red]].forEach(([r, col], i) => { x.fillStyle = col; x.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = r * (k % 2 ? 0.78 : 1) * (i % 2 ? 1 : 1); x.lineTo(cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr * 0.95); } x.closePath(); x.fill(); });
      [[cx - 330, cy], [cx + 330, cy]].forEach(([px, py]) => { x.fillStyle = navy; x.beginPath(); x.ellipse(px, py, 60, 90, 0, 0, 7); x.fill(); x.fillStyle = gold; x.beginPath(); x.ellipse(px, py, 30, 50, 0, 0, 7); x.fill(); });
      // شراشيب
      x.fillStyle = cream; for (let i = 0; i < h; i += 6) { x.fillRect(0, i, 12, 3); x.fillRect(w - 12, i, 12, 3); }
      // ملمس
      for (let i = 0; i < 9000; i++) { x.fillStyle = rnd() > 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.05)"; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
    });
  }
  function carpet(el, colors, o) {
    const st = stage(el, colors), { scene, camera } = st;
    lights(scene, colors, 1.05);
    const root = new T.Group(); scene.add(root);
    const W = 4.6, H = 2.7, geo = new T.PlaneGeometry(W, H, 160, 24), pa = geo.attributes.position, base = Float32Array.from(pa.array);
    const tex = carpetTex(colors);
    const rug = new T.Mesh(geo, phys({ map: tex, roughness: 0.95, sheen: 0.6, sheenColor: C("#ffffff"), side: T.DoubleSide }));
    const holder = new T.Group(); holder.add(rug); root.add(holder);
    const sh = shadowDisc(3); sh.scale.set(1.3, 0.7, 1); sh.position.y = -0.95; root.add(sh);
    const rollUp = (q, t) => {
      const xq = -W / 2 + q * W;
      for (let i = 0; i < pa.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1];
        let X = x, Z = Math.sin(x * 1.8 + t * 1.2) * 0.04 * (1 - q * 0.5);
        if (x > xq) { const s = x - xq, r = 0.11 + 0.018 * (s / 0.7); const a = s / r; X = xq + Math.sin(a) * r; Z = r - Math.cos(a) * r + Z * 0.2; }
        pa.setXYZ(i, X, y, Z);
      }
      pa.needsUpdate = true; geo.computeVertexNormals();
    };
    st.update = (dt, t) => {
      const p = st.sp, intro = ease(Math.min(1, t / 1.8));
      const q = clamp(0.12 + intro * 0.43 + ease(p) * 0.45, 0, 0.999);
      rollUp(q, t);
      place(st, root, Object.assign({ scale: 0.95 }, o), -0.2);
      holder.rotation.x = lerp(-1.05, -0.55, ease(p)); holder.rotation.z = lerp(0.18, 0.05, ease(p)) + st.pointer.sx * 0.06;
      holder.position.x = lerp(0.6, 0, intro * 0.5 + ease(p) * 0.5);
      holder.position.y = Math.sin(t * 0.9) * 0.06;
      root.rotation.y = st.pointer.sx * 0.2;
      camera.position.y = 0.5 + st.pointer.sy * 0.2; camera.lookAt(0, -0.2, 0);
    };
    return st;
  }

  /* ---------- LAPTOP ---------- */
  function laptop(el, colors, o) {
    const st = stage(el, colors, { exposure: 1.05 }), { scene, camera } = st;
    lights(scene, colors);
    const root = new T.Group(); scene.add(root);
    const alu = phys({ color: C("#c9ccd3"), metalness: 0.85, roughness: 0.32, clearcoat: 0.3 });
    const W = 3.2, D = 2.15;
    const base = new T.Mesh(new T.BoxGeometry(W, 0.12, D), alu); root.add(base);
    const keys = canvasTex(1024, 640, (x, w, h) => { x.fillStyle = "#b9bcc4"; x.fillRect(0, 0, w, h); x.fillStyle = "#16171b"; for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) x.fillRect(70 + c * 63, 40 + r * 52, 56, 44); x.fillRect(250, 40 + 6 * 52, 500, 44); x.fillStyle = "#c4c7cf"; x.fillRect(340, 420, 340, 190); x.strokeStyle = "#a8abb3"; x.strokeRect(340, 420, 340, 190); });
    const kb = new T.Mesh(new T.PlaneGeometry(W * 0.96, D * 0.94), phys({ map: keys, roughness: 0.5, metalness: 0.3 })); kb.rotation.x = -Math.PI / 2; kb.position.y = 0.061; root.add(kb);
    const screenTex = canvasTex(1024, 640, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, colors.bg); g.addColorStop(1, colors.surface); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const rg = x.createRadialGradient(w * 0.25, h * 0.45, 10, w * 0.25, h * 0.45, 230); rg.addColorStop(0, "#ffffff"); rg.addColorStop(0.25, colors.accent); rg.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = rg; x.fillRect(0, 0, w, h);
      x.fillStyle = colors.surface; x.fillRect(30, 26, w - 60, 54); x.fillStyle = colors.accent; x.fillRect(w - 90, 38, 30, 30); x.fillRect(50, 40, 120, 26);
      x.fillStyle = colors.ink; x.textAlign = "right"; x.font = "700 64px sans-serif"; x.fillText("RTX · 32GB", w - 60, 220); x.font = "400 30px sans-serif"; x.fillStyle = colors.muted; x.fillText("i7 · 1TB SSD · 165Hz", w - 60, 270);
      x.fillStyle = colors.accent; x.fillRect(w - 280, 310, 220, 58);
      for (let i = 0; i < 4; i++) { x.fillStyle = colors.surface; x.fillRect(30 + i * 245, 430, 225, 180); x.fillStyle = colors.accent2; x.fillRect(50 + i * 245, 450, 70, 70); }
    });
    const hinge = new T.Group(); hinge.position.set(0, 0.06, -D / 2); root.add(hinge);
    const lid = new T.Mesh(new T.BoxGeometry(W, 0.08, D), alu); lid.position.z = D / 2; lid.position.y = 0.04; hinge.add(lid);
    const scr = new T.Mesh(new T.PlaneGeometry(W * 0.92, D * 0.86), new T.MeshBasicMaterial({ map: screenTex })); scr.rotation.x = Math.PI / 2; scr.position.set(0, -0.001, D / 2); hinge.add(scr);
    const bezel = new T.Mesh(new T.PlaneGeometry(W * 0.98, D * 0.96), new T.MeshBasicMaterial({ color: 0x0b0b0d })); bezel.rotation.x = Math.PI / 2; bezel.position.set(0, -0.0005, D / 2); hinge.add(bezel);
    const glow = new T.PointLight(C(colors.accent), 0, 6); glow.position.set(0, 1.2, 0.6); root.add(glow);
    const sh = shadowDisc(2.6); sh.scale.set(1.3, 1, 1); sh.position.y = -0.07; root.add(sh);
    const chips = []; for (let i = 0; i < 14; i++) { const m = new T.Mesh(new T.BoxGeometry(0.22, 0.03, 0.22), phys({ color: C(i % 2 ? colors.accent : colors.accent2), metalness: 0.6, roughness: 0.3, emissive: C(i % 2 ? colors.accent : colors.accent2), emissiveIntensity: 0.3 })); m.userData = { a: (i / 14) * 6.28, r: 2.3 + rnd() * 0.8, y: rnd() * 2 - 0.4 }; root.add(m); chips.push(m); }
    st.update = (dt, t) => {
      const p = st.sp, open = ease(Math.min(1, (t - 0.2) / 1.6));
      place(st, root, Object.assign({ scale: 0.95 }, o), -0.4);
      hinge.rotation.x = -lerp(0.02, 1.85, open) - ease(p) * 0.2;
      glow.intensity = open * 12;
      root.rotation.y = lerp(0.55, -0.35, ease(p)) + st.pointer.sx * 0.3 + Math.sin(t * 0.4) * 0.05;
      root.rotation.x = lerp(0.35, 0.15, ease(p)) + st.pointer.sy * 0.08;
      chips.forEach((m, i) => { const u = m.userData, a = u.a + t * 0.25; m.position.set(Math.cos(a) * u.r * (1 + p * 0.3), u.y + Math.sin(t + i) * 0.15 + p * 0.5, Math.sin(a) * u.r * 0.7); m.rotation.set(t + i, t * 0.7, 0); });
      camera.position.x = st.pointer.sx * 0.4; camera.position.y = 0.8; camera.lookAt(0, 0.2, 0);
    };
    return st;
  }

  Object.assign(window.SAMMEM.scenes, { pizza, shawarma, products, washer, barber, grocery, drop, bottle, cloth, carpet, laptop });
})();
