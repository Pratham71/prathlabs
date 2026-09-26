// One-time: get a Spotify refresh token for /api/now-playing.
//
// 1. https://developer.spotify.com/dashboard -> Create app. Redirect URI: http://127.0.0.1:8888/callback
// 2. SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
// 3. Open the printed link, approve, and copy the refresh token it prints into SPOTIFY_REFRESH_TOKEN
//    (Vercel env vars and .env.local). Nothing is written to disk.
import { createServer } from "node:http";

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error("set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET");
const redirect = "http://127.0.0.1:8888/callback";
const scope = "user-read-currently-playing user-read-recently-played";

console.log(`open: https://accounts.spotify.com/authorize?${new URLSearchParams({ client_id: id, response_type: "code", redirect_uri: redirect, scope })}`);

const server = createServer(async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get("code");
  if (!code) return res.end("no code");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirect }),
  });
  const j = await r.json();
  console.log(j.refresh_token ? `\nSPOTIFY_REFRESH_TOKEN=${j.refresh_token}\n` : j);
  res.end(j.refresh_token ? "done, back to the terminal" : "failed, see terminal");
  server.close();
});
server.listen(8888, "127.0.0.1");
