// Renders reel.html + the synthesized soundtrack into hexapod-mochi.mp4 (1080x1920, 30 fps, Instagram Reels).
// Frames are rendered by parallel headless-Chromium workers (WebGL2 via SwiftShader), then encoded.
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs                 full render
//        STILLS=3,7.5,12 [STILLS_DIR=dir] node render.mjs       just those frames as PNG
//        AUDIO_ONLY=1 node render.mjs                           just build/soundtrack.wav
//        WORKERS=4 / FROM=0 / TO=930 to control the frame range
import { chromium } from "playwright";
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(dir, "hexapod-mochi.mp4");
const BUILD = path.join(dir, "build");
mkdirSync(BUILD, { recursive: true });
const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const FPS = tl.fps, FRAMES = Math.round(tl.total * FPS);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".ttf": "font/ttf", ".bin": "application/octet-stream" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--font-render-hinting=none"] });

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exit(1); });
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error("console:", m.text()); });
  await page.goto(`${base}/reel.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  await page.evaluate(async (tl) => { await window.setup(tl); }, tl);
  return page;
}

function audio(page) {
  return (async () => {
    const sfx = await page.evaluate(() => window.collectSfx());
    const events = path.join(BUILD, "events.json"), wav = path.join(BUILD, "soundtrack.wav");
    writeFileSync(events, JSON.stringify({ ...tl, sfx }));
    execFileSync("python3", [path.join(dir, "music.py"), events, wav], { stdio: "inherit" });
    return wav;
  })();
}

if (process.env.STILLS || process.env.AUDIO_ONLY) {
  const page = await openPage();
  if (process.env.AUDIO_ONLY) { await audio(page); }
  else {
    const outDir = process.env.STILLS_DIR || BUILD; mkdirSync(outDir, { recursive: true });
    for (const t of process.env.STILLS.split(",").map(Number)) {
      const t0 = Date.now();
      await page.evaluate((x) => window.seek(x), t);
      await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2)}.png`) });
      console.log(`t=${t} ${Date.now() - t0} ms`);
    }
  }
  await browser.close(); server.close(); process.exit(0);
}

const FR = path.join(BUILD, "frames");
const from = +(process.env.FROM || 0), to = Math.min(FRAMES, +(process.env.TO || FRAMES));
if (!process.env.FROM) { rmSync(FR, { recursive: true, force: true }); }
mkdirSync(FR, { recursive: true });
const workers = +(process.env.WORKERS || 4);
let next = from, done = 0; const t0 = Date.now();
let wav = null;
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const page = await openPage();
  if (w === 0) wav = await audio(page);
  while (next < to) {
    const f = next++;
    const file = path.join(FR, `f${String(f).padStart(5, "0")}.jpg`);
    if (existsSync(file)) { done++; continue; }
    await page.evaluate((x) => window.seek(x), f / FPS);
    await page.screenshot({ path: file, type: "jpeg", quality: 94 });
    if (++done % 30 === 0) console.log(`${done}/${to - from} frames  (${((Date.now() - t0) / done).toFixed(0)} ms/frame)`);
  }
  await page.close();
}));
await browser.close(); server.close();
if (to < FRAMES) process.exit(0);

const r = spawnSync(FFMPEG, [
  "-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(FR, "f%05d.jpg"), "-i", wav,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-maxrate", "16M", "-bufsize", "32M", "-preset", "slow", "-tune", "grain", "-profile:v", "high", "-level", "4.2",
  "-c:a", "aac", "-b:a", "256k", "-ar", "44100", "-t", tl.total.toFixed(3), "-movflags", "+faststart", OUT,
], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status);
console.log(`wrote ${OUT}`);
