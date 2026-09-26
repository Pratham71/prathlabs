import { getSettings } from "@/lib/settings";
import { nowPlaying, spotifyConfigured } from "@/lib/spotify";

// GET: what's on Spotify right now (or last). When there's nothing to show, {off: true, reason} says why
// (no secrets in it): "not configured" (env vars missing), "switched off" (/admin), "nothing played",
// or Spotify's error. The `spotify` prompt command prints the reason.
// CDN-cached 30s, so a busy page costs Spotify two calls a minute at most.
export async function GET() {
  const headers = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" };
  const off = (reason: string, cache = headers) => Response.json({ off: true, reason }, { headers: cache });
  if (!spotifyConfigured()) return off("not configured: set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN and redeploy");
  if (!(await getSettings()).spotify) return off("switched off in /admin");
  try {
    return (await nowPlaying().then((t) => t && Response.json(t, { headers }))) ?? off("nothing played yet");
  } catch (e) {
    console.error("now-playing:", (e as Error).message);
    return off(`spotify error: ${(e as Error).message}`, { "Cache-Control": "public, s-maxage=10" });
  }
}
