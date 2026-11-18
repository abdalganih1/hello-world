// Reel cover (1080x1920). Everything that matters sits inside the 4:5 grid crop (y 285..1635).
"use strict";
window.EPISODE = 1; SCENES.order = [];
const CW = 130, CH = 180;
function drawCard(x, y, s, o = {}) {
  const { up = false, val = "", state = "", a = 1 } = o;
  withT(x, y, s, s, 0, () => {
    if (!up) { fillRR(-CW / 2, -CH / 2, CW, CH, 20, C.card, a, 22); A(a); rr(-CW / 2, -CH / 2, CW, CH, 20); const g = ctx.createLinearGradient(0, -CH / 2, 0, CH / 2); g.addColorStop(0, C.card2); g.addColorStop(1, C.card); ctx.fillStyle = g; ctx.fill();
      strokeRR(-CW / 2 + 8, -CH / 2 + 8, CW - 16, CH - 16, 14, "rgba(255,255,255,0.14)", 2, a); T("?", 0, 4, { size: 86, color: "#ffffff", a, fam: "mono" }); fillRR(-26, CH / 2 - 22, 52, 7, 4, C.teal, a); }
    else { const bg = state === "found" ? C.teal : state === "no" ? C.redSoft : "#ffffff"; fillRR(-CW / 2, -CH / 2, CW, CH, 20, bg, a, state === "found" ? 40 : 18);
      strokeRR(-CW / 2, -CH / 2, CW, CH, 20, state === "found" ? C.teal : state === "no" ? hexA(C.red, 0.55) : C.line, 3, a);
      T(String(val), 0, 6, { size: 94, color: state === "found" ? "#ffffff" : state === "no" ? hexA(C.red, 0.75) : C.navy, a, fam: "mono" }); }
  });
}
function mark(x, y, yes) { circle(x, y, 26, yes ? C.navy : C.red, 1, 8); if (yes) poly([[-11 + x, y], [-3 + x, 9 + y], [12 + x, -9 + y]], "#fff", 6, 1); else { seg(x - 9, y - 9, x + 9, y + 9, "#fff", 6, 1); seg(x + 9, y - 9, x - 9, y + 9, "#fff", 6, 1); } }
window.drawCover = () => {
  const t = 1.6; NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); background(t, { focus: [690, 990, 420, 1] });
  // series badge, moved down into the crop-safe zone
  ctx.save(); ctx.translate(0, 205); seriesBadge(1.5); ctx.restore();
  // hook line + title
  T("لا تقل أنك مبرمج… قبل أن تعرفها 😬", 540, 468, { size: 50, color: C.navy });
  ctx.save(); ctx.font = font(150, 900); const wT = ctx.measureText("البحث ").width, wH = ctx.measureText("الخطي").width; ctx.restore();
  const full = wT + wH, xR = 540 + full / 2, hx = xR - wT - wH;  // RTL: "البحث" on the right, "الخطي" on the left
  fillRR(hx - 12, 618, wH + 24, 42, 16, hexA(C.teal, 0.22));
  T("البحث", xR - wT / 2 + 10, 600, { size: 150, color: C.navy }); T("الخطي", hx + wH / 2, 600, { size: 150, color: C.teal });
  T("Linear Search", 540, 745, { size: 78, color: C.navy, fam: "mono" });
  // the search: 4 wrong cards, the 5 found, 2 never opened
  const vals = [7, 3, 9, 1, 5, 8, 2], cx = (i) => 108 + 144 * i, Y = 1000;
  halo(cx(4), Y - 16, 260, "rgba(31,181,181,0.30)", 1);
  for (let i = 0; i < 7; i++) drawCard(cx(i), i === 4 ? Y - 16 : Y, 1, { up: i <= 4, val: vals[i], state: i < 4 ? "no" : i === 4 ? "found" : "" });
  for (let i = 0; i < 4; i++) mark(cx(i) + 46, Y - 92, false); mark(cx(4) + 46, Y - 108, true);
  
  for (let i = 0; i < 26; i++) { const an = rnd(i + 3) * 6.2832, r = 150 + rnd(i * 5 + 1) * 120, sy = Y - 16 + Math.sin(an) * r * 0.9; if (Math.abs(sy - Y) < 135 || sy < 800) continue; withT(cx(4) + Math.cos(an) * r * 0.8, sy, 1, 1, an, () => fillRR(-7, -3, 14, 6, 3, [C.teal, C.teal2, C.navy, C.gold][i % 4], 0.85)); }
  // the scan path under the cards: 1 → 5 steps
  const ay = Y + 140; arrow(cx(0) - 30, ay, cx(4) + 10, ay, C.teal, 7, 1, 24);
  for (let i = 0; i <= 4; i++) { circle(cx(i), ay, 22, i === 4 ? C.teal : "#ffffff", 1, 6); ring(cx(i), ay, 22, C.teal, 3, 1); T(String(i + 1), cx(i), ay + 3, { size: 26, fam: "mono", color: i === 4 ? "#fff" : C.teal }); }
  // خوارزمو (thumbs-up) + the complexity chip
  KR("hero", 290, 1640, 470, { bob: 0 });
  withT(770, 1390, 1, 1, -0.04, () => { fillRR(-190, -70, 380, 140, 40, C.navy, 1, 30); T("O(n)", 0, 6, { size: 86, color: "#ffffff", fam: "mono" }); });
  T("أبسط خوارزمية بحث", 770, 1510, { size: 44, color: C.navy });
};
