// الحلقة 11 · الصوت. scenes get (t, L, E, S, ls): L(k)/E(k) = start/end of the k-th spoken line; ls[k].tones = audible buzzer notes [t0, Hz, s].
"use strict";
const win = (t, a, b, f = 0.3) => P(t, a, f) * (1 - P(t, b - f, f));
const blink = (t, per = 1) => (Math.floor(t / per) % 2 === 0 ? 1 : 0);
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- code: tokenizer + coloured line (LTR, mono). Returns token boxes so a scene can point at any token.
const CODE = ["void setup() {", "  pinMode(13, OUTPUT);", "}", "", "void loop() {", "  digitalWrite(13, HIGH);", "  delay(1000);", "  digitalWrite(13, LOW);", "  delay(1000);", "}"];
function tokCol(s) {
  if (s.startsWith("//")) return C.mut;
  if (/^(void|int|float|bool|const|unsigned|long|for|while|return)$/.test(s)) return C.violet;
  if (/^(redTime|greenTime|yellowTime|temp|isOn|ledPin|x|y|t|i|leds|speed|ms|n|notes|f|d)$/.test(s)) return C.pink;
  if (/^(true|false)$/.test(s)) return C.amber;
  if (s === "setup" || s === "loop") return C.teal;
  if (/^(pinMode|digitalWrite|digitalwrite|delay|tone|noTone)$/.test(s)) return C.blue;
  if (/^(dot|dash|flash|twice|letterS|letterO|blinkTimes|makeCake|beep)$/.test(s)) return C.green;
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


// ======================================================================== EP11 · الصوت
BANDS[100] = [BC.brown, BC.black, BC.brown, BC.gold];
// the buzzer note sounding at time t (the same notes the soundtrack plays): [Hz, progress 0..1] or null
function toneAt(t) { for (const l of TL.lines) for (const [t0, f, d] of l.tones || []) if (t >= t0 && t < t0 + d) return [f, (t - t0) / d]; return null; }
const NOTE = [["Do", 262], ["Re", 294], ["Mi", 330], ["Fa", 349], ["Sol", 392], ["La", 440], ["Si", 494], ["Do", 523]];
// a buzzer seen from above: black cylinder, + mark, centre hole; sound rings when on
function buzzerTop(x, y, s, a, o = {}) { const { on = 0, f = 440, label = "", pcb = 0, sealed = 0 } = o;
  withT(x, y, s, 0, () => { if (on) for (let i = 0; i < 3; i++) { const u = ((NOW * (0.8 + f / 900) + i / 3) % 1); ring(0, 0, 90 + u * 170, C.teal, 5, a * (1 - u) * 0.7); }
    circle(0, 8, 92, "rgba(0,0,0,0.5)", a); circle(0, 0, 90, "#191c22", a); ring(0, 0, 90, "#3a3f4a", 5, a); ring(0, 0, 60, "#262a33", 3, a); circle(0, 0, 14, "#05070a", a);
    T("+", -50, -48, { size: 30, weight: 900, color: "#cfd6df", a }); if (label) T(label, 0, 130, { size: 30, weight: 900, fam: "mono", color: C.text, a });
    if (pcb) { fillRR(-70, 150, 140, 40, 8, "#1f6b3c", a); T("PCB", 0, 171, { size: 18, weight: 800, fam: "mono", color: "#bfe8c9", a }); }
    if (sealed) { fillRR(-70, 150, 140, 40, 8, "#111", a); T("sealed", 0, 171, { size: 18, weight: 800, fam: "mono", color: "#888", a }); } }); }
// a waveform window: square-ish wave with frequency proportional to f
function wave(x, y, w, h, f, a, col = C.teal, phase = 0) { if (a <= 0.001) return; card(x, y - h / 2 - 20, w, h + 40, { col: "#3b4558", r: 18, a, fill: "rgba(8,14,26,0.9)" }); const cyc = Math.max(1.5, f / 70);
  A(a); ctx.beginPath(); for (let i = 0; i <= 400; i++) { const u = i / 400, v = Math.sin((u * cyc + phase) * Math.PI * 2); const yy = y - Math.tanh(v * 3) * h * 0.4; i ? ctx.lineTo(x + 20 + u * (w - 40), yy) : ctx.moveTo(x + 20, yy); } ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); }
