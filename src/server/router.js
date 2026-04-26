import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleProxy } from './proxy.js';

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = resolve(__dirname, "../client");

const ALLOWED_EXTENSIONS = new Set([".html", ".css", ".js", ".ico", ".png", ".jpg", ".svg"]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".ico":  "image/x-icon",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
};

function safeResolve(requestedUrl) {
  const withoutQuery = requestedUrl.split("?")[0];
  let decoded;

  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }

  const absolute = resolve(join(CLIENT_DIR, decoded));

  if (!absolute.startsWith(CLIENT_DIR + "/") && absolute !== CLIENT_DIR) {
    return null;
  }

  return absolute;
}

function readBody(req, maxBytes = 2048) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}


function serveStatic (res, filePath){
    const ext = extname(filePath)
    //console.log('Attempting to read:', filePath);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        res.writeHead(403, { "content-type": "text/plain" });
        res.end("Forbidden");
        return;
    }

    let content;

    try {
        content = readFileSync(filePath)
    } catch (error) {
        res.writeHead(404, {"content-type": "text/plain"});
        res.end("Not found");
        return;
    }

    const mime = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, {"content-type": mime});
    res.end(content);
}

export async function route (req, res){
    const method = req.method;
    const url = req.url;
    // console.log(method, url);
    // console.log('CLIENT_DIR:', CLIENT_DIR);

    if (method === "POST" && url === "/api/store") {
        let raw;

        try {
            raw = await readBody(req, 2048);
        } catch {
            res.writeHead(413, { "content-type": "text/plain" });
            res.end("Payload too large");
            return;
        }

        let body;
        try {
            body = JSON.parse(raw);
        } catch {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Invalid JSON");
            return;
        }

        const { token } = body;
        if (typeof token !== "string" || token.length === 0) {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Token is required");
            return;
        }

        const JWT_PATTERN = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
        if (!JWT_PATTERN.test(token)) {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Invalid token format");
            return;
        }

        if (token.length > 2000) {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Token exceeds maximum length");
            return;
        }

        res.setHeader("cache-control", "no-store");
        await handleProxy(token, res);
        return;
    }

    if(method === "GET" && (url === "/" || url === "/index.html")){
        serveStatic(res, join(CLIENT_DIR, "index.html"));
        return;
    }

    if (method === "GET") {
        const safePath = safeResolve(url);

        if (safePath === null) {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Bad request");
            return;
        }
        serveStatic(res, safePath);
        return;
    }

    res.writeHead(400, {"content-type": "text/plain"});
    res.end("Content not found");
};