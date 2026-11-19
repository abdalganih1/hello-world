// الحلقة 05 · الدارة ولوحة التجارب. 12 scenes; each gets (t, L, E, S, ls): L(k)/E(k) = start/end of its k-th spoken line.
"use strict";
const win = (t, a, b, f = 0.3) => P(t, a, f) * (1 - P(t, b - f, f));
const blink = (t, per = 1) => (Math.floor(t / per) % 2 === 0 ? 1 : 0);
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- code: tokenizer + coloured line (LTR, mono). Returns token boxes so a scene can point at any token.
const CODE = ["void setup() {", "  pinMode(13, OUTPUT);", "}", "", "void loop() {", "  digitalWrite(13, HIGH);", "  delay(1000);", "  digitalWrite(13, LOW);", "  delay(1000);", "}"];
function tokCol(s) {
  if (s.startsWith("//")) return C.mut;
  if (s === "void") return C.violet;
  if (s === "setup" || s === "loop") return C.teal;
  if (/^(pinMode|digitalWrite|digitalwrite|delay)$/.test(s)) return C.blue;
  if (/^(HIGH|LOW|OUTPUT)$/.test(s) || /^\d+$/.test(s)) return C.amber;
  return C.text;
}
function codeLine(s, x, y, o = {}) {
  const { size = 34, a = 1, n = 1e9, colors = {}, hide = {} } = o; const toks = s.match(/\/\/.*$|[A-Za-z_]+|\d+|\s+|./g) || []; let cx = x, used = 0; const out = [];
  ctx.save(); ctx.font = font(size, 800, "mono");
  for (const k of toks) { const w = ctx.measureText(k).width; const vis = Math.max(0, Math.min(k.length, n - used)); used += k.length;
    if (vis > 0 && !hide[out.length] && k.startsWith("//") && isAr(k)) { // like a real editor: "//" on the left, then the Arabic note (RTL) right after it
      const sl = ctx.measureText("// ").width; T("//", cx, y, { size, weight: 800, fam: "mono", align: "left", color: C.mut, a }); if (vis > 3) T(k.slice(3, vis), cx + sl, y, { size: size * 0.95, weight: 800, align: "left", color: C.mut, a }); }
    else if (vis > 0 && !hide[out.length]) T(k.slice(0, vis), cx, y, { size, weight: 800, fam: "mono", align: "left", color: colors[out.length] || tokCol(k), a });
    out.push({ s: k, x: cx, w }); cx += w; }
  ctx.restore(); return out;
}
const lineW = (s, size) => measure(s, size, 800, "mono");
function editor(x, y, w, h, a, title = "blink.ino") {
  card(x, y, w, h, { a, col: C.blue, r: 18, fill: "rgba(6,12,24,0.97)" });
  [C.red, C.amber, C.green].forEach((c, i) => circle(x + 30 + i * 26, y + 28, 8, c, a)); T(title, x + w / 2, y + 28, { size: 22, weight: 800, fam: "mono", color: C.mut, a });
}
// the whole blink program in an editor; hl = index of the highlighted line (-1 none), prog = typed characters
function codePanel(x, y, a, o = {}) {
  const { hl = -1, prog = 1e9, size = 30, lh = 46, hlCol = C.amber, title, lines = CODE } = o; const w = 620, h = 90 + lines.length * lh;
  editor(x, y, w, h, a, title); let used = 0;
  lines.forEach((s, i) => { const yy = y + 76 + i * lh;
    if (Array.isArray(hl) ? hl.includes(i) : hl === i) { fillRR(x + 14, yy - lh / 2 + 2, w - 28, lh - 4, 10, hexA(hlCol, 0.16), a); fillRR(x + 14, yy - lh / 2 + 2, 6, lh - 4, 3, hlCol, a); }
    T(String(i + 1), x + 44, yy, { size: 20, weight: 800, fam: "mono", color: C.dim, a }); codeLine(s, x + 72, yy, { size, a, n: prog - used }); used += s.length; });
  return { lineY: (i) => y + 76 + i * lh, x, w };
}
function bigCode(s, cx, y, size, a, o = {}) { const w = lineW(s, size); const toks = codeLine(s, cx - w / 2, y, { size, a, ...o }); return { toks, x0: cx - w / 2, w }; }
const tokBox = (toks, i) => toks[Math.min(i, toks.length - 1)];
function confetti(cx, cy, t0, a = 1) { const w = P(NOW, t0, 2.2); if (w <= 0 || w >= 1) return; for (let i = 0; i < 60; i++) { const an = rnd(i) * Math.PI * 2, sp = 260 + rnd(i + 3) * 420; withT(cx + Math.cos(an) * sp * eo(w), cy + Math.sin(an) * sp * eo(w) + w * w * 240, 1, w * 10 * (rnd(i + 5) - 0.5), () => fillRR(-7, -4, 14, 8, 2, [C.teal, C.amber, C.violet, C.pink, C.green][i % 5], (1 - w) * a)); } }



