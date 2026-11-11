// Binary Search reel. One idea per scene, keyed to the narration: L0(i)/L1(i) = start/end of spoken line i, AT(i, word) = when that word is said.
// Lines: 0 hook (8 billion -> you, 33 questions) · 1 secret (we don't search, we split) · 2 setup · 3-6 demo · 7 name · 8-9 rule
//        10-12 speed · 13 world (payoff of the hook) · 14-15 teaser (sorting, next reel)
"use strict";
const N = 11, VALS = [4, 9, 15, 22, 30, 37, 45, 51, 63, 78, 92], TARGET = 51;
const CW = 86, CH = 150, ROWY = 900, cx = (i) => 80 + 92 * i;
// the search: [lo, hi, mid, verdict] per step; verdict: -1 too small (drop left), 1 too big (drop right), 0 found
const STEPS = [[0, 10, 5, -1], [6, 10, 8, 1], [6, 7, 6, -1], [7, 7, 7, 0]];
const stepT = (k) => L0(3 + k), dropT = (k) => (k === 0 ? AT(3, "فمنرمي") : k === 1 ? AT(4, "فمنرمي") : AT(5, "أصغر") + 0.25), verdT = (k) => (k === 0 ? AT(3, "أصغر") : k === 1 ? AT(4, "أكبر") : k === 2 ? AT(5, "أصغر") : AT(6, "لقيناه"));

function card(x, y, s, o = {}) {
  const { val = "", state = "", a = 1, rot = 0 } = o; if (a <= 0 || s <= 0) return;
  withT(x, y, s, s, rot, () => {
    const bg = state === "found" ? C.teal : state === "mid" ? C.navy : state === "out" ? C.redSoft : "#ffffff";
    fillRR(-CW / 2, -CH / 2, CW, CH, 18, bg, a, state === "found" || state === "mid" ? 30 : 14);
    strokeRR(-CW / 2, -CH / 2, CW, CH, 18, state === "found" ? C.teal : state === "mid" ? C.navy : state === "out" ? hexA(C.red, 0.5) : C.line, 3, a);
    T(String(val), 0, 5, { size: 58, color: state === "found" || state === "mid" ? "#ffffff" : state === "out" ? hexA(C.red, 0.7) : C.navy, a, fam: "mono" });
  });
}
function badge(x, y, kind, k, a = 1) { if (k <= 0 || a <= 0) return; withT(x, y, k, k, 0, () => { circle(0, 0, 24, kind === "yes" ? C.navy : C.red, a, 8);
  if (kind === "yes") poly([[-10, 0], [-3, 8], [11, -8]], "#fff", 6, a); else { seg(-8, -8, 8, 8, "#fff", 6, a); seg(8, -8, -8, 8, "#fff", 6, a); } }); }
function pointer(x, y, a) { if (a <= 0) return; const b = Math.sin(NOW * 7) * 6; withT(x, y + b, 1, 1, 0, () => { poly([[-22, -28], [22, -28], [0, 0]], null, 0, a, true, C.teal); circle(0, -42, 8, C.teal, a); }); }

