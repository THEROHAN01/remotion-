// Tile stills into contact sheets: node tools/sheet.mjs <dir> <format> <cols> <out-prefix>
import { readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const [dir, format, colsArg, prefix] = process.argv.slice(2);
const files = (await readdir(dir)).filter(f => f.startsWith(format) && f.endsWith(".png")).sort();
const cols = Number(colsArg), perSheet = cols * (format === "portrait" ? 2 : 4);
for (let s = 0; s * perSheet < files.length; s++) {
  const chunk = files.slice(s * perSheet, (s + 1) * perSheet);
  const w = format === "portrait" ? 270 : 480, h = format === "portrait" ? 480 : 270;
  const inputs = chunk.flatMap(f => ["-i", `${dir}/${f}`]);
  const labels = chunk.map((f, i) => `[${i}]scale=${w}:${h},drawtext=text='${f.match(/-([\d.]+)\.png/)[1]}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";");
  const pad = Array.from({ length: perSheet - chunk.length }, (_, i) => `color=black:s=${w}x${h}:d=1[p${i}]`).join(";");
  const all = [...chunk.map((_, i) => `[v${i}]`), ...Array.from({ length: perSheet - chunk.length }, (_, i) => `[p${i}]`)].join("");
  const rows = perSheet / cols;
  const filter = `${labels}${pad ? ";" + pad : ""};${all}xstack=inputs=${perSheet}:layout=${Array.from({ length: perSheet }, (_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join("|")}`;
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", filter, "-frames:v", "1", `${prefix}-${s + 1}.png`]);
  console.log(`${prefix}-${s + 1}.png`);
}
