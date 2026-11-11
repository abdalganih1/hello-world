// Engine (light theme, matching the brand's recent posts): white/ice background, navy type, teal accents, soft shadows.
// Deterministic: seek(t) draws frame t from scratch. Times come from voice/timeline.json (the narration drives the picture).
"use strict";
const W = 1080, H = 1920;
const C = { navy: "#1d3557", ink: "#2b3f5c", mut: "#7d8ea6", line: "#dbe7ee", teal: "#1fb5b5", teal2: "#2b94c6", tealSoft: "#dff5f4",
  red: "#e8566c", redSoft: "#fde8eb", white: "#ffffff", card: "#1f3b5e", card2: "#2a5179", gold: "#f6b73c" };
let cv, ctx, TL, NOW = 0, IMG = {}, META = {}, SCN = {};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const P = (t, a, d = 0.4) => clamp((t - a) / d);
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x, c = 1.7) => { x = clamp(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const isAr = (s) => /[؀-ۿ]/.test(s);
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const A = (a = 1) => { ctx.globalAlpha = clamp(a); };
const win = (t, a, b, f = 0.25) => P(t, a, f) * (1 - P(t, b - f, f));
const pop = (t, t0, d = 0.4) => back(P(t, t0, d));
const imp = (t, t0, d = 0.4) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : Math.pow(1 - u, 2); };

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, fill, a = 1, sh = 0) { if (a <= 0) return; ctx.save(); A(a); if (sh) { ctx.shadowColor = "rgba(29,53,87,0.18)"; ctx.shadowBlur = sh; ctx.shadowOffsetY = sh * 0.35; } rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
function strokeRR(x, y, w, h, r, col, lw = 2, a = 1) { if (a <= 0) return; A(a); rr(x, y, w, h, r); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function circle(x, y, r, fill, a = 1, sh = 0) { if (a <= 0 || r <= 0) return; ctx.save(); A(a); if (sh) { ctx.shadowColor = "rgba(29,53,87,0.18)"; ctx.shadowBlur = sh; ctx.shadowOffsetY = sh * 0.35; } ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
function ring(x, y, r, col, lw = 2, a = 1, a0 = 0, a1 = 6.2832) { if (a <= 0 || r <= 0) return; A(a); ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke(); }
function seg(x1, y1, x2, y2, col, lw = 2, a = 1) { if (a <= 0) return; A(a); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke(); }
function poly(pts, col, lw = 2, a = 1, close = false, fill = null) { if (a <= 0) return; A(a); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (col) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); } }
function withT(x, y, sx, sy, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy); fn(); ctx.restore(); }
function halo(x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; A(a); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
function arrow(x1, y1, x2, y2, col, lw = 6, a = 1, hd = 22) { seg(x1, y1, x2, y2, col, lw, a); const an = Math.atan2(y2 - y1, x2 - x1); poly([[x2 - hd * Math.cos(an - 0.55), y2 - hd * Math.sin(an - 0.55)], [x2, y2], [x2 - hd * Math.cos(an + 0.55), y2 - hd * Math.sin(an + 0.55)]], col, lw, a); }

// ---------- text
const font = (size, weight = 900, fam = "Cairo") => `${weight} ${size}px ${fam === "mono" ? "JBMono" : "Cairo"}, "Noto Color Emoji"`;
function T(s, x, y, o = {}) {
  const { size = 60, weight = 900, color = C.navy, align = "center", a = 1, fam = "Cairo" } = o; if (a <= 0.001) return;
  ctx.save(); A(a); ctx.font = font(size, weight, fam); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.direction = isAr(s) ? "rtl" : "ltr"; ctx.fillText(s, x, y); ctx.restore();
}
function measure(s, size, weight = 900, fam = "Cairo") { ctx.save(); ctx.font = font(size, weight, fam); ctx.direction = isAr(s) ? "rtl" : "ltr"; const w = ctx.measureText(s).width; ctx.restore(); return w; }
function tokens(s) { const out = []; for (const w of s.split(" ")) { const lat = !isAr(w) && /[A-Za-z0-9()]/.test(w); if (lat && out.length && out[out.length - 1].lat) out[out.length - 1].s += " " + w; else out.push({ s: w, lat }); } return out; }
// one line of words, centred, each word fading/rising in from t0 (Arabic stays whole-word, never letter by letter)
function wordsLine(tk, x, y, t0, o) {
  const { size, a, hl, step, instant } = o, sp = measure(" ", size), ws = tk.map((k) => measure(k.s, size, 900, k.lat ? "mono" : "Cairo")), tot = ws.reduce((p, q) => p + q, 0) + sp * (tk.length - 1);
  let cur = x + tot / 2; tk.forEach((k, i) => { const u = instant ? 1 : P(NOW, t0 + i * step, 0.28), w = ws[i]; const on = hl.includes(k.s) || hl.includes(k.s.replace(/[،.؟!:]/g, ""));
    if (u > 0) T(k.s, cur - w / 2, y + (1 - eo(u)) * 18, { size, color: on ? C.teal : C.navy, a: a * eo(u), fam: k.lat ? "mono" : "Cairo", weight: 900 }); cur -= w + sp; });
}
function wrap(s, size, maxW) { // one line if it fits, else two lines balanced by width (no orphan word)
  const tk = tokens(s), sp = measure(" ", size), ws = tk.map((k) => measure(k.s, size, 900, k.lat ? "mono" : "Cairo")), tot = ws.reduce((p, q) => p + q, 0) + sp * (tk.length - 1);
  if (tot <= maxW || tk.length < 2) return [tk];
  let best = null, acc = 0; for (let i = 1; i < tk.length; i++) { acc += ws[i - 1] + (i > 1 ? sp : 0); const d = Math.max(acc, tot - acc - sp); if (!best || d < best.d) best = { i, d }; }
  const out = [tk.slice(0, best.i), tk.slice(best.i)]; return best.d > maxW ? [[...out[0]], ...wrap(out[1].map((k) => k.s).join(" "), size, maxW)] : out;
}
// ---------- background: clean white -> ice, with two soft brand glows (like the posts)
function background(t, o = {}) {
  ctx.globalAlpha = 1; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ffffff"); g.addColorStop(0.55, "#f3f9fb"); g.addColorStop(1, "#e6f3f6"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  halo(880 + Math.sin(t * 0.3) * 40, 520 + Math.cos(t * 0.25) * 40, 620, "rgba(31,181,181,0.12)", 1);
  halo(160 + Math.cos(t * 0.27) * 40, 1420, 620, "rgba(43,148,198,0.10)", 1);
  if (o.focus) halo(o.focus[0], o.focus[1], o.focus[2], "rgba(31,181,181,0.16)", o.focus[3] ?? 1);
}

// ---------- خوارزمو  (x, y) = feet/bottom centre
function K(name, x, y, h, o = {}) {
  const im = IMG[name]; if (!im) return; const { a = 1, sx = 1, sy = 1, rot = 0, bob = 1, shadow = 1 } = o; if (a <= 0.001 || h <= 1) return;
  const m = META[name], w = h * m.w / m.h, by = 0, br = Math.sin(NOW * 1.7 + x * 0.003) * bob; // breathing: chest rises, weight sits on the feet
  if (shadow) { ctx.save(); A(a * 0.22 * shadow); ctx.beginPath(); ctx.ellipse(x, y + h * 0.01, w * 0.34, h * 0.025, 0, 0, 6.2832); ctx.fillStyle = "#1d3557"; ctx.filter = "blur(6px)"; ctx.fill(); ctx.restore(); }
  ctx.save(); A(a); ctx.translate(x, y + by); ctx.rotate(rot + br * 0.006); ctx.scale(sx * (1 - 0.004 * br), sy * (1 + 0.01 * br)); ctx.drawImage(im, -w / 2, -h, w, h);
  if (o.overlay) { ctx.translate(-w / 2, -h); ctx.scale(h / m.h, h / m.h); o.overlay(a); } ctx.restore();
}
// ---------- خوارزمو alive: talks (mouth opens with the voice), blinks, antennas glow while he speaks
let RIG = {}, BLC = null;
const ENV = (t) => { const e = TL.env || []; const f = t * 30, i = Math.floor(f); if (i < 0 || i >= e.length - 1) return 0; return lerp(e[i], e[i + 1], f - i); };
function blinkAt(t) { // deterministic blinks every 2.4..4.2 s: close 0.06, hold 0.04, open 0.09
  let bt = 0.9, k = 0; while (bt < t + 0.5) { const u = t - bt; if (u >= 0 && u < 0.19) return u < 0.06 ? u / 0.06 : u < 0.1 ? 1 : 1 - (u - 0.1) / 0.09; bt += 2.4 + 1.8 * rnd(k++ + 17); } return 0;
}
function KR(pose, x, y, h, o = {}) {
  const r = RIG[pose], amp = 0, bl = r && r.blink ? blinkAt(NOW + (o.blinkShift || 0)) : 0;
  K(pose, x, y, h, { ...o, overlay: r ? (a) => {
    // antenna glow (pulses with the voice)
    for (const [tx, ty] of r.tips) { const g = 0.5 + 0.2 * Math.sin(NOW * 2.2 + tx * 0.05); halo(tx, ty, 34 + 26 * amp, `rgba(130,245,255,${0.45 * a})`, clamp(g)); circle(tx, ty, 6 + 5 * amp, "#f2feff", a * (0.35 + 0.6 * amp)); }
    // mouth: a dark rounded opening with a tongue, growing with the voice level, over his own mouth
    const [mx, my, mw, mh, open] = r.mouth; if (false) {
      const ww = mw * (open ? 0.92 + 0.25 * amp : 0.8 + 0.3 * amp), hh = Math.max(mh, mw * 0.35) * (open ? 0.55 + 0.9 * amp : 0.35 + 1.0 * amp), top = open ? my - mh * 0.45 : my - hh * 0.25;
      ctx.save(); A(a); ctx.beginPath(); ctx.moveTo(mx - ww / 2, top); ctx.quadraticCurveTo(mx, top + hh * 0.18, mx + ww / 2, top); ctx.ellipse(mx, top, ww / 2, hh, 0, 0, Math.PI); ctx.closePath();
      const g = ctx.createLinearGradient(0, top, 0, top + hh); g.addColorStop(0, "#2a0b1c"); g.addColorStop(1, "#5c1832"); ctx.fillStyle = g; ctx.fill(); ctx.clip();
      ctx.beginPath(); ctx.ellipse(mx, top + hh * 0.95, ww * 0.32, hh * 0.42, 0, 0, 6.2832); ctx.fillStyle = "#ef7f99"; ctx.fill(); ctx.restore();
      ctx.save(); A(a); ctx.beginPath(); ctx.moveTo(mx - ww / 2, top); ctx.quadraticCurveTo(mx, top + hh * 0.18, mx + ww / 2, top); ctx.ellipse(mx, top, ww / 2, hh, 0, 0, Math.PI); ctx.closePath(); ctx.strokeStyle = "#13233f"; ctx.lineWidth = Math.max(2, mw * 0.06); ctx.stroke(); ctx.restore(); }
    // blink: on a scratch canvas, skin + his own eye squashed toward a closed line, then feathered with a radial mask so no hard edge shows
    if (bl > 0) r.eyes.forEach(([ex, ey, er], k) => { const [c1, c2] = r.skin[k] || ["#1d97d9", "#1880c0"], rx = er * 1.3, ry = er * 1.22, sq = 1 - bl * 0.94, img = IMG[pose];
      const S = Math.ceil(Math.max(rx, ry) * 2 + 8); if (!BLC || BLC.width < S) { BLC = document.createElement("canvas"); BLC.width = BLC.height = Math.max(S, 256); } const b = BLC.getContext("2d");
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, BLC.width, BLC.height); const ox = S / 2 - ex, oy = S / 2 - ey;
      const g = b.createLinearGradient(0, ey - ry + oy, 0, ey + ry + oy); g.addColorStop(0, c1); g.addColorStop(1, c2); b.fillStyle = g; b.fillRect(0, 0, S, S);
      const cy = ey + ry * 0.3 * bl; b.drawImage(img, ex - rx, ey - ry, rx * 2, ry * 2, ex - rx + ox, cy - ry * sq + oy, rx * 2, ry * 2 * sq);
      if (bl > 0.55) { b.globalAlpha = clamp((bl - 0.55) * 3); b.beginPath(); b.moveTo(ex - er * 0.95 + ox, cy - er * 0.05 + oy); b.quadraticCurveTo(ex + ox, cy + er * 0.3 + oy, ex + er * 0.95 + ox, cy - er * 0.05 + oy); b.strokeStyle = "#102347"; b.lineWidth = er * 0.14; b.lineCap = "round"; b.stroke(); b.globalAlpha = 1; }
      b.globalCompositeOperation = "destination-in"; b.setTransform(rx / ry, 0, 0, 1, S / 2 * (1 - rx / ry), 0); const m = b.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, ry); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(0.72, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)"); b.fillStyle = m; b.fillRect(0, 0, S, S);
      ctx.save(); A(a); ctx.drawImage(BLC, 0, 0, S, S, ex - S / 2, ey - S / 2, S, S); ctx.restore(); });
  } : null });
}
// small confetti in brand colours
function sparkle(x, y, t0, o = {}) { const { n = 26, r = 260, dur = 1.0 } = o, u = (NOW - t0) / dur; if (u <= 0 || u >= 1) return; const cols = [C.teal, C.teal2, C.navy, C.gold];
  for (let i = 0; i < n; i++) { const an = rnd(i + 3) * 6.2832, sp = (0.4 + 0.6 * rnd(i * 5 + 1)) * r, e = eo(u); const px = x + Math.cos(an) * sp * e, py = y + Math.sin(an) * sp * e + 160 * u * u, s = 9 * (1 - u * 0.6);
    withT(px, py, 1, 1, an + u * 5, () => fillRR(-s, -s / 2.5, s * 2, s / 1.25, 3, cols[i % 4], 1 - u * u)); } }

