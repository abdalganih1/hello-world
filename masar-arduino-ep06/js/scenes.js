// الحلقة 06 · أدوات المهندس. 12 scenes; each gets (t, L, E, S, ls): L(k)/E(k) = start/end of its k-th spoken line.
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


// ======================================================================== EP06 · أدوات المهندس
// ---------- the full resistor colour code (0..9) + the gold tolerance band
BC.orange = "#ff7a1a"; BC.yellow = "#ffd21f"; BC.green = "#2fbf4a"; BC.blue = "#2f6fe0"; BC.violet = "#8a3fd1"; BC.grey = "#8d939c"; BC.white = "#f4f6fa";
const CODEC = [["أسود", BC.black], ["بني", BC.brown], ["أحمر", BC.red], ["برتقالي", BC.orange], ["أصفر", BC.yellow], ["أخضر", BC.green], ["أزرق", BC.blue], ["بنفسجي", BC.violet], ["رمادي", BC.grey], ["أبيض", BC.white]];
BANDS[470] = [BC.yellow, BC.violet, BC.brown, BC.gold];
const bandX = (i, sc) => (-28 + i * 13 + (i === 3 ? 10 : 0) + 3) * sc; // centre of band i on a resistorAt(…, sc) body, relative to its middle

// ---------- the multimeter: amber holster, LCD, rotary dial, three ports (10A · COM · VΩ)
const DIAL = { OFF: 0, V: 50, R: 100, BEEP: 150, A: 210, VAC: 310 };
const DIAL_LBL = [["OFF", 0], ["V⎓", 50], ["Ω", 100], ["🔊", 150], ["A", 210], ["V~", 310]];
const PORTS = { A10: -110, COM: 0, VO: 110 };
function meter(x, y, s, a, o = {}) {
  if (a <= 0.001) return;
  const { ang = 0, read = "", unit = "", beep = 0, hl = null, range = "" } = o;
  withT(x, y, s, 0, () => {
    fillRR(-200, -310, 400, 620, 48, "#d99a16", a); fillRR(-188, -298, 376, 596, 40, "#f0b429", a * 0.35);
    fillRR(-176, -286, 352, 572, 32, "#1b2130", a);
    // LCD
    fillRR(-150, -266, 300, 128, 16, "#0c1018", a); fillRR(-140, -256, 280, 108, 10, hl === "lcd" ? "#b9e6b5" : "#9fc7a0", a);
    if (read) T(read, 70, -200, { size: 76, weight: 800, fam: "mono", color: "#0e1f14", align: "right", a });
    if (unit) T(unit, 82, -196, { size: 36, weight: 900, fam: "mono", color: "#0e1f14", align: "left", a });
    if (range) T(range, -128, -238, { size: 18, weight: 800, fam: "mono", color: "#2b4a31", align: "left", a });
    // dial
    const cx = 0, cy = 30; circle(cx, cy, 104, "#262d3d", a); ring(cx, cy, 104, hl === "dial" ? C.amber : "#3b4558", hl === "dial" ? 5 : 3, a);
    DIAL_LBL.forEach(([s2, d]) => { const r = d * Math.PI / 180, on = Math.abs(((ang - d + 540) % 360) - 180) < 8; T(s2, cx + Math.sin(r) * 142, cy - Math.cos(r) * 142, { size: s2.length > 2 ? 24 : 30, weight: 900, fam: s2 === "🔊" ? "Cairo" : "mono", color: on ? C.amber : "#c6d0e0", a }); });
    withT(cx, cy, 1, ang * Math.PI / 180, () => { circle(0, 0, 74, "#10141c", a); ring(0, 0, 74, "#4a5468", 3, a); fillRR(-9, -86, 18, 70, 6, "#eef2f8", a); });
    // ports
    [["10A", PORTS.A10, "#b0353f"], ["COM", PORTS.COM, "#6b7280"], ["VΩ", PORTS.VO, C.red]].forEach(([s2, px, rc]) => {
      const h = hl === s2; if (h) halo(px, 226, 70, hexA(C.amber, 0.6), a); circle(px, 226, 24, "#07090d", a); ring(px, 226, 24, rc, 6, a); circle(px, 226, 9, "#2a2f38", a);
      T(s2, px, 270, { size: 24, weight: 900, fam: "mono", color: h ? C.amber : "#c6d0e0", a }); });
    if (beep > 0) for (let i = 0; i < 3; i++) { const u = ((NOW * 1.6 + i / 3) % 1); ring(120, -330, 30 + u * 90, C.amber, 5, a * beep * (1 - u), -1.1, -0.1); }
  });
}
const portPt = (x, y, s, k) => [x + PORTS[k] * s, y + 226 * s];
// a test probe: insulated handle ending in a metal needle at `tip`; `ang` points from the tip back along the handle; the lead returns to the port
function probe(port, tip, col, a, ang = -Math.PI / 2, u = 1, sag = 180) {
  if (a <= 0.001) return; const back = [tip[0] + Math.cos(ang) * 170, tip[1] + Math.sin(ang) * 170];
  const cy = Math.max(port[1], back[1]) + sag; A(a); ctx.beginPath(); ctx.moveTo(port[0], port[1]); ctx.quadraticCurveTo((port[0] + back[0]) / 2, cy, back[0], back[1]);
  ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 13; ctx.lineCap = "round"; ctx.stroke(); ctx.strokeStyle = col === C.red ? "#c8323e" : "#22262e"; ctx.lineWidth = 9; ctx.stroke();
  if (col !== C.red) { ctx.strokeStyle = "rgba(150,160,175,0.5)"; ctx.lineWidth = 2; ctx.stroke(); }
  circle(port[0], port[1], 16, col === C.red ? "#c8323e" : "#2b3038", a);
  withT(tip[0], tip[1], 1, ang, () => { fillRR(0, -3, 34, 6, 3, "#d7dde6", a); fillRR(30, -16, 14, 32, 5, col === C.red ? "#e0414e" : "#30353f", a); fillRR(40, -11, 130, 22, 10, col === C.red ? "#c8323e" : "#22262e", a); if (col !== C.red) strokeRR(40, -11, 130, 22, 10, "#5a6372", 2, a); });
}
// a big standalone resistor with value chips under its bands
function bigRes(cx, cy, sc, a, val = 220) { resistorAt([cx - 110 * sc, cy], [cx + 110 * sc, cy], a, val, sc); }
// tag on a pin of the Uno
const unoP = (bx, by, bs, px) => unoPt(bx, by, bs, px, 514);
function lcdFlash(x, y, s, t0, a) { const p = P(NOW, t0, 0.5); if (p > 0 && p < 1) halo(x, y - 200 * s, 220 * s, hexA("#b9ffb5", 0.5 * (1 - p)), a); }
const angTo = (t, t0, from, to, d = 0.6) => lerp(from, to, eio(P(t, t0, d)));

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.2, 0.6)), sh = eio(P(t, L(1) - 0.2, 0.7));
  withT(lerp(960, 560, sh), 470, 1, 0, () => { bigRes(0, 0, lerp(3.4, 2.4, sh), a); T("؟ Ω", 0, -170, { size: 110, weight: 900, color: C.amber, a: a * pop(t, 1.4, 0.5), g: 26 }); });
  TW("كم أوم؟", lerp(960, 560, sh), 720, 2.2, { size: 64, weight: 900, colors: { "أوم؟": C.teal }, g: 14, a: 1 - sh });
  if (t > L(1) - 0.2) { const b = eo(P(t, L(1), 0.6)); uno(1340, 470, 0.72, { a: b }); const p5 = unoP(1340, 470, 0.72, 376); ring(p5[0], p5[1], 30, C.amber, 5, b * (0.6 + 0.4 * Math.sin(t * 5))); chip("5 V ؟", p5[0], p5[1] + 78, { size: 34, col: C.amber, a: pop(t, L(1) + 1.0, 0.45) });
    if (t > E(1) - 2.2) chip("📏 اليوم: نقيس", 960, 830, { size: 36, col: C.teal, a: pop(t, E(1) - 2.0, 0.45) }); }
};

