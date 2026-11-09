// Renders cover.png (1920x1080) from window.cover() in js/scenes.js.  Usage: node tools/cover.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path"; import { fileURLToPath } from "node:url";
const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => { console.error(e.message); process.exit(1); });
await p.goto("file://" + path.join(dir, "index.html")); await p.evaluate(async (tl) => { await window.setup(tl); window.cover(); }, tl);
await p.screenshot({ path: path.join(dir, "cover.png") }); await b.close(); console.log("cover.png");
