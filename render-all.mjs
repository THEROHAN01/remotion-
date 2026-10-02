// Batch-renders every entry in data/variants.json to out/[slug].mp4.
//
//   node render-all.mjs                         # render all variants
//   node render-all.mjs --only=ledgerly-beta    # render a subset (comma-separated slugs)
//   node render-all.mjs --data=data/other.json  # use a different variants file
//
// Set REMOTION_BROWSER_EXECUTABLE to use an existing Chrome/Chromium instead of
// letting Remotion download its headless shell.

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COMPOSITION_ID = "LaunchPromo";
const root = path.dirname(fileURLToPath(import.meta.url));

const arg = (name) =>
  process.argv
    .find((a) => a.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

const dataFile = path.resolve(root, arg("data") ?? "data/variants.json");
const only = arg("only")?.split(",").filter(Boolean);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;

const variants = JSON.parse(await readFile(dataFile, "utf8"));
if (!Array.isArray(variants)) {
  throw new Error(`${dataFile} must contain a JSON array of { slug, props }`);
}

const selected = only
  ? variants.filter((v) => only.includes(v.slug))
  : variants;
if (selected.length === 0) {
  throw new Error(`No variants matched ${only?.join(", ") ?? dataFile}`);
}

const slugs = new Set();
for (const v of selected) {
  if (typeof v.slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(v.slug)) {
    throw new Error(`Invalid slug ${JSON.stringify(v.slug)} (use lowercase letters, digits, hyphens)`);
  }
  if (slugs.has(v.slug)) throw new Error(`Duplicate slug "${v.slug}"`);
  slugs.add(v.slug);
}

console.log("Bundling project…");
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  rspack: true,
});

await mkdir(path.join(root, "out"), { recursive: true });

const failures = [];
for (const [i, variant] of selected.entries()) {
  const label = `[${i + 1}/${selected.length}] ${variant.slug}`;
  const outputLocation = path.join(root, "out", `${variant.slug}.mp4`);
  try {
    // Props are validated against the Zod schema registered on the composition.
    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps: variant.props,
      browserExecutable,
    });

    let lastPct = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps: variant.props,
      browserExecutable,
      imageFormat: "jpeg",
      overwrite: true,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100);
        if (pct % 10 === 0 && pct !== lastPct) {
          lastPct = pct;
          process.stdout.write(`\r${label} ${pct}%`);
        }
      },
    });
    console.log(`\r${label} → ${path.relative(root, outputLocation)}`);
  } catch (err) {
    console.error(`\n${label} failed: ${err.message}`);
    failures.push(variant.slug);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} variant(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`\nDone. Rendered ${selected.length} video(s) to out/.`);
