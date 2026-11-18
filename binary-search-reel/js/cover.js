// Unified series cover (1080x1920) for every خوارزموسفير reel: Techno Enjaz mark · series name (hero) · episode number + topic · خوارزمو.
// Per reel only window.COVER changes. Everything that matters sits inside the 4:5 grid crop (y 285..1635).
"use strict";
SCENES.order = [];
const COVER = window.COVER || { ep: 1, title: "البحث الخطي", en: "Linear Search", pose: "angry", poseH: 760 };
let LOGO = null;
window.drawCover = async () => {
  // three things only: the Techno Enjaz mark, the series name, the algorithm's name — centred in the 4:5 grid crop
  if (!LOGO) LOGO = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = "assets/te-logo.png"; });
  const t = 1.6; NOW = t; ctx.setTransform(1, 0, 0, 1, 0, 0); background(t, { focus: [540, 960, 600, 1] });
  const lh = 250, lw = lh * LOGO.width / LOGO.height; halo(540, 700, 300, "rgba(31,181,181,0.18)", 1); A(1); ctx.drawImage(LOGO, 540 - lw / 2, 560, lw, lh);
  T(SERIES, 540, 975, { size: 140, color: C.navy });
  ctx.save(); ctx.font = font(118, 900); const tw = ctx.measureText(COVER.title).width; ctx.restore();
  fillRR(540 - tw / 2 - 14, 1222, tw + 28, 44, 16, hexA(C.teal, 0.22)); T(COVER.title, 540, 1195, { size: 118, color: C.teal });
  T(COVER.en, 540, 1335, { size: 58, color: C.navy, fam: "mono" });
};
