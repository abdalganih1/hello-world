/* صمّم · مشاهد 3D للبطل (Three.js r158)
   ثلاث مشاهد قابلة لإعادة الاستخدام، كل وحدة بتاخد ألوان القالب وبتتفاعل مع الماوس والانزلاق:
   petals  → زبدية نحاسية وبتلات ياسمين متطايرة (مطاعم، حلويات، ورد، أعراس)
   helix   → حلزون لامع متل DNA (عيادات، مخابر، صيدليات، تعليم)
   blob    → كتلة سائلة متحولة بلون قزحي (شركات، تقنية، تسويق، معارض) */
(function () {
  const T = window.THREE;

  function makeEnv(renderer, colors) {
    // بيئة انعكاس مصنوعة من ألواح مضيئة، بدل ملف HDR خارجي
    const pm = new T.PMREMGenerator(renderer);
    const s = new T.Scene();
    s.background = new T.Color(colors.bg).multiplyScalar(0.6);
    const panel = (c, w, h, x, y, z, ry, i = 3) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(i), side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); s.add(m);
    };
    panel("#ffffff", 8, 3, 0, 6, 4, 0, 4);
    panel(colors.accent, 6, 6, -7, 1, 0, 0, 2.5);
    panel(colors.accent2, 6, 6, 7, -1, -2, 0, 2.5);
    panel("#ffffff", 4, 8, 3, 0, -7, 0, 1.6);
    const tex = pm.fromScene(s, 0.04).texture;
    pm.dispose();
    return tex;
  }

  function stage(container, colors, opts = {}) {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1.05;
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.environment = makeEnv(renderer, colors);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    const st = { renderer, scene, camera, pointer: { x: 0, y: 0, sx: 0, sy: 0 }, scroll: 0, wide: true, running: true, t: 0 };

    const resize = () => {
      const w = container.clientWidth || 1, h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      st.wide = w / h > 1.05;
      st.onResize && st.onResize(w, h);
    };
    new ResizeObserver(resize).observe(container);
    resize();
    window.addEventListener("pointermove", (e) => {
      st.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      st.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
    const onScroll = () => {
      const h = container.getBoundingClientRect();
      st.scroll = Math.min(1, Math.max(0, -h.top / Math.max(1, h.height)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    new IntersectionObserver(([e]) => { st.running = e.isIntersecting; }).observe(container);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!st.running) return;
      st.t += reduce ? dt * 0.15 : dt;
      st.pointer.sx += (st.pointer.x - st.pointer.sx) * 0.05;
      st.pointer.sy += (st.pointer.y - st.pointer.sy) * 0.05;
      st.update && st.update(dt, st.t);
      renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);
    return st;
  }

  // موضع المجسم: يسار الشاشة العريضة (النص يمين)، ووسط تحت النص بالموبايل
  function anchor(st, center) {
    if (center) return { x: 0, y: st.wide ? -0.2 : -0.6, s: st.wide ? 1.05 : 0.8 };
    return st.wide ? { x: -2.7, y: 0, s: 1 } : { x: 0, y: -1.9, s: 0.72 };
  }

  /* ---------- PETALS ---------- */
  function petals(container, colors, o) {
    const st = stage(container, colors, { exposure: 1.1 });
    const { scene, camera } = st;
    scene.add(new T.HemisphereLight(0xffffff, new T.Color(colors.bg), 0.5));
    const key = new T.DirectionalLight(new T.Color(colors.accent), 2.2); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new T.PointLight(new T.Color(colors.accent2), 30, 20); rim.position.set(3, -2, 3); scene.add(rim);

    const group = new T.Group(); scene.add(group);

    // زبدية نحاسية مخروطة
    const prof = [];
    for (let i = 0; i <= 24; i++) { const a = i / 24; prof.push(new T.Vector2(0.15 + Math.sin(a * Math.PI * 0.5) * 1.55, -0.85 + a * a * 1.25)); }
    prof.push(new T.Vector2(1.62, 0.42), new T.Vector2(1.5, 0.4));
    for (let i = 24; i >= 0; i--) { const a = i / 24; prof.push(new T.Vector2(0.1 + Math.sin(a * Math.PI * 0.5) * 1.42, -0.76 + a * a * 1.15)); }
    const bowl = new T.Mesh(new T.LatheGeometry(prof, 96), new T.MeshPhysicalMaterial({ color: new T.Color(colors.accent), metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2, side: T.DoubleSide }));
    bowl.rotation.x = 0.42;
    group.add(bowl);
    // نقوش: حلقات رفيعة
    for (let r = 0; r < 3; r++) {
      const ring = new T.Mesh(new T.TorusGeometry(1.0 + r * 0.22, 0.012, 8, 160), new T.MeshStandardMaterial({ color: new T.Color(colors.ink), metalness: 0.8, roughness: 0.3 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.45 + r * 0.28; bowl.add(ring);
    }

    // بتلات
    const g = new T.SphereGeometry(0.5, 18, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, p.getY(i) * 0.06 + (x * x) * 0.55 - z * 0.12);
      p.setZ(i, z * 0.55);
    }
    g.computeVertexNormals();
    const N = window.innerWidth < 700 ? 140 : 240;
    const mat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, sheen: 1, sheenColor: new T.Color(colors.accent), sheenRoughness: 0.4, side: T.DoubleSide, transmission: 0.0 });
    const mesh = new T.InstancedMesh(g, mat, N);
    const ivory = new T.Color("#fff8ec"), blush = new T.Color(colors.accent2).lerp(new T.Color("#ffffff"), 0.55);
    const data = [];
    for (let i = 0; i < N; i++) {
      data.push({ r: 1.8 + Math.random() * 4.5, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 9, sp: 0.15 + Math.random() * 0.35, fall: 0.25 + Math.random() * 0.4, rx: Math.random() * 6, ry: Math.random() * 6, rs: 0.5 + Math.random() * 1.5, s: 0.18 + Math.random() * 0.3 });
      mesh.setColorAt(i, ivory.clone().lerp(blush, Math.random() * 0.7));
    }
    group.add(mesh);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();

    st.update = (dt, t) => {
      const an = anchor(st, o.center);
      group.position.x += (an.x - group.position.x) * 0.08;
      group.position.y += (an.y + st.scroll * 1.5 - group.position.y) * 0.08;
      group.scale.setScalar(an.s);
      bowl.rotation.y = t * 0.25 + st.pointer.sx * 0.4;
      bowl.rotation.x = 0.42 + st.pointer.sy * 0.15 + st.scroll * 0.6;
      const swirl = 1 + st.scroll * 3;
      for (let i = 0; i < N; i++) {
        const d = data[i];
        d.a += dt * d.sp * swirl * 0.6;
        d.y -= dt * d.fall;
        if (d.y < -4.5) d.y = 4.5;
        const r = d.r * (1 + st.scroll * 0.6);
        v.set(Math.cos(d.a) * r + st.pointer.sx * 0.6 * (d.r / 4), d.y, Math.sin(d.a) * r * 0.6 - 1);
        e.set(d.rx + t * d.rs, d.ry + t * d.rs * 0.7, Math.sin(t + i) * 0.5);
        q.setFromEuler(e); sc.setScalar(d.s);
        m4.compose(v, q, sc); mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
      camera.position.x = st.pointer.sx * 0.4;
      camera.position.y = st.pointer.sy * 0.3;
      camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- HELIX ---------- */
  function helix(container, colors, o) {
    const st = stage(container, colors, { exposure: 1.0 });
    const { scene, camera } = st;
    scene.add(new T.HemisphereLight(0xffffff, new T.Color(colors.accent2), 0.9));
    const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 5, 6); scene.add(key);
    const group = new T.Group(); scene.add(group);
    const tilt = new T.Group(); tilt.rotation.z = -0.55; group.add(tilt);

    const COUNT = 46, H = 9;
    const sg = new T.SphereGeometry(0.16, 24, 16);
    const mA = new T.MeshPhysicalMaterial({ color: new T.Color(colors.accent), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, metalness: 0.1 });
    const mB = new T.MeshPhysicalMaterial({ color: new T.Color(colors.accent2), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, metalness: 0.1 });
    const mR = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transmission: 0.9, thickness: 0.4, ior: 1.4, transparent: true, opacity: 0.9 });
    const A = new T.InstancedMesh(sg, mA, COUNT), B = new T.InstancedMesh(sg, mB, COUNT);
    const rg = new T.CylinderGeometry(0.035, 0.035, 1, 10);
    const R = new T.InstancedMesh(rg, mR, COUNT);
    tilt.add(A, B, R);
    // فقاعات
    const bub = new T.InstancedMesh(new T.SphereGeometry(1, 24, 16), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 0.2, ior: 1.2, transparent: true, opacity: 0.55, iridescence: 1, iridescenceIOR: 1.3 }), 18);
    const bd = Array.from({ length: 18 }, () => ({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 7, z: -1 - Math.random() * 3, s: 0.08 + Math.random() * 0.28, sp: 0.15 + Math.random() * 0.3 }));
    group.add(bub);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), dir = new T.Vector3();

    st.update = (dt, t) => {
      const an = anchor(st, o.center);
      group.position.x += (an.x - group.position.x) * 0.08;
      group.position.y += (an.y + st.scroll * 1.2 - group.position.y) * 0.08;
      group.scale.setScalar(an.s);
      const twist = 0.42 + st.scroll * 0.35 + Math.sin(t * 0.4) * 0.03;
      const spin = t * 0.5 + st.pointer.sx * 0.6 + st.scroll * 4;
      for (let i = 0; i < COUNT; i++) {
        const y = (i / (COUNT - 1) - 0.5) * H;
        const a = i * twist + spin, r = 1.05 + Math.sin(i * 0.3 + t) * 0.05;
        const ax = Math.cos(a) * r, az = Math.sin(a) * r;
        const pulse = 1 + Math.sin(t * 2 - i * 0.25) * 0.12;
        q.identity(); sc.setScalar(pulse);
        v.set(ax, y, az); m4.compose(v, q, sc); A.setMatrixAt(i, m4);
        v.set(-ax, y, -az); m4.compose(v, q, sc); B.setMatrixAt(i, m4);
        dir.set(-2 * ax, 0, -2 * az); const len = dir.length(); dir.normalize();
        q.setFromUnitVectors(up, dir); sc.set(1, len, 1); v.set(0, y, 0);
        m4.compose(v, q, sc); R.setMatrixAt(i, m4);
      }
      A.instanceMatrix.needsUpdate = B.instanceMatrix.needsUpdate = R.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < bd.length; i++) {
        const b = bd[i]; b.y += dt * b.sp; if (b.y > 4) b.y = -4;
        v.set(b.x + Math.sin(t + i) * 0.2, b.y, b.z); q.identity(); sc.setScalar(b.s); m4.compose(v, q, sc); bub.setMatrixAt(i, m4);
      }
      bub.instanceMatrix.needsUpdate = true;
      tilt.rotation.x = st.pointer.sy * 0.25;
      camera.position.x = st.pointer.sx * 0.5; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  /* ---------- BLOB ---------- */
  const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

  function blob(container, colors, o) {
    const st = stage(container, colors);
    const { scene, camera } = st;
    const group = new T.Group(); scene.add(group);
    const uni = { uTime: { value: 0 }, uAmp: { value: 0.35 }, uA: { value: new T.Color(colors.accent) }, uB: { value: new T.Color(colors.accent2) }, uC: { value: new T.Color(colors.ink) }, uBg: { value: new T.Color(colors.bg) } };
    const mat = new T.ShaderMaterial({
      uniforms: uni,
      vertexShader: NOISE + `
        uniform float uTime; uniform float uAmp; varying vec3 vN; varying vec3 vV; varying float vD;
        void main(){
          vec3 p = position;
          float d = snoise(normal * 1.1 + vec3(uTime * .25)) * uAmp + snoise(normal * 3. + uTime * .4) * uAmp * .25;
          p += normal * d; vD = d;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          vN = normalize(normalMatrix * normal); vV = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uBg; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vD;
        void main(){
          vec3 n = normalize(vN); vec3 v = normalize(vV);
          float fr = pow(1. - max(dot(n, v), 0.), 2.2);
          float band = .5 + .5 * sin(vD * 9. + uTime * .8 + n.y * 3.);
          vec3 col = mix(uA, uB, band);
          col = mix(uBg * .85 + col * .12, col, smoothstep(.05, .9, fr));
          col += uC * pow(fr, 4.) * .9;
          float spec = pow(max(dot(reflect(-normalize(vec3(-.4,.7,.6)), n), v), 0.), 40.);
          col += spec * .8;
          gl_FragColor = vec4(col, 1.);
          #include <colorspace_fragment>
        }`,
    });
    const core = new T.Mesh(new T.IcosahedronGeometry(1.55, 72), mat);
    group.add(core);
    // حلقة جزيئات
    const P = 2400, pos = new Float32Array(P * 3), seeds = new Float32Array(P);
    for (let i = 0; i < P; i++) {
      const a = Math.random() * Math.PI * 2, r = 2.3 + Math.pow(Math.random(), 2) * 1.8;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 0.25 * r; pos[i * 3 + 2] = Math.sin(a) * r; seeds[i] = Math.random();
    }
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ color: new T.Color(colors.ink), size: 0.022, transparent: true, opacity: 0.75, depthWrite: false, blending: T.AdditiveBlending }));
    pts.rotation.x = 1.2; group.add(pts);
    const ring2 = new T.Mesh(new T.TorusGeometry(2.05, 0.006, 6, 220), new T.MeshBasicMaterial({ color: new T.Color(colors.accent) }));
    ring2.rotation.x = 1.2; group.add(ring2);

    st.update = (dt, t) => {
      const an = anchor(st, o.center);
      group.position.x += (an.x - group.position.x) * 0.06;
      group.position.y += (an.y + st.scroll * 1.6 - group.position.y) * 0.06;
      group.scale.setScalar(an.s * (1 + st.scroll * 0.25));
      uni.uTime.value = t;
      uni.uAmp.value = 0.3 + st.scroll * 0.35 + Math.hypot(st.pointer.sx, st.pointer.sy) * 0.12;
      core.rotation.y = t * 0.15 + st.pointer.sx * 0.5;
      core.rotation.x = st.pointer.sy * 0.3 + st.scroll * 1.2;
      pts.rotation.z = t * 0.05; ring2.rotation.z = -t * 0.08;
      pts.rotation.x = ring2.rotation.x = 1.2 + st.pointer.sy * 0.2 - st.scroll * 0.6;
      camera.position.x = st.pointer.sx * 0.35; camera.lookAt(0, 0, 0);
    };
    return st;
  }

  window.SAMMEM = window.SAMMEM || {};
  window.SAMMEM.scenes = { petals, helix, blob };
  window.SAMMEM.mountScene = function (el, type, colors, opts = {}) {
    if (!T) return null;
    try {
      const c = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
      if (!c) return null;
      return (window.SAMMEM.scenes[type] || blob)(el, colors, opts);
    } catch (err) { console.warn("3D off:", err); return null; }
  };
})();
