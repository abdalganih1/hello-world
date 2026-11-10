// Scenes. One idea per scene, keyed to the narration: L0(i)/L1(i) = start/end of spoken line i, SG(i, j) = start of its j-th phrase.
// Lines: 0-1 hook · 2 intro · 3 idea · 4-8 demo · 9 name · 10-11 rule · 12-13 code · 14-16 speed · 17-18 teaser
"use strict";
const CW = 130, CH = 180, ROWY = 930, cx = (i) => 108 + 144 * i;
const FINAL = [7, 3, 9, 1, 5, 8, 2];
// shell game: the 5 hides in the middle card, then 3 swaps leave it at index 4
const START = [2, 1, 9, 5, 3, 8, 7], SWAPS = [[3, 1], [1, 4], [0, 6]], swapT = (k) => 1.75 + k * 0.6, SWD = 0.5;
function slotPos(card, t) { // card = index into START; returns x position (float) and lift
  let slot = card, x = cx(card), lift = 0;
  for (let k = 0; k < SWAPS.length; k++) { const [a, b] = SWAPS[k], u = P(t, swapT(k), SWD); if (slot !== a && slot !== b) continue;
    const to = slot === a ? b : a, e = eio(u); x = lerp(cx(slot), cx(to), e); lift = Math.sin(u * Math.PI) * (slot === a ? -70 : 70); if (u >= 1) { slot = to; x = cx(slot); lift = 0; } }
  return { x, lift, slot };
}
function drawCard(x, y, s, o = {}) {
  const { face = 0, val = "", state = "", a = 1, rot = 0 } = o; if (a <= 0 || s <= 0) return; // face: 0 down, 1 up
  const fx = Math.abs(Math.cos(face * Math.PI)), up = face > 0.5;
  withT(x, y, s * Math.max(0.02, fx), s, rot, () => {
    if (!up) { fillRR(-CW / 2, -CH / 2, CW, CH, 20, C.card, a, 22); A(a); rr(-CW / 2, -CH / 2, CW, CH, 20); const g = ctx.createLinearGradient(0, -CH / 2, 0, CH / 2); g.addColorStop(0, C.card2); g.addColorStop(1, C.card); ctx.fillStyle = g; ctx.fill();
      strokeRR(-CW / 2 + 8, -CH / 2 + 8, CW - 16, CH - 16, 14, "rgba(255,255,255,0.14)", 2, a); T("?", 0, 4, { size: 86, color: "#ffffff", a, fam: "mono" }); fillRR(-26, CH / 2 - 22, 52, 7, 4, C.teal, a); }
    else { const bg = state === "found" ? C.teal : state === "no" ? C.redSoft : "#ffffff"; fillRR(-CW / 2, -CH / 2, CW, CH, 20, bg, a, state === "found" ? 34 : 18);
      strokeRR(-CW / 2, -CH / 2, CW, CH, 20, state === "found" ? C.teal : state === "no" ? hexA(C.red, 0.55) : C.line, 3, a);
      T(String(val), 0, 6, { size: 94, color: state === "found" ? "#ffffff" : state === "no" ? hexA(C.red, 0.75) : C.navy, a, fam: "mono" }); }
  });
}
function badge(x, y, kind, k, a = 1) { if (k <= 0 || a <= 0) return; withT(x, y, k, k, 0, () => { circle(0, 0, 26, kind === "yes" ? C.navy : C.red, a, 8);
  if (kind === "yes") poly([[-11, 0], [-3, 9], [12, -9]], "#fff", 6, a); else { seg(-9, -9, 9, 9, "#fff", 6, a); seg(9, -9, -9, 9, "#fff", 6, a); } }); }
function pointer(x, y, a) { if (a <= 0) return; const b = Math.sin(NOW * 7) * 6; withT(x, y + b, 1, 1, 0, () => { poly([[-24, -30], [24, -30], [0, 0]], null, 0, a, true, C.teal); circle(0, -44, 9, C.teal, a); }); }

