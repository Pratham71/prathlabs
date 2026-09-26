// Spotify "now playing": a long-lived refresh token (scripts/spotify-auth.mjs gets it once) buys a
// short access token, then currently-playing, falling back to the last played track.
export type NowPlaying = { playing: boolean; title: string; artist: string; url: string; art: string | null };

// Env values as pasted: trims spaces/newlines and quotes, and drops a leading "NAME=" (the auth script
// prints `SPOTIFY_REFRESH_TOKEN=...`, and pasting the whole line gets Spotify's invalid_grant).
export function envValue(name: string): string {
  let v = (process.env[name] ?? "").trim();
  if (v.startsWith(`${name}=`)) v = v.slice(name.length + 1).trim();
  return v.replace(/^(["'])(.*)\1$/, "$2").trim();
}

export const spotifyConfigured = () => Boolean(envValue("SPOTIFY_CLIENT_ID") && envValue("SPOTIFY_CLIENT_SECRET") && envValue("SPOTIFY_REFRESH_TOKEN"));

async function accessToken(): Promise<string> {
  const basic = Buffer.from(`${envValue("SPOTIFY_CLIENT_ID")}:${envValue("SPOTIFY_CLIENT_SECRET")}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: envValue("SPOTIFY_REFRESH_TOKEN") }),
    cache: "no-store",
  });
  // Spotify's error code only (e.g. invalid_grant = bad/revoked refresh token, invalid_client = wrong id/secret)
  if (!res.ok) {
    // Spotify's error code and description ("Invalid refresh token", "Refresh token revoked", ...); no secrets
    const e = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
    throw new Error([`token ${res.status}`, e.error, e.error_description && `(${e.error_description})`].filter(Boolean).join(" "));
  }
  return (await res.json()).access_token;
}

type SpotifyTrack = { name: string; external_urls: { spotify: string }; artists: { name: string }[]; album: { images: { url: string; width: number }[] } };

const shape = (t: SpotifyTrack, playing: boolean): NowPlaying => ({
  playing,
  title: t.name,
  artist: t.artists.map((a) => a.name).join(", "),
  url: t.external_urls.spotify,
  // smallest cover; it gets dithered down to a few dozen dots anyway
  art: [...t.album.images].sort((a, b) => a.width - b.width)[0]?.url ?? null,
});

export async function nowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  const get = (path: string) => fetch(`https://api.spotify.com/v1/me/${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const now = await get("player/currently-playing");
  if (now.status === 200) {
    const j = await now.json();
    // podcasts and ads come back without a track; fall through to the last song
    if (j?.item?.type === "track") return shape(j.item, Boolean(j.is_playing));
  }
  if (now.status !== 200 && now.status !== 204) throw new Error(`currently-playing ${now.status}`);
  const recent = await get("player/recently-played?limit=1");
  // 403 here usually means the refresh token lacks user-read-recently-played: rerun scripts/spotify-auth.mjs
  if (!recent.ok) throw new Error(`recently-played ${recent.status}`);
  const item = (await recent.json())?.items?.[0]?.track;
  return item ? shape(item, false) : null;
}
