import { unstable_cache } from "next/cache";
import { getSettings } from "@/lib/settings";
import { nowPlaying, spotifyConfigured } from "@/lib/spotify";

// Spotify's answer is cached 30s server-side, so a busy page costs Spotify two calls a minute at most.
// (Errors aren't cached: unstable_cache only stores what resolves.)
const cachedNowPlaying = unstable_cache(nowPlaying, ["now-playing"], { revalidate: 30 });

// GET: what's on Spotify right now (or last). When there's nothing to show, {off: true, reason} says why
// (no secrets in it): "not configured" (env vars missing), "switched off" (/admin), "nothing played",
// or Spotify's error. The `spotify` prompt command prints the reason.
// Not CDN-cached: the /admin switch is read on every request, so turning it off applies at once.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const off = (reason: string) => Response.json({ off: true, reason }, { headers });
  if (!spotifyConfigured()) return off("not configured: set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN and redeploy");
  if (!(await getSettings()).spotify) return off("switched off in /admin");
  try {
    const t = await cachedNowPlaying();
    return t ? Response.json(t, { headers }) : off("nothing played yet");
  } catch (e) {
    console.error("now-playing:", (e as Error).message);
    return off(`spotify error: ${(e as Error).message}`);
  }
}
