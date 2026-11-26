// الحلقة 10 · دوالك الخاصة. scenes get (t, L, E, S, ls): L(k)/E(k) = start/end of the k-th spoken line.
"use strict";
const win = (t, a, b, f = 0.3) => P(t, a, f) * (1 - P(t, b - f, f));
const blink = (t, per = 1) => (Math.floor(t / per) % 2 === 0 ? 1 : 0);
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- code: tokenizer + coloured line (LTR, mono). Returns token boxes so a scene can point at any token.
const CODE = ["void setup() {", "  pinMode(13, OUTPUT);", "}", "", "void loop() {", "  digitalWrite(13, HIGH);", "  delay(1000);", "  digitalWrite(13, LOW);", "  delay(1000);", "}"];
function tokCol(s) {
  if (s.startsWith("//")) return C.mut;
  if (/^(void|int|float|bool|const|unsigned|long|for|while|return)$/.test(s)) return C.violet;
  if (/^(redTime|greenTime|yellowTime|temp|isOn|ledPin|x|y|t|i|leds|speed|ms|n)$/.test(s)) return C.pink;
  if (/^(true|false)$/.test(s)) return C.amber;
  if (s === "setup" || s === "loop") return C.teal;
  if (/^(pinMode|digitalWrite|digitalwrite|delay)$/.test(s)) return C.blue;
  if (/^(dot|dash|flash|twice|letterS|letterO|blinkTimes|makeCake)$/.test(s)) return C.green;
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


// ======================================================================== EP10 · دوالك الخاصة
// ---------- SOS in Morse with the same timing as the code: unit 200 ms; dot = 1 on + 1 off; dash = 3 on + 1 off; letter gap +2; word gap +7
const MU = 0.2;
const MORSE = (() => { const out = []; let u = 0; [[1, 1, 1], [3, 3, 3], [1, 1, 1]].forEach((L3, li) => { L3.forEach((d) => { out.push([u, d, li]); u += d + 1; }); u += 2; }); return { marks: out, total: u + 7 }; })();
function morseAt(t) { const m = ((t / MU) % MORSE.total + MORSE.total) % MORSE.total; let idx = -1, on = 0; MORSE.marks.forEach(([s0, d], i) => { if (m >= s0) idx = i; if (m >= s0 && m < s0 + d) on = 1; }); return { on, idx, m }; }
function bigLamp(x, y, s, on, a, col = C.red) { withT(x, y, s, 0, () => { if (on) halo(0, -20, 240, hexA(col, 0.8), a); A(a); ctx.beginPath(); ctx.arc(0, -30, 80, Math.PI, 0); ctx.lineTo(80, 50); ctx.lineTo(-80, 50); ctx.closePath(); ctx.fillStyle = on ? col : hexA(col, 0.25); ctx.fill(); fillRR(-94, 40, 188, 20, 8, hexA(col, 0.7), a); if (on) circle(-28, -60, 16, "rgba(255,255,255,0.8)", a); seg(-26, 60, -26, 150, "#b9c2cf", 8, a); seg(26, 60, 26, 130, "#b9c2cf", 8, a); }); }
function morseMarks(cx, y, a, t, sp = 70) { const { idx } = morseAt(t); MORSE.marks.forEach(([s0, d, li], i) => { const x = cx + (i - 4) * sp + (li - 1) * 50, lit = i <= idx; if (d === 1) circle(x, y, 13, lit ? C.amber : "#3b4558", a); else fillRR(x - 28, y - 11, 56, 22, 11, lit ? C.amber : "#3b4558", a); });
  ["S", "O", "S"].forEach((c, li) => T(c, cx + (li * 3 + 1 - 4) * sp + (li - 1) * 50, y + 50, { size: 32, weight: 800, fam: "mono", color: C.mut, a })); }
const DOTDASH = ["void dot() {", "  digitalWrite(13, HIGH);", "  delay(200);", "  digitalWrite(13, LOW);", "  delay(200);", "}", "void dash() {", "  digitalWrite(13, HIGH);", "  delay(600);", "  digitalWrite(13, LOW);", "  delay(200);", "}", "void loop() {", "  dot(); dot(); dot();", "  dash(); dash(); dash();", "  dot(); dot(); dot();", "  delay(1400);", "}"];
const FLASH = ["void flash(int ms) {", "  digitalWrite(13, HIGH);", "  delay(ms);", "  digitalWrite(13, LOW);", "  delay(200);", "}"];
const LETTERS = FLASH.concat(["void letterS() {", "  for (int i = 0; i < 3; i++) flash(200);", "  delay(400);", "}", "void letterO() {", "  for (int i = 0; i < 3; i++) flash(600);", "  delay(400);", "}", "void loop() {", "  letterS(); letterO(); letterS();", "  delay(1000);", "}"]);

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.2, 0.6)), { on } = morseAt(t - 0.4);
  if (t < L(1) - 0.2) { bigLamp(960, 420, 1.3, on, a); morseMarks(960, 760, a, t - 0.4); return; }
  const b = eo(P(t, L(1) - 0.2, 0.4)); bigLamp(1560, 420, 0.8, on, b);
  if (t < L(2) - 0.1) { const n = Math.min(36, Math.floor((t - L(1)) * 14)); for (let j = 0; j < n; j++) { const col = Math.floor(j / 12), row = j % 12, k = Math.floor(row / 4), s = ["digitalWrite(13, HIGH);", `delay(${col === 1 ? 600 : 200});`, "digitalWrite(13, LOW);", "delay(200);"][row % 4]; codeLine(s, 120 + col * 400, 200 + row * 52, { size: 22, a: b }); }
    if (n >= 36) chip("36 سطرًا 😵", 1560, 780, { size: 40, col: C.red, a: pop(t, L(1) + 2.8, 0.45) }); return; }
  const c = eo(P(t, L(2), 0.5)); ["dot();", "dash();"].forEach((s, i) => { const p = pop(t, L(2) + 0.8 + i * 1.0, 0.5); withT(1100 - i * 460, 520, clamp(p) || 0.001, 0, () => { card(-200, -80, 400, 160, { col: C.green, r: 30 }); codeLine(s, -lineW(s, 60) / 2, 0, { size: 60 }); }); });
  T("·", 1100, 700, { size: 120, weight: 900, color: C.amber, a: c }); T("−", 640, 700, { size: 120, weight: 900, color: C.amber, a: c });
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(70,224,138,0.13)", 1);
  chip("الحلقة 10 · المستوى 2", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("دوالك الخاصة ⚙️", 0, 0, L(0) + 0.3, { size: 112, weight: 900, color: C.text, g: 36, gc: "rgba(70,224,138,0.6)", colors: { "دوالك": C.green } }));
  ["dot()", "dash()", "flash(ms)", "twice(x)"].forEach((s, i) => chip(s, 1440 - i * 320, 620, { size: 34, col: C.green, a: pop(t, L(0) + 1.4 + i * 0.3, 0.45) }));
};

