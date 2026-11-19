// الحلقة 03 · بيئة العمل وأول ضوء. 12 scenes; each gets (t, L, E, S, ls): L(k)/E(k) = start/end of its k-th spoken line.
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


// ---------- the Arduino IDE window (a simplified, generic mock-up — not a screenshot)
// o: hot = "verify" | "upload" | "board" | "code" | "console"; press = 0..1; msg = [text, colour]; bar = 0..1 progress; code = lines; prog = typed chars
function ideWin(x, y, w, h, a, o = {}) {
  if (a <= 0.001) return; const { hot = "", press = 0, msg = null, bar = -1, code = CODE, prog = 1e9, hl = -1, board = "Arduino Uno", size = 26, lh = 38 } = o;
  card(x, y, w, h, { a, col: C.teal, r: 18, fill: "rgba(6,12,24,0.98)" });
  fillRR(x, y, w, 64, 18, "rgba(18,30,52,0.95)", a); fillRR(x, y + 40, w, 24, 0, "rgba(18,30,52,0.95)", a);
  // toolbar: verify ✓, upload →, board selector
  const bts = [["verify", x + 44, "✓", C.teal], ["upload", x + 104, "→", C.teal]];
  bts.forEach(([k, bx, s, c]) => { const on = hot === k, pr = on ? press : 0; circle(bx, y + 32, 22 - 3 * pr, on ? c : "rgba(46,230,197,0.18)", a); ring(bx, y + 32, 22, c, 2, a); T(s, bx, y + 34, { size: 26, weight: 900, color: on ? "#06101d" : c, a });
    if (on) halo(bx, y + 32, 70, hexA(c, 0.5), a * (0.6 + 0.4 * Math.sin(NOW * 6))); });
  const bw = 330, bx0 = x + 150; fillRR(bx0, y + 12, bw, 40, 10, hot === "board" ? hexA(C.amber, 0.22) : "rgba(8,14,26,0.9)", a); strokeRR(bx0, y + 12, bw, 40, 10, hot === "board" ? C.amber : C.line, 2, a);
  T("▾", bx0 + bw - 22, y + 33, { size: 22, weight: 800, color: C.mut, a }); T(board, bx0 + 16, y + 33, { size: 22, weight: 800, fam: "mono", align: "left", color: board ? C.text : C.mut, a });
  T("Arduino IDE", x + w - 24, y + 33, { size: 22, weight: 800, fam: "mono", align: "right", color: C.mut, a });
  // code area
  const cy0 = y + 96, conH = 120, codeH = h - 96 - conH - 20; let used = 0;
  if (hot === "code") strokeRR(x + 10, y + 74, w - 20, codeH + 20, 12, C.teal, 3, a * (0.6 + 0.4 * Math.sin(NOW * 5)));
  code.forEach((s, i) => { const yy = cy0 + i * lh; if (yy > cy0 + codeH) return; if (hl === i) fillRR(x + 14, yy - lh / 2 + 2, w - 28, lh - 4, 8, hexA(C.amber, 0.16), a);
    T(String(i + 1), x + 36, yy, { size: 18, weight: 800, fam: "mono", color: C.dim, a }); codeLine(s, x + 62, yy, { size, a, n: prog - used }); used += s.length; });
  // console
  const conY = y + h - conH - 10; fillRR(x + 10, conY, w - 20, conH, 12, "rgba(2,6,14,0.95)", a); if (hot === "console") strokeRR(x + 10, conY, w - 20, conH, 12, C.teal, 3, a * (0.6 + 0.4 * Math.sin(NOW * 5)));
  T("Output", x + 30, conY + 24, { size: 18, weight: 800, fam: "mono", align: "left", color: C.dim, a });
  if (bar >= 0) { fillRR(x + 30, conY + 56, w - 60, 12, 6, "rgba(120,150,200,0.18)", a); fillRR(x + 30, conY + 56, (w - 60) * clamp(bar), 12, 6, C.teal, a); }
  if (msg) T(msg[0], x + 30, conY + (bar >= 0 ? 94 : 66), { size: 24, weight: 800, fam: "mono", align: "left", color: msg[1] || C.text, a });
}
// the board's own LEDs: L (pin 13), TX, RX, ON — board coordinates from js/art.js
const LEDPOS = { L: [300, 104], TX: [300, 139], RX: [300, 163], ON: [572, 196] };
function boardLed(bx, by, bs, k, v, col, a = 1) { if (v <= 0) return; const [x, y] = unoPt(bx, by, bs, LEDPOS[k][0], LEDPOS[k][1]); halo(x, y, 90 * bs / 0.5, hexA(col, 0.75), a * v); circle(x, y, 9 * bs / 0.5, "#ffffff", a * v); }
function cable(x0, y0, x1, y1, u, a, t) { const pts = []; for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push([lerp(x0, x1, s), lerp(y0, y1, s) + Math.sin(s * Math.PI) * 70]); }
  pathPartial(pts, u, "#3a4a66", 10, a); pathPartial(pts, u, C.blue, 3, a * 0.6); if (u >= 1) pulses(pts, t, C.blue, 3, 1.1, 6, a); }
