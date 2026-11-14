// The 12 scenes. Each gets (t, L, E): L(k)/E(k) = start/end of its k-th spoken line, so every motion follows the voice.
"use strict";
const win = (t, a, b, f = 0.3) => P(t, a, f) * (1 - P(t, b - f, f));
const curK = (t, L, n) => { let k = -1; for (let i = 0; i < n; i++) if (t >= L(i) - 0.15) k = i; return k; };
const blink = (t, per = 1) => (Math.floor(t / per) % 2 === 0 ? 1 : 0);

// ---------------------------------------------------------------- 1. HOOK
function panel(cx, cy, s, a, label, col, inner) {
  withT(cx, cy, s, 0, () => {
    card(-380, -220, 760, 440, { a, col, r: 30, fill: "rgba(8,14,26,0.95)", g: 30 });
    ctx.save(); rr(-376, -216, 752, 432, 28); ctx.clip(); inner(); ctx.restore();
    if (label) { fillRR(-380, 160, 760, 60, 0, "rgba(4,8,16,0.7)", a); T(label, 0, 190, { size: 30, weight: 800, color: C.text, a }); }
  });
}
function miniCar(cx, cy, s, u, a) {
  panel(cx, cy, s, a, "سيارة تتجنب الجدار", C.teal, () => {
    for (let x = -380; x < 380; x += 60) seg(x, -220, x, 220, "rgba(80,120,180,0.12)", 2, a);
    for (let y = -220; y < 220; y += 60) seg(-380, y, 380, y, "rgba(80,120,180,0.12)", 2, a);
    fillRR(-380, -216, 760, 40, 0, "#3a2a1a", a); for (let x = -380; x < 380; x += 40) seg(x, -176, x + 30, -216, "rgba(255,176,32,0.35)", 4, a);
    const p = u % 4; let x = 0, y = 120, r = 0;
    if (p < 1.4) y = lerp(120, -70, eio(p / 1.4)); else y = -70;
    if (p >= 2.0) r = -Math.PI / 2 * eio((p - 2.0) / 0.6);
    if (p >= 2.6) x = lerp(0, -300, eio((p - 2.6) / 1.0));
    if (p > 0.6 && p < 2.2) { const k = p < 1.4 ? 0.4 : 1; for (let i = 0; i < 3; i++) { const w = ((p * 2.2 + i / 3) % 1); ring(x, y - 90, 20 + w * 80, p >= 1.4 ? C.red : C.teal, 4, a * (1 - w) * k, -Math.PI * 0.8, -Math.PI * 0.2); } }
    if (p >= 1.4 && p < 2.2) { T("!", x + 90, y - 60, { size: 60, weight: 900, color: C.red, a, g: 20 }); }
    carTop(x, y, 0.9, r, { a });
  });
}
function miniLock(cx, cy, s, u, a) {
  panel(cx, cy, s, a, "قفل ذكي بكلمة سر", C.blue, () => {
    const p = u % 4.2, seq = [0, 8, 7, 3], times = [0.3, 0.75, 1.2, 1.65];
    let pressed = -1, typed = 0; times.forEach((tt, i) => { if (p >= tt) typed = i + 1; if (p >= tt && p < tt + 0.25) pressed = seq[i]; });
    const open = p > 2.1 ? eo((p - 2.1) / 0.4) : 0;
    keypad(-120, -10, 0.82, { a, pressed, typed, open });
    if (open > 0.5) T("تم الفتح ✓", 190, 110, { size: 34, weight: 900, color: C.green, a: a * open, g: 16 });
  });
}
const ARM_KEYS = [[0, -120, -150, 1.4, 0], [0.6, -200, -180, 1.4, 0], [1.0, -200, -115, 1.4, 0], [1.3, -200, -115, 0.85, 1], [1.7, -200, -180, 0.85, 1], [2.5, 200, -180, 0.85, 1], [2.9, 200, -115, 0.85, 1], [3.2, 200, -115, 1.4, 2], [3.6, 120, -150, 1.4, 2], [4.0, -120, -150, 1.4, 0]];
function armPose(p) {
  let k = 0; while (k < ARM_KEYS.length - 2 && p > ARM_KEYS[k + 1][0]) k++;
  const A0 = ARM_KEYS[k], B = ARM_KEYS[k + 1], f = eio((p - A0[0]) / (B[0] - A0[0]));
  return { x: lerp(A0[1], B[1], f), y: lerp(A0[2], B[2], f), g: lerp(A0[3], B[3], f), st: A0[4] };
}
function ik(x, y, L1 = 150, L2 = 130) {
  const d = Math.min(Math.hypot(x, y), L1 + L2 - 1); const c2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2); const t2 = -Math.acos(clamp(c2, -1, 1));
  const t1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2)); return [t1, t2];
}
function miniArm(cx, cy, s, u, a) {
  panel(cx, cy, s, a, "ذراع روبوت ترتب", C.violet, () => {
    fillRR(-380, 150, 760, 70, 0, "#121a2a", a); seg(-380, 150, 380, 150, "#2a3a58", 3, a);
    const p = u % 4, q = armPose(p); const [t1, t2] = ik(q.x, q.y);
    fillRR(-240, 82, 80, 16, 3, "#2a3a58", a); fillRR(160, 82, 80, 16, 3, "#2a3a58", a);
    const box = (bx, by) => { fillRR(bx - 25, by - 25, 50, 50, 6, C.amber, a); strokeRR(bx - 25, by - 25, 50, 50, 6, "#fff3c4", 3, a); };
    let held = null;
    if (q.st === 0) box(-200, 57); else if (q.st === 2) box(200, 57);
    arm(0, 170, 1, t1, t2, q.g, { a, wrist: Math.PI / 2, tip: q.st === 1 ? (pt) => { held = pt; } : null });
    if (q.st === 1) { const j = [q.x, q.y + 126]; box(j[0], j[1] + 46); }
  });
}
function miniPlant(cx, cy, s, u, a) {
  panel(cx, cy, s, a, "نبتة تسقي نفسها", C.green, () => {
    const p = u % 4.2; let m = p < 1.6 ? lerp(0.75, 0.15, eio(p / 1.6)) : p < 3.0 ? lerp(0.15, 0.9, eio((p - 1.6) / 1.4)) : 0.9;
    fillRR(-380, 120, 760, 100, 0, "#1a140e", a);
    I.plant(-60, 20, 2.6, { a, v: clamp(m * 1.3) });
    seg(60, 80, 60, 150, C.metal, 6, a); fillRR(46, 50, 28, 40, 4, "#2a3a58", a); // moisture probe
    fillRR(-300, -190, 60, 12, 3, C.blue, a); seg(-240, -184, -100, -184, C.blue, 10, a); seg(-100, -184, -100, -150, C.blue, 10, a);
    if (p > 1.6 && p < 3.0) for (let i = 0; i < 6; i++) { const w = ((p * 2 + i / 6) % 1); circle(-100 + Math.sin(i) * 6, -140 + w * 190, 8, "#6cc4ff", a * (1 - w * 0.3)); }
    strokeRR(200, -160, 50, 260, 12, C.mut, 4, a); const col = m < 0.35 ? C.red : C.blue; fillRR(208, -152 + 244 * (1 - m), 34, 244 * m, 8, col, a);
    T("رطوبة", 225, 130, { size: 26, weight: 800, color: C.mut, a });
    if (m < 0.3) T("عطشى!", 0, -160, { size: 32, weight: 900, color: C.red, a, g: 12 });
  });
}
SCENES.hook = (t, L, E) => {
  const minis = [miniCar, miniLock, miniArm, miniPlant];
  const slots = [[1380, 300], [540, 300], [1380, 650], [540, 650]], g0 = L(4), q = L(4) + 0.55;
  for (let k = 0; k < 4; k++) {
    const t0 = L(k) - (k ? 0.3 : 0.5), u = t - L(k) + 0.3;
    if (t < t0) continue;
    if (t < g0 - 0.35 && (k === 3 || t < L(k + 1) - 0.3 + 0.35)) { // solo, big
      const inn = eo(P(t, t0, 0.45)), out = k < 3 ? eio(P(t, L(k + 1) - 0.3, 0.35)) : 0;
      miniF(minis[k], 960 + (1 - inn) * 500 - out * 700, 470, 1.18 - out * 0.15, u, inn * (1 - out));
    }
  }
  if (t >= g0 - 0.35) { // the grid
    const qa = P(t, q - 0.1, 0.5);
    for (let k = 0; k < 4; k++) {
      const f = eo(P(t, g0 - 0.35 + k * 0.08, 0.55)); const [sx, sy] = slots[k];
      const tx = lerp(sx, sx < 960 ? 420 : 1500, eo(qa)), ty = lerp(sy, sy < 470 ? 250 : 700, eo(qa));
      const from = k === 3 ? [960, 470, 1.18] : [960 + (k % 2 ? -500 : 500), sy, 0.2];
      miniF(minis[k], lerp(from[0], tx, f), lerp(from[1], ty, f), lerp(from[2], lerp(0.5, 0.4, qa), f), t - g0 + k * 0.7, (k === 3 ? 1 : f) * (1 - 0.45 * qa));
    }
  }
  if (t >= q - 0.1) { // the question
    const a = eo(P(t, q - 0.1, 0.5)); const cx = 960, cy = 470;
    [[420, 250], [1500, 250], [420, 700], [1500, 700]].forEach((p, i) => { const pts = [p, [cx, cy]]; pathPartial(pts, eo(P(t, q + i * 0.08, 0.5)), "rgba(46,230,197,0.5)", 3, a); pulses(pts, t + i * 0.2, C.teal, 2, 0.8, 5, a); });
    halo(cx, cy, 340, "rgba(255,176,32,0.25)", a);
    T("؟", cx, cy - 150, { size: 170 * pop(t, q, 0.5), weight: 900, color: C.amber, a: a * 0.9, g: 40 });
    card(cx - 470, cy - 70, 940, 140, { a, col: C.teal, r: 70, fill: "rgba(6,12,24,0.94)" });
    TW("ما الذي يجمع بين كل هذه؟", cx, cy + 4, q, { size: 76, weight: 900, color: C.text, g: 24, gc: "rgba(46,230,197,0.6)", colors: { "هذه؟": C.amber } });
  }
};
function miniF(fn, x, y, s, u, a) { if (a > 0.001) fn(x, y, s, Math.max(0, u), a); }