// ---------------------------------------------------------------- 2. TITLE + the rule
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.14)", 1);
  chip("الحلقة 06", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("أدوات المهندس 🛠️", 0, 0, L(0) + 0.3, { size: 108, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "المهندس": C.teal } }));
  if (t > L(1) - 0.2) { const p = clamp(pop(t, L(1) + 0.3, 0.5)); withT(960, 600, p || 0.001, 0, () => { card(-430, -100, 860, 200, { col: C.amber, r: 40 }); T("قس… قبل أن توصل", 60, 2, { size: 72, weight: 900, color: C.amber, g: 16 }); meter(-330, 4, 0.26, 1, { ang: DIAL.V, read: "5.0" }); });
    if (t > L(1) + 2.4) { I.check(1420, 600, 1.0, { a: pop(t, L(1) + 2.6, 0.4) }); } }
};

// ---------------------------------------------------------------- 3. MEET THE MULTIMETER
SCENES.meter = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.6)), MX = 1240, MY = 500, MS = 1.0, hl = t > L(1) && t < L(2) ? (((t - L(1)) % 3) < 1.5 ? "lcd" : "dial") : t > L(3) && t < L(4) ? "COM" : t > L(4) ? "VΩ" : null;
  meter(MX, MY, MS, a, { ang: t > L(1) ? angTo(t, L(1) + 1.6, 0, DIAL.V) : 0, read: t > L(1) + 0.8 ? "0.00" : "", hl });
  TW("Multimeter · جهاز القياس", 560, 220, L(0) + 0.5, { size: 52, weight: 900, colors: { "Multimeter": C.amber }, g: 12 });
  const lab = (s, i, col, target, t0) => { const p = clamp(pop(t, t0, 0.45)); if (p <= 0) return; const y = 340 + i * 110; chip(s, 560, y, { size: 32, col, a: p }); if (target) { seg(560 + 230, y, target[0], target[1], hexA(col, 0.7), 3, p); circle(target[0], target[1], 7, col, p); } };
  lab("الشاشة: هنا الرقم", 0, C.green, [MX - 150, MY - 200], L(1) + 0.3);
  lab("القرص: ماذا نقيس؟", 1, C.amber, [MX - 104, MY + 30], L(1) + 1.6);
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.6)), pr = eo(P(t, L(3) + 0.4, 0.9)), pb = eo(P(t, L(4) + 0.4, 0.9));
    const cR = portPt(MX, MY, MS, "VO"), cB = portPt(MX, MY, MS, "COM"), offR = [1700, 980], offB = [1620, 1000];
    probe([lerp(offR[0], cR[0], pb), lerp(offR[1], cR[1], pb)], [1700, 360], C.red, p, -Math.PI / 2 + 0.25, 1, 120);
    probe([lerp(offB[0], cB[0], pr), lerp(offB[1], cB[1], pr)], [1590, 380], C.black, p, -Math.PI / 2 + 0.45, 1, 120);
    lab("الأحمر = موجب +", 2, C.red, null, L(2) + 0.6); lab("الأسود = سالب −", 3, C.mut, null, L(2) + 1.8); }
  if (t > L(3) - 0.1) chip("الأسود ← COM دائمًا", 560, 780, { size: 32, col: C.teal, a: pop(t, L(3) + 0.6, 0.45) });
  if (t > L(4) - 0.1) chip("الأحمر ← VΩ", 560, 860, { size: 32, col: C.red, a: pop(t, L(4) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 4. MEASURE VOLTAGE (the Uno's 5V, then a battery)
SCENES.voltage = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), MX = 520, MY = 470, MS = 0.82, UX = 1320, UY = 430, US = 0.82;
  const touch = t > L(3) + 1.2 && t < L(6) - 0.2, swap = t > L(5) + 0.6 && t < L(6) - 0.2, batt = t > L(6) - 0.2;
  const read = batt ? (t > L(6) + 1.6 ? "1.58" : "0.00") : !touch ? "0.00" : swap ? "-4.99" : "4.99";
  meter(MX, MY, MS, a, { ang: angTo(t, L(0) + 1.2, 0, DIAL.V), read, unit: "V", range: t > L(2) + 0.6 ? "20V" : "", hl: t > L(0) && t < L(2) ? "dial" : t > L(4) - 0.2 && t < L(5) ? "lcd" : null });
  if (t > L(4) && t < L(4) + 0.6) lcdFlash(MX, MY, MS, L(4) - 0.2, a);
  const cR = portPt(MX, MY, MS, "VO"), cB = portPt(MX, MY, MS, "COM");
  if (!batt) {
    const b = eo(P(t, L(0) + 0.4, 0.6)) * (1 - eo(P(t, L(6) - 0.6, 0.4))); uno(UX, UY, US, { a: b });
    const p5 = unoP(UX, UY, US, 376), pG = unoP(UX, UY, US, 401.5); chip("5V", p5[0] - 26, p5[1] + 52, { size: 24, col: C.red, a: b * P(t, L(3), 0.4) }); chip("GND", pG[0] + 36, pG[1] + 52, { size: 24, col: C.mut, a: b * P(t, L(3), 0.4) });
    const m = eio(P(t, L(3) + 0.2, 1.0)), rTip = swap ? pG : p5, bTip = swap ? p5 : pG, restR = [1000, 760], restB = [1060, 800];
    probe(cR, [lerp(restR[0], rTip[0], m), lerp(restR[1], rTip[1], m)], C.red, a * b, Math.PI / 2 + 0.35, 1, 80);
    probe(cB, [lerp(restB[0], bTip[0], m), lerp(restB[1], bTip[1], m)], C.black, a * b, Math.PI / 2 + 0.6, 1, 80);
  }
  if (t > L(1) - 0.1 && t < L(2)) { const p = pop(t, L(1) + 0.3, 0.45); chip("⎓ = جهد مستمر · DC", 960, 160, { size: 34, col: C.amber, a: p }); }
  if (t > L(2) - 0.1 && t < L(3)) chip("المجال: 20 V > 5 V ✓", 960, 160, { size: 34, col: C.teal, a: pop(t, L(2) + 0.6, 0.45) });
  if (t > L(4) - 0.1 && t < L(5)) chip("4.99 V ≈ 5 V ✓", 960, 160, { size: 38, col: C.green, a: pop(t, L(4) + 0.4, 0.45) });
  if (t > L(5) - 0.1 && t < L(6) - 0.2) chip("− يعني: عكست السلكين · لا مشكلة", 960, 160, { size: 34, col: C.amber, a: pop(t, L(5) + 0.8, 0.45) });
  if (batt) { const b = eo(P(t, L(6), 0.6)), BXc = 1300, BYc = 470; battery(BXc, BYc, 1.3, "1.5V", C.green, b);
    probe(cR, [BXc, BYc - 168], C.red, a * b, -Math.PI / 2 - 0.5, 1, 220); probe(cB, [BXc, BYc + 146], C.black, a * b, Math.PI / 2 + 0.5, 1, 60);
    chip("جديدة ≈ 1.5 V ✓", 1640, 380, { size: 30, col: C.green, a: pop(t, L(6) + 2.2, 0.45) }); chip("فارغة < 1 V ✗", 1640, 480, { size: 30, col: C.red, a: pop(t, L(6) + 4.4, 0.45) }); }
};

// ---------------------------------------------------------------- 5. MEASURE RESISTANCE (outside the circuit)
SCENES.resistance = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), MX = 520, MY = 470, MS = 0.82, on = t > L(2) + 1.0, swap = t > L(2) + 3.4;
  meter(MX, MY, MS, a, { ang: angTo(t, L(0) + 1.0, DIAL.V, DIAL.R), read: on ? "218" : "OL", unit: "Ω", range: "2k", hl: t < L(1) ? "dial" : t > L(3) - 0.2 ? "lcd" : null });
  const RX = 1300, RY = 470, sc = 2.6, l = [RX - 110 * sc, RY], r = [RX + 110 * sc, RY]; bigRes(RX, RY, sc, a);
  if (t > L(1) - 0.1) { chip("خارج الدارة · بلا كهرباء 🔌✗", RX, 250, { size: 32, col: C.teal, a: pop(t, L(1) + 0.4, 0.45) }); }
  const cR = portPt(MX, MY, MS, "VO"), cB = portPt(MX, MY, MS, "COM"), m = eio(P(t, L(2) + 0.2, 0.9)), restR = [980, 780], restB = [1040, 820];
  const tR = swap ? r : l, tB = swap ? l : r; const sw = eio(P(t, L(2) + 3.2, 0.5)), tipR = swap ? [lerp(l[0], r[0], sw), l[1]] : [lerp(restR[0], tR[0], m), lerp(restR[1], tR[1], m)], tipB = swap ? [lerp(r[0], l[0], sw), r[1]] : [lerp(restB[0], tB[0], m), lerp(restB[1], tB[1], m)];
  probe(cR, [tipR[0], tipR[1] + 16], C.red, a, Math.PI / 2 + 0.3, 1, 60); probe(cB, [tipB[0], tipB[1] + 16], C.black, a, Math.PI / 2 - 0.3, 1, 60);
  if (t > L(2) + 3.0 && t < L(3)) chip("الاتجاه لا يهم ⇄", RX, 700, { size: 32, col: C.amber, a: pop(t, L(2) + 3.2, 0.45) });
  if (t > L(3) - 0.1) { chip("218 Ω ≈ 220 Ω ✓", RX, 700, { size: 40, col: C.green, a: pop(t, L(3) + 0.8, 0.45) }); lcdFlash(MX, MY, MS, L(3), a); }
};

