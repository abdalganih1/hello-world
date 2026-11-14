// Core: canvas, timing, easing, drawing primitives, Arabic text, background, chrome, subtitles, scene manager.
// Everything is deterministic: seek(t) draws frame t from scratch (no Math.random, no accumulated state).
"use strict";
const W = 1920, H = 1080;
const C = {
  bg: "#060a13", panel: "#0c1424", panel2: "#101b30", line: "#1c2a45", text: "#eef4ff", mut: "#8a9ab6", dim: "#4b5b78",
  teal: "#2ee6c5", amber: "#ffb020", red: "#ff5a6a", blue: "#4da3ff", violet: "#a47cff", green: "#46e08a", pink: "#ff6fb1",
  pcb: "#0d5c76", pcb2: "#0a475c", pcbLine: "#1784a3", silk: "#d9f3ff", metal: "#c9d3df", black: "#14181f",
};
let cv, ctx, TL, NOW = 0, GA = 1;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const P = (t, a, d = 0.5) => clamp((t - a) / d);
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const A = (a = 1) => { ctx.globalAlpha = clamp(GA * a); };
const isAr = (s) => /[؀-ۿ]/.test(s);

// ---------- primitives
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, fill, a = 1) { A(a); rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function strokeRR(x, y, w, h, r, col, lw = 2, a = 1) { A(a); rr(x, y, w, h, r); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function circle(x, y, r, fill, a = 1) { A(a); ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function ring(x, y, r, col, lw = 2, a = 1, a0 = 0, a1 = Math.PI * 2) { A(a); ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), a0, a1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function seg(x1, y1, x2, y2, col, lw = 2, a = 1, cap = "round") { A(a); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.stroke(); }
function poly(pts, col, lw = 2, a = 1, close = false, fill = null) {
  A(a); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (col) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
}
function glow(color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
function withT(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
function halo(x, y, r, col, a = 1) { // soft radial light
  A(a); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function arrow(x1, y1, x2, y2, col, lw = 4, a = 1, head = 16) {
  seg(x1, y1, x2, y2, col, lw, a); const ang = Math.atan2(y2 - y1, x2 - x1);
  poly([[x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5)], [x2, y2], [x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5)]], col, lw, a);
}
// a dot travelling along a polyline, u in [0,1]
function along(pts, u) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let k = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) { if (k <= L[i] || i === L.length - 1) { const f = L[i] ? k / L[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } k -= L[i]; }
  return pts[0];
}
function pathPartial(pts, u, col, lw, a = 1) { // draw the first u of a polyline
  if (u <= 0) return; const end = along(pts, u);
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let k = clamp(u) * tot; const out = [pts[0]];
  for (let i = 0; i < L.length; i++) { if (k > L[i]) { out.push(pts[i + 1]); k -= L[i]; } else break; }
  out.push(end); poly(out, col, lw, a);
}
function pulses(pts, t, col, n = 3, speed = 0.6, r = 6, a = 1) {
  for (let i = 0; i < n; i++) { const u = ((t * speed + i / n) % 1 + 1) % 1; const [x, y] = along(pts, u); halo(x, y, r * 4, col, 0.5 * a); circle(x, y, r, "#fff", a * 0.9); }
}

// ---------- text (Arabic RTL aware; Arabic is animated word by word, never split into letters)
function font(size, weight = 800, fam = "Cairo") { return `${weight} ${size}px ${fam === "mono" ? "JBMono" : fam}`; }
function T(s, x, y, o = {}) {
  const { size = 40, weight = 800, color = C.text, align = "center", a = 1, fam = "Cairo", g = 0, gc = null, base = "middle", ls = 0 } = o;
  if (a <= 0.001) return;
  ctx.save(); A(a); ctx.font = font(size, weight, fam); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.direction = isAr(s) ? "rtl" : "ltr"; if (ls) ctx.letterSpacing = ls + "px";
  if (g) { ctx.shadowColor = gc || color; ctx.shadowBlur = g; }
  ctx.fillText(s, x, y); ctx.restore();
}
function tokens(s) { // keep runs of Latin words together so "Digital Pins" stays in order inside RTL text
  const raw = s.split(" "), out = [];
  for (const w of raw) { const lat = !isAr(w) && /[A-Za-z]/.test(w); if (lat && out.length && out[out.length - 1].lat) out[out.length - 1].s += " " + w; else out.push({ s: w, lat }); }
  return out;
}
function measure(s, size, weight = 800, fam = "Cairo") { ctx.save(); ctx.font = font(size, weight, fam); ctx.direction = isAr(s) ? "rtl" : "ltr"; const w = ctx.measureText(s).width; ctx.restore(); return w; }
// word-by-word reveal, centred on x (RTL order). t0 = when the first word starts.
function TW(s, x, y, t0, o = {}) {
  const { size = 40, weight = 800, color = C.text, a = 1, step = 0.07, g = 0, gc = null, colors = {} } = o;
  if (a <= 0.001 || NOW < t0) return;
  const tk = tokens(s), sp = measure(" ", size, weight) * 1.0;
  const ws = tk.map((k) => measure(k.s, size, weight)); const tot = ws.reduce((p, q) => p + q, 0) + sp * (tk.length - 1);
  const rtl = isAr(s); let cur = rtl ? x + tot / 2 : x - tot / 2;
  tk.forEach((k, i) => {
    const u = eo(P(NOW, t0 + i * step, 0.3)); const w = ws[i];
    const cx = rtl ? cur - w / 2 : cur + w / 2;
    T(k.s, cx, y + (1 - u) * 16, { size, weight, color: colors[k.s] || color, a: a * u, g, gc });
    cur += rtl ? -(w + sp) : w + sp;
  });
}
function wrap2(s, size, weight, maxW) { // one or two balanced lines
  if (measure(s, size, weight) <= maxW) return [s];
  const w = s.split(" "); let best = null;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(" "), b = w.slice(i).join(" "); const d = Math.max(measure(a, size, weight), measure(b, size, weight)); if (!best || d < best.d) best = { a, b, d }; }
  return [best.a, best.b];
}

// ---------- panels
function card(x, y, w, h, o = {}) {
  const { a = 1, col = C.teal, fill = "rgba(13,22,40,0.88)", r = 22, lw = 2, g = 24 } = o;
  if (a <= 0.001) return;
  ctx.save(); A(a); ctx.shadowColor = col; ctx.shadowBlur = g * a; rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  ctx.save(); A(a); rr(x, y, w, h, r); const gr = ctx.createLinearGradient(x, y, x + w, y + h);
  gr.addColorStop(0, col); gr.addColorStop(0.5, "rgba(255,255,255,0.12)"); gr.addColorStop(1, col);
  ctx.strokeStyle = gr; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
}
function chip(s, x, y, o = {}) { // pill label
  const { size = 30, col = C.teal, a = 1, fill = "rgba(10,20,36,0.9)", weight = 800, tc = C.text } = o;
  const w = measure(s, size, weight) + size * 1.3, h = size * 1.75;
  card(x - w / 2, y - h / 2, w, h, { a, col, fill, r: h / 2, g: 14 });
  T(s, x, y + size * 0.06, { size, weight, color: tc, a });
  return w;
}
function pop(t, t0, d = 0.45) { return back(P(t, t0, d)); }

// ---------- background (pre-rendered static layer + live pulses and dust)
let BG = null, TRACES = [];
function buildBg() {
  BG = document.createElement("canvas"); BG.width = W; BG.height = H; const b = BG.getContext("2d");
  const g = b.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.45, W * 0.75);
  g.addColorStop(0, "#0e1a33"); g.addColorStop(0.55, "#080e1c"); g.addColorStop(1, "#04060c"); b.fillStyle = g; b.fillRect(0, 0, W, H);
  b.fillStyle = "rgba(120,170,255,0.07)";
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) { b.beginPath(); b.arc(x, y, 1.6, 0, Math.PI * 2); b.fill(); }
  // circuit traces hugging the edges
  for (let i = 0; i < 26; i++) {
    const side = i % 4; let x, y, dx, dy;
    if (side === 0) { x = rnd(i) * W; y = 0; dx = 0; dy = 1; } else if (side === 1) { x = rnd(i) * W; y = H; dx = 0; dy = -1; }
    else if (side === 2) { x = 0; y = rnd(i) * H; dx = 1; dy = 0; } else { x = W; y = rnd(i) * H; dx = -1; dy = 0; }
    const pts = [[x, y]]; const n = 3 + Math.floor(rnd(i + 50) * 3);
    for (let k = 0; k < n; k++) {
      const L = 40 + rnd(i * 7 + k) * 150; x += dx * L; y += dy * L; pts.push([x, y]);
      const turn = rnd(i * 13 + k) > 0.5 ? 1 : -1; const ndx = (dx === 0 ? turn : 0) * 0.7071 + dx * 0.7071, ndy = (dy === 0 ? turn : 0) * 0.7071 + dy * 0.7071;
      const L2 = 20 + rnd(i * 3 + k) * 60; x += ndx * L2; y += ndy * L2; pts.push([x, y]);
    }
    TRACES.push(pts);
    b.strokeStyle = "rgba(60,110,170,0.16)"; b.lineWidth = 2; b.beginPath(); pts.forEach((p, k) => (k ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1]))); b.stroke();
    const e = pts[pts.length - 1]; b.fillStyle = "rgba(60,110,170,0.35)"; b.beginPath(); b.arc(e[0], e[1], 4, 0, Math.PI * 2); b.fill();
  }
  const v = b.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)"); b.fillStyle = v; b.fillRect(0, 0, W, H);
}
function background(t) {
  ctx.globalAlpha = 1; ctx.drawImage(BG, 0, 0);
  TRACES.forEach((pts, i) => { const u = ((t * 0.12 + rnd(i + 9)) % 1.6); if (u < 1) { const [x, y] = along(pts, u); halo(x, y, 18, "rgba(46,230,197,0.5)", 0.5); circle(x, y, 2.4, "#9ffbea", 0.6); } });
  for (let i = 0; i < 46; i++) { // dust
    const x = (rnd(i) * W + t * (6 + rnd(i + 1) * 14)) % W, y = (rnd(i + 2) * H - t * (4 + rnd(i + 3) * 8) + H * 10) % H;
    circle(x, y, 1 + rnd(i + 4) * 1.8, "#9cc4ff", 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.3 + i)));
  }
}