// ---------- drawings for electricity
const WATER = "#4da3ff";
// particles moving along a polyline; speed = cycles/s, n = count; for water (blue dots) or charge (amber dots)
function flow(pts, t, col, n, speed, r = 7, a = 1, slow = null) {
  for (let i = 0; i < n; i++) { let u = ((t * speed + i / n) % 1 + 1) % 1; if (slow) u = slow(u, i); const [x, y] = along(pts, u); circle(x, y, r, col, a * 0.9); halo(x, y, r * 3, hexA(col, 0.35), a * 0.6); }
}
function tank(x, y, a, level = 0.8) {
  fillRR(x - 26, y + 120, 12, 160, 4, "#2a3a58", a); fillRR(x + 14, y + 120, 12, 160, 4, "#2a3a58", a); // legs
  card(x - 130, y - 100, 260, 220, { a, col: WATER, r: 26, fill: "rgba(10,20,40,0.95)" });
  A(a); rr(x - 124, y - 94 + 208 * (1 - level), 248, 208 * level, 20); const g = ctx.createLinearGradient(0, y - 100, 0, y + 120); g.addColorStop(0, "rgba(77,163,255,0.85)"); g.addColorStop(1, "rgba(30,90,180,0.9)"); ctx.fillStyle = g; ctx.fill();
  for (let i = 0; i < 3; i++) { const wy = y - 94 + 208 * (1 - level) + Math.sin(NOW * 2 + i) * 3; seg(x - 110 + i * 70, wy, x - 70 + i * 70, wy, "rgba(200,230,255,0.6)", 3, a); }
}
function pipe(pts, w, a, col = "#2a3a58") { poly(pts, col, w + 8, a); poly(pts, "rgba(10,20,40,0.95)", w, a); }
function battery(x, y, s, label, col, a = 1) {
  withT(x, y, s, 0, () => { card(-60, -110, 120, 220, { a, col, r: 18, fill: "rgba(10,18,34,0.96)" }); fillRR(-24, -128, 48, 18, 5, col, a);
    T("+", 0, -70, { size: 46, weight: 900, color: col, a }); T("−", 0, 70, { size: 46, weight: 900, color: C.mut, a }); T(label, 0, 0, { size: 34, weight: 900, fam: "mono", color: C.text, a }); });
}
const BC = { brown: "#8b4513", black: "#141414", red: "#e0262b", gold: "#d4af37" };
const BANDS = { 1000: [BC.brown, BC.black, BC.red, BC.gold], 220: [BC.red, BC.red, BC.brown, BC.gold] }; // colour code: 1st digit, 2nd digit, multiplier | tolerance
function resistor(x, y, s, a = 1, val = 1000, rot = 0) {
  withT(x, y, s, rot, () => { seg(-110, 0, -50, 0, "#b9c2cf", 6, a); seg(50, 0, 110, 0, "#b9c2cf", 6, a);
    fillRR(-56, -22, 112, 44, 20, "#d9c08f", a); BANDS[val].forEach((c, i) => fillRR(-38 + i * 20 + (i === 3 ? 12 : 0), -22, 9, 44, 2, c, a)); });
}
function ledPart(x, y, s, on = 0, a = 1, col = C.red, burnt = 0) {
  withT(x, y, s, 0, () => { if (on > 0) halo(0, -20, 150, hexA(col, 0.75), a * on);
    seg(-14, 30, -14, 90, "#b9c2cf", 5, a); seg(14, 30, 14, 76, "#b9c2cf", 5, a);
    A(a); ctx.beginPath(); ctx.arc(0, -16, 32, Math.PI, 0); ctx.lineTo(32, 30); ctx.lineTo(-32, 30); ctx.closePath(); ctx.fillStyle = burnt ? "#3a3a3a" : on > 0 ? col : hexA(col, 0.55); ctx.fill(); fillRR(-38, 26, 76, 10, 4, burnt ? "#2a2a2a" : hexA(col, 0.8), a);
    if (on > 0) circle(-10, -26, 8, "rgba(255,255,255,0.8)", a * on); });
}
const ledLegs = (x, y, s) => ({ an: [x - 14 * s, y + 90 * s], ca: [x + 14 * s, y + 76 * s] }); // anode = long leg (+), cathode = short leg (−)
function legTags(x, y, s, a) { const g = ledLegs(x, y, s); T("+", g.an[0] - 26, g.an[1] - 30, { size: 30, weight: 900, color: C.amber, a }); T("−", g.ca[0] + 26, g.ca[1] - 30, { size: 30, weight: 900, color: C.mut, a }); }
function spark(x, y, t0, a = 1) { const w = P(NOW, t0, 1.2); if (w <= 0 || w >= 1) return; for (let i = 0; i < 26; i++) { const an = rnd(i) * Math.PI * 2, sp = 60 + rnd(i + 3) * 220; seg(x + Math.cos(an) * sp * eo(w) * 0.5, y + Math.sin(an) * sp * eo(w) * 0.5, x + Math.cos(an) * sp * eo(w), y + Math.sin(an) * sp * eo(w), i % 2 ? C.amber : "#fff", 3, a * (1 - w)); } halo(x, y, 260 * (1 - w) + 60, "rgba(255,190,60,0.7)", a * (1 - w)); }
function smoke(x, y, t0, a = 1) { if (NOW < t0) return; for (let i = 0; i < 6; i++) { const u = ((NOW - t0) * 0.5 + i / 6) % 1; circle(x + Math.sin(u * 6 + i) * 20, y - u * 200, 16 + u * 30, "rgba(120,130,150,0.35)", a * (1 - u)); } }
// a rectangular circuit loop: battery (left), resistor (top), LED (right); returns the loop path (clockwise from +)
function loopPath() { return null; }
function breadboard(x, y, w, h, a) { card(x, y, w, h, { a, col: "#c9d3df", r: 14, fill: "rgba(225,230,238,0.95)", g: 0 });
  seg(x + 20, y + 22, x + w - 20, y + 22, C.red, 3, a); seg(x + 20, y + h - 22, x + w - 20, y + h - 22, C.blue, 3, a);
  for (let c = 0; c < Math.floor((w - 60) / 24); c++) for (let r = 0; r < 10; r++) { const yy = y + 56 + r * 24 + (r >= 5 ? 22 : 0); if (yy > y + h - 50) continue; fillRR(x + 30 + c * 24, yy, 9, 9, 2, "#6b7685", a); }
  fillRR(x + 20, y + h / 2 - 6, w - 40, 12, 4, "rgba(180,188,200,0.9)", a); }

