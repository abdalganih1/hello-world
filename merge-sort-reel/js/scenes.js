// Merge Sort reel (4th). Lines: 0 hook (Obama: Bubble Sort is the wrong way) · 1 so what do we use? · 2 answer: Merge Sort, split then merge
// 3 setup (8 numbers) · 4 split down to singles · 5 merge (compare the two heads, take the smaller) · 6 keep merging · 7 name
// 8-11 speed (half a trillion vs 20 million · 16,000 years vs < 8 months · n log n) · 12 teaser + follow card
"use strict";
const START = [5, 2, 7, 1, 8, 3, 6, 4], N = 8, TS = 92, SP = 104, LY = [650, 830, 1010, 1190];
// ---- layouts: x/y of every value for each stage of the algorithm
const GAPS = [0, 40, 24, 14];
function slotX(level, i) { const gs = N >> level, g = Math.floor(i / gs), ng = 1 << level; let extra = 0; for (let k = 1; k <= level; k++) { const gk = Math.floor(i / (N >> k)), nk = 1 << k; extra += (gk - (nk - 1) / 2) * GAPS[k]; } return 540 + (i - 3.5) * SP + extra; }
function layout(level, groups) { const pos = {}; let i = 0; for (const grp of groups) for (const v of grp) { pos[v] = [slotX(level, i), LY[level]]; i++; } return pos; }
const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };
const sorted = (g) => g.slice().sort((x, y) => x - y);
const LAY = {
  s0: layout(0, [START]), s1: layout(1, chunk(START, 4)), s2: layout(2, chunk(START, 2)), s3: layout(3, chunk(START, 1)),
  m2: layout(2, chunk(START, 2).map(sorted)), m1: layout(1, chunk(START, 4).map(sorted)), m0: layout(0, [sorted(START)]),
};
// merge order: when each value leaves its old group (the smaller head first)
function mergeDelays(groupSize, stagger) { const d = {}; for (const big of chunk(START, groupSize * 2)) { const a = sorted(big.slice(0, groupSize)), b = sorted(big.slice(groupSize)); let i = 0, j = 0, k = 0;
  while (i < a.length || j < b.length) { const take = j >= b.length || (i < a.length && a[i] < b[j]) ? a[i++] : b[j++]; d[take] = k++ * stagger; } } return d; }
let PLAN = null;
// the slow, explained merge: [2,5] + [1,7] (the left half), one comparison at a time, on «نقارن» / «ونأخذ»
const SLOW = [{ a: 2, b: 1, v: 1 }, { a: 2, b: 7, v: 2 }, { a: 5, b: 7, v: 5 }, { a: 7, b: null, v: 7 }];
function plan() {
  const sA = AT(4, "نقسمها") + 0.25, sB = AT(4, "ثم كل"), sC = AT(4, "حتى"), pr = AT(5, "كل") + 0.15;
  const c1 = AT(6, "نقارن"), k1 = AT(6, "ونأخذ", "نأخذ"), slow = [[c1, k1], [k1 + 0.75, k1 + 1.2], [k1 + 1.6, k1 + 2.05], [k1 + 2.45, k1 + 2.75]];
  const r0 = L0(7) + 0.1, m0 = r0 + 1.25, end = m0 + 8 * 0.16 + 0.5;
  const del2 = {}; SLOW.forEach((s, i) => (del2[s.v] = slow[i][1] - k1)); [3, 4, 6, 8].forEach((v, i) => (del2[v] = r0 + i * 0.22 - k1));
  return { sA, sB, sC, pr, c1, k1, slow, r0, m0, end, steps: [
    { t0: sA, from: "s0", to: "s1", dur: 0.55 }, { t0: sB, from: "s1", to: "s2", dur: 0.5 }, { t0: sC, from: "s2", to: "s3", dur: 0.5 },
    { t0: pr, from: "s3", to: "m2", dur: 0.5, del: mergeDelays(1, 0.1), arc: 1 },
    { t0: k1, from: "m2", to: "m1", dur: 0.4, del: del2, arc: 1 },
    { t0: m0, from: "m1", to: "m0", dur: 0.34, del: mergeDelays(4, 0.16), arc: 1 }] };
}
function posAt(v, t) {
  let p = LAY.s0[v], lift = 0, moving = false;
  for (const s of PLAN.steps) { if (t < s.t0) break; const d = s.del ? s.del[v] : 0, u = P(t, s.t0 + d, s.dur); const A0 = LAY[s.from][v], B0 = LAY[s.to][v], e = eio(u);
    p = [lerp(A0[0], B0[0], e), lerp(A0[1], B0[1], e)]; if (u > 0 && u < 1) { moving = true; if (s.arc) lift = Math.sin(u * Math.PI) * 60; } }
  return { x: p[0], y: p[1] - lift, moving };
}
function stageAt(t) { let k = -1; PLAN.steps.forEach((s, i) => { if (t >= s.t0) k = i; }); return k; }
function tile(v, x, y, o = {}) {
  const { a = 1, state = "", s = 1 } = o, fill = state === "done" ? C.teal : state === "merged" ? C.tealSoft : state === "head" ? C.navy : state === "take" ? C.gold : "#ffffff";
  const ink = state === "done" || state === "head" || state === "take" ? "#ffffff" : C.navy, edge = state === "merged" ? hexA(C.teal, 0.7) : state ? fill : C.line;
  withT(x, y, s, s, 0, () => { fillRR(-TS / 2, -TS / 2, TS, TS, 22, fill, a, 14); strokeRR(-TS / 2, -TS / 2, TS, TS, 22, edge, 3, a); T(String(v), 0, 4, { size: 52, fam: "mono", color: ink, a }); });
}
// faint frames around the groups of the current stage
function frames(level, a) { if (a <= 0) return; const gs = N >> level; for (let g = 0; g < (1 << level); g++) { const x0 = slotX(level, g * gs) - TS / 2 - 12, x1 = slotX(level, g * gs + gs - 1) + TS / 2 + 12;
  strokeRR(x0, LY[level] - TS / 2 - 12, x1 - x0, TS + 24, 30, hexA(C.teal, 0.35), 3, a); } }
