// Scenes of the Linear Search reel. Times are in beats of each scene: bt(scene, beat) -> seconds.
"use strict";
const N = 7, PITCH = 142, BOXS = 124, WYC = 880, CY = 900, KH = 130;   // world: 7 boxes on a row, camera looks at (fx, WYC)
const bxw = (i) => (i - 3) * PITCH;
const T3 = () => SC.search.t0;
const openT = (k) => T3() + (1 + 3 * k) * BEAT, verdT = (k) => openT(k) + BEAT, hopT = (k) => openT(k) + 2 * BEAT;
const FOUND = () => verdT(4), HIT = 4;
const dropT = (i) => bt("setup", 1 + i * 0.5);

// ------------------------------------------------------------ camera + world
function camAt(t) {
  let fx = 0, z = 1;
  if (t >= T3() && t < SC.rule.t0) {
    const zin = eio(P(t, T3(), BEAT)); z = lerp(1, 2.1, zin); fx = lerp(0, bxw(0), zin);
    for (let k = 0; k < HIT; k++) fx += (bxw(k + 1) - bxw(k)) * eio(P(t, hopT(k), BEAT));
    for (let k = 0; k <= HIT; k++) z += 0.16 * win(t, openT(k) + 0.1, verdT(k) + 0.35, 0.3);
    const f = FOUND(); if (t >= f) { const back2 = eio(P(t, f + 0.5, 1.5 * BEAT)); z = lerp(z + 0.35 * imp(t, f, 0.5), 1.7, back2); }
  }
  return { fx, z };
}
const wx = (cam, x) => 540 + (x - cam.fx) * cam.z, wy = (cam, y) => CY + (y - WYC) * cam.z;
function miniKx(t) { let x = bxw(0); for (let k = 0; k < HIT; k++) x += (bxw(k + 1) - bxw(k)) * eio(P(t, hopT(k), BEAT)); return x; }
function boxState(i, t) { // 0 closed, 1 open, 2 rejected, 3 found
  if (i > HIT || t < openT(i)) return 0; if (t < verdT(i)) return 1; return i === HIT ? 3 : 2;
}
function drawBox(i, cam, t, o = {}) {
  const st = boxState(i, t), s = BOXS * cam.z, a0 = o.a ?? 1; let cx = wx(cam, bxw(i)), cy = wy(cam, WYC);
  // drop-in during setup
  const d = (t - dropT(i)) / 0.5; if (d < 0) return; if (d < 1) cy -= (1 - back(d, 1.4)) * 900; const land = imp(t, dropT(i) + 0.42, 0.3);
  if (st === 2) cx += Math.sin((t - verdT(i)) * 60) * 16 * imp(t, verdT(i), 0.4) * cam.z / 2;
  const wig = t > bt("setup", 8) && t < T3() ? Math.sin(t * 9 + i * 1.3) * 0.05 * win(t, bt("setup", 8), T3(), 0.4) : 0;
  const col = st === 3 ? C.green : st === 2 ? C.red : st === 1 ? "#ffffff" : C.blue, dimA = st === 2 ? lerp(1, 0.5, P(t, verdT(i) + 0.3, 0.5)) : 1;
  const flip = st >= 1 ? P(t, openT(i), 0.32) : 0, fsx = Math.abs(Math.cos(flip * Math.PI)), showNum = flip > 0.5, pp = st >= 1 ? 1 + 0.18 * imp(t, openT(i) + 0.16, 0.4) : 1;
  // floor reflection + light pool
  add(() => { halo(cx, cy + s * 0.62, s * 0.9, hexA(col === "#ffffff" ? C.sky : col, 0.35), a0 * dimA); });
  if (st === 3) add(() => { const r = t * 0.8; for (let k = 0; k < 14; k++) { const an = r + k * 0.4488; poly([[cx, cy], [cx + Math.cos(an) * s * 2.6, cy + Math.sin(an) * s * 2.6], [cx + Math.cos(an + 0.14) * s * 2.6, cy + Math.sin(an + 0.14) * s * 2.6]], null, 0, 0.11 * a0 * P(t, FOUND(), 0.3), true, C.green); } halo(cx, cy, s * 1.7, "rgba(61,242,189,0.5)", a0 * (0.75 + 0.25 * Math.sin(t * 6))); });
  withT(cx, cy + land * 10, (1 + land * 0.1) * pp, (1 - land * 0.12) * pp, wig, () => {
    ctx.save(); ctx.scale(Math.max(0.03, fsx), 1);
    // 3D top face
    const dpt = s * 0.13; poly([[-s / 2, -s / 2], [-s / 2 + dpt, -s / 2 - dpt], [s / 2 + dpt, -s / 2 - dpt], [s / 2, -s / 2]], null, 0, a0 * dimA, true, hexA(col === "#ffffff" ? C.sky : col, 0.35));
    poly([[s / 2, -s / 2], [s / 2 + dpt, -s / 2 - dpt], [s / 2 + dpt, s / 2 - dpt], [s / 2, s / 2]], null, 0, a0 * dimA, true, hexA(col === "#ffffff" ? C.deep : col, 0.22));
    ctx.save(); A(a0 * dimA); ctx.shadowColor = col === "#ffffff" ? C.sky : col; ctx.shadowBlur = (st === 1 || st === 3 ? 46 : 22); rr(-s / 2, -s / 2, s, s, s * 0.14);
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, st === 3 ? "#0a4a40" : st === 2 ? "#3a0f18" : "#0b3a4a"); g.addColorStop(1, st === 3 ? "#031c18" : st === 2 ? "#17060a" : "#031520"); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    strokeRR(-s / 2, -s / 2, s, s, s * 0.14, col, Math.max(3, s * 0.035), a0 * dimA);
    fillRR(-s / 2 + s * 0.08, -s / 2 + s * 0.07, s * 0.84, s * 0.2, s * 0.08, "#ffffff", 0.07 * a0);
    if (!showNum) { const q = 0.8 + 0.2 * Math.sin(t * 3 + i); T("?", 0, s * 0.04, { size: s * 0.56, color: C.sky, a: a0 * q, g: 20, fam: "mono" }); seg(-s * 0.3, -s * 0.26, s * 0.3, -s * 0.26, hexA(C.sky, 0.5), Math.max(2, s * 0.02), a0 * 0.6); }
    else T(String(TL.arr[i]), 0, s * 0.05, { size: s * 0.62, color: st === 3 ? "#e6fffa" : st === 2 ? "#ffb9c0" : "#ffffff", a: a0 * dimA, g: 26, gc: col === "#ffffff" ? C.sky : col, fam: "mono" });
    ctx.restore();
    if (st === 2) { const k = pop(t, verdT(i), 0.3); withT(s * 0.42, -s * 0.42, k, k, 0, () => { circle(0, 0, s * 0.15, C.red, a0); seg(-s * 0.06, -s * 0.06, s * 0.06, s * 0.06, "#fff", s * 0.035, a0); seg(s * 0.06, -s * 0.06, -s * 0.06, s * 0.06, "#fff", s * 0.035, a0); }); }
    if (st === 3) { const k = pop(t, FOUND(), 0.35); withT(s * 0.42, -s * 0.42, k, k, 0, () => { circle(0, 0, s * 0.16, C.green, a0); poly([[-s * 0.07, 0], [-s * 0.02, s * 0.05], [s * 0.08, -s * 0.06]], "#03241c", s * 0.04, a0); }); }
  });
  // index tag
  const ia = P(t, bt("setup", 4.6) + i * 0.07, 0.3) * a0, cur = o.cur === i, ty = wy(cam, WYC) + s * 0.5 + 30 * cam.z;
  if (ia > 0) { const k = cur ? 1.18 + 0.06 * Math.sin(t * 8) : 1; withT(wx(cam, bxw(i)), ty, k, k, 0, () => { fillRR(-22 * cam.z, -15 * cam.z, 44 * cam.z, 30 * cam.z, 8 * cam.z, cur ? C.amber : "rgba(14,52,70,0.9)", ia); T(String(i), 0, 1, { size: 20 * cam.z, fam: "mono", color: cur ? "#0a0f2e" : C.sky, a: ia }); }); }
}
function world(t, o = {}) {
  const cam = camAt(t), a = o.a ?? 1;
  // platform line under the boxes
  const py = wy(cam, WYC) + BOXS * cam.z * 0.5 + 6 * cam.z, x0 = wx(cam, bxw(0) - 100), x1 = wx(cam, bxw(6) + 100), pa = P(t, bt("setup", 0.4), 0.5) * a;
  glow(C.blue, 30, () => seg(x0, py, x0 + (x1 - x0) * eo(P(t, bt("setup", 0.4), 0.7)), py, C.sky, 5 * Math.min(cam.z, 1.6), pa));
  const curI = t >= T3() + BEAT * 0.8 && t < FOUND() + 0.4 ? Math.round((miniKx(t) - bxw(0)) / PITCH) : t >= FOUND() + 0.4 ? HIT : -1;
  for (let i = 0; i < N; i++) drawBox(i, cam, t, { a, cur: curI });
  const la = win(t, bt("setup", 3), T3() + 0.2, 0.3) * a, lk = pop(t, bt("setup", 3), 0.4); if (la > 0) { chip("مصفوفة · Array", 300, 1090, { size: 40, col: C.sky, a: la, sc: lk }); poly([[300, 1014], [280, 1040], [320, 1040]], null, 0, la, true, C.sky); }
  return cam;
}
// خوارزمو while he is on the boxes (world space) + the jump in from the HUD and back out
function miniK(t, cam, hud, outPos) {
  const top = WYC - BOXS / 2 - BOXS * 0.13, f = FOUND();
  if (t < T3()) return false;
  const ji = P(t, T3(), BEAT), jo = P(t, f + 0.35, BEAT * 1.1);
  if (ji < 1) { // jump in: HUD -> box 0
    const e = eio(ji), tx = wx(cam, bxw(0)), ty = wy(cam, top), h = hop(ji);
    K("celebrating", lerp(hud.x, tx, e), lerp(hud.y, ty, e) - h.arc * 420, lerp(hud.h, KH * cam.z, e), { sx: h.sx, sy: h.sy, rot: -0.5 * Math.sin(ji * Math.PI), aura: 1, shadow: 0 }); return true;
  }
  if (jo > 0 && jo < 1) { const e = eio(jo), tx = wx(cam, bxw(HIT)), ty = wy(cam, top), h = hop(jo);
    K("celebrating", lerp(tx, outPos.x, e), lerp(ty, outPos.y, e) - h.arc * 380, lerp(KH * cam.z, outPos.h, e), { sx: h.sx, sy: h.sy, rot: 0.6 * Math.sin(jo * Math.PI), shadow: 0 }); return true; }
  if (jo >= 1) return false;
  let x = miniKx(t), arc = 0, sx = 1, sy = 1, moving = false, rot = 0;
  for (let k = 0; k < HIT; k++) { const u = (t - hopT(k)) / BEAT; if (u > 0 && u < 1) { const h = hop(u); arc = h.arc; sx = h.sx; sy = h.sy; moving = true; rot = 0.16 * Math.sin(u * Math.PI); } }
  let shx = 0; for (let k = 0; k < HIT; k++) shx += Math.sin((t - verdT(k)) * 34) * 9 * imp(t, verdT(k), 0.5);
  for (let k = 0; k <= HIT; k++) { const l = imp(t, openT(k), 0.25); sy *= 1 - 0.12 * l; sx *= 1 + 0.1 * l; }
  const peek = win(t, openT(Math.min(HIT, Math.round((x - bxw(0)) / PITCH))) + 0.05, verdT(Math.min(HIT, Math.round((x - bxw(0)) / PITCH))), 0.2);
  const ki = Math.min(HIT, Math.round((x - bxw(0)) / PITCH)), kx = wx(cam, x), kty = wy(cam, top);
  if (peek > 0) add(() => { const s2 = BOXS * cam.z; poly([[kx - 16, kty - KH * cam.z * 0.5], [kx + 16, kty - KH * cam.z * 0.5], [kx + s2 * 0.5, kty + s2 * 1.1], [kx - s2 * 0.5, kty + s2 * 1.1]], null, 0, 0.16 * peek * (0.7 + 0.3 * Math.sin(t * 30)), true, C.sky); });
  for (let k = 0; k <= HIT; k++) { const em = win(t, verdT(k), verdT(k) + 0.8, 0.15); if (em > 0) { const ek = pop(t, verdT(k), 0.25), col = k === HIT ? C.green : C.red; withT(kx + 86 * cam.z / 2, kty - KH * cam.z * 0.95 - 20 * ek, ek, ek, 0.1, () => { circle(0, 0, 40, "rgba(3,16,24,0.92)", em); glow(col, 16, () => ring(0, 0, 40, col, 5, em)); T(k === HIT ? "!" : "✗", 0, 3, { size: 46, color: col, a: em }); }); } }
  K(t >= f ? "celebrating" : "walking", wx(cam, x) + shx * cam.z / 2, wy(cam, top) - arc * 86 * cam.z - (t >= f ? Math.abs(Math.sin((t - f) * 9)) * 40 : 0), KH * cam.z, { sx, sy, rot: rot + peek * 0.08, bob: moving ? 0 : 1 });
  return true;
}
// pedestal that hides the flat bottom of a bust pose
function bust(name, x, base, h, o = {}) {
  const a = o.a ?? 1, k = o.sc ?? 1; if (a <= 0 || k <= 0) return; const w = h * META[name].w / META[name].h;
  withT(x, base, k, k, o.rot || 0, () => { K(name, 0, 0, h, { a, shadow: 0, bob: 0.5 });
    card(-w * 0.62, -8, w * 1.24, 64, { a, col: C.blue, r: 22, g: 26 }); T(o.label || "خوارزمو", 0, 26, { size: 32, color: C.sky, a, g: 10 }); });
}

