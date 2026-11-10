// Engine: timing in beats, drawing primitives, Arabic text, خوارزمو sprites, background, bloom/aberration post, scene manager.
// Deterministic: seek(t) draws frame t from scratch (no Math.random, nothing accumulates between frames).
"use strict";
const W = 1080, H = 1920;
// palette taken from the تكنو انجاز logo: mint-teal (#46c1b3) -> teal (#1cbdbe) -> blue (#468bba) -> indigo (#4762ac), pushed brighter for neon on dark
const C = { text: "#f1fbfa", mut: "#86b3b8", dim: "#34606b", blue: "#1fc8cc", sky: "#9cf0e6", cyan: "#4fe6cd", deep: "#4762ac",
  amber: "#aab4ff", green: "#3df2bd", red: "#ff5d7d", violet: "#7f8cf2", panel: "rgba(5,20,30,0.88)" };
let out, octx, sc, ctx, bl, bctx, tmp, tctx, TL, BEAT, NOW = 0, SC = {}, IMG = {}, META = {};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const P = (t, a, d = 0.4) => clamp((t - a) / d);
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eo5 = (x) => 1 - Math.pow(1 - clamp(x), 5);
const ei = (x) => Math.pow(clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x, c = 1.9) => { x = clamp(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const elastic = (x) => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const isAr = (s) => /[؀-ۿ]/.test(s);
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const A = (a = 1) => { ctx.globalAlpha = clamp(a); };
const win = (t, a, b, f = 0.25) => P(t, a, f) * (1 - P(t, b - f, f));
const pop = (t, t0, d = 0.45) => back(P(t, t0, d));

// ---------- primitives
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, fill, a = 1) { if (a <= 0) return; A(a); rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function strokeRR(x, y, w, h, r, col, lw = 2, a = 1) { if (a <= 0) return; A(a); rr(x, y, w, h, r); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function circle(x, y, r, fill, a = 1) { if (a <= 0 || r <= 0) return; A(a); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); }
function ring(x, y, r, col, lw = 2, a = 1, a0 = 0, a1 = 6.2832) { if (a <= 0 || r <= 0) return; A(a); ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function seg(x1, y1, x2, y2, col, lw = 2, a = 1) { if (a <= 0) return; A(a); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke(); }
function poly(pts, col, lw = 2, a = 1, close = false, fill = null) {
  if (a <= 0) return; A(a); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (col) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
}
function glow(color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
function withT(x, y, sx, sy, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy); fn(); ctx.restore(); }
function halo(x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; A(a); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
function add(fn) { ctx.save(); ctx.globalCompositeOperation = "lighter"; fn(); ctx.restore(); }

// ---------- text (RTL aware; Arabic animates word by word, never letter by letter)
const font = (size, weight = 900, fam = "Cairo") => `${weight} ${size}px ${fam === "mono" ? "JBMono" : "Cairo"}, "Noto Color Emoji"`;
function T(s, x, y, o = {}) {
  const { size = 60, weight = 900, color = C.text, align = "center", a = 1, fam = "Cairo", g = 0, gc = null, ls = 0, stroke = 0 } = o;
  if (a <= 0.001) return; ctx.save(); A(a); ctx.font = font(size, weight, fam); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.direction = isAr(s) ? "rtl" : "ltr"; if (ls) ctx.letterSpacing = ls + "px";
  if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = "rgba(2,12,20,0.9)"; ctx.lineJoin = "round"; ctx.strokeText(s, x, y); }
  if (g) { ctx.shadowColor = gc || color; ctx.shadowBlur = g; } ctx.fillText(s, x, y); ctx.restore();
}
function measure(s, size, weight = 900, fam = "Cairo") { ctx.save(); ctx.font = font(size, weight, fam); ctx.direction = isAr(s) ? "rtl" : "ltr"; const w = ctx.measureText(s).width; ctx.restore(); return w; }
function tokens(s) { const out = []; for (const w of s.split(" ")) { const lat = !isAr(w) && /[A-Za-z0-9]/.test(w); if (lat && out.length && out[out.length - 1].lat) out[out.length - 1].s += " " + w; else out.push({ s: w, lat }); } return out; }
// word-by-word reveal centred on x. colors: {word: color}
function TW(s, x, y, t0, o = {}) {
  const { size = 60, weight = 900, color = C.text, a = 1, step = 0.09, g = 0, gc = null, colors = {}, stroke = 0 } = o;
  if (a <= 0.001 || NOW < t0) return; const tk = tokens(s), sp = measure(" ", size, weight); const ws = tk.map((k) => measure(k.s, size, weight));
  const tot = ws.reduce((p, q) => p + q, 0) + sp * (tk.length - 1), rtl = isAr(s); let cur = rtl ? x + tot / 2 : x - tot / 2;
  tk.forEach((k, i) => { const u = P(NOW, t0 + i * step, 0.32), e = back(u, 2.2), w = ws[i], cx = rtl ? cur - w / 2 : cur + w / 2;
    if (u > 0) withT(cx, y + (1 - eo(u)) * 26, 0.7 + 0.3 * e, 0.7 + 0.3 * e, 0, () => T(k.s, 0, 0, { size, weight, color: colors[k.s] || color, a: a * clamp(u * 2.5), g, gc, stroke }));
    cur += rtl ? -(w + sp) : w + sp; });
}
// header zone: fixed slots (y 262 and 362); captions cross-fade, boxes never resize
function header(lines, t0, t1, o = {}) {
  const a = win(NOW, t0, t1, 0.22); if (a <= 0) return; const ys = lines.length === 1 ? [310] : [262, 366];
  lines.forEach((s, i) => TW(s, W / 2, ys[i], t0 + i * 0.32, { size: o.size || 68, a, colors: o.colors || {}, g: 26, gc: "rgba(31,200,204,0.75)", stroke: 10 }));
}
function card(x, y, w, h, o = {}) {
  const { a = 1, col = C.blue, fill = C.panel, r = 30, lw = 3, g = 30 } = o; if (a <= 0.001) return;
  ctx.save(); A(a); ctx.shadowColor = col; ctx.shadowBlur = g; rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  ctx.save(); A(a); rr(x, y, w, h, r); const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, col); gr.addColorStop(0.5, "rgba(255,255,255,0.25)"); gr.addColorStop(1, col); ctx.strokeStyle = gr; ctx.lineWidth = lw; ctx.stroke();
  A(a * 0.08); rr(x + 6, y + 6, w - 12, h * 0.42, r - 6); ctx.fillStyle = "#fff"; ctx.fill(); ctx.restore();
}
function chip(s, x, y, o = {}) {
  const { size = 40, col = C.blue, a = 1, tc = C.text, sc: k = 1, fam = "Cairo" } = o; if (a <= 0.001 || k <= 0) return; const w = measure(s, size, 900, fam) + size * 1.4, h = size * 1.9;
  withT(x, y, k, k, 0, () => { card(-w / 2, -h / 2, w, h, { a, col, r: h / 2, g: 22 }); T(s, 0, fam === "mono" ? 2 : size * 0.05, { size, color: tc, a, fam }); });
}

// ---------- خوارزمو. (x, y) = feet/bottom centre, h = height on screen
function K(name, x, y, h, o = {}) {
  const im = IMG[name]; if (!im) return; const { a = 1, sx = 1, sy = 1, rot = 0, flip = false, bob = 1, aura = 1, shadow = 1 } = o; if (a <= 0.001 || h <= 1) return;
  const m = META[name], w = h * m.w / m.h, by = Math.sin(NOW * 2.6 + x * 0.01) * 0.012 * h * bob, br = 1 + Math.sin(NOW * 2.1 + 1) * 0.008 * bob;
  if (aura) add(() => { halo(x, y - h * 0.55, h * 0.85, "rgba(31,200,204,0.30)", a * aura); halo(x, y - h * 0.93, h * 0.36, "rgba(156,240,230,0.35)", a * aura * (0.7 + 0.3 * Math.sin(NOW * 7))); });
  if (shadow) { A(a * 0.5 * shadow); ctx.beginPath(); ctx.ellipse(x, y + h * 0.012, w * 0.36, h * 0.03, 0, 0, 6.2832); ctx.fillStyle = "rgba(0,4,16,0.9)"; ctx.fill(); add(() => halo(x, y, w * 0.6, "rgba(31,200,204,0.22)", a * shadow)); }
  ctx.save(); A(a); ctx.translate(x, y + by); ctx.rotate(rot); ctx.scale((flip ? -1 : 1) * sx * br, sy / br); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
}
// squash & stretch helper for a hop: u in [0,1] -> {dy (0..1 arc), sx, sy}
function hop(u) { const arc = Math.sin(clamp(u) * Math.PI); const land = u > 0.86 ? (1 - (u - 0.86) / 0.14) : 0, take = u < 0.12 ? 1 - u / 0.12 : 0; const sq = 0.16 * Math.max(land, take); return { arc, sx: 1 + sq - 0.06 * arc, sy: 1 - sq + 0.08 * arc }; }

// ---------- particles
function burst(x, y, t0, o = {}) { // radial sparks
  const { n = 40, r = 420, col = [C.cyan, C.sky, C.violet, "#fff"], dur = 1.2, size = 9, grav = 300 } = o; const u = (NOW - t0) / dur; if (u <= 0 || u >= 1) return;
  add(() => { for (let i = 0; i < n; i++) { const an = rnd(i + o.seed || i) * 6.2832, sp = (0.35 + 0.65 * rnd(i * 3 + 1)) * r, e = eo5(u); const px = x + Math.cos(an) * sp * e, py = y + Math.sin(an) * sp * e + grav * u * u;
    const s = size * (1 - u) * (0.5 + rnd(i * 7)); withT(px, py, 1, 1, an + u * 6, () => fillRR(-s, -s / 3, s * 2, s / 1.5, s / 3, col[i % col.length], 1 - u * u)); } });
}
function shock(x, y, t0, o = {}) { const { r = 700, dur = 0.7, col = "#c4fff5", lw = 26 } = o; const u = (NOW - t0) / dur; if (u <= 0 || u >= 1) return; add(() => { ring(x, y, r * eo(u), col, lw * (1 - u) + 1, (1 - u) * 0.9); ring(x, y, r * eo(u) * 0.72, col, lw * 0.4 * (1 - u) + 1, (1 - u) * 0.5); }); }
function confetti(t0, o = {}) { const { n = 90, dur = 3.2 } = o; const u = (NOW - t0) / dur; if (u <= 0 || u >= 1) return; const cols = [C.cyan, C.blue, C.green, C.violet, "#468bba", "#fff"];
  for (let i = 0; i < n; i++) { const x0 = rnd(i) * W, vy = 500 + rnd(i + 9) * 700, d = rnd(i + 3) * 0.8; const tt = Math.max(0, NOW - t0 - d); const x = x0 + Math.sin(tt * 3 + i) * 60, y = -60 + vy * tt; if (y > H + 40) continue;
    withT(x, y, 1, Math.cos(tt * 6 + i), tt * 4 + i, () => fillRR(-11, -7, 22, 14, 3, cols[i % 6], (1 - u * u) * 0.95)); } }

// ---------- background: deep navy, drifting glow, perspective floor grid, floating code glyphs, bokeh
const GLY = ["0", "1", "{ }", "==", "i++", "[ ]", "for", "if", "<", ">", "n", "O(n)", "42", "7", "→", "arr", "++", "=="];
function background(t, o = {}) {
  const { hue = 0, par = 0, dim = 0 } = o; ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#02101a"); g.addColorStop(0.55, "#06202f"); g.addColorStop(1, "#070f2a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  add(() => { halo(540 + Math.sin(t * 0.23) * 220 - par * 60, 760 + Math.cos(t * 0.19) * 120, 900, "rgba(71,98,172,0.42)", 1); halo(200 + Math.cos(t * 0.31) * 160 - par * 90, 1500, 620, "rgba(28,189,190,0.20)", 1); halo(900 + Math.sin(t * 0.27) * 120 - par * 90, 260, 520, "rgba(70,193,179,0.14)", 1); });
  // floor grid (perspective), horizon at y = 1010
  const hz = 1010; ctx.save(); ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
  for (let i = -14; i <= 14; i++) { const x0 = 540 + i * 46 - par * 30, x1 = 540 + i * 300 - par * 240; seg(x0, hz, x1, H, "rgba(60,200,205,0.16)", 2, 1); }
  for (let j = 0; j < 14; j++) { const z = ((j + (t * 0.35) % 1) / 14); const y = hz + Math.pow(z, 2.2) * (H - hz); seg(0, y, W, y, "rgba(60,200,205,0.2)", 2, 0.25 + 0.75 * z); }
  ctx.restore(); add(() => { const hg = ctx.createLinearGradient(0, hz - 60, 0, hz + 90); hg.addColorStop(0, "rgba(31,200,204,0)"); hg.addColorStop(0.42, "rgba(80,215,210,0.13)"); hg.addColorStop(1, "rgba(31,200,204,0)"); A(1); ctx.fillStyle = hg; ctx.fillRect(0, hz - 60, W, 150); });
  // glyphs drifting up (3 depths)
  for (let i = 0; i < 34; i++) { const d = 0.35 + 0.65 * rnd(i + 2), x = (rnd(i) * 1300 - 110 - par * 120 * d + 2000) % 1300 - 110, y = H - ((rnd(i + 5) * H + t * 34 * d) % (H + 200)) + 100;
    T(GLY[i % GLY.length], x, y, { size: 22 + 34 * d, fam: "mono", color: i % 5 === 0 ? C.violet : C.sky, a: (0.05 + 0.11 * d) * (0.6 + 0.4 * Math.sin(t * 1.4 + i)) }); }
  add(() => { for (let i = 0; i < 26; i++) { const x = (rnd(i + 40) * W + t * (8 + 22 * rnd(i + 41))) % W, y = (rnd(i + 42) * H - t * (14 + 30 * rnd(i + 43)) + H * 30) % H, r = 2 + rnd(i + 44) * 5; circle(x, y, r, "#a8f2e8", 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2 + i))); } });
  if (dim) { A(dim); ctx.fillStyle = "#020a10"; ctx.fillRect(0, 0, W, H); }
}
function foreground(t) { // soft out-of-focus bokeh in front of everything + vignette
  add(() => { for (let i = 0; i < 7; i++) { const x = (rnd(i + 70) * 1400 - 160 + t * (26 + 30 * rnd(i + 71))) % 1400 - 160, y = (rnd(i + 72) * H - t * 22 + H * 9) % H, r = 46 + rnd(i + 73) * 70; halo(x, y, r, "rgba(110,228,216,0.16)", 0.6 + 0.4 * Math.sin(t + i)); } });
  ctx.globalAlpha = 1; const v = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.78); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,6,12,0.72)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
