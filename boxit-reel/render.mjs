// Renders reel.html + the synthesized soundtrack into boxit-reel.mp4 (1080x1920, 30 fps, Instagram Reels).
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs                 full render
//        STILLS=0.5,2.8,5 [STILLS_DIR=dir] node render.mjs      just those frames as PNG
//        AUDIO_ONLY=1 node render.mjs                           just build/soundtrack.wav
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(dir, "boxit-reel.mp4");
const BUILD = path.join(dir, "build");
mkdirSync(BUILD, { recursive: true });
const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const FPS = tl.fps, FRAMES = Math.round(tl.total * FPS);

function audio() {
  const wav = path.join(BUILD, "soundtrack.wav");
  execFileSync("python3", [path.join(dir, "music.py"), path.join(dir, "timeline.json"), wav], { stdio: "inherit" });
  return wav;
}
if (process.env.AUDIO_ONLY) { audio(); process.exit(0); }

const MIME = { ".html": "text/html", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exit(1); });
await page.goto(`http://127.0.0.1:${server.address().port}/reel.html`, { waitUntil: "load" });
await page.evaluate(() => window.setup());

if (process.env.STILLS) {
  const outDir = process.env.STILLS_DIR || BUILD; mkdirSync(outDir, { recursive: true });
  for (const t of process.env.STILLS.split(",").map(Number)) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2)}.png`) });
  }
  await browser.close(); server.close(); process.exit(0);
}

const wav = audio();
const ff = spawn(FFMPEG, [
  "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", wav,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-maxrate", "16M", "-bufsize", "32M", "-preset", "slow",
  "-profile:v", "high", "-level", "4.2",
  "-c:a", "aac", "-b:a", "256k", "-ar", "44100", "-t", tl.total.toFixed(3), "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "pipe"] });
let ffErr = ""; ff.stderr.on("data", (d) => { ffErr += d; });
for (let f = 0; f < FRAMES; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const png = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % FPS === 0) console.log(`frame ${f}/${FRAMES}`);
}
ff.stdin.end();
await browser.close(); server.close();
const code = await new Promise((r) => ff.on("close", r));
if (code !== 0) { console.error(ffErr.slice(-3000)); process.exit(code); }
console.log(`wrote ${OUT} (${tl.total}s)`);