// ------------------------------------------------ the world: 8 billion people as dots on a globe, halved question after question
const DOTS = 760, GLOBE = { x: 540, y: 880, r: 330 };
const dot = (i) => { const z = 1 - 2 * (i + 0.5) / DOTS, rr = Math.sqrt(1 - z * z), ph = i * 2.39996; return [Math.cos(ph) * rr, z, Math.sin(ph) * rr]; };
const rankOf = (i) => rnd(i * 7 + 3);   // each dot survives the questions while rank < 2^-k
function globe(t, t0, t1, a, o = {}) {
  if (a <= 0) return; const q = clamp((t - t0) / (t1 - t0)), k = Math.floor(q * 33.999), frac = Math.pow(0.5, k), vis = Math.pow(DOTS, -k / 33), rot = t * 0.25;  // vis: the dots on screen thin out evenly to one
  const keep = o.you ? 0 : 1; halo(GLOBE.x, GLOBE.y, GLOBE.r * 1.25, "rgba(31,181,181,0.14)", a);
  circle(GLOBE.x, GLOBE.y, GLOBE.r, "rgba(29,53,87,0.05)", a); ring(GLOBE.x, GLOBE.y, GLOBE.r, hexA(C.teal, 0.35), 3, a);
  // meridians
  for (let m = 0; m < 6; m++) { A(a * 0.18); ctx.beginPath(); ctx.ellipse(GLOBE.x, GLOBE.y, Math.abs(Math.cos(rot + m * 0.5236)) * GLOBE.r, GLOBE.r, 0, 0, 6.2832); ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.stroke(); }
  let you = -1, best = 2;
  for (let i = 0; i < DOTS; i++) { const r0 = rankOf(i); if (r0 < best) { best = r0; you = i; } }
  for (let i = 0; i < DOTS; i++) {
    const [x0, y0, z0] = dot(i), x = x0 * Math.cos(rot) + z0 * Math.sin(rot), z = -x0 * Math.sin(rot) + z0 * Math.cos(rot); if (z < -0.15 && i !== you) continue;
    const alive = rankOf(i) < vis || i === you, sx = GLOBE.x + x * GLOBE.r, sy = GLOBE.y - y0 * GLOBE.r, depth = 0.45 + 0.55 * (z + 1) / 2;
    if (i === you) continue;
    if (!alive) { const kd = Math.ceil(-33 * Math.log(Math.max(1e-9, rankOf(i))) / Math.log(DOTS)); if (kd === k) circle(sx, sy, 4.5 * depth, C.red, a * 0.6 * depth); continue; }
    circle(sx, sy, 4.5 * depth, C.navy, a * depth * 0.85);
  }
  // "you": the one dot left
  const [x0, y0, z0] = dot(you), x = x0 * Math.cos(rot) + z0 * Math.sin(rot); const sx = GLOBE.x + x * GLOBE.r, sy = GLOBE.y - y0 * GLOBE.r;
  const lit = k >= 33 ? 1 : 0; circle(sx, sy, 7 + 8 * lit, lit ? C.teal : C.navy, a); if (lit) { halo(sx, sy, 90, "rgba(31,181,181,0.6)", a); ring(sx, sy, 26 + 8 * Math.sin(t * 6), C.teal, 4, a); }
  // counters
  const people = Math.max(1, Math.round(8e9 * frac)), qn = Math.min(33, k);
  withT(540, GLOBE.y + GLOBE.r + 95, 1, 1, 0, () => { fillRR(-300, -50, 600, 100, 50, lit ? C.teal : C.navy, a, 20); T(`${people.toLocaleString("en-US")} إنسان`, 0, 4, { size: 48, color: "#fff", a }); });
  withT(540, GLOBE.y + GLOBE.r + 190, 1, 1, 0, () => T(`سؤال ${qn} / 33`, 0, 0, { size: 40, color: C.mut, a, weight: 800 }));
  if (lit) { const p = pop(t, t0 + (t1 - t0) * (33 / 33.999), 0.4); withT(sx, sy - 80, p, p, 0, () => { fillRR(-110, -36, 220, 72, 36, "#fff", a * clamp(p * 2), 16); strokeRR(-110, -36, 220, 72, 36, C.teal, 3, a * clamp(p * 2)); T("هاد إنت 👆", 0, 3, { size: 36, a: a * clamp(p * 2) }); }); }
}
SCENES.hook = (t) => {
  const e = SCN.hook.t1; if (t > e + 0.3) return; const a = 1 - P(t, e - 0.05, 0.3);
  globe(t, 0.9, L1(0) - 0.2, a);
};
SCENES.world = (t) => {
  const s0 = SCN.world.t0, s1 = SCN.world.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  globe(t, AT(13, "تمن") + 0.3, L1(13) - 0.1, a);
};
// ------------------------------------------------ the secret: a long list, cut in half, then half again
SCENES.secret = (t) => {
  const s0 = SCN.secret.t0, s1 = SCN.secret.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  const y = 900, n = 32, w = 960, cut1 = AT(1, "منقسم") - 0.1, c2 = cut1 + 0.9;
  for (let i = 0; i < n; i++) {
    const x0 = 60 + (i + 0.5) * w / n; let x = x0, yy = y, al = a;
    const g1 = eio(P(t, cut1 + 0.25, 0.5)), g2 = eio(P(t, c2 + 0.25, 0.5));
    if (i < n / 2) { yy += g1 * 260; al *= 1 - g1 * 0.85; } else { x -= g1 * 240; if (i >= n * 0.75) { yy += g2 * 260; al *= 1 - g2 * 0.85; } else x -= g2 * 120; }
    fillRR(x - 11, yy - 44, 22, 88, 8, C.navy, al * eo(P(t, s0 + i * 0.012, 0.3)), 6);
  }
  [[cut1, 60 + w / 2], [c2, 60 + w * 0.75 - 240]].forEach(([tc, xc]) => { const u = P(t, tc, 0.45); if (u <= 0 || u >= 1) return; seg(xc, y - 120, xc, lerp(y - 120, y + 120, eo(u)), C.teal, 6, a); T("✂️", xc, lerp(y - 150, y + 110, eo(u)), { size: 72, a }); });
};

