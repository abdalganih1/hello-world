// الحلقة 02 · لغة الأردوينو. 12 scenes; each gets (t, L, E, S, ls): L(k)/E(k) = start/end of its k-th spoken line.
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
  const { hl = -1, prog = 1e9, size = 30, lh = 46, hlCol = C.amber, title } = o; const w = 620, h = 90 + CODE.length * lh;
  editor(x, y, w, h, a, title); let used = 0;
  CODE.forEach((s, i) => { const yy = y + 76 + i * lh;
    if (Array.isArray(hl) ? hl.includes(i) : hl === i) { fillRR(x + 14, yy - lh / 2 + 2, w - 28, lh - 4, 10, hexA(hlCol, 0.16), a); fillRR(x + 14, yy - lh / 2 + 2, 6, lh - 4, 3, hlCol, a); }
    T(String(i + 1), x + 44, yy, { size: 20, weight: 800, fam: "mono", color: C.dim, a }); codeLine(s, x + 72, yy, { size, a, n: prog - used }); used += s.length; });
  return { lineY: (i) => y + 76 + i * lh, x, w };
}
function bigCode(s, cx, y, size, a, o = {}) { const w = lineW(s, size); const toks = codeLine(s, cx - w / 2, y, { size, a, ...o }); return { toks, x0: cx - w / 2, w }; }
const tokBox = (toks, i) => toks[Math.min(i, toks.length - 1)];
function confetti(cx, cy, t0, a = 1) { const w = P(NOW, t0, 2.2); if (w <= 0 || w >= 1) return; for (let i = 0; i < 60; i++) { const an = rnd(i) * Math.PI * 2, sp = 260 + rnd(i + 3) * 420; withT(cx + Math.cos(an) * sp * eo(w), cy + Math.sin(an) * sp * eo(w) + w * w * 240, 1, w * 10 * (rnd(i + 5) - 0.5), () => fillRR(-7, -4, 14, 8, 2, [C.teal, C.amber, C.violet, C.pink, C.green][i % 5], (1 - w) * a)); } }

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const side = eio(P(t, L(1) - 0.2, 0.8)), bx = lerp(960, 600, side), by = 440, bs = lerp(0.85, 0.7, side);
  const flick = t > L(0) + 0.5 && t < L(0) + 1.6 ? (Math.sin((t - L(0)) * 26) > 0.2 ? 1 : 0) : 0;
  halo(bx, by, 520, "rgba(46,230,197,0.10)", 1);
  uno(bx, by, bs, { led: flick, hl: flick ? { led: 1 } : {}, hc: C.amber });
  if (t > L(0) + 1.6 && t < L(1) + 0.4) { const p = pop(t, L(0) + 1.7, 0.5), lp = partCenter(bx, by, bs, "led"); T("؟", lp[0] + 60, lp[1] - 70, { size: 90 * p, weight: 900, color: C.amber, a: clamp(p) * (1 - P(t, L(1), 0.3)), g: 20 }); }
  // the bubbles that do not get through
  if (t > L(1) - 0.1 && t < L(2) + 0.2) [["مرحبا", 1, C.teal], ["Hello", -1, C.blue]].forEach(([s, d, c], i) => {
    const u = P(t, L(1) + 0.2 + i * 0.45, 1.3), x = bx + 460 + d * 0 + (1 - eo(Math.min(u * 1.6, 1))) * 500 - (u > 0.62 ? (u - 0.62) * -500 : 0), y = by - 120 + i * 150;
    const ba = clamp(u * 5) * (1 - clamp((u - 0.78) * 4)); card(x - 110, y - 40, 220, 80, { a: ba, col: c, r: 30 }); T(s, x, y + 2, { size: 36, weight: 900, color: c, a: ba });
    if (u > 0.6) I.cross(x + 140, y, 0.55, { a: ba }); });
  if (t > L(1) + 0.6) TW("يجب أن نتعلم لغته", 1340, 200, L(1) + 0.8, { size: 56, weight: 900, colors: { "لغته": C.teal }, a: 1 - P(t, L(2) - 0.1, 0.3), g: 16 });
  if (t > L(2) - 0.2) { const a = eo(P(t, L(2) - 0.2, 0.6)); codePanel(1060, 170, a, { prog: P(t, L(2) + 0.2, 2.6) * 140, size: 28, lh: 44 }); }
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 420, 700, "rgba(46,230,197,0.16)", 1);
  chip("الحلقة 02", 960, 200, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 380, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("لغة الأردوينو", 0, 0, L(0) + 0.3, { size: 140, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "لغة": C.teal } }));
  ["{ }", ";", "( )", "//"].forEach((s, i) => { const p = pop(t, L(0) + 1.0 + i * 0.15, 0.45); withT(660 + i * 200, 560, p, 0, () => { card(-70, -46, 140, 92, { a: clamp(p), col: [C.teal, C.amber, C.blue, C.violet][i], r: 22 }); T(s, 0, 4, { size: 44, weight: 800, fam: "mono", color: [C.teal, C.amber, C.blue, C.violet][i], a: clamp(p) }); }); });
  if (t > L(1) - 0.2) [["بدون لوحة", C.teal], ["بدون قطع", C.teal], ["🧠 تركيزك فقط", C.amber]].forEach(([s, c], i) => chip(i < 2 ? s + " ✓" : s, 1300 - i * 340, 720, { size: 32, col: c, a: pop(t, L(1) + i * 0.35, 0.45) }));
};

