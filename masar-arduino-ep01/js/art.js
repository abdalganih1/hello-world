// Art: a generic Uno-style board (no trademark logo), Nano, Mega, and a set of neon line icons.
"use strict";

// ================= UNO-style board =================  native units = 0.1 mm (68.6 x 53.4 mm)
const UNO_W = 686, UNO_H = 534;
const PARTS = {
  usb: [-62, 92, 224, 124], power: [-20, 330, 142, 96], chip: [286, 326, 358, 86], digital: [168, 4, 486, 32],
  analog: [486, 498, 160, 32], powerpins: [258, 498, 212, 32], reset: [28, 12, 68, 68], led: [282, 92, 36, 24],
};
function header(x, y, n, a = 1) {
  fillRR(x, y, n * 25.4, 25, 3, "#0b0d12", a);
  for (let i = 0; i < n; i++) { fillRR(x + i * 25.4 + 6.5, y + 6.5, 12, 12, 2, "#000", a); fillRR(x + i * 25.4 + 9.5, y + 9.5, 6, 6, 1, "#7c6a3a", a * 0.8); }
}
const UNO_DRAW = {
  usb: (a) => {
    fillRR(-60, 94, 220, 120, 6, "#8d99a8", a); fillRR(-60, 94, 220, 22, 6, "#c7d0db", a);
    fillRR(-52, 122, 36, 64, 4, "#2a3038", a); fillRR(-46, 134, 24, 40, 3, "#ece6c9", a);
    for (let i = 0; i < 5; i++) seg(10 + i * 30, 100, 10 + i * 30, 208, "rgba(255,255,255,0.18)", 2, a);
  },
  power: (a) => {
    fillRR(-18, 332, 138, 92, 8, "#101318", a); fillRR(-18, 332, 138, 16, 6, "#2a2f37", a);
    circle(10, 378, 22, "#000", a); circle(10, 378, 8, "#9aa6b4", a);
  },
  chip: (a) => {
    fillRR(282, 340, 366, 58, 4, "#2b2f36", a); // socket
    for (let i = 0; i < 14; i++) { fillRR(298 + i * 25.4, 326, 9, 16, 1, C.metal, a); fillRR(298 + i * 25.4, 396, 9, 16, 1, C.metal, a); }
    fillRR(290, 342, 350, 54, 5, "#15181d", a); circle(304, 369, 7, "#0a0b0e", a);
    T("ATMEGA328P", 480, 369, { size: 20, weight: 800, color: "#5b6573", fam: "mono", a });
  },
  digital: (a) => { header(172, 8, 10, a); header(446, 8, 8, a); },
  analog: (a) => header(490, 502, 6, a),
  powerpins: (a) => header(262, 502, 8, a),
  reset: (a) => { fillRR(30, 14, 64, 64, 8, "#d6dde6", a); circle(62, 46, 20, "#1a1d22", a); circle(62, 46, 14, "#c4372f", a); },
  led: (a, v = 0) => { fillRR(288, 96, 24, 16, 3, v > 0.05 ? "#ffcf5a" : "#6b5a2a", a); if (v > 0.05) { halo(300, 104, 70, "rgba(255,190,60,0.9)", a * v); circle(300, 104, 7, "#fff6cf", a * v); } },
};
function uno(cx, cy, s, o = {}) {
  const a = o.a ?? 1, hl = o.hl || {}, focus = o.focus || 0, ledV = o.led || 0, on = o.on ?? 1, t = NOW;
  if (a <= 0.001) return;
  ctx.save(); ctx.translate(cx - (UNO_W / 2) * s, cy - (UNO_H / 2) * s); ctx.scale(s, s);
  ctx.save(); A(a * 0.55); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26; rr(0, 0, UNO_W, UNO_H, 22); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
  // PCB
  A(a); ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(640, 0); ctx.lineTo(664, 24); ctx.lineTo(664, 150); ctx.lineTo(686, 172); ctx.lineTo(686, 470);
  ctx.lineTo(664, 492); ctx.lineTo(664, 534); ctx.lineTo(22, 534); ctx.quadraticCurveTo(0, 534, 0, 512); ctx.lineTo(0, 22); ctx.quadraticCurveTo(0, 0, 22, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, UNO_W, UNO_H); g.addColorStop(0, "#11708f"); g.addColorStop(1, C.pcb2); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "#2a9cbd"; ctx.lineWidth = 3; ctx.stroke();
  // traces
  const tr = [[[180, 60], [180, 120], [240, 180], [240, 300]], [[330, 60], [330, 150], [400, 220], [520, 220], [560, 260], [560, 326]], [[600, 60], [600, 200], [640, 240], [640, 300]],
    [[160, 260], [250, 260], [286, 300]], [[140, 380], [220, 380], [260, 420], [260, 498]], [[520, 412], [520, 470], [560, 498]], [[420, 412], [420, 460], [380, 498]], [[110, 150], [190, 150], [220, 120], [280, 120]]];
  tr.forEach((p) => poly(p, "rgba(40,170,205,0.55)", 5, a));
  [[150, 30], [655, 84], [655, 460], [160, 505]].forEach(([x, y]) => { circle(x, y, 17, "#d8c48a", a * 0.9); circle(x, y, 10, C.bg, a); });
  // small parts
  fillRR(196, 232, 60, 60, 4, "#15181d", a); T("16U2", 226, 262, { size: 13, color: "#5b6573", fam: "mono", a }); // usb chip
  fillRR(330, 228, 64, 26, 13, "#cfd6de", a); fillRR(334, 232, 56, 18, 9, "#9aa4b0", a); // crystal
  fillRR(132, 430, 52, 46, 3, "#1b1f25", a); fillRR(126, 420, 64, 14, 2, "#9aa4b0", a); // regulator
  circle(196, 380, 22, "#2b3340", a); circle(196, 380, 16, "#56606e", a); circle(246, 380, 22, "#2b3340", a); circle(246, 380, 16, "#56606e", a);
  fillRR(612, 232, 52, 78, 3, "#0b0d12", a); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) fillRR(620 + j * 25, 240 + i * 24, 10, 10, 1, "#7c6a3a", a); // ICSP
  fillRR(288, 132, 24, 14, 3, "#5d6b2e", a); fillRR(288, 156, 24, 14, 3, "#5d6b2e", a); fillRR(586, 166, 24, 14, 3, on ? "#7cff9a" : "#2c5a37", a);
  if (on) halo(598, 173, 34, "rgba(90,255,140,0.8)", a * 0.6);
  // silkscreen
  const sk = { size: 14, weight: 800, color: C.silk, fam: "mono", a: a * 0.85 };
  ["SCL", "SDA", "AREF", "GND", "13", "12", "~11", "~10", "~9", "8"].forEach((s2, i) => T(s2, 184.7 + i * 25.4, 48, { ...sk, size: 10 }));
  ["7", "~6", "~5", "4", "~3", "2", "TX1", "RX0"].forEach((s2, i) => T(s2, 458.7 + i * 25.4, 48, { ...sk, size: 10 }));
  T("DIGITAL (PWM ~)", 470, 70, sk);
  ["IOREF", "RESET", "3.3V", "5V", "GND", "GND", "VIN"].forEach((s2, i) => T(s2, 300 + i * 25.4, 486, { ...sk, size: 8 }));
  ["A0", "A1", "A2", "A3", "A4", "A5"].forEach((s2, i) => T(s2, 502.7 + i * 25.4, 486, { ...sk, size: 10 }));
  T("POWER", 362, 466, sk); T("ANALOG IN", 566, 466, sk);
  T("L", 330, 104, { ...sk, size: 16 }); T("TX", 334, 139, { ...sk, size: 12 }); T("RX", 334, 163, { ...sk, size: 12 }); T("ON", 598, 196, { ...sk, size: 12 });
  T("UNO", 470, 270, { size: 64, weight: 900, color: "rgba(217,243,255,0.75)", fam: "Cairo", a, ls: 6 });
  // main parts
  for (const k of Object.keys(UNO_DRAW)) UNO_DRAW[k](a, k === "led" ? ledV : 0);
  // focus: dim the rest, redraw highlighted parts above the dimmer
  if (focus > 0) {
    A(a * focus * 0.62); rr(-70, -10, UNO_W + 90, UNO_H + 20, 20); ctx.fillStyle = "#03060c"; ctx.fill();
    for (const k of Object.keys(hl)) if (hl[k] > 0 && UNO_DRAW[k]) UNO_DRAW[k](a * clamp(hl[k] * 1.2), k === "led" ? ledV : 0);
  }
  for (const k of Object.keys(hl)) {
    const v = hl[k]; if (v <= 0 || !PARTS[k]) continue; const [x, y, w, h] = PARTS[k]; const pz = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.save(); A(a * v); ctx.shadowColor = o.hc || C.teal; ctx.shadowBlur = 30 + 14 * pz; rr(x - 10, y - 10, w + 20, h + 20, 14);
    ctx.strokeStyle = o.hc || C.teal; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    A(a * v * 0.12); rr(x - 10, y - 10, w + 20, h + 20, 14); ctx.fillStyle = o.hc || C.teal; ctx.fill();
  }
  ctx.restore();
}
// board-space point -> screen point
const unoPt = (cx, cy, s, x, y) => [cx - (UNO_W / 2) * s + x * s, cy - (UNO_H / 2) * s + y * s];
const partCenter = (cx, cy, s, k) => { const [x, y, w, h] = PARTS[k]; return unoPt(cx, cy, s, x + w / 2, y + h / 2); };