// ------------------------------------------------ hook + intro + idea + demo + name: one continuous row of cards
SCENES.cards = (t) => {
  const tEnd = SCN.name.t1 - 0.1; if (t > tEnd + 0.3) return; const out = 1 - P(t, tEnd, 0.3);
  // the "5" token at the start, then it drops into the middle card
  const fiveIn = 0.85 + 0.15 * back(P(t, 0, 0.35)), dive = eio(P(t, 1.25, 0.4));
  if (dive < 1) { const y = lerp(ROWY - 260, ROWY, dive), s = fiveIn * lerp(1, 0.45, dive); withT(540, y, s, s, 0, () => { circle(0, 0, 130, C.teal, 1 - dive * 0.6, 30); ring(0, 0, 148, hexA(C.teal, 0.3), 7, 1 - dive); T("5", 0, 8, { size: 180, color: "#fff", fam: "mono", a: 1 - dive * 0.3 }); }); }
  const nameM = eio(P(t, L0(9) - 0.15, 0.6)); // name scene: cards melt into dots on a straight line
  for (let c = 0; c < 7; c++) {
    const enter = eo(P(t, 0.35 + c * 0.05, 0.45)), land = imp(t, 1.62, 0.3) * (c === 3 ? 1 : 0);
    let { x, lift, slot } = slotPos(c, t), y = ROWY + (1 - enter) * 1300 - lift + land * 16; const val = START[c], k = FINAL.indexOf(val);
    // idle wave while asking "how do you find it?"
    y += Math.sin(t * 5 - slot * 0.7) * 8 * win(t, L0(1), L0(2), 0.3);
    let face = 0, state = "";
    if (k <= 4 && t >= L0(4 + k) - 0.02) { face = P(t, L0(4 + k), 0.32); if (t >= SG(4 + k, 1) - 0.05) state = k === 4 ? "found" : "no"; }
    const dimA = state === "no" ? lerp(1, 0.55, P(t, SG(4 + k, 1) + 0.3, 0.4)) : 1, foundK = state === "found" ? 1 + 0.12 * pop(t, SG(8, 1) - 0.05, 0.4) - 0.12 * P(t, SG(8, 1) + 0.4, 0.4) : 1;
    if (state === "found") { const r = imp(t, SG(8, 1), 0.7); ring(x, y, 110 + 140 * (1 - r), hexA(C.teal, 0.6), 8 * r + 1, r); }
    if (nameM > 0) { const s = lerp(1, 0.001, nameM); drawCard(x, y, s * foundK, { face, val, state, a: out * dimA }); const r = lerp(0, state === "found" ? 30 : 20, nameM); circle(x, y, r, state === "found" ? C.teal : C.navy, out * nameM, 10); continue; }
    drawCard(x, y, foundK, { face, val, state, a: out * dimA });
    if (state) badge(x + CW / 2 - 6, y - CH / 2 + 6, state === "found" ? "yes" : "no", pop(t, SG(4 + k, 1) - 0.05, 0.3), out);
  }
  if (t >= SG(8, 1)) sparkle(cx(4), ROWY, SG(8, 1), { n: 30, r: 300 });
  // idea: order 1..7 under the cards, then an arrow from the first to the last
  const ia = win(t, L0(3), L0(4) - 0.1, 0.25);
  if (ia > 0) { for (let i = 0; i < 7; i++) { const k = pop(t, L0(3) + 0.15 + i * 0.2, 0.35); withT(cx(i), ROWY + 140, k, k, 0, () => { circle(0, 0, 28, C.tealSoft, ia); T(String(i + 1), 0, 3, { size: 34, color: C.teal, fam: "mono", a: ia }); }); }
    const u = eio(P(t, SG(3, 1), Math.max(0.6, L1(3) - SG(3, 1)))); if (u > 0) arrow(cx(0) - 30, ROWY + 210, lerp(cx(0) - 30, cx(6) + 34, u), ROWY + 210, C.teal, 7, ia, 24); }
  // demo: the pointer walks card by card
  if (t > L0(4) - 0.5 && t < SCN.demo.t1) { let px = cx(0); for (let k = 1; k <= 4; k++) px = lerp(px, cx(k), eio(P(t, SG(4 + k - 1, 1) + 0.15, 0.35)));
    pointer(px, ROWY - CH / 2 - 24, P(t, L0(4) - 0.45, 0.3) * (1 - P(t, SG(8, 1) + 0.6, 0.3))); }
  // name: the straight line through the dots + a dot travelling along it
  if (nameM > 0) { const la = out * nameM, u = eio(P(t, L0(9) + 0.25, 0.8)); seg(cx(0) - 40, ROWY, lerp(cx(0) - 40, cx(6) + 50, u), ROWY, hexA(C.teal, 0.55), 6, la);
    if (u >= 1) arrow(cx(6) + 10, ROWY, cx(6) + 62, ROWY, C.teal, 6, la, 20);
    const tx = lerp(cx(0), cx(6), ((t - L0(9) - 1.1) * 0.55) % 1); if (t > L0(9) + 1.1) { halo(tx, ROWY, 60, "rgba(31,181,181,0.45)", la); circle(tx, ROWY, 12, C.teal2, la); }
    const k = pop(t, L0(9) + 0.7, 0.45); withT(540, ROWY - 200, k, k, 0, () => { fillRR(-300, -58, 600, 116, 58, C.navy, la * clamp(k * 2), 20); T("Linear Search", 0, 4, { size: 60, color: "#fff", fam: "mono", a: la * clamp(k * 2) }); }); }
};
// خوارزمو: introduces himself, and gives a thumbs-up when the method gets its name
SCENES.khwarizmo = (t) => {
  const i0 = L0(2) - 0.2, i1 = L0(3) + 0.6; if (t > i0 && t < i1 + 0.5) { const e = eo(P(t, i0, 0.5)), o = eio(P(t, i1, 0.45)); K("presenting", 560, 1740 + (1 - e) * 700 + o * 800, 640, { rot: Math.sin(t * 3) * 0.015 }); }
  const n0 = L0(9) + 0.5, n1 = SCN.name.t1 - 0.1; if (t > n0 && t < n1 + 0.5) { const e = eo(P(t, n0, 0.45)), o = eio(P(t, n1, 0.4)); K("hero", 540, 1740 + (1 - e) * 600 + o * 700, 560); }
};