const BLINK = (t, on, off) => ((t % (on + off)) < on ? 1 : 0);

// ---------------------------------------------------------------- 1. HOOK
SCENES.hook = (t, L, E) => {
  const a = eo(P(t, 0.3, 0.8)), bx = 960, by = 440, bs = 0.85, led = t > L(1) + 0.3 ? BLINK(t, 0.5, 0.5) : 0;
  halo(bx, by, 560, "rgba(46,230,197,0.10)", a); uno(bx, by, bs, { a, led, hl: led ? { led: 1 } : {}, hc: C.amber });
  if (led) { const lp = partCenter(bx, by, bs, "led"); for (let i = 0; i < 2; i++) { const w = ((t - L(1)) * 1.4 + i / 2) % 1; ring(lp[0], lp[1], 20 + w * 160, C.amber, 4, a * (1 - w)); } halo(lp[0], lp[1], 220, hexA(C.amber, 0.55), a); }
  TW("حان وقت أول ضوء 💡", 960, 150, L(0) + 0.3, { size: 70, weight: 900, colors: { "ضوء": C.amber }, g: 18, a: 1 - P(t, L(1) - 0.2, 0.3) });
  if (t > L(1) - 0.1) chip("بكود كتبته أنت ✍️", 960, 790, { size: 34, col: C.amber, a: pop(t, L(1) + 1.6, 0.45) });
};

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  halo(960, 380, 700, "rgba(46,230,197,0.16)", 1);
  chip("الحلقة 03", 960, 170, { size: 34, col: C.teal, a: pop(t, L(0) - 0.1, 0.5) });
  withT(960, 320, 0.9 + 0.1 * back(P(t, L(0), 0.6)), 0, () => TW("بيئة العمل… وأول ضوء", 0, 0, L(0) + 0.3, { size: 110, weight: 900, color: C.text, g: 36, gc: "rgba(46,230,197,0.7)", colors: { "ضوء": C.amber } }));
  if (t > L(1) - 0.2) [["لوحة Arduino Uno", (x, y, p) => uno(x, y, 0.2, { a: p })], ["كابل USB", (x, y, p) => I.usbc(x, y, 1.6, { a: p })], ["كمبيوتر", (x, y, p) => I.laptop(x, y, 0.8, { a: p })]].forEach(([s, draw], i) => {
    const p = pop(t, L(1) + 0.5 + i * 0.6, 0.45), x = 1360 - i * 400, y = 560; withT(x, y, clamp(p), 0, () => { card(-170, -120, 340, 240, { col: C.teal, r: 26 }); draw(0, -20, 1); T(s, 0, 80, { size: 30, weight: 900, color: C.text }); }); });
  if (t > L(2) - 0.2) chip("ما عندك لوحة؟ ← محاكي مجاني 🖥️", 960, 760, { size: 32, col: C.amber, a: pop(t, L(2) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 3. THE IDE
SCENES.ide = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.6)), hot = t > L(5) - 0.15 ? "console" : t > L(4) - 0.15 ? "verify" : t > L(3) - 0.15 ? "code" : "";
  const up = hot === "verify" && (NOW % 1.6) > 0.8 ? "upload" : hot;
  ideWin(420, 150, 1080, 640, a, { hot: up, msg: hot === "console" ? ["Done compiling. ✓", C.green] : null });
  if (t > L(1) - 0.1 && t < L(2) + 0.2) { const q = win(t, L(1) - 0.1, L(2) + 0.2, 0.3); [["✍️ محرر", 1700, 300], ["⚙️ مترجم", 1700, 470], ["⬆️ أداة رفع", 1700, 640]].forEach(([s, x, y], i) => chip(s, x - 60, y, { size: 30, col: [C.teal, C.amber, C.blue][i], a: q * pop(t, L(1) + 1.5 + i * 0.6, 0.45) }));
    T("IDE", 230, 300, { size: 110, weight: 900, fam: "mono", color: C.teal, a: q, g: 30 }); T("بيئة التطوير", 230, 400, { size: 32, weight: 900, color: C.text, a: q }); T("المتكاملة", 230, 446, { size: 32, weight: 900, color: C.text, a: q }); }
  if (t > L(2) - 0.1 && t < L(3)) { const q = win(t, L(2) - 0.1, L(3), 0.3); chip("🌐 arduino.cc", 230, 300, { size: 32, col: C.teal, a: q * pop(t, L(2) + 0.5, 0.45) }); ["Windows", "Mac", "Linux"].forEach((s, i) => chip(s, 230, 430 + i * 90, { size: 28, col: C.blue, a: q * pop(t, L(2) + 2.0 + i * 0.5, 0.45) })); }
  if (hot === "code") chip("هنا نكتب الكود ✍️", 230, 450, { size: 30, col: C.teal, a: pop(t, L(3) + 0.3, 0.45) * (1 - P(t, L(4) - 0.2, 0.2)) });
  if (hot === "verify") { chip("✓ تحقق", 465, 100, { size: 26, col: C.teal, a: pop(t, L(4) + 1.2, 0.4) }); chip("→ رفع", 640, 100, { size: 26, col: C.teal, a: pop(t, L(4) + 2.3, 0.4) }); }
  if (hot === "console") chip("رسائل وأخطاء 📢", 230, 700, { size: 30, col: C.teal, a: pop(t, L(5) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 4. CONNECT: cable, ON, board, port
SCENES.connect = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), bx = 1380, by = 430, bs = 0.55, menu = t > L(2) - 0.15;
  if (!menu) { I.laptop(520, 440, 1.6, { a }); cable(720, 520, unoPt(bx, by, bs, -60, 154)[0], unoPt(bx, by, bs, -60, 154)[1], eo(P(t, L(0) + 0.8, 0.9)), a, t);
    uno(bx, by, bs, { a }); boardLed(bx, by, bs, "ON", P(t, L(1) + 0.2, 0.3), C.green, a);
    if (t > L(1) - 0.1) { const on = unoPt(bx, by, bs, LEDPOS.ON[0], LEDPOS.ON[1]); chip("ON = اللوحة تعمل ✓", bx, by + 260, { size: 30, col: C.green, a: pop(t, L(1) + 0.6, 0.45) }); arrow(bx + 120, by + 220, on[0] + 10, on[1] + 26, C.green, 4, P(t, L(1) + 0.6, 0.3)); }
    return; }
  const portSel = t > L(3) - 0.15; ideWin(300, 150, 900, 560, a, { hot: "board", board: portSel && t > L(3) + 3.2 ? "Arduino Uno · COM3" : t > L(2) + 1.6 ? "Arduino Uno" : "اختر اللوحة", code: CODE.slice(0, 6) });
  // dropdown
  const items = portSel ? [["COM1", ""], ["COM3", "Arduino Uno"]] : [["Arduino Uno", ""], ["Arduino Nano", ""], ["Arduino Mega", ""]], dx = 450, dy = 216, op = win(t, (portSel ? L(3) : L(2)) + 0.2, (portSel ? L(3) + 3.2 : L(2) + 1.6), 0.25);
  if (op > 0) { fillRR(dx, dy, 420, 20 + items.length * 56, 12, "rgba(10,18,34,0.98)", op * a); strokeRR(dx, dy, 420, 20 + items.length * 56, 12, C.amber, 2, op * a);
    items.forEach(([s, sub], i) => { const pick = portSel ? i === 1 : i === 0; if (pick && t > (portSel ? L(3) + 1.6 : L(2) + 0.9)) fillRR(dx + 8, dy + 12 + i * 56, 404, 50, 8, hexA(C.amber, 0.22), op * a);
      T(s, dx + 24, dy + 37 + i * 56, { size: 24, weight: 800, fam: "mono", align: "left", color: C.text, a: op * a }); if (sub) T(sub, dx + 400, dy + 37 + i * 56, { size: 20, weight: 800, fam: "mono", align: "right", color: C.teal, a: op * a }); }); }
  uno(1580, 430, 0.36, { a }); boardLed(1580, 430, 0.36, "ON", 1, C.green, a);
  chip(portSel ? "المنفذ = الباب 🚪" : "نوع اللوحة", 1580, 640, { size: 30, col: C.amber, a: pop(t, (portSel ? L(3) : L(2)) + 0.4, 0.45) });
};

// ---------------------------------------------------------------- 5. NEW COMMANDS
SCENES.commands = (t, L, E) => {
  const k = t > L(5) - 0.15 ? 3 : t > L(4) - 0.15 ? 2 : t > L(1) - 0.15 ? 1 : 0;
  if (k === 0) { TW("3 أوامر جديدة", 960, 330, L(0) + 0.6, { size: 100, weight: 900, colors: { "3": C.amber }, g: 22 }); ["pinMode", "digitalWrite", "delay"].forEach((s, i) => chip(s, 1260 - i * 300, 520, { size: 34, col: C.blue, a: pop(t, L(0) + 1.6 + i * 0.3, 0.4) })); return; }
  const a = 1;
  if (k === 1) { const c = bigCode("pinMode(13, OUTPUT);", 960, 250, 84, a), n13 = c.toks[2], out = c.toks[5];
    if (t > L(2) - 0.1) { chip("رقم القطب", n13.x + n13.w / 2, 360, { size: 28, col: C.amber, a: pop(t, L(2) + 0.5, 0.4) }); chip("الوضع", out.x + out.w / 2, 360, { size: 28, col: C.amber, a: pop(t, L(2) + 1.4, 0.4) }); chip("OUTPUT = مخرج ⚡", out.x + out.w / 2, 440, { size: 28, col: C.teal, a: pop(t, L(2) + 2.6, 0.4) }); }
    if (t < L(2) - 0.1) TW("هل يعطي كهرباء… أم يستقبل؟", 960, 420, L(1) + 1.2, { size: 52, weight: 900, colors: { "يعطي": C.amber, "يستقبل؟": C.blue } });
    if (t > L(3) - 0.15) { const bx = 960, by = 690, bs = 0.5, ua = eo(P(t, L(3), 0.5)), pin = unoPt(bx, by, bs, 286, 24), ld = unoPt(bx, by, bs, 300, 104);
      uno(bx, by, bs, { a: ua, hl: { digital: 0.6 }, hc: C.amber }); const u = P(t, L(3) + 1.6, 1.0); pathPartial([pin, [pin[0], pin[1] + 40], [ld[0], pin[1] + 40], ld], u, C.amber, 5, ua); if (u >= 1) boardLed(bx, by, bs, "L", 1, C.amber, ua);
      chip("13", pin[0], pin[1] - 40, { size: 28, col: C.amber, a: ua * pop(t, L(3) + 1.0, 0.4) }); T("L", ld[0] + 40, ld[1], { size: 36, weight: 900, fam: "mono", color: C.amber, a: ua * u }); } }
  if (k === 2) { const hi = BLINK(t - L(4), 0.9, 0.9), c = bigCode(`digitalWrite(13, ${hi ? "HIGH" : "LOW"});`, 960, 260, 80, a), st = c.toks[5];
    chip("HIGH = كهرباء ⚡", 760, 400, { size: 32, col: C.amber, a: pop(t, L(4) + 2.6, 0.4) * (hi ? 1 : 0.4) }); chip("LOW = لا كهرباء", 1160, 400, { size: 32, col: C.blue, a: pop(t, L(4) + 4.0, 0.4) * (hi ? 0.4 : 1) });
    uno(960, 660, 0.42, { led: hi }); boardLed(960, 660, 0.42, "L", hi, C.amber); }
  if (k === 3) { const c = bigCode("delay(1000);", 960, 300, 110, a); const p = eo(P(t, L(5) + 0.5, 0.5)); I.clock(840, 560, 1.4, { a: p, r: (t - L(5)) * Math.PI * 2 }); T("1000 ms = 1 s", 1080, 560, { size: 54, weight: 800, fam: "mono", color: C.amber, a: p }); chip("تعرفه من الحلقة 02 ✓", 960, 720, { size: 28, col: C.teal, a: pop(t, L(5) + 1.2, 0.4) }); }
};

// ---------------------------------------------------------------- 6. VERIFY + UPLOAD
SCENES.upload = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), bx = 1560, by = 430, bs = 0.42;
  const comp = P(t, L(1), 2.2), up = P(t, L(3) - 0.2, 2.6), done = t > L(4) - 0.2;
  const hot = t > L(2) - 0.15 ? "upload" : "verify", press = Math.sin(clamp((t - (hot === "upload" ? L(2) + 0.6 : L(0) + 1.4)) / 0.3) * Math.PI);
  const msg = done ? ["Done uploading. ✓", C.green] : t > L(3) - 0.2 ? ["Uploading…", C.text] : t > L(1) + 2.2 ? ["Done compiling. ✓", C.green] : t > L(1) ? ["Compiling sketch…", C.text] : null;
  ideWin(150, 150, 1060, 640, a, { hot, press: Math.max(0, press), msg, bar: done ? 1 : t > L(3) - 0.2 ? up : t > L(1) ? comp : -1 });
  const port = unoPt(bx, by, bs, -60, 154); cable(1210, 600, port[0], port[1], 1, a, t); uno(bx, by, bs, { a, led: done ? BLINK(t, 0.5, 0.5) : 0 }); boardLed(bx, by, bs, "ON", 1, C.green, a);
  if (t > L(3) - 0.2 && !done) { boardLed(bx, by, bs, "TX", BLINK(t * 9, 0.5, 0.5), C.amber, a); boardLed(bx, by, bs, "RX", BLINK(t * 7 + 0.3, 0.5, 0.5), C.amber, a); chip("TX · RX ↔", bx, by + 220, { size: 28, col: C.amber, a: pop(t, L(3) + 0.8, 0.4) }); }
  if (done) { boardLed(bx, by, bs, "L", BLINK(t, 0.5, 0.5), C.amber, a); confetti(bx, by, L(4) + 0.6, a); chip("أول برنامج لك 🎉", bx, by + 230, { size: 34, col: C.amber, a: pop(t, L(4) + 2.0, 0.45) }); }
};