// ---------------------------------------------------------------- 3. A RECIPE HAS A NAME
SCENES.recipe = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), fold = eio(P(t, L(0) + 3.6, 1.0));
  const steps = ["اخلط الطحين والسكر", "أضف البيض والحليب", "اعجن العجينة", "شكّل الكعك", "اخبز 20 دقيقة"];
  card(1060, 200, 640, 120 + 90 * 5 * (1 - fold), { col: C.amber, r: 30, a }); T("🍪 وصفة الكعك", 1380, 250, { size: 40, weight: 900, color: C.amber, a });
  steps.forEach((s, i) => { const q = a * P(t, L(0) + 0.4 + i * 0.35, 0.3) * (1 - fold); T(`${i + 1}. ${s}`, 1640, 320 + i * 86, { size: 32, weight: 800, color: C.text, align: "right", a: q }); });
  if (fold > 0.5) { const p = pop(t, L(0) + 4.4, 0.5); withT(560, 300, clamp(p) || 0.001, 0, () => { card(-260, -70, 520, 140, { col: C.green, r: 70 }); codeLine("makeCake();", -lineW("makeCake();", 52) / 2, 0, { size: 52 }); }); arrow(1040, 260, 840, 290, C.green, 5, a * fold, 18); }
  if (t > L(1) - 0.1) { chip("الدالة = أوامر لها اسم", 960, 520, { size: 44, col: C.green, a: pop(t, L(1) + 0.3, 0.5) }); }
  if (t > L(2) - 0.1) ["setup()", "loop()", "pinMode()", "digitalWrite()", "delay()"].forEach((s, i) => { const q = pop(t, L(2) + 0.6 + i * 0.35, 0.4), x = 1560 - i * 310; withT(x, 700, clamp(q) || 0.001, 0, () => { card(-140, -50, 280, 100, { col: C.blue, r: 50 }); codeLine(s, -lineW(s, 30) / 2, 2, { size: 30 }); }); if (i >= 2) chip("كتبها غيرك", x, 790, { size: 22, col: C.mut, a: q }); });
};