// ---------------------------------------------------------------- 3. PROGRAM = instructions in order (a recipe)
const STEPS = [["اكسر البيضة", "🥚"], ["اخفقها", "🥣"], ["ضعها في المقلاة", "🍳"]];
SCENES.program = (t, L, E) => {
  TW("ما هو البرنامج؟", 960, 170, L(0), { size: 72, weight: 900, colors: { "البرنامج؟": C.teal }, a: 1 - P(t, L(1) - 0.2, 0.3), g: 16 });
  if (t > L(1) - 0.2 && t < L(2)) TW("تعليمات… بترتيب", 960, 170, L(1) + 0.2, { size: 72, weight: 900, colors: { "بترتيب": C.amber }, a: 1 - P(t, L(2) - 0.2, 0.2), g: 16 });
  if (t > L(1) - 0.2) {
    const a = eo(P(t, L(1) - 0.1, 0.5)), shuffle = win(t, L(3) - 0.1, L(4) + 0.2, 0.35), run = t > L(4) + 0.3;
    card(560, 260, 800, 520, { a, col: C.teal, r: 28, fill: "rgba(8,14,26,0.95)" }); I.recipe(640, 330, 0.7, { a });
    T("وصفة", 1250, 320, { size: 40, weight: 900, color: C.teal, a });
    const order = [0, 1, 2], swapped = [2, 1, 0];
    STEPS.forEach(([s, e], i) => {
      const sh = eio(shuffle), slot = lerp(order[i], swapped[i], sh), y = 440 + slot * 110, p = pop(t, L(2) + 0.3 + i * 0.7, 0.45) * (t > L(2) - 0.1 ? 1 : 0);
      const cur = run && Math.floor((t - L(4) - 0.3) / 0.7) % 4 === i;
      withT(960, y, clamp(p), 0, () => { fillRR(-340, -44, 680, 88, 22, cur ? hexA(C.teal, 0.22) : "rgba(20,32,56,0.9)", a); strokeRR(-340, -44, 680, 88, 22, cur ? C.teal : C.line, 2, a);
        circle(290, 0, 28, shuffle > 0.5 ? C.red : C.teal, a); T(String(i + 1), 290, 3, { size: 30, weight: 900, fam: "mono", color: "#06101d", a }); T(s, 200, 2, { size: 40, weight: 800, color: C.text, align: "right", a }); T(e, -280, 2, { size: 48, a }); });
    });
    if (shuffle > 0.4) { I.cross(1290, 560, 1, { a: shuffle }); TW("تفسد الطبخة 😖", 960, 830, L(3) + 0.4, { size: 46, weight: 900, color: C.red, a: shuffle }); }
    if (t > L(4) - 0.1) { const pa = eo(P(t, L(4), 0.5)); uno(1580, 520, 0.28, { a: pa, led: blink(t, 0.35) }); T("ينفذ بالترتيب", 1580, 650, { size: 32, weight: 800, color: C.teal, a: pa });
      chip("لا يخمن ✗", 1580, 720, { size: 26, col: C.red, a: pop(t, L(4) + 2.2, 0.45) }); }
  }
};