// ------------------------------------------------------------ 0. HOOK
SCENES.hook = (t, s) => {
  background(t, { dim: 0.45 }); const b = (t - s.t0) / BEAT;
  // a wall of numbers; a reticle hops over them looking for the amber one
  const cols = 8, rows = 15, cw = 124, ch = 96, x0 = 106, y0 = 470, tgt = 59, hopN = Math.max(0, Math.floor((b - 2) * 2)), seq = [9, 22, 14, 37, 30, 51, 44, 62, 70, 59, 59, 59, 59, 59, 59];
  const curCell = b >= 2 ? seq[Math.min(seq.length - 1, hopN)] : -1, lock = b >= 6.5;
  for (let i = 0; i < cols * rows; i++) { const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch + Math.sin(t * 1.2 + i) * 4, v = Math.floor(rnd(i + 3) * 99), is = i === tgt;
    const a = P(t, s.t0 + 0.25 + rnd(i) * 0.9, 0.4) * (is ? 0.95 : 0.22 + 0.2 * rnd(i + 8)) * (i === curCell ? 2.2 : 1);
    T(String(is ? 42 : v), cx, cy, { size: 46, fam: "mono", color: is ? C.green : "#fff", a: clamp(a * 1.3), g: is ? 26 : 0 }); }
  if (curCell >= 0) { const cx = x0 + (curCell % cols) * cw, cy = y0 + Math.floor(curCell / cols) * ch, k = 1 + 0.35 * imp(t, s.t0 + (2 + hopN / 2) * BEAT, 0.2), col = lock ? C.green : C.cyan;
    add(() => { glow(col, 24, () => { strokeRR(cx - 52 * k, cy - 40 * k, 104 * k, 80 * k, 16, col, 5, 1); }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => seg(cx + dx * 66 * k, cy + dy * 52 * k, cx + dx * 46 * k, cy + dy * 52 * k, col, 5, 1)); });
    if (lock) { shock(cx, cy, s.t0 + 6.5 * BEAT, { r: 420, col: "#b8fff0" }); } }
  A(1); const g = ctx.createLinearGradient(0, 1040, 0, 1500); g.addColorStop(0, "rgba(22,36,110,0)"); g.addColorStop(1, "rgba(22,36,110,0.9)"); ctx.fillStyle = g; ctx.fillRect(0, 1040, W, 880);
  header(["كيف الكمبيوتر بيلاقي", "رقم واحد بين آلاف الأرقام؟"], bt("hook", 0.5), s.t1, { colors: { "واحد": C.amber, "آلاف": C.cyan } });
  const kp = pop(t, bt("hook", 1), 0.55); bust("thinking", 540, 1560 + (1 - kp) * 300, 520, { a: clamp(kp * 2), rot: Math.sin(t * 1.6) * 0.03 });
  for (let i = 0; i < 3; i++) { const an = t * 1.5 + i * 2.1, a = P(t, bt("hook", 1.6 + i * 0.4), 0.3); T("؟", 540 + Math.cos(an) * 300, 1190 + Math.sin(an * 1.3) * 90, { size: 76 + i * 14, color: i === 1 ? C.amber : C.cyan, a: a * 0.9, g: 22 }); }
  cut(t, s.t1);
};