const LEDPOS = { L: [300, 104], TX: [300, 139], RX: [300, 163], ON: [572, 196] };
function boardLed(bx, by, bs, k, v, col, a = 1) { if (v <= 0) return; const [x, y] = unoPt(bx, by, bs, LEDPOS[k][0], LEDPOS[k][1]); halo(x, y, 90 * bs / 0.5, hexA(col, 0.75), a * v); circle(x, y, 9 * bs / 0.5, "#ffffff", a * v); }
const BLINK = (t, on, off) => ((t % (on + off)) < on ? 1 : 0);

// ---------- an accurate half-size breadboard: 30 columns; rows a–e (top half) and f–j (bottom half) split by the trench;
// each column's a–e are one metal strip, f–j another; the + (red) and − (blue) rails run along the top and the bottom.
const BB = { x: 760, y: 250, w: 1000, h: 470, cols: 30, sp: 30 };
const ROWS = "abcdefghij";
function hole(c, r) { const ri = typeof r === "string" ? ROWS.indexOf(r) : r; const x = BB.x + 65 + c * BB.sp, y = BB.y + 130 + ri * 28 + (ri >= 5 ? 44 : 0); return [x, y]; }
function rail(c, which) { const x = BB.x + 65 + c * BB.sp; return [x, which === "+" ? BB.y + 34 : which === "-" ? BB.y + 66 : which === "+b" ? BB.y + BB.h - 66 : BB.y + BB.h - 34]; }
function bboard(a, o = {}) {
  const { strips = 0, railsHot = 0, trench = 0, colHot = -1 } = o;
  card(BB.x, BB.y, BB.w, BB.h, { a, col: "#c9d3df", r: 16, fill: "rgba(226,231,239,0.97)", g: 0 });
  // rails
  [["+", C.red], ["-", C.blue], ["+b", C.red], ["-b", C.blue]].forEach(([k, col]) => { const y = rail(0, k)[1]; seg(BB.x + 40, y + (k.startsWith("+") ? -16 : 16) * (k.endsWith("b") ? -1 : 1), BB.x + BB.w - 40, y + (k.startsWith("+") ? -16 : 16) * (k.endsWith("b") ? -1 : 1), col, 3, a);
    if (railsHot > 0) fillRR(BB.x + 55, y - 7, BB.w - 110, 14, 7, hexA(col, 0.45), a * railsHot);
    for (let c = 0; c < BB.cols; c++) if (c % 6 !== 5) { const [x] = rail(c, k); fillRR(x - 5, y - 5, 10, 10, 2, "#5f6a79", a); } });
  T("+", BB.x + 24, rail(0, "+")[1], { size: 30, weight: 900, color: C.red, a }); T("−", BB.x + 24, rail(0, "-")[1], { size: 30, weight: 900, color: C.blue, a });
  // trench
  fillRR(BB.x + 30, BB.y + 130 + 4 * 28 + 16, BB.w - 60, 14, 5, trench > 0 ? hexA(C.amber, 0.5 + 0.3 * trench) : "rgba(170,178,190,0.9)", a);
  // column numbers + row letters
  for (let c = 0; c < BB.cols; c += 5) T(String(c + 1), hole(c, 0)[0], BB.y + 104, { size: 16, weight: 800, fam: "mono", color: "#6b7685", a });
  for (let r = 0; r < 10; r++) T(ROWS[r], BB.x + 40, hole(0, r)[1], { size: 16, weight: 800, fam: "mono", color: "#6b7685", a });
  // metal strips under the holes (shown when explaining)
  if (strips > 0) for (let c = 0; c < BB.cols; c++) [[0, 4], [5, 9]].forEach(([r0, r1]) => { const [x, y0] = hole(c, r0), y1 = hole(c, r1)[1]; const hot = c === colHot; fillRR(x - 7, y0 - 10, 14, y1 - y0 + 20, 7, hot ? hexA(C.amber, 0.75) : "rgba(184,140,60,0.35)", a * strips); });
  for (let c = 0; c < BB.cols; c++) for (let r = 0; r < 10; r++) { const [x, y] = hole(c, r); fillRR(x - 5, y - 5, 10, 10, 2, "#5f6a79", a); }
}
const GNDW = "#23272f";
// a jumper wire between two points, with a soft sag
function jumper(p0, p1, col, a, u = 1, lift = 60) { if (u <= 0) return; const pts = []; for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push([lerp(p0[0], p1[0], s), lerp(p0[1], p1[1], s) - Math.sin(s * Math.PI) * lift]); }
  pathPartial(pts, u, "rgba(0,0,0,0.35)", 13, a); if (col === GNDW) pathPartial(pts, u, "#8d99ab", 11, a); pathPartial(pts, u, col, 8, a); if (u >= 1) { circle(p0[0], p0[1], 7, "#cfd6df", a); circle(p1[0], p1[1], 7, "#cfd6df", a); } return pts; }
