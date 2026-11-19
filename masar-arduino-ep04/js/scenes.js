// الحلقة 04 · الكهرباء ببساطة. 12 scenes; each gets (t, L, E, S, ls): L(k)/E(k) = start/end of its k-th spoken line.
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

// ---------------------------------------------------------------- 1. HOOK: why does a tiny light burn?
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.3, 0.7)), boom = L(0) + 2.2, burnt = t > boom;
  if (t < L(1) - 0.1) { battery(760, 460, 1, "5V", C.amber, a); const lx = 1180, ly = 420, ls = 1.3, g = ledLegs(lx, ly, ls);
    const p1 = [[760, 340], [760, 240], [1060, 240], [1060, 640], [g.an[0], 640], g.an], p2 = [g.ca, [1320, g.ca[1]], [1320, 720], [760, 720], [760, 580]];
    poly(p1, "#3a4a66", 8, a); poly(p2, "#3a4a66", 8, a); if (!burnt) { const u = P(t, L(0) + 0.8, 1.2); flow(p1, t, C.amber, 6, 1.6 + u * 3, 6, a * u); flow(p2, t, C.amber, 6, 1.6 + u * 3, 6, a * u); }
    ledPart(lx, ly, ls, burnt ? 0 : P(t, L(0) + 1.0, 0.6) * (1 + 0.3 * Math.sin(t * 40)), a, C.red, burnt); legTags(lx, ly, ls, a); spark(lx, ly - 20, boom, a); smoke(lx, ly - 60, boom, a);
    chip("بلا مقاوم!", 1060, 170, { size: 30, col: C.red, a: pop(t, L(0) + 0.6, 0.4) });
    if (burnt) T("💥", 1350, 310, { size: 90 * pop(t, boom, 0.4), a }); return; }
  [["V", "الجهد", C.amber], ["I", "التيار", C.blue], ["R", "المقاومة", C.teal]].forEach(([s, n, c], i) => { const p = pop(t, L(1) + 1.2 + i * 0.7, 0.45); withT(1260 - i * 300, 450, clamp(p), 0, () => { card(-120, -130, 240, 260, { col: c, r: 30 }); T(s, 0, -24, { size: 110, weight: 900, fam: "mono", color: c, g: 24 }); T(n, 0, 80, { size: 36, weight: 900, color: C.text }); }); });
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(255,176,32,0.12)", 1);
  chip("الحلقة 04", 960, 190, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 360, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("الكهرباء… ببساطة ⚡", 0, 0, L(0) + 0.3, { size: 120, weight: 900, color: C.text, g: 36, gc: "rgba(255,176,32,0.6)", colors: { "الكهرباء…": C.amber } }));
  if (t > L(1) - 0.2) [["لا قطع اليوم ✓", C.teal], ["💧 الفكرة بالماء أولًا", WATER]].forEach(([s, c], i) => chip(s, 1150 - i * 420, 600, { size: 34, col: c, a: pop(t, L(1) + 0.4 + i * 1.6, 0.45) }));
};