// ---------------------------------------------------------------- 4. OUR FIRST FUNCTION: dot(), dash(), the calls and the jump
SCENES.define = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), n = t < L(3) - 0.1 ? 6 : t < L(4) - 0.1 ? 12 : 18, lines = DOTDASH.slice(0, n);
  const run = t > L(4) + 0.6, ms = morseAt(t - L(4) - 0.6), callLine = ms.idx < 0 ? -1 : 13 + MORSE.marks[ms.idx][2], isDash = ms.idx >= 0 && MORSE.marks[ms.idx][1] === 3;
  const hl = t < L(1) ? [0] : t < L(2) ? [0] : t < L(3) - 0.1 ? [1, 2, 3, 4] : t < L(4) - 0.1 ? [8] : run ? [callLine, isDash ? 7 : 1, isDash ? 8 : 2] : -1;
  const pnl = codePanel(140, 130, a, { lines, size: 24, lh: 36, hl, hlCol: run ? (isDash ? C.amber : C.green) : C.teal, title: "sos.ino" });
  if (t > L(1) - 0.1 && t < L(2) + 0.5) { chip("void = يعمل… ولا يرجع شيئًا", 1300, 260, { size: 34, col: C.violet, a: pop(t, L(1) + 0.4, 0.45) }); }
  if (t > L(2) - 0.1 && t < L(3)) [["أشعل", 1], ["انتظر 200", 2], ["أطفئ", 3], ["انتظر 200", 4]].forEach(([s, li], i) => T("← " + s, 780, pnl.lineY(li), { size: 26, weight: 900, color: C.teal, align: "left", a: P(t, L(2) + 0.6 + i * 0.6, 0.3) }));
  if (t > L(3) - 0.1 && t < L(4)) chip("600 = 3 × 200", 920, pnl.lineY(8), { size: 26, col: C.amber, a: pop(t, L(3) + 1.6, 0.4) });
  bigLamp(1380, 470, 1.0, run ? ms.on : 0, a * P(t, L(4), 0.4)); if (run) morseMarks(1380, 760, a, t - L(4) - 0.6, 56);
  if (t > L(5) - 0.1) { const p = eo(P(t, L(5), 0.4)), u = ((t - L(5) - 0.4) % 2.4) / 2.4, from = [600, pnl.lineY(13)], to = [600, pnl.lineY(0)];
    const go = u < 0.5, k = go ? eio(u * 2) : eio((u - 0.5) * 2), x = 780 + Math.sin(k * Math.PI) * 200, y = go ? lerp(from[1], to[1], k) : lerp(to[1], from[1], k);
    poly([[780, from[1]], [980, (from[1] + to[1]) / 2], [780, to[1]]], hexA(C.amber, 0.25), 3, p); halo(x, y, 40, hexA(go ? C.amber : C.green, 0.8), p); circle(x, y, 12, "#fff", p);
    chip(go ? "يقفز إلى الدالة ↑" : "ويرجع ↓", 1380, 860, { size: 30, col: go ? C.amber : C.green, a: p }); }
};