// ---------------------------------------------------------------- 4. LANGUAGE: 0/1, Arduino C++, the compiler
SCENES.language = (t, L, E) => {
  const k1 = t > L(2) - 0.2;
  // 0 1 rain around the board
  const ra = win(t, L(0) - 0.2, L(2), 0.4); if (ra > 0) for (let c = 0; c < 24; c++) { const x = 140 + c * 72; for (let r = 0; r < 10; r++) { const y = 120 + ((r * 90 + t * (60 + rnd(c) * 80) + rnd(c + 3) * 900) % 760); T(rnd(c * 31 + r + Math.floor(t * 3)) > 0.5 ? "1" : "0", x, y, { size: 28, weight: 800, fam: "mono", color: C.teal, a: ra * 0.2 }); } }
  if (!k1) { const a = eo(P(t, L(0) - 0.2, 0.5)); uno(960, 430, 0.6, { a }); TW("0 و 1 فقط", 960, 720, L(0) + 1.2, { size: 64, weight: 900, colors: { "0": C.teal, "1": C.amber }, g: 16 });
    if (t > L(1) - 0.1) { const p = eo(P(t, L(1), 0.5)); I.person(420, 470, 1.6, { a: p }); card(220, 220, 400, 90, { a: p, col: C.red, r: 24 }); T("01101000 01101001", 420, 266, { size: 28, weight: 800, fam: "mono", color: C.mut, a: p }); I.cross(640, 260, 0.6, { a: pop(t, L(1) + 0.8, 0.4) }); } return; }
  // Arduino C++ card -> Compiler -> 0101 -> board
  const a = eo(P(t, L(2) - 0.2, 0.5)), fl = t > L(3) - 0.2, tr = eio(P(t, L(4) - 0.2, 0.6));
  const cx0 = fl ? lerp(960, 420, eio(P(t, L(3) - 0.2, 0.7))) : 960;
  withT(cx0, 400, 1 - 0.3 * eio(P(t, L(3) - 0.2, 0.7)), 0, () => { card(-330, -110, 660, 220, { a: a * (1 - tr), col: C.blue, r: 26 }); bigCode("digitalWrite(13, HIGH);", 0, -20, 40, a * (1 - tr)); T("Arduino C++", 0, 60, { size: 34, weight: 800, fam: "mono", color: C.teal, a: a * (1 - tr) }); });
  if (fl) { const f = eo(P(t, L(3), 0.5)) * (1 - tr);
    arrow(700, 400, 840, 400, C.teal, 5, f); withT(960, 400, 1, t * 0.8, () => I.gear(0, 0, 1.4, { a: f })); T("Compiler", 960, 520, { size: 34, weight: 800, fam: "mono", color: C.amber, a: f }); T("المترجم", 960, 566, { size: 30, weight: 800, color: C.text, a: f });
    arrow(1080, 400, 1220, 400, C.teal, 5, f * P(t, L(3) + 1.0, 0.4)); T("010110100111", 1330, 400, { size: 30, weight: 800, fam: "mono", color: C.teal, a: f * P(t, L(3) + 1.2, 0.4) });
    uno(1650, 400, 0.3, { a: f * P(t, L(3) + 1.6, 0.4), led: t > L(3) + 2.0 ? blink(t, 0.4) : 0 }); }
  if (tr > 0) { I.person(560, 470, 1.6, { a: tr, col: C.teal }); I.person(1360, 470, 1.6, { a: tr, col: C.blue }); I.person(960, 500, 1.3, { a: tr, col: C.amber });
    card(420, 250, 280, 80, { a: tr, col: C.teal, r: 30 }); T("مرحبا", 560, 292, { size: 36, weight: 900, color: C.teal, a: tr });
    card(1220, 250, 280, 80, { a: tr * P(t, L(4) + 0.8, 0.4), col: C.blue, r: 30 }); T("Hello", 1360, 292, { size: 36, weight: 900, color: C.blue, a: tr * P(t, L(4) + 0.8, 0.4) });
    arrow(720, 380, 860, 440, C.amber, 4, tr); arrow(1060, 440, 1200, 380, C.amber, 4, tr * P(t, L(4) + 0.6, 0.4)); T("المترجم", 960, 640, { size: 32, weight: 800, color: C.amber, a: tr }); }
};