function logo(x, y, h, a = 1, k = 1) { const im = IMG.logo; if (!im || a <= 0 || k <= 0) return; const w = h * im.width / im.height; add(() => halo(x, y, h * 1.1, "rgba(31,200,204,0.35)", a)); ctx.save(); A(a); ctx.translate(x, y); ctx.scale(k, k); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); }
// ---------- scene manager + post
let FX = { shake: 0, chroma: 0, flash: 0, zoom: 1, flashCol: "#d6fff8" };
const S = (name) => SC[name];                       // {t0, t1, beats}
const bt = (name, b) => SC[name].t0 + b * BEAT;      // absolute time of beat b of a scene
const imp = (t, t0, d = 0.5) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : Math.pow(1 - u, 2); }; // decaying impulse
function render(t) {
  NOW = t; FX = { shake: 0, chroma: 0, flash: 0, zoom: 1, flashCol: "#d6fff8" };
  ctx = sc.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0;
  let cur = TL.scenes[0]; for (const s of TL.scenes) if (t >= SC[s.name].t0) cur = s;
  SCENES[cur.name](t, SC[cur.name]);
  foreground(t);
  // ---- post: bloom (bright parts, blurred, added), shake/zoom, chromatic split, flash, fades
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalCompositeOperation = "source-over"; bctx.globalAlpha = 1; bctx.filter = "blur(7px) contrast(2.1) brightness(0.62)"; bctx.drawImage(sc, 0, 0, bl.width, bl.height); bctx.filter = "none";
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.42; ctx.drawImage(bl, 0, 0, W, H); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  const o = octx; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-over"; o.globalAlpha = 1; o.fillStyle = "#000"; o.fillRect(0, 0, W, H);
  const sh = FX.shake, dx = sh ? Math.sin(t * 91) * sh : 0, dy = sh ? Math.cos(t * 77) * sh : 0, z = FX.zoom * (sh ? 1 + sh * 0.0012 : 1);
  const draw = (src, ox = 0) => { o.setTransform(z, 0, 0, z, W / 2 * (1 - z) + dx + ox, H / 2 * (1 - z) + dy); o.drawImage(src, 0, 0); };
  if (FX.chroma > 0.3) { const k = FX.chroma; tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.globalCompositeOperation = "source-over"; tctx.drawImage(sc, 0, 0); tctx.globalCompositeOperation = "multiply"; tctx.fillStyle = "#ff0000"; tctx.fillRect(0, 0, W, H);
    draw(sc); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "multiply"; o.fillStyle = "#00ffff"; o.fillRect(0, 0, W, H); o.globalCompositeOperation = "lighter"; draw(tmp, k); o.globalCompositeOperation = "source-over"; }
  else draw(sc);
  o.setTransform(1, 0, 0, 1, 0, 0);
  if (FX.flash > 0) { o.globalAlpha = clamp(FX.flash); o.fillStyle = FX.flashCol; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
  const fade = Math.max(1 - P(t, 0, 0.5), P(t, TL.total - 0.7, 0.6)); if (fade > 0) { o.globalAlpha = fade; o.fillStyle = "#000"; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
}
// zoom-through cut between scenes: call from both sides of a boundary
function cut(t, tb, d = 0.22) {
  const u = (t - tb) / d;
  if (u > -1 && u < 0) { const k = ei(1 + u); FX.zoom *= 1 + 0.22 * k; FX.flash = Math.max(FX.flash, k * 0.85); }
  else if (u >= 0 && u < 1.6) { const k = Math.pow(1 - u / 1.6, 3); FX.zoom *= 1 + 0.12 * k; FX.flash = Math.max(FX.flash, k * 0.85); }
}

const SCENES = {};
window.setup = async (tl) => {
  TL = tl; BEAT = 60 / tl.bpm; let t = 0; for (const s of tl.scenes) { SC[s.name] = { t0: t, t1: t + s.beats * BEAT, beats: s.beats }; t += s.beats * BEAT; } TL.total = t;
  out = document.getElementById("c"); octx = out.getContext("2d"); const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  sc = mk(W, H); ctx = sc.getContext("2d"); bl = mk(W / 4, H / 4); bctx = bl.getContext("2d"); tmp = mk(W, H); tctx = tmp.getContext("2d");
  for (const [fam, file, w] of [["Cairo", "cairo-800.ttf", 800], ["Cairo", "cairo-900.ttf", 900], ["JBMono", "jbmono-800.ttf", 800]]) { const f = new FontFace(fam, `url(assets/${file})`, { weight: String(w) }); await f.load(); document.fonts.add(f); }
  META = await (await fetch("assets/k/meta.json")).json();
  await new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG.logo = im; res(); }; im.onerror = rej; im.src = "assets/logo.png"; });
  await Promise.all(Object.keys(META).map((k) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = `assets/k/${k}.png`; })));
  await document.fonts.ready; render(0); return TL.total;
};
window.seek = (t) => { window.scrollTo(0, 0); render(t); };