// ------------------------------------------------ rule: compare, then stop or continue
SCENES.rule = (t) => {
  const s0 = SCN.rule.t0, s1 = SCN.rule.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3)), y = 800, XE = 750, XT = 330;
  // element stream: 7, 3, 9, 1, 5 pass through the compare slot while he says "compare every element with the target"
  const seq = [7, 3, 9, 1, 5], st = L0(10) + 0.2, per = Math.max(0.24, (L1(10) - st) / 5); let idx = Math.min(4, Math.floor(Math.max(0, t - st) / per)); if (t >= L0(11) - 0.05) idx = -1;
  const ek = pop(t, s0 + 0.05, 0.4), hit = idx === 4, flash = idx >= 0 ? imp(t, st + idx * per, per) : 0;
  const tile = (x, txt, bg, fg, bd, lab) => withT(x, y, ek, ek, 0, () => { fillRR(-105, -135, 210, 270, 30, bg, a, 26); if (bd) strokeRR(-105, -135, 210, 270, 30, bd, 4, a); T(txt, 0, 8 - flash * 12 * (x === XE), { size: 140, fam: "mono", color: fg, a }); T(lab, 0, 190, { size: 40, color: C.mut, a }); });
  tile(XE, idx < 0 ? "?" : String(seq[idx]), idx < 0 ? "#fff" : hit ? C.teal : C.redSoft, idx < 0 ? C.mut : hit ? "#fff" : C.red, idx < 0 ? C.line : hit ? null : hexA(C.red, 0.5), "العنصر");
  tile(XT, "5", C.navy, "#fff", null, "المطلوب");
  const qk = pop(t, s0 + 0.25, 0.4); withT(540, y, qk, qk, 0, () => { circle(0, 0, 62, C.tealSoft, a); T(idx >= 0 ? (hit ? "=" : "≠") : "=", 0, 4, { size: 80, color: idx >= 0 && !hit ? C.red : C.teal, fam: "mono", a }); });
  // two branches under the element: "it is" -> stop (right), "it isn't" -> carry on (left)
  const yb = 1300, yk = P(t, SG(11, 0), 0.3), nk = P(t, SG(11, 2), 0.3), top = y + 240;
  if (yk > 0) { const u = eio(yk); poly([[XE, top], [XE, lerp(top, yb - 80, u)]], C.teal, 8, a); if (u >= 1) poly([[XE - 18, yb - 98], [XE, yb - 78], [XE + 18, yb - 98]], C.teal, 8, a);
    T("هو؟", XE + 40, (top + yb) / 2 - 30, { size: 44, color: C.teal, a: a * yk, align: "left" });
    const k = pop(t, SG(11, 1) - 0.05, 0.4); withT(XE, yb, k, k, 0, () => { fillRR(-165, -66, 330, 132, 66, C.teal, a * clamp(k * 2), 26); T("وقّف ✓", 0, 5, { size: 58, color: "#fff", a: a * clamp(k * 2) }); }); }
  if (nk > 0) { const u = eio(nk), xl = 330; poly([[XE - 60, top - 10], [lerp(XE - 60, xl + 60, u), lerp(top - 10, yb - 90, u)]], C.red, 8, a);
    T("مش هو؟", 360, (top + yb) / 2 - 75, { size: 44, color: C.red, a: a * nk });
    const k = pop(t, SG(11, 3) - 0.05, 0.4); withT(xl, yb, k, k, 0, () => { fillRR(-170, -66, 340, 132, 66, "#ffffff", a * clamp(k * 2), 26); strokeRR(-170, -66, 340, 132, 66, hexA(C.red, 0.45), 4, a * clamp(k * 2)); T("كمّل ↻", 0, 5, { size: 58, color: C.navy, a: a * clamp(k * 2) }); }); }
};
// ------------------------------------------------ code: five lines, the spoken part lights up
const CODE = ["def linear_search(arr, target):", "    for i in range(len(arr)):", "        if arr[i] == target:", "            return i", "    return -1"];
const KW = { def: "#7a5cc7", for: "#7a5cc7", in: "#7a5cc7", if: "#7a5cc7", return: "#7a5cc7", range: C.teal2, len: C.teal2, linear_search: C.teal, target: "#d9822b" };
function codeLine(s, x, y, size, a) { let cxp = x; const cw = measure("M", size, 800, "mono");
  for (const tok of s.split(/(\W)/)) { if (!tok) continue; T(tok, cxp, y, { size, fam: "mono", align: "left", color: KW[tok] || (/^-?\d+$/.test(tok) ? "#d9822b" : C.navy), a, weight: 800 }); cxp += cw * tok.length; } }