// ------------------------------------------------------------ 1. TITLE
SCENES.title = (t, s) => {
  background(t); cut(t, s.t0); const b = (t - s.t0) / BEAT;
  FX.shake = 14 * imp(t, s.t0, 0.45); FX.chroma = 9 * imp(t, s.t0, 0.5);
  add(() => { const r = t * 0.25; for (let k = 0; k < 18; k++) { const an = r + k * 0.349; poly([[540, 1250], [540 + Math.cos(an) * 1500, 1250 + Math.sin(an) * 1500], [540 + Math.cos(an + 0.09) * 1500, 1250 + Math.sin(an + 0.09) * 1500]], null, 0, 0.05, true, C.sky); } halo(540, 1250, 720, "rgba(31,200,204,0.4)", 1); });
  shock(540, 520, s.t0, { r: 900 });
  const k1 = pop(t, s.t0 + 0.02, 0.5); withT(540, 400, k1, k1, 0, () => T("Linear Search", 0, 0, { size: 112, fam: "mono", color: "#fff", g: 40, gc: C.blue, a: clamp(k1 * 2), stroke: 12 }));
  const sw = P(t, bt("title", 1), 0.9); if (sw > 0 && sw < 1) add(() => { const x = lerp(60, 1020, sw), g = ctx.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); A(Math.sin(sw * Math.PI)); ctx.fillStyle = g; ctx.fillRect(x - 90, 330, 180, 150); });
  TW("البحث الخطّي", 540, 575, bt("title", 1), { size: 132, g: 44, gc: "rgba(79,230,205,0.8)", colors: { "الخطّي": C.cyan }, stroke: 14 });
  chip("أبسط خوارزمية بحث 🔎", 540, 760, { size: 44, col: C.amber, sc: pop(t, bt("title", 3), 0.45), a: P(t, bt("title", 3), 0.2) });
  const kp = eo5(P(t, bt("title", 1.5), 0.7)), h = hop(P(t, bt("title", 1.5), 0.7)); K("hero", 540, 1680 + (1 - kp) * 900, 800, { a: 1, sx: 1 + 0.08 * imp(t, bt("title", 1.5) + 0.62, 0.3), sy: 1 - 0.08 * imp(t, bt("title", 1.5) + 0.62, 0.3) });
  burst(540, 1650, bt("title", 1.5) + 0.62, { n: 30, r: 480, grav: -200, col: [C.sky, "#fff", C.cyan] });
  const np = pop(t, bt("title", 4.5), 0.45); withT(250, 1090, np, np, -0.06, () => { card(-150, -46, 300, 92, { col: C.cyan, a: clamp(np * 2), r: 46 }); T("أنا خوارزمو 👋", 0, 4, { size: 40, a: clamp(np * 2) }); });
  cut(t, s.t1);
};

// ------------------------------------------------------------ 2. SETUP  (+ shared HUD pieces)
const HUDK = { x: 790, y: 1670, h: 640 };
function targetCard(t, a, k = 1, x = 540, y = 610) { if (a <= 0) return; withT(x, y, k, k, 0, () => { card(-280, -130, 560, 260, { col: C.amber, a }); T("المطلوب", 120, -56, { size: 50, color: C.amber, a }); T("target", 120, 40, { size: 34, fam: "mono", color: C.mut, a });
  fillRR(-235, -90, 190, 180, 30, "rgba(24,28,78,0.92)", a); glow(C.amber, 30, () => strokeRR(-235, -90, 190, 180, 30, C.amber, 5, a)); T(String(TL.target), -140, 8, { size: 130, fam: "mono", color: "#f0f1ff", a, g: 30, gc: C.amber }); }); }