// ---------- chrome: brand, chapter, progress
const CHAPTER = { hook: "", title: "الأردوينو", what: "ما هو الأردوينو؟", anatomy: "ماذا داخل اللوحة؟", compare: "الأردوينو والكمبيوتر",
  flow: "يستقبل ← يفكر ← ينفذ", puzzle: "لغز صغير", examples: "ماذا تستطيع أن تبني؟", why: "لماذا الأردوينو؟", boards: "Uno · Nano · Mega", map: "خريطة الدورة", teaser: "الحلقة القادمة" };
function brand(x, y, a, s = 1) { // "مسار" mark: a winding path with three stops
  withT(x, y, s, 0, () => {
    const pts = [[-34, 14], [-14, 14], [-6, -2], [10, -2], [18, -14], [34, -14]];
    glow(C.teal, 12, () => poly(pts, C.teal, 5, a));
    circle(-34, 14, 6, C.teal, a); circle(4, -2, 5, C.amber, a); circle(34, -14, 6, C.teal, a);
  });
}
function chrome(t) {
  const a = P(t, 1.0, 0.8) * (1 - P(t, TL.total - 1.2, 0.8));
  brand(1838, 56, a);
  T("مسار", 1782, 52, { size: 38, weight: 900, color: C.text, align: "right", a });
  T("أردوينو من الصفر · الحلقة 01", 1782, 86, { size: 20, weight: 600, color: C.mut, align: "right", a });
  const sc = sceneAt(t); const nm = CHAPTER[TL.scenes[sc].name];
  if (nm) {
    const s0 = TL.scenes[sc].t0, ca = a * P(t, s0 + 0.3, 0.5) * (1 - P(t, TL.scenes[sc].t1 - 0.3, 0.3));
    const num = String(sc).padStart(2, "0");
    T(num, 80, 58, { size: 22, weight: 800, color: C.teal, align: "left", a: ca, fam: "mono" });
    T(nm, 124, 56, { size: 28, weight: 800, color: C.text, align: "left", a: ca });
  }
  // progress bar with chapter ticks
  const pa = a * 0.9; fillRR(80, H - 26, W - 160, 4, 2, "rgba(120,150,200,0.18)", pa);
  fillRR(W - 80 - (W - 160) * (t / TL.total), H - 26, (W - 160) * (t / TL.total), 4, 2, C.teal, pa);
  TL.scenes.forEach((s, i) => { if (i) circle(W - 80 - (W - 160) * (s.t0 / TL.total), H - 24, 4, t >= s.t0 ? C.teal : "#2a3a58", pa); });
}