// a resistor whose two leads end exactly in two holes
function resistorAt(p0, p1, a, val = 220, sc = 1) { const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  withT((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 16 * sc, sc, ang, () => { seg(-L / 2 / sc, 16, -38, 0, "#b9c2cf", 4, a); seg(38, 0, L / 2 / sc, 16, "#b9c2cf", 4, a); fillRR(-40, -14, 80, 28, 12, "#d9c08f", a); BANDS[val].forEach((c, i) => fillRR(-28 + i * 13 + (i === 3 ? 10 : 0), -14, 6, 28, 2, c, a)); }); }
// an LED standing in two holes: anode (long, +) in pa, cathode (short, −) in pc; flat rim on the cathode side
function ledAt(pa, pc, a, on = 0, col = C.red, s = 0.7, tags = 0) { const cx = (pa[0] + pc[0]) / 2, top = Math.min(pa[1], pc[1]) - 70;
  if (on > 0) halo(cx, top, 120, hexA(col, 0.75), a * on);
  seg(pa[0], pa[1], cx - 8, top + 32, "#b9c2cf", 4, a); seg(pc[0], pc[1], cx + 8, top + 32, "#b9c2cf", 4, a);
  A(a); ctx.beginPath(); ctx.arc(cx, top, 22, Math.PI, 0); ctx.lineTo(cx + 22, top + 26); ctx.lineTo(cx - 22, top + 26); ctx.closePath(); ctx.fillStyle = on > 0 ? col : hexA(col, 0.55); ctx.fill();
  fillRR(cx - 27, top + 22, 54, 8, 3, hexA(col, 0.85), a); fillRR(cx + 20, top + 20, 7, 12, 1, "rgba(230,235,245,0.9)", a); // flat side (cathode)
  if (on > 0) circle(cx - 7, top - 7, 6, "rgba(255,255,255,0.8)", a * on);
  if (tags > 0) { const dx = pa[0] <= pc[0] ? -1 : 1; T("+", pa[0] + dx * 22, pa[1] - 34, { size: 34, weight: 900, color: C.amber, a: a * tags }); T("−", pc[0] - dx * 22, pc[1] - 34, { size: 34, weight: 900, color: C.blue, a: a * tags }); } }
// the closed loop the current follows: pin 13 -> wire -> resistor -> LED -> wire -> blue rail -> GND
function LOOP() { const sag = (p0, p1, lift) => { const o = []; for (let i = 0; i <= 12; i++) { const s = i / 12; o.push([lerp(p0[0], p1[0], s), lerp(p0[1], p1[1], s) - Math.sin(s * Math.PI) * lift]); } return o; };
  return [...sag(pinPt("13"), hole(11, "a"), 60), hole(11, "c"), hole(15, "c"), hole(15, "d"), hole(16, "d"), hole(16, "a"), ...sag(hole(16, "a"), rail(16, "-"), 30), rail(2, "-"), ...sag(rail(2, "-"), pinPt("GND"), 80)]; }
// Arduino pins on the top header (board coordinates from js/art.js): 13 at x 286, GND at x 261
const UNO = { x: 400, y: 470, s: 0.62 };
const pinPt = (name) => unoPt(UNO.x, UNO.y, UNO.s, name === "13" ? 286 : name === "12" ? 312 : name === "8" ? 413 : 261, 24);
function bigLED(x, y, s, a, o = {}) { const { on = 0, flip = 0, tags = 1 } = o; // a big LED with its legs labelled
  withT(x, y, s, 0, () => { if (on > 0) halo(0, -40, 220, "rgba(255,90,106,0.7)", a * on);
    seg(-22, 40, -22, 260, "#b9c2cf", 8, a); seg(22, 40, 22, 200, "#b9c2cf", 8, a);
    A(a); ctx.beginPath(); ctx.arc(0, -30, 70, Math.PI, 0); ctx.lineTo(70, 40); ctx.lineTo(-70, 40); ctx.closePath(); ctx.fillStyle = on > 0 ? C.red : hexA(C.red, 0.6); ctx.fill();
    fillRR(-82, 32, 164, 18, 6, hexA(C.red, 0.85), a); fillRR(62, 26, 22, 30, 2, "#0a1222", a); // flat side on the right (cathode)
    if (on > 0) circle(-22, -50, 14, "rgba(255,255,255,0.8)", a * on); });
  if (tags) { T("+", x - 22 * s - 46, y + 230 * s, { size: 54, weight: 900, color: C.amber, a: a * tags }); T("−", x + 22 * s + 46, y + 180 * s, { size: 54, weight: 900, color: C.blue, a: a * tags }); }
}

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.3, 0.7)); bboard(a * 0.9); const pa = hole(15, "d"), pc = hole(16, "d"), on = t > L(1) + 0.6 ? BLINK(t, 0.5, 0.5) : 0;
  resistorAt(hole(11, "c"), hole(15, "c"), a); ledAt(pa, pc, a, on); jumper(pinPt("13"), hole(11, "a"), C.amber, a); jumper(hole(16, "a"), rail(16, "-"), GNDW, a, 1, 30); jumper(rail(2, "-"), pinPt("GND"), GNDW, a, 1, 80);
  uno(UNO.x, UNO.y, UNO.s, { a, led: on }); TW("أول دارة حقيقية", 960, 150, L(0) + 1.2, { size: 66, weight: 900, colors: { "حقيقية": C.teal }, g: 18 });
  if (t > L(1) - 0.1) chip("بلا لحام · بلا أدوات ✓", 1260, 800, { size: 32, col: C.teal, a: pop(t, L(1) + 1.6, 0.45) });
};