SCENES.setup = (t, s) => {
  background(t); cut(t, s.t0); const cam = world(t);
  for (let i = 0; i < N; i++) { FX.shake = Math.max(FX.shake, 6 * imp(t, dropT(i) + 0.42, 0.2)); burst(wx(cam, bxw(i)), wy(cam, WYC) + 70, dropT(i) + 0.42, { n: 8, r: 120, size: 6, grav: -60, dur: 0.5, col: [C.sky, "#fff"], seed: i * 11 }); }
  header(["عنا 7 صناديق مسكّرة 📦"], bt("setup", 0.5), bt("setup", 5), { colors: { "7": C.amber } });
  header(["وبدنا نلاقي الرقم 5"], bt("setup", 5), bt("setup", 8.5), { colors: { "5": C.amber } });
  header(["ما منعرف شو جوّاتها…", "لازم نفتحها وحدة وحدة!"], bt("setup", 8.5), s.t1 + 0.1, { colors: { "وحدة": C.cyan } });
  const kp = pop(t, bt("setup", 0.6), 0.55); K("presenting", HUDK.x, HUDK.y + (1 - kp) * 500, HUDK.h, { a: clamp(kp * 2) });
  const tp = P(t, bt("setup", 5.2), 0.5), land = imp(t, bt("setup", 5.2) + 0.45, 0.3); if (tp > 0) { ctx.save(); ctx.translate(0, -(1 - back(tp, 1.3)) * 900); targetCard(t, 1, 1 + 0.06 * land); ctx.restore(); }
  shock(540, 610, bt("setup", 5.2) + 0.45, { r: 420, col: "#cfd4ff", lw: 14 }); FX.shake = Math.max(FX.shake, 9 * land);
  const bp = pop(t, bt("setup", 8.7), 0.45); withT(300, 1400, bp, bp, -0.04, () => { card(-230, -80, 460, 160, { col: C.cyan, a: clamp(bp * 2), r: 44 }); T("شو في جوّاتها؟ 🤔", 0, 4, { size: 46, a: clamp(bp * 2) }); poly([[226, -20], [270, 0], [226, 24]], null, 0, clamp(bp * 2), true, C.cyan); });
};

// ------------------------------------------------------------ 3. SEARCH
function compareHUD(t, a) {
  if (a <= 0) return; let k = -1; for (let i = 0; i <= HIT; i++) if (t >= openT(i) - 0.02) k = i;
  const y = 1385; card(70, 1260, 940, 250, { col: C.blue, a });
  // target tile (right) and value tile (left), like the code: arr[i] == target
  T("arr[i]", 250, 1300, { size: 30, fam: "mono", color: C.mut, a }); T("target", 830, 1300, { size: 30, fam: "mono", color: C.mut, a });
  fillRR(745, 1325, 170, 150, 26, "rgba(24,28,78,0.92)", a); glow(C.amber, 24, () => strokeRR(745, 1325, 170, 150, 26, C.amber, 5, a)); T(String(TL.target), 830, y + 22, { size: 104, fam: "mono", color: "#f0f1ff", a, g: 24, gc: C.amber });
  const v = k >= 0 ? verdT(k) : 1e9, decided = t >= v, yes = decided && k === HIT, col = !decided ? C.sky : yes ? C.green : C.red;
  fillRR(165, 1325, 170, 150, 26, "rgba(7,34,48,0.95)", a); glow(col, 24, () => strokeRR(165, 1325, 170, 150, 26, col, 5, a));
  if (k >= 0) { const p = pop(t, openT(k) + 0.14, 0.3); withT(250, y + 22, p, p, 0, () => T(String(TL.arr[k]), 0, 0, { size: 104, fam: "mono", color: "#fff", a: a * clamp(p * 2), g: 24, gc: col })); } else T("?", 250, y + 22, { size: 96, fam: "mono", color: C.dim, a });
  // the operator: == while thinking, then ≠ or =
  const pulse = k >= 0 && !decided ? 1 + 0.12 * Math.sin((t - openT(k)) * 22) : 1, vk = decided ? 1 + 0.5 * imp(t, v, 0.35) : 1;
  withT(540, y + 14, pulse * vk, pulse * vk, 0, () => T(!decided ? "==" : yes ? "=" : "≠", 0, 0, { size: 110, fam: "mono", color: col, a, g: 30 }));
  if (k >= 0 && !decided) T("؟", 540, y - 62, { size: 44, color: C.sky, a: a * (0.6 + 0.4 * Math.sin(t * 12)) });
  if (decided) { const p = pop(t, v, 0.3); chip(yes ? "هو! ✓" : "مش هو ✗", 540, 1290, { size: 34, col, sc: p, a: a * clamp(p * 2) }); }
}
function miniMap(t, a, y = 1575) {
  if (a <= 0) return; let cnt = 0; for (let i = 0; i <= HIT; i++) if (t >= verdT(i)) cnt++;
  for (let i = 0; i < N; i++) { const st = boxState(i, t), x = 302 + i * 68, col = st === 3 ? C.green : st === 2 ? C.red : st === 1 ? "#fff" : C.dim, k = st === 1 ? 1.15 + 0.08 * Math.sin(t * 10) : 1;
    withT(x + 28, y, k, k, 0, () => { fillRR(-28, -28, 56, 56, 12, st === 0 ? "rgba(8,32,46,0.9)" : hexA(col === "#fff" ? C.sky : col, 0.28), a); strokeRR(-28, -28, 56, 56, 12, col, 3, a); T(st === 0 ? "·" : String(TL.arr[i]), 0, 2, { size: 30, fam: "mono", color: st === 0 ? C.dim : "#fff", a }); }); }
  const p = 1 + 0.35 * Math.max(...[0, 1, 2, 3, 4].map((i) => imp(t, verdT(i), 0.3)));
  T("عدد المقارنات:", 640, 1650, { size: 38, color: "#fff", a, align: "center", stroke: 8 }); withT(446, 1650, p, p, 0, () => T(String(cnt), 0, 2, { size: 58, fam: "mono", color: C.green, a, stroke: 8 }));
}
const OUTK = { x: 850, y: 1660, h: 500 };
SCENES.search = (t, s) => {
  const f = FOUND(), cam0 = camAt(t); background(t, { par: cam0.fx / 300 });
  const cam = world(t);
  for (let k = 0; k <= HIT; k++) { // light burst when a box opens
    const x = wx(cam, bxw(k)), y = wy(cam, WYC); shock(x, y, openT(k) + 0.12, { r: 260 * cam.z / 2, lw: 12, dur: 0.45 }); burst(x, y, openT(k) + 0.14, { n: 14, r: 220, size: 7, dur: 0.6, col: ["#fff", C.sky], seed: k * 5 });
    if (k < HIT) { FX.shake = Math.max(FX.shake, 12 * imp(t, verdT(k), 0.3)); add(() => { A(0.22 * imp(t, verdT(k), 0.35)); ctx.fillStyle = C.red; ctx.fillRect(0, 0, W, H); }); }
  }
  // found: big payoff
  if (t >= f) { const x = wx(cam, bxw(HIT)), y = wy(cam, WYC); shock(x, y, f, { r: 1300, dur: 0.9, col: "#d0fff4", lw: 40 }); shock(x, y, f + 0.12, { r: 900, dur: 0.8, col: "#d8fff4" }); burst(x, y, f, { n: 90, r: 900, size: 13, dur: 1.6, grav: 500 });
    FX.shake = Math.max(FX.shake, 26 * imp(t, f, 0.55)); FX.chroma = 14 * imp(t, f, 0.6); FX.flash = 0.42 * imp(t, f, 0.3); FX.flashCol = "#e6fffa"; confetti(f + 0.2); }
  miniK(t, cam, HUDK, OUTK);
  if (t >= f + 0.35 + BEAT * 1.1) { const j = Math.abs(Math.sin((t - f) * 7.2)); K("celebrating", OUTK.x, OUTK.y - j * 70, OUTK.h, { sy: 1 + 0.05 * j, sx: 1 - 0.03 * j }); }
  // captions
  header(["منبلّش من أول صندوق"], s.t0 + 0.1, hopT(0), { colors: { "أول": C.cyan } });
  header(["مش هو؟ عاللي بعده ➜"], hopT(0), hopT(1), { colors: { "هو؟": C.red } });
  header(["وكمان مش هو…"], hopT(1), hopT(2));
  header(["خانة… خانة…", "بالترتيب"], hopT(2), verdT(HIT) - 0.05, { colors: { "بالترتيب": C.cyan } });
  header(["لقيناه! 🎉"], f, f + 4 * BEAT, { size: 110, colors: { "لقيناه!": C.green } });
  header(["بالخانة رقم 4", "وبعد 5 مقارنات بس"], f + 4 * BEAT, s.t1 + 0.1, { colors: { "4": C.amber, "5": C.amber } });
  // HUD
  const tm = eio(P(t, s.t0, 0.5)); if (tm < 1) targetCard(t, 1 - ei(tm), lerp(1, 0.4, tm), lerp(540, 830, tm), lerp(610, 1400, tm));
  const sb = 1 - P(t, s.t0, 0.25); if (sb > 0) withT(300, 1400, sb, sb, -0.04, () => { card(-230, -80, 460, 160, { col: C.cyan, a: sb, r: 44 }); T("شو في جوّاتها؟ 🤔", 0, 4, { size: 46, a: sb }); });
  const ha = P(t, s.t0 + 0.3, 0.35) * (1 - P(t, f + 0.9, 0.3)); compareHUD(t, ha); miniMap(t, ha);
  const ra = P(t, f + 1.1, 0.35); if (ra > 0) { const k = pop(t, f + 1.1, 0.5); withT(350, 1430, k, k, 0, () => { card(-290, -150, 580, 300, { col: C.green, a: ra, g: 40 });
    T("return", -150, -78, { size: 44, fam: "mono", color: C.violet, a: ra }); T("4", 20, -78, { size: 64, fam: "mono", color: C.amber, a: ra, g: 20 }); T("✓", 150, -80, { size: 60, color: C.green, a: ra });
    seg(-230, -20, 230, -20, hexA(C.green, 0.4), 2, ra); T("مكان الرقم = الخانة 4", 0, 34, { size: 40, a: ra }); T("5 مقارنات", 0, 100, { size: 40, color: C.amber, a: ra * P(t, f + 4 * BEAT, 0.3) }); }); }
  cut(t, s.t1);
};

