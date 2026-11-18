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
  // simple and loud: the series badge, one big title, خوارزمو big — nothing else
  const t = 1.6; NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); background(t, { focus: [540, 1250, 520, 1] });
  ctx.save(); ctx.translate(0, 220); seriesBadge(1.5); ctx.restore();
  ctx.save(); ctx.font = font(158, 900); const wT = ctx.measureText("البحث ").width, wH = ctx.measureText("الخطي").width; ctx.restore();
  const xR = 540 + (wT + wH) / 2, hx = xR - wT - wH;
  fillRR(hx - 14, 600, wH + 28, 48, 18, hexA(C.teal, 0.22));
  T("البحث", xR - wT / 2 + 12, 560, { size: 158, color: C.navy }); T("الخطي", hx + wH / 2, 560, { size: 158, color: C.teal });
  T("Linear Search", 540, 715, { size: 64, color: C.mut, fam: "mono" });
  KR("angry", 540, 1625, 860, { bob: 0 });
};