// ---------------------------------------------------------------- 3. WATER: pressure, flow, narrowing
const PIPE = [[520, 440], [520, 640], [1500, 640], [1500, 760]];
function waterScene(t, a, o = {}) {
  const { press = 0, flowA = 1, narrow = 0, spd = 0.45 } = o; tank(520, 300, a); halo(520, 300, 300, "rgba(77,163,255,0.12)", a);
  const nx0 = 1000, nx1 = 1200, w = 26, wn = lerp(26, 9, narrow);
  pipe([[520, 420], [520, 640], [nx0, 640]], w, a); pipe([[nx0, 640], [nx1, 640]], wn, a); pipe([[nx1, 640], [1500, 640], [1500, 760]], w, a);
  if (narrow > 0) { poly([[nx0 - 20, 640 - w / 2 - 4], [nx0, 640 - wn / 2 - 4]], "#2a3a58", 6, a); }
  const s = spd * (1 - 0.6 * narrow); flow(PIPE, t, WATER, 22, s, 6, a * flowA, (u) => { const [x] = along(PIPE, u); return u; });
  if (press > 0) for (let i = 0; i < 3; i++) { const yy = 230 + ((t * 60 + i * 40) % 120); arrow(450 + i * 70, yy - 30, 450 + i * 70, yy + 10, "#cfe6ff", 4, a * press * 0.8, 12); }
  for (let i = 0; i < 6; i++) { const u = ((t * 0.8 + i / 6) % 1); circle(1500 + Math.sin(i) * 8, 780 + u * 60, 6, WATER, a * flowA * (1 - u)); }
}
SCENES.water = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.6)), press = P(t, L(1), 0.4), fl = P(t, L(0) + 1.4, 0.6), narrow = eio(P(t, L(3) + 0.3, 0.8));
  waterScene(t, a, { press, flowA: fl, narrow });
  if (t > L(1) - 0.1) chip("ضغط ⬇", 760, 260, { size: 32, col: "#cfe6ff", a: pop(t, L(1) + 0.4, 0.4) });
  if (t > L(2) - 0.1) { const n = Math.floor((t - L(2)) * 7 * (1 - 0.6 * narrow)); chip("جريان: " + n + " لتر", 1500, 860 - 40, { size: 30, col: WATER, a: pop(t, L(2) + 0.6, 0.4) }); }
  if (t > L(3) - 0.1) chip("تضييق ← جريان أقل", 1100, 540, { size: 30, col: C.amber, a: pop(t, L(3) + 0.8, 0.4) });
};

// ---------------------------------------------------------------- 4–6. VOLTAGE · CURRENT · RESISTANCE
function mapCard(t, t0, water, elec, sym, col) { // "water word = electric word · symbol"
  const p = pop(t, t0, 0.5); withT(960, 220, clamp(p), 0, () => { T(water, 300, 0, { size: 56, weight: 900, color: WATER }); T("=", 120, 0, { size: 56, weight: 900, color: C.mut }); T(elec, -80, 0, { size: 56, weight: 900, color: col }); T(sym, -330, 0, { size: 80, weight: 900, fam: "mono", color: col, g: 24 }); }); }
