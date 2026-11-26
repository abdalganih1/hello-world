// الحلقة 09 · التكرار والمصفوفات. scenes get (t, L, E, S, ls): L(k)/E(k) = start/end of the k-th spoken line.
"use strict";
const win = (t, a, b, f = 0.3) => P(t, a, f) * (1 - P(t, b - f, f));
const blink = (t, per = 1) => (Math.floor(t / per) % 2 === 0 ? 1 : 0);
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- code: tokenizer + coloured line (LTR, mono). Returns token boxes so a scene can point at any token.
const CODE = ["void setup() {", "  pinMode(13, OUTPUT);", "}", "", "void loop() {", "  digitalWrite(13, HIGH);", "  delay(1000);", "  digitalWrite(13, LOW);", "  delay(1000);", "}"];
function tokCol(s) {
  if (s.startsWith("//")) return C.mut;
  if (/^(void|int|float|bool|const|unsigned|long|for|while)$/.test(s)) return C.violet;
  if (/^(redTime|greenTime|yellowTime|temp|isOn|ledPin|x|y|t|i|leds|speed)$/.test(s)) return C.pink;
  if (/^(true|false)$/.test(s)) return C.amber;
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


// ======================================================================== EP07 · اختبر نفسك (المستوى 1)
BANDS[330] = [BC.orange, BC.orange, BC.brown, BC.gold];
// countdown ring after a question: ls[k].count = { t0, n }
function cdown(t, ls, k, cx, cy, r = 92) {
  const cnt = ls[k] && ls[k].count; if (!cnt) return 0; const cEnd = cnt.t0 + cnt.n;
  if (t < ls[k].t1 - 0.3 || t > cEnd + 0.4) return t > cEnd ? 2 : 0;
  const ca = eo(P(t, ls[k].t1 - 0.3, 0.4)) * (1 - P(t, cEnd, 0.35));
  circle(cx, cy, r, "rgba(8,14,26,0.95)", ca); ring(cx, cy, r, "rgba(120,140,180,0.3)", 12, ca);
  const frac = t < cnt.t0 ? 1 : clamp(1 - (t - cnt.t0) / cnt.n); glow(C.amber, 20, () => ring(cx, cy, r, C.amber, 12, ca, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac));
  if (t < cnt.t0) T("فكر…", cx, cy, { size: 38, weight: 900, color: C.text, a: ca });
  else { const n = cnt.n - Math.floor(t - cnt.t0), sc = 1 + 0.25 * (1 - eo(((t - cnt.t0) % 1) / 0.3)); withT(cx, cy + 4, sc, 0, () => T(String(Math.max(1, n)), 0, 0, { size: 84, weight: 900, fam: "mono", color: C.amber, a: ca })); }
  return 1;
}
// the question header: "السؤال n من 5" + five progress dots
function qHead(t, n, L) {
  const p = pop(t, L(0) - 0.1, 0.45); chip(`السؤال ${n} من 5`, 960, 150, { size: 34, col: C.teal, a: p });
  for (let i = 0; i < 5; i++) { const x = 960 + (2 - i) * 34, done = i < n - 1, cur = i === n - 1; circle(x, 210, cur ? 10 : 8, done ? C.green : cur ? C.amber : "#2a3a58", p); }
}
// multiple-choice options (Arabic letters أ ب ج), right to left; ok = index of the right answer, rev = reveal factor
function options(opts, y, ok, rev, a, t0) {
  opts.forEach((s, i) => { const x = 960 + (1 - i) * 420, q = clamp(pop(NOW, t0 + i * 0.35, 0.4)) * a, good = i === ok;
    const col = rev > 0 ? (good ? C.green : "#3b4558") : C.blue; withT(x, y, (q || 0.001) * (rev > 0 && good ? 1 + 0.08 * rev : 1), 0, () => {
      card(-190, -50, 380, 100, { col, r: 50, fill: rev > 0 && good ? "rgba(16,48,34,0.95)" : "rgba(10,20,36,0.92)", a: rev > 0 && !good ? 0.45 : 1 });
      T(["أ", "ب", "ج"][i], 140, 2, { size: 34, weight: 900, color: col, a: rev > 0 && !good ? 0.45 : 1 }); T(s, -10, 2, { size: 34, weight: 900, color: C.text, a: rev > 0 && !good ? 0.45 : 1 });
      if (rev > 0 && good) I.check(-150, 0, 0.6, { a: rev }); }); });
}
const revealAt = (ls, k) => ls[k].count.t0 + ls[k].count.n + 0.1;

function tlPhase(u) { const m = ((u % 7) + 7) % 7; return m < 3 ? 0 : m < 6 ? 2 : 1; } // 0 red, 2 green, 1 yellow
function trafficLight(x, y, s, ph, a) { withT(x, y, s, 0, () => { fillRR(-14, 230, 28, 220, 6, "#2a3142", a); card(-100, -260, 200, 500, { col: "#3b4558", r: 46, fill: "rgba(12,16,26,0.97)", a });
  [[C.red, -150], [C.amber, 0], [C.green, 150]].forEach(([c, yy], i) => { const on = ph === i; if (on) halo(0, yy, 160, hexA(c, 0.75), a); circle(0, yy, 62, on ? c : hexA(c, 0.18), a); if (on) circle(-18, yy - 18, 12, "rgba(255,255,255,0.7)", a); }); }); }

// ======================================================================== EP08 · المتغيرات
// ---------- a variable = a box: type tag, name plate, value inside (shown above when the lid opens)
function vbox(x, y, s, a, o = {}) {
  if (a <= 0.001) return; const { name = "", val = "", type = "int", lid = 0, col = C.pink, lock = 0, bad = 0, w = 300 } = o, hw = w / 2;
  withT(x, y, s, 0, () => {
    halo(0, 20, 220, hexA(col, 0.16), a);
    fillRR(-hw, -70, w, 190, 22, "#2a2140", a); strokeRR(-hw, -70, w, 190, 22, bad ? C.red : col, 4, a);
    withT(-hw, -76, 1, -0.55 * lid, () => { fillRR(0, -22, w, 30, 10, bad ? "#5a2230" : "#3a2d5a", a); strokeRR(0, -22, w, 30, 10, bad ? C.red : col, 3, a); });
    fillRR(-hw + 30, 30, w - 60, 60, 14, "#f3eefc", a); T(name, 0, 62, { size: 34, weight: 800, fam: "mono", color: "#3b1f5c", a });
    chip(type, -hw + 10, -94, { size: 22, col: C.violet, a });
    const vy = -12 - 70 * lid; T(val, 0, vy, { size: 50, weight: 800, fam: /^[\x00-\x7f]*$/.test(val) ? "mono" : "Cairo", color: bad ? C.red : C.amber, a: a * (lid > 0 ? 1 : 0.9), g: lid > 0 ? 14 : 0 });
    if (lock > 0) withT(hw - 6, -60, 1, 0, () => { ring(0, -14, 18, C.amber, 6, a * lock, Math.PI, 0); fillRR(-24, -14, 48, 38, 8, C.amber, a * lock); circle(0, 4, 6, "#2a2140", a * lock); });
  });
}
// brace + label under a span of a big code line
function under(x0, x1, y, s, col, a) { if (a <= 0.001) return; A(a); ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0, y + 16, x0 + 14, y + 16); ctx.lineTo((x0 + x1) / 2 - 12, y + 16); ctx.lineTo((x0 + x1) / 2, y + 30); ctx.lineTo((x0 + x1) / 2 + 12, y + 16); ctx.lineTo(x1 - 14, y + 16); ctx.quadraticCurveTo(x1, y + 16, x1, y); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); chip(s, (x0 + x1) / 2, y + 74, { size: 28, col, a }); }
// a big centred code line; returns { x0, w, at(i) = x of character i, cw = char width }
function codeAt(s, cx, y, size, a, o = {}) { const w = lineW(s, size), x0 = cx - w / 2, cw = w / s.length; codeLine(s, x0, y, { size, a, ...o }); return { x0, w, cw, at: (i) => x0 + i * cw }; }
// traffic light phases for arbitrary times (seconds): 0 red, 2 green, 1 yellow
function tlPh(u, r, g, yl) { const T0 = r + g + yl, m = ((u % T0) + T0) % T0; return m < r ? 0 : m < r + g ? 2 : 1; }
const OLD = ["void loop() {", "  digitalWrite(12, HIGH);", "  delay(3000);", "  digitalWrite(12, LOW);", "  digitalWrite(10, HIGH);", "  delay(3000);", "  digitalWrite(10, LOW);", "  digitalWrite(11, HIGH);", "  delay(1000);", "  digitalWrite(11, LOW);", "}"];
const NEW = (r = 3000) => [`int redTime = ${r};`, "int greenTime = 3000;", "int yellowTime = 1000;", "", "void loop() {", "  digitalWrite(12, HIGH);", "  delay(redTime);", "  digitalWrite(12, LOW);", "  digitalWrite(10, HIGH);", "  delay(greenTime);", "  digitalWrite(10, LOW);", "  digitalWrite(11, HIGH);", "  delay(yellowTime);", "  digitalWrite(11, LOW);", "}"];