SCENES.code = (t) => {
  const s0 = SCN.code.t0, s1 = SCN.code.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3)), k = 0.94 + 0.06 * eo(P(t, s0, 0.45));
  const hlLine = t >= SG(13, 1) - 0.05 ? 3 : t >= SG(13, 0) - 0.05 ? 2 : t >= SG(12, 1) - 0.05 ? 1 : -1;
  withT(540, 960, k, k, 0, () => { fillRR(-490, -300, 980, 600, 32, "#ffffff", a, 40); fillRR(-490, -300, 980, 80, 32, "#f1f6f9", a); fillRR(-490, -256, 980, 36, 0, "#f1f6f9", a);
    [C.red, C.gold, C.teal].forEach((c, i) => circle(-440 + i * 38, -260, 11, c, a)); T("linear_search.py", 60, -260, { size: 28, fam: "mono", color: C.mut, a, weight: 800 });
    CODE.forEach((ln, i) => { const y = -140 + i * 88, la = a * P(t, s0 + 0.15 + i * 0.1, 0.25);
      if (i === hlLine) { const u = eo(P(t, i === 1 ? SG(12, 1) : SG(13, i - 2), 0.3)); fillRR(-470, y - 38, 940 * u, 76, 14, hexA(C.teal, 0.14), a); fillRR(-470, y - 38, 8, 76, 4, C.teal, a * u); }
      T(String(i + 1), -440, y, { size: 28, fam: "mono", color: "#b4c2d1", a: la, weight: 800 }); codeLine(ln, -400, y, 44, hlLine >= 0 && i !== hlLine ? la * 0.45 : la); }); });
};