SCENES.voltage = (t, L, E) => {
  mapCard(t, L(0) + 0.8, "الضغط", "الجهد", "V", C.amber);
  if (t > L(1) - 0.2 && t < L(2)) { const p = pop(t, L(1) + 0.4, 0.5); withT(960, 500, clamp(p), 0, () => { T("Volt", 0, -40, { size: 140, weight: 800, fam: "mono", color: C.amber, g: 30 }); T("فولت", 0, 100, { size: 60, weight: 900, color: C.text }); }); }
  if (t > L(2) - 0.2) { const k3 = t > L(3) - 0.15;
    [["1.5V", "🎮 بطارية الريموت", C.green, 0.8], ["5V", "الأردوينو", C.amber, 1.0]].forEach(([v, n, c, s], i) => { const p = pop(t, L(2) + 0.6 + i * 2.2, 0.45) * (k3 ? 0.35 : 1); withT(1300 - i * 440, 520, clamp(p) || 0.0001, 0, () => { battery(0, -30, s, v, c, clamp(p)); T(n, 0, 140, { size: 32, weight: 900, color: C.text, a: clamp(p) }); }); });
    if (k3) { const p = pop(t, L(3) + 0.8, 0.5); withT(460, 520, clamp(p), 0, () => { card(-170, -160, 340, 320, { col: C.red, r: 30 }); fillRR(-60, -70, 120, 120, 30, "rgba(230,235,245,0.9)"); circle(-24, -10, 12, "#222"); circle(24, -10, 12, "#222"); T("220V", 0, 100, { size: 46, weight: 900, fam: "mono", color: C.red, g: 20 }); });
      chip("⚠️ خطيرة جدًا… لا نلمسها", 460, 760, { size: 32, col: C.red, a: pop(t, L(3) + 3.0, 0.45) }); } }
};
SCENES.current = (t, L, E) => {
  mapCard(t, L(0) + 0.8, "الجريان", "التيار", "I", C.blue);
  if (t > L(1) - 0.2 && t < L(2)) { const p = pop(t, L(1) + 0.4, 0.5); withT(960, 500, clamp(p), 0, () => { T("Ampere", 0, -40, { size: 130, weight: 800, fam: "mono", color: C.blue, g: 30 }); T("أمبير", 0, 100, { size: 60, weight: 900, color: C.text }); }); }
  if (t > L(2) - 0.2) { const a = eo(P(t, L(2) - 0.1, 0.5)), w = [[260, 520], [1660, 520]]; pipe(w, 22, a, "#7a5a2a"); flow(w, t, C.amber, 18, 0.35, 7, a);
    seg(960, 470, 960, 570, hexA(C.blue, 0.8), 4, a); const n = Math.floor((t - L(2)) * 6); chip("مرّ: " + n, 960, 430, { size: 28, col: C.blue, a: a * (1 - P(t, L(3) - 0.2, 0.3)) }); T("كل ثانية ⏱", 960, 620, { size: 34, weight: 900, color: C.text, a: a * (1 - P(t, L(3) - 0.2, 0.3)) }); }
  if (t > L(3) - 0.2) { const p = pop(t, L(3) + 0.4, 0.5); withT(960, 700, clamp(p), 0, () => { T("1 A = 1000 mA", 0, 0, { size: 70, weight: 800, fam: "mono", color: C.blue, g: 20 }); }); chip("مشاريعنا: ملّي أمبير mA", 960, 810, { size: 30, col: C.teal, a: pop(t, L(3) + 2.4, 0.45) }); }
};
SCENES.resistance = (t, L, E) => {
  mapCard(t, L(0) + 0.8, "التضييق", "المقاومة", "R", C.teal);
  if (t > L(1) - 0.2 && t < L(2)) { const p = pop(t, L(1) + 0.4, 0.5); withT(960, 500, clamp(p), 0, () => { T("Ω", 0, -50, { size: 200, weight: 800, color: C.teal, g: 34 }); T("Ohm · أوم", 0, 120, { size: 56, weight: 900, color: C.text }); }); chip("أوميغا", 1260, 450, { size: 30, col: C.teal, a: pop(t, L(1) + 2.6, 0.4) }); }
  if (t > L(2) - 0.2 && t < L(3)) { const a = win(t, L(2) - 0.2, L(3), 0.3), w = [[260, 520], [1660, 520]]; pipe([[260, 520], [840, 520]], 22, a, "#7a5a2a"); pipe([[840, 520], [1080, 520]], 8, a, "#7a5a2a"); pipe([[1080, 520], [1660, 520]], 22, a, "#7a5a2a");
    flow(w, t, C.amber, 18, 0.2, 7, a); chip("أنبوب ضيق = مقاومة", 960, 420, { size: 30, col: C.teal, a: pop(t, L(2) + 1.4, 0.4) * a }); }
  if (t > L(3) - 0.2) { const p = pop(t, L(3) + 0.3, 0.5); resistor(960, 520, 3.0 * clamp(p) || 0.001, clamp(p)); chip("المقاوم · Resistor", 960, 700, { size: 34, col: C.teal, a: pop(t, L(3) + 1.6, 0.45) }); T("1000 Ω", 960, 400, { size: 44, weight: 800, fam: "mono", color: C.amber, a: P(t, L(3) + 2.4, 0.4) }); }
};