// ---------------------------------------------------------------- 7. PLAY with the delay
SCENES.play = (t, L, E) => {
  const v = t > L(2) - 0.1 ? 2000 : t > L(0) + 2.6 ? 200 : 1000, code = CODE.map((s) => s.replace("1000", String(v)));
  const a = eo(P(t, L(0) - 0.1, 0.5)); codePanel(260, 150, a, { hl: [6, 8], title: "blink.ino", lines: code, lh: 50 }); // both delays carry the current value
  const per = v / 1000, led = BLINK(t, per, per); uno(1400, 420, 0.55, { a, led }); boardLed(1400, 420, 0.55, "L", led, C.amber, a);
  chip(v === 200 ? "⚡ أسرع" : v === 2000 ? "🐢 أبطأ" : "1 ثانية", 1400, 640, { size: 34, col: v === 1000 ? C.teal : C.amber, a: pop(t, v === 200 ? L(0) + 2.6 : v === 2000 ? L(2) : L(0), 0.4) });
  if (t > L(3) - 0.1) chip("⏱ أنت تتحكم بالوقت", 960, 790, { size: 36, col: C.teal, a: pop(t, L(3) + 0.3, 0.45) });
};

// ---------------------------------------------------------------- 8. COMMON ERRORS
SCENES.errors = (t, L, E) => {
  const k = t > L(4) - 0.15 ? 4 : t > L(3) - 0.15 ? 3 : t > L(2) - 0.15 ? 2 : t > L(1) - 0.15 ? 1 : 0;
  if (k === 0) { TW("3 أخطاء شائعة", 960, 360, L(0) + 0.4, { size: 100, weight: 900, colors: { "أخطاء": C.red }, g: 22 }); return; }
  if (k === 4) { TW("رسالة الخطأ = دليلك 🧭", 960, 360, L(4) + 0.6, { size: 84, weight: 900, colors: { "دليلك": C.teal }, g: 20 }); chip("اقرأها ← ستعرف أين المشكلة", 960, 520, { size: 32, col: C.teal, a: pop(t, L(4) + 2.6, 0.45) }); return; }
  chip(String(k), 180, 200, { size: 40, col: C.red, a: 1 });
  const a = eo(P(t, L(k) - 0.1, 0.4));
  if (k === 1) { I.laptop(560, 420, 1.4, { a }); uno(1300, 420, 0.42, { a }); const p0 = [740, 490], p1 = unoPt(1300, 420, 0.42, -60, 154);
    poly([p0, [900, 560], [1010, 540]], "#3a4a66", 10, a); poly([[1070, 520], [1150, 470], p1], "#3a4a66", 10, a); I.cross(1040, 530, 0.8, { a });
    chip("لم يتم العثور على اللوحة", 960, 700, { size: 32, col: C.red, a: pop(t, L(1) + 1.6, 0.4) }); chip("تأكد من الكابل والمنفذ ✓", 960, 790, { size: 28, col: C.teal, a: pop(t, L(1) + 3.0, 0.4) }); }
  if (k >= 2) { const bad = k === 2 ? "  delay(1000)" : "  digitalwrite(13, HIGH);", code = CODE.slice(4, 10).map((s, i) => (k === 2 && i === 2) || (k === 3 && i === 1) ? bad : s);
    const hl = k === 2 ? 2 : 1, msg = k === 2 ? ["error: expected ';' before 'digitalWrite'", C.red] : ["error: 'digitalwrite' was not declared in this scope", C.red];
    ideWin(280, 150, 1360, 600, a, { code, hl, msg: t > L(k) + 1.6 ? msg : null, size: 30, lh: 46 });
    if (t > L(k) + 2.4) chip(k === 2 ? "كنت أنتظر ; هنا" : "هذا الاسم غير معروف", 960, 810, { size: 30, col: C.amber, a: pop(t, L(k) + 2.6, 0.4) }); }
};

