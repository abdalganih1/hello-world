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
  const m = META[name], w = h * m.w / m.h, by = Math.sin(NOW * 2.4 + x * 0.01) * 0.01 * h * bob;
  if (shadow) { ctx.save(); A(a * 0.22 * shadow); ctx.beginPath(); ctx.ellipse(x, y + h * 0.01, w * 0.34, h * 0.025, 0, 0, 6.2832); ctx.fillStyle = "#1d3557"; ctx.filter = "blur(6px)"; ctx.fill(); ctx.restore(); }
  ctx.save(); A(a); ctx.translate(x, y + by); ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
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
function captions(t) {
  for (const l of TL.lines) {
    const next = TL.lines[l.i + 1], end = next ? Math.min(next.t0 - 0.06, l.t1 + 1.2) : TL.total, size = 66, maxW = 940, txt = l.caption || l.text;
    const t0 = l.instant ? -1 : l.t0 - 0.06, a = win(t, t0, end, 0.12); if (a <= 0) continue;
    let { lines, cut, rank } = phraseWrap(txt, size, maxW), sz = size;
    if (rank > 1) for (const s2 of [60, 56]) { const r2 = phraseWrap(txt, s2, maxW); if (r2.rank <= 1) { ({ lines, cut } = r2); sz = s2; break; } }
    { const lw = (ln, z) => ln.reduce((p, k) => p + measure(k.s, z, 900, k.lat ? "mono" : "Cairo"), 0) + measure(" ", z) * (ln.length - 1); const wmax = Math.max(...lines.map((ln) => lw(ln, sz))); if (wmax > maxW) sz = Math.max(46, Math.floor(sz * maxW / wmax)); }
    if (lines.length > 2) { // long line: show it phrase by phrase (split at ، ), each when it is spoken, one phrase at a time
      const parts = txt.split(/،\s*/); let pos = 0; const st = parts.map((p) => { const f = pos / txt.length; pos += p.length + 2; return atFrac(l, f); });
      parts.forEach((pt, j) => { const c0 = j ? st[j] - 0.06 : t0, c1 = j + 1 < parts.length ? st[j + 1] - 0.08 : end, ca = win(t, c0, c1, 0.12); if (ca <= 0) return;
        const pw = phraseWrap(pt + (j + 1 < parts.length ? "،" : ""), size, maxW), ys2 = pw.lines.length === 1 ? [385] : [338, 432]; pw.lines.forEach((ln, k) => wordsLine(ln, W / 2, ys2[k], c0 + k * 0.15, { size, a: ca, hl: l.hl, step: 0.05 })); });
      continue; }
    let t2 = t0; if (lines.length === 2 && !l.instant) { const est = l.t0 + cut * (l.t1 - l.t0); let bestT = est, bd = 0.8;
      for (const sg of l.segs.slice(1)) if (Math.abs(sg - est) < bd) { bd = Math.abs(sg - est); bestT = sg; } t2 = Math.max(t0 + 0.25, bestT - 0.05); }
    const ys = lines.length === 1 ? [385] : [338, 432];
    lines.forEach((ln, k) => wordsLine(ln, W / 2, ys[k], k ? t2 : t0, { size: sz, a, hl: l.hl, step: 0.06, instant: l.instant }));
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
  await Promise.all(Object.keys(META).map((k) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = `assets/k/${k}.png`; })));
  await document.fonts.ready; render(0); return TL.total;
};
window.seek = (t) => { window.scrollTo(0, 0); render(t); };
