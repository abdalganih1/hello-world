// Bubble Sort reel. Lines: 0 hook (Obama at Google, 2007) · 1 his answer · 2 why? · 3 setup · 4 idea (compare + swap)
// 5-6 passes · 7 name · 8-11 speed (21, half a trillion, 16,000 years, O(n²)) · 12 callback · 13 teaser (Merge Sort)
"use strict";
const START = [5, 2, 7, 1, 6, 3, 4], N = START.length, BX = (i) => 150 + 130 * i, BASE = 1130, UNIT = 52;
// ---- the sorting schedule: every comparison of bubble sort, timed on the voice
function schedule() {
  const ev = [], a = START.slice(); const cmp = [];
  for (let p = 0; p < N - 1; p++) for (let j = 0; j < N - 1 - p; j++) cmp.push([p, j]);
  // compare 0 is shown slowly during the idea line; the rest of pass 1 during line 5; passes 2..6 during line 6 + its pause
  const t0 = AT(4, "نقارن", "منقارن"), sw0 = AT(4, "نبدل", "نبدلهما", "منبدّلهن");
  const p1 = cmp.filter((c) => c[0] === 0).slice(1), rest = cmp.filter((c) => c[0] > 0);
  const a5 = L0(5) + 0.2, b5 = L1(5) - 0.1, a6 = L0(6) + 0.1, b6 = L1(6) + 2.0;
  const times = [[t0, sw0]]; p1.forEach((_, k) => { const t = a5 + (b5 - a5) * k / p1.length; times.push([t, t + 0.22]); });
  rest.forEach((_, k) => { const t = a6 + (b6 - a6) * k / rest.length; times.push([t, t + 0.1]); });
  cmp.forEach(([p, j], k) => { const sw = a[j] > a[j + 1]; ev.push({ p, j, t: times[k][0], ts: times[k][1], sw, d: k === 0 ? 0.55 : k <= p1.length ? 0.28 : 0.14 }); if (sw) [a[j], a[j + 1]] = [a[j + 1], a[j]]; });
  return ev;
}
let SCH = null;
// positions of every value at time t (values move between slots when swapped)
function barsAt(t) {
  const a = START.slice(), pos = {}; a.forEach((v, i) => (pos[v] = i)); let cur = null, locked = 0;
  for (const e of SCH) {
    if (t < e.t) break; cur = e;
    if (e.sw && t >= e.ts) { const u = eio(P(t, e.ts, e.d)); const v1 = a[e.j], v2 = a[e.j + 1]; if (u >= 1) { [a[e.j], a[e.j + 1]] = [v2, v1]; pos[v1] = e.j + 1; pos[v2] = e.j; } else { pos[v1] = e.j + u; pos[v2] = e.j + 1 - u; return { pos, cur, arc: Math.sin(u * Math.PI), v1, v2, locked: lockedAt(e) }; } }
    if (e.j === N - 2 - e.p && t >= e.ts + e.d) locked = e.p + 1;
  }
  return { pos, cur, arc: 0, locked };
}
const lockedAt = (e) => e.p;
function bar(v, x, h, o = {}) {
  const { a = 1, state = "", lift = 0 } = o, w = 96, top = BASE - h - lift, col = state === "done" ? C.teal : state === "cmp" ? C.navy : state === "swap" ? C.gold : "#ffffff";
  fillRR(x - w / 2, top, w, h, 20, col, a, 16); strokeRR(x - w / 2, top, w, h, 20, state ? col : C.line, 3, a);
  // the bubble on top carrying the number
  const br = 44, by = top - br - 8; circle(x, by, br, state === "done" ? C.teal : state === "cmp" || state === "swap" ? C.navy : "#ffffff", a, 14); ring(x, by, br, state ? (state === "done" ? C.teal : C.navy) : C.line, 3, a);
  circle(x - 14, by - 16, 9, "rgba(255,255,255,0.65)", a); T(String(v), x, by + 4, { size: 52, fam: "mono", color: state ? "#ffffff" : C.navy, a });
}
SCENES.bars = (t) => {
  if (!SCH) SCH = schedule(); const s0 = SCN.setup.t0, s1 = SCN.name.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const out = 1 - P(t, s1 - 0.05, 0.3);
  const { pos, cur, arc, v1, v2 } = barsAt(t); let locked = 0; for (const e of SCH) if (t >= e.ts + e.d && e.j === N - 2 - e.p) locked = e.p + 1; if (t >= SCH[SCH.length - 1].ts + 0.2) locked = N;
  const allDone = locked >= N, doneT = SCH[SCH.length - 1].ts + 0.2;
  for (let v = 1; v <= N; v++) {
    const enter = eo(P(t, s0 + 0.2 + v * 0.05, 0.45)), slot = pos[v], x = BX(0) + (BX(1) - BX(0)) * slot; let state = "", lift = 0;
    if (Math.round(slot) >= N - locked && Math.abs(slot - Math.round(slot)) < 0.01) state = "done";
    if (cur && !allDone && t < cur.ts + cur.d + 0.05 && (Math.round(slot) === cur.j || Math.round(slot) === cur.j + 1 || v === v1 || v === v2)) state = cur.sw && t >= cur.ts ? "swap" : "cmp";
    if (v === v1) lift = arc * 70; if (v === v2) lift = -arc * 20;
    if (allDone) lift = Math.max(0, Math.sin((t - doneT) * 7 - v * 0.6)) * 26 * (1 - P(t, doneT + 1.4, 0.4));
    bar(v, x, v * UNIT, { a: out * enter, state, lift: lift + (1 - enter) * -500 });
  }
  // comparison chip under the pair being compared
  if (cur && !allDone && t < cur.ts + cur.d + 0.1) { const xm = (BX(cur.j) + BX(cur.j + 1)) / 2, k = pop(t, cur.t, 0.25), a2 = out * clamp(k * 2) * (1 - P(t, cur.ts + cur.d, 0.1));
    const big = START.slice(), arr = (() => { const a = START.slice(); for (const e of SCH) { if (e === cur) break; if (e.sw) [a[e.j], a[e.j + 1]] = [a[e.j + 1], a[e.j]]; } return a; })();
    const txt = cur.sw ? `${arr[cur.j]} > ${arr[cur.j + 1]} 🔄` : `${arr[cur.j]} < ${arr[cur.j + 1]} ✓`;
    withT(xm, BASE + 60, k, k, 0, () => { fillRR(-125, -38, 250, 76, 38, cur.sw ? "#fff4dc" : C.tealSoft, a2, 10); T(txt, 0, 3, { size: 38, fam: "mono", color: cur.sw ? "#b9781a" : C.teal, a: a2 }); }); }
  if (allDone) sparkle(540, BASE - 420, doneT, { n: 40, r: 420 });
  // name: chip
  if (t > L0(7) - 0.1) { const k = pop(t, AT(7, "ترتيب") + 0.25, 0.45); withT(540, BASE + 110, k, k, 0, () => { fillRR(-260, -54, 520, 108, 54, C.navy, out * clamp(k * 2), 20); T("Bubble Sort", 0, 4, { size: 58, color: "#fff", fam: "mono", a: out * clamp(k * 2) }); }); }
};
// ---- host on the left (poses drawn facing right): walks in, watches, jumps when it is sorted, thumbs-up on the name
const HOSTX = 230, HOSTY = 1720, HOSTH = 470;
function hostPose(t) { const d = SCH ? SCH[SCH.length - 1].ts + 0.2 : 1e9; const seq = [[SCN.setup.t0 + 0.1, "walking"], [SCN.setup.t0 + 1.9, "front"], [d - 0.05, "celebrating"], [d + 1.3, "front"], [L0(7) + 0.3, "hero"]]; let c = seq[0]; for (const q of seq) if (t >= q[0]) c = q; return c; }
SCENES.khwarizmo = (t) => {
  const t0 = SCN.setup.t0 + 0.1, t1 = SCN.name.t1 - 0.1; if (t < t0 || t > t1 + 0.45 || !SCH) return;
  const [since, pose] = hostPose(t), sw = P(t, since, 0.3); let sx = 1, sy = 1; if (pose !== "walking" && sw < 1) { const b = back(sw, 2.0); sx = lerp(1.08, 1, b); sy = lerp(0.9, 1, b); }
  const d = SCH[SCH.length - 1].ts + 0.2, ju = P(t, d - 0.05, 0.62), exit = eio(P(t, t1, 0.4)), wk = P(t, t0, 1.7), x = lerp(-260, HOSTX, eo(wk)); let y = HOSTY + exit * 900;
  if (pose === "walking" && wk < 1) { const st = Math.abs(Math.sin(wk * Math.PI * 4)); y -= st * 18 * (1 - wk); sy *= 1 - 0.025 * (1 - st); }
  if (ju > 0 && ju < 1) { y -= Math.sin(ju * Math.PI) * 80; sy *= 1 + 0.05 * Math.sin(ju * Math.PI); }
  KR(pose, x, y, pose === "celebrating" || pose === "walking" ? HOSTH * 0.97 : HOSTH, { sx, sy, rot: 0, shadow: ju > 0 && ju < 1 ? 1 - 0.6 * Math.sin(ju * Math.PI) : 1 });
};