// ---------------------------------------------------------------- 5. RULES: ; and Case
SCENES.rules = (t, L, E) => {
  const r1 = win(t, L(0) - 0.2, L(3) - 0.1, 0.3), r2 = P(t, L(3) - 0.2, 0.4);
  if (t < L(1)) { TW("قواعد اللغة", 960, 300, L(0), { size: 96, weight: 900, colors: { "قواعد": C.amber }, g: 20 }); [1, 2].forEach((n, i) => chip("القاعدة " + n, 800 + i * 320, 470, { size: 32, col: [C.amber, C.blue][i], a: pop(t, L(0) + 0.9 + i * 0.3, 0.4) })); return; }
  if (r1 > 0) { chip("القاعدة 1", 960, 170, { size: 30, col: C.amber, a: r1 });
    const c = bigCode("delay(1000);", 960, 380, 96, r1, { hide: { 4: true } }); const sc = tokBox(c.toks, 4), sp = pop(t, L(1) + 1.6, 0.5);
    withT(sc.x + sc.w / 2, 380, 1 + 0.6 * (1 - clamp(sp)) * (sp > 0 ? 1 : 0), 0, () => T(";", 0, 0, { size: 96, weight: 800, fam: "mono", color: C.amber, a: r1 * clamp(sp * 2), g: 30 }));
    if (sp > 0) ring(sc.x + sc.w / 2, 380, 90 + 40 * clamp(P(t, L(1) + 1.6, 0.8)), C.amber, 4, r1 * (1 - P(t, L(1) + 1.6, 0.8)));
    if (t > L(2) - 0.2) { const p = eo(P(t, L(2), 0.5)); T("انتهت الجملة", 1180, 620, { size: 60, weight: 900, color: C.text, a: r1 * p }); T(".", 870, 610, { size: 100, weight: 900, color: C.amber, a: r1 * p, g: 20 }); T("=", 780, 620, { size: 60, weight: 900, color: C.mut, a: r1 * p }); T(";", 690, 620, { size: 80, weight: 800, fam: "mono", color: C.amber, a: r1 * p, g: 20 });
      if (t > L(2) + 1.8) { chip("نسيتها؟ المترجم لا يعرف أين انتهت", 960, 760, { size: 28, col: C.red, a: r1 * pop(t, L(2) + 1.9, 0.45) }); } } }
  if (r2 > 0) { chip("القاعدة 2", 960, 170, { size: 30, col: C.blue, a: r2 });
    if (t < L(4) - 0.1) TW("الكبير ≠ الصغير", 960, 400, L(3) + 0.2, { size: 92, weight: 900, colors: { "≠": C.amber }, g: 20, a: r2 * (1 - P(t, L(4) - 0.3, 0.2)) });
    else { const a = eo(P(t, L(4) - 0.1, 0.4)), good = bigCode("digitalWrite", 960, 340, 84, a), bad = bigCode("digitalwrite", 960, 540, 84, a * P(t, L(4) + 1.6, 0.4), { colors: { 0: C.red } });
      const W1 = good.x0 + lineW("digital", 84), W2 = bad.x0 + lineW("digital", 84), ww = lineW("W", 84);
      ring(W1 + ww / 2, 336, 56, C.green, 5, a * P(t, L(4) + 0.6, 0.3)); ring(W2 + ww / 2, 536, 56, C.red, 5, a * P(t, L(4) + 2.0, 0.3));
      I.check(good.x0 + good.w + 90, 340, 1, { a }); I.cross(bad.x0 + bad.w + 90, 540, 1, { a: a * P(t, L(4) + 1.8, 0.3) });
      if (t > L(5) - 0.2) { const p = pop(t, L(5), 0.45); I.person(400, 700, 1.1, { a: clamp(p) }); chip("اسم مكتوب خطأً… لا أحد يرد", 960, 780, { size: 28, col: C.red, a: clamp(p) }); } } }
};