// ======================================================================== EP09 · التكرار والمصفوفات
const SCOL = [C.red, C.amber, C.green, C.teal, C.blue, C.violet];
// a row of dome LEDs with labels under them; on(i) -> 0..1
function ledRow(cx, y, n, sp, a, on, labels = null, cols = SCOL, r = 46) {
  for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * sp, v = on(i), col = cols[i % cols.length];
    if (v > 0) halo(x, y - 10, r * 3, hexA(col, 0.75 * v), a); A(a); ctx.beginPath(); ctx.arc(x, y - 10, r, Math.PI, 0); ctx.lineTo(x + r, y + r * 0.7); ctx.lineTo(x - r, y + r * 0.7); ctx.closePath(); ctx.fillStyle = v > 0 ? col : hexA(col, 0.25); ctx.fill();
    fillRR(x - r - 6, y + r * 0.6, 2 * r + 12, 12, 4, hexA(col, 0.6), a); if (v > 0) circle(x - r * 0.35, y - r * 0.45, r * 0.18, "rgba(255,255,255,0.8)", a * v);
    if (labels) T(labels[i], x, y + r + 40, { size: 28, weight: 800, fam: "mono", color: C.mut, a }); }
}
// the real strip on the breadboard: LED k on pin k+2; resistor across the trench (column c, rows d -> g); LED in row i (anode c, cathode c+1); cathode -> bottom − rail
const SC = [3, 7, 11, 15, 19, 23];
const pinPtD = (p) => unoPt(UNO.x, UNO.y, UNO.s, 446 + (7 - p) * 25.4 + 12.5, 24); // pins 7..0 on the right header
function stripCircuit(t, a, on, build = 1) {
  bboard(a); uno(UNO.x, UNO.y, UNO.s, { a });
  SC.forEach((c, k) => { const p = clamp(build * 6 - k); if (p <= 0) return;
    jumper(pinPtD(k + 2), hole(c, "a"), SCOL[k], a, p, 50 + k * 14); resistorAt(hole(c, "d"), hole(c, "g"), a * p); ledAt(hole(c, "i"), hole(c + 1, "i"), a * p, on(k), SCOL[k]); jumper(hole(c + 1, "j"), rail(c + 1, "-b"), GNDW, a, p, 20); });
  if (build >= 1) jumper(rail(1, "-b"), pinPt("GND"), GNDW, a, 1, 120);
}
const STRIP = ["void setup() {", "  for (int i = 2; i <= 7; i++) {", "    pinMode(i, OUTPUT);", "  }", "}", "void loop() {", "  for (int i = 0; i < 6; i++) {", "    digitalWrite(i + 2, HIGH);", "    delay(150);", "    digitalWrite(i + 2, LOW);", "  }", "}"];
const BACK = ["  for (int i = 5; i >= 0; i--) {", "    digitalWrite(i + 2, HIGH);", "    delay(150);", "    digitalWrite(i + 2, LOW);", "  }"];
const chase = (t, n, per = 0.3) => Math.floor(t / per) % n;
const bounce = (t, n, per = 0.25) => { const k = Math.floor(t / per) % (2 * n - 2); return k < n ? k : 2 * n - 2 - k; };

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.2, 0.6)), k = chase(t, 6, 0.28);
  ledRow(960, t < L(1) - 0.2 ? 420 : 250, 6, 170, a * (t < L(1) - 0.2 ? 1 : 0.8), (i) => (i === k ? 1 : 0));
  if (t > L(1) - 0.2 && t < L(2) - 0.1) { const p = eo(P(t, L(1), 0.4)), n = Math.min(18, Math.floor((t - L(1)) * 6));
    for (let j = 0; j < n; j++) { const col = Math.floor(j / 3), row = j % 3, s = ["digitalWrite(" + (col + 2) + ", HIGH);", "delay(150);", "digitalWrite(" + (col + 2) + ", LOW);"][row]; codeLine(s, 180 + (col % 3) * 540, 400 + Math.floor(col / 3) * 200 + row * 46, { size: 26, a: p }); }
    if (t > L(1) + 3.2) T("× 100 ؟ 😩", 960, 860 - 40, { size: 72, weight: 900, color: C.red, a: pop(t, L(1) + 3.3, 0.5), g: 18 }); }
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.5)); withT(960, 560, 1, t * 2, () => { ring(0, 0, 110, C.teal, 12, p, 0.3, Math.PI * 1.75); A(p); ctx.save(); ctx.rotate(Math.PI * 1.75); fillRR(96, -4, 30, 30, 4, C.teal, p); ctx.restore(); }); T("🔁", 960, 566, { size: 80, a: p }); chip("الكمبيوتر لا يمل", 960, 760, { size: 34, col: C.teal, a: pop(t, L(2) + 0.6, 0.45) }); }
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.14)", 1);
  chip("الحلقة 09 · المستوى 2", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("التكرار والمصفوفات 🔁", 0, 0, L(0) + 0.3, { size: 100, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "التكرار": C.teal } }));
  ledRow(960, 620, 6, 170, eo(P(t, L(0) + 1.0, 0.5)), (i) => (i === bounce(t, 6, 0.2) ? 1 : 0));
};