// ---- hook + answer + callback: the 2007 Google talk (no likeness: a stage, a mic, a question card, the audience)
function stage(t, a, o = {}) {
  if (a <= 0) return; const { answer = 0, check = 0 } = o;
  // spotlight + stage floor
  A(a * 0.5); ctx.beginPath(); ctx.moveTo(470, 380); ctx.lineTo(610, 380); ctx.lineTo(860, 1250); ctx.lineTo(220, 1250); ctx.closePath(); const g = ctx.createLinearGradient(0, 380, 0, 1250); g.addColorStop(0, "rgba(31,181,181,0.22)"); g.addColorStop(1, "rgba(31,181,181,0)"); ctx.fillStyle = g; ctx.fill();
  fillRR(140, 1230, 800, 26, 13, "rgba(29,53,87,0.12)", a);
  // the microphone on its stand
  fillRR(532, 960, 16, 270, 8, C.navy, a); fillRR(470, 1222, 140, 18, 9, C.navy, a);
  withT(540, 900, 1, 1, -0.25, () => { fillRR(-34, -70, 68, 110, 34, C.navy, a, 14); for (let i = 0; i < 4; i++) seg(-22, -48 + i * 18, 22, -48 + i * 18, "rgba(255,255,255,0.35)", 3, a); });
  // event tag
  const tk = pop(t, 0.35, 0.45); withT(540, 560, tk, tk, 0, () => { fillRR(-170, -40, 340, 80, 40, "#ffffff", a * clamp(tk * 2), 16); strokeRR(-170, -40, 340, 80, 40, C.line, 3, a * clamp(tk * 2)); T("Google · 2007", 0, 3, { size: 38, color: C.navy, fam: "mono", a: a * clamp(tk * 2) }); });
  // the audience
  for (let i = 0; i < 9; i++) { const x = 150 + i * 97, laugh = answer > 0 ? Math.abs(Math.sin(t * 9 + i)) * 10 * answer : 0, y = 1420 - laugh;
    circle(x, y - 46, 26, "rgba(29,53,87,0.75)", a); fillRR(x - 40, y - 18, 80, 90, 34, "rgba(29,53,87,0.75)", a); }
  for (let i = 0; i < 5 && answer > 0; i++) { const u = ((t - o.at) * 0.7 + i / 5) % 1; T("😂", 160 + i * 190 + Math.sin(i) * 30, 1300 - u * 260, { size: 54, a: a * answer * (1 - u) }); }
  // the answer bubble
  if (answer > 0) { const k = back(answer, 1.6); withT(540, 720, k, k, 0, () => { fillRR(-300, -66, 600, 132, 40, "#ffffff", a, 24); strokeRR(-300, -66, 600, 132, 40, C.red, 4, a); poly([[-30, 66], [0, 110], [30, 66]], null, 0, a, true, "#ffffff");
      T("Bubble Sort", 40, 4, { size: 62, fam: "mono", color: C.navy, a }); seg(-150, 4, 230, 4, C.red, 8, a * eo(P(answer, 0.4, 0.6))); circle(-230, 0, 38, C.red, a); seg(-246, -16, -214, 16, "#fff", 7, a); seg(-214, -16, -246, 16, "#fff", 7, a); }); }
  if (check > 0) { const k = back(check, 1.8); withT(540, 720, k, k, 0, () => { circle(0, 0, 110, C.teal, a, 30); poly([[-48, 0], [-14, 34], [52, -36]], "#fff", 18, a); }); sparkle(540, 720, o.checkAt, { n: 36, r: 380 }); }
}
SCENES.hook = (t) => { const e = SCN.answer.t1; if (t > e + 0.3) return; const a = 1 - P(t, e - 0.05, 0.3), ans = t >= AT(1, "أكيد") - 0.1 ? P(t, AT(1, "أكيد") - 0.1, 0.5) : 0; stage(t, a, { answer: ans, at: AT(1, "أكيد") }); };
SCENES.callback = (t) => { const s0 = SCN.callback.t0, s1 = SCN.callback.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3)), c = AT(12, "حق") - 0.2; stage(t, a, { check: P(t, c, 0.5), checkAt: c }); };
// ---- why: bubbles rising, the bigger ones faster
SCENES.why = (t) => { const s0 = SCN.why.t0, s1 = SCN.why.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  for (let i = 0; i < 14; i++) { const v = 1 + Math.floor(rnd(i + 2) * 9), r = 30 + v * 7, sp = 140 + v * 60, x = 120 + rnd(i) * 840 + Math.sin(t * 2 + i) * 20, y = 1560 - ((t - s0) * sp + rnd(i + 5) * 500) % 1000; if (y < 560) continue;
    circle(x, y, r, "rgba(255,255,255,0.92)", a, 10); ring(x, y, r, hexA(C.teal, 0.6), 3, a); circle(x - r * 0.35, y - r * 0.35, r * 0.22, "rgba(255,255,255,0.9)", a); T(String(v), x, y + 3, { size: r * 0.9, fam: "mono", color: C.navy, a }); } };