// ---------------------------------------------------------------- 6. THE COLOUR CODE
function codeTable(x0, y, a, hl = -1, t0 = -1) { // ten swatches, digits 0..9 left to right
  CODEC.forEach(([n, c], i) => { const p = t0 < 0 ? 1 : clamp(pop(NOW, t0 + i * 0.12, 0.4)); const x = x0 + i * 120, h = hl === i;
    withT(x, y, (p || 0.001) * (h ? 1.12 : 1), 0, () => { fillRR(-48, -60, 96, 120, 18, c, a); if (c === BC.black) strokeRR(-48, -60, 96, 120, 18, "#4b5568", 2, a); if (h) strokeRR(-54, -66, 108, 132, 22, C.amber, 5, a);
      T(String(i), 0, -8, { size: 50, weight: 900, fam: "mono", color: i >= 3 && i <= 5 || i >= 8 ? "#0b0f18" : "#ffffff", a }); T(n, 0, 40, { size: 20, weight: 800, color: i >= 3 && i <= 5 || i >= 8 ? "#0b0f18" : "#e9eef7", a }); }); });
}
SCENES.colors = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  TW("ألوان المقاوم 🎨", 960, 150, L(0) + 0.6, { size: 60, weight: 900, colors: { "ألوان": C.teal }, g: 14 });
  const ex = t > L(5) - 0.2 && t < L(6) - 0.2 ? 1000 : 220, hlI = t > L(4) && t < L(5) ? [2, 2, 1][Math.min(2, Math.floor((t - L(4) - 0.4) / 1.1))] : t > L(5) && t < L(6) ? [1, 0, 2][Math.min(2, Math.floor((t - L(5) - 0.4) / 1.1))] : -1;
  if (t > L(1) - 0.1) codeTable(420, 300, a, hlI, L(1) + 0.2);
  const RX = 960, RY = 600, sc = 3.0;
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.5)); bigRes(RX, RY, sc, p, ex);
    if (t < L(3) + 0.3) { const u = eio(P(t, L(2) + 0.8, 1.2)); arrow(RX + bandX(0, sc) - 40, RY - 110, RX + bandX(0, sc) - 40 + 280 * u, RY - 110, C.amber, 6, p, 18); chip("ابدأ من هنا", RX - 380, RY - 110, { size: 28, col: C.amber, a: pop(t, L(2) + 0.6, 0.4) }); chip("الذهبي آخرًا", RX + 380, RY - 110, { size: 28, col: BC.gold, a: pop(t, L(2) + 1.6, 0.4) }); } }
  if (t > L(3) - 0.1) { // what each band means
    const vals = ex === 220 ? ["2", "2", "0"] : ["1", "0", "00"], show = t > L(4) - 0.1;
    [["رقم", 0], ["رقم", 1], ["عدد الأصفار", 2]].forEach(([s, i]) => { const q = pop(t, L(3) + 0.3 + i * 0.6, 0.4), bx = RX + bandX(i, sc), cx = RX - 300 + i * 300; seg(bx, RY + 40, cx, RY + 110, "rgba(200,210,225,0.6)", 3, a * clamp(q));
      chip(show ? `${s}: ${vals[i]}` : s, cx, RY + 140, { size: 28, col: i === 2 ? C.violet : C.teal, a: q }); });
    if (t > L(6) - 0.1) { const q = pop(t, L(6) + 0.3, 0.4), bx = RX + bandX(3, sc); seg(bx, RY + 40, RX + 540, RY + 110, hexA(BC.gold, 0.8), 3, a * clamp(q)); chip("±5%", RX + 540, RY + 140, { size: 28, col: BC.gold, a: q }); }
  }
  if (t > L(4) + 3.4 && t < L(5) - 0.2) T("= 220 Ω", RX, RY + 240, { size: 60, weight: 800, fam: "mono", color: C.green, a: eo(P(t, L(4) + 3.4, 0.4)), g: 16 });
  if (t > L(5) + 3.4 && t < L(6) - 0.2) T("= 1000 Ω", RX, RY + 240, { size: 60, weight: 800, fam: "mono", color: C.green, a: eo(P(t, L(5) + 3.4, 0.4)), g: 16 });
  if (t > L(6) + 2.0) T("220 ± 5% → 209 … 231 Ω · 218 ✓", RX, RY + 240, { size: 44, weight: 800, fam: "mono", color: C.text, a: eo(P(t, L(6) + 2.0, 0.4)) });
};