// ------------------------------------------------------------ 4. RULE
SCENES.rule = (t, s) => {
  background(t); cut(t, s.t0); world(t, { a: 0.16 });
  header(["الخوارزمية كلها", "بـ 3 خطوات"], s.t0 + 0.1, s.t1, { colors: { "3": C.amber } });
  const R = [["1", "ابدأ من أول عنصر", "i = 0", C.cyan], ["2", "قارنه بالمطلوب", "arr[i] == target", C.amber], ["3", "هو؟ وقّف ✓  ·  مش هو؟ كمّل ➜", "i = i + 1", C.green]];
  R.forEach(([n, ar, code, col], i) => { const t0 = bt("rule", 1 + i * 2.5), u = P(t, t0, 0.45); if (u <= 0) return; const y = 560 + i * 215, e = back(u, 1.5), hi = 1 + 0.05 * imp(t, bt("rule", 9 + i * 0.75), 0.4);
    withT(540 + (1 - e) * (i % 2 ? -700 : 700), y, hi, hi, 0, () => { card(-470, -92, 940, 184, { col, a: clamp(u * 2) });
      circle(385, 0, 54, hexA(col, 0.22), 1); glow(col, 20, () => ring(385, 0, 54, col, 5, 1)); T(n, 385, 4, { size: 64, fam: "mono", color: "#fff" });
      T(ar, 300, -30, { size: i === 2 ? 38 : 46, align: "right" }); T(code, 300, 40, { size: 32, fam: "mono", color: col, align: "right" }); });
    burst(540, y, t0 + 0.3, { n: 14, r: 520, size: 7, dur: 0.6, col: [col, "#fff"], seed: i * 7 }); FX.shake = Math.max(FX.shake, 7 * imp(t, t0 + 0.3, 0.25)); });
  const kp = pop(t, s.t0 + 0.2, 0.5); K("idea", 850, 1660 + (1 - kp) * 500, 520, { a: clamp(kp * 2) });
  add(() => halo(928, 1245, 150, "rgba(200,255,240,0.5)", clamp(kp) * (0.6 + 0.4 * Math.sin(t * 9))));
  const la = P(t, bt("rule", 1), 0.4); if (la > 0) { const per = 4 * BEAT, l0 = bt("rule", 1) + Math.floor(Math.max(0, t - bt("rule", 1)) / per) * per; ctx.save(); ctx.globalAlpha = 1; ctx.translate(-30, 0);
    card(70, 1255, 620, 150, { col: C.blue, a: la, r: 28 }); caseRow(t, 1330, 4, l0 + 0.15, BEAT * 0.5, C.green); ctx.restore(); }
  const cp = pop(t, bt("rule", 8.5), 0.45); withT(330, 1520, cp, cp, -0.03, () => { card(-250, -80, 500, 160, { col: C.sky, a: clamp(cp * 2), r: 40 }); T("بسيطة… صح؟ 😉", 0, 4, { size: 50, a: clamp(cp * 2) }); });
  cut(t, s.t1);
};