// ---- speed: 21 comparisons · half a trillion · 16,000 years · O(n²)
SCENES.speed = (t) => {
  const s0 = SCN.speed.t0, s1 = SCN.speed.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  const r1 = 1 - P(t, L0(9) - 0.2, 0.3);
  if (r1 > 0) { const n = Math.min(21, Math.floor(clamp((t - AT(8, "واحد")) / 1.2) * 21.99)); for (let i = 0; i < 21; i++) { const x = 190 + (i % 7) * 117, y = 760 + Math.floor(i / 7) * 117, on = i < n; withT(x, y, on ? 1 : 0.85, on ? 1 : 0.85, 0, () => { fillRR(-46, -46, 92, 92, 22, on ? C.navy : "#ffffff", a * r1, 10); strokeRR(-46, -46, 92, 92, 22, on ? C.navy : C.line, 3, a * r1); if (on) T("⇄", 0, 2, { size: 44, color: "#fff", a: a * r1 }); }); }
    T(`${n} مقارنة`, 540, 1180, { size: 56, color: C.navy, a: a * r1 }); }
  const r2 = P(t, L0(9) - 0.05, 0.3) * (1 - P(t, L0(10) - 0.15, 0.3));
  if (r2 > 0) { const u = Math.pow(eio(P(t, AT(9, "يحتاج", "بدهن"), 1.4)), 3), n = Math.round(lerp(1e6, 5e11, u)); T(n.toLocaleString("en-US"), 540, 900, { size: n > 1e10 ? 104 : 130, color: u >= 1 ? C.red : C.navy, fam: "mono", a: a * r2 }); T("مقارنة", 540, 1020, { size: 50, color: C.mut, a: a * r2 }); }
  const r3 = P(t, L0(10) - 0.05, 0.3) * (1 - P(t, L0(11) - 0.15, 0.3));
  if (r3 > 0) { const u = eio(P(t, AT(10, "ننتهي", "لانتهينا", "بتخلص"), 1.3)), yr = Math.round(lerp(2026, 2026 + 15855, u)); T("🐢", 540, 720, { size: 130, a: a * r3 }); T(String(yr), 540, 930, { size: 150, color: u >= 1 ? C.red : C.navy, fam: "mono", a: a * r3 }); T("سنة الانتهاء", 540, 1060, { size: 42, color: C.mut, a: a * r3 });
    fillRR(240, 1140, 600, 18, 9, C.line, a * r3); fillRR(240, 1140, 600 * u, 18, 9, C.red, a * r3); }
  const r4 = P(t, L0(11) - 0.05, 0.3);
  if (r4 > 0) { const k = pop(t, AT(11, "Big", "أو إن", "O(n²).") - 0.1, 0.45); withT(540, 700, k, k, 0, () => T("O(n²)", 0, 0, { size: 150, color: C.navy, fam: "mono", a: a * r4 * clamp(k * 2) }));
    const gx = 200, gy = 1330, gw = 680, gh = 440, u = eio(P(t, L0(11) + 0.2, 1.1)); seg(gx, gy, gx + gw + 20, gy, C.mut, 4, a * r4); seg(gx, gy, gx, gy - gh - 20, C.mut, 4, a * r4);
    seg(gx, gy, gx + gw * u, gy - gh * 0.35 * u, hexA(C.teal, 0.7), 6, a * r4); const pts = []; for (let i = 0; i <= 60 * u; i++) { const xx = i / 60; pts.push([gx + gw * xx, gy - gh * xx * xx]); } if (pts.length > 1) poly(pts, C.red, 9, a * r4);
    if (pts.length > 1) T("تربيعي", pts[pts.length - 1][0] - 10, pts[pts.length - 1][1] - 30, { size: 30, color: C.red, a: a * r4, align: "right" });
    T("عدد العناصر", gx + gw / 2, gy + 46, { size: 32, color: C.mut, a: a * r4 }); T("الخطوات", gx - 20, gy - gh - 40, { size: 32, color: C.mut, a: a * r4, align: "left" }); }
};

