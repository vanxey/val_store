# Valorant Store Tracker

This is a safe web app that acts as a middleman (proxy) between the browser and the official Riot Games API. It lets you check your daily Valorant store without having to open the game. Note: Fetching the store data only works if you have an active Valorant account, which has completed the mandatory tutorial, otherwise the store endpoint won't give a response.

To keep things as safe as possible and avoid extra risks from outside libraries, I built the backend using only standard Node.js tools (`node:https`, `node:fs`, `node:path`). I didn't use Express or other frameworks to keep the "attack surface" small.

## How to set it up

Since the server uses **TLS 1.3** encryption to protect your Riot tokens, you need to set up SSL certificates on your local device to make it work.

### Create your Certificates
I used `mkcert` to make the certificates. The app looks for a folder called `certs` inside the `server` folder. 
1. Make sure you have `mkcert` installed.
2. Go into your server folder: `cd server`
3. Make the folder: `mkdir certs`
4. Run this command to create the files:
   ```bash
   mkcert -key-file certs/private-key.pem -cert-file certs/certificate.pem localhost 127.0.0.1

To make it easy for Peter (the examiner) to get your app running quickly, here is the **"Start the App"** section. You can use this as a standalone guide or part of your main README.

### Run the Server
While still in the folder where `main.js` is located, start the app by running:
```bash
node main.js
```
The terminal should show: `Server running at https://localhost:3000`.

### How to get your bearer token
Because this is a proxy app, it needs a real Riot token to work.
1. Get your token from the [Riot Login Page](https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid).
2. After logging in you should be forwarded to a 404 page, open the dev tools and look for the network request named `opt-in`
3. Click on the `opt-in` and inspect the header, you should find the bearer token there (it ends before &scope)

### How to test
1. Open your browser to `https://localhost:3000`. 
2. Open the Dev Tools and paste this code into the console to see your store data:
```javascript
fetch("https://localhost:3000/api/store", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "PASTE_YOUR_BEARER_TOKEN_HERE" })
})
.then(response => response.json())
.then(data => console.log("Your Store:", data))
.catch(err => console.error("Error:", err));
```

---

### Why this is set up this way:
*   **Safety first:** We use `mkcert` so that the Riot tokens sent between your browser and the server are always encrypted.
*   **Simple commands:** Using `node main.js` keeps things easy without needing extra tools like `npm` or `nodemon`.
*   **Direct testing:** The console fetch is the fastest way to prove the proxy is successfully talking to Riot's servers.

Note: If you want to test the store tracker through the frontend, skip the "How to test" step and copy your bearer token into the input field located at `index.html`. This should display you the skins and their ingame names in the frontend.

---

### More information about the project can be found in my submitted hand-in!