// ---------------------------------------------------------------- 9. NO BOARD? THE SIMULATOR
SCENES.sim = (t, L, E) => {
  const a = eo(P(t, L(0) - 0.1, 0.5)), run = t > L(2) + 0.6;
  if (t < L(1) - 0.1) { TW("ليست عندك لوحة؟", 960, 330, L(0) + 0.2, { size: 92, weight: 900, colors: { "لوحة؟": C.amber }, g: 20 }); chip("لا مشكلة 🙂", 960, 480, { size: 36, col: C.teal, a: pop(t, L(0) + 1.4, 0.45) }); return; }
  // a browser window with the simulator (generic mock-up)
  card(200, 140, 1520, 680, { a, col: C.blue, r: 18, fill: "rgba(6,12,24,0.98)" }); fillRR(200, 140, 1520, 60, 18, "rgba(18,30,52,0.95)", a);
  [C.red, C.amber, C.green].forEach((c, i) => circle(232 + i * 26, 170, 8, c, a)); fillRR(340, 152, 600, 36, 18, "rgba(4,8,16,0.9)", a); T("🔒 wokwi.com", 360, 171, { size: 22, weight: 800, fam: "mono", align: "left", color: C.text, a });
  codePanel(230, 230, a, { size: 24, lh: 38, title: "sketch.ino", prog: P(t, L(1) + 1.4, 1.2) * 140 });
  const pb = pop(t, L(2) + 0.3, 0.4); circle(1600, 260, 34, run ? C.green : "rgba(70,224,138,0.25)", a); ring(1600, 260, 34, C.green, 3, a); poly([[1590, 244], [1590, 276], [1616, 260]], null, 0, a, true, run ? "#06101d" : C.green);
  if (t > L(2) && !run) halo(1600, 260, 90, hexA(C.green, 0.5), a * pb);
  const led = run ? BLINK(t, 0.5, 0.5) : 0; uno(1260, 520, 0.6, { a, led }); boardLed(1260, 520, 0.6, "L", led, C.amber, a); boardLed(1260, 520, 0.6, "ON", run ? 1 : 0, C.green, a);
  if (run) chip("💡 يومض على الشاشة", 1260, 760, { size: 30, col: C.amber, a: pop(t, L(2) + 1.2, 0.4) });
};