function keyboard(cx, y, a, hot = -1, showF = 1) { NOTE.forEach(([n, f], i) => { const x = cx + (i - 3.5) * 130, h = i === hot; fillRR(x - 60, y - 160, 120, 320, 14, h ? "#ffe3a3" : "#eef2f8", a); strokeRR(x - 60, y - 160, 120, 320, 14, h ? C.amber : "#8a93a3", h ? 5 : 2, a); if (h) halo(x, y, 140, "rgba(255,176,32,0.5)", a);
  T(n, x, y + 100, { size: 30, weight: 900, fam: "mono", color: "#1b2130", a }); if (showF) T(String(f), x, y + 200, { size: 28, weight: 800, fam: "mono", color: h ? C.amber : C.mut, a }); });
  [0, 1, 3, 4, 5].forEach((i) => { const x = cx + (i - 3.5) * 130 + 65; fillRR(x - 34, y - 160, 68, 190, 10, "#141821", a); }); }
const noteIx = (f) => NOTE.findIndex(([, g]) => g === f);
function notesFly(x, y, t, a, on) { if (!on) return; for (let i = 0; i < 3; i++) { const u = ((t * 0.9 + i / 3) % 1); T(["♪", "♫", "♬"][i], x + Math.sin(u * 5 + i) * 90 + (i - 1) * 50, y - u * 220, { size: 52, weight: 900, color: [C.teal, C.amber, C.pink][i], a: a * (1 - u) }); } }

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.2, 0.6)), tn = toneAt(t);
  TW("هل يغني الأردوينو؟ 🎤", 960, 190, 0.5, { size: 76, weight: 900, colors: { "يغني": C.teal }, g: 18 });
  uno(700, 560, 0.6, { a: a * P(t, L(0) + 0.6, 0.5) }); buzzerTop(1300, 560, 1.2, a * P(t, L(1), 0.5), { on: !!tn, f: tn ? tn[0] : 440, label: "Buzzer" });
  jumper(unoPt(700, 560, 0.6, 413, 24), [1240, 520], C.amber, a * P(t, L(1) + 0.4, 0.4), 1, 120); notesFly(1300, 420, t, a, !!tn);
  if (t > L(1) + 1.4) chip("2 أمرين فقط: tone · noTone", 960, 860, { size: 32, col: C.teal, a: pop(t, L(1) + 1.6, 0.45) });
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.14)", 1);
  chip("الحلقة 11 · المستوى 2", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("الصوت 🎵", 0, 0, L(0) + 0.3, { size: 120, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "الصوت": C.teal } }));
  wave(560, 640, 800, 160, 440, eo(P(t, L(0) + 1.0, 0.5)), C.teal, t * 2);
};