// ---------------------------------------------------------------- 2. TITLE
SCENES.title = (t, L, E) => {
  const f0 = eo(P(t, L(0) - 0.3, 0.9)), up = eio(P(t, L(1) - 0.1, 0.8));
  const bx = 960, by = lerp(430, 300, up), bs = lerp(0.2, 0.85, f0) * lerp(1, 0.55, up), rot = (1 - f0) * -0.35;
  halo(bx, by, 520 * bs, "rgba(46,230,197,0.25)", f0);
  withT(bx, by, 1, rot, () => uno(0, 0, bs, { a: f0, led: blink(t, 0.6) }));
  // dimension line
  const da = win(t, L(0) + 0.7, L(1) + 0.2, 0.3); const half = (UNO_W / 2) * bs, y = by + (UNO_H / 2) * bs + 50;
  if (da > 0) {
    const g = eo(P(t, L(0) + 0.7, 0.6));
    arrow(bx, y, bx - half * g, y, C.amber, 4, da, 14); arrow(bx, y, bx + half * g, y, C.amber, 4, da, 14);
    seg(bx - half, y - 20, bx - half, y + 20, C.amber, 3, da); seg(bx + half, y - 20, bx + half, y + 20, C.amber, 3, da);
    chip("حوالي 7 سم", bx, y + 52, { size: 30, col: C.amber, a: da * g });
    chip("أصغر من كف اليد ✋", bx + half + 210, by - 60, { size: 28, col: C.teal, a: da * eo(P(t, L(0) + 1.4, 0.4)) });
  }
  // title
  if (t > L(1) - 0.2) {
    const a = eo(P(t, L(1) + 0.2, 0.5)), sx = pop(t, L(1) + 0.2, 0.6);
    for (let i = 0; i < 3; i++) { const w = P(t, L(1) + 0.2 + i * 0.12, 1.2); ring(960, 560, 100 + w * 700, C.teal, 4, (1 - w) * 0.6); }
    withT(960, 560, 0.8 + 0.2 * sx, 0, () => T("الأردوينو", 0, 0, { size: 150, weight: 900, color: C.text, a, g: 40, gc: "rgba(46,230,197,0.8)" }));
    const sw = P(t, L(1) + 0.6, 1.2); T("ARDUINO", 960, 680, { size: 40, weight: 800, fam: "mono", color: C.teal, a: a * eo(P(t, L(1) + 0.5, 0.5)), ls: 22 });
    if (sw > 0 && sw < 1) { ctx.save(); A(0.5 * Math.sin(sw * Math.PI)); const sx2 = lerp(600, 1320, sw); const gr = ctx.createLinearGradient(sx2 - 80, 0, sx2 + 80, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gr; ctx.fillRect(sx2 - 80, 470, 160, 240); ctx.restore(); }
  }
  chip("الحلقة 01 · ما هو الأردوينو؟", 960, 790, { size: 30, col: C.violet, a: win(t, L(2), L(3) + 0.1, 0.35) * pop(t, L(2), 0.5) });
  if (t > L(3) - 0.1) {
    const a = eo(P(t, L(3), 0.4)); const zero = Math.floor(clamp((t - L(3)) / 0.8) * 9); const num = t - L(3) < 0.8 ? String(9 - zero) : "0";
    chip(`خبرة ${num}؟ ما في مشكلة`, 960, 790, { size: 34, col: C.green, a: a * pop(t, L(3), 0.5) });
    I.check(1240, 790, 0.7, { a: eo(P(t, L(3) + 0.9, 0.3)) });
  }
};

// ---------------------------------------------------------------- 3. WHAT
function windowSky(x, y, s, night, a, lamp) {
  withT(x, y, s, 0, () => {
    A(a); rr(-120, -110, 240, 220, 14); const g = ctx.createLinearGradient(0, -110, 0, 110);
    const d0 = [120, 190, 255], d1 = [40, 110, 200], n0 = [8, 12, 32], n1 = [20, 24, 60]; const mix = (p, q) => p.map((v, i) => Math.round(lerp(v, q[i], night)));
    g.addColorStop(0, `rgb(${mix(d0, n0)})`); g.addColorStop(1, `rgb(${mix(d1, n1)})`); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(-120, -110, 240, 220, 14); ctx.clip();
    const ang = Math.PI * (1 + night); circle(-10 + 90 * Math.cos(ang + Math.PI), 60 + 110 * Math.sin(ang + Math.PI), 26, "#ffd36a", a * (1 - night)); if (night < 0.5) halo(-10 + 90 * Math.cos(ang + Math.PI), 60 + 110 * Math.sin(ang + Math.PI), 80, "rgba(255,210,100,0.6)", a * (1 - night));
    circle(50, -50, 20, "#e8eefc", a * night); circle(60, -56, 17, `rgb(${mix(d0, n0)})`, a * night);
    for (let i = 0; i < 12; i++) circle(-110 + rnd(i) * 220, -100 + rnd(i + 7) * 120, 2, "#fff", a * night * (0.5 + 0.5 * Math.sin(NOW * 3 + i)));
    ctx.restore();
    strokeRR(-120, -110, 240, 220, 14, "#5a6a88", 8, a); seg(0, -110, 0, 110, "#5a6a88", 6, a); seg(-120, 0, 120, 0, "#5a6a88", 6, a);
  });
  if (lamp !== undefined) { seg(x - 230 * s, y - 210 * s, x - 230 * s, y - 120 * s, C.mut, 3, a); I.bulb(x - 230 * s, y - 70 * s, 1.1 * s, { a, on: lamp }); }
}
SCENES.what = (t, L, E) => {
  const morph = eio(P(t, L(4) - 0.1, 0.8));
  // helper -> board
  const ha = eo(P(t, L(0) - 0.3, 0.5)) * (1 - morph);
  const look = t > L(2) && t < L(4) ? -1 : 0;
  helper(1280, 500, 1.45 * (1 - 0.5 * morph) * pop(t, L(0) - 0.3, 0.6), { a: ha, look });
  chip("مساعد صغير", 1280, 180, { size: 30, col: C.teal, a: win(t, L(0) + 0.3, L(4), 0.3) });
  if (t > L(2) - 0.2 && t < L(4) + 0.3) { // awake: rotating loop arcs
    const a = win(t, L(2), L(4) + 0.2, 0.3); const r = t * 2.2;
    glow(C.teal, 14, () => { ring(1280, 470, 230, C.teal, 5, a * 0.8, r, r + 1.6); ring(1280, 470, 230, C.amber, 5, a * 0.8, r + Math.PI, r + Math.PI + 1.6); });
    chip("مستيقظ دائما", 1280, 770, { size: 28, col: C.amber, a: a * win(t, L(2) + 0.4, L(3), 0.3) });
  }
  // instruction + window + lamp
  const ia = win(t, L(1) - 0.1, L(4) + 0.2, 0.35);
  if (ia > 0) {
    card(340, 200, 600, 140, { a: ia * pop(t, L(1) - 0.1, 0.5), col: C.amber });
    TW("إذا أظلم الجو ← أشعل المصباح", 640, 270, L(1) + 0.2, { size: 38, weight: 900, colors: { "أظلم": C.blue, "أشعل": C.amber }, a: ia });
    let night = 0; if (t > L(1) + 0.6) night = 0.5 - 0.5 * Math.cos(Math.max(0, t - (L(1) + 0.6)) * (t > L(3) ? 3.6 : 1.4));
    if (t < L(3)) night = clamp((t - L(1) - 0.6) / 1.2) > 0 ? Math.min(1, (t - L(1) - 0.6) / 1.2) : 0;
    if (t >= L(3)) night = 0.5 + 0.5 * Math.sin((t - L(3)) * 3.2 + Math.PI / 2);
    const lampOn = clamp((night - 0.55) * 4);
    windowSky(720, 600, 1, night, ia, lampOn);
    if (t > L(3) - 0.1) I.clock(400, 600, 0.9, { a: ia * P(t, L(3), 0.4), r: (t - L(3)) * 8 });
  }
  // the board
  const ba = morph * (1 - eo(P(t, L(9) - 0.2, 0.01)) * 0);
  let bx = 1280, by = 480, bs = 0.62;
  if (t > L(9) - 0.3) { const m = eio(P(t, L(9) - 0.3, 0.7)); bx = lerp(1280, 960, m); by = lerp(480, 440, m); bs = lerp(0.62, 0.55, m); }
  if (morph > 0) {
    for (let i = 0; i < 24; i++) { const w = P(t, L(4) - 0.1, 1.0); const an = i / 24 * Math.PI * 2; circle(1280 + Math.cos(an) * w * 380, 480 + Math.sin(an) * w * 300, 5, i % 2 ? C.teal : C.amber, (1 - w) * morph); }
    const led = t > L(7) + 1.0 ? blink(t, 0.5) : 0;
    uno(bx, by, bs * (0.6 + 0.4 * morph), { a: ba, led });
    T("= الأردوينو", 1280, 150, { size: 54, weight: 900, color: C.teal, a: win(t, L(4) + 0.3, L(5), 0.3), g: 20 });
  }
  // definition
  const da = win(t, L(5) - 0.1, L(6) + 0.1, 0.35);
  if (da > 0) {
    card(250, 250, 760, 420, { a: da, col: C.teal });
    T("الأردوينو", 630, 320, { size: 40, weight: 900, color: C.teal, a: da });
    TW("لوحة إلكترونية صغيرة", 630, 400, L(5), { size: 52, weight: 900, a: da });
    [["تبرمج", C.amber, 1], ["تتحكم", C.violet, 2], ["في العالم الحقيقي", C.blue, 3]].forEach(([s, c, i]) => chip(s, 870 - (i - 1) * 230, 530, { size: 30, col: c, a: da * pop(t, L(5) + 0.5 + i * 0.5, 0.4) }));
    T("ضوء · صوت · حركة · حساسات", 630, 615, { size: 28, weight: 700, color: C.mut, a: da * P(t, L(5) + 2.2, 0.5) });
  }
  // laptop + cable
  const la = win(t, L(6) - 0.1, L(8) + 1.4, 0.4);
  if (la > 0) {
    I.laptop(580, 460, 1.7, { a: la * pop(t, L(6) - 0.1, 0.5), code: P(t, L(6) + 0.2, 1.6) });
    const port = unoPt(bx, by, bs, -60, 154); const plug = eo(P(t, L(7) - 0.1, 0.6)), unplug = eio(P(t, L(8) + 0.3, 0.6));
    const p0 = [580 + 230, 560], end = [lerp(p0[0] + 40, port[0], plug) - unplug * 120, port[1] + unplug * 60];
    const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(p0[0], end[0], u), lerp(p0[1], end[1], u) + Math.sin(u * Math.PI) * 90]); }
    poly(pts, "#3a4a66", 10, la * (1 - unplug)); poly(pts, C.blue, 3, la * 0.6 * (1 - unplug));
    I.usbc(end[0], end[1], 0.9, { a: la * (1 - unplug) });
    if (t > L(7) + 0.3 && t < L(8) + 0.3) pulses(pts, t, C.blue, 4, 1.2, 6, la);
    chip("USB", (p0[0] + port[0]) / 2, 720, { size: 30, col: C.blue, a: win(t, L(7) + 0.2, L(8) + 0.2, 0.3) });
  }
  const bta = win(t, L(8) + 0.4, L(9) - 0.1, 0.4);
  if (bta > 0) {
    const jack = unoPt(bx, by, bs, -18, 378); I.battery(jack[0] - 260, jack[1], 1.2, { a: bta });
    seg(jack[0] - 230, jack[1], jack[0], jack[1], C.red, 6, bta * eo(P(t, L(8) + 0.5, 0.4)));
    chip("تعمل وحدها ✓", 1280, 780, { size: 30, col: C.green, a: bta * pop(t, L(8) + 0.9, 0.5) });
  }
  // outputs
  if (t > L(9) - 0.1) {
    const outs = [[I.bulb, 470, 430, "ضوء", C.amber], [I.speaker, 1450, 430, "صوت", C.blue], [I.motor, 960, 740, "حركة", C.violet]];
    outs.forEach(([fn, x, y, name, c], i) => {
      const tt = L(9) + 0.4 + i * 0.75, a = pop(t, tt, 0.45); if (t < tt) return;
      const from = i === 2 ? [960, 440 + 150] : [960 + (i ? 1 : -1) * 200, 440];
      const pts = [from, [x, y]]; poly(pts, c, 4, 0.6 * eo(P(t, tt, 0.4))); pulses(pts, t, c, 2, 1, 5, P(t, tt, 0.4));
      fn(x, y, 1.4 * a, { a: clamp(a), on: blink(t + i * 0.3, 0.7), col: c });
      T(name, x, y + (i === 2 ? -95 : 100), { size: 34, weight: 900, color: c, a: clamp(a) });
    });
  }
};

