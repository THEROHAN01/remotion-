// Minimal static server for the film page (fetch() and module scripts need http).
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".webp": "image/webp", ".svg": "image/svg+xml" };
export function serve(port = 0) {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
      try { const body = await readFile(p); res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" }); res.end(body); }
      catch { res.writeHead(404); res.end("not found"); }
    }).listen(port, "127.0.0.1", () => resolve(server));
  });
}