// ---------------------------------------------------------------- 3. LAPS: counting to ten
SCENES.laps = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), cx = 820, cy = 520, rx = 420, ry = 230;
  fillRR(cx - rx - 40, cy - ry - 40, 2 * rx + 80, 2 * ry + 80, ry + 40, "rgba(40,120,70,0.25)", a); A(a); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.strokeStyle = "#c0563c"; ctx.lineWidth = 40; ctx.stroke(); ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; ctx.setLineDash([16, 14]); ctx.stroke(); ctx.setLineDash([]);
  seg(cx, cy + ry - 26, cx, cy + ry + 26, "#fff", 6, a);
  const run = t > L(0) + 1.0, u = run ? (t - L(0) - 1.0) / ((L(2) - L(0) - 1.6) / 10) : 0, lap = Math.min(10, Math.floor(u)), done = lap >= 10, ang = Math.PI / 2 + (done ? 0 : (u % 1) * Math.PI * 2);
  const px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry; halo(px, py, 70, "rgba(255,176,32,0.6)", a); circle(px, py, 22, C.amber, a); I.person && I.person(px, py - 46, 0.35, { a });
  card(1380, 330, 360, 300, { col: done ? C.green : C.amber, r: 30, a }); T("اللفة", 1560, 380, { size: 34, weight: 900, color: C.mut, a }); T(String(lap), 1560, 500, { size: 140, weight: 900, fam: "mono", color: done ? C.green : C.amber, a, g: 18 }); T("/ 10", 1560, 590, { size: 34, weight: 800, fam: "mono", color: C.mut, a });
  if (done) chip("10 → توقف ✋", 1560, 690, { size: 32, col: C.green, a: pop(t, L(2) - 0.6, 0.4) });
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.4)); codeAt("for", 1560, 800, 72, p); }
};