// ------------------------------------------------ setup + demo + name: the 11 sorted cards
SCENES.cards = (t) => {
  const s0 = SCN.setup.t0, s1 = SCN.name.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const out = 1 - P(t, s1 - 0.05, 0.3);
  // target chip
  const tk = pop(t, AT(2, "بدنا"), 0.45); withT(540, 690, tk, tk, 0, () => { fillRR(-170, -50, 340, 100, 50, C.tealSoft, out * clamp(tk * 2)); T("المطلوب", 50, 3, { size: 34, color: C.teal, a: out * clamp(tk * 2) }); T("51", -80, 4, { size: 64, color: C.teal, fam: "mono", a: out * clamp(tk * 2) }); });
  // sorted tag under the row
  const st = win(t, AT(2, "المرتبة") - 0.1, L0(3) + 0.6, 0.25); if (st > 0) { arrow(cx(0) - 10, ROWY + 105, cx(10) + 20, ROWY + 105, C.teal, 6, st * out, 20); T("مرتّبة من الصغير للكبير", 540, ROWY + 155, { size: 34, color: C.teal, a: st * out }); }
  let lo = 0, hi = 10, cur = -1;
  for (let k = 0; k < STEPS.length; k++) if (t >= stepT(k) - 0.05) cur = k;
  for (let i = 0; i < N; i++) {
    const enter = eo(P(t, s0 + 0.2 + i * 0.04, 0.4)); let x = cx(i), y = ROWY + (1 - enter) * 900, a = out * enter, state = "", s = 1;
    // dropped halves fall and fade
    for (let k = 0; k < 3; k++) { const [l, h2, m, v] = STEPS[k], dt = dropT(k); const gone = v < 0 ? i <= m && i >= l : i >= m && i <= h2; if (gone && t >= dt) { const u = eio(P(t, dt, 0.55)); y += u * 300; a *= 1 - u; s *= 1 - 0.25 * u; state = "out"; } }
    if (cur >= 0) { const [l, h2, m, v] = STEPS[cur]; if (i === m && state !== "out") { state = v === 0 && t >= verdT(cur) - 0.05 ? "found" : "mid"; s *= 1 + 0.12 * imp(t, stepT(cur), 0.4) + (state === "found" ? 0.15 * pop(t, verdT(cur), 0.4) - 0.15 * P(t, verdT(cur) + 0.4, 0.3) : 0); } }
    card(x, y, s, { val: VALS[i], state, a });
  }
  // the live range bracket over what is still possible
  if (cur >= 0) { let l = 0, h2 = 10; for (let k = 0; k < STEPS.length; k++) if (t >= dropT(k) + 0.45 && k < 3) { const [ll, hh, m, v] = STEPS[k]; if (v < 0) l = m + 1; else h2 = m - 1; }
    const ba = out * P(t, stepT(0) - 0.1, 0.3), x1 = cx(l) - CW / 2 - 6, x2 = cx(h2) + CW / 2 + 6, yb = ROWY - CH / 2 - 26;
    poly([[x1, yb + 16], [x1, yb], [x2, yb], [x2, yb + 16]], C.teal, 5, ba);
    const [ , , m] = STEPS[cur]; pointer(cx(m), yb - 14, ba);
    // the comparison chip
    const [, , mm, v] = STEPS[cur], vt = verdT(cur); if (t >= vt - 0.05) { const k = pop(t, vt, 0.35), txt = v === 0 ? "51 = 51 ✓" : v < 0 ? `${VALS[mm]} < 51` : `${VALS[mm]} > 51`;
      withT(540, ROWY + 150, k, k, 0, () => { fillRR(-150, -42, 300, 84, 42, v === 0 ? C.teal : C.redSoft, out * clamp(k * 2), 14); T(txt, 0, 4, { size: 44, color: v === 0 ? "#fff" : C.red, fam: "mono", a: out * clamp(k * 2) }); }); }
    if (cur === 3 && t >= verdT(3)) sparkle(cx(7), ROWY, verdT(3), { n: 34, r: 320 });
  }
  // name: step counter "4 steps" vs 11 cards
  if (t > L0(7) - 0.1) { const k = pop(t, AT(7, "البحث") + 0.2, 0.45); withT(540, ROWY - 220, k, k, 0, () => { fillRR(-300, -58, 600, 116, 58, C.navy, out * clamp(k * 2), 20); T("Binary Search", 0, 4, { size: 60, color: "#fff", fam: "mono", a: out * clamp(k * 2) }); }); }
};
// خوارزمو, the host on the left (all poses drawn facing right, none mirrored): walks in, watches, jumps on the find, thumbs-up on the name
const HOSTX = 250, HOSTY = 1710, HOSTH = 500;
function hostPose(t) {
  const f = verdT(3), seq = [[SCN.setup.t0 + 0.1, "walking"], [SCN.setup.t0 + 1.9, "front"], [f - 0.05, "celebrating"], [f + 1.3, "front"], [L0(7) + 0.3, "hero"]];
  let cur = seq[0]; for (const q of seq) if (t >= q[0]) cur = q; return cur;
}
SCENES.khwarizmo = (t) => {
  const t0 = SCN.setup.t0 + 0.1, t1 = SCN.name.t1 - 0.1; if (t < t0 || t > t1 + 0.45) return;
  const [since, pose] = hostPose(t), sw = P(t, since, 0.3); let sx = 1, sy = 1;
  if (pose !== "walking" && sw < 1) { const b = back(sw, 2.0); sx = lerp(1.08, 1, b); sy = lerp(0.9, 1, b); }
  const f = verdT(3), ju = P(t, f - 0.05, 0.62), exit = eio(P(t, t1, 0.4)), wk = P(t, t0, 1.7), x = lerp(-260, HOSTX, eo(wk)); let y = HOSTY + exit * 900;
  if (pose === "walking" && wk < 1) { const st = Math.abs(Math.sin(wk * Math.PI * 4)); y -= st * 18 * (1 - wk); sy *= 1 - 0.025 * (1 - st); }
  if (ju > 0 && ju < 1) { y -= Math.sin(ju * Math.PI) * 95; sy *= 1 + 0.05 * Math.sin(ju * Math.PI); }
  const h = pose === "celebrating" || pose === "walking" ? HOSTH * 0.97 : HOSTH;
  KR(pose, x, y, h, { sx, sy, rot: 0, shadow: ju > 0 && ju < 1 ? 1 - 0.6 * Math.sin(ju * Math.PI) : 1 });
  if (pose === "celebrating") sparkle(x + 40, y - h, f, { n: 40, r: 420, dur: 1.3 });
};