// ---------------------------------------------------------------- 2. TITLE + what you need
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.14)", 1);
  chip("الحلقة 05", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("الدارة… ولوحة التجارب", 0, 0, L(0) + 0.3, { size: 104, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "لوحة": C.teal } }));
  if (t > L(1) - 0.2) [["لوحة التجارب", (x, y, p) => { const s = 0.24; card(x - 110, y - 50, 220, 100, { a: p, col: "#c9d3df", r: 10, fill: "rgba(226,231,239,0.97)", g: 0 }); for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) fillRR(x - 90 + i * 22, y - 32 + j * 20, 6, 6, 1, "#5f6a79", p); }],
    ["LED", (x, y, p) => bigLED(x, y - 30, 0.32, p, { on: 1, tags: 0 })], ["مقاوم 220 Ω", (x, y, p) => resistorAt([x - 90, y + 10], [x + 90, y + 10], p)], ["أسلاك", (x, y, p) => { jumper([x - 80, y + 20], [x + 80, y + 20], C.amber, p, 1, 40); jumper([x - 80, y + 40], [x + 80, y + 40], C.blue, p, 1, 30); }]]
    .forEach(([s, draw], i) => { const p = clamp(pop(t, L(1) + 0.6 + i * 0.7, 0.45)), x = 1500 - i * 380, y = 600; withT(x, y, p || 0.001, 0, () => { card(-160, -120, 320, 240, { col: C.teal, r: 26 }); draw(0, -20, 1); T(s, 0, 80, { size: 30, weight: 900, color: C.text }); }); });
};

// ---------------------------------------------------------------- 3. THE BREADBOARD
SCENES.breadboard = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), strips = P(t, L(1) + 0.4, 0.6) * (1 - P(t, L(5) - 0.2, 0.4)), col = t > L(2) && t < L(3) ? 10 : -1, tr = win(t, L(3) - 0.1, L(4), 0.3), rh = win(t, L(4) - 0.1, L(5), 0.3);
  bboard(a, { strips, colHot: col, trench: tr, railsHot: rh });
  if (t > L(0) + 1.0 && t < L(1)) { const p = eo(P(t, L(0) + 2.2, 0.6)); chip("ثقب = مكان لطرف القطعة", 1260, 820, { size: 30, col: C.teal, a: p }); }
  if (t > L(2) - 0.1 && t < L(3)) { const [x, y0] = hole(10, 0), y1 = hole(10, 4)[1]; ring(x, (y0 + y1) / 2, 90, C.amber, 4, 0.8); chip("5 ثقوب في عمود = موصولة", x, 820, { size: 30, col: C.amber, a: pop(t, L(2) + 0.6, 0.4) });
    const p0 = hole(10, 0), p1 = hole(10, 3); circle(p0[0], p0[1], 9, C.green, 1); circle(p1[0], p1[1], 9, C.green, 1); }
  if (tr > 0) { chip("المجرى يفصل النصفين", 960, 820, { size: 30, col: C.amber, a: tr }); const p0 = hole(10, 4), p1 = hole(10, 5); seg(p0[0], p0[1] + 12, p1[0], p1[1] - 12, C.red, 4, tr); I.cross(p0[0] + 60, (p0[1] + p1[1]) / 2, 0.5, { a: tr }); }
  if (rh > 0) { chip("+ الأحمر · − الأزرق", 960, 820, { size: 30, col: C.teal, a: rh }); }
  if (t > L(5) - 0.1) { const p = eo(P(t, L(5), 0.4)), u = ((t - L(5)) % 2.4) / 2.4, up = u < 0.5 ? eio(u * 2) : 1 - eio((u - 0.5) * 2), pa = hole(14, "d"), pc = hole(15, "d");
    ledAt([pa[0], pa[1] - up * 120], [pc[0], pc[1] - up * 120], a * p, 0); chip("ضع · انزع · جرّب ↺", 960, 820, { size: 30, col: C.teal, a: pop(t, L(5) + 0.6, 0.4) }); }
};

// ---------------------------------------------------------------- 4. THE LED
SCENES.led = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), flip = t > L(3) + 2.0 && t < L(4) - 0.2, on = t > L(3) && !flip ? 1 : 0;
  bigLED(700, 400, 1.2, a, { on, tags: P(t, L(1) + 0.6, 0.4) });
  TW("LED · ثنائي باعث للضوء", 1300, 220, L(0) + 0.6, { size: 52, weight: 900, colors: { "LED": C.red }, g: 14 });
  if (t > L(1) - 0.1) { chip("الطرف الطويل = موجب +", 1300, 380, { size: 32, col: C.amber, a: pop(t, L(1) + 0.8, 0.4) }); chip("الطرف القصير = سالب −", 1300, 470, { size: 32, col: C.blue, a: pop(t, L(1) + 2.4, 0.4) }); }
  if (t > L(2) - 0.1) { ring(700 + 88 * 1.2, 400 + 50, 46, C.blue, 5, a * (0.6 + 0.4 * Math.sin(t * 5))); chip("الجانب المسطح = السالب", 1300, 560, { size: 30, col: C.blue, a: pop(t, L(2) + 1.6, 0.4) }); }
  if (t > L(3) - 0.1) { arrow(560, 760, 860, 760, C.amber, 6, a, 22); T("+ → −", 710, 810, { size: 34, weight: 900, color: C.text, a }); T("اتجاه واحد فقط", 710, 860, { size: 32, weight: 900, color: C.amber, a });
    if (flip) { I.cross(700, 240, 1.0, { a }); chip("مقلوب ← لا يضيء", 1300, 660, { size: 30, col: C.red, a }); } }
  if (t > L(4) - 0.1) chip("يتحمل حوالي 20 mA فقط ⚠️", 1300, 660, { size: 32, col: C.amber, a: pop(t, L(4) + 1.4, 0.45) });
};

