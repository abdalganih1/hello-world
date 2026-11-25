// الحلقة 07 · اختبر نفسك (المستوى 1). scenes get (t, L, E, S, ls): L(k)/E(k) = start/end of the k-th spoken line; ls = the scene's timeline lines.
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

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.2, 0.6)); halo(960, 400, 560, "rgba(70,224,138,0.16)", a);
  withT(960, 400, 0.8 + 0.2 * back(P(t, 0.3, 0.7)), 0, () => { card(-380, -120, 760, 240, { col: C.green, r: 50, a }); T("المستوى 1 ✓", 0, 4, { size: 90, weight: 900, color: C.green, a, g: 22 }); });
  if (t > L(0) + 1.6) T("مستعد؟", 960, 600, { size: 70, weight: 900, color: C.amber, a: pop(t, L(0) + 1.8, 0.5), g: 18 });
  if (t > L(1) - 0.1) ["5 أسئلة ❓", "لغز 🧩", "مشروع: إشارة مرور 🚦"].forEach((s, i) => chip(s, 1380 - i * 420, 760, { size: 36, col: [C.teal, C.violet, C.amber][i], a: pop(t, L(1) + 0.4 + i * 0.9, 0.45) }));
};

// ---------------------------------------------------------------- 2. TITLE + the rule
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.14)", 1);
  chip("الحلقة 07", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("اختبر نفسك 🧠", 0, 0, L(0) + 0.3, { size: 112, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "نفسك": C.teal } }));
  if (t > L(1) - 0.2) { const p = eo(P(t, L(1), 0.5)); chip("أجب قبل الجواب ✋", 1180, 620, { size: 40, col: C.amber, a: pop(t, L(1) + 0.4, 0.45) });
    const u = clamp((t - L(1) - 2.4) / 5); circle(700, 620, 80, "rgba(8,14,26,0.95)", p); ring(700, 620, 80, "rgba(120,140,180,0.3)", 10, p); ring(700, 620, 80, C.amber, 10, p, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - u)); T(String(Math.max(1, 5 - Math.floor(Math.max(0, t - L(1) - 2.4)))), 700, 624, { size: 70, weight: 900, fam: "mono", color: C.amber, a: p }); }
};

// ---------------------------------------------------------------- 3. Q1: find the mistake (digitalwrite)
SCENES.q1 = (t, L, E, S, ls) => {
  qHead(t, 1, L); const a = eo(P(t, L(0) + 0.3, 0.5)), rv = P(t, revealAt(ls, 0), 0.5), size = 64;
  const bad = "digitalwrite(13, HIGH);", good = "digitalWrite(13, HIGH);", w = lineW(bad, size), x0 = 960 - w / 2, wx = x0 + lineW("digital", size), cw = lineW("w", size);
  card(x0 - 50, 330, w + 100, 150, { col: rv > 0 ? C.green : C.blue, r: 26, fill: "rgba(6,12,24,0.97)", a });
  if (rv < 1) codeLine(bad, x0, 405, { size, a: a * (1 - rv) }); const tk = codeLine(rv > 0 ? good : bad, x0, -9999, { size, a: 0 })[0], ch = tk.w / 12, wc = tk.x + ch * 7.5; if (rv > 0) codeLine(good, x0, 405, { size, a: a * rv });
  cdown(t, ls, 0, 1640, 620);
  if (rv > 0) { ring(wc, 405, 52, C.green, 6, rv); chip("W كبيرة ✓", wc, 560, { size: 34, col: C.green, a: pop(t, revealAt(ls, 0) + 0.3, 0.45) });
    if (t > L(1) + 2.0) chip("digitalwrite ≠ digitalWrite", 960, 700, { size: 32, col: C.amber, a: pop(t, L(1) + 2.2, 0.45) }); }
};

