import { unstable_cache } from "next/cache";
import { getRedis, hasRedis } from "@/lib/redis";
import { THEMES, isTheme, type Theme } from "@/lib/theme";
import type { RealTrack, RebootSound } from "@/content/music";

// Site settings the admin panel edits, kept in Upstash Redis under one key. Read through a short cache
// (tag "site-settings") and injected into every page, so visitors get them without an extra request.
export type Settings = {
  defaultTheme: Theme; // what a first-time visitor sees
  themes: Theme[]; // which themes the dock button cycles through (amber always stays)
  spotify: boolean; // show "now playing"
  music: Partial<Record<Theme, RealTrack[]>>; // songs uploaded through the panel (Vercel Blob URLs)
  reboot: Partial<Record<Theme, RebootSound>>; // reboot sounds uploaded through the panel
};

export const DEFAULT_SETTINGS: Settings = { defaultTheme: "amber", themes: [...THEMES], spotify: true, music: {}, reboot: {} };
export const SETTINGS_TAG = "site-settings";
const KEY = "site:settings";


// Whatever is stored, hand back a well-formed Settings (unknown themes dropped, amber always present).
export function clean(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Settings>;
  const themes = Array.isArray(r.themes) ? r.themes.filter((t): t is Theme => typeof t === "string" && isTheme(t)) : [...THEMES];
  if (!themes.includes("amber")) themes.unshift("amber");
  const defaultTheme = typeof r.defaultTheme === "string" && isTheme(r.defaultTheme) && themes.includes(r.defaultTheme) ? r.defaultTheme : "amber";
  return {
    defaultTheme,
    themes: THEMES.filter((t) => themes.includes(t)), // keep the canonical order
    spotify: r.spotify !== false,
    music: perTheme(r.music, (v) => (Array.isArray(v) ? v.filter(isTrack).map(({ title, artist, src, start, volume }) => ({ title, artist, src, ...(start ? { start } : {}), ...(volume !== undefined && volume !== 1 ? { volume } : {}) })) : undefined)),
    reboot: perTheme(r.reboot, (v) => (v && typeof v === "object" && str((v as RebootSound).src) ? { src: (v as RebootSound).src, volume: vol((v as RebootSound).volume) } : undefined)),
  };
}

// The only file URLs settings may hold: our own Blob store (the only thing deleted on removal),
// or a site path "/x". Never "//host" or "/\host", which browsers read as another site.
export const isBlob = (u: string) => /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(u);
export const isSitePath = (u: string) => /^\/(?![/\\])/.test(u);

const str = (s: unknown): s is string => typeof s === "string" && s.length > 0 && s.length < 500;
const vol = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 1 ? v : 0.6);
const isTrack = (t: unknown): t is RealTrack => {
  const x = t as RealTrack;
  return !!x && str(x.title) && typeof x.artist === "string" && str(x.src) && (x.start === undefined || (typeof x.start === "number" && x.start >= 0)) && (x.volume === undefined || (typeof x.volume === "number" && x.volume >= 0 && x.volume <= 1));
};
function perTheme<T>(raw: unknown, pick: (v: unknown) => T | undefined): Partial<Record<Theme, T>> {
  const out: Partial<Record<Theme, T>> = {};
  if (raw && typeof raw === "object")
    for (const [k, v] of Object.entries(raw)) {
      const p = isTheme(k) ? pick(v) : undefined;
      if (p !== undefined) out[k as Theme] = p;
    }
  return out;
}

export async function readSettings(): Promise<Settings> {
  if (!hasRedis()) return DEFAULT_SETTINGS;
  try {
    return clean(await getRedis().get(KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const getSettings = unstable_cache(readSettings, [KEY], { tags: [SETTINGS_TAG], revalidate: 300 });

export async function writeSettings(next: Settings) {
  if (!hasRedis()) throw new Error("Upstash Redis is not configured");
  await getRedis().set(KEY, clean(next));
}