// ---------------------------------------------------------------- 3. SOUND IS VIBRATION
SCENES.vibration = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5));
  if (t < L(2) - 0.1) { // a vibrating membrane pushing air to an ear
    const vib = Math.sin(t * 40) * 10; fillRR(300, 380, 24, 260, 8, "#5a6372", a); A(a); ctx.beginPath(); ctx.moveTo(340 + vib, 380); ctx.quadraticCurveTo(380 + vib * 2, 510, 340 + vib, 640); ctx.strokeStyle = C.teal; ctx.lineWidth = 8; ctx.stroke();
    for (let c = 0; c < 14; c++) for (let r = 0; r < 9; r++) { const x0 = 420 + c * 60, comp = Math.sin((x0 / 60 - t * 6)) * 14; circle(x0 + comp, 400 + r * 30, 4, hexA(C.blue, 0.3 + 0.3 * (1 + Math.sin(x0 / 60 - t * 6)) / 2), a); }
    T("👂", 1360, 510, { size: 130, a }); arrow(1180, 510, 1270, 510, C.teal, 5, a, 16);
    if (t > L(1) - 0.1) { const p = eo(P(t, L(1), 0.4)); chip("التردد = اهتزازات في الثانية", 1460, 260, { size: 32, col: C.amber, a: pop(t, L(1) + 0.6, 0.45) }); T("Hz", 1460, 760, { size: 90, weight: 900, fam: "mono", color: C.amber, a: p * P(t, L(1) + 2.0, 0.4), g: 18 }); }
    return; }
  if (t < L(3) - 0.1) { const tn = toneAt(t), hi = tn && tn[0] > 500, lo = tn && tn[0] < 500;
    wave(260, 400, 1400, 180, 180, a, lo ? C.amber : "#5a6372", t * 0.5); T("بطيء ← صوت غليظ", 1580, 290, { size: 32, weight: 900, color: C.text, align: "right", a });
    wave(260, 720, 1400, 180, 1200, a * P(t, L(2) + 1.6, 0.4), hi ? C.teal : "#5a6372", t * 2); T("سريع ← صوت حاد", 1580, 610, { size: 32, weight: 900, color: C.text, align: "right", a: a * P(t, L(2) + 1.6, 0.4) });
    if (tn) chip(`${tn[0]} Hz 🔊`, 960, 880 - 30, { size: 34, col: hi ? C.teal : C.amber, a }); return; }
  // hearing range on a log scale
  const x0 = 360, w = 1200, lx = (f) => x0 + w * Math.log10(f / 10) / Math.log10(4000); fillRR(x0, 470, w, 50, 20, "rgba(120,150,200,0.15)", a); const p = eio(P(t, L(3) + 0.4, 1.2)); fillRR(lx(20), 470, (lx(20000) - lx(20)) * p, 50, 20, hexA(C.teal, 0.7), a);
  [[20, "20 Hz"], [440, "440"], [20000, "20 000 Hz"]].forEach(([f, s]) => { seg(lx(f), 530, lx(f), 560, C.mut, 3, a); T(s, lx(f), 600, { size: 30, weight: 800, fam: "mono", color: C.text, a }); }); T("👂 الأذن", 960, 400, { size: 44, weight: 900, color: C.teal, a });
};

// ---------------------------------------------------------------- 4. THE BUZZER: active vs passive
SCENES.buzzer = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), tn = toneAt(t);
  if (t < L(1) - 0.1) { // cross-section: a thin disc that bends
    const b = Math.sin(t * 30) * 12; card(560, 300, 800, 380, { col: "#3b4558", r: 30, a, fill: "rgba(20,24,32,0.95)" }); A(a); ctx.beginPath(); ctx.moveTo(620, 490); ctx.quadraticCurveTo(960, 490 + b * 3, 1300, 490); ctx.strokeStyle = "#d7b56d"; ctx.lineWidth = 10; ctx.stroke(); circle(960, 490 + b * 1.5, 70, hexA(C.teal, 0.2), a);
    T("قرص رقيق يهتز ⚡", 960, 360, { size: 40, weight: 900, color: C.amber, a }); seg(860, 680, 860, 800, "#b9c2cf", 8, a); seg(1060, 680, 1060, 760, "#b9c2cf", 8, a); T("+", 820, 760, { size: 40, weight: 900, color: C.red, a }); return; }
  const actOn = !!(tn && tn[0] === 2300), pasOn = !!(tn && tn[0] < 2300);
  buzzerTop(1380, 420, 1.15, a, { on: actOn, f: 2300, label: "Active", sealed: 1 }); buzzerTop(560, 420, 1.15, a * P(t, L(2) - 0.1, 0.4), { on: pasOn, f: tn ? tn[0] : 440, label: "Passive", pcb: 1 });
  chip("نشط: صوت واحد ثابت", 1380, 720, { size: 30, col: C.amber, a: pop(t, L(1) + 0.4, 0.45) }); wave(1180, 840, 400, 70, 2300, a * P(t, L(1) + 1.0, 0.4) * (actOn ? 1 : 0.4), C.amber, t * 3);
  if (t > L(2) - 0.1) { chip("سلبي: أي تردد نرسله", 560, 720, { size: 30, col: C.teal, a: pop(t, L(2) + 0.4, 0.45) }); wave(360, 840, 400, 70, pasOn ? tn[0] : 300, a * P(t, L(2) + 1.0, 0.4) * (pasOn ? 1 : 0.4), C.teal, t * 3); }
  if (t > L(3) - 0.1) { ring(560, 420, 140, C.green, 6, a * (0.6 + 0.4 * Math.sin(t * 5))); chip("للألحان ✓", 960, 420, { size: 38, col: C.green, a: pop(t, L(3) + 0.3, 0.45) }); }
};

