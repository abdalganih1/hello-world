// Renders index.html (Canvas2D) + build/soundtrack.wav into masar-arduino-ep01.mp4 (1920x1080, 30 fps).
// Usage:  node render.mjs                         full render (4 parallel headless-Chromium workers)
//         STILLS=3.5,7,12 [STILLS_DIR=d] node render.mjs   just those frames as PNG
//         LINES=1 [STILLS_DIR=d] node render.mjs           one still per spoken line (for review)
// Before: python3 tools/build_audio.py && python3 tools/music.py
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, "masar-arduino-ep01.mp4");
const BUILD = path.join(dir, "build");
mkdirSync(BUILD, { recursive: true });
const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const FPS = tl.fps, FRAMES = Math.round(tl.total * FPS);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exit(1); });
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.evaluate(async (tl) => { await window.setup(tl); }, tl);
  return page;
}

if (process.env.STILLS || process.env.LINES) {
  const outDir = process.env.STILLS_DIR || path.join(BUILD, "stills"); mkdirSync(outDir, { recursive: true });
  const times = process.env.LINES ? tl.lines.map((l) => +(Math.min(l.t1 - 0.2, l.t0 + 1.6)).toFixed(2)) : process.env.STILLS.split(",").map(Number);
  const page = await openPage();
  for (const [i, t] of times.entries()) {
    await page.evaluate((x) => window.seek(x), t);
    const name = process.env.LINES ? `l${String(i + 1).padStart(3, "0")}_${t.toFixed(2)}.jpg` : `t${t.toFixed(2)}.jpg`;
    await page.screenshot({ path: path.join(outDir, name), type: "jpeg", quality: 80 });
  }
  await browser.close(); server.close(); process.exit(0);
}

const FR = path.join(BUILD, "frames"); rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const workers = +(process.env.WORKERS || 4);
let next = 0, done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async () => {
  const page = await openPage();
  while (next < FRAMES) {
    const f = next++;
    await page.evaluate((x) => window.seek(x), f / FPS);
    await page.screenshot({ path: path.join(FR, `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 93 });
    if (++done % 300 === 0) { const ms = (Date.now() - t0) / done; console.log(`${done}/${FRAMES} frames  ${ms.toFixed(0)} ms/frame  eta ${((FRAMES - done) * ms / 60000).toFixed(1)} min`); }
  }
  await page.close();
}));
await browser.close(); server.close();

const wav = path.join(BUILD, "soundtrack.wav");
const r = spawnSync(process.env.FFMPEG || "ffmpeg", [
  "-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(FR, "f%05d.jpg"), "-i", wav,
  "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-maxrate", "8M", "-bufsize", "16M",
  "-preset", "slow", "-profile:v", "high", "-level", "4.1", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", tl.total.toFixed(3), "-movflags", "+faststart", OUT,
], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status);
console.log(`wrote ${OUT} (${tl.total.toFixed(1)}s) in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