// ---------------------------------------------------------------- 4. FOR: three parts
SCENES.for = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), s = "for (int i = 0; i < 6; i++) {", cl = codeAt(s, 960, 220, 62, a);
  if (t > L(0) + 1.6) [s.indexOf(";"), s.lastIndexOf(";")].forEach((ix) => ring(cl.at(ix) + cl.cw / 2, 220, 26, C.amber, 4, a * (t < L(1) ? 0.6 + 0.4 * Math.sin(t * 6) : 0.4)));
  under(cl.at(5), cl.at(14), 262, "1 · البداية", C.teal, a * P(t, L(1), 0.4)); under(cl.at(16), cl.at(21), 262, "2 · الشرط", C.amber, a * P(t, L(2), 0.4)); under(cl.at(23), cl.at(26), 262, "3 · الزيادة", C.green, a * P(t, L(3), 0.4));
  if (t > L(4) - 0.1) { const p = eo(P(t, L(4), 0.4)); codeAt("    // يتكرر هنا", 960, 430, 44, p); codeAt("}", 960 - lineW(s, 62) / 2 + lineW("}", 62) / 2, 500, 62, p); }
  // live counter: i, the condition and the repetitions
  const run = t > L(1) + 0.4, k = run ? Math.min(6, Math.floor((t - L(1) - 0.4) / ((E(4) - L(1)) / 7))) : -1;
  if (run) { vbox(560, 720, 0.7, a, { name: "i", val: String(Math.max(0, k)), col: C.pink, w: 220 }); const ok = k < 6;
    chip(`${Math.max(0, k)} < 6 → ${ok ? "true ✓" : "false ✗"}`, 960, 720, { size: 32, col: ok ? C.green : C.red, a: a * P(t, L(2), 0.4) }); ledRow(1420, 720, 6, 80, a * P(t, L(4), 0.4), (j) => (j < Math.min(k, 6) ? 1 : 0), null, SCOL, 26); if (!ok) chip("توقف ✋", 960, 800, { size: 30, col: C.red, a }); }
};

