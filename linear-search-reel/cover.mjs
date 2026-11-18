// node cover.mjs -> cover.png (1080x1920 reel cover, from js/cover.js)
import { chromium } from "playwright"; import { readFileSync, existsSync } from "node:fs"; import http from "node:http"; import path from "node:path"; import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url)); const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".ttf": "font/ttf", ".json": "application/json" };
const server = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split("?")[0])); if (!f.startsWith(dir) || !existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(readFileSync(f)); });
await new Promise((r) => server.listen(0, "127.0.0.1", r)); const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => { console.error(e.message); process.exit(1); });
await page.goto(`http://127.0.0.1:${server.address().port}/cover.html`); await page.evaluate(async (tl) => { await window.setup(tl); window.drawCover(); }, JSON.parse(readFileSync(path.join(dir, "voice/timeline.json"), "utf8")));
await page.locator("canvas").screenshot({ path: path.join(dir, "cover.png") }); await b.close(); server.close(); console.log("cover.png");
