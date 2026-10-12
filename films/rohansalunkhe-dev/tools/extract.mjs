// Copies the real styles and pane markup out of the rohan.dev source so the film
// is built from the product's own CSS and copy, not a re-typed approximation.
//   node tools/extract.mjs /path/to/rohan.dev
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = await readFile(path.join(process.argv[2], "index.html"), "utf8");

const css = src.slice(src.indexOf("<style>") + 7, src.indexOf("</style>"))
  .replaceAll('url("/fonts/', 'url("../assets/fonts/');
const between = (a, b) => src.slice(src.indexOf(a), src.indexOf(b, src.indexOf(a)) + b.length);
const hold = between('<div id="hold" hidden>', "</article>\n</div>");
const projectHold = between('<div id="project-hold" hidden>', "</article>\n</div>");

await writeFile(path.join(here, "../src/site.css"), `/* Extracted verbatim from rohan.dev/index.html by tools/extract.mjs. */\n${css}`);
await writeFile(path.join(here, "../src/panes.html"), `<!-- Extracted verbatim from rohan.dev/index.html by tools/extract.mjs. -->\n${hold}\n${projectHold}\n`);
console.log("site.css", css.length, "chars; panes.html", hold.length + projectHold.length, "chars");