// ---------------------------------------------------------------- 5. THE RUNNING STRIP (pins 2..7)
SCENES.strip = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  if (t < L(1) - 0.2) { stripCircuit(t, a, () => 0, clamp((t - L(0)) / 3.2)); SC.forEach((c, k) => chip(String(k + 2), pinPtD(k + 2)[0], pinPtD(k + 2)[1] - 44, { size: 20, col: SCOL[k], a: a * P(t, L(0) + 0.5 * k, 0.3) })); return; }
  const back = t > L(3) - 0.1, lines = back ? STRIP.slice(0, 10).concat(["  }"], BACK, ["}"]) : STRIP, u = t - L(1) - 1.2;
  const fwd = Math.floor(Math.max(0, u) / 0.4) % 6, b2 = Math.floor(Math.max(0, u) / 0.4) % 10, kk = back ? (b2 < 6 ? b2 : 9 - b2 + 0) : fwd, k = back ? (b2 < 6 ? b2 : 10 - b2 - 1) : fwd;
  const cur = back ? bounce(Math.max(0, u), 6, 0.35) : fwd, on = (j) => (u >= 0 && j === cur ? 1 : 0);
  const b = eo(P(t, L(1) - 0.2, 0.5)); withT(1250, 500, 0.6, 0, () => withT(-960, -540, 1, 0, () => stripCircuit(t, b, on))); // the circuit, smaller, on the right
  codePanel(120, 150, b, { lines, size: back ? 22 : 26, lh: back ? 29 : 40, hl: u >= 0 ? (back ? [] : [7, 8, 9]) : t > L(1) + 0.3 ? [6] : -1, hlCol: SCOL[cur], title: "strip.ino" });
  if (t > L(2) - 0.1 && t < L(3) - 0.1) { chip("3 أسطر بدل 18 ✓", 1180, 860, { size: 34, col: C.green, a: pop(t, L(2) + 0.3, 0.45) }); }
  if (back) chip("i-- ← يرجع", 1180, 860, { size: 32, col: C.amber, a: pop(t, L(3) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 6. ARRAYS: int leds[] = {3, 5, 9};
SCENES.array = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  if (t < L(1) - 0.1) { ledRow(960, 480, 3, 300, a, () => 0, ["3", "5", "9"], [C.red, C.amber, C.green], 60); T("؟", 960, 700, { size: 90, weight: 900, color: C.amber, a: pop(t, L(0) + 2.4, 0.5) }); chip("i + 2 لا يكفي ✗", 960, 820, { size: 32, col: C.red, a: pop(t, L(0) + 3.4, 0.45) }); return; }
  const s = "int leds[] = {3, 5, 9};", cl = codeAt(s, 960, 190, 58, a * P(t, L(2) - 0.2, 0.4));
  if (t > L(2)) { under(cl.at(4), cl.at(10), 230, "الاسم و []", C.pink, a * P(t, L(2) + 1.4, 0.4)); under(cl.at(13), cl.at(22), 230, "القيم", C.amber, a * P(t, L(2) + 3.0, 0.4)); }
  // the big box with numbered slots
  const bp = eo(P(t, L(1), 0.6)), cur = t > L(5) - 0.1 ? Math.floor((t - L(5)) / 0.7) % 3 : t > L(4) - 0.1 ? Math.floor((t - L(4)) / 0.9) % 3 : -1;
  card(560, 400, 800, 230, { col: C.pink, r: 26, a: a * bp, fill: "rgba(42,33,64,0.9)" }); T("leds", 960, 380, { size: 30, weight: 800, fam: "mono", color: C.pink, a: a * bp });
  ["3", "5", "9"].forEach((v, i) => { const x = 700 + i * 260, q = a * P(t, L(1) + 0.6 + i * 0.3, 0.4), h = i === cur; fillRR(x - 100, 430, 200, 130, 18, h ? hexA(C.amber, 0.3) : "rgba(243,238,252,0.1)", q); strokeRR(x - 100, 430, 200, 130, 18, h ? C.amber : hexA(C.pink, 0.6), h ? 5 : 2, q);
    T(v, x, 494, { size: 64, weight: 800, fam: "mono", color: C.amber, a: q * P(t, L(2) + 3.0, 0.4) }); const ix = P(t, L(3) + 0.2 + i * 0.6, 0.4); chip(`[${i}]`, x, 610, { size: 28, col: i === 0 ? C.red : C.teal, a: a * ix }); });
  if (t > L(3) + 0.4 && t < L(4) - 0.1) chip("أول خانة = 0 ⚠️", 960, 700, { size: 34, col: C.red, a: pop(t, L(3) + 0.6, 0.45) });
  if (t > L(4) - 0.1) { const p = eo(P(t, L(4), 0.4)); codeAt("digitalWrite(leds[i], HIGH);", 960, 720, 44, p); ledRow(960, 860, 3, 200, p, (j) => (j === cur ? 1 : 0), null, [C.red, C.amber, C.green], 34);
    if (cur >= 0) chip(`i = ${cur} → leds[${cur}] = ${[3, 5, 9][cur]}`, 1580, 720, { size: 28, col: C.amber, a: p }); }
};

// ---------------------------------------------------------------- 7. WHILE: a flowchart
SCENES.while = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), wc = codeAt("while (condition) { ... }", 960, 190, 54, a); under(wc.at(7), wc.at(16), 230, "الشرط", C.amber, a * P(t, L(0) + 1.4, 0.4));
  const cx = 960, yD = 440, u = (t * 0.7) % 1, loopOn = t < L(1) + 3.0 || u < 0.75;
  withT(cx, yD + 40, 1, Math.PI / 4, () => { fillRR(-90, -90, 180, 180, 16, "rgba(255,176,32,0.15)", a); strokeRR(-90, -90, 180, 180, 16, C.amber, 4, a); }); T("صحيح؟", cx, yD + 40, { size: 34, weight: 900, color: C.amber, a });
  card(cx - 170, 650, 340, 110, { col: C.teal, r: 22, a }); T("كرر", cx, 705, { size: 38, weight: 900, color: C.teal, a });
  arrow(cx, yD + 128, cx, 640, C.green, 5, a, 16); T("نعم", cx + 40, 590, { size: 28, weight: 900, color: C.green, a });
  poly([[cx - 170, 705], [cx - 360, 705], [cx - 360, yD], [cx - 140, yD]], C.teal, 5, a); arrow(cx - 200, yD, cx - 132, yD, C.teal, 5, a, 16);
  arrow(cx + 128, yD, cx + 380, yD, C.red, 5, a, 16); T("لا → اخرج", cx + 260, yD - 40, { size: 28, weight: 900, color: C.red, a });
  const dot = ((t - L(0)) * 0.6) % 1, pts = [[cx, yD], [cx, 705], [cx - 360, 705], [cx - 360, yD], [cx, yD]]; if (t > L(0) + 1.0) { const [x, y] = along(pts, dot); halo(x, y, 40, "rgba(46,230,197,0.7)", a); circle(x, y, 10, "#fff", a); }
  if (t > L(1) - 0.1) { const p = pop(t, L(1) + 0.4, 0.45); chip("عدد المرات غير معروف", 1560, 600, { size: 30, col: C.violet, a: p }); chip("انتظر ما دام الزر غير مضغوط", 1560, 700, { size: 28, col: C.teal, a: pop(t, L(1) + 2.6, 0.45) }); }
};