// ------------------------------------------------ rule: sorted (yes) vs shuffled (no), then halving bar
SCENES.rule = (t) => {
  const s0 = SCN.rule.t0, s1 = SCN.rule.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  const o1 = 1 - P(t, L0(9) - 0.2, 0.3);
  if (o1 > 0) { const so = [3, 8, 15, 21, 34, 47, 60], sh = [47, 3, 60, 15, 8, 34, 21];
    [[so, 760, "مرتّبة ✓", C.teal, "yes"], [sh, 1060, "عشوائية ✗", C.red, "no"]].forEach(([arr, y, lab, col, kind], r) => { const k0 = L0(8) + 0.15 + r * 0.6;
      arr.forEach((v, i) => { const k = pop(t, k0 + i * 0.05, 0.35); withT(135 + 135 * i, y, k, k, 0, () => { fillRR(-55, -55, 110, 110, 20, "#fff", a * o1 * clamp(k * 2), 14); strokeRR(-55, -55, 110, 110, 20, r ? hexA(C.red, 0.4) : C.line, 3, a * o1 * clamp(k * 2)); T(String(v), 0, 5, { size: 56, color: C.navy, fam: "mono", a: a * o1 * clamp(k * 2) }); }); });
      const k = pop(t, k0 + 0.5, 0.4); withT(540, y + 110, k, k, 0, () => { fillRR(-130, -34, 260, 68, 34, r ? C.redSoft : C.tealSoft, a * o1 * clamp(k * 2)); T(lab, 0, 2, { size: 36, color: col, a: a * o1 * clamp(k * 2) }); }); }); }
  if (t > L0(9) - 0.2) { const b = P(t, L0(9), 0.3), y = 930, w0 = 900;
    for (let s2 = 0; s2 < 5; s2++) { const ts = AT(9, "ومنرمي") + s2 * 0.32, u = eio(P(t, ts, 0.3)), w = w0 / Math.pow(2, s2) * (1 - 0.5 * u * (s2 < 4 ? 1 : 0)); const yy = y + s2 * 70;
      if (t < ts - 0.3 && s2 > 0) continue; fillRR(540 - w / 2, yy - 22, w, 44, 22, s2 === 4 ? C.teal : C.navy, a * b, 10); T(String(Math.round(1000000 / Math.pow(2, s2))).replace(/\B(?=(\d{3})+(?!\d))/g, ","), 540, yy + 2, { size: 26, color: "#fff", fam: "mono", a: a * b * (w > 150 ? 1 : 0) }); } }
};