// ---------------------------------------------------------------- 10. CHALLENGE: a heartbeat
SCENES.challenge = (t, L, E) => {
  TW("التحدي 🏆", 960, 190, L(0), { size: 84, weight: 900, colors: { "التحدي": C.amber }, g: 20 });
  if (t < L(1) - 0.1) return; const a = eo(P(t, L(1) - 0.1, 0.5)), cyc = (t - L(1)) % 1.6, led = (cyc < 0.15 || (cyc > 0.3 && cyc < 0.45)) ? 1 : 0;
  uno(640, 520, 0.55, { a, led }); boardLed(640, 520, 0.55, "L", led, C.amber, a);
  // timeline of the pattern
  const x0 = 1040, w = 640, y = 470; fillRR(x0, y - 4, w, 8, 4, "rgba(120,150,200,0.2)", a);
  [[0, 0.15], [0.3, 0.45]].forEach(([s, e]) => fillRR(x0 + w * s / 1.6, y - 40, w * (e - s) / 1.6, 80, 10, C.amber, a)); T("استراحة", x0 + w * 1.05 / 1.6, y, { size: 32, weight: 800, color: C.mut, a });
  const ph = x0 + w * cyc / 1.6; seg(ph, y - 70, ph, y + 70, C.teal, 4, a); T("❤️", 1360, 620, { size: 60 * (1 + 0.2 * led), a });
  T("يضيء مرتين بسرعة… ثم يستريح", 1360, 330, { size: 40, weight: 900, color: C.text, a });
  if (t > L(2) - 0.1) chip("💬 اكتب الحل في التعليقات", 960, 790, { size: 34, col: C.teal, a: pop(t, L(2) + 0.6, 0.45) });
};