// ---------------------------------------------------------------- 4. ANATOMY
const ANAT = [null,
  { p: ["chip"], ic: "brain", ti: "الدماغ", te: "", su: "القطعة السوداء في الوسط", c: C.amber },
  { p: ["chip"], ic: "brain", ti: "متحكم صغير", te: "Microcontroller", su: "فيه يحفظ برنامجك وينفذ", c: C.amber },
  { p: ["usb"], ic: "plug", ti: "مدخل USB", te: "USB", su: "منه البرنامج… ومنه الكهرباء", c: C.blue },
  { p: ["power"], ic: "battery", ti: "مدخل الطاقة", te: "Power Jack", su: "بطارية أو شاحن", c: C.green },
  { p: ["digital", "analog", "powerpins"], ic: "pins", ti: "أرجل اللوحة", te: "Pins", su: "صفوف ثقوب على الأطراف", c: C.teal },
  { p: ["digital", "analog", "powerpins"], ic: "nerve", ti: "مثل الأعصاب", te: "Pins", su: "توصل اللوحة بالقطع الأخرى", c: C.teal },
  { p: ["digital"], ic: "switch", ti: "إما تشغيل… أو إطفاء", te: "Digital Pins", su: "مثل مفتاح الضوء", c: C.teal },
  { p: ["analog"], ic: "knob", ti: "كل الدرجات", te: "Analog Pins", su: "مثل زر الصوت", c: C.blue },
  { p: ["powerpins"], ic: "bolt", ti: "أرجل الطاقة", te: "5V · 3.3V · GND", su: "كهرباء للقطع التي نوصلها", c: C.amber },
  { p: ["reset"], ic: "refresh", ti: "زر إعادة التشغيل", te: "Reset", su: "يعيد البرنامج من بدايته", c: C.red },
  { p: ["led"], ic: "bulb", ti: "ضوء صغير", te: "LED  ·  L", su: "أول ما سنجعله يومض", c: C.amber },
];
const TAGS = { chip: ["الدماغ", 700, 820], usb: ["USB", 200, 300], power: ["الطاقة", 200, 640], digital: ["Digital", 860, 150], analog: ["Analog", 1060, 790], powerpins: ["أرجل الطاقة", 440, 790], reset: ["Reset", 380, 150], led: ["L", 620, 150] };
SCENES.anatomy = (t, L, E) => {
  const z = eio(P(t, L(0) - 0.3, 1.3)); const bx = 720, by = 470, bs = lerp(0.42, 0.95, z);
  const k = curK(t, L, 13); const it = k >= 1 && k <= 11 ? ANAT[k] : null;
  const hl = {}; let focus = 0;
  if (it) { focus = 1; it.p.forEach((p) => (hl[p] = eo(P(t, L(k) - 0.1, 0.35)))); }
  if (k === 12) { Object.keys(TAGS).forEach((p, i) => (hl[p] = 0.6 * eo(P(t, L(12) + i * 0.12, 0.3)))); }
  const fIn = k >= 1 && k <= 11 ? eo(P(t, L(1) - 0.2, 0.4)) : k === 12 ? 1 - eo(P(t, L(12), 0.4)) : 0;
  const ledV = k === 11 ? blink(t - L(11), 0.4) : k === 12 ? blink(t, 0.6) : 0;
  uno(bx, by, bs, { a: eo(P(t, L(0) - 0.4, 0.5)), hl, focus: focus * fIn, led: ledV, hc: it ? it.c : C.teal });
  if (t < L(1) && t > L(0) + 0.6) { // scan line
    const u = P(t, L(0) + 0.6, 1.6); const y = by - 267 * bs + u * 534 * bs;
    ctx.save(); A(0.7 * Math.sin(u * Math.PI)); const g = ctx.createLinearGradient(0, y - 40, 0, y + 40); g.addColorStop(0, "rgba(46,230,197,0)"); g.addColorStop(0.5, "rgba(46,230,197,0.5)"); g.addColorStop(1, "rgba(46,230,197,0)");
    ctx.fillStyle = g; ctx.fillRect(bx - 380 * bs, y - 40, 760 * bs, 80); ctx.restore(); seg(bx - 380 * bs, y, bx + 380 * bs, y, "#bffff3", 2, Math.sin(u * Math.PI));
  }
  // nerves: wires to parts outside the board
  const na = k === 6 ? eo(P(t, L(6) + 0.2, 0.6)) : k === 7 || k === 8 ? 0.35 : 0;
  if (na > 0) {
    const top = unoPt(bx, by, bs, 172 + 4 * 25.4 + 12.7, 20), bot = unoPt(bx, by, bs, 490 + 12.7, 514), mid = unoPt(bx, by, bs, 446 + 5 * 25.4 + 12.7, 20);
    const w1 = [top, [top[0], 150], [250, 150], [190, 150]], w2 = [bot, [bot[0], 790], [250, 790], [190, 790]], w3 = [mid, [mid[0], 130], [1110, 130]];
    [[w1, C.amber], [w2, C.teal], [w3, C.green]].forEach(([w, c], i) => { pathPartial(w, eo(P(t, L(6) + 0.2 + i * 0.2, 0.8)), c, 5, na); if (k === 6) pulses(w, t + i * 0.3, c, 3, 0.9, 5, na); });
    I.bulb(150, 150, 0.7, { a: na, on: blink(t, 0.5) }); I.ldr(150, 790, 0.7, { a: na }); I.button(1150, 130, 0.6, { a: na });
  }
  // the info card
  if (it) {
    const t0 = L(k) - 0.1, a = eo(P(t, t0, 0.35)) * (1 - P(t, (k < 12 ? L(k + 1) : 1e9) - 0.25, 0.2));
    const sameAsPrev = k > 1 && ANAT[k - 1] && ANAT[k - 1].ti === it.ti;
    const cx = 1500, s2 = sameAsPrev ? 1 : 0.9 + 0.1 * back(P(t, t0, 0.45));
    // leader line from the part
    const pc = it.p.length > 1 ? unoPt(bx, by, bs, 650, 270) : partCenter(bx, by, bs, it.p[0]);
    const lp = [[pc[0], pc[1]], [lerp(pc[0], 1190, 0.6), pc[1]], [1190, 470]];
    pathPartial(lp, eo(P(t, t0 + 0.1, 0.4)), it.c, 3, a * 0.9); circle(pc[0], pc[1], 9, it.c, a); halo(pc[0], pc[1], 40, it.c, a * 0.6);
    withT(cx, 470, s2, 0, () => {
      card(-300, -230, 600, 460, { a, col: it.c });
      const ix = 0, iy = -130;
      if (it.ic === "pins" || it.ic === "nerve") { for (let i = 0; i < 6; i++) { fillRR(-150 + i * 50, iy - 22, 44, 44, 4, "#0b0d12", a); fillRR(-138 + i * 50, iy - 10, 20, 20, 2, "#7c6a3a", a); } if (it.ic === "nerve") for (let i = 0; i < 3; i++) { const pts = [[-125 + i * 100, iy + 24], [-125 + i * 100, iy + 50], [-125 + i * 100 + 30, iy + 60]]; poly(pts, [C.amber, C.teal, C.green][i], 4, a); } }
      else if (I[it.ic]) I[it.ic](ix, iy, 1.25, { a, col: it.c, on: it.ic === "switch" ? blink(t, 0.7) : it.ic === "bulb" ? blink(t - L(11), 0.4) : 1, v: it.ic === "knob" ? 0.5 + 0.45 * Math.sin(t * 2.2) : undefined, spin: 1 });
      if (it.ic === "refresh") I.refresh(ix, iy, 1.25, { a: 0 });
      T(it.ti, 0, -5, { size: 58, weight: 900, color: C.text, a });
      if (it.te) T(it.te, 0, 80, { size: it.te.length > 12 ? 38 : 46, weight: 800, fam: "mono", color: it.c, a: a * eo(P(t, t0 + (sameAsPrev ? 0.6 : 0.9), 0.4)), g: 14 });
      T(it.su, 0, 160, { size: 30, weight: 700, color: C.mut, a: a * eo(P(t, t0 + 0.5, 0.4)) });
      if (it.ic === "switch") { const pts = []; for (let i = 0; i <= 40; i++) { const x = -180 + i * 9, v = Math.floor((i + t * 8) / 6) % 2; pts.push([x, 210 - v * 24]); } poly(pts, it.c, 3, a * 0.7); }
      if (it.ic === "knob") { const pts = []; for (let i = 0; i <= 60; i++) { const x = -180 + i * 6; pts.push([x, 200 - 14 * Math.sin(i * 0.25 + t * 3)]); } poly(pts, it.c, 3, a * 0.7); }
    });
  }
  if (k === 12) { // summary tags
    Object.entries(TAGS).forEach(([p, [s, x, y]], i) => {
      const a = eo(P(t, L(12) + 0.1 + i * 0.12, 0.35)); const pc = partCenter(bx, by, bs, p);
      seg(pc[0], pc[1], x, y, "rgba(46,230,197,0.6)", 2, a); circle(pc[0], pc[1], 6, C.teal, a);
      chip(s, x, y, { size: 26, col: C.teal, a });
    });
    [["دماغ", C.amber], ["طاقة", C.green], ["أرجل", C.teal]].forEach(([s, c], i) => chip(s, 1500, 320 + i * 150, { size: 46, col: c, a: pop(t, L(12) + 0.8 + i * 0.6, 0.45) }));
  }
};

