# Threat Model Analysis

To ensure the systems safety against attacks, a threat model analysis was made using the STRIDE methodology and mapping trust boundaries within the system architecture.

## Data Flow Diagram

![Data Flow Diagram](./assets/DFD_valo.drawio.svg)

## STRIDE Threat Assessment

| Threat Category | Potential Threat | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | A user attempts to impersonate another player by submitting a fake Riot ID or a forged token. | **Backend Identity Verification:** The server never trusts client-provided player IDs. It uses the provided JWT to query Riot's `/userinfo` endpoint directly. The authenticated token acts as the absolute source of truth. |
| **Tampering** | An attacker modifies store data in transit or injects malicious scripts via input forms. | **TLS 1.3 & Output Encoding:** All network traffic is strictly encrypted using TLS 1.3. On the frontend, data is rendered using safe DOM methods (`.textContent`) rather than `.innerHTML`, neutralizing XSS injection attempts. |
| **Repudiation** | A user denies authorizing the application to view their store data or claims unauthorized actions occurred. | **Stateless Architecture:** The application does not utilize a database or store user tokens persistently. Access is strictly session based and temporary, eliminating the risk of long term problems. |
| **Information Disclosure** | A malicious script steals the access token or the server leaks sensitive paths/stack traces during a crash. | **Secure Boundaries & Sanitized Errors:** A custom `safeResolve` function prevents Path Traversal attacks that could leak `.pem` keys. The application catches upstream crashes and returns generic HTTP errors (e.g., 502 Bad Gateway) to prevent stack trace leakage. |
| **Denial of Service (DoS)** | An attacker floods the server with massive payloads to crash the process, or the Riot API hangs indefinitely. | **Payload Limits & Upstream Timeouts:** The custom `readBody` stream parser actively tracks incoming bytes and instantly destroys the connection if the payload exceeds 2048 bytes. Upstream requests enforce a strict 10,000ms timeout. |
| **Elevation of Privilege** | An attacker attempts to use the proxy to reach unauthorized Riot endpoints (e.g., password resets). | **Strict Endpoint Isolation:** The proxy logic is hardcoded to only communicate with safe, read only endpoints. It cannot be manipulated into forwarding requests to restricted account endpoints. |