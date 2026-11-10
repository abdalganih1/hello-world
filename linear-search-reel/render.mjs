// Renders reel.html + the synthesized soundtrack into linear-search-khwarizmo.mp4 (1080x1920, 30 fps, Reels).
// Usage: node render.mjs                              full render (parallel headless-Chromium workers)
//        STILLS=3.5,7,10.5 [STILLS_DIR=dir] node render.mjs   just those frames as JPG
//        AUDIO_ONLY=1 node render.mjs                 just build/soundtrack.wav
import { chromium } from "playwright";
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(dir, "linear-search-khwarizmo.mp4");
const BUILD = path.join(dir, "build"); mkdirSync(BUILD, { recursive: true });
const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const FPS = tl.fps;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
let TOTAL = 0;
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message, e.stack); process.exit(1); });
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto(`${base}/reel.html`, { waitUntil: "load" });
  TOTAL = await page.evaluate(async (tl) => window.setup(tl), tl);
  return page;
}
async function audio(page) { // sound events come from the same schedule the picture uses
  const ev = await page.evaluate(() => window.collectSfx());
  const events = path.join(BUILD, "events.json"), wav = path.join(BUILD, "soundtrack.wav");
  writeFileSync(events, JSON.stringify(ev)); execFileSync("python3", [path.join(dir, "music.py"), events, wav], { stdio: "inherit" }); return wav;
}
if (process.env.AUDIO_ONLY) { const p = await openPage(); await audio(p); await browser.close(); server.close(); process.exit(0); }
if (process.env.STILLS) {
  const outDir = process.env.STILLS_DIR || path.join(BUILD, "stills"); mkdirSync(outDir, { recursive: true });
  const page = await openPage();
  for (const t of process.env.STILLS.split(",").map(Number)) { await page.evaluate((x) => window.seek(x), t); await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2).padStart(6, "0")}.jpg`), type: "jpeg", quality: 85 }); }
  await browser.close(); server.close(); process.exit(0);
}
const FR = path.join(BUILD, "frames"); rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const first = await openPage(); const FRAMES = Math.round(TOTAL * FPS); const wav = await audio(first);
let next = 0, done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: +(process.env.WORKERS || 4) }, async (_, w) => {
  const page = w === 0 ? first : await openPage();
  while (next < FRAMES) { const f = next++; await page.evaluate((x) => window.seek(x), f / FPS);
    await page.screenshot({ path: path.join(FR, `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 95 });
    if (++done % 150 === 0) console.log(`${done}/${FRAMES} frames  (${((Date.now() - t0) / done).toFixed(0)} ms/frame)`); }
}));
await browser.close(); server.close();
const r = spawnSync(FFMPEG, ["-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(FR, "f%05d.jpg"), "-i", wav, "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-maxrate", "14M", "-bufsize", "28M", "-preset", "slow", "-profile:v", "high", "-level", "4.2",
  "-c:a", "aac", "-b:a", "256k", "-ar", "44100", "-t", TOTAL.toFixed(3), "-movflags", "+faststart", OUT], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status);
console.log(`wrote ${OUT} (${TOTAL.toFixed(1)}s) in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
