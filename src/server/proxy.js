import { request as httpsRequest } from 'node:https';

export async function handleProxy(token, res) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Proxy reached successfully", token: "received" }));
}

const UPSTREAM_TIMEOUT_MS = 10_000;

function riotRequest(host, path, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path,
      method,
      headers: {
        ...headers,
        "User-Agent": "ValoStoreTracker/1.0",
      },
      minVersion: "TLSv1.3",
      maxVersion: "TLSv1.3",
    };

    const req = httpsRequest(options, (res) => {
      let raw = "";

      res.on("data", (chunk) => { raw += chunk; });

      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Upstream failed with status ${res.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Riot returned non JSON response"));
        }
      });

      res.on("error", reject);
    });

    req.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      req.destroy(new Error("Upstream request timed out"));
    });

    req.on("error", reject);

    if (body) req.write(body);

    req.end();
  });
}