// ---------------------------------------------------------------- 5. COMPARE
function desk(x, y, s, a) {
  withT(x, y, s, 0, () => {
    I.person(0, -10, 1.3, { a, col: C.blue });
    fillRR(-170, 50, 340, 18, 6, "#2a3a58", a); seg(-150, 68, -150, 140, "#2a3a58", 8, a); seg(150, 68, 150, 140, "#2a3a58", 8, a);
    fillRR(-90, -10, 180, 56, 8, "rgba(10,18,34,0.95)", a); strokeRR(-90, -10, 180, 56, 8, C.blue, 4, a); fillRR(-12, 46, 24, 8, 2, C.blue, a);
  });
}
function guard(x, y, s, a, gate) {
  withT(x, y, s, 0, () => {
    I.person(-60, 0, 1.3, { a, col: C.teal }); fillRR(-90, -78, 60, 14, 4, C.teal, a); fillRR(-80, -92, 40, 16, 6, C.teal, a); // cap
    fillRR(20, -40, 24, 140, 6, "#2a3a58", a); withT(32, -30, 1, -gate * 1.2, () => { fillRR(0, -8, 260, 16, 8, C.red, a); for (let i = 0; i < 5; i++) fillRR(20 + i * 50, -8, 24, 16, 0, "#fff", a * 0.8); });
  });
}
SCENES.compare = (t, L, E) => {
  const tab = eio(P(t, L(5) - 0.3, 0.8)); // characters shrink into column headers
  const R = [1460, lerp(470, 175, tab)], Lf = [460, lerp(470, 175, tab)], sc = lerp(1.45, 0.42, tab);
  // computer side (right)
  const ca = eo(P(t, L(0) - 0.2, 0.5));
  if (t < L(1) - 0.1 || tab > 0) { // plain monitor icon
    const ma = t < L(1) - 0.1 ? ca * (1 - P(t, L(1) - 0.4, 0.3)) : tab;
    withT(R[0], R[1] + (tab ? 0 : -20), tab ? 0.9 : 1.4, 0, () => { fillRR(-110, -80, 220, 140, 10, "#0a1222", ma); strokeRR(-110, -80, 220, 140, 10, C.blue, 5, ma); fillRR(-20, 60, 40, 30, 3, C.blue, ma); fillRR(-60, 88, 120, 10, 4, C.blue, ma); });
  }
  if (t > L(1) - 0.3 && tab < 1) {
    const a = eo(P(t, L(1) - 0.3, 0.5)) * (1 - tab); desk(R[0], R[1] + 60, sc, a);
    const icons = [I.mail, I.film, I.game, I.globe, I.mail, I.film, I.game, I.globe];
    const n = Math.min(8, 1 + Math.floor((t - L(1)) * 2.5));
    for (let i = 0; i < n; i++) { const an = t * 0.9 + (i / 8) * Math.PI * 2, r = 300; icons[i](R[0] + Math.cos(an) * r, R[1] - 20 + Math.sin(an) * r * 0.62, 0.95 * pop(t, L(1) + i * 0.4, 0.4), { a }); }
    if (t > L(2) - 0.1) ["رسائل بريد", "أفلام", "ألعاب", "برامج كثيرة"].forEach((s, i) => chip(s, 1700 - i * 160, 700, { size: 26, col: C.blue, a: a * pop(t, L(2) + i * 0.45, 0.4) }));
    chip("موظف في مكتب = الكمبيوتر", R[0], 760, { size: 30, col: C.blue, a: a * win(t, L(1) + 0.4, L(5), 0.3) });
  }
  // arduino side (left)
  if (t < L(3) - 0.1 || tab > 0) { const ua = t < L(3) - 0.1 ? ca * (1 - P(t, L(3) - 0.4, 0.3)) : tab; uno(Lf[0], Lf[1] + (tab ? 0 : -20), tab ? 0.3 : 0.62, { a: ua, led: blink(t, 0.6) }); }
  if (t > L(3) - 0.3 && tab < 1) {
    const a = eo(P(t, L(3) - 0.3, 0.5)) * (1 - tab); const gate = t > L(4) ? 0.5 - 0.5 * Math.cos((t - L(4)) * 2.4) : 0;
    guard(Lf[0] - 90, Lf[1] + 40, sc, a, gate);
    if (t > L(4) - 0.1) { I.target(Lf[0] - 120, Lf[1] - 240, 1.1 * pop(t, L(4), 0.4), { a }); for (let i = 0; i < 2; i++) { const w = (t * 0.8 + i / 2) % 1; ring(Lf[0] - 120, Lf[1] - 240, 40 + w * 90, C.teal, 3, a * (1 - w)); } chip("مهمة واحدة", Lf[0] + 120, Lf[1] - 240, { size: 30, col: C.teal, a: a * pop(t, L(4) + 0.4, 0.4) }); }
    chip("حارس بوابة = الأردوينو", Lf[0], 760, { size: 30, col: C.teal, a: a * win(t, L(3) + 0.4, L(5), 0.3) });
  }
  // VS
  const va = ca * (1 - tab);
  if (va > 0) { circle(960, 470, 64, "rgba(10,18,34,0.95)", va); glow(C.amber, 20, () => ring(960, 470, 64, C.amber, 5, va)); T("VS", 960, 474, { size: 46, weight: 900, fam: "mono", color: C.amber, a: va }); }
  // table
  if (tab > 0) {
    T("الكمبيوتر", 1460, 305, { size: 40, weight: 900, color: C.blue, a: tab }); T("الأردوينو", 460, 305, { size: 40, weight: 900, color: C.teal, a: tab });
    const rows = [
      [L(5), "شاشة · فأرة · نظام تشغيل", ["check", ""], ["cross", ""]],
      [L(6), "التشغيل", ["clock", "يأخذ وقتا"], ["bolt", "فورا تقريبا"]],
      [L(7), "الكهرباء", ["bolt", "كثيرة"], ["battery", "قليلة · بطارية"]],
      [L(8), "حساسات ومحركات", ["cross", "ليس بسهولة"], ["check", "مباشرة"]],
    ];
    rows.forEach(([t0, lab, pc, ar], i) => {
      const a = eo(P(t, t0 - 0.1, 0.4)), y = 400 + i * 118; if (a <= 0) return;
      const star = i === 3 ? eo(P(t, t0 + 1.5, 0.5)) : 0;
      card(220, y - 50, 1480, 100, { a, col: i === 3 ? C.amber : "rgba(80,110,160,0.6)", g: i === 3 ? 30 * star : 6, fill: "rgba(10,18,34,0.8)" });
      T(lab, 960, y + 2, { size: 34, weight: 800, color: C.text, a });
      const cell = (x, [ic, s], col) => { if (I[ic]) I[ic](x + (s ? 120 : 0), y, 0.7, { a: a * pop(t, t0 + 0.3, 0.4), col, spin: 1, v: 0.35 }); if (s) T(s, x - 40, y + 2, { size: 30, weight: 800, color: col, a }); };
      cell(1460, pc, ic2col(pc[0], C.blue)); cell(460, ar, ic2col(ar[0], C.teal));
    });
  }
};
const ic2col = (ic, d) => (ic === "check" ? C.green : ic === "cross" ? C.red : d);

