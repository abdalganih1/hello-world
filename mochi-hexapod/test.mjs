import { chromium } from "playwright";
import http from "node:http"; import { readFileSync, existsSync } from "node:fs"; import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const server = http.createServer((q, s) => { const f = path.join(dir, decodeURIComponent(q.url.split("?")[0])); if (!existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".html") ? "text/html" : "application/octet-stream" }); s.end(readFileSync(f)); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
p.on("console", (m) => console.log(m.text())); p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/test.html`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
const [out, views] = process.argv.slice(2);
let i = 0;
for (const v of JSON.parse(views)) { console.log(JSON.stringify(await p.evaluate((c) => window.view(c), v))); await p.locator("canvas").screenshot({ path: out.replace(".png", `_${i++}.png`) }); }
await b.close(); server.close();