// ---------- captions: the spoken line, big, at the top (fixed zone y 300..470)
// Two lines break where the sentence/phrase breaks (after . ؟ ! … then ، :), never mid-phrase, and the 2nd line
// appears when it is spoken (snapped to the voice's phrase onsets). One caption at a time.
function phraseWrap(s, size, maxW) {
  if (s.includes("|")) { const [p1, p2] = s.split("|").map((x) => x.trim()); return { lines: [tokens(p1), tokens(p2)], cut: p1.length / (s.length - 1), rank: 0 }; } // manual break
  const tk = tokens(s), sp = measure(" ", size), ws = tk.map((k) => measure(k.s, size, 900, k.lat ? "mono" : "Cairo")), tot = ws.reduce((p, q) => p + q, 0) + sp * (tk.length - 1);
  if (tot <= maxW || tk.length < 2) return { lines: [tk], cut: 0, rank: 0 };
  let best = null;
  for (let b = 1; b < tk.length; b++) {
    const w1 = ws.slice(0, b).reduce((p, q) => p + q, 0) + sp * (b - 1), w2 = tot - w1 - sp; if (w1 > maxW || w2 > maxW) continue;
    const end = tk[b - 1].s, rank = /[.؟!…]$/.test(end) ? 0 : /[،:]$/.test(end) ? 1 : 2, score = rank * 10000 + Math.abs(w1 - w2);
    if (!best || score < best.score) best = { b, score, rank };
  }
  if (!best) return { lines: wrap(s, size, maxW), cut: 0, rank: 3 };
  return { lines: [tk.slice(0, best.b), tk.slice(best.b)], cut: tk.slice(0, best.b).map((k) => k.s).join(" ").length / s.length, rank: best.rank };
}
// Headline lockup (same design in every scene, like the brand posts): a teal dash, a small navy kicker, a big navy punch line
// with its key words in teal over a highlighter stroke. Fixed slots: dash y 232, kicker y 300, punch y 402.
// Words rise out of an invisible baseline mask; a word that is the same as in the previous headline stays still.
const HL = { dashY: 232, kY: 300, pY: 402, kSize: 50, pSize: 96, maxW: 960 };
function lineLayout(str, size, maxW, fam) {
  const tk = tokens(str), sp = measure(" ", size), z = (s2) => tk.reduce((p, k) => p + measure(k.s, s2, 900, k.lat ? "mono" : "Cairo"), 0) + measure(" ", s2) * (tk.length - 1);
  let sz = size, tot = z(sz); if (tot > maxW) { sz = Math.floor(sz * maxW / tot); tot = z(sz); }
  const ws = tk.map((k) => measure(k.s, sz, 900, k.lat ? "mono" : "Cairo")), sp2 = measure(" ", sz); let cur = W / 2 + tot / 2; const xs = [];
  tk.forEach((k, i) => { xs.push(cur - ws[i] / 2); cur -= ws[i] + sp2; }); return { tk, ws, xs, sz };
}
function headlineLine(str, y, size, t0, a, o) {
  if (!str || a <= 0) return; const { tk, ws, xs, sz } = lineLayout(str, size, HL.maxW), em = (o.em || "").split(" ").filter(Boolean), prev = o.prev ? tokens(o.prev).map((k) => k.s) : [];
  const isEm = (w) => em.includes(w) || em.includes(w.replace(/[،.؟!:…]/g, ""));
  // highlighter stroke behind the emphasised run (grows right -> left, the reading direction)
  const emIdx = tk.map((k, i) => (isEm(k.s) ? i : -1)).filter((i) => i >= 0);
  if (emIdx.length && o.marker) { const xr = Math.max(...emIdx.map((i) => xs[i] + ws[i] / 2)) + 14, xl = Math.min(...emIdx.map((i) => xs[i] - ws[i] / 2)) - 14, u = eo(P(NOW, t0 + emIdx[0] * 0.07 + 0.28, 0.42));
    if (u > 0) { const w = (xr - xl) * u; fillRR(xr - w, y + sz * 0.05, w, sz * 0.38, sz * 0.12, hexA(C.teal, 0.2), a); } }
  tk.forEach((k, i) => {
    const still = prev[i] === k.s, u = still || o.instant ? 1 : eo(P(NOW, t0 + i * 0.07, 0.42)); if (u <= 0) return;
    ctx.save(); rr(xs[i] - ws[i] / 2 - 30, y - sz * 0.95, ws[i] + 60, sz * 1.55, 0); ctx.clip();
    T(k.s, xs[i], y + (1 - u) * sz * 0.95, { size: sz, color: isEm(k.s) ? (o.emColor || C.teal) : o.color || C.navy, a, fam: k.lat ? "mono" : "Cairo", weight: 900 }); ctx.restore();
  });
}
function captions(t) {
  const Ls = TL.lines.filter((l) => l.cap && !l.cap.hold);
  for (let n = 0; n < Ls.length; n++) {
    const l = Ls[n], c = l.cap, nx = Ls[n + 1], pv = Ls[n - 1] ? Ls[n - 1].cap : null;
    const tk0 = l.instant ? -1 : l.t0 - 0.12, end = nx ? nx.t0 - 0.12 : TL.total;
    const pAtT = c.pAt ? Math.max(tk0 + 0.25, AT(l.i, c.pAt) - 0.05) : tk0 + 0.3, tp0 = l.instant ? -1 : (c.k ? pAtT : tk0);
    const carryNext = nx && nx.cap.k && c.k && tokens(nx.cap.k)[0].s === tokens(c.k)[0].s; // e.g. "محاولة 1" -> "محاولة 2": no fade between them
    const a = P(t, tk0, 0.12) * (carryNext ? (t < end ? 1 : 0) : 1 - P(t, end - 0.16, 0.16)); if (a <= 0 || t > end) continue;
    const carry = pv && pv.k && c.k && tokens(pv.k)[0].s === tokens(c.k)[0].s;
    // teal dash (brand rhythm), always in the same place
    const du = carry ? 1 : eo(P(t, tk0, 0.3)); fillRR(W / 2 - 34 * du, HL.dashY, 68 * du, 9, 5, C.teal, a);
    headlineLine(c.k, HL.kY, HL.kSize, tk0, a, { em: c.p ? "" : c.em, prev: carry ? pv.k : null, color: C.ink, instant: l.instant, marker: !c.p });
    headlineLine(c.p, HL.pY, HL.pSize, tp0, a, { em: c.em, instant: l.instant, marker: true });
  }
}