// ---------------------------------------------------------------- 7. OHM'S LAW
function bar(x, label, v, max, col, a, unit) { const h = 300 * clamp(v / max); fillRR(x - 50, 760 - 300, 100, 300, 16, "rgba(120,150,200,0.14)", a); fillRR(x - 50, 760 - h, 100, h, 16, col, a); T(label, x, 800, { size: 46, weight: 900, fam: "mono", color: col, a }); T(unit, x, 760 - h - 30, { size: 28, weight: 800, fam: "mono", color: C.text, a }); }
SCENES.ohm = (t, L, E) => {
  TW("قانون أوم", 960, 160, L(0) + 0.4, { size: 80, weight: 900, colors: { "أوم": C.teal }, g: 20, a: 1 - P(t, L(1) - 0.2, 0.3) });
  if (t < L(1) - 0.2) return;
  const fa = eo(P(t, L(1) - 0.1, 0.5)); withT(960, 190, 1, 0, () => { T("V = I × R", 0, 0, { size: 96, weight: 800, fam: "mono", color: C.text, a: fa, g: 20 }); });
  if (t < L(4) - 0.15) { const k2 = t > L(2) - 0.15, k3 = t > L(3) - 0.15, step = (t0) => Math.min(2, Math.floor(Math.max(0, t - t0) / 1.3));
    const V = k3 ? 5 : k2 ? [3, 5, 9][step(L(2) + 0.3)] : 5, R = k3 ? [250, 500, 1000][step(L(3) + 0.3)] : 1000, I = V / R * 1000;
    const a = eo(P(t, L(1) + 0.8, 0.5)); bar(760, "V", V, 10, C.amber, a, V + " V"); bar(960, "R", R, 1000, C.teal, a, R + " Ω"); bar(1160, "I", I, 25, C.blue, a, I + " mA");
    T(V + " V ÷ " + R + " Ω = " + I + " mA", 960, 880 - 30, { size: 40, weight: 800, fam: "mono", color: C.text, a: a * (k2 ? 1 : 0) });
    if (k2 && !k3) chip("V ↑ ← I ↑", 1500, 500, { size: 34, col: C.amber, a: pop(t, L(2) + 0.5, 0.4) }); if (k3) chip("R ↑ ← I ↓", 1500, 500, { size: 34, col: C.teal, a: pop(t, L(3) + 0.5, 0.4) }); return; }
  if (t < L(5) - 0.15) { const a = eo(P(t, L(4) - 0.1, 0.4)); T("I = V ÷ R", 960, 380, { size: 70, weight: 800, fam: "mono", color: C.blue, a });
    T("5V ÷ 1000Ω", 960, 500, { size: 70, weight: 800, fam: "mono", color: C.text, a: a * P(t, L(4) + 1.6, 0.4) }); T("= 5 mA", 960, 620, { size: 90, weight: 900, fam: "mono", color: C.green, a: a * P(t, L(4) + 3.4, 0.4), g: 24 }); return; }
  // no resistor at all -> huge current -> burnt
  const a = eo(P(t, L(5) - 0.1, 0.4)), boom = L(5) + 3.6; T("بلا مقاوم: R صغيرة جدًا", 760, 400, { size: 52, weight: 900, color: C.text, a }); T("← I كبير جدًا", 760, 490, { size: 56, weight: 900, color: C.red, a: a * P(t, L(5) + 1.4, 0.4), g: 20 });
  chip("الضوء يتحمل حوالي 20 mA فقط", 760, 610, { size: 32, col: C.amber, a: pop(t, L(5) + 2.4, 0.45) });
  ledPart(1350, 470, 1.6, t > boom ? 0 : P(t, L(5) + 1.0, 0.6) * (1 + 0.4 * Math.sin(t * 50)), a, C.red, t > boom); spark(1350, 440, boom, a); smoke(1350, 400, boom, a);
};

