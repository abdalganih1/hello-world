// Renders scenes.html + audio/*.mp3 into sham-cash-scam-awareness.mp4 (1080x1920, 25 fps).
// Usage: FFMPEG=/path/to/ffmpeg node render.mjs   (run `python3 tts.py` first for the narration)
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 25, LEAD = 0.5, TAIL = 0.6;
const OUT = path.join(dir, "sham-cash-scam-awareness.mp4");

function duration(file) {
  let log = "";
  try { execFileSync(FFMPEG, ["-i", file], { stdio: "pipe" }); } catch (e) { log = e.stderr.toString(); }
  const [, h, m, s] = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return +h * 3600 + +m * 60 + +s;
}

// Build the timeline: each scene holds its narration plus a short lead-in and tail.
const scenes = JSON.parse(readFileSync(path.join(dir, "narration.json"), "utf8"));
let start = 0;
const timeline = scenes.map((s) => {
  const audio = path.join(dir, "audio", `${s.id}.mp3`);
  const audioDur = duration(audio);
  const sc = { ...s, audio, start, audioStart: LEAD, audioDur, dur: LEAD + audioDur + TAIL };
  start += sc.dur;
  return sc;
});
const total = start;

// Alarm beeps land on the "هون الفخ!" caption (otp scene, chunk 1), same proportional split as the page.
const otp = timeline.find((s) => s.id === "otp");
const chars = otp.text.reduce((a, t) => a + t.length, 0);
const trapAt = otp.start + otp.audioStart + (otp.audioDur * otp.text[0].length) / chars;

const inputs = ["-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
const filters = [];
timeline.forEach((sc, i) => {
  inputs.push("-i", sc.audio);
  const ms = Math.round((sc.start + sc.audioStart) * 1000);
  filters.push(`[${i + 1}:a]adelay=${ms}|${ms},aresample=44100[n${i}]`);
});
const b = timeline.length + 1;
inputs.push("-f", "lavfi", "-i", "sine=frequency=990:duration=0.14:sample_rate=44100");
inputs.push("-f", "lavfi", "-i", "sine=frequency=990:duration=0.14:sample_rate=44100");
[0, 0.22].forEach((off, k) => {
  const ms = Math.round((trapAt + off) * 1000);
  filters.push(`[${b + k}:a]volume=0.35,adelay=${ms}|${ms}[b${k}]`);
});
const mixIns = timeline.map((_, i) => `[n${i}]`).join("") + "[b0][b1]";
filters.push(`${mixIns}amix=inputs=${timeline.length + 2}:normalize=0,apad[a]`);

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