// ---------------------------------------------------------------- 6. STRUCTURE: setup (once) + loop (forever)
function sectionBox(x, y, w, h, title, col, a, o = {}) {
  card(x, y, w, h, { a, col, r: 22, fill: "rgba(8,14,26,0.95)", g: o.hot ? 40 : 18 });
  codeLine("void " + title + "() {", x + 30, y + 46, { size: 34, a }); codeLine("}", x + 30, y + h - 36, { size: 34, a });
  for (let i = 0; i < 2; i++) fillRR(x + 70, y + 92 + i * 44, w - 140 - i * 90, 18, 9, hexA(col, 0.25), a);
}
SCENES.structure = (t, L, E) => {
  TW("كل برنامج = قسمان", 960, 170, L(0), { size: 66, weight: 900, colors: { "قسمان": C.teal }, g: 16 });
  const a = eo(P(t, L(0) + 0.5, 0.5)), hs = win(t, L(1) - 0.1, L(3) - 0.1, 0.3), hl = P(t, L(3) - 0.1, 0.3), br = P(t, L(5) - 0.1, 0.3);
  sectionBox(1080, 280, 540, 260, "setup", C.teal, a, { hot: hs > 0.5 }); sectionBox(300, 280, 540, 260, "loop", C.amber, a, { hot: hl > 0.5 });
  if (hs > 0) { chip("1× مرة واحدة", 1350, 600, { size: 30, col: C.teal, a: hs }); if (t > L(2) - 0.1) { I.house(1240, 730, 0.9, { a: hs * P(t, L(2), 0.4) }); T("🎉", 1350, 720, { size: 60, a: hs * P(t, L(2) + 0.3, 0.4) }); T("تجهيز الغرفة", 1500, 730, { size: 32, weight: 800, color: C.text, a: hs * P(t, L(2) + 0.3, 0.4) }); } }
  if (hl > 0) { withT(470, 610, 1, -(t - L(3)) * 4, () => I.refresh(0, 0, 1.1, { col: C.amber, a: hl })); chip("↻ إلى الأبد", 650, 610, { size: 30, col: C.amber, a: hl * (1 - br) });
    if (t > L(4) - 0.2) { const pa = hl * eo(P(t, L(4) - 0.2, 0.4)) * (1 - br); const pts = []; for (let i = 0; i <= 80; i++) { const x = 360 + i * 7, u = ((i / 80) * 3 - (t - L(4)) * 1.2) % 1, uu = (u + 1) % 1; const yy = 760 - (uu > 0.4 && uu < 0.48 ? 60 * Math.sin((uu - 0.4) / 0.08 * Math.PI) : uu > 0.5 && uu < 0.55 ? -24 : 0); pts.push([x, yy]); }
      glow(C.red, 14, () => poly(pts, C.red, 4, pa)); const beat = 1 + 0.18 * Math.max(0, Math.sin((t - L(4)) * 7.5)); T("❤️", 1000, 740, { size: 56 * beat, a: pa }); } }
  if (br > 0) [[1080, 280, C.teal], [300, 280, C.amber]].forEach(([x, y, c]) => { const g = 0.5 + 0.5 * Math.sin(t * 5); T("{", x - 34, y + 130, { size: 200, weight: 800, fam: "mono", color: c, a: br * (0.6 + 0.4 * g), g: 30 }); T("}", x + 574, y + 130, { size: 200, weight: 800, fam: "mono", color: c, a: br * (0.6 + 0.4 * g), g: 30 }); chip("📦 صندوق", x + 270, 620, { size: 30, col: c, a: br * pop(t, L(5) + 1.2, 0.45) }); });
};