// ---------------------------------------------------------------- 8. COMMON MISTAKES
SCENES.mistakes = (t, L, E) => {
  if (t < L(1) - 0.1) { TW("أخطاء شائعة ⚠️", 960, 400, L(0), { size: 90, weight: 900, colors: { "شائعة": C.red }, g: 20 }); return; }
  const k = t > L(4) - 0.1 ? 3 : t > L(3) - 0.1 ? 2 : 1, a = eo(P(t, L(k === 1 ? 1 : k + 1) - 0.1, 0.4)); chip(String(k), 180, 200, { size: 40, col: C.red });
  if (k === 1) { for (let i = 0; i < 7; i++) { const x = 960 + (i - 3) * 190, ghost = i === 6, q = a * (ghost ? P(t, L(2) + 0.6, 0.4) : 1);
      if (ghost) { A(q); ctx.setLineDash([12, 10]); strokeRR(x - 80, 330, 160, 120, 16, C.red, 4, q); ctx.setLineDash([]); T("؟؟", x, 392, { size: 44, weight: 900, color: C.red, a: q }); }
      else { fillRR(x - 80, 330, 160, 120, 16, "rgba(243,238,252,0.1)", q); strokeRR(x - 80, 330, 160, 120, 16, hexA(C.pink, 0.7), 2, q); T(String([2, 3, 4, 5, 6, 7][i]), x, 392, { size: 52, weight: 800, fam: "mono", color: C.amber, a: q }); }
      chip(`[${i}]`, x, 500, { size: 26, col: ghost ? C.red : i === 5 ? C.green : C.teal, a: q }); }
    chip("6 خانات: من [0] إلى [5]", 960, 620, { size: 32, col: C.green, a: pop(t, L(1) + 1.4, 0.45) });
    if (t > L(2) - 0.1) { codeAt("for (int i = 0; i <= 6; i++)", 960, 740, 46, eo(P(t, L(2), 0.4))); chip("i <= 6 ✗", 1160, 830, { size: 30, col: C.red, a: pop(t, L(2) + 2.0, 0.45) }); chip("i < 6 ✓", 760, 830, { size: 30, col: C.green, a: pop(t, L(2) + 2.8, 0.45) }); } }
  if (k === 2) { codeAt("int x = 0;", 960, 280, 48, a); codeAt("while (x < 10) {  }", 960, 360, 48, a); withT(960, 600, 1, t * 5, () => ring(0, 0, 100, C.red, 12, a, 0, Math.PI * 1.6)); T("∞", 960, 606, { size: 110, weight: 900, fam: "mono", color: C.red, a });
    chip("x لا يتغير ← الحلقة لا تنتهي ✗", 960, 800, { size: 32, col: C.red, a: pop(t, L(3) + 1.6, 0.45) }); }
  if (k === 3) { const s = "for (int i = 0; i < 6; i++);", cl = codeAt(s, 960, 360, 56, a); ring(cl.at(s.length - 1) + cl.cw / 2, 360, 30, C.red, 5, a * (0.6 + 0.4 * Math.sin(t * 6))); codeAt("{ digitalWrite(i + 2, HIGH); }", 960, 460, 40, a * 0.5);
    chip("; بعد القوس ← تكرار فارغ ✗", 960, 600, { size: 32, col: C.red, a: pop(t, L(4) + 1.4, 0.45) }); }
};