SCENES.tiles = (t) => {
  if (!PLAN) PLAN = plan(); const s0 = SCN.setup.t0, s1 = SCN.name.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const out = 1 - P(t, s1 - 0.05, 0.3), k = stageAt(t);
  // group frames only around the row the numbers sit on now
  const LV = [0, 1, 2, 3, 2, 1, 0]; for (let j = 0; j < 7; j++) { const tin = j === 0 ? s0 + 0.5 : PLAN.steps[j - 1].t0 + 0.2, tout = j < 6 ? PLAN.steps[j].t0 : 1e9;
    const al = P(t, tin, 0.35) * (1 - P(t, tout - 0.05, 0.2)) * (j === 6 ? 1 - P(t, PLAN.end + 0.4, 0.4) : 1); frames(LV[j], out * al); }
  // while the left half is merged slowly: its target frame on the row above is already drawn, the right half waits dimmed
  const slowOn = t >= PLAN.c1 - 0.15 && t < PLAN.r0, foc = win(t, PLAN.c1 - 0.15, PLAN.r0 + 0.2, 0.25);
  if (slowOn || foc > 0) { const x0 = slotX(1, 0) - TS / 2 - 12, x1 = slotX(1, 3) + TS / 2 + 12; strokeRR(x0, LY[1] - TS / 2 - 12, x1 - x0, TS + 24, 30, hexA(C.teal, 0.55), 3, out * foc); }
  const done = t >= PLAN.end - 0.15, doneT = PLAN.end - 0.15;
  let cur = null; PLAN.slow.forEach((w, i) => { if (t >= w[0] - 0.05 && t < w[1] + 0.55) cur = { ...SLOW[i], cmp: w[0], take: w[1] }; });
  for (let v = 1; v <= N; v++) {
    const enter = eo(P(t, s0 + 0.2 + START.indexOf(v) * 0.05, 0.45)), q = posAt(v, t); let state = "", a = 1;
    if (k === 2 && t > PLAN.sC + 0.5) state = "merged";                 // a single number is already sorted
    if (k >= 3) state = "merged";
    if (cur && (v === cur.a || v === cur.b)) state = t >= cur.take && v === cur.v ? "take" : "head";
    if ([3, 4, 6, 8].includes(v)) a = 1 - 0.6 * foc;
    if (done) state = "done";
    const bob = done ? Math.max(0, Math.sin((t - doneT) * 7 - START.indexOf(v) * 0.6)) * 22 * (1 - P(t, doneT + 1.4, 0.4)) : 0;
    const sgl = k === 2 && t > PLAN.sC + 0.5 ? 1 + 0.12 * imp(t, PLAN.sC + 0.5 + v * 0.03, 0.4) : 1;
    tile(v, q.x, q.y - bob + (1 - enter) * -500, { a: out * enter * a, state, s: sgl });
  }
  if (k === 2 && t > PLAN.sC + 0.5) for (let v = 1; v <= N; v++) { const q = posAt(v, t), r = imp(t, PLAN.sC + 0.5 + v * 0.03, 0.6); ring(q.x, q.y, 50 + 40 * (1 - r), hexA(C.teal, 0.8), 5 * r, out * r); }
  // pointers on the two heads + the comparison chip
  if (cur) { const kk = pop(t, cur.cmp, 0.3), fa = out * clamp(kk * 2) * (1 - P(t, cur.take + 0.4, 0.15));
    [cur.a, cur.b].forEach((v) => { if (v == null) return; const q = posAt(v, t); poly([[q.x - 16, q.y - 84], [q.x + 16, q.y - 84], [q.x, q.y - 62]], C.gold, 0, fa, true, C.gold); });
    const xm = (slotX(2, 0) + slotX(2, 3)) / 2, txt = cur.b == null ? `${cur.a} ✓` : `${Math.min(cur.a, cur.b)} < ${Math.max(cur.a, cur.b)}`;
    withT(xm, LY[2] + 96, kk, kk, 0, () => { fillRR(-110, -36, 220, 72, 36, "#fff4dc", fa, 10); T(txt, 0, 3, { size: 38, fam: "mono", color: "#b9781a", a: fa }); }); }
  if (done) sparkle(540, LY[0], doneT, { n: 40, r: 440 });
  if (t > L0(8) - 0.1) { const kk = pop(t, AT(8, "Merge") - 0.05, 0.45); withT(540, 800, kk, kk, 0, () => { fillRR(-250, -54, 500, 108, 54, C.navy, out * clamp(kk * 2), 20); T("Merge Sort", 0, 4, { size: 58, color: "#fff", fam: "mono", a: out * clamp(kk * 2) }); }); }
};
// ---- host on the left (poses drawn facing right): walks in, watches, jumps when it is sorted, thumbs-up on the name
const HOSTX = 220, HOSTY = 1730, HOSTH = 450;
function hostPose(t) { const d = PLAN ? PLAN.end - 0.15 : 1e9; const seq = [[SCN.setup.t0 + 0.1, "walking"], [SCN.setup.t0 + 1.9, "front"], [d - 0.05, "celebrating"], [d + 1.3, "front"], [L0(8) + 0.3, "hero"]]; let c = seq[0]; for (const q of seq) if (t >= q[0]) c = q; return c; }
SCENES.khwarizmo = (t) => {
  const t0 = SCN.setup.t0 + 0.1, t1 = SCN.name.t1 - 0.1; if (t < t0 || t > t1 + 0.45 || !PLAN) return;
  const [since, pose] = hostPose(t), sw = P(t, since, 0.3); let sx = 1, sy = 1; if (pose !== "walking" && sw < 1) { const b = back(sw, 2.0); sx = lerp(1.08, 1, b); sy = lerp(0.9, 1, b); }
  const d = PLAN.end - 0.15, ju = P(t, d - 0.05, 0.62), exit = eio(P(t, t1, 0.4)), wk = P(t, t0, 1.7), x = lerp(-260, HOSTX, eo(wk)); let y = HOSTY + exit * 900;
  if (pose === "walking" && wk < 1) { const st = Math.abs(Math.sin(wk * Math.PI * 4)); y -= st * 18 * (1 - wk); sy *= 1 - 0.025 * (1 - st); }
  if (ju > 0 && ju < 1) { y -= Math.sin(ju * Math.PI) * 80; sy *= 1 + 0.05 * Math.sin(ju * Math.PI); }
  KR(pose, x, y, pose === "celebrating" || pose === "walking" ? HOSTH * 0.97 : HOSTH, { sx, sy, rot: 0, shadow: ju > 0 && ju < 1 ? 1 - 0.6 * Math.sin(ju * Math.PI) : 1 });
};

