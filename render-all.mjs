// Batch-renders every variant in data/*.json to out/[slug].mp4.
// Each variant is { slug, composition?, props }; composition defaults to LaunchPromo.
//
//   node render-all.mjs                              # every variant in every data/*.json
//   node render-all.mjs --data=data/flash-sale.json  # one variants file
//   node render-all.mjs --only=ledgerly-beta         # a subset (comma-separated slugs)
//
// Variants with a `voiceover` section get Cartesia audio generated first
// (needs CARTESIA_API_KEY in .env; see .env.example and scripts/voiceover.mjs).
//
// Set REMOTION_BROWSER_EXECUTABLE to use an existing Chrome/Chromium instead of
// letting Remotion download its headless shell.

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateForFiles, loadEnv } from "./scripts/voiceover.mjs";

const DEFAULT_COMPOSITION = "LaunchPromo";
const root = path.dirname(fileURLToPath(import.meta.url));

const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

loadEnv(root);
const dataArg = arg("data");
const only = arg("only")?.split(",").filter(Boolean);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;

const dataFiles = dataArg
  ? [path.resolve(root, dataArg)]
  : (await readdir(path.join(root, "data")))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => path.join(root, "data", f));

// Cartesia voiceover for variants that have a `voiceover` section (skips unchanged lines).
// A variant whose voiceover can't be generated is skipped; the rest still render.
const voiceoverFailures = await generateForFiles(
  dataFiles,
  root,
  arg("only")?.split(",").filter(Boolean),
);
for (const f of voiceoverFailures) {
  console.error(`✖ ${f.slug}: voiceover not generated (${f.message})`);
}
const skip = new Set(voiceoverFailures.map((f) => f.slug));

const variants = [];
for (const file of dataFiles) {
  const list = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(list)) {
    throw new Error(
      `${file} must contain a JSON array of { slug, composition?, props }`,
    );
  }
  variants.push(...list);
}

const selected = (
  only ? variants.filter((v) => only.includes(v.slug)) : variants
).filter((v) => !skip.has(v.slug));
if (selected.length === 0 && skip.size > 0) {
  console.error("\nNothing left to render.");
  process.exit(1);
}
if (selected.length === 0) {
  throw new Error(
    `No variants matched ${only?.join(", ") ?? dataFiles.join(", ")}`,
  );
}

const slugs = new Set();
for (const v of selected) {
  if (typeof v.slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(v.slug)) {
    throw new Error(
      `Invalid slug ${JSON.stringify(v.slug)} (use lowercase letters, digits, hyphens)`,
    );
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
  const compositionId = variant.composition ?? DEFAULT_COMPOSITION;
  const label = `[${i + 1}/${selected.length}] ${variant.slug} (${compositionId})`;
  const outputLocation = path.join(root, "out", `${variant.slug}.mp4`);
  try {
    // Props are validated against the Zod schema registered on the composition.
    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
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

failures.push(...skip);
if (failures.length > 0) {
  console.error(
    `\n${failures.length} variant(s) failed: ${failures.join(", ")}`,
  );
  process.exit(1);
}
console.log(`\nDone. Rendered ${selected.length} video(s) to out/.`);