// ================= Nano (45 x 18 mm) and Mega (101.6 x 53.3 mm) =================
function nano(cx, cy, s, a = 1, led = 0) {
  if (a <= 0.001) return; ctx.save(); ctx.translate(cx - 225 * s, cy - 90 * s); ctx.scale(s, s);
  ctx.save(); A(a * 0.5); ctx.shadowColor = "#000"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; rr(0, 0, 450, 180, 10); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
  fillRR(0, 0, 450, 180, 10, "#11708f", a); strokeRR(0, 0, 450, 180, 10, "#2a9cbd", 3, a);
  fillRR(-16, 58, 76, 64, 5, "#aab4c0", a); fillRR(-16, 58, 76, 14, 5, "#d6dde6", a);
  for (let i = 0; i < 15; i++) { circle(40 + i * 25.4, 18, 8, "#d8c48a", a); circle(40 + i * 25.4, 18, 4, "#0b0d12", a); circle(40 + i * 25.4, 162, 8, "#d8c48a", a); circle(40 + i * 25.4, 162, 4, "#0b0d12", a); }
  withT(250, 90, 1, Math.PI / 4, () => { fillRR(-34, -34, 68, 68, 4, "#15181d", a); for (let i = 0; i < 8; i++) { fillRR(-30 + i * 8, -42, 4, 8, 1, C.metal, a); fillRR(-30 + i * 8, 34, 4, 8, 1, C.metal, a); fillRR(-42, -30 + i * 8, 8, 4, 1, C.metal, a); fillRR(34, -30 + i * 8, 8, 4, 1, C.metal, a); } });
  fillRR(140, 74, 32, 32, 4, "#d6dde6", a); circle(156, 90, 10, "#c4372f", a);
  fillRR(350, 60, 18, 12, 2, led ? "#ffcf5a" : "#6b5a2a", a); if (led) halo(359, 66, 40, "rgba(255,190,60,0.9)", a * led);
  fillRR(350, 108, 18, 12, 2, "#7cff9a", a);
  T("NANO", 330, 92, { size: 26, weight: 900, color: "rgba(217,243,255,0.75)", a, ls: 3 });
  ctx.restore();
}
function mega(cx, cy, s, a = 1) {
  if (a <= 0.001) return; const MW = 1016, MH = 533; ctx.save(); ctx.translate(cx - (MW / 2) * s, cy - (MH / 2) * s); ctx.scale(s, s);
  ctx.save(); A(a * 0.5); ctx.shadowColor = "#000"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; rr(0, 0, MW, MH, 20); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
  const g = ctx.createLinearGradient(0, 0, MW, MH); g.addColorStop(0, "#11708f"); g.addColorStop(1, C.pcb2); A(a); rr(0, 0, MW, MH, 20); ctx.fillStyle = g; ctx.fill(); strokeRR(0, 0, MW, MH, 20, "#2a9cbd", 3, a);
  UNO_DRAW.usb(a); UNO_DRAW.power(a); UNO_DRAW.reset(a);
  header(172, 8, 10, a); header(446, 8, 8, a); header(660, 8, 8, a);
  header(262, 502, 8, a); header(486, 502, 8, a); header(700, 502, 8, a);
  for (let i = 0; i < 18; i++) { fillRR(936, 40 + i * 25.4, 50.8, 25, 2, "#0b0d12", a); fillRR(944, 46 + i * 25.4, 10, 10, 1, "#7c6a3a", a); fillRR(969, 46 + i * 25.4, 10, 10, 1, "#7c6a3a", a); }
  withT(560, 290, 1, Math.PI / 4, () => { fillRR(-80, -80, 160, 160, 6, "#15181d", a); for (let i = 0; i < 18; i++) { fillRR(-72 + i * 8.4, -92, 4, 12, 1, C.metal, a); fillRR(-72 + i * 8.4, 80, 4, 12, 1, C.metal, a); fillRR(-92, -72 + i * 8.4, 12, 4, 1, C.metal, a); fillRR(80, -72 + i * 8.4, 12, 4, 1, C.metal, a); } });
  T("MEGA", 780, 250, { size: 60, weight: 900, color: "rgba(217,243,255,0.75)", a, ls: 6 });
  ctx.restore();
}

