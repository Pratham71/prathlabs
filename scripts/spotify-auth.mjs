// Spotify refresh token for /api/now-playing: get one, and check one before pasting it into Vercel.
//
// 1. https://developer.spotify.com/dashboard -> Create app. Redirect URI: http://127.0.0.1:8888/callback, API: Web API.
// 2. Get a token:   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
//    Open the printed link, approve. It prints the token (value only) after testing it against Spotify.
// 3. Check a token: SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... SPOTIFY_REFRESH_TOKEN=... node scripts/spotify-auth.mjs check
//    Use the exact three values that are in Vercel. The token only works with the app that issued it.
// Nothing is written to disk.
import { createServer } from "node:http";

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: saved } = process.env;
if (!id || !secret) throw new Error("set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET");
const redirect = "http://127.0.0.1:8888/callback";
const scope = "user-read-currently-playing user-read-recently-played";
const basic = `Basic ${Buffer.from(`${id.trim()}:${secret.trim()}`).toString("base64")}`;

const token = (body) =>
  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: basic, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  }).then((r) => r.json());

// Does this refresh token work with this app, and can it read what's playing?
async function check(refresh) {
  const t = await token({ grant_type: "refresh_token", refresh_token: refresh.trim() });
  if (!t.access_token) return `FAILED: ${t.error} ${t.error_description ?? ""} (the token doesn't belong to this client id/secret, or was revoked)`;
  const me = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${t.access_token}` } });
  const who = me.ok ? (await me.json()).display_name : `profile ${me.status}`;
  const recent = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers: { Authorization: `Bearer ${t.access_token}` } });
  return recent.ok ? `OK: works for Spotify account "${who}"` : `PARTLY: token works for "${who}" but recently-played says ${recent.status} (rerun without "check" to re-approve the scopes)`;
}

if (process.argv[2] === "check") {
  if (!saved) throw new Error("set SPOTIFY_REFRESH_TOKEN to the value you want to check");
  console.log(await check(saved));
} else {
  // show_dialog: always ask, so you can see which Spotify account you're approving
  console.log(`open: https://accounts.spotify.com/authorize?${new URLSearchParams({ client_id: id.trim(), response_type: "code", redirect_uri: redirect, scope, show_dialog: "true" })}`);
  const server = createServer(async (req, res) => {
    const code = new URL(req.url, redirect).searchParams.get("code");
    if (!code) return res.end("no code");
    const j = await token({ grant_type: "authorization_code", code, redirect_uri: redirect });
    if (!j.refresh_token) {
      console.log("failed:", j);
      res.end("failed, see terminal");
    } else {
      console.log(`\n${await check(j.refresh_token)}\n\nPaste this as SPOTIFY_REFRESH_TOKEN in Vercel (the value only, one line), then redeploy:\n\n${j.refresh_token}\n`);
      res.end("done, back to the terminal");
    }
    server.close();
  });
  server.listen(8888, "127.0.0.1");
}