// ---------------------------------------------------------------- 7. CONTINUITY (the beep)
SCENES.continuity = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), MX = 380, MY = 500, MS = 0.72, wire = t > L(1) - 0.2 && t < L(2) - 0.2, bb = t > L(2) - 0.2;
  const touch = (wire && t > L(1) + 1.2) || (bb && t > L(2) + 1.4); meter(MX, MY, MS, a, { ang: angTo(t, L(0) + 0.8, DIAL.R, DIAL.BEEP), read: touch ? "0.2" : "OL", unit: "Ω", beep: touch ? 1 : 0, hl: t < L(1) ? "dial" : null });
  if (t < L(1)) chip("🔊 = وضع الصفارة", 1100, 470, { size: 42, col: C.amber, a: pop(t, L(0) + 1.4, 0.45) });
  const cR = portPt(MX, MY, MS, "VO"), cB = portPt(MX, MY, MS, "COM");
  if (wire) { const w = eo(P(t, L(1), 0.5)), p0 = [900, 520], p1 = [1500, 520]; jumper(p0, p1, C.amber, w, 1, 120); const m = eio(P(t, L(1) + 0.3, 0.9));
    probe(cR, [lerp(840, p0[0], m), lerp(760, p0[1], m)], C.red, w, Math.PI / 2 + 0.2, 1, 60); probe(cB, [lerp(1560, p1[0], m), lerp(760, p1[1], m)], C.black, w, Math.PI / 2 - 0.2, 1, 60);
    if (touch) chip("بيب! ← السلك سليم ✓", 1200, 760, { size: 34, col: C.green, a: pop(t, L(1) + 1.3, 0.45) }); }
  if (bb) { const w = eo(P(t, L(2) - 0.2, 0.5)); bboard(w, { strips: P(t, L(2) + 1.4, 0.5), colHot: 12 }); const h0 = hole(12, "a"), h1 = hole(12, "d"), m = eio(P(t, L(2) + 0.3, 1.0));
    probe(cR, [lerp(1200, h0[0], m), lerp(200, h0[1], m)], C.red, w, -Math.PI / 2 - 0.5, 1, 260); probe(cB, [lerp(1300, h1[0], m), lerp(900, h1[1], m)], C.black, w, Math.PI / 2 + 0.5, 1, 40);
    if (touch) chip("بيب! ← الثقبان موصولان ✓", 1260, 820, { size: 34, col: C.green, a: pop(t, L(2) + 1.5, 0.45) }); }
};