// ---------------------------------------------------------------- 11. RECAP
const RECAP = [["نكتب في Arduino IDE", "IDE"], ["نختار اللوحة والمنفذ", "🚪"], ["Verify للتحقق", "✓"], ["Upload للرفع", "→"], ["pinMode · digitalWrite", "( )"], ["delay للانتظار", "⏱"]];
SCENES.recap = (t, L, E) => {
  TW("الخلاصة", 960, 170, L(0), { size: 76, weight: 900, colors: { "الخلاصة": C.teal }, g: 18 });
  RECAP.forEach(([s, ic], i) => { const at = L(1 + Math.floor(i / 2)) + (i % 2) * 1.3, p = pop(t, at, 0.45), col = [C.teal, C.amber, C.blue, C.violet, C.teal, C.amber][i];
    const x = i % 2 ? 560 : 1360, y = 320 + Math.floor(i / 2) * 170;
    withT(x, y, clamp(p), 0, () => { card(-360, -62, 720, 124, { col, r: 26 }); circle(290, 0, 44, hexA(col, 0.18)); ring(290, 0, 44, col, 3); T(ic, 290, 3, { size: 30, weight: 800, fam: "mono", color: col }); T(s, 210, 2, { size: 38, weight: 900, color: C.text, align: "right" }); I.check(-290, 0, 0.7, {}); }); });
};

