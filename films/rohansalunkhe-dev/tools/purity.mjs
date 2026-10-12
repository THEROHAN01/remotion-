// Proves every frame is a pure function of t: renders the same frames in order on one page
// and in shuffled order (with jumps back and forth) on a fresh page, then compares pixels.
//   node tools/purity.mjs <landscape|portrait> [count]
import { createHash } from "node:crypto";
import { openFilm } from "./browser.mjs";

const [format, countArg] = process.argv.slice(2);
const count = Number(countArg || 40);
const a = await openFilm(format);
const { fps, frames } = a.info;
let s = 7; const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
const picks = [0, frames - 1, ...Array.from({ length: count - 2 }, () => Math.floor(rnd() * frames))].sort((x, y) => x - y);
const hash = buf => createHash("sha1").update(buf).digest("hex");

const inOrder = new Map();
for (const f of picks) inOrder.set(f, hash(await a.shot(f / fps)));
await a.close();

const b = await openFilm(format);
const shuffled = [...picks].sort(() => rnd() - 0.5);
let bad = 0;
for (const f of shuffled) {
  const h = hash(await b.shot(f / fps));
  if (h !== inOrder.get(f)) { bad++; console.log(`MISMATCH frame ${f} (t=${(f / fps).toFixed(3)})`); }
}
await b.close();
console.log(`${format}: ${picks.length} frames, in order vs shuffled on a fresh page → ${bad ? bad + " mismatches" : "identical"}`);
console.log("order checked:", shuffled.slice(0, 12).join(" "), "…");
process.exit(bad ? 1 : 0);