// ---------------------------------------------------------------- 8. HOW MUCH CURRENT CAN A PIN TAKE?
SCENES.limits = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  TW("كم يتحمل القطب؟", 960, 150, L(0) + 0.4, { size: 64, weight: 900, colors: { "القطب؟": C.amber }, g: 16 });
  // the scale: 0..50 mA (motor goes off the scale)
  const x0 = 360, w = 1200, y = 400, mx = (v) => x0 + w * clamp(v / 50), sa = eo(P(t, L(1) - 0.1, 0.6));
  if (sa > 0) { fillRR(x0, y, w * 0.4, 56, 14, hexA(C.green, 0.75), a * sa); fillRR(x0 + w * 0.4, y, w * 0.4, 56, 0, hexA(C.amber, 0.75), a * sa); fillRR(x0 + w * 0.8, y, w * 0.2, 56, 14, hexA(C.red, 0.8), a * sa);
    [0, 10, 20, 30, 40, 50].forEach((v) => { seg(mx(v), y + 62, mx(v), y + 80, C.mut, 3, a * sa); T(String(v), mx(v), y + 104, { size: 28, weight: 800, fam: "mono", color: C.mut, a: a * sa }); }); T("mA", x0 + w + 60, y + 104, { size: 28, weight: 800, fam: "mono", color: C.mut, a: a * sa });
    chip("20 mA · آمن ✓", mx(20), y - 60, { size: 30, col: C.green, a: pop(t, L(1) + 0.8, 0.45) }); chip("40 mA · الحد الأقصى ⚠️", mx(40), y - 60, { size: 30, col: C.red, a: pop(t, L(1) + 3.0, 0.45) }); }
  if (t > L(2) - 0.1 && t < L(3)) { const p = eo(P(t, L(2), 0.5)); uno(760, 700, 0.5, { a: p }); chip("كل الأقطاب معًا ≤ 200 mA", 1260, 700, { size: 30, col: C.amber, a: pop(t, L(2) + 1.4, 0.45) }); }
  const needle = (v, col, lab, t0, tk) => { if (t < t0) return; const u = eio(P(t, t0, 0.9)), x = lerp(x0, mx(v), u) + (v > 50 ? Math.sin(t * 30) * 4 : 0); seg(x, y - 10, x, y + 66, col, 8, a); circle(x, y - 14, 12, col, a); };
  if (t > L(3) - 0.1 && t < L(4) - 0.1) { const p = eo(P(t, L(3), 0.5)); ledAt([900, 800], [940, 800], p, 1, C.red, 0.7); resistorAt([600, 790], [860, 790], p, 220, 1.4); needle(13.6, C.green, "", L(3) + 0.6); chip("(5 − 2) ÷ 220 ≈ 14 mA · آمن ✓", 1320, 740, { size: 32, col: C.green, a: pop(t, L(3) + 2.0, 0.45) }); }
  if (t > L(4) - 0.1) { const p = eo(P(t, L(4), 0.5)); I.motor(760, 760, 1.4, { a: p }); needle(80, C.red, "", L(4) + 0.6); chip("المحرك: مئات mA ✗", mx(44), y + 160, { size: 30, col: C.red, a: pop(t, L(4) + 1.4, 0.45) });
    seg(900, 760, 1160, 760, C.red, 6, p); I.cross(1030, 760, 0.8, { a: pop(t, L(4) + 2.0, 0.45) }); uno(1400, 760, 0.42, { a: p });
    if (t > L(5) - 0.1) chip("🔜 الطريقة الصحيحة في حلقة قادمة", 960, 900 - 40, { size: 30, col: C.teal, a: pop(t, L(5) + 0.3, 0.45) }); }
};

