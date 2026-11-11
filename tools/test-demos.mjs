import puppeteer from "./vendor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../dist");
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const PORT = Number(process.env.PORT || 8765);
const KITS = [
  "cloud-hop", "neon-drift", "cellar-crawl", "skyline-dash",
  "star-forge", "prism-match", "orbit-garden"
];
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".zip": "application/zip",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".xml": "application/xml"
};

function serve(root, port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, "");
    let file = path.join(root, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const type = MIME[path.extname(file)] || "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

async function testKit(browser, id) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (/favicon\.ico/i.test(text)) return;
      errors.push("console: " + text);
    }
  });
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (/favicon\.ico/i.test(u)) return;
    errors.push("requestfailed: " + u + " " + (req.failure() && req.failure().errorText || ""));
  });
  const url = `http://127.0.0.1:${PORT}/demos/${id}/?autostart=1`;
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  const status = resp && resp.status();
  await page.waitForFunction(() => window.__CLOUDY_KIT__ && window.__CLOUDY_KIT__.ready, { timeout: 8000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1800));
  const kit = await page.evaluate(() => window.__CLOUDY_KIT__ || null);
  const shotDir = path.resolve(__dirname, "../.demo-shots");
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, id + ".png") });
  await page.close();
  const kitErrors = (kit && kit.errors) || [];
  const frames = (kit && kit.frames) || 0;
  const ready = !!(kit && kit.ready);
  const ok = status === 200 && ready && frames > 0 && errors.length === 0 && kitErrors.length === 0;
  return { id, ok, status, ready, frames, errors: errors.concat(kitErrors) };
}

const server = await serve(ROOT, PORT);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist"
  ]
});
const results = [];
for (const id of KITS) {
  try { results.push(await testKit(browser, id)); }
  catch (err) { results.push({ id, ok: false, status: 0, ready: false, frames: 0, errors: [String(err)] }); }
}
await browser.close();
server.close();
for (const r of results) {
  const mark = r.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${r.id}  status=${r.status} ready=${r.ready} frames=${r.frames}` + (r.errors.length ? "\n  " + r.errors.join("\n  ") : ""));
}
const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