// ---- hook + ask + answer: the 2007 Google talk (no likeness: a stage, a mic, the audience) -> "?" -> Merge Sort
function stage(t, a) {
  if (a <= 0) return;
  A(a * 0.5); ctx.beginPath(); ctx.moveTo(470, 380); ctx.lineTo(610, 380); ctx.lineTo(860, 1250); ctx.lineTo(220, 1250); ctx.closePath(); const g = ctx.createLinearGradient(0, 380, 0, 1250); g.addColorStop(0, "rgba(31,181,181,0.22)"); g.addColorStop(1, "rgba(31,181,181,0)"); ctx.fillStyle = g; ctx.fill();
  fillRR(140, 1230, 800, 26, 13, "rgba(29,53,87,0.12)", a);
  fillRR(532, 1060, 16, 170, 8, C.navy, a); fillRR(470, 1222, 140, 18, 9, C.navy, a);
  withT(540, 1000, 1, 1, -0.25, () => { fillRR(-34, -70, 68, 110, 34, C.navy, a, 14); for (let i = 0; i < 4; i++) seg(-22, -48 + i * 18, 22, -48 + i * 18, "rgba(255,255,255,0.35)", 3, a); });
  withT(540, 560, 1, 1, 0, () => { fillRR(-170, -40, 340, 80, 40, "#ffffff", a, 16); strokeRR(-170, -40, 340, 80, 40, C.line, 3, a); T("Google · 2007", 0, 3, { size: 38, color: C.navy, fam: "mono", a }); });
  for (let i = 0; i < 9; i++) { const x = 150 + i * 97, y = 1420 - Math.abs(Math.sin(t * 2.6 + i * 1.7)) * 6; circle(x, y - 46, 26, "rgba(29,53,87,0.75)", a); fillRR(x - 40, y - 18, 80, 90, 34, "rgba(29,53,87,0.75)", a); }
}
SCENES.hook = (t) => {
  const e = SCN.answer.t1; if (t > e + 0.3) return; const sa = 1 - P(t, AT(2, "Merge", "الجواب") - 0.3, 0.4); stage(t, sa);
  // the crossed-out answer bubble (from frame 0) -> flips to "?" on «فماذا» -> flips to the Merge Sort card on «Merge»
  const f1 = P(t, L0(1) - 0.1, 0.3), f2 = P(t, AT(2, "Merge") - 0.15, 0.3), ex = 1 - P(t, e - 0.05, 0.3);
  const sx1 = Math.abs(Math.cos(f1 * Math.PI)), sx2 = Math.abs(Math.cos(f2 * Math.PI)); const hd = imp(t, 0.02, 0.5);
  if (f1 < 0.5) { const k = 1 + 0.08 * hd; withT(540, 750 + Math.sin(t * 2.2) * 6, Math.max(0.02, sx1) * k, k, Math.sin(t * 1.7) * 0.02, () => { fillRR(-300, -66, 600, 132, 40, "#ffffff", 1, 24); strokeRR(-300, -66, 600, 132, 40, C.red, 4, 1); poly([[-30, 66], [0, 110], [30, 66]], null, 0, 1, true, "#ffffff");
      T("Bubble Sort", 40, 4, { size: 62, fam: "mono", color: C.navy }); seg(-150, 4, 230, 4, C.red, 8, 1); circle(-230, 0, 38, C.red, 1); seg(-246, -16, -214, 16, "#fff", 7, 1); seg(-214, -16, -246, 16, "#fff", 7, 1); }); }
  else if (f2 < 0.5) { const q = Math.max(0.02, f1 < 1 ? sx1 : sx2), wob = Math.sin(t * 9) * 0.06 * win(t, L0(1) + 0.3, AT(2, "Merge") - 0.2, 0.15);
    for (let kk = 0; kk < 2; kk++) { const u = ((t - L0(1)) * 1.3 + kk / 2) % 1; ring(540, 750, 120 + u * 110, hexA(C.teal, 0.5), 6 * (1 - u), (1 - u) * sa); }
    withT(540, 750, q, 1, wob, () => { circle(0, 0, 120, C.navy, 1, 30); T("؟", 0, 12, { size: 170, color: "#fff" }); }); }
  else { const k = lerp(0.8, 1, back(P(t, AT(2, "Merge") - 0.1, 0.45), 1.5)), y = lerp(750, 770, eio(P(t, AT(2, "قسم") - 0.3, 0.4)));
    withT(540, y, Math.max(0.02, sx2) * k * ex, k * ex, 0, () => { fillRR(-300, -90, 600, 180, 46, C.navy, 1, 36); T("Merge Sort", 0, 6, { size: 82, color: "#ffffff", fam: "mono" }); });
    const r = imp(t, AT(2, "Merge") + 0.05, 0.7); ring(540, 750, 160 + 260 * (1 - r), hexA(C.teal, 0.6), 10 * r + 1, r); sparkle(540, 750, AT(2, "Merge") + 0.05, { n: 34, r: 420 });
    // the two words: split ✂️ / merge 🔗
    [["قسم", "✂️ قسّم", 360], ["ادمج", "🔗 ادمج", 720]].forEach(([w, lab, x]) => { const p = pop(t, AT(2, w) - 0.05, 0.45); withT(x, 1010, p * ex, p * ex, 0, () => { fillRR(-140, -54, 280, 108, 54, "#ffffff", clamp(p * 2), 16); strokeRR(-140, -54, 280, 108, 54, hexA(C.teal, 0.6), 4, clamp(p * 2)); T(lab, 0, 4, { size: 48, color: C.navy, a: clamp(p * 2) }); }); });
    const ar = eio(P(t, AT(2, "ادمج") - 0.25, 0.35)); if (ar > 0) arrow(470, 1010, lerp(470, 600, ar), 1010, C.teal, 6, ex * ar, 18); }
};

