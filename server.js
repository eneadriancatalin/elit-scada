// Server local ELIT SCADA – fara dependinte. Porneste cu:  npm start   (sau: node server.js)
// Serveste fisierele statice si ofera /__version pentru reincarcare automata a paginii cand modifici fisiere.
// Pe Vercel nu e nevoie de el: site-ul e static si merge direct.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || process.argv[2] || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp"
};
const WATCH = /\.(html|js|css|png|svg)$/;

function version(dir = ROOT) {
  let m = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith(".") || f.name === "node_modules") continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) m = Math.max(m, version(p));
    else if (WATCH.test(f.name)) m = Math.max(m, fs.statSync(p).mtimeMs);
  }
  return m;
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/__version") {
    res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
    return res.end(String(version()));
  }
  const file = path.normalize(path.join(ROOT, url === "/" ? "index.html" : url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("Interzis"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Nu exista: " + url); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`ELIT SCADA: http://localhost:${PORT}  (reincarcare automata activa)`));