// ---------------------------------------------------------------- 6. FLOW
const NODES = [[1500, 270, "يستقبل", "eye", C.teal], [960, 270, "يفكر", "brain", C.amber], [420, 270, "ينفذ", "muscle", C.violet]];
function nodes(t, L, act) {
  const show = eo(P(t, L(1) + 0.3, 0.6));
  if (show <= 0) return;
  for (let i = 0; i < 2; i++) { const a = NODES[i], b = NODES[i + 1]; const pts = [[a[0] - 105, a[1]], [b[0] + 105, b[1]]]; const pa = eo(P(t, L(2) + 0.4 + i * 0.6, 0.5)); arrow(pts[0][0], pts[0][1], lerp(pts[0][0], pts[1][0], pa), pts[1][1], "rgba(200,220,255,0.5)", 4, show * pa, 16); if (pa >= 1) pulses(pts, t + i * 0.4, NODES[i + 1][4], 2, 0.9, 5, show); }
  NODES.forEach(([x, y, lab, ic, col], i) => {
    const on = act[i] || 0, a = show;
    halo(x, y, 200, col.replace(")", ",0.4)").replace("#", "#"), 0); if (on > 0) halo(x, y, 220, hexA(col, 0.5), a * on);
    circle(x, y, 92, "rgba(10,18,34,0.96)", a); glow(col, 20 + 30 * on, () => ring(x, y, 92, col, 6 + 3 * on, a));
    T(String(i + 1), x + 70, y - 70, { size: 26, weight: 900, fam: "mono", color: col, a });
    const fill = eo(P(t, L(2) - 0.1 + i * 0.6, 0.45));
    if (fill > 0) I[ic](x, y, 1.15 * back(P(t, L(2) - 0.1 + i * 0.6, 0.45)), { a: a * fill, col });
    T(lab, x, y + 140, { size: 50, weight: 900, color: col, a: a * fill, g: 14 * on });
  });
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
SCENES.flow = (t, L, E) => {
  // L0: "the most important idea"
  const ia = win(t, L(0) - 0.2, L(1) + 0.2, 0.35);
  if (ia > 0) { for (let i = 0; i < 16; i++) { const an = (i / 16) * Math.PI * 2 + t * 0.3; seg(960 + Math.cos(an) * 160, 450 + Math.sin(an) * 160, 960 + Math.cos(an) * 320, 450 + Math.sin(an) * 320, hexA(C.amber, 0.5), 4, ia); } I.star(960, 450, 2 * pop(t, L(0) - 0.2, 0.5), { a: ia }); TW("أهم فكرة", 960, 680, L(0) + 0.3, { size: 70, weight: 900, color: C.amber, a: ia, g: 20 }); }
  // active node glow for the example
  const act = [0, 0, 0];
  if (t > L(11) - 0.1 && t < L(14)) { act[0] = win(t, L(11), L(12) + 0.4, 0.3); act[1] = win(t, L(12), L(13) + 0.4, 0.3); act[2] = win(t, L(13), L(13) + 2.4, 0.3); }
  if (t > L(14)) { const ph = ((t - L(14)) * 1.6) % 3; act[0] = ph < 1 ? 1 : 0.2; act[1] = ph >= 1 && ph < 2 ? 1 : 0.2; act[2] = ph >= 2 ? 1 : 0.2; }
  if (t > L(4) && t < L(5)) { const ph = ((t - L(4) - 0.3) * 1.2); act[0] = ph > 0 && ph < 1 ? 1 : 0; act[1] = ph >= 1 && ph < 2 ? 1 : 0; act[2] = ph >= 2 ? 1 : 0; }
  nodes(t, L, act);
  // English names under nodes
  if (t > L(5) - 0.1) T("Sensors · حواس", 1500, 470, { size: 34, weight: 800, color: C.teal, a: eo(P(t, L(5) + 1.0, 0.4)) * (1 - P(t, L(10) - 0.3, 0.3)) });
  if (t > L(8) - 0.1) T("Outputs · مخارج", 420, 470, { size: 34, weight: 800, color: C.violet, a: eo(P(t, L(8) + 1.0, 0.4)) * (1 - P(t, L(10) - 0.3, 0.3)) });
  // L3-L4: the hot cup reflex
  const ha = win(t, L(3) - 0.1, L(5) - 0.05, 0.35);
  if (ha > 0) {
    const pull = t > L(4) + 1.6 ? eio(P(t, L(4) + 1.6, 0.4)) : 0, reach = eo(P(t, L(3) + 0.3, 1.0));
    I.cup(1660, 620, 1.7, { a: ha }); I.hand(lerp(1250, 1480, reach) + pull * -140, 640 - pull * 20, 1.8, { a: ha });
    if (t > L(4) - 0.1) {
      [[1500, "يدك تشعر", C.teal], [960, "دماغك يقرر", C.amber], [420, "عضلاتك تسحب", C.violet]].forEach(([x, s, c], i) => { if (i) { const ic = i === 1 ? I.brain : I.muscle; ic(x, 620, 1.2, { a: ha * pop(t, L(4) + i * 0.8, 0.4), col: c }); } T(s, x, 740, { size: 36, weight: 900, color: c, a: ha * eo(P(t, L(4) + i * 0.8, 0.4)) }); });
      const nerve = [[1440, 600], [960, 560], [420, 600]]; pathPartial(nerve, P(t, L(4), 2.2), "rgba(255,255,255,0.3)", 3, ha); pulses(nerve, t, C.amber, 2, 0.8, 6, ha * P(t, L(4), 0.3));
    }
  }
  // sensors / brain / outputs icons
  const ga = (t0) => eo(P(t, t0, 0.4)) * (1 - P(t, L(10) - 0.3, 0.3));
  if (t > L(6) - 0.1) [["ldr", 1380, 590, "ضوء"], ["thermo", 1620, 590, "حرارة"], ["pir", 1380, 760, "حركة"], ["button", 1620, 760, "زر"]].forEach(([ic, x, y, s], i) => { const a = ga(L(6) + i * 0.55); I[ic](x, y - 22, 1.15 * pop(t, L(6) + i * 0.55, 0.4), { a, v: 0.4 + 0.3 * Math.sin(t * 2), pressed: blink(t, 0.5) }); T(s, x + 0, y + 56, { size: 30, weight: 800, color: C.mut, a }); });
  if (t > L(7) - 0.1) { const a = ga(L(7)); uno(960, 630, 0.42 * pop(t, L(7), 0.45), { a, led: blink(t, 0.5), hl: { chip: 1 }, hc: C.amber }); T("المتحكم", 960, 790, { size: 30, weight: 900, color: C.amber, a }); }
  if (t > L(9) - 0.1) [["bulb", 300, 590, "مصابيح"], ["speaker", 540, 590, "سماعات"], ["motor", 300, 760, "محركات"], ["screen", 540, 760, "شاشات"]].forEach(([ic, x, y, s], i) => { const a = ga(L(9) + i * 0.5); I[ic](x, y - 22, 1.15 * pop(t, L(9) + i * 0.5, 0.4), { a, on: blink(t + i, 0.6) }); T(s, x, y + 56, { size: 30, weight: 800, color: C.mut, a }); });
  // L10-L14: smart night light
  if (t > L(10) - 0.2) {
    const a = eo(P(t, L(10), 0.5));
    chip("مثال: ضوء ليلي ذكي", 960, 505, { size: 32, col: C.amber, a: a * pop(t, L(10), 0.5) * (1 - P(t, L(14) - 0.2, 0.3)) });
    let night = 0;
    if (t > L(11)) night = eo(P(t, L(11), 1.0));
    if (t > L(13) + 1.8) night = 1 - eo(P(t, L(13) + 1.8, 0.9));
    if (t > L(14)) night = 0.5 + 0.5 * Math.sin((t - L(14)) * 4);
    const lamp = t > L(13) - 0.1 ? clamp((night - 0.5) * 3) : 0;
    windowSky(1660, 680, 0.75, night, a);
    I.ldr(1390, 680, 1.2, { a }); T("حساس ضوء", 1390, 790, { size: 24, weight: 800, color: C.teal, a });
    uno(960, 690, 0.4, { a, led: lamp > 0.5 ? 1 : 0 });
    I.bulb(520, 660, 1.6, { a, on: lamp }); T("مصباح", 520, 790, { size: 24, weight: 800, color: C.amber, a });
    const w1 = [[1330, 680], [1110, 690]], w2 = [[810, 690], [590, 680]];
    poly(w1, "rgba(46,230,197,0.5)", 4, a); poly(w2, "rgba(164,124,255,0.5)", 4, a);
    if (t > L(11) + 0.5) pulses(w1, t, C.teal, 2, 1.2, 5, a); if (t > L(12) + 1.0) pulses(w2, t, C.violet, 2, 1.2, 5, a);
    if (t > L(11) + 0.4) { const ra = win(t, L(11) + 0.4, L(13) + 1.8, 0.3) + (t > L(14) ? 1 : 0); chip(night > 0.5 ? "ظلام ✓" : "ضوء", 1390, 575, { size: 24, col: night > 0.5 ? C.blue : C.amber, a: a * clamp(ra) }); }
    if (t > L(12) - 0.1 && t < L(14)) { const ba = win(t, L(12), L(13) + 1.2, 0.3); card(760, 520, 400, 70, { a: ba, col: C.amber, r: 16 }); T("if (ظلام) ← أشعل", 960, 556, { size: 30, weight: 800, color: C.amber, a: ba }); }
  }
  if (t > L(14) - 0.1) { // the loop
    const a = eo(P(t, L(14), 0.5)); const r = t * 3;
    glow(C.teal, 16, () => { A(a); ctx.beginPath(); ctx.ellipse(960, 300, 860, 230, 0, r, r + 2.2); ctx.strokeStyle = C.teal; ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.ellipse(960, 300, 860, 230, 0, r + Math.PI, r + Math.PI + 2.2); ctx.stroke(); });
    chip("loop() ↻", 960, 110, { size: 28, col: C.teal, a: a * pop(t, L(14) + 0.3, 0.4) });
  }
};

// ---------------------------------------------------------------- 7. PUZZLE
SCENES.puzzle = (t, L, E, S, ls) => {
  const cnt = ls[3].count, cEnd = cnt.t0 + cnt.n;
  // L0: big puzzle
  const pa = win(t, L(0) - 0.2, L(1) + 0.1, 0.3);
  if (pa > 0) { for (let i = 0; i < 20; i++) { const an = (i / 20) * Math.PI * 2 + t * 0.4; seg(960 + Math.cos(an) * 180, 440 + Math.sin(an) * 180, 960 + Math.cos(an) * (300 + 30 * Math.sin(t * 4 + i)), 440 + Math.sin(an) * (300 + 30 * Math.sin(t * 4 + i)), hexA(C.amber, 0.45), 5, pa); } I.puzzle(960, 440, 2.6 * pop(t, L(0) - 0.2, 0.6), { a: pa }); T("لغز!", 960, 700, { size: 80, weight: 900, color: C.amber, a: pa, g: 24 }); }
  // door
  const da = eo(P(t, L(1) - 0.1, 0.5)); const side = eio(P(t, L(2) - 0.2, 0.7));
  if (da > 0) {
    const dx = lerp(960, 620, side), ds = lerp(0.95, 0.78, side);
    let open = 0, pers = 0;
    if (t < L(2)) { const u = (t - L(1)) % 3.2; pers = eo(clamp(u / 1.8)); open = eio(clamp((u - 1.2) / 0.6)) * (1 - eio(clamp((u - 2.7) / 0.4))); }
    if (t > L(6) + 0.3) { const u = (t - L(6) - 0.3) % 3.2; pers = eo(clamp(u / 1.4)); open = eio(clamp((u - 0.9) / 0.6)) * (1 - eio(clamp((u - 2.7) / 0.4))); }
    const hl = { sensor: t > L(4) - 0.1 ? 1 : 0, brain: t > L(5) - 0.1 ? 1 : 0, motor: t > L(6) - 0.1 ? 1 : 0 };
    const dim = t > L(3) - 0.1 && t < cEnd ? 0.45 : 1;
    door(dx, 470, ds, open, { a: da * dim, hl });
    if (pers > 0) I.person(dx, 560 + 120 * ds, (0.6 + 1.2 * pers) * ds, { a: da * dim * clamp(pers * 3), col: C.amber });
  }
  // three question cards -> answers (flip)
  if (t > L(2) - 0.1) {
    const Q = [["الحواس؟", "حساس حركة", "يستقبل", C.teal, L(4)], ["الدماغ؟", "متحكم", "يفكر", C.amber, L(5)], ["العضلات؟", "محرك", "ينفذ", C.violet, L(6)]];
    Q.forEach(([q, ans, role, col, ta], i) => {
      const a = eo(P(t, L(2) + i * 0.6, 0.4)); if (a <= 0) return; const y = 270 + i * 190;
      const f = P(t, ta - 0.1, 0.5), sx = Math.abs(Math.cos(f * Math.PI)), back2 = f > 0.5;
      ctx.save(); ctx.translate(1470, y); ctx.scale(Math.max(0.02, sx), 1);
      card(-250, -75, 500, 150, { a, col: back2 ? col : "rgba(120,140,180,0.7)" });
      if (!back2) T(q, 0, 4, { size: 54, weight: 900, color: C.text, a });
      else { T(ans, 60, -18, { size: 44, weight: 900, color: C.text, a }); T(role, 60, 38, { size: 32, weight: 800, color: col, a }); I[["pir", "brain", "gear"][i]](-160, 0, 0.8, { a, col }); }
      ctx.restore();
    });
  }
  // countdown
  if (t > L(3) - 0.1 && t < cEnd + 0.3) {
    const a = eo(P(t, L(3) - 0.1, 0.4)) * (1 - P(t, cEnd, 0.3)); const cx = 1040, cy = 470;
    circle(cx, cy, 120, "rgba(8,14,26,0.95)", a);
    const frac = t < cnt.t0 ? 1 : 1 - (t - cnt.t0) / cnt.n;
    ring(cx, cy, 120, "rgba(120,140,180,0.3)", 12, a); glow(C.amber, 20, () => ring(cx, cy, 120, C.amber, 12, a, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(frac)));
    if (t < cnt.t0) T("فكر…", cx, cy, { size: 46, weight: 900, color: C.text, a });
    else { const n = cnt.n - Math.floor(t - cnt.t0); const s = 1 + 0.25 * (1 - eo(((t - cnt.t0) % 1) / 0.3)); T(String(Math.max(1, n)), cx, cy + 6, { size: 120 * s, weight: 900, fam: "mono", color: C.amber, a, g: 24 }); }
  }
  // win
  if (t > L(7) - 0.1) {
    const a = eo(P(t, L(7), 0.3));
    for (let i = 0; i < 70; i++) { const w = P(t, L(7), 2.4); const an = rnd(i) * Math.PI * 2, sp = 300 + rnd(i + 3) * 500; const x = 1040 + Math.cos(an) * sp * eo(w), y = 470 + Math.sin(an) * sp * eo(w) + w * w * 260; withT(x, y, 1, w * 10 * (rnd(i + 5) - 0.5), () => fillRR(-7, -4, 14, 8, 2, [C.teal, C.amber, C.violet, C.pink, C.green][i % 5], (1 - w) * a)); }
    A(a * 0.55); ctx.fillStyle = "#03060c"; ctx.fillRect(0, 0, W, H); const b = pop(t, L(7), 0.6); withT(960, 470, b, 0, () => { card(-260, -110, 520, 220, { a, col: C.amber, g: 40 }); T("مبروك! 🎉", 0, -30, { size: 64, weight: 900, color: C.amber, a }); T("تفكر مثل مهندس", 0, 50, { size: 38, weight: 800, color: C.text, a }); });
  }
};

// ---------------------------------------------------------------- 8. EXAMPLES
const STEPS = [["ضوء يومض", "bulb"], ["إشارة مرور", "traffic"], ["ري ذكي", "plant"], ["بيت ذكي", "house"], ["سيارة روبوت", "car"], ["ذراع روبوت", "arm"], ["طابعة 3D", "printer"], ["علوم وفن وموسيقى", "art"]];
SCENES.examples = (t, L, E) => {
  const k = curK(t, L, 10);
  STEPS.forEach(([lab, ic], i) => {
    const x = 1640 - i * 180, y = 800 - i * 62, a0 = eo(P(t, L(0) + i * 0.12, 0.4)); if (a0 <= 0) return;
    const on = eo(P(t, L(i + 1) - 0.1, 0.4)), cur = k === i + 1;
    A(a0); rr(x - 85, y, 170, 860 - y, 8); const g = ctx.createLinearGradient(0, y, 0, 860); g.addColorStop(0, on ? hexA(C.teal, 0.35) : "rgba(30,44,70,0.6)"); g.addColorStop(1, "rgba(10,16,30,0.2)"); ctx.fillStyle = g; ctx.fill();
    glow(on ? C.teal : "#000", on ? 18 : 0, () => seg(x - 85, y, x + 85, y, on ? C.teal : "#2a3a58", 5, a0));
    T(String(i + 1), x, y + 34, { size: 24, weight: 900, fam: "mono", color: on ? C.teal : C.dim, a: a0 });
    if (on > 0) {
      const s = 1.1 * back(P(t, L(i + 1) - 0.1, 0.45)) * (cur ? 1 + 0.06 * Math.sin(t * 4) : 1), iy = y - 75;
      if (ic === "car") carTop(x, iy, 0.42 * s, Math.sin(t * 2) * 0.3, { a: on });
      else if (ic === "arm") { const p = (t * 0.7) % 1; arm(x, iy + 40, 0.28 * s, -1.9 + 0.5 * Math.sin(t * 2), 1.2 + 0.4 * Math.sin(t * 2 + 1), 1, { a: on, wrist: Math.PI / 2 }); }
      else if (ic === "art") { I.flask(x - 60, iy, 0.6 * s, { a: on }); I.palette(x, iy - 10, 0.6 * s, { a: on }); I.note(x + 60, iy, 0.6 * s, { a: on }); }
      else if (ic === "house") { I.house(x - 20, iy, 0.85 * s, { a: on, on: blink(t, 1.2) }); I.phone(x + 50, iy + 10, 0.55 * s, { a: on }); }
      else if (ic === "bulb") I.bulb(x, iy, 0.9 * s, { a: on, on: blink(t, 0.5) });
      else I[ic](x, iy, 0.9 * s, { a: on, v: 0.6 + 0.4 * Math.sin(t * 2) });
      T(lab, x, y - 158, { size: 28, weight: 900, color: cur ? C.amber : C.text, a: on });
    }
  });
  // climber
  if (k >= 1 && k <= 8) { const i = k - 1, prev = Math.max(0, i - 1); const h = eo(P(t, L(k) - 0.1, 0.4)); const x = lerp(1640 - prev * 180, 1640 - i * 180, k === 1 ? 1 : h), y = lerp(800 - prev * 62, 800 - i * 62, k === 1 ? 1 : h) - Math.sin(h * Math.PI) * 50; circle(x + 60, y - 18, 12, C.amber, 1); halo(x + 60, y - 18, 40, hexA(C.amber, 0.7), 1); }
  if (k === 0) TW("من البسيط… إلى المذهل", 960, 300, L(0) + 0.6, { size: 60, weight: 900, color: C.text, a: 1 - P(t, L(1) - 0.3, 0.3) });
  if (t > L(9) - 0.1) {
    const a = eo(P(t, L(9), 0.5));
    for (let i = 0; i < 40; i++) { const w = (t * 0.3 + rnd(i)) % 1; I.star(380 + (rnd(i + 2) - 0.5) * 700, 230 - w * 200 + rnd(i + 4) * 120, 0.15 + rnd(i + 6) * 0.25, { a: a * (1 - w) }); }
    TW("الحد الوحيد… خيالك", 1160, 200, L(9) + 0.2, { size: 72, weight: 900, colors: { "خيالك": C.amber }, a, g: 20, gc: "rgba(255,176,32,0.6)" });
  }
};

// ---------------------------------------------------------------- 9. WHY
SCENES.why = (t, L, E) => {
  const X = [1450, 960, 470], heads = [["رخيص", C.amber, L(1)], ["مفتوح المصدر", C.teal, L(2)], ["مجتمع ضخم", C.violet, L(5)]];
  X.forEach((x, i) => {
    const a0 = eo(P(t, L(0) + i * 0.15, 0.45)); if (a0 <= 0) return; const [h, col, th] = heads[i]; const on = eo(P(t, th - 0.1, 0.4));
    card(x - 215, 180, 430, 580, { a: a0, col: on > 0 ? col : "rgba(90,110,150,0.5)", g: on * 24 });
    T(["١", "٢", "٣"][i], x + 170, 220, { size: 30, weight: 900, color: on ? col : C.dim, a: a0 });
    if (on <= 0) { T("؟", x, 460, { size: 120, weight: 900, color: C.dim, a: a0 * 0.6 }); return; }
    T(h, x, 500, { size: 54, weight: 900, color: col, a: on, g: 12 });
    if (i === 0) {
      I.coin(x - 70, 330, 1.2 * pop(t, th, 0.45), { a: on }); uno(x + 70, 340, 0.2, { a: on, led: blink(t, 0.6) });
      T("نسخ متوافقة بسعر قليل", x, 580, { size: 28, weight: 700, color: C.text, a: on * P(t, th + 1.0, 0.4) });
      chip("جرب وأخطئ بلا خوف", x, 670, { size: 26, col: C.amber, a: on * pop(t, th + 2.2, 0.4) });
    }
    if (i === 1) {
      const ra = eo(P(t, L(3), 0.4));
      if (t < L(3)) { A(on); ring(x, 340, 60, col, 6, on, 0.6, Math.PI * 2 - 0.6); I.person(x, 344, 0.5, { a: 0 }); T("{ }", x, 345, { size: 48, weight: 900, fam: "mono", color: col, a: on }); }
      else {
        I.recipe(x, 330, 1.1, { a: ra }); I.pot(x - 120, 360, 0.6, { a: ra });
        for (let j = 0; j < 3; j++) { const w = eo(P(t, L(3) + 0.8 + j * 0.3, 0.6)); I.recipe(x + 30 + j * 40 * w, 330 - 30 * w + j * 4, 0.4, { a: ra * w * 0.8 }); I.person(x + 150, 260 + j * 70, 0.38 * w, { a: ra * w, col: [C.amber, C.violet, C.blue][j] }); }
        T("وصفة منشورة للجميع", x, 580, { size: 28, weight: 700, color: C.text, a: ra * P(t, L(3) + 0.5, 0.4) });
      }
      if (t > L(4) - 0.1) chip("Open Source", x, 670, { size: 30, col: C.teal, a: pop(t, L(4), 0.45) });
    }
    if (i === 2) {
      const ha = eo(P(t, L(6) - 0.1, 0.4));
      for (let j = 0; j < 3; j++) I.house(x - 130 + j * 130, 360, 0.9, { a: ha * on, on: 1 });
      if (t > L(6) + 0.6) { const qa = win(t, L(6) + 0.6, L(7) + 2, 0.3); card(x - 180, 250, 80, 56, { a: qa, col: C.amber, r: 18 }); T("؟", x - 140, 280, { size: 36, weight: 900, color: C.amber, a: qa }); }
      if (t > L(6) + 1.6) { const qa = win(t, L(6) + 1.6, L(7) + 2, 0.3); card(x + 100, 250, 80, 56, { a: qa, col: C.green, r: 18 }); T("!", x + 140, 280, { size: 36, weight: 900, color: C.green, a: qa }); const pts = [[x - 130, 330], [x, 290], [x + 130, 330]]; pulses(pts, t, C.green, 2, 0.8, 4, qa); }
      if (t > L(7) - 0.1) { const ga = eo(P(t, L(7), 0.4)); I.globe(x, 590, 1.0, { a: ga }); for (let j = 0; j < 10; j++) { const an = j * 0.63 + t * 0.5; circle(x + Math.cos(an) * (70 + 20 * rnd(j)), 590 + Math.sin(an) * 40, 4, C.violet, ga * (0.4 + 0.6 * rnd(j + 1))); } chip("آلاف الدروس المجانية", x, 690, { size: 26, col: C.violet, a: pop(t, L(7) + 1.0, 0.4) }); }
      else T("حي كبير… كله جيران", x, 590, { size: 28, weight: 700, color: C.text, a: on * P(t, L(6) + 0.3, 0.4) });
    }
  });
  if (t < L(1)) T("3 أسباب", 960, 140, { size: 44, weight: 900, color: C.amber, a: win(t, L(0), L(1), 0.3) });
};

// ---------------------------------------------------------------- 10. BOARDS
SCENES.boards = (t, L, E) => {
  const s = 0.55, items = [[1440, "Uno", "الأشهر · سنعمل عليها", C.teal, L(1)], [960, "Nano", "أصغر بكثير", C.amber, L(2)], [480, "Mega", "أكبر · أرجل أكثر", C.violet, L(3)]];
  items.forEach(([x, name, sub, col, th], i) => {
    const a0 = eo(P(t, L(0) + i * 0.15, 0.4)); const on = eo(P(t, th - 0.1, 0.45)); const y = 420;
    if (on <= 0) { const w = [UNO_W, 450, 1016][i] * s, h = [UNO_H, 180, 533][i] * s; A(a0); rr(x - w / 2, y - h / 2, w, h, 14); ctx.setLineDash([12, 10]); ctx.strokeStyle = "rgba(120,140,180,0.5)"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); T("؟", x, y, { size: 70, weight: 900, color: C.dim, a: a0 }); return; }
    const cur = t < (items[i + 1] ? items[i + 1][4] : L(4)) && t > th - 0.1;
    halo(x, y, 320, hexA(col, 0.3), on * (cur ? 1 : 0.4));
    const ps = s * (0.7 + 0.3 * back(P(t, th - 0.1, 0.5)));
    if (i === 0) uno(x, y, ps, { a: on, led: blink(t, 0.6) }); else if (i === 1) nano(x, y, ps, on, blink(t, 0.6)); else mega(x, y, ps, on);
    T(name, x, 640, { size: 56, weight: 900, fam: "mono", color: col, a: on, g: cur ? 20 : 0 });
    T(sub, x, 710, { size: 30, weight: 800, color: C.text, a: on * P(t, th + 0.6, 0.4) });
    if (i === 0) I.star(x + 230, 270, 0.5 * pop(t, th + 0.6, 0.4), { a: on });
  });
  T("الأحجام تقريبية بالمقياس نفسه", 960, 160, { size: 24, weight: 700, color: C.mut, a: eo(P(t, L(3) + 0.8, 0.4)) });
  if (t > L(4) - 0.1) {
    const a = eo(P(t, L(4), 0.4)), g = eo(P(t, L(4), 0.8)); const y = 790;
    seg(480, y - 30, 480, y, C.teal, 4, a); seg(1440, y - 30, 1440, y, C.teal, 4, a); seg(960 - 480 * g, y, 960 + 480 * g, y, C.teal, 4, a);
    chip("الفكرة نفسها: يستقبل ← يفكر ← ينفذ", 960, y, { size: 30, col: C.teal, a: pop(t, L(4) + 0.4, 0.45) });
  }
};

