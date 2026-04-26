import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = resolve(__dirname, "../client");

const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.ico', '.png', '.jpg', '.svg']);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

function safeResolve(requestedUrl) {
  const withoutQuery = requestedUrl.split('?')[0];
  let decoded;

  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }

  const absolute = resolve(join(CLIENT_DIR, decoded));

  if (!absolute.startsWith(CLIENT_DIR + '/') && absolute !== CLIENT_DIR) {
    return null;
  }

  return absolute;
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

export function route (req, res){
    const method = req.method;
    const url = req.url;
    // console.log(method, url);
    // console.log('CLIENT_DIR:', CLIENT_DIR);

    if(method === "GET" && (url === "/" || url === "/index.html")){
        serveStatic(res, join(CLIENT_DIR, "index.html"));
        return;
    }

    if (method === 'GET') {
        const safePath = safeResolve(url);

        if (safePath === null) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request');
            return;
        }
        serveStatic(res, safePath);
        return;
    }

    res.writeHead(400, {"content-type": "text/plain"});
    res.end("Content not found");
};