// ---------------------------------------------------------------- 9. SAFETY with the meter
SCENES.safety = (t, L, E) => {
  TW("قواعد الأمان ⚠️", 960, 160, L(0), { size: 66, weight: 900, colors: { "الأمان": C.amber }, g: 16 });
  [["لا تقس Ω والدارة تعمل", "Ω ⚡", C.red, 0], ["تأكد من القرص قبل القياس", "🎛️", C.amber, 1], ["لا تقس كهرباء البيت أبدًا", "🏠 220V", C.red, 2]].forEach(([s, ic, col, i]) => {
    const p = clamp(pop(t, L(i) + 0.6, 0.5)), x = 1440 - i * 480, y = 500; if (p <= 0) return;
    withT(x, y, p || 0.001, 0, () => { card(-210, -200, 420, 400, { col, r: 36 }); circle(0, -60, 90, hexA(col, 0.14)); ring(0, -60, 90, col, 4);
      if (i === 1) meter(0, -60, 0.24, 1, { ang: DIAL.V + Math.sin(NOW * 2) * 6 }); else T(ic, 0, -56, { size: i === 2 ? 46 : 60, weight: 900, fam: "mono", color: col });
      if (i !== 1) { seg(-62, -122, 62, 2, C.red, 9); } T(s, 0, 110, { size: 30, weight: 900, color: C.text }); }); });
};

