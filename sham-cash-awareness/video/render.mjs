// Renders scenes.html into sham-cash-scam-awareness.mp4 (1080x1920, 25 fps), text-only with a short alarm at the trap.
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 25, LEAD = 0.5, TAIL = 0.6;
const OUT = path.join(dir, "sham-cash-scam-awareness.mp4");

// On-screen reading time per caption chunk: a base beat plus time per character.
const readTime = (text) => Math.max(1.8, 0.9 + text.length * 0.075);

// Build the timeline: each scene shows its caption chunks back to back, with a lead-in and tail.
const scenes = JSON.parse(readFileSync(path.join(dir, "captions.json"), "utf8"));
let start = 0;
const timeline = scenes.map((s) => {
  let t = LEAD;
  const cues = s.text.map((chunk) => { const c = [t, t + readTime(chunk)]; t = c[1]; return c; });
  const sc = { ...s, cues, start, dur: t + TAIL };
  start += sc.dur;
  return sc;
});
const total = start;

// Alarm beeps land on the "هون الفخ!" caption (otp scene, chunk 1).
const otp = timeline.find((s) => s.id === "otp");
const trapAt = otp.start + otp.cues[1][0];

const inputs = ["-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
const filters = [];
[0, 0.22].forEach((off, k) => {
  inputs.push("-f", "lavfi", "-i", "sine=frequency=990:duration=0.14:sample_rate=44100");
  const ms = Math.round((trapAt + off) * 1000);
  filters.push(`[${k + 1}:a]volume=0.35,adelay=${ms}|${ms}[b${k}]`);
});
filters.push("[b0][b1]amix=inputs=2:normalize=0,apad[a]");

const ff = spawn(FFMPEG, [
  "-y", ...inputs,
  "-filter_complex", filters.join(";"),
  "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
  "-c:a", "aac", "-b:a", "160k", "-t", total.toFixed(2), "-movflags", "+faststart",
  OUT,
], { stdio: ["pipe", "inherit", "pipe"] });
let ffErr = "";
ff.stderr.on("data", (d) => { ffErr += d; });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(dir, "scenes.html")).href, { waitUntil: "load" });
await page.evaluate(async (tl) => { window.TIMELINE = tl; await document.fonts.ready; }, timeline);

const frames = Math.ceil(total * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (FPS * 5) === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await browser.close();
const code = await new Promise((r) => ff.on("close", r));
if (code !== 0) { console.error(ffErr.slice(-3000)); process.exit(code); }
console.log(`wrote ${OUT} (${total.toFixed(1)}s)`);
