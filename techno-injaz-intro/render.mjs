// Renders intro.html (+ soundtrack from music.py) into techno-injaz-intro.mp4: 1080x1920, 30 fps, Instagram Reels.
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs
//        STILLS=3.5,5.9,7 STILLS_DIR=/tmp/out node render.mjs      (only saves those frames as PNG)
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(dir, "techno-injaz-intro.mp4");
const BUILD = path.join(dir, "build");
mkdirSync(BUILD, { recursive: true });

const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const logo = JSON.parse(readFileSync(path.join(dir, "assets/logo/logo.json"), "utf8"));
const FPS = tl.fps;

// Keyboard ticks for the opening shot: bursts of typing with short pauses. Shared by picture and sound.
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const ticks = [];
for (let t = 0.55; t < tl.zoomStart - 0.5; ) {
  const n = 4 + Math.floor(rand() * 6);
  for (let i = 0; i < n && t < tl.zoomStart - 0.5; i++) { ticks.push(+t.toFixed(3)); t += 0.085 + rand() * 0.05; }
  t += 0.18 + rand() * 0.28;
}

// Tiny static server: CSS masks and fonts need http:// rather than file://.
const MIME = { ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exit(1); });
page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
await page.goto(`${base}/intro.html`, { waitUntil: "load" });
await page.evaluate(async ([logo, tl, ticks]) => {
  await document.fonts.load("800 96px JB"); await document.fonts.load("800 60px Cairo"); await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode()));
  window.setup(logo, tl, ticks);
}, [logo, tl, ticks]);

if (process.env.STILLS) {
  const outDir = process.env.STILLS_DIR || BUILD; mkdirSync(outDir, { recursive: true });
  for (const t of process.env.STILLS.split(",").map(Number)) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2)}.png`) });
  }
  await browser.close(); server.close(); process.exit(0);
}

const events = path.join(BUILD, "events.json"), wav = path.join(BUILD, "soundtrack.wav");
writeFileSync(events, JSON.stringify({ ...tl, ticks }));
execFileSync("python3", [path.join(dir, "music.py"), events, wav], { stdio: "inherit" });
if (process.env.AUDIO_ONLY) { await browser.close(); server.close(); process.exit(0); }

const ff = spawn(FFMPEG, [
  "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", wav,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "medium", "-profile:v", "high", "-level", "4.2",
  "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-t", tl.total.toFixed(3), "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "pipe"] });
let ffErr = ""; ff.stderr.on("data", (d) => { ffErr += d; });

const frames = Math.round(tl.total * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const jpg = await page.screenshot({ type: "jpeg", quality: 94 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (FPS * 3) === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await browser.close(); server.close();
const code = await new Promise((r) => ff.on("close", r));
if (code !== 0) { console.error(ffErr.slice(-3000)); process.exit(code); }
console.log(`wrote ${OUT}`);