// ---- teaser: locked, blurred "Merge Sort" -> next reel
SCENES.teaser = (t) => {
  const s0 = SCN.teaser.t0; if (t < s0 - 0.1) return; const e = eo(P(t, s0, 0.5)); KR("wink", 540, 1720 + (1 - e) * 600, 700, { bob: 0.6 });
  const rv = AT(13, "Reel", "الريل", "بالريل"), f = P(t, rv - 0.12, 0.3), sx = Math.abs(Math.cos(f * Math.PI)), flipped = f > 0.5;
  if (!flipped) { const q = pop(t, s0 + 0.05, 0.45), wob = Math.sin(t * 9) * 0.06 * win(t, s0 + 0.4, rv, 0.15);
    for (let k = 0; k < 2; k++) { const u = ((t - s0) * 1.3 + k / 2) % 1; ring(540, 680, 130 + u * 110, hexA(C.teal, 0.5), 6 * (1 - u), (1 - u) * clamp(q)); }
    withT(540, 680, q * Math.max(0.02, sx), q, wob, () => { circle(0, 0, 130, C.navy, clamp(q * 2), 30); T("؟", 0, 12, { size: 180, color: "#fff", a: clamp(q * 2) }); }); }
  else { const k = back(P(t, rv + 0.03, 0.4), 1.4), w = lerp(260, 640, eo(P(t, rv + 0.03, 0.35)));
    withT(540, 680, Math.max(0.02, sx) * k, k, 0, () => { fillRR(-w / 2, -95, w, 190, 40, C.navy, 1, 36);
      ctx.save(); rr(-w / 2, -95, w, 190, 40); ctx.clip(); ctx.filter = "blur(11px)"; T("Merge Sort", 0, 6, { size: 86, color: "#ffffff", fam: "mono" }); ctx.filter = "none";
      const sh = ((t - rv) * 0.7) % 1.4; if (sh < 1) { A(0.35); const gx = lerp(-w / 2 - 120, w / 2 + 120, sh); const g = ctx.createLinearGradient(gx - 90, 0, gx + 90, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(120,240,230,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(gx - 90, -95, 180, 190); }
      ctx.restore(); T("🔒", w / 2 - 50, -60, { size: 40 }); });
    const r = imp(t, rv + 0.1, 0.7); ring(540, 680, 160 + 260 * (1 - r), hexA(C.teal, 0.6), 10 * r + 1, r); sparkle(540, 680, rv + 0.1, { n: 34, r: 420 });
    const p = pop(t, rv + 0.35, 0.5); withT(540, 880, p, p, 0, () => T("في الريل القادم 👀", 0, 0, { size: 84, color: C.teal, a: clamp(p * 2) })); }
};
SCENES.order = ["hook", "why", "bars", "speed", "callback", "teaser", "khwarizmo"];

window.collectSfx = () => {
  SCH = SCH || schedule(); const e = [], ev = (t, k, v = 0) => e.push({ t: +t.toFixed(3), k, v });
  ev(0.02, "hit"); ev(0.35, "pop"); ev(AT(1, "أكيد") - 0.1, "no"); ev(AT(1, "أكيد") + 0.3, "pop", 1);
  for (let v = 1; v <= N; v++) ev(SCN.setup.t0 + 0.2 + v * 0.05, "card", v);
  SCH.forEach((c, k) => { ev(c.t, "tick", k % 7); if (c.sw) ev(c.ts, "swish", k); }); ev(SCH[SCH.length - 1].ts + 0.2, "found", 4);
  ev(AT(7, "ترتيب") + 0.25, "pop"); ev(AT(9, "يحتاج", "بدهن"), "rise"); ev(AT(10, "ننتهي", "لانتهينا", "بتخلص"), "rise"); ev(AT(11, "Big", "أو إن", "O(n²).") - 0.1, "pop"); ev(AT(12, "حق") - 0.2, "found", 9);
  ev(SCN.teaser.t0 + 0.05, "pop"); ev(AT(13, "Reel", "الريل", "بالريل") - 0.12, "swish"); ev(AT(13, "Reel", "الريل", "بالريل") + 0.1, "found", 9); ev(AT(13, "Reel", "الريل", "بالريل") + 0.35, "pop");
  TL.scenes.slice(1).forEach((s) => ev(s.t0, "swish", 9));
  return { total: TL.total, scenes: TL.scenes, events: e.sort((a, b) => a.t - b.t) };
};
