import { request as httpsRequest } from 'node:https';

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

async function resolveIdentity(accessToken) {
  const data = await riotRequest(
    "auth.riotgames.com",
    "/userinfo",
    "GET",
    { Authorization: `Bearer ${accessToken}` }
  );

  const puuid = data?.sub;

  if (typeof puuid !== "string" || puuid.length === 0) {
    throw new Error("PUUID missing from userinfo response");
  }

  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_PATTERN.test(puuid)) {
    throw new Error("PUUID failed format validation");
  }

  return puuid;
}

async function resolveEntitlement(accessToken) {
  const data = await riotRequest(
    "entitlements.auth.riotgames.com",
    "/api/token/v1",
    "POST",
    {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Length": "2",
    },
    "{}"
  );

  const entitlementToken = data?.entitlements_token;

  if (typeof entitlementToken !== "string" || entitlementToken.length === 0) {
    throw new Error("Entitlement token missing from response");
  }

  return entitlementToken;
}

export async function handleProxy(token, res) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Proxy reached successfully", token: "received" }));
}