// ---------------------------------------------------------------- 7. FUNCTION: delay(1000)
SCENES.function = (t, L, E) => {
  TW("الأمر = دالة · Function", 960, 170, L(0) + 0.6, { size: 62, weight: 900, colors: { "دالة": C.blue }, g: 16 });
  const a = eo(P(t, L(0) - 0.1, 0.5)), c = bigCode("delay(1000);", 960, 420, 120, a);
  const d = c.toks[0], p1 = c.toks[1], n = c.toks[2], p2 = c.toks[3];
  if (t > L(1) - 0.1) { const p = pop(t, L(1) + 0.6, 0.45); fillRR(d.x - 10, 500, d.w + 20, 8, 4, C.blue, a); withT(d.x + d.w / 2, 590, clamp(p), 0, () => chip("⏳ انتظر", 0, 0, { size: 36, col: C.blue })); }
  if (t > L(2) - 0.1) { const p = pop(t, L(2) + 0.5, 0.45), x0 = p1.x, x1 = p2.x + p2.w; fillRR(x0 - 6, 330, x1 - x0 + 12, 8, 4, C.amber, a); withT((x0 + x1) / 2, 260, clamp(p), 0, () => chip("كم؟", 0, 0, { size: 36, col: C.amber })); }
  if (t > L(3) - 0.2) { const p = eo(P(t, L(3), 0.5)); I.clock(700, 720, 1.2, { a: p, r: (t - L(3)) * Math.PI * 2 }); T("1000 ms", 960, 700, { size: 54, weight: 800, fam: "mono", color: C.amber, a: p }); T("= ثانية واحدة", 1240, 712, { size: 50, weight: 900, color: C.text, a: p * P(t, L(3) + 1.8, 0.4) });
    const u = ((t - L(3)) % 1); ring(700, 720, 60, C.amber, 6, p, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); }
};

// ---------------------------------------------------------------- 8. COMMENTS
SCENES.comments = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)); editor(560, 230, 800, 300, a, "notes.ino");
  codeLine("// شغل الضوء", 620, 340, { size: 40, a, n: Math.floor(P(t, L(0) + 0.6, 1.0) * 14) });
  codeLine("digitalWrite(13, HIGH);", 620, 430, { size: 40, a });
  const sl = pop(t, L(0) + 2.0, 0.45); withT(650, 280, clamp(sl), 0, () => chip("//", 0, 0, { size: 30, col: C.amber }));
  if (t > L(1) - 0.2) { const p = eo(P(t, L(1), 0.5)); uno(1560, 650, 0.28, { a: p, led: 1, hl: { led: 1 }, hc: C.amber }); arrow(1370, 430, 1490, 600, C.teal, 5, p); seg(1370, 340, 1440, 420, C.red, 4, p * 0.8); I.cross(1410, 330, 0.5, { a: p });
    chip("👀 لك أنت فقط", 760, 640, { size: 32, col: C.teal, a: pop(t, L(1) + 1.6, 0.45) }); }
};

// ---------------------------------------------------------------- 9. READ the blink program line by line
const READ = [[[0, 1, 2], "جهز الرجل 13 لتكون مخرجا", null], [[5], "أعط الرجل كهرباء ← يضيء", 1], [[6], "انتظر ثانية", null], [[7], "اقطع الكهرباء ← ينطفئ", 0], [[8], "انتظر ثانية أخرى", null]];
SCENES.read = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)); let k = -1; for (let i = 0; i < 5; i++) if (t >= L(i + 1) - 0.1) k = i;
  const loopOn = t >= L(6) - 0.1, cyc = loopOn ? Math.floor((t - L(6)) / 0.5) % 4 : 0, hl = loopOn ? [5 + cyc] : k >= 0 ? READ[k][0] : -1;
  const cp = codePanel(260, 150, a, { hl, size: 30, lh: 50, hlCol: C.amber });
  let led = 0; if (k >= 1) led = k >= 3 ? 0 : 1; if (loopOn) led = cyc < 2 ? 1 : 0;
  uno(1460, 330, 0.5, { a, led, hl: led ? { led: 1 } : {}, hc: C.amber });
  if (led) { const lp = partCenter(1460, 330, 0.5, "led"); halo(lp[0], lp[1], 160, hexA(C.amber, 0.55), a); }
  if (k >= 0 && !loopOn) { const r = READ[k], ly = cp.lineY(r[0][r[0].length - 1]), p = pop(t, L(k + 1) + 0.2, 0.45); withT(1460, 640, clamp(p), 0, () => { card(-330, -50, 660, 100, { col: C.amber, r: 26 }); T(r[1], 0, 2, { size: 38, weight: 900, color: C.text }); }); arrow(cp.x + cp.w + 10, ly, 1120, 630, hexA(C.amber, 0.7), 3, p * 0.7); }
  if (loopOn) { const la = eo(P(t, L(6), 0.4)); const y0 = cp.lineY(5), y1 = cp.lineY(8); poly([[cp.x + cp.w + 20, y1], [cp.x + cp.w + 60, y1], [cp.x + cp.w + 60, y0], [cp.x + cp.w + 20, y0]], C.teal, 5, la); arrow(cp.x + cp.w + 60, y0, cp.x + cp.w + 22, y0, C.teal, 5, la);
    T("loop ↻", cp.x + cp.w + 130, (y0 + y1) / 2, { size: 34, weight: 800, fam: "mono", color: C.teal, a: la });
    withT(1460, 640, 1, 0, () => { const words = ["ضوء", "ظلام"]; T(words[cyc < 2 ? 0 : 1], 0, 0, { size: 64, weight: 900, color: cyc < 2 ? C.amber : C.mut, a: la, g: cyc < 2 ? 24 : 0 }); }); }
  if (t > L(7) - 0.1) chip("6 أسطر فقط ✨", 1460, 760, { size: 34, col: C.teal, a: pop(t, L(7) + 0.3, 0.45) });
};