// ---------------------------------------------------------------- 5. PARAMETERS: flash(int ms)
SCENES.params = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), merged = t > L(1) + 1.6;
  if (!merged) { [[DOTDASH.slice(0, 6), 1000, "200"], [DOTDASH.slice(6, 12), 240, "600"]].forEach(([ln, x, v], i) => { const pnl = codePanel(x, 250, a, { lines: ln, size: 26, lh: 44, hl: [2], hlCol: C.amber, title: i ? "dash" : "dot" }); });
    chip("الفرق الوحيد: 200 أو 600", 960, 720, { size: 36, col: C.amber, a: pop(t, L(0) + 2.2, 0.45) }); return; }
  const b = eo(P(t, L(1) + 1.6, 0.6)), pnl = codePanel(140, 230, b, { lines: FLASH, size: 30, lh: 50, hl: t > L(3) - 0.1 ? [2] : t > L(2) - 0.1 ? [0] : -1, hlCol: C.pink, title: "flash" });
  if (t > L(2) + 0.6) chip("المعامل ← int ms", 1000, pnl.lineY(0), { size: 30, col: C.pink, a: b * pop(t, L(2) + 0.8, 0.45) });
  // the calls: a value travels into the box ms
  if (t > L(3) - 0.1) { const call = t > L(4) + 2.4 ? 600 : 200, pc = eo(P(t, L(3), 0.4)); vbox(1440, 620, 0.8, pc, { name: "ms", val: String(call), col: C.pink, w: 220 });
    const s = `flash(${call});`; codeAt(s, 1440, 330, 52, pc); const f = P(t, (call === 600 ? L(4) + 2.4 : L(3) + 0.6), 0.9); if (f > 0 && f < 1) T(String(call), lerp(1440 + 40, 1440, eio(f)), lerp(330, 560, eio(f)) - Math.sin(f * Math.PI) * 80, { size: 44, weight: 800, fam: "mono", color: C.amber, g: 14 });
    if (t > L(4) - 0.1) { const lit = ((t - L(4)) % 1.6) < call / 1000; bigLamp(1440, 840 - 10, 0.45, lit, pc); chip(call === 600 ? "طويلة —" : "قصيرة ·", 1700, 820, { size: 28, col: C.amber, a: pc }); } }
  if (t > L(4) + 4.8) chip("دالة واحدة بدل اثنتين ✓", 960, 160, { size: 34, col: C.green, a: pop(t, L(4) + 4.9, 0.45) });
};

// ---------------------------------------------------------------- 6. RETURN: a calculator machine
SCENES.return = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  const fn = ["int twice(int x) {", "  return x * 2;", "}"]; codePanel(160, 200, a * P(t, L(1) - 0.2, 0.5), { lines: fn, size: 34, lh: 56, hl: t > L(1) + 2.4 ? [1] : t > L(1) ? [0] : -1, hlCol: C.violet, title: "twice" });
  if (t > L(1) + 0.4) { const p = P(t, L(1) + 0.6, 0.4); chip("int ← نوع النتيجة", 480, 520, { size: 28, col: C.violet, a: p }); chip("return ← يُخرج النتيجة", 480, 600, { size: 28, col: C.violet, a: P(t, L(1) + 2.6, 0.4) }); }
  // the machine
  const mx = 1300, my = 470; card(mx - 200, my - 140, 400, 280, { col: C.green, r: 36, a }); T("twice", mx, my - 60, { size: 54, weight: 800, fam: "mono", color: C.green, a }); T("× 2", mx, my + 30, { size: 60, weight: 900, fam: "mono", color: C.text, a });
  for (let i = 0; i < 3; i++) withT(mx - 120 + i * 120, my + 150, 1, t * 3 + i, () => { ring(0, 0, 22, "#5a6372", 6, a); seg(-22, 0, 22, 0, "#5a6372", 4, a); });
  if (t > L(2) - 0.1) { const u = P(t, L(2) + 1.8, 1.0), v = P(t, L(2) + 3.4, 1.0); if (u < 1) T("200", lerp(mx - 460, mx - 200, eio(u)), my, { size: 56, weight: 800, fam: "mono", color: C.amber, a: a * P(t, L(2) + 1.2, 0.3), g: 12 });
    if (v > 0) T("400", lerp(mx + 200, mx + 420, eio(v)), my, { size: 64, weight: 800, fam: "mono", color: C.green, a, g: 18 }); arrow(mx - 470, my + 50, mx - 220, my + 50, C.amber, 4, a * 0.6, 14); arrow(mx + 220, my + 50, mx + 460, my + 50, C.green, 4, a * 0.6, 14);
    codeAt("int t = twice(200);  // 400", 960, 820, 40, a * P(t, L(2) + 4.0, 0.4)); }
};

