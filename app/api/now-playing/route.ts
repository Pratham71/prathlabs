import { getSettings } from "@/lib/settings";
import { nowPlaying, spotifyConfigured } from "@/lib/spotify";

// GET: what's on Spotify right now (or last). {off: true} when switched off in /admin or not configured.
// CDN-cached 30s, so a busy page costs Spotify two calls a minute at most.
export async function GET() {
  const headers = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" };
  if (!spotifyConfigured() || !(await getSettings()).spotify) return Response.json({ off: true }, { headers });
  try {
    return Response.json((await nowPlaying()) ?? { off: true }, { headers });
  } catch {
    return Response.json({ off: true }, { headers: { "Cache-Control": "public, s-maxage=10" } });
  }
}