// ---------------------------------------------------------------- 12. TEASER: electricity first
SCENES.teaser = (t, L, E) => {
  const endA = eo(P(t, L(3) - 0.1, 0.6)), a = eo(P(t, L(0) - 0.3, 0.6)) * (1 - endA);
  if (a > 0) { const bx = 760, by = 440, bs = 0.55; uno(bx, by, bs, { a, led: BLINK(t, 0.5, 0.5) }); boardLed(bx, by, bs, "L", BLINK(t, 0.5, 0.5), C.amber, a);
    const ld = unoPt(bx, by, bs, 300, 104); ring(ld[0], ld[1], 30 + 6 * Math.sin(t * 5), C.amber, 3, a * (1 - P(t, L(1), 0.4))); T("L", ld[0] + 40, ld[1] - 30, { size: 34, weight: 900, fam: "mono", color: C.amber, a: a * (1 - P(t, L(1), 0.4)) });
    if (t > L(1) - 0.1) { const p = eo(P(t, L(1), 0.5)); I.bulb(1350, 400, 1.6, { a: a * p, on: 0 }); T("؟", 1480, 300, { size: 110, weight: 900, color: C.amber, a: a * p, g: 24 }); seg(1060, 440, 1270, 420, hexA(C.amber, 0.5), 4, a * p); }
    if (t > L(2) - 0.15) [["V", "الجهد", C.amber], ["I", "التيار", C.blue], ["R", "المقاومة", C.teal]].forEach(([s, n, c], i) => { const p = pop(t, L(2) + 1.6 + i * 0.7, 0.45); withT(1500 - i * 300, 700, clamp(p), 0, () => { card(-110, -90, 220, 180, { col: c, r: 26 }); T(s, 0, -20, { size: 72, weight: 900, fam: "mono", color: c, g: 18 }); T(n, 0, 56, { size: 30, weight: 900, color: C.text }); }); }); }
  if (endA > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.18)", endA);
    T("الحلقة القادمة", 960, 230, { size: 40, weight: 800, color: C.amber, a: endA });
    withT(960, 370, 0.9 + 0.1 * back(P(t, L(3), 0.6)), 0, () => TW("الكهرباء… ببساطة ⚡", 0, 0, L(3) + 0.1, { size: 104, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "الكهرباء…": C.amber } }));
    [["V", C.amber], ["I", C.blue], ["R", C.teal]].forEach(([s, c], i) => T(s, 860 + i * 100, 560, { size: 64, weight: 900, fam: "mono", color: c, a: endA * P(t, L(3) + 0.8 + i * 0.2, 0.4), g: 16 }));
    brand(860, 760, endA * P(t, L(3) + 1.2, 0.5), 1.2); T("مسار", 1000, 756, { size: 54, weight: 900, color: C.text, a: endA * P(t, L(3) + 1.2, 0.5) });
  }
};
