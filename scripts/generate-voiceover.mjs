// Generate (or refresh) Cartesia voiceover without rendering.
//
//   node scripts/generate-voiceover.mjs                         # all data/*.json
//   node scripts/generate-voiceover.mjs --only=emplyify-square-vo
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateForFiles, loadEnv } from "./voiceover.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice(7)
  .split(",")
  .filter(Boolean);
const files = (await readdir(path.join(root, "data")))
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.join(root, "data", f));
const failures = await generateForFiles(files, root, only);
for (const f of failures) console.error(`✖ ${f.slug}: ${f.message}`);
if (failures.length > 0) process.exit(1);
console.log("Voiceover up to date.");
