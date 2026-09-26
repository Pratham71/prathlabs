import { NODES } from "@/lib/boot-lines";

// Recent visits by region, for the intro globe. Only the edge-region id derived from the visitor's
// timezone is stored (e.g. "dxb1") with a timestamp: no IP, no user agent.
export const VISITS_KEY = "visits";
export const VISITS_KEEP = 200; // list is trimmed to this; bounds storage and the effect of any spam
export const VISITS_WINDOW_MS = 7 * 24 * 3600 * 1000;

const IDS = new Set(NODES.map((n) => n.id));

export function parseVisit(raw: string): string | null {
  const id = raw.trim();
  return IDS.has(id) ? id : null;
}

export const visitEntry = (id: string, now: number) => `${id}:${now}`;

// "dxb1:1790000000000" entries -> per-region counts inside the window, busiest first.
export function tallyVisits(entries: string[], now: number): { id: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const [id, ts] = e.split(":");
    if (!IDS.has(id) || !(now - Number(ts) < VISITS_WINDOW_MS)) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n);
}
