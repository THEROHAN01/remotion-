// Opens the film page in headless Chromium at the film's layout size and device scale.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { serve } from "./serve.mjs";
const require = createRequire(import.meta.url);
const globalRoot = execSync("npm root -g").toString().trim();
const { chromium } = require(`${globalRoot}/playwright`);
// CHROME overrides; else this cloud container's Chromium if present; else Playwright's own (undefined).
const CLOUD_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
export const CHROME = process.env.CHROME || (existsSync(CLOUD_CHROME) ? CLOUD_CHROME : undefined);
export const SIZES = { landscape: [1024, 576], portrait: [432, 768] };
export const SCALES = { landscape: 1.875, portrait: 2.5 };   // → 1920×1080 and 1080×1920

export async function openFilm(format, { browser } = {}) {
  const server = await serve();
  const own = !browser;
  browser = browser || await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"] });
  const [w, h] = SIZES[format];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: SCALES[format] });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/404/.test(m.text())) errors.push(m.text()); });
  page.on("response", r => { if (r.status() >= 400 && !r.url().endsWith("/favicon.ico")) errors.push(r.status() + " " + r.url()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/film.html?format=${format}`);
  await page.waitForFunction(() => window.filmReady === true || false, null, { timeout: 60000 }).catch(() => {});
  if (errors.length) throw new Error("page errors:\n" + errors.join("\n"));
  const info = await page.evaluate(() => ({ duration: film.duration, fps: film.fps, frames: film.frames }));
  return {
    page, browser, info,
    async shot(t, opts = {}) {
      await page.evaluate(t => window.film.seek(t), t);
      return page.screenshot({ type: opts.type || "png", quality: opts.quality, path: opts.path, animations: "disabled", caret: "hide" });
    },
    async close() { await page.close(); if (own) await browser.close(); server.close(); }
  };
}