// ---------------------------------------------------------------- 8–9. THE CIRCUIT, CLOSED
function circuitScene(t, a, o = {}) {
  const { hot = "", flowOn = 1, broken = 0 } = o, bx = 520, by = 470, lx = 1330, ly = 400, ls = 1.2, g = ledLegs(lx, ly, ls);
  const p1 = [[bx, 360], [bx, 250], [1200, 250], [1200, 640], [g.an[0], 640], g.an], p2 = [g.ca, [1460, g.ca[1]], [1460, 720], [bx, 720], [bx, 580]];
  const wcol = hot === "wire" ? C.teal : "#3a4a66", lw = hot === "wire" ? 10 : 8; poly(p1, wcol, lw, a); poly(p2, wcol, lw, a);
  if (broken > 0) { const gx = 1000, gy = 720; fillRR(gx - 50 * broken, gy - 14, 100 * broken, 28, 4, "#060a13", a); I.cross(gx, gy + 60, 0.6, { a: a * broken }); }
  battery(bx, by, 1, "5V", hot === "src" ? C.amber : hexA(C.amber, 0.7), a); resistor(860, 250, 1.3, a, 220); T("220 Ω", 860, 196, { size: 28, weight: 800, fam: "mono", color: C.teal, a });
  const on = broken > 0.5 ? 0 : flowOn; ledPart(lx, ly, ls, on, a, C.red); legTags(lx, ly, ls, a);
  if (hot === "load") ring(lx, ly + 10, 110, C.red, 4, a * (0.6 + 0.4 * Math.sin(NOW * 5)));
  if (hot === "src") ring(bx, by, 140, C.amber, 4, a * (0.6 + 0.4 * Math.sin(NOW * 5)));
  if (on > 0) { flow(p1, t, C.amber, 12, 0.3, 6, a * on); flow(p2, t, C.amber, 9, 0.3, 6, a * on); }
  return { cx: 960, cy: 485, w: 940, h: 470, bx, by, lx, ly };
}
SCENES.circuit = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), hot = t > L(4) - 0.15 ? "" : t > L(3) - 0.15 ? "wire" : t > L(2) - 0.15 ? "load" : t > L(1) - 0.15 ? "src" : "", fl = P(t, L(4) + 0.2, 0.6) + (t > L(1) ? 0.6 : 0);
  const c = circuitScene(t, a, { hot, flowOn: clamp(fl) }); const lab = (s, x, y, col, t0) => chip(s, x, y, { size: 32, col, a: pop(t, t0, 0.45) });
  if (t > L(1) - 0.1) lab("1 · المصدر", c.bx - 230, c.by, C.amber, L(1) + 0.3); if (t > L(2) - 0.1) lab("2 · الحمل", c.lx + 230, c.ly, C.red, L(2) + 0.3); if (t > L(3) - 0.1) lab("3 · الأسلاك", 960, 780, C.teal, L(3) + 0.3);
  if (t > L(4) - 0.1) { T("+", c.bx - 80, 340, { size: 60, weight: 900, color: C.amber, a: P(t, L(4) + 0.6, 0.4) }); chip("− · GND الأرضي", c.bx - 230, 650, { size: 28, col: C.mut, a: pop(t, L(4) + 3.4, 0.45) }); }
};
SCENES.closed = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5));
  if (t < L(2) - 0.15) { const br = eio(P(t, L(1) + 0.6, 0.5)); circuitScene(t, a, { broken: br }); chip(br > 0.5 ? "دارة مفتوحة ✗ لا تيار" : "دارة مغلقة ✓", 960, 160, { size: 36, col: br > 0.5 ? C.red : C.green, a: pop(t, br > 0.5 ? L(1) + 1.0 : L(0) + 1.0, 0.45) }); return; }
  // race track
  const ta = eo(P(t, L(2) - 0.1, 0.5)), cx = 960, cy = 480, rx = 520, ry = 250; A(ta); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.strokeStyle = "#3a4a66"; ctx.lineWidth = 60; ctx.stroke();
  ctx.setLineDash([30, 30]); ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
  const gap = P(t, L(2) + 1.6, 0.4); if (gap > 0) { fillRR(cx + rx - 40, cy - 60 * gap, 80, 120 * gap, 8, "#060a13", ta); I.cross(cx + rx + 110, cy, 0.8, { a: ta * gap }); }
  for (let i = 0; i < 4; i++) { let u = ((t - L(2)) * 0.25 + i / 4) % 1; const ang = -Math.PI / 2 + u * Math.PI * 2, x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry; const stopX = gap > 0.5 && Math.cos(ang) > 0.85; T("🏎️", x, y, { size: 50, a: ta * (stopX ? 0.4 : 1) }); }
  chip("الطريق مقطوع ← لا يكمل أحد", 960, 820, { size: 32, col: C.red, a: pop(t, L(2) + 2.0, 0.45) });
};

