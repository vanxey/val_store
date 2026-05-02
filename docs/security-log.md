# Security & Protection

This file details the specific security measurements, headers and code level defenses implemented.

## Network Safety
*   **TLS 1.3 Only:** The server is locked to **TLS 1.3**. This is the newest and strongest version of HTTPS encryption. It stops hackers from trying to force the server into using older or broken security versions.
*   **End-to-End Encryption:** Every request the server makes to Riot's API also uses TLS 1.3, so the data is never "out in the open."

## Headers
The `setHeaders` function adds a layer of protection to every response:
*   **CSP:** Only allows scripts from the server itself. It also whitelists `https://media.valorant-api.com` so the weapon icons can load.
*   **HSTS:** Tells the browser to **always** use HTTPS for the next two years.
*   **X-Frame-Options:** Set to `DENY` so nobody can hide my app inside their own website (stops clickjacking).
*   **Cache-Control:** Set to `no-store` so tokens are never saved on the hard drive.

## Code-Level Protection

### 1. `readBody` (Stopping Floods)
To stop "Denial of Service" attacks, this function watches the size of the data coming in. If someone tries to send more than 2KB, the server kills the connection immediately (`req.destroy()`).

### 2. `safeResolve` (Folder Protection)
This stops hackers from trying to look at files they shouldn't see (like my SSL keys). It decodes the URL and checks that the final path is strictly inside the `client` folder. If it tries to go "outside," the server blocks it.

### 3. Regex Checks (Token Validation)
I don't just trust whatever the user types. 
*   **JWT Check:** Before sending anything to Riot, I use a Regex pattern to make sure the token looks like a real JWT.
*   **PUUID Check:** Even when I get data back from Riot, I check the Player ID with a Regex to make sure it's a valid UUID. This stops "URL Injection" problems.

## Reliability
*   **Temporary Sessions:** The app is "stateless." It doesn't use a database, so the tokens are only in memory for a second. This removes the risk of **long-term security problems**.