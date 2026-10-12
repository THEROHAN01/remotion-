// Proves every frame is a pure function of t. Renders the same frames in order on one page,
// then in shuffled order (with jumps back and forth) on a fresh page, and compares:
//   1. film state, exactly: full pixels of every canvas, every element's inline style,
//      scroll positions and text. This must be identical.
//   2. screenshots: reports the largest pixel difference. Chromium's compositor keeps raster
//      history between screenshots, so with identical page state a few pixels can still differ
//      (1–3/255 on text edges; up to ~10/255 on the phase of a 1 px dotted CSS border).
//      More than 16/255 is a failure.
//   node tools/purity.mjs <landscape|portrait> [count]
import { createHash } from "node:crypto";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { openFilm } from "./browser.mjs";

const [format, countArg] = process.argv.slice(2);
const count = Number(countArg || 40);
const hash = buf => createHash("sha1").update(buf).digest("hex");
const tmp = mkdtempSync(`${tmpdir()}/purity-`);

const stateOf = (page, t) => page.evaluate(t => {
  window.film.seek(t);
  const parts = [];
  for (const c of document.querySelectorAll("canvas")) {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619);
    parts.push(c.id + c.width + "x" + c.height + ":" + (h >>> 0));
  }
  for (const e of document.querySelectorAll("#viewport *")) parts.push([...e.style].sort().map(k => k + ":" + e.style.getPropertyValue(k)).join(";") + "#" + (e.scrollTop | 0) + "," + (e.scrollLeft | 0));
  parts.push(document.getElementById("viewport").innerText);
  return parts.join("\n");
}, t);

let s = 7; const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
const a = await openFilm(format);
const { fps, duration } = a.info;
const frames = Math.round(duration * fps);
const picks = [...new Set([0, frames - 1, ...Array.from({ length: count - 2 }, () => Math.floor(rnd() * frames))])].sort((x, y) => x - y);

const ref = new Map();
for (const f of picks) {
  const st = hash(await stateOf(a.page, f / fps));
  const png = await a.shot(f / fps);
  writeFileSync(`${tmp}/a-${f}.png`, png);
  ref.set(f, { st, px: hash(png) });
}
await a.close();

const b = await openFilm(format);
const shuffled = [...picks].sort(() => rnd() - 0.5);
let stateBad = 0, pxExact = 0, worst = 0, worstF = -1;
for (const f of shuffled) {
  const st = hash(await stateOf(b.page, f / fps));
  if (st !== ref.get(f).st) { stateBad++; console.log(`STATE MISMATCH frame ${f} (t=${(f / fps).toFixed(3)})`); }
  const png = await b.shot(f / fps);
  if (hash(png) === ref.get(f).px) { pxExact++; continue; }
  writeFileSync(`${tmp}/b-${f}.png`, png);
  const out = execFileSync("sh", ["-c", `compare -metric PAE ${tmp}/a-${f}.png ${tmp}/b-${f}.png null: 2>&1 || true`]).toString();
  const pae = Math.round(Number(out.split(" ")[0]) / 257);
  if (pae > worst) { worst = pae; worstF = f; }
}
await b.close();
rmSync(tmp, { recursive: true, force: true });

console.log(`${format}: ${picks.length} frames, in order vs shuffled on a fresh page`);
console.log(`  film state: ${stateBad ? stateBad + " MISMATCHES" : "identical on every frame"}`);
console.log(`  screenshots: ${pxExact}/${picks.length} byte-identical; largest pixel difference ${worst}/255${worstF >= 0 ? ` (frame ${worstF})` : ""}`);
console.log("  order:", shuffled.slice(0, 12).join(" "), "…");
process.exit(stateBad || worst > 16 ? 1 : 0);
