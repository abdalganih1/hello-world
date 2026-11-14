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
