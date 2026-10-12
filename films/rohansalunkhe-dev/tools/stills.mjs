// Render stills: node tools/stills.mjs landscape out/stills 0 4.8 9.6 ...
//   or every N seconds: node tools/stills.mjs landscape out/stills --every 0.5
import { mkdir } from "node:fs/promises";
import { openFilm } from "./browser.mjs";
const [format, dir, ...rest] = process.argv.slice(2);
await mkdir(dir, { recursive: true });
const film = await openFilm(format);
let times = rest.map(Number);
const ei = rest.indexOf("--every");
if (ei >= 0) { const step = Number(rest[ei + 1]); times = []; for (let t = 0; t <= film.info.duration + 1e-6; t += step) times.push(Math.round(t * 100) / 100); }
for (const t of times) await film.shot(t, { path: `${dir}/${format}-${t.toFixed(2).padStart(6, "0")}.png` });
console.log(`${times.length} stills → ${dir}`);
await film.close();