// ------------------------------------------------------------ 5. CODE
const CODE = ["def linear_search(arr, target):", "    for i in range(len(arr)):", "        if arr[i] == target:", "            return i", "    return -1"];
const KW = { def: C.violet, for: C.violet, in: C.violet, if: C.violet, return: "#c3a6ff", range: C.cyan, len: C.cyan, linear_search: C.sky, target: C.amber };
function codeLine(s, n, x, y, size, a) { // syntax-coloured, first n characters
  let cx = x, used = 0; const cw = measure("M", size, 800, "mono");
  for (const tok of s.split(/(\W)/)) { if (!tok) continue; const take = clamp(n - used, 0, tok.length); if (take > 0) T(tok.slice(0, take), cx, y, { size, fam: "mono", align: "left", color: KW[tok] || (/^-?\d+$/.test(tok) ? C.amber : "#dbe8ff"), a }); cx += cw * tok.length; used += tok.length; }
  return x + cw * Math.min(n, s.length);
}
const typeT0 = () => bt("code", 1), typeDur = () => 6.2 * BEAT, runT = (k) => bt("code", 9 + k);
SCENES.code = (t, s) => {
  background(t); cut(t, s.t0);
  header(["وبالكود؟"], s.t0 + 0.15, bt("code", 8), { size: 84, colors: { "وبالكود؟": C.cyan } }); header(["يلا نشغّله ▶"], bt("code", 8), s.t1, { size: 78 });
  const ep = pop(t, s.t0 + 0.1, 0.5); const total = CODE.join("").length, prog = clamp((t - typeT0()) / typeDur()) * total;
  withT(540, 800, ep, ep, 0, () => { card(-490, -330, 980, 600, { col: C.blue, fill: "rgba(3,14,22,0.95)", r: 34, a: clamp(ep * 2) });
    fillRR(-490, -330, 980, 70, 34, "rgba(14,52,70,0.7)", 1); [C.red, C.violet, C.green].forEach((c, i) => circle(-440 + i * 40, -295, 12, c, 1)); T("linear_search.py", 0, -293, { size: 30, fam: "mono", color: C.mut });
    let used = 0, runLine = -1, it = -1; for (let k = 0; k <= HIT; k++) if (t >= runT(k)) { it = k; runLine = t >= runT(k) + BEAT * 0.5 ? 2 : 1; } if (it === HIT && t >= runT(HIT) + BEAT) runLine = 3;
    CODE.forEach((ln, i) => { const y = -205 + i * 92, n = Math.floor(prog - used); used += ln.length;
      if (i === runLine) { const col = runLine === 3 ? C.green : runLine === 2 ? C.amber : C.sky; fillRR(-470, y - 40, 940, 80, 14, hexA(col, 0.2), 1); glow(col, 16, () => fillRR(-470, y - 40, 8, 80, 4, col, 1)); }
      T(String(i + 1), -462, y, { size: 24, fam: "mono", color: C.dim, align: "left" });
      const ex = codeLine(ln, n, -420, y, 43, 1); if (n >= 0 && n < ln.length && t < typeT0() + typeDur() && Math.floor(t * 8) % 2 === 0) fillRR(ex + 3, y - 24, 16, 46, 3, C.sky, 1); });
    if (it >= 0) { const k = pop(t, runT(it), 0.25); chip(`i = ${it}`, 370, -293, { size: 30, fam: "mono", col: C.amber, sc: k }); }
  });
  // run strip: the array being walked while the code runs
  const ra = P(t, bt("code", 8), 0.4); if (ra > 0) { for (let i = 0; i < N; i++) { const x = 122 + i * 120, y = 1165; let col = C.blue, fillc = "rgba(7,34,48,0.95)", kk = 1;
      const cur = t >= runT(i) && (i === HIT || t < runT(i + 1)) && i <= HIT; if (i <= HIT && t >= runT(i) + BEAT * 0.5) { col = i === HIT ? C.green : C.red; fillc = hexA(col, 0.25); } if (cur) kk = 1.14 + 0.05 * Math.sin(t * 12);
      withT(x, y, kk * pop(t, bt("code", 8) + i * 0.05, 0.35), kk, 0, () => { fillRR(-50, -50, 100, 100, 18, fillc, ra); glow(col, cur ? 30 : 10, () => strokeRR(-50, -50, 100, 100, 18, cur && col === C.blue ? "#fff" : col, 4, ra)); T(String(TL.arr[i]), 0, 3, { size: 52, fam: "mono", color: "#fff", a: ra }); T(String(i), 0, 78, { size: 26, fam: "mono", color: cur ? C.green : "#fff", a: ra }); }); }
    const rt = runT(HIT) + BEAT; if (t >= rt) { shock(122 + HIT * 120, 1165, rt, { r: 320, col: "#d0fff4", lw: 14 }); burst(122 + HIT * 120, 1165, rt, { n: 26, r: 380, size: 8, dur: 0.9 }); FX.shake = 10 * imp(t, rt, 0.3); const k = pop(t, rt, 0.45); chip("النتيجة: 4 ✓", 350, 1450, { size: 52, col: C.green, sc: k, a: clamp(k * 2) }); } }
  const kp = pop(t, s.t0 + 0.4, 0.5), typing = t > typeT0() && t < typeT0() + typeDur(); K("working", 850, 1670 + (1 - kp) * 500, 390, { a: clamp(kp * 2), rot: typing ? Math.sin(t * 16) * 0.012 : 0 });
  const lp = pop(t, bt("code", 4), 0.4) * (1 - P(t, bt("code", 7.6), 0.3)); chip("5 سطور بس! 🐍", 350, 1450, { size: 48, col: C.amber, sc: lp, a: clamp(lp * 2) });
  cut(t, s.t1);
};