// ---------- subtitles: fixed box, text fades; never resizes while shown
function subtitles(t) {
  const L = TL.lines; let cur = null;
  for (let i = 0; i < L.length; i++) { const nxt = L[i + 1] ? L[i + 1].t0 : 1e9; if (t >= L[i].t0 - 0.08 && t < Math.min(nxt - 0.05, L[i].t1 + 0.45)) cur = L[i]; }
  if (!cur) return;
  const nxt = TL.lines[cur.i + 1] ? TL.lines[cur.i + 1].t0 : 1e9;
  const a = P(t, cur.t0 - 0.08, 0.12) * (1 - P(t, Math.min(nxt - 0.05, cur.t1 + 0.45) - 0.14, 0.14));
  const bx = 300, bw = W - 600, by = 896, bh = 128;
  ctx.save(); A(0.78 * a); rr(bx, by, bw, bh, 26); ctx.fillStyle = "rgba(5,9,18,0.86)"; ctx.fill();
  A(0.5 * a); ctx.strokeStyle = "rgba(46,230,197,0.35)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  const ls = wrap2(cur.text, 44, 700, bw - 90);
  const ys = ls.length === 1 ? [by + bh / 2 + 2] : [by + bh / 2 - 26, by + bh / 2 + 30];
  ls.forEach((s, k) => T(s, W / 2, ys[k], { size: ls.length === 1 ? 46 : 42, weight: 700, color: C.text, a }));
}