// ---------------------------------------------------------------- 7. FUNCTIONS CALLING FUNCTIONS: letterS / letterO
SCENES.letters = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), n = t < L(1) - 0.1 ? 10 : 18, run = t > L(1) + 1.6, ms = morseAt(t - L(1) - 1.6), li = ms.idx < 0 ? -1 : MORSE.marks[ms.idx][2];
  const hl = !run ? (t < L(1) - 0.1 ? [6, 7, 8, 9] : [14, 15, 16, 17]) : [15, li === 1 ? 11 : 7, 1, 2];
  codePanel(120, 120, a, { lines: LETTERS.slice(0, n), size: 22, lh: 34, hl, hlCol: li === 1 ? C.amber : C.green, title: "sos.ino" });
  bigLamp(1400, 440, 1.0, run ? ms.on : 0, a); morseMarks(1400, 740, a * P(t, L(1), 0.4), run ? t - L(1) - 1.6 : -1, 56);
  if (t > L(1) + 0.4) chip("loop = 3 أسطر: S · O · S", 1400, 860, { size: 32, col: C.green, a: pop(t, L(1) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 8. COMMON MISTAKES
SCENES.mistakes = (t, L, E) => {
  if (t < L(1) - 0.1) { TW("أخطاء شائعة ⚠️", 960, 400, L(0), { size: 90, weight: 900, colors: { "شائعة": C.red }, g: 20 }); return; }
  const k = t > L(3) - 0.1 ? 3 : t > L(2) - 0.1 ? 2 : 1, a = eo(P(t, L(k) - 0.1, 0.4)); chip(String(k), 180, 200, { size: 40, col: C.red });
  if (k === 1) { codePanel(200, 230, a, { lines: ["void loop() {", "  void dot() {", "    ...", "  }", "}"], size: 30, lh: 50, hl: [1, 2, 3], hlCol: C.red, title: "✗" }); codePanel(1100, 230, a * P(t, L(1) + 2.6, 0.4), { lines: ["void dot() {", "  ...", "}", "void loop() {", "  dot();", "}"], size: 30, lh: 50, hl: [0, 1, 2], hlCol: C.green, title: "✓" });
    I.cross(520, 760, 0.8, { a }); I.check(1420, 760, 0.8, { a: a * P(t, L(1) + 2.6, 0.4) }); }
  if (k === 2) { const b = codeAt("dot;", 640, 400, 90, a), c = codeAt("dot();", 1300, 400, 90, a * P(t, L(2) + 1.4, 0.4)); chip("لا يعمل ✗", 640, 560, { size: 34, col: C.red, a }); chip("يعمل ✓", 1300, 560, { size: 34, col: C.green, a: a * P(t, L(2) + 1.4, 0.4) }); ring(c.at(3) + c.cw, 400, 60, C.green, 5, a * P(t, L(2) + 1.8, 0.4)); }
  if (k === 3) { codeAt("flash();", 960, 330, 80, a); const p = eo(P(t, L(3) + 2.4, 0.3)); card(380, 450, 1160, 150, { col: C.red, r: 18, fill: "rgba(40,10,16,0.96)", a: p });
    T("error: too few arguments to function", 960, 500, { size: 32, weight: 800, fam: "mono", color: C.red, a: p }); T("'void flash(int)'", 960, 550, { size: 32, weight: 800, fam: "mono", color: C.red, a: p }); codeAt("flash(200); ✓", 960, 700, 56, a * P(t, L(3) + 3.6, 0.4)); }
};

// ---------------------------------------------------------------- 9. CHALLENGE: blinkTimes(n)
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 170, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5));
  codePanel(180, 300, a, { lines: ["void blinkTimes(int n) {", "  // ؟؟؟", "}"], size: 36, lh: 60, title: "challenge" });
  if (t > L(2) - 0.1) { const p = eo(P(t, L(2), 0.4)), u = t - L(2) - 0.8, k = Math.max(0, Math.min(5, Math.floor(u / 0.5) + 1)), on = u > 0 && u < 2.5 && (u % 0.5) < 0.25; codeAt("blinkTimes(5);", 1380, 330, 54, p); bigLamp(1380, 560, 0.8, on, p, C.amber);
    T(`${u > 0 ? Math.min(5, k) : 0} / 5`, 1380, 780, { size: 50, weight: 800, fam: "mono", color: C.amber, a: p }); chip("💬 اكتب الحل في التعليقات", 960, 870, { size: 30, col: C.teal, a: pop(t, L(2) + 2.6, 0.45) }); }
};