// ------------------------------------------------------------ 6. SPEED (best / worst case)
function caseRow(t, y, hit, t0, step, col) { // small array walked up to `hit`
  let cnt = 0; for (let i = 0; i < N; i++) { const x = 110 + i * 84, at = t0 + i * step, seen = i <= hit && t >= at, is = i === hit, k = seen && (is || t < at + step) ? 1.16 : 1; if (seen) cnt++;
    const c = !seen ? C.dim : is ? C.green : C.red; withT(x, y, k, k, 0, () => { fillRR(-34, -34, 68, 68, 14, seen ? hexA(c, 0.25) : "rgba(7,30,44,0.9)", 1); glow(seen ? c : "#000", seen ? 16 : 0, () => strokeRR(-34, -34, 68, 68, 14, c, 3, 1)); T(is ? "5" : "·", 0, 2, { size: 36, fam: "mono", color: is ? C.amber : C.dim, a: 1 }); }); }
  return cnt;
}
const bestT = () => bt("speed", 2.5), worstT = () => bt("speed", 6), wStep = () => BEAT * 0.5, milT = () => bt("speed", 10.5);
SCENES.speed = (t, s) => {
  background(t); cut(t, s.t0);
  header(["قدّيش سريعة؟ ⏱"], s.t0 + 0.15, s.t1, { size: 84, colors: { "سريعة؟": C.cyan } });
  const a1 = pop(t, bt("speed", 1), 0.45); withT(540, 630, a1, a1, 0, () => { ctx.translate(-540, -630); card(50, 470, 980, 320, { col: C.green, a: clamp(a1 * 2) }); T("أحسن حالة 😎", 990, 530, { size: 46, color: C.green, align: "right" }); T("الرقم بأول صندوق", 990, 592, { size: 32, color: C.mut, align: "right" });
    const c = caseRow(t, 700, 0, bestT(), 1, C.green); const p = pop(t, bestT(), 0.4); withT(820, 690, p, p, 0, () => { T("O(1)", 0, 0, { size: 84, fam: "mono", color: C.green, g: 26, a: clamp(p * 2) }); T("مقارنة وحدة", 0, 62, { size: 30, a: clamp(p * 2) }); }); });
  shock(110, 700, bestT(), { r: 300, col: "#d0fff4", lw: 12 });
  const a2 = pop(t, bt("speed", 4.5), 0.45); withT(540, 990, a2, a2, 0, () => { ctx.translate(-540, -990); card(50, 830, 980, 320, { col: C.red, a: clamp(a2 * 2) }); T("أسوأ حالة 😰", 990, 890, { size: 46, color: C.red, align: "right" }); T("الرقم بآخر صندوق… أو مش موجود", 990, 952, { size: 32, color: C.mut, align: "right" });
    const c = caseRow(t, 1060, 6, worstT(), wStep(), C.red); const done = t >= worstT() + 6 * wStep(), p = pop(t, worstT() + 6 * wStep(), 0.4);
    if (!done && t >= worstT()) T(String(c), 820, 1050, { size: 84, fam: "mono", color: C.amber, g: 20 }); withT(820, 1050, p, p, 0, () => { T("O(n)", 0, 0, { size: 84, fam: "mono", color: C.red, g: 26, a: clamp(p * 2) }); T("n مقارنة", 0, 62, { size: 30, a: clamp(p * 2) }); }); });
  FX.shake = 8 * imp(t, worstT() + 6 * wStep(), 0.3);
  // one million
  const mp = pop(t, bt("speed", 10), 0.45); if (mp > 0) { const u = ei(P(t, milT(), 3.4 * BEAT)), v = Math.floor(u * 1e6), end = milT() + 3.4 * BEAT;
    withT(360, 1400, mp, mp, 0, () => { card(-300, -170, 600, 340, { col: C.amber, a: clamp(mp * 2) }); T("مليون عنصر؟ 😱", 0, -105, { size: 50, a: clamp(mp * 2) });
      T(v.toLocaleString("en-US"), 0, -5, { size: 82, fam: "mono", color: u >= 1 ? C.red : C.amber, g: 24, a: clamp(mp * 2) }); T("مقارنة!", 0, 72, { size: 40, color: u >= 1 ? C.red : C.text, a: clamp(mp * 2) });
      fillRR(-250, 118, 500, 18, 9, "rgba(30,70,90,0.8)", 1); glow(C.amber, 14, () => fillRR(-250, 118, 500 * u, 18, 9, u >= 1 ? C.red : C.amber, 1)); });
    FX.shake = Math.max(FX.shake, 4 * u * (u < 1 ? 1 : 0) + 18 * imp(t, end, 0.4)); FX.chroma = 10 * imp(t, end, 0.5); shock(360, 1400, end, { r: 700, col: "#ffd0d0" });
    const bp = pop(t, bt("speed", 10.3), 0.4); bust("surprised", 850, 1590, 400, { a: clamp(bp * 2), sc: 0.8 + 0.2 * bp, rot: Math.sin(t * 30) * 0.02 * u }); }
  const k0 = pop(t, s.t0 + 0.3, 0.5), kout = 1 - P(t, bt("speed", 10.2), 0.15); if (kout > 0) { bust("thinking", 850, 1590 + (1 - k0) * 400, 400, { a: clamp(k0 * 2) * kout, rot: Math.sin(t * 1.8) * 0.03 });
    const qp = pop(t, bt("speed", 1.5), 0.45) * (1 - P(t, bt("speed", 9.8), 0.2)); withT(350, 1400, qp, qp, -0.03, () => { card(-270, -110, 540, 220, { col: C.cyan, a: clamp(qp * 2), r: 44 }); T("كم مقارنة", 0, -38, { size: 54, a: clamp(qp * 2) }); T("منحتاج لنلاقيه؟", 0, 42, { size: 46, color: C.cyan, a: clamp(qp * 2) }); poly([[266, -20], [310, 0], [266, 24]], null, 0, clamp(qp * 2), true, C.cyan); }); }
  cut(t, s.t1);
};