// ---------------------------------------------------------------- 11. MAP
function catmull(pts, n = 16) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]); } } out.push(pts[pts.length - 1]); return out; }
const ST = [[1640, 640], [1290, 330], [960, 620], [630, 330], [290, 560]];
const MAPPTS = catmull([[1860, 720], ...ST], 20);
const stU = ST.map((_, i) => (i + 1) / (ST.length + 0)); // approximate param of station on the path
SCENES.map = (t, L, E) => {
  const draw = eio(P(t, L(0), 2.0));
  poly(MAPPTS, "rgba(60,90,140,0.35)", 22, draw > 0 ? 1 : 0);
  pathPartial(MAPPTS, draw, "rgba(90,130,190,0.55)", 22, 1);
  // dashes on the road
  A(0.6); ctx.setLineDash([18, 22]); pathPartial(MAPPTS, draw, "rgba(230,240,255,0.5)", 3, 0.6); ctx.setLineDash([]);
  const k = curK(t, L, 7); const reach = k >= 1 ? Math.min(5, k) : 0;
  // lit path up to the current station
  const uOf = (i) => { let best = 0, bd = 1e9; MAPPTS.forEach((p, j) => { const d = Math.hypot(p[0] - ST[i][0], p[1] - ST[i][1]); if (d < bd) { bd = d; best = j; } }); return best / (MAPPTS.length - 1); };
  const prevU = reach >= 2 ? uOf(reach - 2) : 0, curU = reach >= 1 ? uOf(reach - 1) : 0;
  const litU = reach ? lerp(prevU, curU, eio(P(t, L(Math.min(k, 5)) - 0.1, 0.7))) : 0;
  const LIT = k === 6 ? 1 : litU;
  glow(C.teal, 20, () => pathPartial(MAPPTS, LIT, C.teal, 8, 1));
  if (LIT > 0) { const [x, y] = along(MAPPTS, LIT); halo(x, y, 60, hexA(C.amber, 0.8), 1); circle(x, y, 14, C.amber, 1); }
  if (k === 6) pulses(MAPPTS, t, "#bffff3", 5, 0.25, 6, 1);
  const info = [["أول برنامج + أول ضوء", "bulb", C.amber], ["أضواء وأصوات", "speaker", C.blue], ["أزرار وحساسات", "pir", C.teal], ["محركات وشاشات", "motor", C.violet], ["مشروع نهائي", "flag", C.amber]];
  ST.forEach(([x, y], i) => {
    const a0 = P(t, L(0) + 0.4 + i * 0.35, 0.3); if (a0 <= 0) return; const on = eo(P(t, L(i + 1) - 0.1, 0.4)); const [lab, ic, col] = info[i];
    circle(x, y, 58, "rgba(10,18,34,0.96)", a0); glow(on ? col : "#000", on ? 26 : 0, () => ring(x, y, 58, on ? col : "#2a3a58", 6, a0));
    if (on > 0) I[ic](x, y, 0.8 * back(P(t, L(i + 1) - 0.1, 0.45)), { a: on, col, on: blink(t, 0.6) }); else T(String(i + 1), x, y + 2, { size: 40, weight: 900, fam: "mono", color: C.dim, a: a0 });
    const ly = y < 450 ? y - 100 : y + 100;
    T(lab, x, ly, { size: 34, weight: 900, color: on ? C.text : C.dim, a: a0 * (0.4 + 0.6 * on) });
    if (on > 0) T("المحطة " + (i + 1), x, ly + (y < 450 ? -42 : 42), { size: 22, weight: 800, color: col, a: on });
  });
  if (k === 6) ["عملي", "بسيط", "خطوة خطوة"].forEach((s, i) => chip(s, 1260 - i * 300, 835, { size: 30, col: [C.teal, C.amber, C.violet][i], a: pop(t, L(6) + 0.3 + i * 0.5, 0.45) }));
  if (t < L(1)) T("خريطة الطريق", 960, 150, { size: 50, weight: 900, color: C.teal, a: win(t, L(0), L(1), 0.3), g: 14 });
};