// ---------------------------------------------------------------- 10. RECAP
const RECAP = [["الدالة: أوامر لها اسم", "f()"], ["نكتبها مرة · نستدعيها كثيرًا", "↻"], ["void: لا ترجع شيئًا", "∅"], ["المعامل: قيمة تدخل", "→"], ["return: نتيجة تخرج", "←"], ["كل دالة وحدها خارج loop", "✓"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  const at = [L(1), L(1) + 2.2, L(1) + 3.4, L(2), L(2) + 2.4, L(2) + 4.0];
  RECAP.forEach(([s, ic], i) => { const p = pop(t, at[i], 0.45), col = [C.green, C.teal, C.violet, C.pink, C.amber, C.blue][i], x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p) || 0.001, 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: ic.length > 2 ? 24 : 30, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 32, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 11. TEASER: sound → a melody
SCENES.teaser = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.6));
  T("الحلقة القادمة", 960, 200, { size: 40, weight: 800, color: C.amber, a });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("الصوت 🎵", 0, 0, L(0) + 0.3, { size: 110, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "الصوت": C.teal } }));
  // a buzzer with notes rising out of it
  withT(960, 600, 1, 0, () => { circle(0, 0, 90, "#15181f", a); ring(0, 0, 90, "#3b4558", 6, a); circle(0, 0, 14, "#0a0c10", a); T("+", -40, -40, { size: 30, weight: 900, color: C.red, a }); });
  for (let i = 0; i < 4; i++) { const u = ((t * 0.5 + i / 4) % 1); T(["♪", "♫", "♩", "♬"][i], 960 + Math.sin(u * 6 + i) * 120 + (i - 1.5) * 60, 560 - u * 260, { size: 56, weight: 900, color: [C.teal, C.amber, C.pink, C.green][i], a: a * (1 - u) * P(u, 0, 0.15) }); }
  for (let i = 0; i < 3; i++) { const u = ((t * 1.2 + i / 3) % 1); ring(960, 600, 100 + u * 160, C.teal, 4, a * (1 - u) * 0.6, -0.7, 0.7); ring(960, 600, 100 + u * 160, C.teal, 4, a * (1 - u) * 0.6, Math.PI - 0.7, Math.PI + 0.7); }
  if (t > L(1) - 0.2) { const p = eo(P(t, L(1), 0.5)); brand(860, 880, p, 1.1); T("مسار", 1000, 876, { size: 50, weight: 900, color: C.text, a: p }); }
};
