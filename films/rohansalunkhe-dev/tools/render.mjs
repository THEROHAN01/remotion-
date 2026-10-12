// Render the film to H.264: headless Chromium seeks every frame (t = i / fps), screenshots it,
// and pipes it to ffmpeg. Frames are split into contiguous segments, one browser page + one
// ffmpeg per worker; segments are joined losslessly and muxed with the synthesised sound.
//   node tools/render.mjs <landscape|portrait> [--workers 3] [--from 0 --to 2490]
// Existing outputs are copied to out/versions/ before they are overwritten.
import { mkdir, copyFile, access, readdir, writeFile, rm } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { openFilm, CHROME } from "./browser.mjs";

const args = process.argv.slice(2);
const format = args[0];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? Number(args[i + 1]) : d; };
const WORKERS = opt("workers", 3);
const OUT = "out", TMP = `${OUT}/.segments-${format}`;
const NAME = { landscape: "rohansalunkhe-dev-launch-16x9", portrait: "rohansalunkhe-dev-launch-9x16" }[format];
if (!NAME) throw new Error("format must be landscape or portrait");

const exists = p => access(p).then(() => true, () => false);
async function versionOld(path) {
  if (!(await exists(path))) return;
  await mkdir(`${OUT}/versions`, { recursive: true });
  const base = path.split("/").pop().replace(/\.(\w+)$/, ""), ext = path.split(".").pop();
  const taken = (await readdir(`${OUT}/versions`)).filter(f => f.startsWith(base + "-v")).length;
  const dest = `${OUT}/versions/${base}-v${taken + 1}.${ext}`;
  await copyFile(path, dest);
  console.log(`kept previous render → ${dest}`);
}

await mkdir(TMP, { recursive: true });
const require = createRequire(import.meta.url);
const { chromium } = require(`${execFileSync("npm", ["root", "-g"]).toString().trim()}/playwright`);
const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"] });

const probe = await openFilm(format, { browser });
const { fps, duration } = probe.info;
const frames = Math.round(duration * fps);           // t = 0 … duration − 1/fps
await probe.close();
const from = opt("from", 0), to = opt("to", frames);
const per = Math.ceil((to - from) / WORKERS);
const t0 = Date.now();
let done = 0;

async function segment(w) {
  const a = from + w * per, b = Math.min(to, a + per);
  if (a >= b) return null;
  const file = `${TMP}/seg-${String(w).padStart(2, "0")}.mp4`;
  const film = await openFilm(format, { browser });
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-vf", "scale=out_color_matrix=bt709", "-threads", "2", "-r", String(fps), file], { stdio: ["pipe", "inherit", "inherit"] });
  const closed = new Promise((res, rej) => ff.on("close", c => c === 0 ? res() : rej(new Error("ffmpeg exited " + c))));
  for (let i = a; i < b; i++) {
    const png = await film.shot(i / fps);
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
    if (++done % 120 === 0) console.log(`${format}: ${done}/${to - from} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  await closed;
  await film.close();
  return file;
}

const segs = (await Promise.all(Array.from({ length: WORKERS }, (_, w) => segment(w)))).filter(Boolean);
await browser.close();
await writeFile(`${TMP}/list.txt`, segs.map(s => `file '${s.split("/").pop()}'`).join("\n"));

const mp4 = `${OUT}/${NAME}.mp4`, wav = `${OUT}/${format}.wav`;
await versionOld(mp4);
const audio = (await exists(wav)) && from === 0 && to === frames;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", `${TMP}/list.txt`,
  ...(audio ? ["-i", wav, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
  "-c:v", "copy", "-movflags", "+faststart", mp4], { stdio: "inherit" });
await rm(TMP, { recursive: true, force: true });
console.log(`${mp4}: ${to - from} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s${audio ? " + sound" : ""}`);