// ------------------------------------------------ speed: worst case, a hundred, a million, O(n)
const WORST = [7, 3, 9, 1, 8, 2, 5];
SCENES.speed = (t) => {
  const s0 = SCN.speed.t0, s1 = SCN.speed.t1; if (t < s0 - 0.1 || t > s1 + 0.3) return; const a = P(t, s0, 0.3) * (1 - P(t, s1 - 0.05, 0.3));
  // 1) the target is last: the pointer has to visit every card
  const r1 = 1 - P(t, L0(15) - 0.2, 0.3), scan0 = SG(14, 1) + 0.1, step = Math.max(0.2, (L1(14) - scan0 + 0.15) / 7);
  if (r1 > 0) { let cnt = 0; for (let i = 0; i < 7; i++) { const ft = scan0 + i * step, e = eo(P(t, s0 + i * 0.04, 0.35)); const opened = t >= ft; if (opened) cnt++;
      drawCard(cx(i), ROWY + (1 - e) * 60, 1, { face: P(t, ft, 0.2), val: WORST[i], state: opened ? (i === 6 ? "found" : "no") : "", a: a * r1 * e }); }
    const px = lerp(cx(0), cx(6), clamp((t - scan0) / (6 * step))); pointer(px, ROWY - CH / 2 - 24, a * r1 * P(t, scan0 - 0.3, 0.2));
    const ck = 1 + 0.15 * imp(t, scan0 + (cnt - 1) * step, 0.2); withT(540, ROWY + 210, ck, ck, 0, () => { fillRR(-190, -50, 380, 100, 50, C.tealSoft, a * r1); T(`${cnt} مقارنات`, 0, 3, { size: 50, color: C.navy, a: a * r1 }); }); }
  // 2) 100 elements -> 100 comparisons, a million -> a million
  const r2 = P(t, L0(15) - 0.05, 0.3) * (1 - P(t, L0(16) - 0.15, 0.3));
  if (r2 > 0) { const m = eio(P(t, SG(15, 2), 0.9)), n = Math.round(lerp(100, 1e6, Math.pow(m, 3))), str = n.toLocaleString("en-US"), big = 1 + 0.08 * imp(t, SG(15, 2) + 0.9, 0.4);
    const k1 = pop(t, L0(15), 0.4); withT(540, 720, k1, k1, 0, () => { fillRR(-250, -54, 500, 108, 54, C.navy, a * r2, 18); T(`${str} عنصر`, 0, 4, { size: 52, color: "#fff", a: a * r2 }); });
    arrow(540, 800, 540, 880, C.teal, 8, a * r2 * P(t, L0(15) + 0.4, 0.3), 22);
    const k2 = pop(t, L0(15) + 0.5, 0.45) * big; withT(540, 1020, k2, k2, 0, () => { T(str, 0, 0, { size: n > 99999 ? 150 : 200, color: C.teal, fam: "mono", a: a * r2 }); T("مقارنة", 0, 135, { size: 60, color: C.navy, a: a * r2 }); }); }
  // 3) O(n): time grows in a straight line with the size
  const r3 = P(t, L0(16) - 0.05, 0.3);
  if (r3 > 0) { const k = pop(t, SG(16, 1) - 0.1, 0.45); withT(540, 720, k, k, 0, () => { T("O(n)", 0, 0, { size: 180, color: C.navy, fam: "mono", a: a * r3 * clamp(k * 2) }); });
    const gx = 220, gy = 1420, gw = 640, gh = 420, u = eio(P(t, L0(16) + 0.2, 1.4)); seg(gx, gy, gx + gw + 20, gy, C.mut, 4, a * r3); seg(gx, gy, gx, gy - gh - 20, C.mut, 4, a * r3);
    seg(gx, gy, gx + gw * u, gy - gh * u, C.teal, 9, a * r3); if (u > 0.02) circle(gx + gw * u, gy - gh * u, 14, C.teal, a * r3);
    T("عدد العناصر", gx + gw / 2, gy + 46, { size: 32, color: C.mut, a: a * r3 }); T("الوقت", gx - 20, gy - gh - 40, { size: 32, color: C.mut, a: a * r3, align: "left" }); }
};