// ---------------------------------------------------------------- 5. WIRING: pin 8 -> 100 Ω -> buzzer + ; − -> GND
SCENES.wiring = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)); bboard(a); uno(UNO.x, UNO.y, UNO.s, { a });
  const pp = hole(16, "e"), pm = hole(19, "e"), bx = (pp[0] + pm[0]) / 2, by = pp[1] - 10;
  const r = t > L(1) - 0.1 ? eo(P(t, L(1) + 0.4, 0.5)) : 0;
  jumper(pinPt("8"), hole(r > 0 ? 12 : 16, "a"), C.amber, a, eo(P(t, L(0) + 0.6, 0.7)), 60); if (r > 0) resistorAt(hole(12, "c"), hole(16, "c"), a * r, 100);
  jumper(hole(19, "a"), rail(19, "-"), GNDW, a, eo(P(t, L(0) + 1.6, 0.5)), 30); jumper(rail(2, "-"), pinPt("GND"), GNDW, a, eo(P(t, L(0) + 2.2, 0.6)), 80);
  buzzerTop(bx, by, 0.5, a); T("+", pp[0], pp[1] + 46, { size: 28, weight: 900, color: C.red, a }); T("−", pm[0], pm[1] + 46, { size: 28, weight: 900, color: C.blue, a });
  chip("الموجب ← القطب 8 · السالب ← GND", 960, 820, { size: 32, col: C.teal, a: pop(t, L(0) + 1.0, 0.45) });
  if (r > 0) chip("100 Ω للحماية (بني · أسود · بني)", 960, 160, { size: 30, col: C.amber, a: pop(t, L(1) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 6. tone / noTone
SCENES.tone = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), tn = toneAt(t), k = t > L(3) - 0.1 ? 3 : t > L(2) - 0.1 ? 2 : t > L(1) - 0.1 ? 1 : 0;
  const s = k === 2 ? "noTone(8);" : k === 3 ? "tone(8, 440, 500);" : k === 1 ? "tone(8, 440);" : "tone(pin, Hz);", cl = codeAt(s, 960, 230, 70, a);
  if (k === 0) { under(cl.at(5), cl.at(8), 270, "رقم القطب", C.amber, a * P(t, L(0) + 1.6, 0.4)); under(cl.at(10), cl.at(12), 270, "التردد", C.teal, a * P(t, L(0) + 2.8, 0.4)); }
  if (k === 1) { under(cl.at(5), cl.at(6), 270, "القطب 8", C.amber, a); under(cl.at(8), cl.at(11), 270, "440 Hz = La", C.teal, a * P(t, L(1) + 1.0, 0.4)); }
  if (k === 2) chip("⏹ يوقف الصوت", 960, 340, { size: 34, col: C.red, a: pop(t, L(2) + 0.6, 0.45) });
  if (k === 3) under(cl.at(13), cl.at(16), 270, "المدة ms ← يتوقف وحده", C.violet, a * P(t, L(3) + 1.6, 0.4));
  buzzerTop(560, 640, 0.95, a, { on: !!tn, f: tn ? tn[0] : 440 }); wave(860, 640, 760, 180, tn ? tn[0] : 440, a * (tn ? 1 : 0.35), tn ? C.teal : "#3b4558", t * 4);
  if (tn) { notesFly(560, 520, t, a, true); if (k === 3) { fillRR(860, 760, 760 * (1 - tn[1]), 12, 6, C.violet, a); } }
};

// ---------------------------------------------------------------- 7. NOTES → array → scale → melody
SCENES.notes = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.2, 0.5)), tn = toneAt(t), hot = tn ? noteIx(tn[0]) : -1;
  if (t < L(1) - 0.1) { keyboard(960, 470, a, -1); return; }
  const code = ["int notes[] = {262, 294, 330, 349,", "               392, 440, 494, 523};", "", "void loop() {", "  for (int i = 0; i < 8; i++) {", "    tone(8, notes[i], 250);", "    delay(320);", "  }", "  delay(1000);", "}"];
  const hl = t < L(2) - 0.1 ? [0, 1] : t < L(3) - 0.1 ? [6] : tn ? [5] : -1;
  codePanel(100, 140, a, { lines: code, size: 24, lh: 40, hl, hlCol: hot >= 0 ? C.amber : C.teal, title: "melody.ino" });
  withT(1310, 470, 0.68, 0, () => keyboard(0, 0, 1 * a, hot)); notesFly(1310, 260, t, a, !!tn);
  if (t > L(3) - 0.1 && t < L(4) - 0.1 && tn) chip(`notes[${hot}] = ${NOTE[hot][1]} · ${NOTE[hot][0]}`, 1310, 820, { size: 30, col: C.amber, a });
  if (t > L(4) - 0.1) { chip("🎶 لحن من عندنا", 1310, 820, { size: 32, col: C.pink, a: pop(t, L(4) + 0.4, 0.45) }); }
  if (t > L(1) + 1.0 && t < L(2)) chip("مصفوفة الترددات ← for", 1310, 820, { size: 30, col: C.teal, a: pop(t, L(1) + 1.2, 0.45) });
};