// ---------------------------------------------------------------- 4. Q2: which leg is positive?
SCENES.q2 = (t, L, E, S, ls) => {
  qHead(t, 2, L); const a = eo(P(t, L(0) + 0.3, 0.5)), rv = P(t, revealAt(ls, 0), 0.5);
  bigLED(560, 360, 1.0, a, { on: rv, tags: rv });
  ["الطرف الطويل", "الطرف القصير", "الجانب المسطح"].forEach((s, i) => { const q = clamp(pop(t, L(0) + 1.4 + i * 0.4, 0.4)) * a, good = i === 0, col = rv > 0 ? (good ? C.green : "#3b4558") : C.blue, y = 330 + i * 140, dim = rv > 0 && !good ? 0.45 : 1;
    withT(1180, y, q || 0.001, 0, () => { card(-220, -52, 440, 104, { col, r: 52, fill: rv > 0 && good ? "rgba(16,48,34,0.95)" : "rgba(10,20,36,0.92)", a: dim }); T(["أ", "ب", "ج"][i], 170, 2, { size: 34, weight: 900, color: col, a: dim }); T(s, -20, 2, { size: 34, weight: 900, color: C.text, a: dim }); if (rv > 0 && good) I.check(-180, 0, 0.6, { a: rv }); }); });
  cdown(t, ls, 0, 1640, 470);
  if (t > L(1) + 1.6) chip("المسطح = السالب −", 1180, 760, { size: 32, col: C.blue, a: pop(t, L(1) + 1.8, 0.45) });
};

// ---------------------------------------------------------------- 5. Q3: orange, orange, brown
SCENES.q3 = (t, L, E, S, ls) => {
  qHead(t, 3, L); const a = eo(P(t, L(0) + 0.3, 0.5)), rv = P(t, revealAt(ls, 0), 0.5), RX = 820, RY = 400, sc = 3.0; bigRes(RX, RY, sc, a, 330);
  [["برتقالي", BC.orange, 0], ["برتقالي", BC.orange, 1], ["بني", BC.brown, 2]].forEach(([n, c, i]) => { const q = pop(t, L(0) + 2.0 + i * 0.5, 0.4), bx = RX + bandX(i, sc), cx = RX - 260 + i * 260; seg(bx, RY + 40, cx, RY + 110, hexA(c, 0.9), 3, a * clamp(q)); chip(rv > 0 ? ["3", "3", "0 ×1"][i] + " · " + n : n, cx, RY + 140, { size: 28, col: c, a: q }); });
  ["33 Ω", "330 Ω", "3300 Ω"].forEach((s, i) => { const q = clamp(pop(t, L(0) + 3.6 + i * 0.4, 0.4)) * a, good = i === 1, col = rv > 0 ? (good ? C.green : "#3b4558") : C.blue, x = 1260 - i * 460 + 460, y = 760, dim = rv > 0 && !good ? 0.45 : 1;
    withT(x - 460 + 200, y, q || 0.001, 0, () => { card(-170, -50, 340, 100, { col, r: 50, fill: rv > 0 && good ? "rgba(16,48,34,0.95)" : "rgba(10,20,36,0.92)", a: dim }); T(["أ", "ب", "ج"][i], 120, 2, { size: 32, weight: 900, color: col, a: dim }); T(s, -20, 2, { size: 38, weight: 800, fam: "mono", color: C.text, a: dim }); }); });
  cdown(t, ls, 0, 1640, 400);
};

// ---------------------------------------------------------------- 6. Q4: 5 V, LED 2 V, 100 Ω → current? safe?
SCENES.q4 = (t, L, E, S, ls) => {
  qHead(t, 4, L); const a = eo(P(t, L(0) + 0.3, 0.5)), rv = t > revealAt(ls, 1) ? 1 : 0;
  [["5 V", "الأردوينو", C.amber], ["2 V", "الضوء", C.red], ["100 Ω", "المقاوم", C.teal]].forEach(([v, n, c], i) => { const p = pop(t, L(0) + 1.2 + i * 1.4, 0.4), x = 1360 - i * 400;
    withT(x, 360, clamp(p) || 0.001, 0, () => { card(-150, -80, 300, 160, { col: c, r: 28 }); T(v, 0, -16, { size: 56, weight: 800, fam: "mono", color: c }); T(n, 0, 48, { size: 28, weight: 900, color: C.text }); }); });
  if (t > L(1) - 0.1 && !rv) chip("I = ؟ · آمن؟", 960, 560, { size: 40, col: C.blue, a: pop(t, L(1) + 0.2, 0.45) });
  cdown(t, ls, 1, 1640, 640);
  if (rv) { const p = eo(P(t, L(2), 0.4)); T("(5 − 2) ÷ 100 = 0.03 A = 30 mA", 960, 560, { size: 54, weight: 800, fam: "mono", color: C.red, a: p, g: 14 });
    const x0 = 560, w = 800, y = 680, mx = (v) => x0 + w * clamp(v / 50); fillRR(x0, y, w * 0.4, 40, 12, hexA(C.green, 0.7), p); fillRR(x0 + w * 0.4, y, w * 0.6, 40, 12, hexA(C.red, 0.7), p); T("20 mA", mx(20), y + 70, { size: 26, weight: 800, fam: "mono", color: C.mut, a: p });
    const u = eio(P(t, L(2) + 0.5, 0.8)), fix = eio(P(t, L(3) + 0.4, 0.8)), v = lerp(0, 30, u) + (13.6 - 30) * fix, col = fix > 0.5 ? C.green : C.red, xx = mx(v); seg(xx, y - 14, xx, y + 54, col, 8, p); circle(xx, y - 18, 12, col, p);
    if (fix <= 0.5 && t > L(2) + 1.6) I.cross(mx(30) + 70, y + 20, 0.6, { a: p }); if (t > L(3) - 0.1) chip("220 Ω ← ≈ 14 mA ✓", 960, 800, { size: 36, col: C.green, a: pop(t, L(3) + 0.8, 0.45) }); }
};