// ------------------------------------------------------------ 7. FINALE
SCENES.finale = (t, s) => {
  const b = (t - s.t0) / BEAT, tz = bt("finale", 6), te = bt("finale", 10.5); background(t, { dim: t >= tz && t < te ? 0.3 : 0 }); cut(t, s.t0);
  if (t < tz + 0.2) {
    const out = 1 - P(t, tz - 0.15, 0.3); header(["إيمتى منستعملها؟"], s.t0 + 0.15, tz, { size: 80, colors: { "إيمتى": C.cyan } });
    [["القائمة صغيرة", "كم عنصر… وخلصنا", C.green], ["البيانات مش مرتّبة", "ما في طريقة غيرها", C.cyan]].forEach(([a1, a2, col], i) => { const t0 = bt("finale", 1.5 + i * 1.5), u = P(t, t0, 0.45), e = back(u, 1.5); if (u <= 0) return;
      withT(540 + (1 - e) * (i ? -800 : 800), 620 + i * 230, 1, 1, 0, () => { card(-470, -95, 940, 190, { col, a: out }); circle(370, 0, 56, hexA(col, 0.25), out); glow(col, 20, () => ring(370, 0, 56, col, 5, out)); poly([[346, 0], [362, 18], [396, -20]], "#fff", 9, out); T(a1, 280, -30, { size: 54, align: "right", a: out }); T(a2, 280, 40, { size: 34, color: C.mut, align: "right", a: out }); });
      burst(540, 620 + i * 230, t0 + 0.3, { n: 14, r: 500, size: 7, dur: 0.6, col: [col, "#fff"], seed: i * 3 }); });
    const kp = pop(t, s.t0 + 0.3, 0.5); K("presenting", 760, 1670 + (1 - kp) * 500, 680, { a: clamp(kp * 2) * out });
  }
  if (t >= tz && t < te + 0.2) { // teaser
    const out = 1 - P(t, te - 0.12, 0.2); FX.chroma = Math.max(8 * imp(t, tz, 0.5), 6 * imp(t, bt("finale", 8), 0.4)); FX.shake = 12 * imp(t, tz, 0.35);
    header(["بس للقوائم الكبيرة…", "في خوارزمية أسرع بكتير ⚡"], tz + 0.05, te, { colors: { "أسرع": C.amber, "بكتير": C.amber } });
    const gp = P(t, bt("finale", 8), 0.5), gl = imp(t, bt("finale", 8), 0.5); if (gp > 0) { const k = pop(t, bt("finale", 8), 0.4);
      withT(540, 760, k, k, 0, () => { add(() => { T("Binary Search", -10 * gl - 3, 0, { size: 104, fam: "mono", color: "#7f8cf2", a: 0.8 * out }); T("Binary Search", 10 * gl + 3, 0, { size: 104, fam: "mono", color: "#3df2bd", a: 0.8 * out }); }); T("Binary Search", 0, 0, { size: 104, fam: "mono", color: "#fff", g: 30, gc: C.violet, a: out }); });
      for (let i = 0; i < 6; i++) { const y = 700 + rnd(i + Math.floor(t * 14)) * 130; fillRR(60 + rnd(i * 3 + Math.floor(t * 14)) * 700, y, 120 + rnd(i) * 200, 6, 0, i % 2 ? "#3df2bd" : "#7f8cf2", 0.5 * gl * out); } }
    const cp = pop(t, bt("finale", 9), 0.4); chip("بالريل الجاي 👀", 540, 960, { size: 50, col: C.violet, sc: cp, a: clamp(cp * 2) * out });
    const kp = pop(t, tz + 0.1, 0.5); bust("closeup", 540, 1590 + (1 - kp) * 400, 520, { a: clamp(kp * 2) * out, rot: Math.sin(t * 2) * 0.03 });
  }
  if (t >= te) { // end card
    FX.flash = Math.max(FX.flash, 0.8 * imp(t, te, 0.35)); FX.shake = 14 * imp(t, te, 0.4);
    add(() => { const r = t * 0.22; for (let k = 0; k < 18; k++) { const an = r + k * 0.349; poly([[540, 1150], [540 + Math.cos(an) * 1500, 1150 + Math.sin(an) * 1500], [540 + Math.cos(an + 0.09) * 1500, 1150 + Math.sin(an + 0.09) * 1500]], null, 0, 0.055, true, C.sky); } halo(540, 1150, 760, "rgba(31,200,204,0.42)", 1); });
    shock(540, 1150, te, { r: 1100 }); confetti(te + 0.1, { n: 70, dur: 3.4 });
    const kp = eo5(P(t, te, 0.6)); K("hero", 540, 1650 + (1 - kp) * 900, 900, { sx: 1 + 0.06 * imp(t, te + 0.5, 0.3), sy: 1 - 0.06 * imp(t, te + 0.5, 0.3) });
    TW("تابع تكنو انجاز", 540, 320, te + 0.25, { size: 112, g: 30, gc: "rgba(8,18,70,0.85)", colors: { "تكنو": C.cyan, "انجاز": C.cyan }, stroke: 14 });
    TW("وكل ريل… خوارزمية جديدة 🚀", 540, 480, te + 0.9, { size: 54, colors: { "خوارزمية": C.green }, stroke: 10, g: 16, gc: "rgba(8,18,70,0.85)" });
    const lp = pop(t, te + 1.5, 0.45); withT(850, 1000, lp, lp, 0.07, () => { card(-175, -58, 350, 116, { col: C.cyan, a: clamp(lp * 2), r: 58 }); T("لايك ومشاركة 💙", 0, 4, { size: 36, a: clamp(lp * 2) }); });
  }
};

// ------------------------------------------------------------ sound events (music.py turns these into notes and effects)
window.collectSfx = () => {
  const e = [], ev = (t, k, v = 0) => e.push({ t: +t.toFixed(3), k, v });
  for (let h = 0; h < 9; h++) ev(bt("hook", 2 + h / 2), "tick", h); ev(bt("hook", 6.5), "lock"); ev(bt("hook", 1), "pop"); ev(bt("hook", 5), "riser", 3 * BEAT);
  ev(SC.title.t0, "impact"); ev(bt("title", 1), "sweep"); ev(bt("title", 1.5) + 0.62, "land"); ev(bt("title", 3), "pop"); ev(bt("title", 4.5), "pop", 1); ev(SC.title.t1 - 0.3, "whoosh");
  for (let i = 0; i < N; i++) ev(dropT(i) + 0.42, "drop", i); ev(bt("setup", 5.2) + 0.45, "target"); ev(bt("setup", 0.6), "pop"); ev(bt("setup", 8.5), "wiggle");
  ev(T3(), "jump"); for (let k = 0; k <= HIT; k++) { ev(openT(k) + 0.12, "open", k); if (k < HIT) { ev(verdT(k), "no", k); ev(hopT(k), "hop", k); } } ev(FOUND(), "yes"); ev(FOUND() + 0.35, "jump", 1); ev(FOUND() + 1.1, "pop", 2);
  [0, 1, 2].forEach((i) => ev(bt("rule", 1 + i * 2.5) + 0.3, "card", i)); ev(bt("rule", 8.5), "pop", 1); ev(SC.rule.t1 - 0.3, "whoosh");
  const total = CODE.join("").length; for (let c = 0; c < total; c += 2) ev(typeT0() + (c / total) * typeDur(), "key", c); ev(bt("code", 4), "pop");
  for (let k = 0; k <= HIT; k++) { ev(runT(k), "step", k); ev(runT(k) + BEAT * 0.5, k === HIT ? "stepyes" : "stepno", k); } ev(runT(HIT) + BEAT, "ret"); ev(SC.code.t1 - 0.3, "whoosh");
  ev(bt("speed", 1), "card", 0); ev(bestT(), "ret"); ev(bt("speed", 4.5), "card", 1); for (let i = 0; i < 7; i++) ev(worstT() + i * wStep(), "step", i); ev(worstT() + 6 * wStep(), "no", 9);
  ev(bt("speed", 10), "pop"); ev(milT(), "riser", 3.4 * BEAT); ev(milT() + 3.4 * BEAT, "boom"); ev(SC.speed.t1 - 0.3, "whoosh");
  ev(bt("finale", 1.5) + 0.3, "card", 0); ev(bt("finale", 3) + 0.3, "card", 2); ev(bt("finale", 6), "glitch"); ev(bt("finale", 8), "glitch", 1); ev(bt("finale", 9), "pop", 1); ev(bt("finale", 10.5), "impact", 1); ev(bt("finale", 10.5) + 0.5, "land"); ev(bt("finale", 10.5) + 1.5, "pop", 2);
  return { bpm: TL.bpm, total: TL.total, scenes: TL.scenes.map((s) => ({ name: s.name, t0: SC[s.name].t0, t1: SC[s.name].t1 })), found: FOUND(), events: e.sort((a, b) => a.t - b.t) };
};