// ---------- scene manager
const SCENES = {};
function sceneAt(t) { let k = 0; TL.scenes.forEach((s, i) => { if (t >= s.t0) k = i; }); return k; }
function linesOf(name) { return TL.lines.filter((l) => l.scene === name); }
function drawScene(i, t, alpha, scale) {
  const s = TL.scenes[i], ls = linesOf(s.name);
  const L = (k) => ls[Math.min(k, ls.length - 1)].t0, E = (k) => ls[Math.min(k, ls.length - 1)].t1;
  GA = alpha; ctx.save(); ctx.translate(W / 2, H * 0.43); ctx.scale(scale, scale); ctx.translate(-W / 2, -H * 0.43);
  try { SCENES[s.name](t, L, E, s, ls); } finally { ctx.restore(); GA = 1; ctx.globalAlpha = 1; }
}
function render(t) {
  NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  background(t);
  const i = sceneAt(t), s = TL.scenes[i], TR = 0.42;
  const nb = TL.scenes[i + 1];
  if (i > 0 && t < s.t0 + TR) { // incoming half of a transition
    const x = P(t, s.t0 - TR, 2 * TR);
    drawScene(i - 1, t, 1 - eio(x), 1 + 0.05 * eio(x));
    drawScene(i, t, eio(x), 0.965 + 0.035 * eio(x));
    sweep(x);
  } else if (nb && t > nb.t0 - TR) {
    const x = P(t, nb.t0 - TR, 2 * TR);
    drawScene(i, t, 1 - eio(x), 1 + 0.05 * eio(x));
    drawScene(i + 1, t, eio(x), 0.965 + 0.035 * eio(x));
    sweep(x);
  } else drawScene(i, t, 1, 1);
  chrome(t); subtitles(t);
  const fade = Math.max(1 - P(t, 0, 0.6), P(t, TL.total - 0.9, 0.9));
  if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
function sweep(x) { // a beam of light crossing the frame right-to-left during a scene change
  if (x <= 0 || x >= 1) return; const cx = lerp(W + 300, -300, eio(x));
  ctx.save(); ctx.globalAlpha = Math.sin(x * Math.PI) * 0.55;
  const g = ctx.createLinearGradient(cx - 220, 0, cx + 220, 0); g.addColorStop(0, "rgba(46,230,197,0)"); g.addColorStop(0.5, "rgba(46,230,197,0.35)"); g.addColorStop(1, "rgba(46,230,197,0)");
  ctx.fillStyle = g; ctx.fillRect(cx - 220, 0, 440, H); ctx.fillStyle = "rgba(200,255,245,0.6)"; ctx.fillRect(cx - 1.5, 0, 3, H); ctx.restore();
}

window.setup = async (tl) => {
  TL = tl; cv = document.getElementById("c"); ctx = cv.getContext("2d");
  const faces = [["Cairo", "cairo-600.ttf", 600], ["Cairo", "cairo-800.ttf", 700], ["Cairo", "cairo-800.ttf", 800], ["Cairo", "cairo-900.ttf", 900], ["JBMono", "jbmono-800.ttf", 800]];
  for (const [fam, file, w] of faces) { const f = new FontFace(fam, `url(assets/fonts/${file})`, { weight: String(w) }); await f.load(); document.fonts.add(f); }
  await document.fonts.ready; buildBg(); render(0);
};
window.seek = (t) => { window.scrollTo(0, 0); render(t); };