// ---- speed: why it is fast — 20 levels × a million comparisons = 20 million (vs half a trillion) · n log n
SCENES.speed = (t) => {
  const s0 = SCN.speed.t0, s1 = SCN.speed.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  const RX = 170, RW = 700, RY = 620, RH = 18, RG = 9, lit = AT(10, "وكل", "مستوى") - 0.1;
  const rA = 1 - P(t, AT(10, "أي") - 0.15, 0.3);
  if (rA > 0) { // the 20 levels: a million split in two, again and again, down to single numbers
    for (let i = 0; i < 20; i++) { const ti = s0 + 0.3 + i * Math.max(0.08, (L1(9) - s0 - 0.6) / 20), e = eo(P(t, ti, 0.25)); if (e <= 0) continue;
      const nseg = Math.min(1 << i, 64), y = RY + i * (RH + RG), gap = nseg > 1 ? Math.max(2, 10 - i) : 0, w = (RW - gap * (nseg - 1)) / nseg, on = t >= lit + i * 0.06;
      for (let s = 0; s < nseg; s++) fillRR(RX + s * (w + gap), y, Math.max(2, w), RH, Math.min(9, w / 2), on ? C.teal : C.navy, a * rA * e * (on ? 1 : 0.85)); }
    T("1,000,000", RX + RW / 2, RY - 40, { size: 36, fam: "mono", color: C.navy, a: a * rA });
    T("1  1  1  1 …", RX + RW / 2, RY + 20 * (RH + RG) + 26, { size: 32, fam: "mono", color: C.mut, a: a * rA * P(t, L1(9) - 0.6, 0.3) });
    const bk = pop(t, AT(9, "عشرين") - 0.05, 0.45); seg(RX + RW + 34, RY, RX + RW + 34, RY + 20 * (RH + RG) - RG, C.teal, 6, a * rA * clamp(bk * 2));
    withT(RX + RW + 34, RY + 10 * (RH + RG), bk, bk, 0, () => { circle(0, 0, 50, "#ffffff", a * rA * clamp(bk * 2), 14); T("20", 0, 4, { size: 50, fam: "mono", color: C.teal, a: a * rA * clamp(bk * 2) }); });
    const mx = pop(t, lit + 0.2, 0.4); withT(RX - 60, RY + 10 * (RH + RG), mx, mx, 0, () => T("× 1M", 0, 0, { size: 34, fam: "mono", color: C.teal, a: a * rA * clamp(mx * 2) })); }
  const rB = P(t, AT(10, "أي") - 0.1, 0.3) * (1 - P(t, L0(11) - 0.15, 0.3));
  if (rB > 0) { const BXL = 150, BW = 780, u2 = eio(P(t, AT(10, "أي"), 0.6)), n2 = Math.round(lerp(0, 2e7, u2));
    T("20 × 1,000,000", 540, 640, { size: 64, fam: "mono", color: C.navy, a: a * rB }); T(`= ${n2.toLocaleString("en-US")}`, 540, 740, { size: 80, fam: "mono", color: C.teal, a: a * rB });
    const e1 = eo(P(t, AT(10, "فقط") - 0.2, 0.4));
    T("⚡ Merge Sort", 930, 900, { size: 42, fam: "mono", color: C.navy, a: a * rB, align: "right" }); fillRR(BXL, 935, BW, 40, 20, C.line, a * rB); fillRR(BXL + BW - 40, 935, 40, 40, 20, C.teal, a * rB);
    T("🐢 Bubble Sort", 930, 1050, { size: 42, fam: "mono", color: C.navy, a: a * rB * e1, align: "right" }); fillRR(BXL, 1085, BW, 40, 20, C.line, a * rB * e1); fillRR(BXL + BW * (1 - e1), 1085, BW * e1, 40, 20, C.red, a * rB * e1);
    T("500,000,000,000", 540, 1170, { size: 52, fam: "mono", color: C.red, a: a * rB * e1 });
    const bd = pop(t, AT(10, "فقط") + 0.35, 0.45); withT(540, 1280, bd, bd, -0.04, () => { fillRR(-210, -44, 420, 88, 44, C.tealSoft, a * rB * clamp(bd * 2), 10); T("أقل بـ 25,000 مرة", 0, 3, { size: 42, color: C.teal, a: a * rB * clamp(bd * 2) }); }); }
  const r4 = P(t, L0(11) - 0.05, 0.3);
  if (r4 > 0) { const k = pop(t, AT(11, "Big") - 0.1, 0.45); withT(540, 690, k, k, 0, () => T("O(n log n)", 0, 0, { size: 118, color: C.navy, fam: "mono", a: a * r4 * clamp(k * 2) }));
    const gx = 200, gy = 1300, gw = 680, gh = 420, u = eio(P(t, L0(11) + 0.2, 1.0)); seg(gx, gy, gx + gw + 20, gy, C.mut, 4, a * r4); seg(gx, gy, gx, gy - gh - 20, C.mut, 4, a * r4);
    const p1 = [], p2 = []; for (let i = 0; i <= 60 * u; i++) { const xx = i / 60; p1.push([gx + gw * xx, gy - gh * xx * xx]); p2.push([gx + gw * xx, gy - gh * 0.3 * xx * Math.log2(1 + 7 * xx) / 3]); }
    if (p1.length > 1) { poly(p1, hexA(C.red, 0.55), 6, a * r4); poly(p2, C.teal, 10, a * r4);
      T("Bubble Sort", p1[p1.length - 1][0] - 10, p1[p1.length - 1][1] - 28, { size: 28, fam: "mono", color: C.red, a: a * r4, align: "right" });
      T("Merge Sort", p2[p2.length - 1][0] - 10, p2[p2.length - 1][1] - 30, { size: 30, fam: "mono", color: C.teal, a: a * r4, align: "right" }); }
    T("عدد العناصر", gx + gw / 2, gy + 46, { size: 32, color: C.mut, a: a * r4 }); T("الخطوات", gx - 20, gy - gh - 40, { size: 32, color: C.mut, a: a * r4, align: "left" }); }
};