// ---------------------------------------------------------------- 10. PUZZLE: digitalwrite(13, HIGH)  -> two mistakes
SCENES.puzzle = (t, L, E, S, ls) => {
  const cnt = ls[1].count, cEnd = cnt.t0 + cnt.n, a = eo(P(t, L(0) - 0.1, 0.5));
  TW("أين الخطأ؟", 960, 190, L(0) + 0.4, { size: 76, weight: 900, colors: { "الخطأ؟": C.amber }, g: 18 });
  const semi = P(t, L(2) + 0.6, 0.5), fixW = P(t, L(3) + 1.0, 0.5), wRed = P(t, L(3) + 0.3, 0.3);
  const s = "digitalwrite(13, HIGH)" + (semi > 0 ? ";" : ""), w = lineW("digitalwrite(13, HIGH)", 84), x0 = 960 - w / 2;
  card(x0 - 60, 330, w + 160, 160, { a, col: C.blue, r: 26 });
  const toks = codeLine("digitalwrite(13, HIGH)", x0, 410, { size: 84, a, hide: fixW > 0.5 || wRed > 0 ? { 0: true } : {} });
  if (wRed > 0) { const dw = lineW("digital", 84); codeLine("digital", x0, 410, { size: 84, a, colors: { 0: C.blue } }); T(fixW > 0.5 ? "W" : "w", x0 + dw, 410, { size: 84, weight: 800, fam: "mono", align: "left", color: fixW > 0.5 ? C.green : C.red, a, g: 20 }); codeLine("rite", x0 + dw + lineW("w", 84), 410, { size: 84, a, colors: { 0: C.blue } }); if (wRed > 0 && fixW < 1) ring(x0 + dw + lineW("w", 84) / 2, 406, 60, C.red, 5, a * (1 - fixW)); }
  if (semi > 0) { const sx = x0 + w; withT(sx + 22, 410, 1 + 0.6 * (1 - semi), 0, () => T(";", 0, 0, { size: 84, weight: 800, fam: "mono", color: C.green, a: a * semi, g: 24 })); }
  // countdown
  if (t > L(1) - 0.1 && t < cEnd + 0.3) { const ca = eo(P(t, L(1) - 0.1, 0.4)) * (1 - P(t, cEnd, 0.3)), cx = 960, cy = 680;
    circle(cx, cy, 100, "rgba(8,14,26,0.95)", ca); const frac = t < cnt.t0 ? 1 : 1 - (t - cnt.t0) / cnt.n;
    ring(cx, cy, 100, "rgba(120,140,180,0.3)", 12, ca); glow(C.amber, 20, () => ring(cx, cy, 100, C.amber, 12, ca, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(frac)));
    if (t < cnt.t0) T("فكر…", cx, cy, { size: 42, weight: 900, color: C.text, a: ca });
    else { const n = cnt.n - Math.floor(t - cnt.t0), sc = 1 + 0.25 * (1 - eo(((t - cnt.t0) % 1) / 0.3)); T(String(Math.max(1, n)), cx, cy + 6, { size: 100 * sc, weight: 900, fam: "mono", color: C.amber, a: ca, g: 24 }); } }
  if (t > L(2) - 0.1) chip("1 · الفاصلة المنقوطة ناقصة", 700, 640, { size: 30, col: C.green, a: pop(t, L(2) + 0.6, 0.45) });
  if (t > L(3) - 0.1) chip("2 · حرف W كبير", 1240, 640, { size: 30, col: C.green, a: pop(t, L(3) + 1.0, 0.45) });
  if (t > L(4) - 0.1) { confetti(960, 410, L(4)); chip("🎉 تقرأ الكود مثل مبرمج", 960, 770, { size: 36, col: C.amber, a: pop(t, L(4) + 0.3, 0.45) }); }
};

