// Renders slides.html + an original synthesized soundtrack into sham-cash-scam-awareness.mp4 (1080x1920, 30 fps).
// Slide lengths are whole bars of the music (timeline.json), so every cut lands on a downbeat.
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs   (needs playwright, python3 + numpy)
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 30;
const OUT = path.join(dir, "sham-cash-scam-awareness.mp4");
const BUILD = path.join(dir, "build");
mkdirSync(BUILD, { recursive: true });

const cfg = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const beat = 60 / cfg.bpm, bar = 4 * beat;
const durs = cfg.bars.map((b) => b * bar);
const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, d) => a + d, 0));
const total = starts.at(-1) + durs.at(-1);
const timeline = { beat, starts, durs };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(dir, "slides.html")).href, { waitUntil: "load" });
await page.evaluate(async (tl) => { window.TIMELINE = tl; await document.fonts.ready; }, timeline);

// Soundtrack: music + transition hits + a sound for each element that lands on screen.
const sfx = await page.evaluate(() => window.collectSfx());
const events = path.join(BUILD, "events.json");
const wav = path.join(BUILD, "soundtrack.wav");
writeFileSync(events, JSON.stringify({ ...cfg, starts, total, sfx }));
execFileSync("python3", [path.join(dir, "music.py"), events, wav], { stdio: "inherit" });

const ff = spawn(FFMPEG, [
  "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", wav,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium",
  "-c:a", "aac", "-b:a", "192k", "-t", total.toFixed(3), "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "pipe"] });
let ffErr = "";
ff.stderr.on("data", (d) => { ffErr += d; });

const frames = Math.round(total * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (FPS * 10) === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await browser.close();
const code = await new Promise((r) => ff.on("close", r));
if (code !== 0) { console.error(ffErr.slice(-3000)); process.exit(code); }
console.log(`wrote ${OUT} (${total.toFixed(1)}s)`);