// ---------------------------------------------------------------- 5. WHICH RESISTOR? (Ohm's law with the LED's own voltage)
SCENES.resistor = (t, L, E) => {
  TW("كم أوم؟", 960, 160, L(0) + 1.6, { size: 76, weight: 900, colors: { "أوم؟": C.teal }, g: 18 });
  const a = eo(P(t, L(1) - 0.1, 0.5)); if (t < L(1) - 0.1) { resistorAt([660, 540], [1260, 540], eo(P(t, L(0), 0.5)), 220, 2.6); return; }
  // the voltage budget: 5 V = 2 V (LED) + 3 V (resistor)
  const x0 = 360, w = 1200, y = 290; fillRR(x0, y, w, 70, 18, "rgba(120,150,200,0.15)", a);
  const s2 = eo(P(t, L(1) + 3.0, 0.6)), s3 = eo(P(t, L(2), 0.6)); fillRR(x0 + w * 0.6, y, w * 0.4 * s2, 70, 18, hexA(C.red, 0.85), a); fillRR(x0, y, w * 0.6 * s3, 70, 18, hexA(C.teal, 0.85), a);
  T("5 V من الأردوينو", x0 + w / 2, y - 40, { size: 34, weight: 900, color: C.amber, a }); if (s2 > 0.5) T("LED ≈ 2 V", x0 + w * 0.8, y + 36, { size: 32, weight: 800, fam: "mono", color: "#fff", a }); if (s3 > 0.5) T("المقاوم 3 V", x0 + w * 0.3, y + 36, { size: 32, weight: 900, color: "#06101d", a });
  if (t > L(2) + 1.6) chip("I = 15 mA", 960, 420, { size: 34, col: C.blue, a: pop(t, L(2) + 2.6, 0.4) });
  if (t > L(3) - 0.1) { T("R = V ÷ I = 3 ÷ 0.015 = 200 Ω", 960, 520, { size: 58, weight: 800, fam: "mono", color: C.text, a: eo(P(t, L(3) + 0.3, 0.4)), g: 14 }); }
  if (t > L(4) - 0.1) { const p = eo(P(t, L(4), 0.5)); T("الأقرب في الأسواق:", 1060, 610, { size: 36, weight: 900, color: C.text, a: p }); T("220 Ω", 790, 610, { size: 54, weight: 800, fam: "mono", color: C.green, a: p, g: 18 });
    const R0 = [760, 700], R1 = [1160, 700], sc = 2.4; resistorAt(R0, R1, p, 220, sc);
    [["أحمر", BC.red, 0], ["أحمر", BC.red, 1], ["بني", BC.brown, 2]].forEach(([n, c, i]) => { const q = pop(t, L(4) + 3.0 + i * 0.5, 0.4), bx = 960 + (-28 + i * 13 + 3) * sc, cx = 760 + i * 200; seg(bx, 700 + 6, cx, 762, hexA(c, 0.9), 3, p * clamp(q)); chip(n, cx, 790, { size: 26, col: c, a: q }); }); }
};

// ---------------------------------------------------------------- 6. BUILD THE CIRCUIT, step by step (pin 13 -> R -> LED -> GND rail -> GND)
function circuitBuild(t, a, k, ts, o = {}) { // k = how many steps are placed (0..5); ts(i) = when step i appears
  const { on = 0, flipLed = 0, sameCol = 0, noGnd = 0, hl = -1, tags = 0 } = o;
  bboard(a); uno(UNO.x, UNO.y, UNO.s, { a, led: on }); const pa = sameCol ? hole(15, "b") : hole(15, "d"), pc = sameCol ? hole(15, "d") : hole(16, "d");
  if (k >= 1) jumper(pinPt("13"), hole(11, "a"), C.amber, a, eo(P(t, ts(1), 0.6)));
  if (k >= 2) resistorAt(hole(11, "c"), hole(15, "c"), a * P(t, ts(2), 0.3));
  if (k >= 3) ledAt(flipLed ? pc : pa, flipLed ? pa : pc, a * P(t, ts(3), 0.3), on, C.red, 0.7, sameCol ? 0 : tags);
  if (k >= 4) jumper(hole(16, "a"), rail(16, "-"), GNDW, a, eo(P(t, ts(4), 0.6)), 30);
  if (k >= 5 && !noGnd) jumper(rail(2, "-"), pinPt("GND"), GNDW, a, eo(P(t, ts(5), 0.6)), 80);
  if (hl >= 1) { const spots = [null, pinPt("13"), hole(13, "c"), hole(15.5, "d"), hole(16, "a"), rail(2, "-")]; const p = spots[hl]; ring(p[0], p[1] - (hl === 3 ? 50 : 0), 46, C.amber, 4, a * (0.6 + 0.4 * Math.sin(NOW * 5))); }
  if (o.flow > 0) pulses(LOOP(), NOW, C.green, 9, 0.22, 6, a * o.flow);
}
SCENES.build = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)); let k = 0; for (let i = 1; i <= 5; i++) if (t >= L(i) - 0.1) k = i;
  circuitBuild(t, a, k, (i) => L(i) + 0.6, { tags: k >= 3 ? 1 : 0, hl: t < E(5) - 2.4 ? k : -1, flow: k === 5 ? P(t, E(5) - 2.6, 0.6) : 0 });
  const labels = ["", "1 · سلك من القطب 13", "2 · المقاوم 220 Ω", "3 · LED: الطويل مع المقاوم", "4 · القصير ← الخط الأزرق −", "5 · الخط الأزرق ← GND ✓"];
  if (k >= 1) chip(k === 5 && t > E(5) - 2.6 ? "⭕ الدارة مغلقة: يمر التيار" : labels[k], 960, 820, { size: 32, col: k === 5 ? C.green : C.amber, a: pop(t, L(k) + 0.2, 0.4) });
};

