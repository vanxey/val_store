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
        // console.log("Riot response status:", res.statusCode);
        // console.log("Riot response body:", raw);

        if (res.statusCode < 200 || res.statusCode >= 300) {
            //reject(new Error(`[Riot API] ${method} ${host}${path} failed (${res.statusCode}): ${raw}`));
           reject(new Error(`Upstream failed with status ${res.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
            //reject(new Error(`Riot returned non JSON response from ${host}${path}`));
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

async function fetchStore(puuid, accessToken, entitlementToken) {
  const data = await riotRequest(
    "pd.eu.a.pvp.net",
    `/store/v3/storefront/${puuid.trim()}`,
    "POST",
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Riot-Entitlements-JWT": entitlementToken,
      "X-Riot-ClientPlatform": "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      "X-Riot-ClientVersion": "release-12.07-shipping-9-4488404",
      "Content-Type": "application/json",
      "Content-Length": "2" 
    },
    "{}"
  );

  return data;
}

function cleanStore(raw) {
  const panel = raw?.SkinsPanelLayout;

  if (!panel) {
    throw new Error('Unexpected store response shape');
  }

  return {
    offers: panel.SingleItemOffers ?? [],
    remainingSeconds: panel.SingleItemOffersRemainingDurationInSeconds ?? 0,
  };
}

export async function handleProxy(accessToken, res) {
    try {
        const [puuid, entitlementToken] = await Promise.all([
            resolveIdentity(accessToken),
            resolveEntitlement(accessToken),
        ]);

        const rawStore = await fetchStore(puuid, accessToken, entitlementToken);
        const store = cleanStore(rawStore);

        res.writeHead(200, { "content-type": "application/json" });
        //res.end(JSON.stringify({ message: "Proxy reached successfully", token: "received" }));
        res.end(JSON.stringify(store));

    } catch (error) {
        // console.error(error)
        console.error("Proxy error:", error.message);
        if (error.message.includes("Upstream failed with status")) {

            // const status = parseInt(error.message.split(" ").pop());

            // if (status === 400 || status === 401 || status === 403) {
            //     res.writeHead(401, { "content-type": "application/json" });
            //     res.end(JSON.stringify({ error: "Invalid or expired token" }));
            //     return;
            // }

            res.writeHead(502, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "Bad gateway" }));
            return;
        }

            if (error.message === "Upstream request timed out") {
                res.writeHead(504, { "content-type": "application/json" });
                res.end(JSON.stringify({ error: "Gateway timeout" }));
                return;
            }

            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
    }
}