// ---------------------------------------------------------------- 12. TEASER
const CODE = ["void setup() {", "  pinMode(13, OUTPUT);", "}", "", "void loop() {", "  digitalWrite(13, HIGH);", "  delay(1000);", "  digitalWrite(13, LOW);", "  delay(1000);", "}"];
SCENES.teaser = (t, L, E) => {
  const endA = eo(P(t, L(6) - 0.1, 0.6));
  const side = eio(P(t, L(3) - 0.2, 0.8));
  const bx = lerp(960, 1380, side), by = lerp(440, 470, side), bs = lerp(0.7, 0.62, side);
  const led = t > L(5) - 0.1 ? (Math.floor((t - L(5) + 0.1) / 0.5) % 2 === 0 ? 1 : 0) : 0;
  const a = eo(P(t, L(0) - 0.3, 0.6)) * (1 - endA);
  if (a > 0) {
    // spotlight
    A(a * 0.5); ctx.beginPath(); ctx.moveTo(bx - 80, 0); ctx.lineTo(bx + 80, 0); ctx.lineTo(bx + 420, by + 260); ctx.lineTo(bx - 420, by + 260); ctx.closePath(); const g = ctx.createLinearGradient(0, 0, 0, by + 260); g.addColorStop(0, "rgba(180,220,255,0.18)"); g.addColorStop(1, "rgba(180,220,255,0)"); ctx.fillStyle = g; ctx.fill();
    if (t > L(2) - 0.2 && t < L(4)) { const ba = win(t, L(2) - 0.2, L(4), 0.4); for (let c = 0; c < 26; c++) { const x = 120 + c * 70; for (let r = 0; r < 12; r++) { const y = ((r * 90 + t * (60 + rnd(c) * 80) + rnd(c + 3) * 900) % 1000); T(rnd(c * 31 + r + Math.floor(t * 3)) > 0.5 ? "1" : "0", x, y, { size: 26, weight: 800, fam: "mono", color: C.teal, a: ba * 0.18 }); } } }
    uno(bx, by, bs, { a, led, hl: led ? { led: 1 } : {}, hc: C.amber });
    if (led) { const ledP = partCenter(bx, by, bs, "led"); for (let i = 0; i < 2; i++) { const w = ((t - L(5)) * 1.4 + i / 2) % 1; ring(ledP[0], ledP[1], 20 + w * 140, C.amber, 4, a * (1 - w)); } halo(ledP[0], ledP[1], 200, hexA(C.amber, 0.6), a); }
    if (t < L(2)) for (let i = 0; i < 5; i++) T("؟", bx + Math.cos(i * 1.3 + t) * 380, by - 40 + Math.sin(i * 1.7 + t * 0.8) * 200, { size: 60 + i * 8, weight: 900, color: C.amber, a: a * 0.35 * win(t, L(0), L(2), 0.3) });
    // bubbles bouncing off
    if (t > L(1) - 0.1 && t < L(2) + 0.4) {
      [["مرحبا", 1, C.teal], ["Hello", -1, C.blue]].forEach(([s, d, c], i) => {
        const u = P(t, L(1) + 0.2 + i * 0.5, 1.4); const x = bx + d * lerp(700, 260, eo(Math.min(u * 1.6, 1))) + d * (u > 0.62 ? (u - 0.62) * 600 : 0), y = by - 160 - Math.sin(u * Math.PI) * 60;
        const ba = clamp(u * 5) * (1 - clamp((u - 0.75) * 4));
        card(x - 110, y - 40, 220, 80, { a: ba, col: c, r: 30 }); T(s, x, y + 2, { size: 36, weight: 900, color: c, a: ba });
        if (u > 0.6) I.cross(x, y - 80, 0.6, { a: ba });
      });
    }
    if (t > L(2) - 0.1 && t < L(3) + 0.3) TW("بأي لغة يفهم؟", 960, 160, L(2), { size: 70, weight: 900, colors: { "لغة": C.amber }, a: win(t, L(2) - 0.1, L(3) + 0.3, 0.3), g: 20 });
    // laptop -> editor + cable
    if (t > L(3) - 0.2) {
      const la = eo(P(t, L(3), 0.5)), ed = eio(P(t, L(4) - 0.2, 0.6));
      if (ed < 1) I.laptop(560, 470, 1.5 * (1 - ed), { a: la * (1 - ed), code: 0 });
      const port = unoPt(bx, by, bs, -60, 154), p0 = [lerp(560 + 200, 900, ed), lerp(540, 470, ed)];
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(p0[0], port[0], u), lerp(p0[1], port[1], u) + Math.sin(u * Math.PI) * 70]); }
      const plug = eo(P(t, L(3) + 0.3, 0.6)); pathPartial(pts, plug, "#3a4a66", 10, la); pathPartial(pts, plug, C.blue, 3, la * 0.6);
      if (plug >= 1) pulses(pts, t, C.blue, 3, 1.1, 6, la);
      if (ed > 0) {
        withT(560, 470, 0.4 + 0.6 * ed, 0, () => {
          card(-340, -270, 680, 540, { a: la * ed, col: C.blue, r: 18, fill: "rgba(6,12,24,0.97)" });
          [C.red, C.amber, C.green].forEach((c, i) => circle(-310 + i * 26, -242, 8, c, la * ed)); T("blink.ino", 0, -242, { size: 22, weight: 800, fam: "mono", color: C.mut, a: la * ed });
          const prog = P(t, L(4) + 0.1, 3.0) * CODE.join("").length; let used = 0;
          CODE.forEach((s, i) => { const n = Math.max(0, Math.min(s.length, Math.floor(prog - used))); used += s.length; if (n > 0) { const col = s.includes("HIGH") ? C.amber : s.includes("LOW") ? C.blue : s.includes("delay") ? C.violet : C.teal; T(s.slice(0, n), -300, -190 + i * 44, { size: 28, weight: 800, fam: "mono", align: "left", color: col, a: la * ed }); if (n < s.length || (i === CODE.length - 1 && n === s.length)) { const w = measure(s.slice(0, n), 28, 800, "mono"); if (blink(t, 0.25)) fillRR(-300 + w + 2, -190 + i * 44 - 16, 14, 30, 2, C.teal, la * ed); } } });
        });
      }
    }
    if (t > L(5) - 0.1) chip("أول ضوء 💡", bx, by + 250, { size: 32, col: C.amber, a: pop(t, L(5) + 0.3, 0.45) * (1 - endA) });
  }
  // end card
  if (endA > 0) {
    halo(960, 420, 600, "rgba(46,230,197,0.18)", endA);
    T("الحلقة القادمة", 960, 230, { size: 40, weight: 800, color: C.amber, a: endA });
    withT(960, 370, 0.9 + 0.1 * back(P(t, L(6), 0.6)), 0, () => TW("أول كود… وأول ضوء", 0, 0, L(6) + 0.1, { size: 104, weight: 900, color: C.text, g: 30, gc: "rgba(46,230,197,0.7)", colors: { "ضوء": C.amber } }));
    uno(960, 590, 0.28, { a: endA, led: blink(t, 0.5), hl: { led: blink(t, 0.5) }, hc: C.amber });
    brand(860, 760, endA * P(t, L(6) + 1.2, 0.5), 1.2); T("مسار", 1000, 756, { size: 54, weight: 900, color: C.text, a: endA * P(t, L(6) + 1.2, 0.5) });
  }
};