// ---------------------------------------------------------------- 7. RUN: same code, upload, both lights blink; another pin
SCENES.run = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), on = t > L(2) - 0.2 ? BLINK(t, 0.5, 0.5) : 0;
  if (t < L(3) - 0.1) { circuitBuild(t, a, 5, () => -10, { on, flow: on }); boardLed(UNO.x, UNO.y, UNO.s, "ON", 1, C.green, a);
    if (t < L(1)) { editor(1180, 760, 560, 110, a, "blink.ino"); codeLine("digitalWrite(13, HIGH);", 1210, 832, { size: 28, a }); chip("نفس كود الحلقة 03 ✓", 960, 160, { size: 32, col: C.teal, a: pop(t, L(0) + 1.4, 0.4) }); }
    if (t > L(1) - 0.1 && t < L(2)) { const up = P(t, L(1) + 0.3, 1.6); chip("→ Upload", 960, 160, { size: 32, col: C.teal, a: pop(t, L(1), 0.4) }); fillRR(760, 200, 400, 12, 6, "rgba(120,150,200,0.2)", a); fillRR(760, 200, 400 * up, 12, 6, C.teal, a); }
    if (t > L(2) - 0.1) { chip("💡 الضوءان معًا", 960, 160, { size: 34, col: C.amber, a: pop(t, L(2) + 0.4, 0.45) }); confetti(1260, 400, L(2) + 0.3, a); } return; }
  // another pin: move the wire to 8 and change the number in the code
  const mv = eio(P(t, L(3) + 1.2, 0.8)); bboard(a); uno(UNO.x, UNO.y, UNO.s, { a }); const p13 = pinPt("13"), p8 = pinPt("8"), p = [lerp(p13[0], p8[0], mv), p13[1]];
  jumper(p, hole(11, "a"), C.amber, a); resistorAt(hole(11, "c"), hole(15, "c"), a); ledAt(hole(15, "d"), hole(16, "d"), a, mv >= 1 ? BLINK(t, 0.5, 0.5) : 0); jumper(hole(16, "a"), rail(16, "-"), GNDW, a, 1, 30); jumper(rail(2, "-"), pinPt("GND"), GNDW, a, 1, 80);
  chip(mv < 0.5 ? "القطب 13" : "القطب 8", p[0], p[1] - 60, { size: 28, col: C.amber, a });
  editor(1180, 760, 560, 110, a, "blink.ino"); codeLine(`digitalWrite(${mv < 0.5 ? 13 : 8}, HIGH);`, 1210, 832, { size: 28, a, colors: { 2: C.amber } });
};

// ---------------------------------------------------------------- 8. WHY DOESN'T IT LIGHT?
SCENES.errors = (t, L, E) => {
  const k = t > L(3) - 0.15 ? 3 : t > L(2) - 0.15 ? 2 : t > L(1) - 0.15 ? 1 : 0;
  if (k === 0) { TW("لماذا لا يضيء؟", 960, 380, L(0) + 0.3, { size: 96, weight: 900, colors: { "يضيء؟": C.red }, g: 22 }); return; }
  const a = eo(P(t, L(k) - 0.1, 0.4)), fixed = t > Math.max(L(k) + 2.4, E(k) - 1.3);
  circuitBuild(t, a, 5, () => -10, { tags: k === 1 ? 1 : 0, flipLed: k === 1 && !fixed, sameCol: k === 2 && !fixed, noGnd: k === 3 && !fixed, on: fixed ? BLINK(t, 0.5, 0.5) : 0 });
  chip(String(k), 180, 200, { size: 40, col: C.red });
  const tag = [null, ["الضوء مقلوب ← اقلبه", hole(15.5, "d")], ["الطرفان في العمود نفسه", hole(15, "c")], ["سلك GND ناقص ← الدارة مفتوحة", rail(2, "-")]][k];
  if (!fixed) { ring(tag[1][0], tag[1][1] - (k === 3 ? 0 : 40), 70, C.red, 7, a * (0.75 + 0.25 * Math.sin(NOW * 6))); if (k === 2) { const p0 = hole(15, "b"), p1 = hole(15, "d"); fillRR(p0[0] - 7, p0[1] - 10, 14, p1[1] - p0[1] + 20, 7, hexA(C.amber, 0.8), a); arrow(p0[0] + 24, p0[1], p0[0] + 24, p1[1], C.amber, 4, a, 12); } }
  chip(fixed ? "✓ صُلّحت" : tag[0], 960, 820, { size: 32, col: fixed ? C.green : C.red, a: pop(t, fixed ? Math.max(L(k) + 2.4, E(k) - 1.3) : L(k) + 0.6, 0.4) });
};