// ---------------------------------------------------------------- 8. COMMON MISTAKES
SCENES.mistakes = (t, L, E) => {
  if (t < L(1) - 0.1) { TW("أخطاء شائعة ⚠️", 960, 400, L(0), { size: 90, weight: 900, colors: { "شائعة": C.red }, g: 20 }); return; }
  const k = t > L(3) - 0.1 ? 3 : t > L(2) - 0.1 ? 2 : 1, a = eo(P(t, L(k) - 0.1, 0.4)), tn = toneAt(t); chip(String(k), 180, 200, { size: 40, col: C.red });
  if (k === 1) { codePanel(160, 240, a, { lines: ["tone(8, 262, 300);", "tone(8, 330, 300);"], size: 36, lh: 60, hl: [0], hlCol: C.red, title: "✗" }); codePanel(1060, 240, a * P(t, L(1) + 3.0, 0.4), { lines: ["tone(8, 262, 300);", "delay(350);", "tone(8, 330, 300);"], size: 36, lh: 60, hl: [1], hlCol: C.green, title: "✓" });
    const x0 = 300, y = 600, sc = 600; fillRR(x0, y, 0.05 * sc, 40, 6, hexA(C.amber, 0.5), a); fillRR(x0 + 0.05 * sc, y, 0.3 * sc, 40, 6, C.amber, a); T("262 قُطع ✗ · نسمع 330 فقط", 600, 700, { size: 28, weight: 900, color: C.red, a: a * P(t, L(1) + 1.6, 0.4) }); }
  if (k === 2) { codeAt("tone(8, 600);", 960, 300, 70, a); wave(360, 560, 1200, 160, 600, a, tn ? C.red : "#5a6372", t * 4); T("∞", 1660, 560, { size: 110, weight: 900, fam: "mono", color: C.red, a }); chip("لا تنس noTone(8) ✋", 960, 780, { size: 34, col: C.amber, a: pop(t, L(2) + 2.0, 0.45) }); }
  if (k === 3) { buzzerTop(960, 470, 1.2, a, { label: "Active", sealed: 1 }); codeAt("tone(8, 262); tone(8, 523); …", 960, 760, 40, a * 0.6); chip("صوت واحد فقط ✗ · للألحان: Passive", 960, 850, { size: 30, col: C.red, a: pop(t, L(3) + 1.0, 0.45) }); }
};