// ---------------------------------------------------------------- 10. CHALLENGE: yellow, violet, brown
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 170, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5)), RX = 960, RY = 500, sc = 3.2; bigRes(RX, RY, sc, a, 470);
  [["أصفر", BC.yellow, 0], ["بنفسجي", BC.violet, 1], ["بني", BC.brown, 2]].forEach(([n, c, i]) => { const q = pop(t, L(1) + 1.0 + i * 0.7, 0.4), bx = RX + bandX(i, sc), cx = RX - 260 + i * 260; seg(bx, RY + 40, cx, RY + 110, hexA(c, 0.9), 3, a * clamp(q)); chip(n, cx, RY + 140, { size: 30, col: c, a: q }); });
  T("؟ Ω", RX, RY - 190, { size: 96, weight: 900, color: C.amber, a: a * pop(t, L(1) + 3.2, 0.5), g: 24 });
  if (t > L(2) - 0.1) chip("💬 اكتب الجواب في التعليقات · ثم قسه 📏", 960, 820, { size: 32, col: C.teal, a: pop(t, L(2) + 0.4, 0.45) });
};

// ---------------------------------------------------------------- 11. RECAP
const RECAP = [["الجهد: القرص على V", "V"], ["المقاومة: خارج الدارة", "Ω"], ["الألوان: رقم · رقم · أصفار", "🎨"], ["الصفارة = موصول", "🔊"], ["القطب: 20 mA بأمان", "mA"], ["قس قبل أن توصل", "✓"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  const at = [L(1), L(1) + 2.6, L(2), L(2) + 2.6, L(3), L(3) + 3.2];
  RECAP.forEach(([s, ic], i) => { const p = pop(t, at[i], 0.45), col = [C.amber, C.teal, C.violet, C.amber, C.green, C.red][i];
    const x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p) || 0.001, 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: ic.length > 1 ? 26 : 32, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 34, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 12. TEASER: level 1 done → "test yourself": a traffic light
SCENES.teaser = (t, L, E) => {
  const a0 = eo(P(t, L(0) - 0.2, 0.5)) * (1 - eo(P(t, L(1) - 0.3, 0.4)));
  if (a0 > 0) { halo(960, 440, 520, "rgba(70,224,138,0.18)", a0); withT(960, 440, 0.8 + 0.2 * back(P(t, L(0), 0.7)), 0, () => { card(-380, -130, 760, 260, { col: C.green, r: 50, a: a0 }); T("المستوى 1 ✓", 0, 4, { size: 92, weight: 900, color: C.green, a: a0, g: 24 }); }); confetti(960, 440, L(0) + 0.3, a0); }
  if (t > L(1) - 0.3) { const a = eo(P(t, L(1) - 0.2, 0.6));
    T("الحلقة القادمة", 960, 200, { size: 40, weight: 800, color: C.amber, a });
    withT(960, 320, 0.9 + 0.1 * back(P(t, L(1), 0.6)), 0, () => TW("اختبر نفسك 🧠", 0, 0, L(1) + 0.1, { size: 100, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "نفسك": C.teal } }));
    const ph = Math.floor((t - L(1)) / 1.2) % 3; withT(1460, 620, 1, 0, () => { card(-80, -200, 160, 400, { col: "#3b4558", r: 40, fill: "rgba(12,16,26,0.97)", a }); [[C.red, -120], [C.amber, 0], [C.green, 120]].forEach(([c, yy], i) => { const on = ph === i; if (on) halo(0, yy, 120, hexA(c, 0.7), a); circle(0, yy, 48, on ? c : hexA(c, 0.22), a); }); });
    ["5 أسئلة ❓", "لغز 🧩", "مشروع: إشارة مرور 🚦"].forEach((s, i) => chip(s, 800, 520 + i * 100, { size: 34, col: [C.teal, C.violet, C.amber][i], a: pop(t, L(1) + 1.2 + i * 0.8, 0.45) }));
    if (t > L(2) - 0.2) { const p = eo(P(t, L(2), 0.5)); brand(860, 880, p, 1.1); T("مسار", 1000, 876, { size: 50, weight: 900, color: C.text, a: p }); } }
};