// ---------------------------------------------------------------- 7. Q5: both legs in the same column
SCENES.q5 = (t, L, E, S, ls) => {
  qHead(t, 5, L); const a = eo(P(t, L(0) + 0.3, 0.5)), rv = P(t, revealAt(ls, 0), 0.4);
  bboard(a, { strips: rv, colHot: 15 }); const p0 = hole(15, "b"), p1 = hole(15, "d"); ledAt(p0, p1, a, 0);
  if (rv > 0) { arrow(p0[0] + 26, p0[1], p0[0] + 26, p1[1], C.amber, 5, rv, 14); I.cross(p0[0] + 90, p0[1] - 60, 0.7, { a: rv }); chip("لا يضيء ✗ · التيار يمر في الشريط", 960, 820, { size: 34, col: C.red, a: pop(t, revealAt(ls, 0) + 0.2, 0.45) }); }
  else if (t > L(0) + 2.0) chip("يضيء؟", 960, 820, { size: 40, col: C.blue, a: pop(t, L(0) + 2.2, 0.45) });
  cdown(t, ls, 0, 1830, 480, 66);
};

// ---------------------------------------------------------------- 8. PUZZLE: wire on 12, code on 13
SCENES.puzzle = (t, L, E, S, ls) => {
  TW("اللغز 🧩", 960, 150, L(0), { size: 70, weight: 900, colors: { "اللغز": C.violet }, g: 18 });
  const a = eo(P(t, L(0) + 0.3, 0.5)), rv = t > revealAt(ls, 1), fx = t > L(3) + 1.0 ? eio(P(t, L(3) + 1.0, 0.8)) : 0, on = fx >= 1 ? BLINK(t, 0.5, 0.5) : 0;
  bboard(a); uno(UNO.x, UNO.y, UNO.s, { a, led: BLINK(t, 0.5, 0.5) }); const p12 = pinPt("12"), p13 = pinPt("13"), pw = [lerp(p12[0], p13[0], fx), p12[1]];
  jumper(pw, hole(11, "a"), C.amber, a); resistorAt(hole(11, "c"), hole(15, "c"), a); ledAt(hole(15, "d"), hole(16, "d"), a, on); jumper(hole(16, "a"), rail(16, "-"), GNDW, a, 1, 30); jumper(rail(2, "-"), pinPt("GND"), GNDW, a, 1, 80);
  editor(1180, 760, 560, 110, a, "blink.ino"); const toks = codeLine("digitalWrite(13, HIGH);", 1210, 832, { size: 28, a });
  cdown(t, ls, 1, 1720, 170, 66);
  if (rv) { const tk = toks[2]; ring(tk.x + tk.w / 2, 832, 34, C.amber, 5, a * (fx > 0 ? 1 - fx : 1)); ring(p12[0], p12[1], 30, C.red, 5, a * (1 - fx)); chip(fx > 0.5 ? "القطب 13 ✓" : "القطب 12 ✗", pw[0], pw[1] - 60, { size: 28, col: fx > 0.5 ? C.green : C.red, a }); }
  if (t > L(3) - 0.1) chip("رقم الكود = مكان السلك", 960, 230, { size: 32, col: C.teal, a: pop(t, L(3) + 0.3, 0.45) });
};