// ---------------------------------------------------------------- 9. CHALLENGE: a doorbell with beep(f, d)
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 170, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5)), tn = toneAt(t);
  codePanel(160, 320, a, { lines: ["void beep(int f, int d) {", "  // ؟؟؟", "}", "", "beep(659, 500);  // دينغ", "beep(523, 800);  // دونغ"], size: 30, lh: 50, hl: tn ? [tn[0] === 659 ? 4 : 5] : -1, hlCol: C.amber, title: "doorbell" });
  const sw = tn ? Math.sin(t * 30) * 0.2 : 0; withT(1400, 520, 1, sw, () => T("🔔", 0, 0, { size: 200, a })); notesFly(1400, 380, t, a, !!tn);
  if (t > L(2) - 0.1) chip("💬 اكتب الكود في التعليقات", 1400, 820, { size: 30, col: C.teal, a: pop(t, L(2) + 0.3, 0.45) });
};

// ---------------------------------------------------------------- 10. RECAP
const RECAP = [["الصوت اهتزاز", "〰"], ["التردد: اهتزازات/ثانية (Hz)", "Hz"], ["tone(pin, Hz, ms)", "▶"], ["noTone(pin) يوقف", "⏹"], ["للألحان: Buzzer سلبي", "♪"], ["بعد tone بمدة: delay", "⏱"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  const at = [L(1), L(1) + 2.2, L(2), L(2) + 2.0, L(2) + 3.8, L(2) + 5.0];
  RECAP.forEach(([s, ic], i) => { const p = pop(t, at[i], 0.45), col = [C.teal, C.amber, C.blue, C.red, C.pink, C.violet][i], x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p) || 0.001, 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: ic.length > 1 ? 26 : 32, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 32, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 11. TEASER: level 2 done → test yourself 2 (a doorbell)
SCENES.teaser = (t, L, E) => {
  const a0 = eo(P(t, L(0) - 0.2, 0.5)) * (1 - eo(P(t, L(1) - 0.3, 0.4)));
  if (a0 > 0) { halo(960, 440, 520, "rgba(70,224,138,0.18)", a0); withT(960, 440, 0.8 + 0.2 * back(P(t, L(0), 0.7)), 0, () => { card(-380, -130, 760, 260, { col: C.green, r: 50, a: a0 }); T("المستوى 2 ✓", 0, 4, { size: 92, weight: 900, color: C.green, a: a0, g: 24 }); }); confetti(960, 440, L(0) + 0.3, a0); }
  if (t > L(1) - 0.3) { const a = eo(P(t, L(1) - 0.2, 0.6));
    T("الحلقة القادمة", 960, 200, { size: 40, weight: 800, color: C.amber, a });
    withT(960, 320, 0.9 + 0.1 * back(P(t, L(1), 0.6)), 0, () => TW("اختبر نفسك 2 🧠", 0, 0, L(1) + 0.1, { size: 100, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "نفسك": C.teal } }));
    withT(1420, 600, 1, Math.sin(t * 6) * 0.08, () => T("🔔", 0, 0, { size: 170, a }));
    ["أسئلة ❓", "لغز 🧩", "مشروع: جرس باب بلحن 🔔"].forEach((s, i) => chip(s, 800, 520 + i * 100, { size: 34, col: [C.teal, C.violet, C.amber][i], a: pop(t, L(1) + 1.2 + i * 0.8, 0.45) }));
    if (t > L(2) - 0.2) { const p = eo(P(t, L(2), 0.5)); brand(860, 880, p, 1.1); T("مسار", 1000, 876, { size: 50, weight: 900, color: C.text, a: p }); } }
};