// ------------------------------------------------ speed: a million halves down to 1 in 20 steps · linear vs binary · log curve
SCENES.speed = (t) => {
  const s0 = SCN.speed.t0, s1 = SCN.speed.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  const r1 = 1 - P(t, L0(11) - 0.2, 0.3);
  if (r1 > 0) { const u = clamp((t - AT(10, "بيصيروا")) / (L1(10) - AT(10, "بيصيروا"))), k = Math.min(20, Math.floor(u * 20.99)), n = Math.max(1, Math.round(1e6 / Math.pow(2, k)));
    withT(540, 800, 1 + 0.06 * imp(t, AT(10, "بيصيروا") + k / 20.99 * (L1(10) - AT(10, "بيصيروا")), 0.15), 1, 0, () => T(n.toLocaleString("en-US"), 0, 0, { size: n > 99999 ? 150 : 190, color: k >= 20 ? C.teal : C.navy, fam: "mono", a: a * r1 }));
    T("عنصر باقي", 540, 930, { size: 44, color: C.mut, a: a * r1 });
    for (let i = 0; i < 20; i++) { const x = 160 + i * 40; circle(x, 1050, 12, i < k ? C.teal : C.line, a * r1); }
    T(`خطوة ${k} / 20`, 540, 1120, { size: 42, color: C.navy, a: a * r1 }); }
  const r2 = P(t, L0(11) - 0.05, 0.3) * (1 - P(t, L0(12) - 0.15, 0.3));
  if (r2 > 0) { const g = eo(P(t, L0(11) + 0.2, 0.8)), g2 = eo(P(t, AT(11, "كان"), 0.9));
    T("🐢 البحث الخطي", 900, 760, { size: 40, color: C.red, a: a * r2, align: "right" }); fillRR(980 - 880 * g2, 800, 880 * g2, 56, 28, C.red, a * r2); T("1,000,000", 540, 830, { size: 34, color: "#fff", fam: "mono", a: a * r2 * g2 });
    T("🚀 البحث الثنائي", 900, 960, { size: 40, color: C.teal, a: a * r2, align: "right" }); fillRR(980 - 60 * g, 1000, 60 * g, 56, 28, C.teal, a * r2); T("20", 860, 1030, { size: 40, color: C.teal, fam: "mono", a: a * r2 * g }); }
  const r3 = P(t, L0(12) - 0.05, 0.3);
  if (r3 > 0) { const k = pop(t, AT(12, "O(log") - 0.1, 0.45); withT(540, 720, k, k, 0, () => T("O(log n)", 0, 0, { size: 140, color: C.navy, fam: "mono", a: a * r3 * clamp(k * 2) }));
    const gx = 200, gy = 1330, gw = 680, gh = 420, u = eio(P(t, L0(12) + 0.2, 1.2)); seg(gx, gy, gx + gw + 20, gy, C.mut, 4, a * r3); seg(gx, gy, gx, gy - gh - 20, C.mut, 4, a * r3);
    seg(gx, gy, gx + gw * u, gy - gh * u, hexA(C.red, 0.6), 6, a * r3); T("خطي", gx + gw * u + 10, gy - gh * u, { size: 30, color: C.red, a: a * r3 * u, align: "left" });
    const pts = []; for (let i = 0; i <= 60 * u; i++) { const xx = i / 60; pts.push([gx + gw * xx, gy - gh * 0.22 * Math.log2(1 + xx * 15) / 4]); } if (pts.length > 1) poly(pts, C.teal, 9, a * r3);
    if (pts.length > 1) T("ثنائي", pts[pts.length - 1][0] + 10, pts[pts.length - 1][1] - 26, { size: 30, color: C.teal, a: a * r3, align: "left" });
    T("عدد العناصر", gx + gw / 2, gy + 46, { size: 32, color: C.mut, a: a * r3 }); T("الخطوات", gx - 20, gy - gh - 40, { size: 32, color: C.mut, a: a * r3, align: "left" }); }
};

