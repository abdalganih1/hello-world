// Renders each overlay in overlays.html to a transparent 1080x1920 PNG in ./overlays
// Usage: node render.mjs   (needs playwright; NODE_PATH may need the global node_modules)
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const page_url = pathToFileURL(path.join(dir, "overlays.html")).href;
const frames = ["title", "fake-data", "otp-alert", "link-alert", "rules"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [i, id] of frames.entries()) {
  await page.goto(`${page_url}?frame=${id}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(dir, "overlays", `${String(i + 1).padStart(2, "0")}-${id}.png`);
  await page.locator(`#${id}`).screenshot({ path: out, omitBackground: true });
  console.log("wrote", out);
}
await browser.close();