// ---------------------------------------------------------------- 11. RECAP
const RECAP = [["تعليمات بالترتيب", "1 2 3"], ["كل تعليمة تنتهي بـ ;", ";"], ["الكبير ≠ الصغير", "Aa"], ["التعليقات لك أنت", "//"], ["setup مرة واحدة", "1×"], ["loop إلى الأبد", "↻"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  RECAP.forEach(([s, ic], i) => { const at = L(1 + Math.floor(i / 2)) + (i % 2) * 1.4, p = pop(t, at, 0.45), col = [C.teal, C.amber, C.blue, C.violet, C.teal, C.amber][i];
    const x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p), 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: 34, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 40, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 12. TEASER
SCENES.teaser = (t, L, E) => {
  const endA = eo(P(t, L(3) - 0.1, 0.6)), a = eo(P(t, L(0) - 0.3, 0.6)) * (1 - endA);
  if (a > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.14)", a);
    if (t < L(1)) TW("الآن تفهم لغته ✓", 960, 400, L(0) + 0.2, { size: 92, weight: 900, colors: { "لغته": C.teal }, g: 24, a });
    else { const bx = 1400, by = 450, bs = 0.55, led = t > L(2) + 3.2 ? blink(t, 0.5) : 0;
      const la = eo(P(t, L(1), 0.5)); I.laptop(560, 450, 1.5, { a: la * a, code: 0 });
      const port = unoPt(bx, by, bs, -60, 154), pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(760, port[0], u), lerp(520, port[1], u) + Math.sin(u * Math.PI) * 70]); }
      const plug = eo(P(t, L(1) + 0.8, 0.8)); pathPartial(pts, plug, "#3a4a66", 10, a); pathPartial(pts, plug, C.blue, 3, a * 0.6); if (plug >= 1) pulses(pts, t, C.blue, 3, 1.1, 6, a);
      uno(bx, by, bs, { a, led, hl: led ? { led: 1 } : {}, hc: C.amber });
      if (t > L(2) - 0.2) { const ed = eio(P(t, L(2) - 0.2, 0.6)); withT(560, 440, 0.55 + 0.45 * ed, 0, () => codePanel(-310, -290, a * ed, { prog: P(t, L(2) + 0.2, 2.6) * 140, size: 28, lh: 44 })); }
      if (led) { const lp = partCenter(bx, by, bs, "led"); halo(lp[0], lp[1], 200, hexA(C.amber, 0.6), a); chip("أول ضوء 💡", bx, by + 250, { size: 32, col: C.amber, a: pop(t, L(2) + 3.3, 0.45) }); } }
  }
  if (endA > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.18)", endA);
    T("الحلقة القادمة", 960, 230, { size: 40, weight: 800, color: C.amber, a: endA });
    withT(960, 370, 0.9 + 0.1 * back(P(t, L(3), 0.6)), 0, () => TW("أول كود… وأول ضوء", 0, 0, L(3) + 0.1, { size: 104, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "ضوء": C.amber } }));
    uno(960, 590, 0.28, { a: endA, led: blink(t, 0.5), hl: { led: blink(t, 0.5) }, hc: C.amber });
    brand(860, 760, endA * P(t, L(3) + 1.2, 0.5), 1.2); T("مسار", 1000, 756, { size: 54, weight: 900, color: C.text, a: endA * P(t, L(3) + 1.2, 0.5) });
  }
};