// ------------------------------------------------ teaser: a shuffled list -> "how do we sort it?" -> locked, blurred "Sorting" -> next reel
SCENES.teaser = (t) => {
  const s0 = SCN.teaser.t0; if (t < s0 - 0.1) return; const a = P(t, s0, 0.3), o1 = 1 - P(t, L0(15) - 0.2, 0.3), vals = [47, 3, 60, 15, 8, 34, 21];
  if (o1 > 0) vals.forEach((v, i) => { const wob = Math.sin(t * 7 + i * 1.7) * 14, k = pop(t, s0 + 0.1 + i * 0.05, 0.4); withT(135 + 135 * i, 900 + wob, k, k, Math.sin(t * 5 + i) * 0.12, () => { fillRR(-55, -55, 110, 110, 20, "#fff", a * o1 * clamp(k * 2), 14); strokeRR(-55, -55, 110, 110, 20, hexA(C.red, 0.4), 3, a * o1 * clamp(k * 2)); T(String(v), 0, 5, { size: 56, color: C.navy, fam: "mono", a: a * o1 * clamp(k * 2) }); }); });
  if (t > L0(15) - 0.3) { const e = eo(P(t, L0(15) - 0.25, 0.5)); KR("wink", 540, 1720 + (1 - e) * 600, 700, { bob: 0.6 });
    const rv = AT(15, "بالريل"), f = P(t, rv - 0.12, 0.3), sx = Math.abs(Math.cos(f * Math.PI)), flipped = f > 0.5;
    if (!flipped) { const q = pop(t, L0(15) + 0.05, 0.45), wob = Math.sin(t * 9) * 0.06 * win(t, L0(15) + 0.4, rv, 0.15);
      for (let k = 0; k < 2; k++) { const u = ((t - L0(15)) * 1.3 + k / 2) % 1; ring(540, 680, 130 + u * 110, hexA(C.teal, 0.5), 6 * (1 - u), (1 - u) * clamp(q)); }
      withT(540, 680, q * Math.max(0.02, sx), q, wob, () => { circle(0, 0, 130, C.navy, clamp(q * 2), 30); T("؟", 0, 12, { size: 180, color: "#fff", a: clamp(q * 2) }); }); }
    else { const k = back(P(t, rv + 0.03, 0.4), 1.4), w = lerp(260, 600, eo(P(t, rv + 0.03, 0.35)));
      withT(540, 680, Math.max(0.02, sx) * k, k, 0, () => { fillRR(-w / 2, -95, w, 190, 40, C.navy, 1, 36);
        ctx.save(); rr(-w / 2, -95, w, 190, 40); ctx.clip(); ctx.filter = "blur(11px)"; T("Sorting", 0, 6, { size: 90, color: "#ffffff", fam: "mono" }); ctx.filter = "none";
        const sh = ((t - rv) * 0.7) % 1.4; if (sh < 1) { A(0.35); const gx = lerp(-w / 2 - 120, w / 2 + 120, sh); const g = ctx.createLinearGradient(gx - 90, 0, gx + 90, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(120,240,230,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(gx - 90, -95, 180, 190); }
        ctx.restore(); T("🔒", w / 2 - 50, -60, { size: 40 }); });
      const r = imp(t, rv + 0.1, 0.7); ring(540, 680, 160 + 260 * (1 - r), hexA(C.teal, 0.6), 10 * r + 1, r); sparkle(540, 680, rv + 0.1, { n: 34, r: 420 });
      const p = pop(t, rv + 0.35, 0.5); withT(540, 880, p, p, 0, () => T("بالريل الجاي 👀", 0, 0, { size: 84, color: C.teal, a: clamp(p * 2) })); }
  }
};
SCENES.order = ["hook", "secret", "cards", "rule", "speed", "world", "teaser", "khwarizmo"];

// ------------------------------------------------ sound events (soft UI sounds under the voice)
window.collectSfx = () => {
  const e = [], ev = (t, k, v = 0) => e.push({ t: +t.toFixed(3), k, v });
  ev(0.02, "hit"); for (let q = 0; q < 33; q += 3) ev(0.9 + (L1(0) - 1.1) * q / 33.999, "tick", q % 7);
  ev(AT(1, "منقسم") - 0.1, "swish"); ev(AT(1, "منقسم") + 0.8, "swish");
  for (let i = 0; i < N; i++) ev(SCN.setup.t0 + 0.2 + i * 0.04, "card", i); ev(AT(2, "بدنا"), "pop");
  for (let k = 0; k < 4; k++) { ev(stepT(k), "flip", k); ev(verdT(k), k === 3 ? "found" : "no", k); if (k < 3) ev(dropT(k), "swish", k); }
  ev(AT(7, "البحث") + 0.2, "pop"); ev(AT(8, "القائمة"), "pop"); ev(AT(8, "القائمة") + 0.5, "pop");
  for (let s2 = 0; s2 < 5; s2++) ev(AT(9, "ومنرمي") + s2 * 0.32, "tick", s2);
  ev(AT(10, "بيصيروا"), "rise"); ev(AT(12, "O(log") - 0.1, "pop"); ev(L1(13) - 0.1, "found", 9);
  ev(L0(15) + 0.05, "pop"); ev(AT(15, "بالريل") - 0.12, "swish"); ev(AT(15, "بالريل") + 0.1, "found", 9); ev(AT(15, "بالريل") + 0.35, "pop");
  TL.scenes.slice(1).forEach((s) => ev(s.t0, "swish", 9));
  return { total: TL.total, scenes: TL.scenes, events: e.sort((a, b) => a.t - b.t) };
};