// ---------- timing helpers
const L0 = (i) => TL.lines[i].t0, L1 = (i) => TL.lines[i].t1, SG = (i, j) => TL.lines[i].segs[Math.min(j, TL.lines[i].segs.length - 1)];
// time a word is spoken: its position in the sentence, snapped to the nearest voiced-phrase onset (robust to how a take pauses)
function atFrac(l, frac) { const est = l.t0 + (l.t1 - l.t0) * frac; let b = est, bd = 0.4; for (const sg of l.segs) if (Math.abs(sg - est) < bd) { bd = Math.abs(sg - est); b = sg; } return b; }
const AT = (i, w) => { const l = TL.lines[i], k = l.text.indexOf(w); return atFrac(l, k < 0 ? 0.5 : k / l.text.length); };
const SCENES = {};
function render(t) {
  NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0; ctx.filter = "none";
  background(t);
  for (const name of SCENES.order) SCENES[name](t);
  captions(t);
  const fade = P(t, TL.total - 0.4, 0.4); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
window.setup = async (tl) => {
  TL = tl; TL.scenes.forEach((s) => (SCN[s.name] = s)); cv = document.getElementById("c"); ctx = cv.getContext("2d");
  for (const [fam, file, w] of [["Cairo", "cairo-800.ttf", 800], ["Cairo", "cairo-900.ttf", 900], ["JBMono", "jbmono-800.ttf", 800]]) { const f = new FontFace(fam, `url(assets/${file})`, { weight: String(w) }); await f.load(); document.fonts.add(f); }
  META = await (await fetch("assets/k/meta.json")).json();
  RIG = await (await fetch("assets/k/rig.json")).json();
  await Promise.all(Object.keys(META).map((k) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = `assets/k/${k}.png`; })));
  await document.fonts.ready; render(0); return TL.total;
};
window.seek = (t) => { window.scrollTo(0, 0); render(t); };