// ---------------------------------------------------------------- 10. PUZZLE: 5V, 20 mA -> R = ?
SCENES.puzzle = (t, L, E, S, ls) => {
  const cnt = ls[1].count, cEnd = cnt.t0 + cnt.n;
  TW("لغز ⚡", 960, 160, L(0), { size: 76, weight: 900, colors: { "لغز": C.amber }, g: 18 });
  const qa = eo(P(t, L(0) + 0.4, 0.5)); [["5V", "الجهد", C.amber], ["20 mA", "التيار", C.blue], ["؟ Ω", "المقاومة", C.teal]].forEach(([v, n, c], i) => { const p = pop(t, L(0) + 1.0 + i * 1.6, 0.45); withT(1320 - i * 360, 340, clamp(p), 0, () => { card(-150, -90, 300, 180, { col: c, r: 26 }); T(v, 0, -20, { size: 56, weight: 800, fam: "mono", color: c, g: 16 }); T(n, 0, 50, { size: 30, weight: 900, color: C.text }); }); });
  if (t > L(1) - 0.1 && t < cEnd + 0.3) { const ca = eo(P(t, L(1) - 0.1, 0.4)) * (1 - P(t, cEnd, 0.3)), cx = 960, cy = 640;
    circle(cx, cy, 100, "rgba(8,14,26,0.95)", ca); const frac = t < cnt.t0 ? 1 : 1 - (t - cnt.t0) / cnt.n; ring(cx, cy, 100, "rgba(120,140,180,0.3)", 12, ca); glow(C.amber, 20, () => ring(cx, cy, 100, C.amber, 12, ca, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(frac)));
    if (t < cnt.t0) T("فكر…", cx, cy, { size: 42, weight: 900, color: C.text, a: ca }); else { const n = cnt.n - Math.floor(t - cnt.t0), sc = 1 + 0.25 * (1 - eo(((t - cnt.t0) % 1) / 0.3)); T(String(Math.max(1, n)), cx, cy + 6, { size: 100 * sc, weight: 900, fam: "mono", color: C.amber, a: ca, g: 24 }); } }
  if (t > L(2) - 0.1) T("R = V ÷ I", 960, 580, { size: 76, weight: 800, fam: "mono", color: C.teal, a: eo(P(t, L(2) + 0.4, 0.4)), g: 18 });
  if (t > L(3) - 0.1) { T("5 ÷ 0.020 = 250 Ω", 960, 710, { size: 70, weight: 800, fam: "mono", color: C.green, a: eo(P(t, L(3) + 0.4, 0.4)), g: 22 }); chip("20 mA = 0.020 A", 960, 800, { size: 26, col: C.blue, a: pop(t, L(3) + 1.6, 0.4) }); }
  if (t > L(4) - 0.1) { confetti(960, 500, L(4)); chip("🎉 قانون أوم مثل مهندس", 960, 470, { size: 36, col: C.amber, a: pop(t, L(4) + 0.3, 0.45) }); }
};

// ---------------------------------------------------------------- 11. RECAP
const RECAP = [["الجهد V · فولت", "V"], ["التيار I · أمبير", "I"], ["المقاومة R · أوم", "Ω"], ["V = I × R", "="], ["مصدر · حمل · أسلاك", "⚡"], ["الدارة مغلقة دائمًا", "⭕"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  RECAP.forEach(([s, ic], i) => { const at = L(1 + Math.floor(i / 2)) + (i % 2) * 1.6, p = pop(t, at, 0.45), col = [C.amber, C.blue, C.teal, C.violet, C.amber, C.green][i];
    const x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p), 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: 34, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 38, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 12. TEASER: the breadboard and the first external light
SCENES.teaser = (t, L, E) => {
  const endA = eo(P(t, L(2) + 1.6, 0.6)), a = eo(P(t, L(0) - 0.3, 0.6)) * (1 - endA);
  if (a > 0) { if (t < L(1)) TW("الآن تفهم الكهرباء ✓", 960, 400, L(0) + 0.2, { size: 92, weight: 900, colors: { "الكهرباء": C.amber }, g: 24, a });
    else { const ba = eo(P(t, L(1) + 0.2, 0.6)); breadboard(560, 330, 800, 340, a * ba); chip("Breadboard · لوحة التجارب", 960, 250, { size: 34, col: C.teal, a: a * pop(t, L(1) + 2.0, 0.45) });
      resistor(880, 450, 0.9, a * P(t, L(1) + 1.0, 0.4), 220, Math.PI / 2); ledPart(1060, 430, 0.8, t > L(2) + 0.6 ? 1 : 0, a * P(t, L(1) + 1.4, 0.4), C.red); } }
  if (endA > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.18)", endA);
    T("الحلقة القادمة", 960, 230, { size: 40, weight: 800, color: C.amber, a: endA });
    withT(960, 370, 0.9 + 0.1 * back(P(t, L(2) + 1.6, 0.6)), 0, () => TW("الدارة ولوحة التجارب", 0, 0, L(2) + 1.7, { size: 100, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "لوحة": C.teal } }));
    ledPart(960, 560, 0.7, 1, endA, C.red);
    brand(860, 760, endA * P(t, L(2) + 2.6, 0.5), 1.2); T("مسار", 1000, 756, { size: 54, weight: 900, color: C.text, a: endA * P(t, L(2) + 2.6, 0.5) });
  }
};
