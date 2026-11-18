// Unified series cover (1080x1920) for every خوارزموسفير reel: Techno Enjaz mark · series name (hero) · episode number + topic · خوارزمو.
// Per reel only window.COVER changes. Everything that matters sits inside the 4:5 grid crop (y 285..1635).
"use strict";
SCENES.order = [];
const COVER = window.COVER || { ep: 1, title: "البحث الخطي", en: "Linear Search", pose: "angry", poseH: 760 };
let LOGO = null;
window.drawCover = async () => {
  if (!LOGO) LOGO = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = "assets/te-logo.png"; });
  const t = 1.6; NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); background(t, { focus: [540, 1260, 540, 1] });
  // 1 · Techno Enjaz: the mark + the name, top centre
  const lh = 92, lw = lh * LOGO.width / LOGO.height; ctx.save(); ctx.font = font(46, 900); const nw = ctx.measureText("تكنو انجاز").width; ctx.restore();
  const gw = lw + 22 + nw, gx = 540 - gw / 2; A(1); ctx.drawImage(LOGO, gx + nw + 22, 330, lw, lh); T("تكنو انجاز", gx + nw / 2, 330 + lh / 2 + 3, { size: 46, color: C.navy });
  // 2 · the series name, big, with its orbit mark
  ctx.save(); ctx.font = font(138, 900); const sw = ctx.measureText(SERIES).width; ctx.restore();
  const sx0 = 540 - 52; // the globe sits on the right of the word (RTL start)
  T(SERIES, sx0, 560, { size: 138, color: C.navy });
  const gxx = sx0 + sw / 2 + 84, gy = 552; circle(gxx, gy, 34, C.teal, 1, 18); A(1); ctx.save(); ctx.translate(gxx, gy); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, 58, 20, 0, 0, 6.2832); ctx.strokeStyle = C.navy; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  circle(gxx + Math.cos(0.6) * 58 * Math.cos(-0.5) - Math.sin(0.6) * 20 * Math.sin(-0.5), gy + Math.cos(0.6) * 58 * Math.sin(-0.5) + Math.sin(0.6) * 20 * Math.cos(-0.5), 9, C.navy, 1);
  // 3 · this episode: number chip + topic (so each cover is still findable in the grid)
  ctx.save(); ctx.font = font(66, 900); const tw = ctx.measureText(COVER.title).width; ctx.restore();
  const cw = 104 + 20 + tw, cx0 = 540 - cw / 2; fillRR(cx0 + tw + 20, 682, 104, 76, 38, C.navy, 1, 10); T("#" + COVER.ep, cx0 + tw + 20 + 52, 722, { size: 44, fam: "mono", color: "#ffffff" });
  fillRR(cx0 - 8, 728, tw + 16, 30, 12, hexA(C.teal, 0.22)); T(COVER.title, cx0 + tw / 2, 716, { size: 66, color: C.teal });
  T(COVER.en, 540, 810, { size: 46, color: C.mut, fam: "mono" });
  // 4 · خوارزمو
  KR(COVER.pose, 540, 1630, COVER.poseH, { bob: 0 });
};