// ---------------------------------------------------------------- 9. CHALLENGE: back and forth with a speed variable
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 170, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5)), sp = t > L(2) + 1.6 ? 0.12 : 0.25;
  ledRow(960, 450, 6, 190, a, (i) => (i === bounce(t, 6, sp) ? 1 : 0)); arrow(560, 600, 1360, 600, C.amber, 5, a, 16); arrow(1360, 640, 560, 640, C.amber, 5, a, 16);
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.4)); codeAt(`int speed = ${sp === 0.12 ? 80 : 150};`, 960, 740, 46, p); chip("💬 اكتب الكود في التعليقات", 960, 840, { size: 30, col: C.teal, a: pop(t, L(2) + 2.4, 0.45) }); }
};

// ---------------------------------------------------------------- 10. RECAP
const RECAP = [["for: بداية · شرط · زيادة", "for"], ["i++ يزيد · i-- ينقص", "±"], ["المصفوفة: خانات مرقمة", "[]"], ["الترقيم يبدأ من 0", "0"], ["while: ما دام الشرط صحيحًا", "↻"], ["3 أسطر بدل 18", "✓"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  const at = [L(1), L(1) + 1.4, L(1) + 3.2, L(1) + 4.8, L(2), L(2) + 3.0];
  RECAP.forEach(([s, ic], i) => { const p = pop(t, at[i], 0.45), col = [C.violet, C.pink, C.amber, C.red, C.teal, C.green][i], x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p) || 0.001, 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: ic.length > 2 ? 22 : 30, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 32, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 11. TEASER: your own functions → SOS
SCENES.teaser = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.6));
  T("الحلقة القادمة", 960, 200, { size: 40, weight: 800, color: C.amber, a });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("دوالك الخاصة ⚙️", 0, 0, L(0) + 0.3, { size: 100, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "دوالك": C.teal } }));
  // S O S in Morse: · · ·   − − −   · · ·  (unit 0.18 s)
  const U = 0.18, seq = [1, 1, 1, 3, 3, 3, 1, 1, 1]; let tt = 0; const marks = []; seq.forEach((d, i) => { marks.push([tt, d]); tt += (d + 1) * U; if (i === 2 || i === 5) tt += 2 * U; }); const cyc = tt + 6 * U, m = ((t - L(0)) % cyc + cyc) % cyc;
  const on = marks.some(([s0, d]) => m >= s0 && m < s0 + d * U); halo(960, 560, 200, hexA(C.red, on ? 0.8 : 0.1), a); circle(960, 560, 70, on ? C.red : hexA(C.red, 0.25), a);
  marks.forEach(([s0, d], i) => { const x = 960 + (i - 4) * 90 + (i > 2 ? 20 : 0) + (i > 5 ? 20 : 0) - 20, lit = m >= s0; if (d === 1) circle(x, 720, 14, lit ? C.amber : "#3b4558", a); else fillRR(x - 32, 708, 64, 24, 12, lit ? C.amber : "#3b4558", a); });
  T("S        O        S", 960, 780, { size: 34, weight: 800, fam: "mono", color: C.mut, a });
  if (t > L(1) - 0.2) { const p = eo(P(t, L(1), 0.5)); brand(860, 880, p, 1.1); T("مسار", 1000, 876, { size: 50, weight: 900, color: C.text, a: p }); }
};