// ------------------------------------------------ teaser: sorted list -> 20 steps -> next reel
SCENES.teaser = (t) => {
  const s0 = SCN.teaser.t0, tEnd = TL.total; if (t < s0 - 0.1) return; const a = P(t, s0, 0.3), sorted = [1, 2, 3, 5, 7, 8, 9], o1 = 1 - P(t, L0(18) - 0.2, 0.3);
  if (o1 > 0) { for (let i = 0; i < 7; i++) { const k = pop(t, SG(17, 0) + 0.1 + i * 0.06, 0.4); withT(cx(i), 740, k, k, 0, () => { fillRR(-60, -60, 120, 120, 24, "#ffffff", a * o1 * clamp(k * 2), 16); strokeRR(-60, -60, 120, 120, 24, C.line, 3, a * o1 * clamp(k * 2)); T(String(sorted[i]), 0, 5, { size: 68, color: C.navy, fam: "mono", a: a * o1 * clamp(k * 2) }); }); }
    const tk = pop(t, SG(17, 0) + 0.7, 0.4); withT(540, 875, tk, tk, 0, () => { fillRR(-120, -36, 240, 72, 36, C.tealSoft, a * o1); T("مرتّبة ✓", 0, 2, { size: 38, color: C.teal, a: a * o1 }); });
    const k2 = pop(t, SG(17, 1) + 0.6, 0.5); withT(540, 1130, k2, k2, 0, () => { T("20", 0, 0, { size: 250, color: C.teal, fam: "mono", a: a * o1 * clamp(k2 * 2) }); T("خطوة بس", 0, 150, { size: 60, color: C.navy, a: a * o1 * clamp(k2 * 2) }); });
    const k3 = P(t, SG(17, 2) + 0.2, 0.35); T("من بين 1,000,000 عنصر", 540, 1400, { size: 46, color: C.mut, a: a * o1 * k3 }); }
  if (t > L0(18) - 0.3) { const e = eo(P(t, L0(18) - 0.25, 0.5)); K("wink", 540, 1660 + (1 - e) * 600, 760, { bob: 0.6 });
    const q = pop(t, L0(18) + 0.1, 0.45); withT(540, 690, q, q, 0, () => { circle(0, 0, 120, C.navy, clamp(q * 2), 30); T("؟", 0, 10, { size: 160, color: "#fff", a: clamp(q * 2) }); });
    const p = pop(t, SG(18, 1), 0.45); withT(540, 870, p, p, 0, () => { fillRR(-200, -46, 400, 92, 46, C.teal, clamp(p * 2), 20); T("بالريل الجاي 👀", 0, 4, { size: 44, color: "#fff", a: clamp(p * 2) }); }); }
};
SCENES.order = ["cards", "rule", "code", "speed", "teaser", "khwarizmo"];

// ------------------------------------------------ sound events (soft UI sounds; the voice carries the explanation)
window.collectSfx = () => {
  const e = [], ev = (t, k, v = 0) => e.push({ t: +t.toFixed(3), k, v });
  ev(0.02, "pop"); for (let c = 0; c < 7; c++) ev(0.38 + c * 0.05, "card", c); ev(1.6, "drop"); SWAPS.forEach((_, k) => ev(swapT(k), "swish", k));
  for (let k = 0; k < 5; k++) { ev(L0(4 + k), "flip", k); ev(SG(4 + k, 1), k === 4 ? "found" : "no", k); }
  for (let i = 0; i < 7; i++) ev(L0(3) + 0.15 + i * 0.2, "tick", i); ev(L0(9) + 0.7, "pop"); ev(SG(11, 1), "pop"); ev(SG(11, 3), "pop");
  const scan0 = SG(14, 1) + 0.1, step = Math.max(0.2, (L1(14) - scan0 + 0.15) / 7); for (let i = 0; i < 7; i++) ev(scan0 + i * step, i === 6 ? "found" : "tick", i);
  ev(SG(15, 2), "rise"); ev(SG(16, 1) - 0.1, "pop"); ev(SG(17, 1) + 0.6, "pop"); ev(L0(18) + 0.1, "pop"); ev(SG(18, 1), "found", 9);
  TL.scenes.slice(1).forEach((s) => ev(s.t0, "swish", 9));
  return { total: TL.total, scenes: TL.scenes, events: e.sort((a, b) => a.t - b.t) };
};
