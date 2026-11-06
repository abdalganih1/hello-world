/* صمّم · مجسمات البلكسي ثلاثية الأبعاد (قالب البلكسي)
   كل مجسم مأخوذ من صور قطع حقيقية: ستاند قوس بإطار ولؤلؤ، فراشة بجناحين، أجنحة ملاك، ستاند مراية بعلب خواتم،
   تاج، درع تخرج، شراع، كتاب مفتوح، علبة ضيافة وعلبة تخرج، صينية بلوح، مراية يد، ميدالية، مصباح LED، كفر موبايل، عطر...
   كل مجسم إلو «خانات كتابة» بمكانها الحقيقي على القطعة (بالفراشة: الاسم الأول عالجناح اليمين والتاني عالشمال).
   SM.pxKit بيستعمله استوديو «جرّب قطعتك» وصفحة المنتج. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const T = window.THREE, esc = SM.esc || ((s) => String(s));
  if (!SM.sections || !T) return;

  const cm = (a) => "⁦" + a + "⁩ سم";
  const MATS = { clear: ["شفاف كريستال", "linear-gradient(135deg,#fff,#e7eef3 50%,#fff)"], frost: ["مغشّى", "linear-gradient(135deg,#f3f3f3,#dcdcdc)"], white: ["أبيض", "#fbfbf8"], mirror: ["مرآة فضي", "linear-gradient(135deg,#fff,#b9bec6 45%,#6d727b 70%,#eef0f3)"], gold: ["مرآة ذهبي", "linear-gradient(135deg,#fff1c2,#c9973f 45%,#7a5418 70%,#f6dc93)"], black: ["أسود لامع", "#141114"], rose: ["وردي", "#f2c7d3"], wood: ["خشب", "linear-gradient(135deg,#e0bf93,#b88a58)"] };
  const INKS = { gold: ["ذهبي مرآة", "linear-gradient(135deg,#fff1c2,#c9973f 45%,#7a5418 70%,#f6dc93)"], silver: ["فضي مرآة", "linear-gradient(135deg,#fff,#a9adb6 45%,#5e626b 70%,#e9ebef)"], rosegold: ["روز جولد", "linear-gradient(135deg,#ffe3dc,#d9958a 45%,#93564e 70%,#f6c9bf)"], black: ["أسود", "#151215"], white: ["أبيض", "#ffffff"] };
  const INK2D = { gold: "#b8893b", silver: "#8d929c", rosegold: "#c27c71", black: "#151215", white: "#ffffff" };
  const GLOW = { gold: "#ffd27a", silver: "#8fd3ff", rosegold: "#ff8fb8", black: "#6fa8ff", white: "#ffffff" };
  const FILL2D = { black: "#1a1619", white: "#fff", rose: "#f6d6df", gold: "#e9c37a", mirror: "#d9dde2", wood: "#d8b384", frost: "#eef0f1", clear: "rgba(220,235,245,.45)" };

  /* ---------- الأشكال (وحدات تقريبية: الطول حوالي 3.3) ---------- */
  const S2 = () => new T.Shape();
  const rrect = (w, h, r, cx = 0, cy = 0) => { const s = S2(), x = cx - w / 2, y = cy - h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const archS = (W, H) => { const s = S2(), r = W / 2; s.moveTo(-r, -H / 2); s.lineTo(r, -H / 2); s.lineTo(r, H / 2 - r); s.absarc(0, H / 2 - r, r, 0, Math.PI, false); s.lineTo(-r, -H / 2); return s; };
  const circleS = (r, cx = 0, cy = 0) => { const s = S2(); s.absarc(cx, cy, r, 0, Math.PI * 2, false); return s; };
  const heartS = () => { const s = S2(); s.moveTo(0, -1.5); s.bezierCurveTo(-0.3, -1.1, -1.6, -0.4, -1.6, 0.55); s.bezierCurveTo(-1.6, 1.35, -0.95, 1.65, -0.5, 1.6); s.bezierCurveTo(-0.2, 1.57, 0, 1.35, 0, 1.15); s.bezierCurveTo(0, 1.35, 0.2, 1.57, 0.5, 1.6); s.bezierCurveTo(0.95, 1.65, 1.6, 1.35, 1.6, 0.55); s.bezierCurveTo(1.6, -0.4, 0.3, -1.1, 0, -1.5); return s; };
  // فراشة: جناحين فوق كبار مدوّرين وجناحين تحت أصغر، والخصر بالنص
  const butterflyS = () => {
    const s = S2(), f = 0.86, R = [[0.0, 0.62], [0.25, 1.55, 1.35, 2.05, 1.95, 1.45], [2.35, 1.0, 2.05, 0.15, 1.2, 0.02], [0.75, -0.04, 0.5, 0.0, 0.42, -0.02], [1.55, -0.25, 1.75, -1.25, 1.05, -1.5], [0.55, -1.68, 0.12, -1.0, 0.0, -0.58]];
    const p = (x, y, k) => [x * f * k, y * f];
    s.moveTo(...p(R[0][0], R[0][1], 1));
    R.slice(1).forEach((c) => s.bezierCurveTo(...p(c[0], c[1], 1), ...p(c[2], c[3], 1), ...p(c[4], c[5], 1)));
    // الجناح الشمال: نفس المنحنيات معكوسة وبالترتيب العكسي
    const back = R.slice(1).reverse();
    for (let i = 0; i < back.length; i++) { const c = back[i], end = i + 1 < back.length ? [back[i + 1][4], back[i + 1][5]] : R[0]; s.bezierCurveTo(...p(c[2], c[3], -1), ...p(c[0], c[1], -1), ...p(end[0], end[1], -1)); }
    return s;
  };
  const pentS = () => { const s = S2(); s.moveTo(-1.1, -1.6); s.lineTo(1.1, -1.6); s.lineTo(1.1, 0.75); s.quadraticCurveTo(1.05, 0.95, 0.85, 1.1); s.lineTo(0.12, 1.72); s.quadraticCurveTo(0, 1.8, -0.12, 1.72); s.lineTo(-0.85, 1.1); s.quadraticCurveTo(-1.05, 0.95, -1.1, 0.75); s.lineTo(-1.1, -1.6); return s; };
  const sailS = () => { const s = S2(); s.moveTo(-1.05, -1.6); s.lineTo(1.0, -1.6); s.bezierCurveTo(1.25, -0.4, 1.2, 0.9, 0.55, 1.85); s.bezierCurveTo(0.2, 0.9, -0.6, 0.6, -1.05, 0.55); s.lineTo(-1.05, -1.6); return s; };
  const crownS = () => { const s = S2(); s.moveTo(-1.75, -0.75); s.lineTo(1.75, -0.75); s.quadraticCurveTo(1.95, 0.2, 1.95, 1.0); s.quadraticCurveTo(1.55, 0.45, 1.2, 0.35); s.quadraticCurveTo(1.15, 1.0, 0.95, 1.55); s.quadraticCurveTo(0.7, 0.85, 0.45, 0.55); s.quadraticCurveTo(0.25, 1.4, 0, 2.0); s.quadraticCurveTo(-0.25, 1.4, -0.45, 0.55); s.quadraticCurveTo(-0.7, 0.85, -0.95, 1.55); s.quadraticCurveTo(-1.15, 1.0, -1.2, 0.35); s.quadraticCurveTo(-1.55, 0.45, -1.95, 1.0); s.quadraticCurveTo(-1.95, 0.2, -1.75, -0.75); return s; };
  const cloudS = () => { const s = S2(); s.moveTo(-1.8, -0.85); s.lineTo(1.8, -0.85); s.bezierCurveTo(2.45, -0.85, 2.45, 0.25, 1.7, 0.2); s.bezierCurveTo(1.85, 1.05, 0.9, 1.35, 0.6, 0.8); s.bezierCurveTo(0.4, 1.65, -0.85, 1.65, -0.8, 0.8); s.bezierCurveTo(-1.25, 1.15, -1.95, 0.8, -1.7, 0.2); s.bezierCurveTo(-2.45, 0.25, -2.45, -0.85, -1.8, -0.85); return s; };
  const handMirrorS = () => { const s = S2(), cy = 0.6, r = 1.15, a = Math.atan2(-Math.sqrt(r * r - 0.2 * 0.2), 0.2), b = Math.atan2(-Math.sqrt(r * r - 0.2 * 0.2), -0.2); s.moveTo(-0.3, -1.95); s.lineTo(0.3, -1.95); s.quadraticCurveTo(0.34, -1.2, 0.2, cy + r * Math.sin(a)); s.absarc(0, cy, r, a, b + Math.PI * 2, false); s.quadraticCurveTo(-0.34, -1.2, -0.3, -1.95); return s; };
  const medalS = () => { const s = circleS(1.3), h = new T.Path(); h.absarc(0, 1.05, 0.11, 0, Math.PI * 2, true); s.holes.push(h); return s; };
  const awardArchS = () => { const s = S2(), W = 2.3, H = 3.2, r = 0.9; s.moveTo(-W / 2, -H / 2); s.lineTo(W / 2, -H / 2); s.lineTo(W / 2, H / 2 - 0.55); s.quadraticCurveTo(W / 2, H / 2, 0, H / 2 + 0.05); s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - 0.55); s.lineTo(-W / 2, -H / 2); return s; };

  /* ---------- المجسمات ----------
     outline: الشكل الأساسي (بينقص بالليزر وبيبين بعرض «قبل القص»)
     slots: خانات الكتابة {x, y, w, h, mode}. mode: all (أسماء + سطر)، pair (الاسمين بسطر)، one، n1، n2، line
     base: bar ذهبي، black، wood، ellipse مراية، disc دائري، oval، none، hang (معلّقة)
     rim: حبات حوالين الحافة (pearl بيتحكم فيها الزبون، crystal دايماً) · extra: زينة إضافية */
  const M = {
    arch: { label: "ستاند قوس", cm: cm("30×40"), outline: () => archS(2.5, 3.3), slots: [{ x: 0, y: -0.1, w: 2.1, h: 2.5, mode: "all" }], base: "bar", rim: "pearl", mat: "clear", extra: ["rings"] },
    archFrame: { label: "قوس بإطار", cm: cm("30×40"), outline: () => archS(2.5, 3.3), slots: [{ x: 0, y: 0.05, w: 1.9, h: 2.2, mode: "all" }], base: "bar", rim: "pearl", pearls: true, mat: "white", extra: ["frame", "seam"] },
    heart: { label: "قلب", cm: cm("35×33"), outline: heartS, slots: [{ x: 0, y: 0.25, w: 2.3, h: 1.9, mode: "all" }], base: "bar", rim: "pearl", mat: "clear" },
    butterfly: { label: "فراشة", cm: cm("40×35"), outline: butterflyS, slots: [{ x: 0.95, y: 0.82, w: 1.25, h: 1.0, mode: "n1" }, { x: -0.95, y: 0.82, w: 1.25, h: 1.0, mode: "n2" }, { x: 0.74, y: -0.72, w: 0.85, h: 0.5, mode: "line" }], base: "oval", rim: "pearl", mat: "white", extra: ["body", "ringsL", "frame"] },
    wings: { label: "أجنحة ملاك", cm: cm("40×38"), custom: "wings", outline: () => circleS(0.7), slots: [{ x: 0, y: 0, w: 1.1, h: 0.75, mode: "pair" }], mat: "white", ink: "gold" },
    ringStand: { label: "ستاند مراية بعلب خواتم", cm: cm("50×40"), outline: () => circleS(1.55), slots: [{ x: 0, y: 0.05, w: 2.4, h: 2.3, mode: "all" }], base: "ellipse", rim: "crystal", mat: "mirror", ink: "gold", extra: ["ringBoxes"] },
    ringFrame: { label: "طارة دائرية بقاعدة", cm: cm("35×40"), outline: () => circleS(1.4), slots: [{ x: 0, y: 0.1, w: 2.1, h: 1.9, mode: "all" }], base: "disc", mat: "clear", ink: "gold", extra: ["goldRim", "hexBoxes", "flowers"] },
    crown: { label: "تاج", cm: cm("45×35"), outline: crownS, slots: [{ x: 0, y: -0.15, w: 2.4, h: 0.9, mode: "pair" }], base: "oval", mat: "gold", ink: "black", extra: ["hexBoxes"] },
    trophy: { label: "درع تخرج", cm: cm("22×33"), outline: pentS, slots: [{ x: 0, y: -0.15, w: 1.7, h: 2.2, mode: "all" }], base: "bar", mat: "clear", ink: "black", extra: ["inset"] },
    award: { label: "درع شفاف بقاعدة", cm: cm("25×30"), outline: () => rrect(2.6, 3.0, 0.14), slots: [{ x: 0, y: 0, w: 2.2, h: 2.5, mode: "all" }], base: "black", mat: "clear", ink: "gold" },
    awardArch: { label: "درع مقوّس", cm: cm("20×28"), outline: awardArchS, slots: [{ x: 0, y: -0.05, w: 1.9, h: 2.4, mode: "all" }], base: "wood", mat: "clear", ink: "gold" },
    sail: { label: "درع شراع", cm: cm("22×35"), outline: sailS, slots: [{ x: 0.05, y: -0.45, w: 1.6, h: 1.7, mode: "all" }], base: "black", mat: "clear", ink: "black", extra: ["inset"] },
    book: { label: "كتاب مفتوح", cm: cm("40×28"), custom: "book", outline: () => rrect(1.55, 2.2, 0.08), slots: [{ x: 0, y: 0, w: 1.3, h: 1.85, mode: "all" }], mat: "white", ink: "gold" },
    box: { label: "علبة ضيافة", cm: cm("26×18×14"), custom: "box", outline: () => rrect(2.6, 1.35, 0.05), slots: [{ x: 0, y: 0, w: 2.4, h: 1.15, mode: "all" }], mat: "clear", ink: "gold" },
    gradBox: { label: "علبة تخرج", cm: cm("20×20×20"), custom: "gradBox", outline: () => rrect(1.6, 0.9, 0.04), slots: [{ x: 0, y: 0, w: 1.5, h: 0.8, mode: "all" }], mat: "clear", ink: "gold" },
    tray: { label: "صينية بلوح", cm: cm("35×25"), custom: "tray", outline: () => archS(2.3, 1.9), slots: [{ x: 0, y: -0.05, w: 1.9, h: 1.4, mode: "all" }], mat: "white", ink: "gold" },
    tallBox: { label: "مبخرة", cm: cm("10×10×26"), custom: "tallBox", outline: () => rrect(1.0, 2.6, 0.04), slots: [{ x: 0, y: 0.2, w: 0.9, h: 1.3, mode: "one" }], mat: "clear", ink: "gold" },
    bottle: { label: "عطر بالاسم", cm: cm("6×9"), custom: "bottle", outline: () => rrect(1.4, 1.7, 0.08), slots: [{ x: 0, y: 0, w: 1.2, h: 1.2, mode: "one" }], mat: "black", ink: "gold" },
    handMirror: { label: "مراية يد", cm: cm("20×35"), outline: handMirrorS, slots: [{ x: 0, y: 0.6, w: 1.7, h: 1.3, mode: "one" }], base: "none", rim: "pearl", pearls: true, mat: "mirror", ink: "gold", tilt: 0.12 },
    medal: { label: "ميدالية", cm: "قطر 6 سم", outline: medalS, slots: [{ x: 0, y: -0.1, w: 2.0, h: 1.5, mode: "one" }], base: "hang", mat: "gold", ink: "black", extra: ["keyring"] },
    badge: { label: "بروش اسم", cm: cm("7×2"), outline: () => rrect(3.2, 0.95, 0.2), slots: [{ x: 0.35, y: 0, w: 2.3, h: 0.75, mode: "one" }], base: "none", mat: "gold", ink: "black", extra: ["badgeLogo"] },
    lamp: { label: "مصباح LED", cm: cm("20×25"), outline: () => rrect(2.7, 2.9, 0.3), slots: [{ x: 0, y: 0, w: 2.4, h: 1.7, mode: "one" }], base: "black", mat: "clear", ink: "silver", glow: true },
    phone: { label: "كفر موبايل", cm: cm("7×15"), outline: () => rrect(1.65, 3.3, 0.3), slots: [{ x: 0, y: -0.5, w: 1.4, h: 1.2, mode: "one" }], base: "none", mat: "white", ink: "black", extra: ["camera"], tilt: 0.1 },
    cloud: { label: "غيمة مولود", cm: cm("40×25"), outline: cloudS, slots: [{ x: 0, y: 0.1, w: 2.6, h: 1.2, mode: "one" }], base: "hang", mat: "white", ink: "gold", extra: ["stars"] },
    circle: { label: "دائرة", cm: "قطر 35 سم", outline: () => circleS(1.55), slots: [{ x: 0, y: 0, w: 2.3, h: 2.3, mode: "all" }], base: "bar", rim: "pearl", mat: "clear" },
    plaque: { label: "لوحة عرضية", cm: cm("40×28"), outline: () => rrect(3.5, 2.4, 0.12), slots: [{ x: 0, y: 0, w: 3.1, h: 2.0, mode: "all" }], base: "bar", rim: "pearl", mat: "clear" },
    board: { label: "لوحة طولية", cm: cm("30×40"), outline: () => rrect(2.5, 3.3, 0.06), slots: [{ x: 0, y: 0, w: 2.1, h: 2.8, mode: "all" }], base: "wood", mat: "white", ink: "black" },
  };
  // الأشكال اللي بتبين بالاستوديو العام
  const STUDIO = ["arch", "heart", "butterfly", "ringStand", "crown", "trophy", "handMirror", "box", "medal", "plaque"];
  const icons = {
    arch: "M6 22V10a6 6 0 0 1 12 0v12z", archFrame: "M6 22V10a6 6 0 0 1 12 0v12zM8.5 20V10.5a3.5 3.5 0 0 1 7 0V20z", heart: "M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z",
    butterfly: "M12 8c-1-4-7-6-8-2s2 5 6 5c-4 1-5 5-3 6s4-1 5-4c1 3 3 5 5 4s1-5-3-6c4 0 7-1 6-5s-7-2-8 2z", circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    wings: "M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 10C6 7 2 8 2 13c3 0 5 2 8 1zM14 10c4-3 8-2 8 3-3 0-5 2-8 1zM5 20h14", ringStand: "M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM3 21h18M7 19h3M14 19h3",
    ringFrame: "M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM4 21h16", crown: "M3 18h18L20 8l-4 4-4-7-4 7-4-4z", trophy: "M7 21V9l5-6 5 6v12zM5 21h14", award: "M6 3h12v15H6zM4 21h16v-3H4z",
    awardArch: "M6 18V8q0-5 6-5t6 5v10zM4 21h16", sail: "M6 20V11c4 0 7 2 8-8 3 5 4 11 3 17zM4 21h16", book: "M12 6v14M12 6C9 4 5 4 3 5v14c2-1 6-1 9 1 3-2 7-2 9-1V5c-2-1-6-1-9 1z",
    box: "M4 9h16v11H4zM3 6h18v3H3zM10 4h4v2h-4z", gradBox: "M5 10h14v11H5zM12 3 4 7l8 3 8-3z", tray: "M3 16h18v4H3zM7 16V9a5 5 0 0 1 10 0v7", tallBox: "M8 4h8v17H8zM9 4V2h6v2", bottle: "M7 9h10v12H7zM10 5h4v4h-4zM9 2h6v3H9z",
    handMirror: "M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM11 14h2v8h-2z", medal: "M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z", badge: "M3 9h18v6H3zM6 12h1",
    lamp: "M5 3h14v14H5zM4 17h16v4H4z", phone: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 4h3v4H8z", cloud: "M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-10 0 4 4 0 0 0 0 8z",
    plaque: "M3 7h18v11H3z", board: "M6 3h12v18H6z",
  };
  const SHAPES = M;

  function guess(name, it) {
    if (it && it.shape && M[it.shape]) return it.shape;
    const n = String(name || "");
    if (/فراش/.test(n)) return "butterfly"; if (/أجنح|اجنح|ملاك/.test(n)) return "wings"; if (/تاج/.test(n) && /ستاند/.test(n)) return "crown";
    if (/مصباح|لمب|LED/i.test(n)) return "lamp"; if (/كفر|موبايل/.test(n)) return "phone"; if (/عطر/.test(n)) return "bottle"; if (/غيم/.test(n)) return "cloud"; if (/مبخر/.test(n)) return "tallBox";
    if (/كتاب|دفتر/.test(n)) return "book"; if (/بروش/.test(n)) return "badge"; if (/مراي.*يد|مرآة يد/.test(n)) return "handMirror";
    if (/علب.*تخرج|تخرج.*علب/.test(n)) return "gradBox"; if (/صين|بوكس|توزيع/.test(n)) return "tray"; if (/علب|صندوق|ضياف/.test(n)) return "box";
    if (/خواتم|دبل|مراي|مرآ/.test(n)) return "ringStand"; if (/قلب/.test(n)) return "heart"; if (/درع/.test(n)) return "trophy";
    if (/مسبح|ميدالي|قلادة|طارة/.test(n)) return "medal"; if (/دائر/.test(n)) return "ringFrame"; if (/مقو[ّ]?س|قوس/.test(n)) return "arch";
    if (/كانف|لوحة|لوحه|استقبال|طباع/.test(n)) return "board"; if (/لوح|تعليق/.test(n)) return "plaque";
    return "arch";
  }

  /* ---------- الكتابة كصورة (أبيض على أسود = alphaMap) ---------- */
  function textCanvas(st, w, h, mode = "all") {
    const R = 1024, c = document.createElement("canvas"); c.width = R; c.height = Math.max(64, Math.round(R * h / w));
    const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display") || "serif", body = '"Tajawal", sans-serif';
    const dir = (t) => (x.direction = /[؀-ۿ]/.test(t) ? "rtl" : "ltr");
    const fit = (t, size, maxW, weight = 700, f = fam) => { dir(t); let fs = Math.max(20, size); x.font = `${weight} ${fs}px ${f}`; while (x.measureText(t).width > maxW && fs > 18) { fs -= 4; x.font = `${weight} ${fs}px ${f}`; } return fs; };
    const H = c.height, maxW = R * 0.9, n1 = st.n1.trim(), n2 = st.n2.trim(), line = st.line.trim();
    const say = (t, y, size, weight, f) => { if (!t) return; fit(t, size, maxW, weight, f); x.fillText(t, R / 2, y); };
    if (mode === "n1") say(n1 || n2, H * 0.52, Math.min(H * 0.62, 330));
    else if (mode === "n2") say(n1 && n2 ? n2 : "", H * 0.52, Math.min(H * 0.62, 330));
    else if (mode === "line") say(line, H * 0.5, Math.min(H * 0.55, 170), 600, body);
    else if (mode === "one") say([n1, n2].filter(Boolean).join(" و ") || line, H * 0.5, Math.min(H * 0.6, 300));
    else if (mode === "pair") { const t = n1 && n2 ? `${n1} & ${n2}` : n1 || n2; say(t, line ? H * 0.4 : H * 0.5, Math.min(H * (line ? 0.42 : 0.58), 260)); if (line) say(line, H * 0.82, Math.min(H * 0.18, 70), 500, body); }
    else {
      const big = Math.min(230, H * 0.2);
      if (n1 && n2) { say(n1, H * 0.3, big); dir("&"); x.font = `400 ${Math.round(big * 0.55)}px ${fam}`; x.fillText("&", R / 2, H * 0.47); say(n2, H * 0.62, big); }
      else say(n1 || n2, H * 0.44, big * 1.25);
      if (line) { say(line, H * 0.84, Math.min(80, H * 0.07), 500, body); x.fillRect(R * 0.38, H * 0.76, R * 0.24, Math.max(3, H * 0.004)); }
    }
    return c;
  }

  // نقاط على الحافة لجوّا بمسافة ثابتة (للؤلؤ والإطار)، بتشتغل مع أي شكل حتى المقعّر
  function inner(shape, n, inset) {
    const pts = shape.getSpacedPoints(n); pts.pop();
    let area = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; area += p.x * q.y - q.x * p.y; });
    const sg = area > 0 ? 1 : -1;
    return pts.map((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1; return new T.Vector2(p.x - (ty / L) * inset * sg, p.y + (tx / L) * inset * sg); });
  }
  const bboxOf = (shape) => { const b = new T.Box2(); shape.getPoints(64).forEach((p) => b.expandByPoint(p)); return b; };

  /* ---------- المحرك ---------- */
  function engine(host, colors) {
    const renderer = new T.WebGLRenderer({ antialias: !SM.pxLite, alpha: false, preserveDrawingBuffer: true, powerPreference: "low-power" });
    const LITE = !!SM.pxLite;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LITE ? 1.5 : 2));
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    const scene = new T.Scene(), bg = new T.Color(colors.surface).lerp(new T.Color(colors.bg), 0.4), night = new T.Color("#17121b");
    scene.background = bg.clone();
    scene.environment = SM.makeEnv ? SM.makeEnv(renderer, colors) : null;
    scene.add(new T.HemisphereLight(0xffffff, new T.Color(colors.accent2), 0.7));
    const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 5, 6); scene.add(key);
    const warm = new T.PointLight(new T.Color(colors.accent), 30, 16); warm.position.set(3, 1, 4); scene.add(warm);
    const floorMat = new T.MeshBasicMaterial({ color: bg.clone().multiplyScalar(0.92), transparent: true, opacity: 0.9 });
    const floor = new T.Mesh(new T.CircleGeometry(6, 64), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.05; scene.add(floor);
    const shadowC = document.createElement("canvas"); shadowC.width = shadowC.height = 128; { const g = shadowC.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,.35)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
    const shadow = new T.Mesh(new T.PlaneGeometry(5, 2.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowC), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.04; scene.add(shadow);
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0.3, 10.5);
    const holder = new T.Group(); scene.add(holder);
    let piece = null, lid = null, pop = 1, dirty = 2, ready = true;
    const rot = { x: 0.08, y: -0.5, vx: 0, vy: 0, drag: false, idle: 0 };
    const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = w / h < 0.9 ? 13 : 10.5; camera.updateProjectionMatrix(); };
    new ResizeObserver(() => { resize(); dirty = 2; }).observe(host); resize();
    let lx = 0, ly = 0;
    host.addEventListener("pointerdown", (e) => { rot.drag = true; lx = e.clientX; ly = e.clientY; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", (e) => { if (!rot.drag) return; dirty = 2; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; rot.vy = dx * 0.008; rot.vx = dy * 0.004; rot.y += rot.vy; rot.x = Math.max(-0.5, Math.min(0.6, rot.x + rot.vx)); rot.idle = 0; });
    const up = () => (rot.drag = false); host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);

    /* خامات */
    const phys = (o) => new T.MeshPhysicalMaterial(o);
    const goldMat = (c = "#e2b45c") => phys({ color: new T.Color(c), metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06 });
    const silverMat = () => phys({ color: 0xe9ecf0, metalness: 1, roughness: 0.06, clearcoat: 1 });
    const sheetMat = (k) => ({
      clear: () => LITE ? phys({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.45, clearcoat: 1, envMapIntensity: 1.8, side: T.DoubleSide, depthWrite: false }) : phys({ color: 0xffffff, roughness: 0.03, transmission: 1, thickness: 0.4, ior: 1.49, clearcoat: 1, specularIntensity: 1, attenuationColor: new T.Color("#eaf6ff"), attenuationDistance: 3, side: T.DoubleSide }),
      frost: () => LITE ? phys({ color: 0xf4f4f4, roughness: 0.5, transparent: true, opacity: 0.75, clearcoat: 0.6, side: T.DoubleSide }) : phys({ color: 0xffffff, roughness: 0.5, transmission: 0.92, thickness: 0.4, ior: 1.49, clearcoat: 0.6, side: T.DoubleSide }),
      white: () => phys({ color: 0xfbfbf8, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }),
      black: () => phys({ color: 0x0f0c0f, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
      rose: () => phys(LITE ? { color: 0xf2c7d3, roughness: 0.15, clearcoat: 1 } : { color: 0xf2c7d3, roughness: 0.12, transmission: 0.45, thickness: 0.4, clearcoat: 1 }),
      mirror: silverMat,
      wood: () => phys({ color: 0xc99a66, roughness: 0.55, clearcoat: 0.2 }),
      gold: () => goldMat(),
    }[k] || (() => goldMat()))();
    const inkMat = (k, alpha, glow) => {
      if (glow) return new T.MeshBasicMaterial({ color: new T.Color(GLOW[k] || GLOW.silver), alphaMap: alpha, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
      const b = { gold: ["#e8bb62", 1, 0.14], silver: ["#e8eaef", 1, 0.12], rosegold: ["#e7a99f", 1, 0.16], black: ["#141114", 0, 0.2], white: ["#ffffff", 0, 0.3] }[k] || ["#e8bb62", 1, 0.14];
      return phys({ color: new T.Color(b[0]), metalness: b[1], roughness: b[2], clearcoat: 1, alphaMap: alpha, transparent: true, alphaTest: 0.35, side: T.DoubleSide });
    };
    const shapeUV = (geo, b) => { const uv = geo.attributes.uv, p = geo.attributes.position, sx = b.max.x - b.min.x, sy = b.max.y - b.min.y; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / sx, (p.getY(i) - b.min.y) / sy); uv.needsUpdate = true; };
    const coverTex = (img, aspect) => { const tx = new T.Texture(img); tx.colorSpace = T.SRGBColorSpace; tx.needsUpdate = true; const a = img.width / img.height; tx.repeat.set(a > aspect ? aspect / a : 1, a > aspect ? 1 : a / aspect); tx.offset.set((1 - tx.repeat.x) / 2, (1 - tx.repeat.y) / 2); return tx; };
    const seg = LITE ? 32 : 56;
    const ext = (shape, D, mat, bevel = 0.02) => { const g = new T.ExtrudeGeometry(shape, { depth: D, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: seg }); g.translate(0, 0, -D / 2); return new T.Mesh(g, mat); };
    const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); return o; };
    const shapeFrom = (pts) => { const s = new T.Shape(pts); return s; };
    const put = (parent, o, z) => { o.position.z = z; parent.add(o); return o; };

    // كتابة على خانة، z = وجه القطعة
    const writeSlots = (grp, slots, st, z, glow, ox = 0, oy = 0) => slots.forEach((s) => {
      const tx = new T.CanvasTexture(textCanvas(st, s.w, s.h, s.mode));
      grp.add(mesh(new T.PlaneGeometry(s.w, s.h), inkMat(st.ink, tx, glow), ox + s.x, oy + s.y, z));
    });
    const beadRow = (pts, r, mat, z) => { const im = new T.InstancedMesh(new T.SphereGeometry(r, LITE ? 10 : 16, LITE ? 8 : 12), mat, pts.length), m4 = new T.Matrix4(); pts.forEach((p, i) => { m4.makeTranslation(p.x, p.y, z); im.setMatrixAt(i, m4); }); return im; };
    const pearlMat = () => phys({ color: 0xfffaf0, roughness: 0.25, clearcoat: 1, sheen: 1, sheenColor: new T.Color("#ffe6f0"), iridescence: LITE ? 0 : 0.4 });
    const crystalMat = () => phys({ color: 0xffffff, metalness: 0.2, roughness: 0.02, clearcoat: 1, iridescence: LITE ? 0 : 1, iridescenceIOR: 1.8, envMapIntensity: 2.5 });
    const ringsMotif = (grp, x, y, z, s = 1) => {
      const g = goldMat(), t = new T.TorusGeometry(0.17 * s, 0.025 * s, 8, 32);
      grp.add(mesh(t, g, x + 0.42 * s, y, z)); grp.add(mesh(t, g, x, y, z));
      const hs = heartS(); const hm = ext(hs, 0.03, g, 0); hm.scale.setScalar(0.12 * s); hm.position.set(x - 0.45 * s, y, z); grp.add(hm);
    };
    const ringBox = (x, z) => { const g = new T.Group(); const m = phys({ color: 0xf3f1ee, roughness: 0.9, sheen: 1, sheenColor: new T.Color("#ffffff") }); const b = mesh(new T.BoxGeometry(0.55, 0.38, 0.55), m); b.position.y = 0.19; g.add(b); const l = mesh(new T.BoxGeometry(0.57, 0.2, 0.57), m); l.position.y = 0.48; l.rotation.x = -0.15; g.add(l); g.position.set(x, 0, z); return g; };
    const hexBox = (x, z) => { const g = new T.Group(), geo = new T.CylinderGeometry(0.3, 0.3, 0.42, 6, 1, true); g.add(new T.LineSegments(new T.EdgesGeometry(new T.CylinderGeometry(0.3, 0.3, 0.42, 6)), new T.LineBasicMaterial({ color: 0xd9a94f }))); g.add(new T.Mesh(geo, phys({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, side: T.DoubleSide }))); g.position.set(x, 0.21, z); return g; };

    /* ---------- القواعد ---------- */
    function addBase(grp, kind, b, D) {
      const w = b.max.x - b.min.x, cx = (b.max.x + b.min.x) / 2;
      if (kind === "bar") { grp.add(mesh(new T.BoxGeometry(Math.min(w, 2.8) + 0.5, 0.16, 0.75), goldMat("#d9a94f"), cx, 0.08, 0)); return 0.16; }
      if (kind === "black") { grp.add(mesh(new T.BoxGeometry(Math.min(w, 2.8) + 0.4, 0.3, 0.85), sheetMat("black"), cx, 0.15, 0)); return 0.3; }
      if (kind === "wood") { grp.add(mesh(new T.BoxGeometry(Math.min(w, 2.8) + 0.3, 0.2, 0.7), sheetMat("wood"), cx, 0.1, 0)); return 0.2; }
      if (kind === "ellipse") { const e = mesh(new T.CylinderGeometry(1, 1, 0.08, 64), silverMat(), cx, 0.04, 0.55); e.scale.set(2.3, 1, 1.25); grp.add(e); return 0.08; }
      if (kind === "disc") { grp.add(mesh(new T.CylinderGeometry(1.75, 1.8, 0.12, 64), sheetMat("wood"), cx, 0.06, 0.5)); grp.add(mesh(new T.CylinderGeometry(1.7, 1.7, 0.14, 64), sheetMat("white"), cx, 0.19, 0.5)); return 0.26; }
      if (kind === "oval") { const o = mesh(new T.CylinderGeometry(1, 1, 0.16, 64), sheetMat("white"), cx, 0.08, 0.45); o.scale.set(2.4, 1, 1.15); grp.add(o); return 0.16; }
      return 0;
    }

    /* ---------- مجسم مسطح عام: لوح مقصوص + كتابة + زينة + قاعدة ---------- */
    function flat(m, st) {
      const grp = new T.Group(), plate = new T.Group(), shape = m.outline(), b = bboxOf(shape), D = 0.14, extra = m.extra || [];
      const front = D / 2 + 0.03;
      plate.add(ext(shape, D, m.glow ? phys({ color: 0x9fb8d0, roughness: 0.05, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false }) : sheetMat(st.mat)));
      if (extra.includes("frame")) { const fr = shapeFrom(shape.getPoints(160)); fr.holes.push(new T.Path(inner(shape, 160, 0.16))); put(plate, ext(fr, 0.05, goldMat(), 0.01), front - 0.02); }
      if (extra.includes("inset")) { const ins = shapeFrom(inner(shape, 140, 0.18)); put(plate, ext(ins, 0.03, goldMat(), 0), front - 0.01); }
      if (extra.includes("goldRim")) plate.add(mesh(new T.TorusGeometry(1.42, 0.06, 12, 96), goldMat()));
      if (st.photo) { const pg = new T.ShapeGeometry(shape, seg); shapeUV(pg, b); const ph = new T.Mesh(pg, new T.MeshBasicMaterial({ map: coverTex(st.photo, (b.max.x - b.min.x) / (b.max.y - b.min.y)), toneMapped: false })); ph.position.z = front + 0.005; plate.add(ph); }
      writeSlots(plate, m.slots, st, front + 0.04, m.glow);
      if (m.glow) plate.add(new T.LineSegments(new T.EdgesGeometry(plate.children[0].geometry, 30), new T.LineBasicMaterial({ color: GLOW[st.ink] || GLOW.silver, transparent: true, opacity: 0.9 })));
      const beads = m.rim === "crystal" || (m.rim === "pearl" && st.pearls);
      if (beads) { const k = m.rim === "crystal", n = Math.round(shape.getLength() / (k ? 0.11 : 0.13)); plate.add(beadRow(inner(shape, n, k ? 0.07 : 0.13), k ? 0.055 : 0.06, k ? crystalMat() : pearlMat(), front)); }
      if (extra.includes("seam")) plate.add(mesh(new T.BoxGeometry(0.02, (b.max.y - b.min.y) * 0.78, 0.02), goldMat(), 0, (b.min.y + b.max.y) / 2 - 0.15, front));
      if (extra.includes("rings")) ringsMotif(plate, 0, b.min.y + 0.45, front + 0.03, 0.9);
      if (extra.includes("ringsL")) ringsMotif(plate, -0.78, -0.66, front + 0.03, 0.7);
      if (extra.includes("body")) { plate.add(mesh(new T.CapsuleGeometry(0.1, 1.05, 6, 16), goldMat(), 0, 0.02, front + 0.06)); [-1, 1].forEach((sx) => { const a = mesh(new T.TorusGeometry(0.42, 0.014, 6, 24, 1.1), goldMat()); a.position.set(sx * 0.42, 0.62, front + 0.06); a.rotation.z = sx > 0 ? 1.65 : 0.4; plate.add(a); }); }
      if (extra.includes("camera")) { put(plate, ext(rrect(0.6, 0.75, 0.14, 0.42, 1.12), 0.1, sheetMat("black"), 0.02), front + 0.02); [[0.3, 1.28], [0.3, 0.98], [0.55, 1.28]].forEach(([x, y]) => { const l = mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 24), silverMat(), x, y, front + 0.1); l.rotation.x = Math.PI / 2; plate.add(l); }); }
      if (extra.includes("badgeLogo")) { const c = mesh(new T.CylinderGeometry(0.42, 0.42, 0.06, 40), sheetMat("white"), -1.15, 0, front + 0.02); c.rotation.x = Math.PI / 2; plate.add(c); }
      if (extra.includes("stars")) { const g = goldMat(); for (let i = 0; i < 5; i++) { const s = mesh(new T.OctahedronGeometry(0.09), g, -1.4 + i * 0.7, -1.25 - (i % 2) * 0.35, 0); plate.add(s); plate.add(mesh(new T.CylinderGeometry(0.006, 0.006, 0.42 + (i % 2) * 0.35), silverMat(), -1.4 + i * 0.7, -1.0 - (i % 2) * 0.17, 0)); } plate.add(mesh(new T.TorusGeometry(0.36, 0.09, 12, 32, 4.2), goldMat(), -1.55, 1.15, 0.1)); }
      // القطعة واقفة على قاعدتها
      const lift = addBase(grp, m.base, b, D);
      plate.position.y = lift - b.min.y + (m.base === "hang" ? 0.6 : m.base === "none" ? 0.05 : 0);
      if (m.base === "ellipse" || m.base === "disc" || m.base === "oval") plate.position.z = -0.15;
      if (m.base === "hang" || extra.includes("keyring")) {
        const top = b.max.y + plate.position.y;
        if (extra.includes("keyring")) { const ring = mesh(new T.TorusGeometry(0.32, 0.035, 10, 40), goldMat(), 0, top + 0.35, 0); ring.rotation.y = Math.PI / 2; grp.add(ring); }
        else grp.add(mesh(new T.CylinderGeometry(0.012, 0.012, 1.2), phys({ color: 0xcaa982, roughness: 0.9 }), 0, top + 0.55, 0));
      }
      if (m.tilt) plate.rotation.x = -m.tilt;
      grp.add(plate);
      if (extra.includes("ringBoxes")) { grp.add(ringBox(-1.05, 0.95)); grp.add(ringBox(1.05, 0.95)); }
      if (extra.includes("hexBoxes")) { const y = m.base === "disc" ? 0.26 : 0.16; [-0.75, 0.75].forEach((x) => { const h = hexBox(x, 1.05); h.position.y += y; grp.add(h); }); }
      if (extra.includes("flowers")) { const fm = phys({ color: 0xffffff, roughness: 0.6, sheen: 1 }); const geo = new T.IcosahedronGeometry(0.13, 1); for (let i = 0; i < 16; i++) { const a = 1.9 + i * 0.12; grp.add(mesh(geo, fm, Math.cos(a) * 1.45, plate.position.y + Math.sin(a) * 1.45, -0.05)); } }
      return grp;
    }

    /* ---------- مجسمات خاصة ---------- */
    function custom(m, st) {
      const grp = new T.Group(), mat = sheetMat(st.mat), edgeM = new T.LineBasicMaterial({ color: st.mat === "black" ? 0x555555 : 0xc9a25a, transparent: true, opacity: 0.85 });
      const panel = (gw, gh, gd, x, y, z, mm = mat) => { const geo = new T.BoxGeometry(gw, gh, gd), b = mesh(geo, mm, x, y, z); b.add(new T.LineSegments(new T.EdgesGeometry(geo), edgeM)); grp.add(b); return b; };
      const face = (w, h, z, y, slots, x = 0) => { if (st.photo) grp.add(mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: coverTex(st.photo, w / h), toneMapped: false }), x, y, z - 0.02)); writeSlots(grp, slots, st, z, false, x, y); };
      if (m.custom === "box" || m.custom === "gradBox" || m.custom === "tallBox") {
        const [w, d, h] = m.custom === "box" ? [2.6, 1.8, 1.35] : m.custom === "gradBox" ? [1.9, 1.9, 1.9] : [1.05, 1.05, 2.6], t = 0.07;
        panel(w, t, d, 0, t / 2, 0); panel(w, h, t, 0, h / 2, -d / 2); panel(t, h, d, -w / 2, h / 2, 0); panel(t, h, d, w / 2, h / 2, 0); panel(w, h, t, 0, h / 2, d / 2);
        if (m.custom === "box") {
          const candy = [goldMat(), phys({ color: 0xf2c7d3, roughness: 0.3, clearcoat: 1 }), phys({ color: 0xffffff, roughness: 0.3, clearcoat: 1 })];
          for (let i = 0; i < 12; i++) { const s = mesh(new T.SphereGeometry(0.2, 16, 12), candy[i % 3], -0.95 + (i % 4) * 0.63, 0.26 + Math.floor(i / 8) * 0.3, -0.5 + (Math.floor(i / 4) % 2) * 0.75 + (i >= 8 ? 0.35 : 0)); s.scale.y = 0.8; grp.add(s); }
          lid = new T.Group(); lid.position.set(0, h, -d / 2); const lp = mesh(new T.BoxGeometry(w + 0.12, 0.09, d + 0.12), sheetMat(st.mat === "gold" ? "clear" : st.mat), 0, 0.05, d / 2); lid.add(lp);
          const knob = mesh(new T.TorusGeometry(0.16, 0.05, 12, 32), goldMat(), 0, 0.25, d / 2); lid.add(knob); grp.add(lid);
          face(w * 0.92, h * 0.86, d / 2 + 0.07, h / 2, m.slots.map((s) => Object.assign({}, s, { x: 0, y: 0, w: w * 0.92, h: h * 0.86 })));
        } else if (m.custom === "gradBox") {
          panel(w + 0.1, 0.07, d + 0.1, 0, h + 0.035, 0);
          grp.add(mesh(new T.BoxGeometry(1.6, 0.9, 0.03), sheetMat("black"), 0, h * 0.42, d / 2 + 0.06));
          face(1.5, 0.8, d / 2 + 0.09, h * 0.42, m.slots);
          const cap = new T.Group(); cap.add(mesh(new T.BoxGeometry(1.3, 0.05, 1.3), sheetMat("black"))); cap.children[0].rotation.y = Math.PI / 4; cap.add(mesh(new T.CylinderGeometry(0.38, 0.42, 0.3, 24), sheetMat("black"), 0, -0.16, 0)); cap.add(mesh(new T.CylinderGeometry(0.015, 0.015, 0.55), goldMat(), 0.55, -0.25, 0.3)); cap.position.set(0.15, h + 0.42, -0.1); cap.rotation.set(0.12, 0.3, -0.1); grp.add(cap);
          const fm = phys({ color: 0xf2d36b, roughness: 0.6 }); for (let i = 0; i < 9; i++) grp.add(mesh(new T.IcosahedronGeometry(0.08, 0), fm, -0.6 + (i % 3) * 0.12, h + 0.12 + Math.floor(i / 3) * 0.09, 0.4 + (i % 2) * 0.1));
        } else {
          const cup = mesh(new T.CylinderGeometry(0.42, 0.3, 0.32, 32, 1, true), phys({ color: 0xdfe3e8, metalness: 1, roughness: 0.2, side: T.DoubleSide }), 0, h - 0.05, 0); grp.add(cup);
          face(0.95, 1.4, d / 2 + 0.06, h * 0.55, m.slots.map((s) => Object.assign({}, s, { x: 0, y: 0 })));
        }
        return grp;
      }
      if (m.custom === "tray") {
        const w = 3.4, d = 2.1, h = 0.32, t = 0.06;
        panel(w, t, d, 0, t / 2, 0.35); panel(w, h, t, 0, h / 2, 0.35 - d / 2); panel(w, h, t, 0, h / 2, 0.35 + d / 2); panel(t, h, d, -w / 2, h / 2, 0.35); panel(t, h, d, w / 2, h / 2, 0.35);
        const back = new T.Group(), sh = m.outline(), b = bboxOf(sh); back.add(ext(sh, 0.1, mat)); writeSlots(back, m.slots, st, 0.1, false);
        const small = ext(archS(1.2, 1.4), 0.08, sheetMat(st.mat === "white" ? "rose" : "white")); small.position.set(1.45, -0.25, -0.12); back.add(small);
        back.position.set(-0.2, h - b.min.y, 0.35 - d / 2 + 0.12); grp.add(back);
        const cm2 = [phys({ color: 0xffffff, roughness: 0.5 }), goldMat()]; for (let i = 0; i < 8; i++) grp.add(mesh(new T.BoxGeometry(0.5, 0.18, 0.32), cm2[i % 2], -1.2 + (i % 4) * 0.8, 0.15, 0.6 + Math.floor(i / 4) * 0.55));
        return grp;
      }
      if (m.custom === "book") {
        const pw = 1.55, ph = 2.2, frameS = rrect(pw, ph, 0.08), fr = shapeFrom(frameS.getPoints(80)); fr.holes.push(new T.Path(inner(frameS, 80, 0.12)));
        [1, -1].forEach((sx) => {
          const pg = new T.Group(), p = ext(rrect(pw, ph, 0.08), 0.07, mat, 0.01); pg.add(p);
          const f = ext(fr, 0.03, goldMat(), 0); f.position.z = 0.06; pg.add(f);
          if (sx > 0) { if (st.photo) pg.add(mesh(new T.PlaneGeometry(pw * 0.8, ph * 0.8), new T.MeshBasicMaterial({ map: coverTex(st.photo, 0.73), toneMapped: false }), 0, 0, 0.07)); writeSlots(pg, m.slots, st, 0.09, false); }
          else { const tx = new T.CanvasTexture(textCanvas(st, 1.2, 0.4, "line")); pg.add(mesh(new T.PlaneGeometry(1.2, 0.4), inkMat(st.ink, tx), 0, 0.35, 0.09)); ringsMotif(pg, 0.1, -0.35, 0.1, 0.9); }
          pg.children.forEach((c) => (c.position.x += sx * pw / 2));
          const hinge = new T.Group(); hinge.add(pg); hinge.rotation.y = -sx * 0.42; hinge.position.y = ph / 2 + 0.02; grp.add(hinge);
        });
        [-0.6, 0.6].forEach((x) => grp.add(mesh(new T.BoxGeometry(0.06, 0.05, 0.5), goldMat(), x, 0.03, 0.5)));
        return grp;
      }
      if (m.custom === "bottle") {
        const w = 1.4, h = 1.75, d = 0.75, body = mesh(new T.BoxGeometry(w, h, d, 1, 1, 1), sheetMat(st.mat), 0, h / 2, 0); grp.add(body);
        grp.add(mesh(new T.CylinderGeometry(0.25, 0.3, 0.2, 24), goldMat(), 0, h + 0.1, 0));
        const cap = mesh(new T.CylinderGeometry(0.42, 0.42, 0.6, 8), st.mat === "black" ? sheetMat("black") : sheetMat("clear"), 0, h + 0.5, 0); grp.add(cap);
        const fr = rrect(1.2, 1.35, 0.06), ring = shapeFrom(fr.getPoints(60)); ring.holes.push(new T.Path(inner(fr, 60, 0.05))); const f = ext(ring, 0.01, goldMat(), 0); f.position.set(0, h / 2, d / 2 + 0.01); grp.add(f);
        face(1.1, 1.1, d / 2 + 0.03, h / 2, m.slots.map((s) => Object.assign({}, s, { x: 0, y: 0, w: 1.1, h: 1.1 })));
        return grp;
      }
      if (m.custom === "wings") {
        // جناح ريش: حافة عليا ناعمة وحافة سفلية مموّجة
        const wing = (sx) => { const s = S2(), f = (x, y) => [sx * x, y]; s.moveTo(...f(0.12, 0.35)); s.bezierCurveTo(...f(0.55, 1.6), ...f(1.5, 2.85), ...f(2.3, 3.05));
          const tips = [[2.2, 2.35], [2.05, 1.75], [1.85, 1.2], [1.55, 0.7], [1.15, 0.3], [0.6, 0.05], [0.15, 0.0]]; let p = [2.3, 3.05];
          tips.forEach((q) => { s.quadraticCurveTo(...f((p[0] + q[0]) / 2 - 0.22, (p[1] + q[1]) / 2 - 0.08), ...f(q[0], q[1])); p = q; }); s.lineTo(...f(0.12, 0.35)); return s; };
        const top = new T.Group();
        [1, -1].forEach((sx) => { const wm = ext(wing(sx), 0.1, mat); top.add(wm); const fr = ext(shapeFrom(wing(sx).getPoints(90)), 0.02, goldMat(), 0); fr.scale.setScalar(0.995); fr.position.z = -0.07; top.add(fr);
          for (let i = 0; i < 4; i++) { const l = mesh(new T.BoxGeometry(0.9 - i * 0.12, 0.018, 0.02), goldMat(), sx * (1.1 + i * 0.2), 0.75 + i * 0.32, 0.07); l.position.set(sx * (0.9 + i * 0.28), 1.0 + i * 0.45, 0.07); l.rotation.z = sx * (0.75 + i * 0.08); top.add(l); } });
        const disc = mesh(new T.CylinderGeometry(0.72, 0.72, 0.08, 64), sheetMat("white"), 0, 1.85, 0.12); disc.rotation.x = Math.PI / 2; top.add(disc);
        const tr = mesh(new T.TorusGeometry(0.75, 0.05, 12, 64), goldMat(), 0, 1.85, 0.12); top.add(tr);
        [-0.28, 0.28].forEach((x) => top.add(mesh(new T.TorusGeometry(0.42, 0.035, 10, 48), goldMat(), x, 1.85, 0.2)));
        writeSlots(top, m.slots, st, 0.22, false, 0, 1.85);
        top.add(mesh(new T.OctahedronGeometry(0.14), goldMat(), 0, 2.72, 0.12));
        top.position.set(0, 0.3, -0.3); grp.add(top);
        grp.add(mesh(new T.CylinderGeometry(1.9, 1.95, 0.18, 64), sheetMat("wood"), 0, 0.09, 0.4)); grp.add(mesh(new T.CylinderGeometry(1.82, 1.82, 0.16, 64), sheetMat("white"), 0, 0.26, 0.4));
        const tx = new T.CanvasTexture(textCanvas(st, 2.2, 0.5, "line")), lp = mesh(new T.PlaneGeometry(2.2, 0.5), inkMat(st.ink, tx), 0, 0.345, 1.25); lp.rotation.x = -Math.PI / 2; grp.add(lp);
        ringsMotif(grp, 0.1, 0.62, 1.95, 0.8);
        return grp;
      }
      return flat(M.arch, st);
    }

    function build(st) {
      if (piece) { holder.remove(piece); piece.traverse((o) => { o.geometry && o.geometry.dispose(); }); }
      lid = null;
      const m = M[st.shape] || M.arch;
      piece = m.custom ? custom(m, st) : flat(m, st);
      // كل مجسم بينعرض بنفس الحجم تقريباً وواقف عالأرض بالنص
      const box = new T.Box3().setFromObject(piece), size = box.getSize(new T.Vector3());
      const k = Math.min(3.9 / size.y, 4.3 / Math.max(size.x, size.z * 0.9), 1.6);
      piece.scale.setScalar(k);
      piece.position.set(-((box.min.x + box.max.x) / 2) * k, -2.05 - box.min.y * k, -((box.min.z + box.max.z) / 2) * k * 0.5);
      scene.background.copy(m.glow ? night : bg); floorMat.color.copy(m.glow ? night.clone().multiplyScalar(1.3) : bg.clone().multiplyScalar(0.92));
      holder.add(piece);
      pop = 0; dirty = 2;
      // تجهيز الشيدرات بالخلفية (إذا المتصفح بيدعمها) حتى ما يعلّق السحب
      if (renderer.compileAsync) { ready = false; const go = () => (ready = true); renderer.compileAsync(scene, camera).then(go, go); setTimeout(go, 2500); }
    }

    let running = true, t = 0, lastT = performance.now();
    new IntersectionObserver(([e]) => (running = e.isIntersecting)).observe(host);
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      if (!running || !ready) return; t += dt;
      const moving = rot.drag || Math.abs(rot.vy) > 0.0004 || pop < 1 || (!LITE && rot.idle > 2);
      if (!moving && dirty <= 0) return; if (!moving) dirty--; else dirty = 2;
      if (!rot.drag) { rot.idle += dt; rot.vy *= 0.94; rot.y += rot.vy; if (rot.idle > 2) rot.y += Math.sin(t * 0.5) * 0.0025; }
      pop = Math.min(1, pop + dt * 2.2);
      const e = 1 - Math.pow(1 - pop, 3), over = Math.sin(pop * Math.PI) * 0.06;
      holder.rotation.set(rot.x, rot.y, 0); holder.scale.setScalar(0.9 + e * 0.1 + over);
      holder.position.y = (1 - e) * 0.4;
      if (lid) lid.rotation.x = -e * 0.28;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);
    return { build, png: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png"); } };
  }

  /* ---------- عرض 2D قبل القص: خط القص الأحمر والكتابة بمكانها ---------- */
  function svg2d(st, colors) {
    const m = M[st.shape] || M.arch;
    if (m.custom === "box") return boxNet(st, colors, m);
    const shape = m.outline(), b = bboxOf(shape), pad = 0.35;
    const vb = [b.min.x - pad, -b.max.y - pad, b.max.x - b.min.x + pad * 2, b.max.y - b.min.y + pad * 2];
    const path = (pts) => "M" + pts.map((p) => `${p.x.toFixed(3)} ${(-p.y).toFixed(3)}`).join("L") + "Z";
    const d = path(shape.getPoints(80)) + shape.holes.map((h) => path(h.getPoints(24))).join("");
    const id = "c" + Math.random().toString(36).slice(2, 7), inkCol = INK2D[st.ink] || INK2D.gold;
    const masks = m.slots.map((s, i) => `<mask id="${id}m${i}"><image href="${textCanvas(st, s.w, s.h, s.mode).toDataURL()}" x="${(s.x - s.w / 2).toFixed(3)}" y="${(-s.y - s.h / 2).toFixed(3)}" width="${s.w}" height="${s.h}" preserveAspectRatio="none"/></mask>`).join("");
    return `<svg viewBox="${vb.join(" ")}" aria-hidden="true">
      <defs><clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath><pattern id="${id}g" width=".25" height=".25" patternUnits="userSpaceOnUse"><path d="M.25 0H0V.25" fill="none" stroke="rgba(0,0,0,.06)" stroke-width=".006"/></pattern>${masks}</defs>
      <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="url(#${id}g)"/>
      <path d="${d}" fill-rule="evenodd" fill="${FILL2D[st.mat] || FILL2D.clear}" stroke="rgba(0,0,0,.15)" stroke-width=".01"/>
      ${st.photo ? `<image href="${st.photoUrl}" x="${b.min.x}" y="${-b.max.y}" width="${b.max.x - b.min.x}" height="${b.max.y - b.min.y}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>` : ""}
      ${m.slots.map((s, i) => `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${inkCol}" mask="url(#${id}m${i})"/>`).join("")}
      <path class="px-cut" d="${d}" fill="none" stroke="#ff2d55" stroke-width=".022" stroke-dasharray=".08 .05"/>
      <g class="px-dim" stroke="${colors.muted}" stroke-width=".01" fill="${colors.muted}" font-size=".16" font-family="Tajawal, sans-serif" text-anchor="middle">
        <path d="M${b.min.x} ${-b.min.y + 0.2}H${b.max.x}M${b.min.x} ${-b.min.y + 0.12}v.16M${b.max.x} ${-b.min.y + 0.12}v.16" fill="none"/>
        <text x="${(b.min.x + b.max.x) / 2}" y="${-b.min.y + 0.33}" stroke="none">${esc(m.cm)}</text>
      </g></svg>`;
  }
  // فرد علبة الضيافة: قاع، أربع جوانب، والغطا، مع خطوط الطي
  function boxNet(st, colors, m) {
    const W = 26, D = 18, H = 14, g = 3, pad = 4, tw = W + 2 * H, th = D + 2 * H + D + g, ox = H, oy = H;
    const cut = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${FILL2D[st.mat] || FILL2D.clear}" stroke="#ff2d55" stroke-width=".25" stroke-dasharray=".9 .5" class="px-cut"/>`;
    const fold = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${colors.muted}" stroke-width=".18" stroke-dasharray=".4 .4"/>`;
    const tc = textCanvas(st, W, H), id = "b" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="${-pad} ${-pad} ${tw + pad * 2} ${th + pad * 2 + 4}" aria-hidden="true" font-family="Tajawal, sans-serif">
      <defs><mask id="${id}"><image href="${tc.toDataURL()}" x="${ox}" y="${oy + D}" width="${W}" height="${H}" preserveAspectRatio="none"/></mask></defs>
      ${cut(ox, oy, W, D)}${cut(ox, 0, W, H)}${cut(ox, oy + D, W, H)}${cut(0, oy, H, D)}${cut(ox + W, oy, H, D)}${cut(ox - 0.5, oy + D + H + g, W + 1, D + 1)}
      ${st.photo ? `<image href="${st.photoUrl}" x="${ox}" y="${oy + D}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : ""}
      <rect x="${ox}" y="${oy + D}" width="${W}" height="${H}" fill="${INK2D[st.ink] || INK2D.gold}" mask="url(#${id})"/>
      ${fold(ox, oy, ox + W, oy)}${fold(ox, oy + D, ox + W, oy + D)}${fold(ox, oy, ox, oy + D)}${fold(ox + W, oy, ox + W, oy + D)}
      <g fill="${colors.muted}" font-size="1.6" text-anchor="middle">
        <text x="${ox + W / 2}" y="${oy + D / 2 + 0.6}">القاع</text><text x="${ox + W / 2}" y="${H / 2 + 0.6}">الجانب الخلفي</text><text x="${H / 2}" y="${oy + D / 2 + 0.6}">جانب</text><text x="${ox + W + H / 2}" y="${oy + D / 2 + 0.6}">جانب</text>
        <text x="${ox + W / 2}" y="${oy + D + H + g + D / 2 + 0.6}">الغطا</text>
        <text x="${tw / 2}" y="${th + 3.6}">${esc(m.cm)} · خط أحمر = قص، منقّط = طي</text></g></svg>`;
  }

  SM.pxKit = { engine, svg2d, guess, SHAPES, MATS, INKS, icons, STUDIO, textCanvas };
})();