// ---------------------------------------------------------------- 9. PROJECT: a traffic light (12 red, 11 yellow, 10 green)
const TLED = [{ pin: "12", col: C.red, c: 8 }, { pin: "11", col: C.amber, c: 16 }, { pin: "10", col: C.green, c: 24 }];
const pinX = { "12": 311.5, "11": 336.9, "10": 362.3 };
const tlPin = (p) => unoPt(UNO.x, UNO.y, UNO.s, pinX[p], 24);
const TCODE = ["void setup() {", "  pinMode(12, OUTPUT); // أحمر", "  pinMode(11, OUTPUT); // أصفر", "  pinMode(10, OUTPUT); // أخضر", "}", "void loop() {", "  digitalWrite(12, HIGH);", "  delay(3000);", "  digitalWrite(12, LOW);", "  digitalWrite(10, HIGH);", "  delay(3000);", "  digitalWrite(10, LOW);", "  digitalWrite(11, HIGH);", "  delay(1000);", "  digitalWrite(11, LOW);", "}"];
function tlPhase(u) { const m = ((u % 7) + 7) % 7; return m < 3 ? 0 : m < 6 ? 2 : 1; } // 0 red, 2 green, 1 yellow
function tlCircuit(t, a, k, ts, ph = -1) {
  bboard(a); uno(UNO.x, UNO.y, UNO.s, { a });
  TLED.forEach((l, i) => { const p = k > 0 ? eo(P(t, ts + i * 0.7, 0.5)) : 0; if (p <= 0) return; const r0 = l.c - 4;
    jumper(tlPin(l.pin), hole(r0, "a"), l.col, a, p, 70 + i * 25); resistorAt(hole(r0, "c"), hole(l.c, "c"), a * p); ledAt(hole(l.c, "d"), hole(l.c + 1, "d"), a * p, ph === i ? 1 : 0, l.col);
    if (k > 1) jumper(hole(l.c + 1, "a"), rail(l.c + 1, "-"), GNDW, a, eo(P(t, ts + 2.4 + i * 0.4, 0.5)), 30); });
  if (k > 1) jumper(rail(2, "-"), pinPt("GND"), GNDW, a, eo(P(t, ts + 3.8, 0.6)), 80);
}
function trafficLight(x, y, s, ph, a) { withT(x, y, s, 0, () => { fillRR(-14, 230, 28, 220, 6, "#2a3142", a); card(-100, -260, 200, 500, { col: "#3b4558", r: 46, fill: "rgba(12,16,26,0.97)", a });
  [[C.red, -150], [C.amber, 0], [C.green, 150]].forEach(([c, yy], i) => { const on = ph === i; if (on) halo(0, yy, 160, hexA(c, 0.75), a); circle(0, yy, 62, on ? c : hexA(c, 0.18), a); if (on) circle(-18, yy - 18, 12, "rgba(255,255,255,0.7)", a); }); }); }
SCENES.project = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  if (t < L(3) - 0.2) { const k = t > L(2) - 0.2 ? 2 : t > L(1) - 0.2 ? 1 : 0; tlCircuit(t, a, k, L(1) + 0.5, k === 2 && t > L(2) + 4.2 ? tlPhase((t - L(2) - 4.2) * 2.4) : -1);
    if (t < L(1)) { TW("المشروع: إشارة مرور 🚦", 960, 150, L(0) + 0.3, { size: 60, weight: 900, colors: { "إشارة": C.amber, "مرور": C.amber }, g: 14 }); }
    if (k >= 1) TLED.forEach((l, i) => chip(["أحمر ← 12", "أصفر ← 11", "أخضر ← 10"][i], 1480 - i * 300, 820, { size: 30, col: l.col, a: pop(t, L(1) + 0.8 + i * 1.6, 0.45) }));
    if (k === 2) chip("القصيرة ← الأزرق ← GND", 960, 160, { size: 32, col: C.teal, a: pop(t, L(2) + 0.4, 0.45) }); return; }
  // code + a big traffic light running the same program
  const b = eo(P(t, L(3) - 0.2, 0.5)), run = t > L(4) - 0.2, u = run ? t - (L(4) + 0.6) : -1, ph = run && u >= 0 ? tlPhase(u) : -1;
  const m = ((u % 7) + 7) % 7, hl = !run ? (t > L(3) + 0.4 ? [1, 2, 3] : -1) : u < 0 ? -1 : m < 3 ? [6, 7] : m < 6 ? [9, 10] : [12, 13];
  codePanel(160, 150, b, { lines: TCODE, size: 26, lh: 37, hl, hlCol: ph === 0 ? C.red : ph === 2 ? C.green : ph === 1 ? C.amber : C.teal, title: "traffic.ino" });
  trafficLight(1340, 470, 1.0, ph, b);
  if (run && u >= 0) { const left = m < 3 ? 3 - m : m < 6 ? 6 - m : 7 - m; T(left.toFixed(1) + " s", 1600, 470, { size: 44, weight: 800, fam: "mono", color: [C.red, C.amber, C.green][ph], a: b }); }
  if (t > L(5) - 0.1 && t < L(6)) chip("ضوء واحد في كل لحظة ≈ 14 mA ✓", 1340, 820, { size: 30, col: C.green, a: pop(t, L(5) + 0.3, 0.45) });
  if (t > L(6) - 0.1) { chip("→ Upload ✓", 1340, 820, { size: 34, col: C.teal, a: pop(t, L(6) + 0.2, 0.45) }); confetti(1340, 470, L(6) + 0.6, b); }
};