// ---- teaser: "?" -> locked, blurred "Quick Sort" -> follow card
SCENES.teaser = (t) => {
  const XO = 1 - eio(P(t, -0.2 + AT(12, "تابع") - 0.25, 0.35));
  const s0 = SCN.teaser.t0; if (t < s0 - 0.1) return; const e = eo(P(t, s0, 0.5)); KR("wink", 540, 1720 + (1 - e) * 600, 700, { bob: 0.6 });
  const rv = AT(12, "Reel"), f = P(t, rv - 0.12, 0.3), sx = Math.abs(Math.cos(f * Math.PI)), flipped = f > 0.5;
  if (!flipped) { const q = pop(t, s0 + 0.05, 0.45), wob = Math.sin(t * 9) * 0.06 * win(t, s0 + 0.4, rv, 0.15);
    for (let k = 0; k < 2; k++) { const u = ((t - s0) * 1.3 + k / 2) % 1; ring(540, 680, 130 + u * 110, hexA(C.teal, 0.5), 6 * (1 - u), (1 - u) * clamp(q)); }
    withT(540, 680, q * Math.max(0.02, sx), q, wob, () => { circle(0, 0, 130, C.navy, clamp(q * 2), 30); T("⚡", 0, 8, { size: 150, a: clamp(q * 2) }); }); }
  else { const k = back(P(t, rv + 0.03, 0.4), 1.4), w = lerp(260, 640, eo(P(t, rv + 0.03, 0.35)));
    withT(540, 680 - 140 * (1 - XO), Math.max(0.02, sx) * k * XO, k * XO, 0, () => { fillRR(-w / 2, -95, w, 190, 40, C.navy, 1, 36);
      ctx.save(); rr(-w / 2, -95, w, 190, 40); ctx.clip(); ctx.filter = "blur(11px)"; T("Quick Sort", 0, 6, { size: 86, color: "#ffffff", fam: "mono" }); ctx.filter = "none";
      const sh = ((t - rv) * 0.7) % 1.4; if (sh < 1) { A(0.35); const gx = lerp(-w / 2 - 120, w / 2 + 120, sh); const g = ctx.createLinearGradient(gx - 90, 0, gx + 90, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(120,240,230,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(gx - 90, -95, 180, 190); }
      ctx.restore(); T("🔒", w / 2 - 50, -60, { size: 40 }); });
    const r = imp(t, rv + 0.1, 0.7); ring(540, 680, 160 + 260 * (1 - r), hexA(C.teal, 0.6), 10 * r + 1, r); sparkle(540, 680, rv + 0.1, { n: 34, r: 420 });
    const p = pop(t, rv + 0.35, 0.5); withT(540, 880 - 160 * (1 - XO), p * XO, p * XO, 0, () => T("في الريل القادم 👀", 0, 0, { size: 84, color: C.teal, a: clamp(p * 2) * XO })); }
  followOutro(t, 12);
};
SCENES.order = ["hook", "tiles", "speed", "teaser", "khwarizmo"];

window.collectSfx = () => {
  PLAN = PLAN || plan(); const e = [], ev = (t, k, v = 0) => e.push({ t: +t.toFixed(3), k, v });
  ev(0.02, "hit"); ev(0.05, "no"); ev(L0(1) - 0.1, "flip"); ev(AT(2, "Merge") - 0.15, "flip", 1); ev(AT(2, "Merge") + 0.05, "found", 9); ev(AT(2, "قسم") - 0.05, "pop"); ev(AT(2, "ادمج") - 0.05, "pop", 1);
  for (let i = 0; i < N; i++) ev(SCN.setup.t0 + 0.2 + i * 0.05, "card", i);
  PLAN.steps.forEach((s, i) => { if (i < 3) ev(s.t0, "swish", i); else if (i !== 4) Object.values(s.del).forEach((d, j) => ev(s.t0 + d + s.dur * 0.5, "tick", j % 7)); });
  PLAN.slow.forEach(([c, k], i) => { ev(c, "pop", i); ev(k + 0.2, "tick", i + 2); }); [3, 4, 6, 8].forEach((v, i) => ev(PLAN.r0 + i * 0.22 + 0.2, "tick", i));
  ev(PLAN.sC + 0.5, "pop", 2); ev(PLAN.end - 0.15, "found", 4);
  ev(AT(8, "Merge") - 0.05, "pop"); ev(AT(9, "عشرين") - 0.05, "pop", 1); ev(AT(10, "وكل", "مستوى") - 0.1, "rise"); ev(AT(10, "أي"), "swish", 3); ev(AT(10, "فقط") + 0.35, "found", 9); ev(AT(11, "Big") - 0.1, "pop");
  ev(SCN.teaser.t0 + 0.05, "pop"); ev(AT(12, "Reel") - 0.12, "swish"); ev(AT(12, "Reel") + 0.1, "found", 9); ev(AT(12, "Reel") + 0.35, "pop"); { const tf = AT(12, "تابع") - 0.2, tt = Math.max(tf + 0.85, AT(12, "إنجاز") + 0.05); ev(tf, "card"); ev(tt - 0.04, "pop", 2); ev(tt + 0.04, "found", 9); ev(tt + 0.2, "rise", 3); }
  TL.scenes.slice(1).forEach((s) => ev(s.t0, "swish", 9));
  return { total: TL.total, scenes: TL.scenes, events: e.sort((a, b) => a.t - b.t) };
};
// ---------- outro: «تابع تكنو إنجاز» as an Instagram-style profile card that gets followed on the beat
// card springs in on «تابع», a finger taps the button on «إنجاز», the button morphs to «تمت المتابعة ✓», hearts rise.
function followOutro(t, L) {
  const tf = AT(L, "تابع") - 0.2, tt = Math.max(tf + 0.85, AT(L, "إنجاز") + 0.05); if (t < tf) return;
  const CX = 540, CY0 = 520, CW = 760, CH = 480, AY = 625, AR = 84, BY = 912, BW = 470, BH = 100;
  const ci = back(P(t, tf, 0.6), 1.5), ca = clamp(P(t, tf, 0.25) * 1.6);
  ctx.save(); ctx.translate(CX, CY0 + CH / 2 + (1 - ci) * 90); ctx.scale(lerp(0.72, 1, ci), lerp(0.72, 1, ci)); ctx.translate(-CX, -(CY0 + CH / 2));
  // the card: white glass, soft shadow, thin teal top line
  fillRR(CX - CW / 2, CY0, CW, CH, 52, "#ffffff", ca * 0.97, 44); strokeRR(CX - CW / 2, CY0, CW, CH, 52, hexA(C.teal, 0.25), 3, ca);
  // avatar: خوارزمو close-up in a circle, wrapped in a spinning teal->navy gradient ring (glows on the follow)
  const ai = pop(t, tf + 0.12, 0.5), fl = imp(t, tt + 0.02, 0.9);
  if (ai > 0) { ctx.save(); ctx.translate(CX, AY); ctx.scale(ai, ai);
    const g = ctx.createConicGradient(t * 2.4, 0, 0); g.addColorStop(0, C.teal); g.addColorStop(0.35, "#7fe8e1"); g.addColorStop(0.65, C.navy); g.addColorStop(1, C.teal);
    A(clamp(ai * 2)); ctx.beginPath(); ctx.arc(0, 0, AR + 14, 0, 6.2832); ctx.strokeStyle = g; ctx.lineWidth = 10 + 6 * fl; ctx.shadowColor = C.teal; ctx.shadowBlur = 30 * fl; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(0, 0, AR + 5, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, AR, 0, 6.2832); ctx.clip(); const im = IMG.closeup;
    if (im) { const s = (AR * 2.9) / 721; ctx.drawImage(im, -335 * s, -405 * s, 721 * s, 778 * s); } ctx.restore(); ctx.restore(); }
  // name revealed right-to-left, then the verified badge pops
  const nr = eio(P(t, tf + 0.3, 0.45)); if (nr > 0) { ctx.save(); A(1); ctx.font = font(66, 900); const nw = ctx.measureText("تكنو إنجاز").width;
    ctx.beginPath(); ctx.rect(CX + 22 + nw / 2 + 24 - (nw + 48) * nr, AY + 70, (nw + 48) * nr, 140); ctx.clip(); T("تكنو إنجاز", CX + 22, AY + 142, { size: 66, color: C.navy }); ctx.restore();
    const bp = pop(t, tf + 0.62, 0.45); withT(CX + 22 - nw / 2 - 34, AY + 140, bp, bp, 0, () => { circle(0, 0, 21, C.teal, clamp(bp * 2)); T("✓", 0, 1, { size: 26, color: "#fff", a: clamp(bp * 2) }); }); }
  T("@techno_enjaz", CX, AY + 206, { size: 34, weight: 700, color: C.mut, fam: "mono", a: ca * clamp(P(t, tf + 0.5, 0.3)) });
  // the button: teal pill «تابع +» with a shimmer -> pressed -> white pill «تمت المتابعة ✓»
  const bi = pop(t, tf + 0.55, 0.5), m = eio(P(t, tt, 0.28)), pr = 1 - 0.09 * Math.sin(Math.PI * P(t, tt - 0.07, 0.3)) + 0.05 * imp(t, tt + 0.2, 0.4);
  if (bi > 0) withT(CX, BY, bi * pr, bi * pr, 0, () => {
    const a0 = clamp(bi * 2); fillRR(-BW / 2, -BH / 2, BW, BH, BH / 2, C.teal, a0 * (1 - m), 24);
    if (m < 1) { ctx.save(); rr(-BW / 2, -BH / 2, BW, BH, BH / 2); ctx.clip(); const sh = ((t - tf) * 0.9) % 1.3; if (sh < 1) { A(0.45 * (1 - m)); const gx = lerp(-BW / 2 - 100, BW / 2 + 100, sh), gr = ctx.createLinearGradient(gx - 70, 0, gx + 70, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.95)"); gr.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gr; ctx.fillRect(gx - 70, -BH / 2, 140, BH); } ctx.restore(); }
    if (m > 0) { fillRR(-BW / 2, -BH / 2, BW, BH, BH / 2, "#ffffff", a0 * m); strokeRR(-BW / 2, -BH / 2, BW, BH, BH / 2, C.teal, 4, a0 * m); }
    const rp = P(t, tt, 0.55); if (rp > 0 && rp < 1) { ctx.save(); rr(-BW / 2, -BH / 2, BW, BH, BH / 2); ctx.clip(); circle(-40, 8, 40 + rp * 320, hexA(C.teal, 0.35), 1 - rp); ctx.restore(); }
    T("تابع +", 0, 3, { size: 50, color: "#fff", a: a0 * (1 - m) }); T("تمت المتابعة ✓", 0, 3, { size: 46, color: C.teal, a: a0 * m }); });
  ctx.restore();
  // the finger: a soft touch dot glides in and presses the button on «إنجاز»
  const fi = eio(P(t, tt - 0.55, 0.47)), fo = 1 - P(t, tt + 0.12, 0.3);
  if (fi > 0 && fo > 0) { const fx = lerp(800, CX - 40, fi), fy = lerp(1130, BY + 8, fi), ps = 1 - 0.25 * Math.sin(Math.PI * P(t, tt - 0.07, 0.25));
    circle(fx, fy, 40 * ps, hexA(C.navy, 0.32), fi * fo, 16); ring(fx, fy, 40 * ps, "#ffffff", 7, fi * fo); circle(fx, fy, 12 * ps, "#ffffff", 0.9 * fi * fo); }
  // the payoff: burst, ring, rising hearts
  if (t >= tt) { sparkle(CX, BY, tt, { n: 40, r: 470 }); const r = imp(t, tt, 0.7); ring(CX, BY, 60 + 380 * (1 - r), hexA(C.teal, 0.55), 8 * r + 1, r);
    for (let i = 0; i < 10; i++) { const d0 = tt + i * 0.05, u = (t - d0) / 1.4; if (u <= 0 || u >= 1) continue; const sd = i % 2 ? 1 : -1, x = CX + sd * (BW / 2 - 30 + eo(u) * (110 + 70 * rnd(i * 7 + 2))) + Math.sin(u * 6 + i) * 18, y = BY - 380 * eo(u) * (0.6 + 0.4 * rnd(i * 3 + 1));
      withT(x, y, 0.6 + 0.6 * pop(t, d0, 0.3), 0.6 + 0.6 * pop(t, d0, 0.3), Math.sin(u * 5 + i) * 0.25, () => T(i % 3 === 1 ? "🤍" : "💙", 0, 0, { size: 46, a: 1 - u * u })); } }
}
