// Renders slides.html into sham-cash-scam-awareness.mp4 (1080x1920, 30 fps).
// Each slide is a still image; slides change with a plain cross-fade, so nothing moves on screen.
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs   (needs playwright)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FADE = 0.5;
const OUT = path.join(dir, "sham-cash-scam-awareness.mp4");
const STILLS = path.join(dir, "stills");
mkdirSync(STILLS, { recursive: true });

// Time on screen: enough to read the slide's words and glance at its picture.
const holdFor = (text) => Math.max(4.5, 2.5 + text.replace(/\s+/g, "").length * 0.07);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const url = pathToFileURL(path.join(dir, "slides.html")).href;
await page.goto(url);
const count = await page.evaluate(() => window.SLIDE_COUNT);

const slides = [];
for (let n = 0; n < count; n++) {
  await page.goto(`${url}?n=${n}`, { waitUntil: "load" });
  const text = await page.evaluate(async () => { await document.fonts.ready; return window.SLIDE_TEXT; });
  const file = path.join(STILLS, `slide-${n + 1}.png`);
  await page.screenshot({ path: file });
  slides.push({ file, dur: holdFor(text) });
}
await browser.close();

// Chain cross-fades: slide k starts fading in FADE seconds before slide k-1 ends.
const inputs = [];
slides.forEach((s) => inputs.push("-loop", "1", "-framerate", "30", "-t", s.dur.toFixed(2), "-i", s.file));
const filters = [];
let prev = "[0:v]", offset = 0;
for (let k = 1; k < slides.length; k++) {
  offset += slides[k - 1].dur - FADE;
  const out = k === slides.length - 1 ? "[v]" : `[x${k}]`;
  filters.push(`${prev}[${k}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}${out}`);
  prev = out;
}
const total = offset + slides.at(-1).dur;

execFileSync(FFMPEG, [
  "-y", "-v", "error", ...inputs,
  "-f", "lavfi", "-t", total.toFixed(2), "-i", "anullsrc=r=44100:cl=stereo",
  "-filter_complex", filters.join(";"),
  "-map", "[v]", "-map", `${slides.length}:a`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-crf", "18", "-tune", "stillimage",
  "-c:a", "aac", "-shortest", "-movflags", "+faststart", OUT,
], { stdio: "inherit" });
console.log(`wrote ${OUT} (${total.toFixed(1)}s, ${slides.length} slides)`);