// ---------------------------------------------------------------- 10. CHEAT SHEET (level 1)
SCENES.sheet = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.6)), p = clamp(back(P(t, L(0), 0.7)));
  withT(960, 520, 0.85 + 0.15 * p, 0, () => {
    card(-760, -400, 1520, 760, { col: C.teal, r: 40, a, fill: "rgba(10,18,32,0.97)" });
    T("بطاقة المستوى 1 📌", 0, -340, { size: 52, weight: 900, color: C.teal, a });
    fillRR(-4, -280, 8, 600, 4, "rgba(120,150,200,0.25)", a);
    // code column (left)
    [["pinMode(13, OUTPUT);", "القطب مخرج"], ["digitalWrite(13, HIGH);", "شغّل · LOW أطفئ"], ["delay(1000);", "انتظر 1000 ms = 1 s"], ["setup مرة واحدة · loop دائمًا", ""], ["كل أمر ينتهي بـ ;", ""]].forEach(([c, n], i) => { const y = -230 + i * 110, q = a * P(t, L(0) + 0.6 + i * 0.25, 0.4);
      if (/^[a-z]/.test(c) && c.includes("(") && !c.includes("setup")) { codeLine(c, -720, y, { size: 30, a: q }); T(n, -60, y + 42, { size: 24, weight: 800, color: C.mut, align: "right", a: q }); } else T(c, -380, y, { size: 32, weight: 900, color: C.text, a: q }); });
    // electricity column (right)
    [["V = I × R", C.amber], ["LED: الطويل + · القصير −", C.red], ["مع 5V: مقاوم 220 Ω", C.teal], ["الألوان: رقم · رقم · أصفار", C.violet], ["القطب ≤ 20 mA", C.green], ["Breadboard: 5 ثقوب = موصولة", C.blue]].forEach(([s, c], i) => { const y = -240 + i * 96, q = a * P(t, L(0) + 1.4 + i * 0.25, 0.4);
      circle(700, y, 10, c, q); T(s, 670, y, { size: 32, weight: 900, color: C.text, align: "right", a: q, fam: /^[A-Z]/.test(s) && !isAr(s) ? "mono" : "Cairo" }); });
  });
  if (t > L(1) - 0.1) chip("؟ / 5 · اكتب نتيجتك 💬", 960, 960 - 70, { size: 34, col: C.amber, a: pop(t, L(1) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 11. TEASER: level 2, variables
SCENES.teaser = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.6));
  T("الحلقة القادمة · المستوى 2", 960, 200, { size: 40, weight: 800, color: C.amber, a });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("المتغيرات 📦", 0, 0, L(0) + 0.5, { size: 104, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "المتغيرات": C.teal } }));
  if (t > L(1) - 0.2) { const p = clamp(pop(t, L(1) + 0.2, 0.5)), lid = eo(P(t, L(1) + 1.2, 0.6));
    withT(800, 600, p || 0.001, 0, () => { fillRR(-170, -60, 340, 200, 18, "#a8743a", 1); fillRR(-170, -60, 340, 30, 8, "#8a5e2c", 1); withT(-170, -70, 1, -0.5 * lid, () => fillRR(0, -24, 340, 34, 10, "#c48a48", 1)); fillRR(-110, 20, 220, 60, 12, "#f3e6cc", 1); T("redTime", 0, 52, { size: 32, weight: 800, fam: "mono", color: "#3a2a14" }); T("3000", 0, -40 - 60 * lid, { size: 48, weight: 800, fam: "mono", color: C.amber, a: lid }); });
    trafficLight(1260, 620, 0.55, Math.floor(t * 1.5) % 3 === 0 ? 0 : Math.floor(t * 1.5) % 3 === 1 ? 2 : 1, p); }
  if (t > L(2) - 0.2) { const p = eo(P(t, L(2), 0.5)); brand(860, 880, p, 1.1); T("مسار", 1000, 876, { size: 50, weight: 900, color: C.text, a: p }); }
};