// ---------------------------------------------------------------- cover (not part of the video): window.cover()
window.cover = () => {
  NOW = 2.3; GA = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); background(0.5);
  halo(1300, 520, 620, "rgba(46,230,197,0.28)", 1);
  const bx = 1300, by = 540, bs = 1.05;
  const pts = [[1720, 220, "car"], [1760, 840, "lock"], [880, 900, "arm"]];
  pts.forEach(([x, y]) => { poly([[x, y], [bx, by]], "rgba(46,230,197,0.55)", 4, 1); });
  withT(bx, by, 1, -0.12, () => uno(0, 0, bs, { led: 1, hl: { led: 1 }, hc: C.amber }));
  carTop(1720, 220, 0.75, 0.4, {}); I.cross(0, 0, 0, { a: 0 });
  withT(1760, 840, 0.55, 0, () => keypad(-100, 0, 0.9, { typed: 4, open: 1 }));
  withT(880, 900, 0.5, 0, () => arm(0, 120, 1, -2.0, 1.1, 1, { wrist: Math.PI / 2 }));
  T("الأردوينو", 520, 430, { size: 170, weight: 900, color: C.text, g: 40, gc: "rgba(46,230,197,0.7)" });
  T("؟", 520 - measure("الأردوينو", 170, 900) / 2 - 55, 430, { size: 190, weight: 900, color: C.amber, g: 30 });
  T("من الصفر · بدون خبرة", 470, 590, { size: 58, weight: 800, color: C.teal });
  chip("01", 150, 120, { size: 52, col: C.teal });
  brand(1640, 80, 1, 1.4); T("مسار", 1570, 76, { size: 64, weight: 900, color: C.text, align: "right" });
};