// ---------------------------------------------------------------- 9. SAFETY
SCENES.safety = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5));
  if (t < L(1) - 0.1) { bigLED(620, 380, 1.0, a, { on: 0, tags: 0 }); resistorAt([980, 540], [1420, 540], a, 220, 2.0); T("+", 820, 520, { size: 80, weight: 900, color: C.teal, a });
    chip("دائمًا مع مقاوم ✓", 960, 760, { size: 34, col: C.green, a: pop(t, L(0) + 1.2, 0.45) }); chip("يحمي الضوء… ويحمي قطب الأردوينو", 960, 840, { size: 30, col: C.teal, a: pop(t, L(0) + 3.4, 0.45) }); return; }
  const b = eo(P(t, L(1) - 0.1, 0.5)), un = eio(P(t, L(1) + 0.6, 0.8)); I.laptop(620, 450, 1.5, { a: b }); uno(1360, 450, 0.5, { a: b, led: 0 });
  const port = unoPt(1360, 450, 0.5, -60, 154); const pts = [[820, 520], [lerp(port[0], 1000, un), lerp(port[1], 560, un)]]; poly(pts, "#3a4a66", 10, b); if (un > 0.9) I.cross(1050, 560, 0.6, { a: b });
  chip("افصل الكابل أولًا 🔌", 960, 760, { size: 34, col: C.amber, a: pop(t, L(1) + 1.4, 0.45) });
};

// ---------------------------------------------------------------- 10. CHALLENGE: two LEDs, alternating (13 and 12)
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 170, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5)), ph = BLINK(t, 0.6, 0.6);
  [["13", C.red, 1, 760], ["12", C.green, 0, 1160]].forEach(([pin, col, w, x]) => { const on = w ? ph : 1 - ph; withT(x, 470, 1, 0, () => { if (on) halo(0, -30, 160, hexA(col, 0.7), a); A(a); ctx.beginPath(); ctx.arc(0, -30, 60, Math.PI, 0); ctx.lineTo(60, 30); ctx.lineTo(-60, 30); ctx.closePath(); ctx.fillStyle = on ? col : hexA(col, 0.35); ctx.fill(); });
    chip("القطب " + pin, x, 600, { size: 30, col, a }); resistorAt([x - 130, 700], [x + 130, 700], a * P(t, L(2), 0.4), 220, 1.5); });
  if (t > L(2) - 0.1) chip("لكل ضوء مقاوم 220 Ω · 💬 الحل في التعليقات", 960, 800, { size: 30, col: C.teal, a: pop(t, L(2) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 11. RECAP
const RECAP = [["5 ثقوب في عمود = موصولة", "⋮"], ["+ أحمر · − أزرق", "±"], ["LED: الطويل + · القصير −", "💡"], ["دائمًا مع مقاوم", "Ω"], ["3 ÷ 0.015 = 200 → 220 Ω", "="], ["13 → R → LED → GND", "⭕"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  RECAP.forEach(([s, ic], i) => { const at = L(1 + Math.floor(i / 2)) + (i % 2) * 1.6, p = pop(t, at, 0.45), col = [C.teal, C.amber, C.red, C.teal, C.violet, C.green][i];
    const x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p), 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: 32, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 36, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 12. TEASER: the engineer's tools
SCENES.teaser = (t, L, E) => {
  const endA = eo(P(t, L(2) - 0.1, 0.6)), a = eo(P(t, L(0) - 0.3, 0.6)) * (1 - endA);
  if (a > 0) { resistorAt([520, 560], [940, 560], a, 220, 2.0); T("؟ Ω", 730, 330, { size: 70, weight: 900, color: C.amber, a, g: 20 }); T("؟ V", 1260, 300, { size: 70, weight: 900, color: C.amber, a: a * P(t, L(0) + 2.4, 0.4), g: 20 });
    if (t > L(1) - 0.2) { const p = eo(P(t, L(1), 0.5)); withT(1260, 580, 1, 0, () => { card(-140, -170, 280, 340, { a: a * p, col: C.amber, r: 30, fill: "rgba(30,26,16,0.96)" }); fillRR(-100, -130, 200, 90, 12, "rgba(160,200,150,0.9)", a * p); T("5.00", 0, -84, { size: 54, weight: 800, fam: "mono", color: "#122", a: a * p }); circle(0, 60, 56, "#2a2f38", a * p); ring(0, 60, 56, C.amber, 3, a * p); seg(0, 60, 30, 30, "#fff", 5, a * p); }); chip("جهاز القياس · Multimeter", 1260, 810, { size: 30, col: C.amber, a: a * pop(t, L(1) + 1.6, 0.45) }); } }
  if (endA > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.18)", endA);
    T("الحلقة القادمة", 960, 230, { size: 40, weight: 800, color: C.amber, a: endA });
    withT(960, 370, 0.9 + 0.1 * back(P(t, L(2), 0.6)), 0, () => TW("أدوات المهندس 🛠️", 0, 0, L(2) + 0.1, { size: 104, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "المهندس": C.teal } }));
    resistorAt([760, 570], [1160, 570], endA, 220, 2.0);
    brand(860, 760, endA * P(t, L(2) + 1.0, 0.5), 1.2); T("مسار", 1000, 756, { size: 54, weight: 900, color: C.text, a: endA * P(t, L(2) + 1.0, 0.5) });
  }
};
