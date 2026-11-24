/* صمّم · رسم القطع لقالب «الرف» بشكل قريب من الصورة الحقيقية
   كل قطعة: قصّة (silhouette) + أجزاء بدرجات + طيّات قماش ناعمة (ظل وضو مموّهين) + ظل داخلي عالحواف
   + نسيج قماش خفيف + درزات. اللون بيجي من المنتج، فنفس الرسمة بتنفع لأي لون.
   viewBox 0 0 200 300، الأكتاف حوالي y=42 حتى تقعد عالعلّاقة. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const hex6 = (h) => { h = String(h || "#888").replace("#", ""); if (h.length === 3) h = h.split("").map((x) => x + x).join(""); return h.slice(0, 6); };
  const lum = (h) => { const n = parseInt(hex6(h), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const shade = (h, k) => { const n = parseInt(hex6(h), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join(""); };

  /* القصّات. parts: [path, درجة (+ أفتح / - أغمق)]، folds: طيّات غامقة، lights: لمعات، seams: درزات، ribs: مناطق مضلّعة */
  const K = {
    tee: {
      sil: "M72 40 C84 50 116 50 128 40 L160 50 C170 54 177 62 182 74 L193 99 L163 113 L155 99 C153 140 155 190 157 240 C120 247 80 247 43 240 C45 190 47 140 45 99 L37 113 L7 99 L18 74 C23 62 30 54 40 50 Z",
      parts: [["M72 40 C84 50 116 50 128 40 C120 58 80 58 72 40 Z", -0.45]],
      ribs: ["M70 39 C82 60 118 60 130 39"],
      folds: ["M58 118 C64 160 56 200 62 238", "M142 116 C136 160 144 200 138 238", "M47 100 C56 112 58 124 60 136", "M153 100 C144 112 142 124 140 136", "M24 78 L40 96", "M176 78 L160 96", "M90 200 C96 218 92 232 96 242"],
      lights: ["M82 66 C84 130 78 190 84 238", "M120 66 C124 130 118 190 122 238", "M30 70 L22 92"],
      extra: (c) => (c.print === 1 && c.mark ? `<circle cx="126" cy="92" r="10" fill="none" stroke="${c.trim}" stroke-width="2"/><text x="126" y="97" text-anchor="middle" font-family="Changa,Arial,sans-serif" font-weight="800" font-size="13" fill="${c.trim}">${c.mark}</text>` : c.print === 2 && c.word ? `<text x="100" y="140" text-anchor="middle" font-family="Changa,Arial,sans-serif" font-weight="800" font-size="34" fill="${c.acc2}" opacity=".92">${c.word}</text>` : ""),
      seams: ["M45 233 C80 240 120 240 155 233", "M11 95 L39 108", "M161 108 L189 95", "M40 50 C44 70 45 86 45 99", "M160 50 C156 70 155 86 155 99"],
    },
    sweat: {
      sil: "M70 40 C84 50 116 50 130 40 L162 52 C175 58 182 72 184 92 C188 140 190 180 191 214 L167 220 C165 180 161 140 157 112 C157 160 157 200 157 230 L158 244 C120 250 80 250 42 244 L43 230 C43 200 43 160 43 112 C39 140 35 180 33 220 L9 214 C10 180 12 140 16 92 C18 72 25 58 38 52 Z",
      parts: [["M70 40 C84 50 116 50 130 40 C120 58 80 58 70 40 Z", -0.45], ["M43 228 C80 234 120 234 157 228 L158 244 C120 250 80 250 42 244 Z", -0.07], ["M9 205 L33 210 L33 222 L9 216 Z", -0.07], ["M167 210 L191 205 L191 216 L167 222 Z", -0.07]],
      ribs: ["M68 39 C82 61 118 61 132 39"],
      ribLines: [[44, 229, 156, 242, 6]],
      folds: ["M58 120 C64 160 56 200 62 228", "M142 118 C136 160 144 200 138 228", "M44 112 C54 122 58 132 60 146", "M156 112 C146 122 142 132 140 146", "M22 110 C26 140 24 170 28 200", "M178 110 C174 140 176 170 172 200", "M70 170 C90 180 110 180 130 170"],
      lights: ["M84 66 C86 130 80 190 86 228", "M120 66 C124 130 118 190 122 228", "M18 100 C16 140 14 170 16 200", "M182 100 C184 140 186 170 184 200"],
      seams: ["M38 52 C42 72 43 92 43 112", "M162 52 C158 72 157 92 157 112"],
    },
    hoodie: {
      back: [["M58 50 C52 18 148 18 142 50 C134 72 66 72 58 50 Z", -0.16]],
      sil: "M66 44 C80 54 120 54 134 44 L164 56 C176 62 182 76 184 96 C188 140 190 180 191 214 L167 220 C165 180 161 140 157 116 C157 160 157 200 157 230 L158 246 C120 252 80 252 42 246 L43 230 C43 200 43 160 43 116 C39 140 35 180 33 220 L9 214 C10 180 12 140 16 96 C18 76 24 62 36 56 Z",
      parts: [["M70 48 C74 30 126 30 130 48 C120 64 80 64 70 48 Z", -0.5], ["M64 166 L136 166 L146 214 L54 214 Z", -0.05], ["M43 230 C80 236 120 236 157 230 L158 246 C120 252 80 252 42 246 Z", -0.07], ["M9 205 L33 210 L33 222 L9 216 Z", -0.07], ["M167 210 L191 205 L191 216 L167 222 Z", -0.07]],
      ribs: ["M66 46 C72 22 128 22 134 46"],
      ribLines: [[44, 231, 156, 244, 6]],
      folds: ["M58 120 C62 150 58 170 60 200", "M142 118 C138 150 142 170 140 200", "M44 116 C54 126 58 136 60 150", "M156 116 C146 126 142 136 140 150", "M22 112 C26 142 24 172 28 202", "M178 112 C174 142 176 172 172 202", "M64 166 L54 214", "M136 166 L146 214"],
      lights: ["M84 70 C86 120 82 150 84 166", "M118 70 C122 120 118 150 120 166", "M18 104 C16 140 14 170 16 200", "M182 104 C184 140 186 170 184 200", "M90 180 C92 196 90 206 92 214"],
      seams: ["M64 166 L136 166 L146 214 L54 214 Z", "M36 56 C40 76 43 96 43 116", "M164 56 C160 76 157 96 157 116"],
      extra: (c) => `<path d="M90 60 C89 80 88 96 87 112 M110 60 C111 80 112 96 113 112" stroke="${c.trim}" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="87" cy="113" r="2.4" fill="${c.trim}"/><circle cx="113" cy="113" r="2.4" fill="${c.trim}"/>`,
    },
    shirt: {
      sil: "M68 38 C84 46 116 46 132 38 L164 52 C176 58 182 72 184 92 C188 140 190 180 190 222 L166 226 C164 186 160 146 156 116 C156 160 156 200 156 236 C150 250 136 256 120 250 C108 254 92 254 80 250 C64 256 50 250 44 236 C44 200 44 160 44 116 C40 146 36 186 34 226 L10 222 C10 180 12 140 16 92 C18 72 24 58 36 52 Z",
      parts: [["M68 38 C84 46 116 46 132 38 C126 50 74 50 68 38 Z", -0.45], ["M96 50 L104 50 L104 252 L96 252 Z", -0.05], ["M62 98 L88 98 L88 124 C82 128 68 128 62 124 Z", -0.05], ["M10 212 L34 216 L34 228 L10 224 Z", -0.08], ["M166 216 L190 212 L190 224 L166 228 Z", -0.08]],
      folds: ["M60 130 C66 170 58 210 64 246", "M140 130 C134 170 142 210 136 246", "M44 116 C54 126 58 136 60 150", "M156 116 C146 126 142 136 140 150", "M22 110 C26 140 24 170 28 206", "M178 110 C174 140 176 170 172 206", "M104 60 C112 120 110 180 112 240"],
      lights: ["M80 76 C84 140 78 190 82 244", "M124 76 C128 140 122 190 126 244", "M18 100 C16 140 14 170 16 206", "M182 100 C184 140 186 170 184 206"],
      over: [["M68 34 C80 42 90 46 100 50 L84 78 C76 70 66 56 60 44 Z", -0.04], ["M132 34 C120 42 110 46 100 50 L116 78 C124 70 134 56 140 44 Z", 0.03]],
      seams: ["M62 98 L88 98", "M36 52 C40 72 43 94 44 116", "M164 52 C160 72 157 94 156 116"],
      extra: (c) => [76, 106, 136, 166, 196, 226].map((y) => `<circle cx="100" cy="${y}" r="2.6" fill="${c.btn}"/><circle cx="100" cy="${y}" r="2.6" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`).join(""),
    },
    jersey: {
      sil: "M70 40 L100 66 L130 40 L160 50 C170 54 177 62 182 74 L193 99 L163 113 L155 99 C153 140 155 190 157 240 C120 247 80 247 43 240 C45 190 47 140 45 99 L37 113 L7 99 L18 74 C23 62 30 54 40 50 Z",
      parts: [["M70 40 L100 66 L130 40 L124 40 L100 58 L76 40 Z", -0.5]],
      folds: ["M58 118 C64 160 56 200 62 238", "M142 116 C136 160 144 200 138 238", "M47 100 C56 112 58 124 60 136", "M153 100 C144 112 142 124 140 136", "M24 78 L40 96", "M176 78 L160 96"],
      lights: ["M82 74 C84 130 78 190 84 238", "M120 74 C124 130 118 190 122 238"],
      seams: ["M45 233 C80 240 120 240 155 233", "M40 50 C44 70 45 86 45 99", "M160 50 C156 70 155 86 155 99"],
      extra: (c) => `<path d="M68 39 L100 68 L132 39" stroke="${c.acc}" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="M52 104 C51 150 52 190 53 236 M148 104 C149 150 148 190 147 236" stroke="${c.acc}" stroke-width="8" fill="none"/><path d="M9 95 L37 108 M163 108 L191 95" stroke="${c.acc}" stroke-width="6"/><text x="100" y="176" text-anchor="middle" font-family="Changa,Arial,sans-serif" font-weight="800" font-size="62" fill="${c.acc}" opacity=".95">${c.n}</text>`,
    },
    jacket: {
      sil: "M64 40 C80 50 120 50 136 40 L166 54 C180 60 186 76 188 98 C192 140 194 180 194 214 L168 222 C166 182 162 144 158 118 C158 160 158 200 158 228 L160 250 C120 258 80 258 40 250 L42 228 C42 200 42 160 42 118 C38 144 34 182 32 222 L6 214 C6 180 8 140 12 98 C14 76 20 60 34 54 Z",
      parts: [["M64 40 C80 50 120 50 136 40 C128 58 72 58 64 40 Z", -0.5], ["M42 230 C80 238 120 238 158 230 L160 250 C120 258 80 258 40 250 Z", -0.1], ["M6 204 L32 210 L32 224 L6 216 Z", -0.1], ["M168 210 L194 204 L194 216 L168 224 Z", -0.1], ["M62 120 L72 120 L66 168 L56 168 Z", -0.12], ["M138 120 L128 120 L134 168 L144 168 Z", -0.12]],
      sleeves: ["M64 40 L34 54 C20 60 14 76 12 98 C8 140 6 180 6 214 L32 222 C34 182 38 144 42 118 C42 100 44 70 64 40 Z", "M136 40 L166 54 C180 60 186 76 188 98 C192 140 194 180 194 214 L168 222 C166 182 162 144 158 118 C158 100 156 70 136 40 Z"],
      ribs: ["M62 39 C80 62 120 62 138 39"],
      ribLines: [[42, 232, 158, 248, 5]],
      folds: ["M60 130 C66 170 58 200 62 228", "M140 130 C134 170 142 200 138 228", "M42 118 C52 130 56 140 58 152", "M158 118 C148 130 144 140 142 152", "M20 112 C24 142 22 172 26 204", "M180 112 C176 142 178 172 174 204", "M60 196 C80 206 120 206 140 196"],
      lights: ["M80 66 C84 130 78 180 82 228", "M122 66 C126 130 120 180 124 228", "M16 104 C14 140 12 170 14 204", "M184 104 C186 140 188 170 186 204"],
      seams: ["M34 54 C38 76 41 98 42 118", "M166 54 C162 76 159 98 158 118"],
      extra: (c) => `<path d="M100 56 L100 252" stroke="${c.zip}" stroke-width="3.2"/><path d="M100 56 L100 252" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="1.5 2"/><rect x="97" y="58" width="6" height="12" rx="2" fill="${c.zip}"/>` + (c.mark ? `<text x="72" y="104" text-anchor="middle" font-family="Changa,Arial,sans-serif" font-weight="800" font-size="28" fill="${c.patch}" stroke="${c.acc}" stroke-width="1.4" paint-order="stroke">${c.mark}</text>` : ""),
    },
    coat: {
      sil: "M66 38 C82 46 118 46 134 38 L164 52 C178 58 184 74 186 96 C190 140 192 186 192 236 L168 240 C166 196 162 150 158 122 C160 180 164 236 168 290 C124 298 76 298 32 290 C36 236 40 180 42 122 C38 150 34 196 32 240 L8 236 C8 186 10 140 14 96 C16 74 22 58 36 52 Z",
      parts: [["M66 38 C82 46 118 46 134 38 C126 50 74 50 66 38 Z", -0.45], ["M42 160 C80 166 120 166 158 160 L159 176 C120 182 80 182 41 176 Z", -0.12], ["M8 226 L32 230 L32 240 L8 236 Z", -0.1], ["M168 230 L192 226 L192 236 L168 240 Z", -0.1]],
      over: [["M66 36 L100 122 L84 128 C74 100 64 74 56 48 Z", -0.08], ["M134 36 L100 122 L116 128 C126 100 136 74 144 48 Z", 0.02]],
      folds: ["M70 124 C66 180 62 236 58 290", "M130 124 C134 180 138 236 142 290", "M100 124 C102 200 98 250 100 294", "M42 122 C52 134 56 146 58 160", "M158 122 C148 134 144 146 142 160", "M20 112 C24 150 22 190 26 228", "M180 112 C176 150 178 190 174 228", "M84 182 C80 230 76 260 74 292"],
      lights: ["M84 130 C82 190 78 240 76 290", "M118 130 C120 190 124 240 126 290", "M16 100 C14 150 12 190 14 228", "M184 100 C186 150 188 190 186 228"],
      seams: ["M100 120 L100 294", "M36 52 C40 76 42 100 42 122", "M164 52 C160 76 158 100 158 122"],
      extra: (c) => `<rect x="94" y="161" width="14" height="17" rx="2" fill="none" stroke="${c.btn}" stroke-width="2.4"/>` + [134, 196, 236].map((y) => `<circle cx="90" cy="${y}" r="3" fill="${c.btn}"/><circle cx="110" cy="${y}" r="3" fill="${c.btn}"/>`).join(""),
    },
    dress: {
      sil: "M78 38 C88 52 112 52 122 38 L134 42 C136 70 134 92 130 110 C150 150 168 210 182 284 C130 296 70 296 18 284 C32 210 50 150 70 110 C66 92 64 70 66 42 Z",
      parts: [["M78 38 C88 52 112 52 122 38 C114 58 86 58 78 38 Z", -0.45], ["M70 104 C90 110 110 110 130 104 L131 118 C110 124 90 124 69 118 Z", -0.14]],
      folds: ["M86 124 C76 180 62 230 50 288", "M114 124 C124 180 138 230 150 288", "M100 124 C100 190 98 240 100 292", "M74 122 C60 170 44 230 30 284", "M126 122 C140 170 156 230 170 284", "M72 70 C76 84 76 96 74 104", "M128 70 C124 84 124 96 126 104"],
      lights: ["M92 126 C86 190 78 240 72 290", "M108 126 C114 190 122 240 128 290", "M90 60 C92 80 92 96 92 104"],
      seams: ["M22 280 C70 291 130 291 178 280"],
    },
    skirt: {
      hook: true,
      sil: "M62 48 L138 48 L140 62 C160 120 174 180 184 244 C130 256 70 256 16 244 C26 180 40 120 60 62 Z",
      parts: [["M62 48 L138 48 L140 64 C110 68 90 68 60 64 Z", -0.14]],
      folds: ["M78 68 C70 130 58 190 46 248", "M100 68 L100 254", "M122 68 C130 130 142 190 154 248", "M90 68 C86 140 80 200 74 252", "M110 68 C114 140 120 200 126 252", "M66 68 C54 130 40 190 28 246", "M134 68 C146 130 160 190 172 246"],
      lights: ["M84 70 C78 140 70 200 62 250", "M116 70 C122 140 130 200 138 250", "M95 70 C93 140 92 200 90 254"],
      seams: ["M20 240 C70 251 130 251 180 240", "M60 64 C90 68 110 68 140 64"],
    },
    pants: {
      hook: true,
      sil: "M58 48 L142 48 L143 64 C148 140 152 220 154 292 L110 292 C108 220 104 160 100 122 C96 160 92 220 90 292 L46 292 C48 220 52 140 57 64 Z",
      parts: [["M58 48 L142 48 L143 64 C110 68 90 68 57 64 Z", -0.14], ["M57 70 C62 90 72 96 86 96 L88 72 Z", -0.08], ["M143 70 C138 90 128 96 114 96 L112 72 Z", -0.08]],
      folds: ["M72 140 C70 200 70 250 68 292", "M128 140 C130 200 130 250 132 292", "M100 66 L100 122", "M60 200 C64 230 60 260 62 290", "M140 200 C136 230 140 260 138 290", "M80 106 C88 118 94 124 100 126"],
      lights: ["M80 130 C78 190 78 240 76 290", "M120 130 C122 190 122 240 124 290"],
      seams: ["M57 64 C90 68 110 68 143 64", "M100 66 L100 122", "M48 286 L90 286", "M110 286 L152 286"],
      extra: (c) => [66, 86, 114, 134].map((x) => `<rect x="${x - 2}" y="47" width="4" height="18" rx="1" fill="${c.loop}"/>`).join("") + `<circle cx="100" cy="56" r="2.6" fill="${c.btn}"/>`,
    },
  };

  let uid = 0;
  function render(kind, tone, o = {}) {
    const g = K[kind] || K.tee, id = "rg" + ++uid, L = lum(tone), dark = L < 0.35;
    const deep = shade(tone, dark ? -0.55 : -0.42), soft = shade(tone, dark ? 0.22 : 0.5);
    const sleeveTone = o.sleeves || null;
    const c = { trim: dark ? shade(tone, 0.55) : shade(tone, -0.5), btn: dark ? "#d9d4c8" : shade(tone, -0.55), acc: o.accent || "#2fdc3f", n: o.n || 10, zip: dark ? "#9aa0a6" : "#3a3a3c", patch: dark ? "#f2f0ea" : shade(tone, -0.6), mark: o.mark || "", loop: shade(tone, -0.2), print: o.print || 0, word: o.word || "", acc2: o.accent2 || "#ff4f9a" };
    const P = (d, f, extra = "") => `<path d="${d}" fill="${f}"${extra}/>`;
    const defs = `<defs>
      <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(tone, 0.06)}"/><stop offset=".55" stop-color="${tone}"/><stop offset="1" stop-color="${shade(tone, -0.12)}"/></linearGradient>
      <linearGradient id="${id}h" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
      <clipPath id="${id}c"><path d="${g.sil}"/></clipPath>
      <filter id="${id}b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.5"/></filter>
      <filter id="${id}b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${uid % 9}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <filter id="${id}s" x="-30%" y="-10%" width="160%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="10"/><feComponentTransfer><feFuncA type="linear" slope="${dark ? 0.45 : 0.28}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
    const back = (g.back || []).map(([d, k]) => P(d, shade(tone, k))).join("");
    const hook = g.hook ? `<path d="M52 36 H148" stroke="#a7adb4" stroke-width="5" stroke-linecap="round"/><path d="M60 36 V50 M140 36 V50" stroke="#8d939a" stroke-width="3"/><rect x="54" y="44" width="12" height="10" rx="2" fill="#7f858c"/><rect x="134" y="44" width="12" height="10" rx="2" fill="#7f858c"/>` : "";
    const ribs = (g.ribs || []).map((d) => `<path d="${d}" fill="none" stroke="${shade(tone, -0.1)}" stroke-width="6.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${shade(tone, -0.3)}" stroke-width="6.5" stroke-dasharray="1 2.2" opacity=".35"/>`).join("");
    const ribLines = (g.ribLines || []).map(([x0, y0, x1, y1, step]) => { let s = ""; for (let x = x0 + step; x < x1; x += step) s += `M${x} ${y0}V${y1}`; return `<path d="${s}" stroke="${shade(tone, -0.28)}" stroke-width="1" opacity=".4"/>`; }).join("");
    const sleeves = sleeveTone && g.sleeves ? g.sleeves.map((d) => P(d, sleeveTone)).join("") : "";
    const inside = `<g clip-path="url(#${id}c)">
        ${sleeves}
        ${(g.parts || []).map(([d, k]) => P(d, shade(tone, k))).join("")}
        <rect x="0" y="0" width="200" height="300" fill="url(#${id}h)"/>
        <g filter="url(#${id}b)" fill="none" stroke-linecap="round">
          ${(g.folds || []).map((d) => `<path d="${d}" stroke="${deep}" stroke-width="9" opacity="${dark ? 0.5 : 0.32}"/>`).join("")}
          ${(g.lights || []).map((d) => `<path d="${d}" stroke="${soft}" stroke-width="10" opacity="${dark ? 0.3 : 0.45}"/>`).join("")}
        </g>
        <path d="${g.sil}" fill="none" stroke="${deep}" stroke-width="16" opacity="${dark ? 0.6 : 0.4}" filter="url(#${id}b2)"/>
        ${ribs}${ribLines}
        ${(g.seams || []).map((d) => `<path d="${d}" fill="none" stroke="${dark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.2)"}" stroke-width=".9" stroke-dasharray="2.2 2"/>`).join("")}
        ${g.extra ? g.extra(c) : ""}
        <rect x="0" y="0" width="200" height="300" filter="url(#${id}n)" opacity="${dark ? 0.16 : 0.12}" style="mix-blend-mode:overlay"/>
      </g>`;
    const over = (g.over || []).map(([d, k]) => `<path d="${d}" fill="${shade(tone, k)}" stroke="${dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)"}" stroke-width="1" stroke-linejoin="round"/>`).join("");
    const overSh = over ? `<g filter="url(#${id}b)" opacity="${dark ? 0.6 : 0.35}">${(g.over || []).map(([d]) => `<path d="${d}" fill="#000" transform="translate(0 3)"/>`).join("")}</g>` : "";
    return `<svg class="rk-g" viewBox="0 0 200 300" aria-hidden="true">${defs}${hook}<g filter="url(#${id}s)">${back}${P(g.sil, `url(#${id}v)`)}${inside}${overSh}${over}</g></svg>`;
  }
  SM.rackGarment = render;
  SM.rackKinds = Object.keys(K);
})();