// ================= icons (neon line style). (x,y) = centre, s = scale (1 ≈ 100 px box) =================
function ico(fn) { return (x, y, s = 1, o = {}) => { const a = o.a ?? 1; if (a <= 0.001) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(a, o); ctx.restore(); }; }
const LW = 5;
const I = {
  bulb: ico((a, o) => {
    const v = o.on || 0, col = o.col || C.amber;
    if (v > 0) { halo(0, -10, 130, "rgba(255,190,60,0.85)", a * v); }
    ctx.save(); A(a); ctx.beginPath(); ctx.arc(0, -12, 34, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(14, 26); ctx.lineTo(-14, 26); ctx.closePath();
    ctx.fillStyle = v > 0 ? `rgba(255,214,110,${0.25 + 0.75 * v})` : "rgba(30,40,60,0.6)"; ctx.fill(); ctx.strokeStyle = v > 0.3 ? "#fff1c2" : col; ctx.lineWidth = LW; ctx.stroke(); ctx.restore();
    fillRR(-15, 28, 30, 18, 4, "#8a96a8", a); seg(-15, 36, 15, 36, "#556070", 3, a);
    poly([[-9, 8], [-4, -6], [0, 6], [4, -6], [9, 8]], v > 0.3 ? "#fff" : col, 3, a);
  }),
  speaker: ico((a, o) => {
    const col = o.col || C.blue; poly([[-38, -14], [-18, -14], [6, -36], [6, 36], [-18, 14], [-38, 14]], col, LW, a, true, "rgba(20,30,50,0.8)");
    for (let i = 0; i < 3; i++) { const u = ((NOW * 1.4 + i / 3) % 1); ring(10, 0, 18 + u * 34, col, 4, a * (1 - u) * (o.on ?? 1), -0.8, 0.8); }
  }),
  motor: ico((a, o) => {
    const col = o.col || C.violet; fillRR(-40, -30, 60, 60, 10, "rgba(20,30,50,0.85)", a); strokeRR(-40, -30, 60, 60, 10, col, LW, a);
    seg(20, 0, 34, 0, col, 6, a); const r = (o.spin ?? 1) * NOW * 9;
    withT(40, 0, 1, r, () => { for (let k = 0; k < 3; k++) { ctx.rotate((Math.PI * 2) / 3); poly([[0, 0], [8, -30], [-8, -30]], col, 3, a, true, col); } circle(0, 0, 6, "#fff", a); });
  }),
  ldr: ico((a, o) => { const col = o.col || C.teal; circle(0, 0, 32, "rgba(20,30,50,0.85)", a); ring(0, 0, 32, col, LW, a); poly([[-18, -14], [14, -14], [-14, -4], [14, 4], [-14, 12], [18, 12]], C.amber, 4, a); seg(-10, 32, -10, 56, C.metal, 4, a); seg(10, 32, 10, 56, C.metal, 4, a); }),
  thermo: ico((a, o) => { const col = o.col || C.red; strokeRR(-10, -44, 20, 66, 10, col, LW, a); circle(0, 30, 16, col, a); fillRR(-4, -20 + 30 * (1 - (o.v ?? 0.6)), 8, 50 - 30 * (1 - (o.v ?? 0.6)), 4, col, a); }),
  pir: ico((a, o) => {
    const col = o.col || C.teal; fillRR(-36, 6, 72, 26, 5, "rgba(20,30,50,0.9)", a); strokeRR(-36, 6, 72, 26, 5, col, LW, a);
    A(a); ctx.beginPath(); ctx.arc(0, 6, 28, Math.PI, 0); ctx.fillStyle = "rgba(230,240,255,0.85)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.stroke();
    for (let i = 0; i < 3; i++) seg(-16 + i * 16, -14, -16 + i * 16, 4, "rgba(80,100,130,0.6)", 2, a);
  }),
  button: ico((a, o) => { const col = o.col || C.green, pr = o.pressed || 0; fillRR(-36, -6, 72, 34, 6, "rgba(20,30,50,0.9)", a); strokeRR(-36, -6, 72, 34, 6, col, LW, a); fillRR(-20, -22 + pr * 10, 40, 22, 8, col, a); }),
  screen: ico((a, o) => { const col = o.col || C.green; fillRR(-52, -30, 104, 60, 6, "rgba(20,30,50,0.9)", a); strokeRR(-52, -30, 104, 60, 6, col, LW, a); fillRR(-42, -20, 84, 40, 3, "rgba(70,224,138,0.25)", a); T("23°C", 0, 1, { size: 24, weight: 800, fam: "mono", color: col, a }); }),
  battery: ico((a, o) => { const col = o.col || C.green; strokeRR(-24, -40, 48, 82, 8, col, LW, a); fillRR(-10, -50, 20, 10, 3, col, a); const v = o.v ?? 1; fillRR(-16, 34 - 66 * v, 32, 66 * v, 4, col, a * 0.85); poly([[4, -18], [-8, 4], [2, 4], [-4, 22], [10, -2], [0, -2]], "#0b1220", 3, a, true, "#0b1220"); }),
  brain: ico((a, o) => {
    const col = o.col || C.amber; A(a); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(-14, -10, 22, Math.PI * 0.9, Math.PI * 1.9); ctx.arc(14, -10, 22, Math.PI * 1.1, Math.PI * 2.1); ctx.arc(18, 12, 18, -Math.PI * 0.3, Math.PI * 0.7); ctx.arc(-18, 12, 18, Math.PI * 0.3, Math.PI * 1.3); ctx.stroke();
    seg(0, -30, 0, 28, col, 4, a); ctx.beginPath(); ctx.arc(-14, 0, 9, -1, 2); ctx.stroke(); ctx.beginPath(); ctx.arc(14, 2, 9, 1.4, 4.2); ctx.stroke();
  }),
  eye: ico((a, o) => { const col = o.col || C.teal; A(a); ctx.beginPath(); ctx.moveTo(-44, 0); ctx.quadraticCurveTo(0, -38, 44, 0); ctx.quadraticCurveTo(0, 38, -44, 0); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.stroke(); circle(0, 0, 14, col, a); circle(4, -4, 4, "#fff", a); }),
  hand: ico((a, o) => {
    const col = o.col || C.teal; A(a); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.fillStyle = "rgba(20,30,50,0.85)";
    rr(-30, -6, 56, 50, 18); ctx.fill(); ctx.stroke();
    [[-26, -6, -26, -40], [-10, -6, -10, -50], [6, -6, 6, -46], [20, -4, 20, -34]].forEach(([x1, y1, x2, y2]) => seg(x1 + 4, y1, x2 + 4, y2, col, 13, a));
    [[-26, -6, -26, -40], [-10, -6, -10, -50], [6, -6, 6, -46], [20, -4, 20, -34]].forEach(([x1, y1, x2, y2]) => seg(x1 + 4, y1, x2 + 4, y2, "rgba(20,30,50,1)", 5, a));
    seg(26, 20, 44, 4, col, 13, a); seg(26, 20, 44, 4, "rgba(20,30,50,1)", 5, a);
  }),
  muscle: ico((a, o) => {
    const col = o.col || C.violet; A(a); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.lineJoin = "round"; ctx.fillStyle = "rgba(20,30,50,0.85)";
    ctx.beginPath(); ctx.moveTo(-44, 30); ctx.lineTo(-10, 30); ctx.quadraticCurveTo(30, 34, 34, 0); ctx.lineTo(30, -30); ctx.quadraticCurveTo(24, -44, 10, -38); ctx.lineTo(6, -20);
    ctx.quadraticCurveTo(-4, -6, -16, 0); ctx.quadraticCurveTo(-30, 4, -44, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    A(a); ctx.beginPath(); ctx.arc(-6, 14, 16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  }),
  switch: ico((a, o) => { const col = o.col || C.teal, on = o.on || 0; fillRR(-30, -46, 60, 92, 12, "rgba(20,30,50,0.9)", a); strokeRR(-30, -46, 60, 92, 12, col, LW, a); fillRR(-14, -30 + 30 * (1 - on), 28, 30, 6, on > 0.5 ? C.amber : C.dim, a); }),
  knob: ico((a, o) => {
    const col = o.col || C.blue, v = o.v ?? 0.5; ring(0, 0, 40, "rgba(120,140,170,0.4)", 7, a, Math.PI * 0.75, Math.PI * 2.25);
    glow(col, 12, () => ring(0, 0, 40, col, 7, a, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * v)));
    circle(0, 0, 26, "rgba(20,30,50,0.95)", a); ring(0, 0, 26, col, 4, a); const an = Math.PI * (0.75 + 1.5 * v); seg(0, 0, 20 * Math.cos(an), 20 * Math.sin(an), "#fff", 5, a);
  }),
  bolt: ico((a, o) => poly([[8, -46], [-24, 6], [0, 6], [-8, 46], [24, -8], [0, -8]], o.col || C.amber, LW, a, true, "rgba(255,176,32,0.25)")),
  refresh: ico((a, o) => { const col = o.col || C.red; ring(0, 0, 32, col, LW, a, 0.3, Math.PI * 1.7); const an = Math.PI * 1.7; poly([[32 * Math.cos(an) - 10, 32 * Math.sin(an) - 12], [32 * Math.cos(an) + 2, 32 * Math.sin(an) + 2], [32 * Math.cos(an) + 14, 32 * Math.sin(an) - 12]], col, LW, a); }),
  plug: ico((a, o) => { const col = o.col || C.blue; fillRR(-26, -20, 52, 46, 8, "rgba(20,30,50,0.9)", a); strokeRR(-26, -20, 52, 46, 8, col, LW, a); seg(-10, -20, -10, -40, col, 6, a); seg(10, -20, 10, -40, col, 6, a); seg(0, 26, 0, 48, col, 6, a); }),
  laptop: ico((a, o) => {
    const col = o.col || C.blue; fillRR(-110, -78, 220, 140, 10, "#0a1222", a); strokeRR(-110, -78, 220, 140, 10, col, LW, a);
    poly([[-136, 70], [136, 70], [118, 62], [-118, 62]], col, LW, a, true, "#121b2e");
    const code = o.code ?? 1; const L = ["void loop() {", "  if (dark)", "    lightOn();", "}"];
    L.forEach((s, i) => { const n = Math.floor(clamp(code * L.length - i) * s.length); if (n > 0) T(s.slice(0, n), -94, -50 + i * 26, { size: 18, fam: "mono", align: "left", color: i === 1 ? C.amber : C.teal, a }); });
  }),
  coin: ico((a, o) => { const col = o.col || C.amber; for (let i = 3; i >= 0; i--) { A(a); ctx.beginPath(); ctx.ellipse(0, 24 - i * 14, 40, 14, 0, 0, Math.PI * 2); ctx.fillStyle = "#3a2a08"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); } T("$", 0, -20, { size: 26, color: col, fam: "mono", a }); }),
  recipe: ico((a, o) => { const col = o.col || C.teal; fillRR(-40, -50, 80, 100, 8, "rgba(230,240,255,0.92)", a); strokeRR(-40, -50, 80, 100, 8, col, 4, a); for (let i = 0; i < 5; i++) seg(-26, -26 + i * 16, 26 - (i % 2) * 14, -26 + i * 16, "#7a8aa6", 4, a); circle(-28, -40, 4, col, a); }),
  pot: ico((a, o) => { const col = o.col || C.amber; poly([[-40, -10], [40, -10], [32, 34], [-32, 34]], col, LW, a, true, "rgba(20,30,50,0.9)"); seg(-48, -10, 48, -10, col, LW, a); for (let i = 0; i < 3; i++) { const u = (NOW * 0.8 + i / 3) % 1; A(a * (1 - u)); ctx.beginPath(); ctx.moveTo(-14 + i * 14, -18 - u * 30); ctx.quadraticCurveTo(-6 + i * 14, -28 - u * 30, -14 + i * 14, -38 - u * 30); ctx.strokeStyle = C.mut; ctx.lineWidth = 3; ctx.stroke(); } }),
  house: ico((a, o) => { const col = o.col || C.teal; poly([[-44, -4], [0, -44], [44, -4], [44, 40], [-44, 40]], col, LW, a, true, "rgba(20,30,50,0.9)"); const on = o.on ?? 1; fillRR(-30, 4, 22, 20, 3, on ? "#ffd06a" : "#2a3550", a); fillRR(8, 4, 22, 20, 3, on ? "#ffd06a" : "#2a3550", a); fillRR(-8, 18, 16, 22, 2, col, a * 0.6); if (on) halo(0, 14, 60, "rgba(255,200,90,0.5)", a * 0.6); }),
  person: ico((a, o) => { const col = o.col || C.teal; circle(0, -30, 16, "rgba(20,30,50,0.9)", a); ring(0, -30, 16, col, LW, a); A(a); ctx.beginPath(); ctx.moveTo(-30, 40); ctx.quadraticCurveTo(-30, -8, 0, -8); ctx.quadraticCurveTo(30, -8, 30, 40); ctx.closePath(); ctx.fillStyle = "rgba(20,30,50,0.9)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.stroke(); }),
  mail: ico((a, o) => { const col = o.col || C.blue; fillRR(-36, -24, 72, 48, 6, "rgba(20,30,50,0.9)", a); strokeRR(-36, -24, 72, 48, 6, col, LW, a); poly([[-36, -22], [0, 6], [36, -22]], col, LW, a); }),
  film: ico((a, o) => { const col = o.col || C.pink; fillRR(-36, -26, 72, 52, 6, "rgba(20,30,50,0.9)", a); strokeRR(-36, -26, 72, 52, 6, col, LW, a); poly([[-8, -12], [14, 0], [-8, 12]], col, 3, a, true, col); }),
  game: ico((a, o) => { const col = o.col || C.violet; fillRR(-42, -20, 84, 44, 22, "rgba(20,30,50,0.9)", a); strokeRR(-42, -20, 84, 44, 22, col, LW, a); seg(-24, 2, -12, 2, col, 5, a); seg(-18, -4, -18, 8, col, 5, a); circle(16, -2, 5, col, a); circle(26, 8, 5, col, a); }),
  globe: ico((a, o) => { const col = o.col || C.teal; ring(0, 0, 36, col, LW, a); A(a); ctx.beginPath(); ctx.ellipse(0, 0, 16, 36, 0, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); seg(-36, 0, 36, 0, col, 3, a); seg(-30, -18, 30, -18, col, 2, a); seg(-30, 18, 30, 18, col, 2, a); }),
  phone: ico((a, o) => { const col = o.col || C.blue; fillRR(-24, -44, 48, 88, 10, "rgba(20,30,50,0.95)", a); strokeRR(-24, -44, 48, 88, 10, col, LW, a); fillRR(-16, -32, 32, 56, 4, "rgba(77,163,255,0.25)", a); circle(0, 34, 4, col, a); }),
  traffic: ico((a, o) => { fillRR(-22, -54, 44, 108, 12, "#0e1626", a); strokeRR(-22, -54, 44, 108, 12, C.mut, 4, a); const k = o.k ?? Math.floor(NOW * 1.2) % 3; [[C.red, -32], [C.amber, 0], [C.green, 32]].forEach(([c, y], i) => { circle(0, y, 12, i === k ? c : "#26314a", a); if (i === k) halo(0, y, 40, c, a * 0.6); }); }),
  plant: ico((a, o) => {
    const v = o.v ?? 1, droop = (1 - v) * 0.6; poly([[-30, 10], [30, 10], [24, 50], [-24, 50]], C.amber, 4, a, true, "#3a2410");
    seg(0, 10, 0, -30 + droop * 20, C.green, 5, a);
    [[-1, -10], [1, -22], [-1, -34]].forEach(([d, y], i) => { A(a); ctx.save(); ctx.translate(0, y + droop * 16); ctx.rotate(d * (0.5 + droop)); ctx.beginPath(); ctx.ellipse(d * 18, 0, 18, 8, 0, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); ctx.restore(); });
  }),
  printer: ico((a, o) => { const col = o.col || C.blue; strokeRR(-44, -44, 88, 88, 6, col, LW, a); seg(-44, -24, 44, -24, col, 4, a); const x = Math.sin(NOW * 3) * 26; fillRR(x - 8, -24, 16, 14, 2, C.amber, a); seg(x, -10, x, -2, C.amber, 3, a); fillRR(-24, 26, 48, 8, 2, C.amber, a); fillRR(-18, 14, 36, 12, 2, C.amber, a * 0.8); seg(-36, 34, 36, 34, col, 4, a); }),
  flask: ico((a, o) => { const col = o.col || C.green; poly([[-10, -44], [10, -44], [10, -10], [34, 38], [-34, 38], [-10, -10]], col, LW, a, true, "rgba(20,30,50,0.9)"); poly([[-24, 18], [24, 18], [34, 38], [-34, 38]], null, 0, a, true, "rgba(70,224,138,0.5)"); circle(-6, 26, 4, "#fff", a * 0.8); circle(8, 30, 3, "#fff", a * 0.8); }),
  palette: ico((a, o) => { A(a); ctx.beginPath(); ctx.ellipse(0, 0, 44, 34, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(20,30,50,0.9)"; ctx.fill(); ctx.strokeStyle = C.pink; ctx.lineWidth = LW; ctx.stroke(); [[C.red, -20, -12], [C.amber, 0, -18], [C.teal, 20, -10], [C.blue, 22, 10]].forEach(([c, x, y]) => circle(x, y, 7, c, a)); circle(-14, 12, 8, C.bg, a); }),
  note: ico((a, o) => { const col = o.col || C.violet; circle(-18, 26, 12, col, a); circle(18, 18, 12, col, a); seg(-8, 26, -8, -30, col, 5, a); seg(28, 18, 28, -38, col, 5, a); poly([[-8, -30], [28, -38], [28, -24], [-8, -16]], col, 2, a, true, col); }),
  star: ico((a, o) => { const col = o.col || C.amber, pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 44, an = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([r * Math.cos(an), r * Math.sin(an)]); } poly(pts, col, LW, a, true, "rgba(255,176,32,0.25)"); }),
  flag: ico((a, o) => { const col = o.col || C.amber; seg(-20, 44, -20, -44, C.text, 5, a); poly([[-20, -44], [34, -30], [-20, -14]], col, 4, a, true, col); }),
  puzzle: ico((a, o) => {
    const col = o.col || C.amber; A(a); ctx.beginPath(); ctx.moveTo(-36, -36); ctx.lineTo(-8, -36); ctx.arc(0, -36, 9, Math.PI, 0); ctx.lineTo(36, -36); ctx.lineTo(36, -8); ctx.arc(36, 0, 9, -Math.PI / 2, Math.PI / 2); ctx.lineTo(36, 36); ctx.lineTo(-36, 36); ctx.closePath();
    ctx.fillStyle = "rgba(255,176,32,0.18)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = LW; ctx.stroke(); T("؟", 0, 4, { size: 44, weight: 900, color: col, a });
  }),
  gear: ico((a, o) => { const col = o.col || C.violet; withT(0, 0, 1, (o.spin ?? 1) * NOW * 2, () => { for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); fillRR(-7, -40, 14, 14, 2, col, a); } ring(0, 0, 28, col, 9, a); circle(0, 0, 9, col, a); }); }),
  check: ico((a, o) => { const col = o.col || C.green; circle(0, 0, 34, "rgba(70,224,138,0.18)", a); ring(0, 0, 34, col, LW, a); poly([[-16, 0], [-4, 12], [18, -12]], col, 7, a); }),
  cross: ico((a, o) => { const col = o.col || C.red; circle(0, 0, 34, "rgba(255,90,106,0.18)", a); ring(0, 0, 34, col, LW, a); seg(-13, -13, 13, 13, col, 7, a); seg(13, -13, -13, 13, col, 7, a); }),
  cup: ico((a, o) => { const col = o.col || C.red; poly([[-30, -20], [30, -20], [24, 36], [-24, 36]], col, LW, a, true, "rgba(20,30,50,0.9)"); ring(36, 4, 14, col, LW, a, -1.4, 1.4); for (let i = 0; i < 3; i++) { const u = (NOW * 0.9 + i / 3) % 1; A(a * (1 - u)); ctx.beginPath(); ctx.moveTo(-14 + i * 14, -26 - u * 34); ctx.quadraticCurveTo(-4 + i * 14, -36 - u * 34, -14 + i * 14, -48 - u * 34); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); } }),
  clock: ico((a, o) => { const col = o.col || C.teal; ring(0, 0, 36, col, LW, a); const r = o.r ?? NOW; seg(0, 0, 22 * Math.sin(r), -22 * Math.cos(r), col, 5, a); seg(0, 0, 14 * Math.sin(r / 12), -14 * Math.cos(r / 12), C.amber, 6, a); }),
  target: ico((a, o) => { const col = o.col || C.teal; ring(0, 0, 40, col, 4, a); ring(0, 0, 24, col, 4, a); circle(0, 0, 9, col, a); }),
  usbc: ico((a, o) => { const col = o.col || C.blue; fillRR(-30, -14, 60, 28, 5, "#8d99a8", a); fillRR(-20, -6, 40, 12, 3, "#2a3038", a); }),
};

// ================= characters & mini scenes =================
function helper(x, y, s, o = {}) { // the "little helper" robot
  const a = o.a ?? 1, t = NOW, blink = (Math.sin(t * 2.3) > 0.97) ? 0.15 : 1, bob = Math.sin(t * 2) * 6;
  withT(x, y + bob, s, 0, () => {
    halo(0, 0, 210, "rgba(46,230,197,0.22)", a);
    seg(0, -112, 0, -140, C.teal, 6, a); circle(0, -146, 10, C.amber, a); halo(0, -146, 30, "rgba(255,176,32,0.8)", a * (0.5 + 0.5 * Math.sin(t * 4)));
    card(-96, -112, 192, 140, { a, col: C.teal, r: 44, fill: "rgba(14,28,46,0.97)" });
    fillRR(-74, -88, 148, 92, 30, "#04101a", a);
    const lk = o.look || 0; [[-32, -42], [32, -42]].forEach(([ex, ey]) => { A(a); ctx.save(); ctx.translate(ex + lk * 8, ey); ctx.scale(1, blink); circle(0, 0, 16, C.teal, a); circle(4, -4, 5, "#fff", a); ctx.restore(); });
    halo(-32, -42, 40, "rgba(46,230,197,0.5)", a * 0.6); halo(32, -42, 40, "rgba(46,230,197,0.5)", a * 0.6);
    A(a); ctx.beginPath(); ctx.arc(0, -16, 16, 0.2 * Math.PI, 0.8 * Math.PI); ctx.strokeStyle = C.teal; ctx.lineWidth = 5; ctx.stroke();
    card(-70, 36, 140, 96, { a, col: C.teal, r: 28, fill: "rgba(14,28,46,0.97)" }); circle(0, 84, 14, C.amber, a * (0.6 + 0.4 * Math.sin(t * 3)));
    const wave = Math.sin(t * 3) * 0.3;
    withT(-74, 56, 1, -0.5 + wave, () => fillRR(-56, -12, 56, 24, 12, "#163049", a)); withT(74, 56, 1, 0.5 - wave * 0.5, () => fillRR(0, -12, 56, 24, 12, "#163049", a));
  });
}
function carTop(x, y, s, rot, o = {}) { // robot car seen from above, facing up
  const a = o.a ?? 1;
  withT(x, y, s, rot, () => {
    [[-58, -40], [58, -40], [-58, 40], [58, 40]].forEach(([wx, wy]) => fillRR(wx - 12, wy - 24, 24, 48, 6, "#11151b", a));
    card(-48, -70, 96, 140, { a, col: C.teal, r: 18, fill: "rgba(13,92,118,0.97)", g: 12 });
    fillRR(-30, -30, 60, 46, 6, "#0a2a38", a); fillRR(-20, 26, 40, 26, 4, "#1d2430", a);
    fillRR(-40, -84, 80, 20, 6, "#1b6f8f", a); circle(-20, -74, 9, "#cfd6de", a); circle(20, -74, 9, "#cfd6de", a); circle(-20, -74, 4, "#0b0d12", a); circle(20, -74, 4, "#0b0d12", a);
  });
}
function arm(x, y, s, th1, th2, grip, o = {}) { // side-view robot arm; base at (x,y)
  const a = o.a ?? 1, L1 = 150, L2 = 130;
  withT(x, y, s, 0, () => {
    fillRR(-60, -14, 120, 30, 10, "#1b2638", a); strokeRR(-60, -14, 120, 30, 10, C.blue, 4, a); fillRR(-30, -44, 60, 34, 10, "#22324a", a);
    const j1 = [0, -44], j2 = [j1[0] + L1 * Math.cos(th1), j1[1] + L1 * Math.sin(th1)], j3 = [j2[0] + L2 * Math.cos(th1 + th2), j2[1] + L2 * Math.sin(th1 + th2)];
    seg(j1[0], j1[1], j2[0], j2[1], "#2c4466", 30, a); seg(j1[0], j1[1], j2[0], j2[1], C.blue, 4, a * 0.6);
    seg(j2[0], j2[1], j3[0], j3[1], "#2c4466", 24, a); seg(j2[0], j2[1], j3[0], j3[1], C.blue, 4, a * 0.6);
    [j1, j2].forEach(([jx, jy]) => { circle(jx, jy, 18, "#16243a", a); ring(jx, jy, 18, C.amber, 5, a); });
    const g = 10 + grip * 16, an = o.wrist ?? th1 + th2;
    withT(j3[0], j3[1], 1, an, () => { fillRR(0, -18, 20, 36, 4, "#22324a", a); fillRR(18, -g - 6, 34, 8, 3, C.amber, a); fillRR(18, g - 2, 34, 8, 3, C.amber, a); });
    o.tip && o.tip([j3[0] + 40 * Math.cos(an), j3[1] + 40 * Math.sin(an)]);
  });
}
function keypad(x, y, s, o = {}) { // smart lock
  const a = o.a ?? 1, pressed = o.pressed ?? -1, typed = o.typed || 0, open = o.open || 0;
  withT(x, y, s, 0, () => {
    card(-130, -200, 260, 400, { a, col: open > 0.5 ? C.green : C.blue, r: 26, fill: "rgba(12,20,36,0.97)" });
    fillRR(-100, -170, 200, 64, 10, "#06121c", a);
    for (let i = 0; i < 4; i++) T(i < typed ? "•" : "_", -54 + i * 36, -136, { size: 40, weight: 900, color: open > 0.5 ? C.green : C.teal, a, fam: "mono" });
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
    keys.forEach((k, i) => { const kx = -70 + (i % 3) * 70, ky = -60 + Math.floor(i / 3) * 62; const on = i === pressed; fillRR(kx - 28, ky - 24, 56, 48, 10, on ? C.teal : "#17243a", a); T(k, kx, ky + 2, { size: 28, weight: 800, color: on ? "#04201a" : C.text, a, fam: "mono" }); if (on) halo(kx, ky, 60, "rgba(46,230,197,0.6)", a); });
    circle(96, -186, 7, open > 0.5 ? C.green : C.red, a); halo(96, -186, 30, open > 0.5 ? C.green : C.red, a * 0.7);
  });
  // padlock icon next to it
  withT(x + 230 * s, y - 40 * s, s, 0, () => {
    const lift = open * 34; A(a); ctx.beginPath(); ctx.arc(0, -40 - lift, 34, Math.PI, 0); ctx.lineTo(34, -10 - lift * (1 - open)); ctx.moveTo(-34, -40 - lift); ctx.lineTo(-34, -10);
    ctx.strokeStyle = open > 0.5 ? C.green : C.mut; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.stroke();
    card(-56, -14, 112, 92, { a, col: open > 0.5 ? C.green : C.mut, r: 16, fill: "rgba(20,30,50,0.97)" }); circle(0, 26, 10, open > 0.5 ? C.green : C.mut, a);
  });
}
function door(x, y, s, open, o = {}) { // automatic supermarket door, front view; open in [0,1]
  const a = o.a ?? 1, hl = o.hl || {};
  withT(x, y, s, 0, () => {
    fillRR(-330, -250, 660, 500, 16, "#0d1626", a); strokeRR(-330, -250, 660, 500, 16, "#2a3a58", 5, a);
    fillRR(-330, -250, 660, 76, 16, "#132038", a);
    T("سوبرماركت", 0, -212, { size: 34, weight: 900, color: C.amber, a, g: 14 });
    fillRR(-290, -160, 580, 410, 4, "#0a1220", a); // opening
    const shift = open * 270;
    [[-1], [1]].forEach(([d]) => {
      const px = d < 0 ? -290 - shift : shift;
      A(a); rr(px, -160, 290, 410, 4); const g = ctx.createLinearGradient(px, -160, px + 290, 250); g.addColorStop(0, "rgba(120,190,255,0.30)"); g.addColorStop(1, "rgba(120,190,255,0.10)");
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "rgba(160,210,255,0.7)"; ctx.lineWidth = 4; ctx.stroke();
      seg(px + 60, -120, px + 120, -40, "rgba(255,255,255,0.25)", 6, a);
    });
    // sensor + controller box + motor on the header
    I.pir(0, -150, 0.7, { a, col: hl.sensor ? C.teal : C.mut }); if (hl.sensor) { halo(0, -150, 90, "rgba(46,230,197,0.6)", a * hl.sensor); for (let i = 0; i < 3; i++) { const u = (NOW * 1.2 + i / 3) % 1; ring(0, -140, 30 + u * 160, C.teal, 3, a * hl.sensor * (1 - u), 0.3, Math.PI - 0.3); } }
    fillRR(-250, -238, 120, 52, 8, hl.brain ? "#3a2a08" : "#16233a", a); strokeRR(-250, -238, 120, 52, 8, hl.brain ? C.amber : "#2a3a58", 4, a); T("CPU", -190, -211, { size: 20, fam: "mono", color: hl.brain ? C.amber : C.mut, a });
    if (hl.brain) halo(-190, -212, 90, "rgba(255,176,32,0.6)", a * hl.brain);
    I.gear(240, -212, 0.55, { a, col: hl.motor ? C.violet : C.mut, spin: hl.motor ? 2 : 0 }); if (hl.motor) halo(240, -212, 80, "rgba(164,124,255,0.6)", a * hl.motor);
  });
}
