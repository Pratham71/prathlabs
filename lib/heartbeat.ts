import { createHash, timingSafeEqual } from "node:crypto";

// Display names live here, never in the payload, so a device can't put text on the page.
export const DEVICES = {
  "pi-01": "pi-01",
  homeserver: "homeserver",
} as const;

export type DeviceId = keyof typeof DEVICES;
// Optional readings a device may send with its beat. Numbers only, clamped; anything else is dropped.
export type Metrics = { cpu?: number; mem?: number; temp?: number };
export type Beat = { since: number; ts: number; cpu?: number[]; mem?: number; temp?: number };
export const CPU_SAMPLES = 24; // 2h of 5-minute beats
export type BeatStore = {
  get(key: string): Promise<Beat | null>;
  set(key: string, value: Beat, ttlSeconds: number): Promise<void>;
  mget(keys: string[]): Promise<(Beat | null)[]>;
};

export const TTL_SECONDS = 600; // a device is "online" for 10 min after its last beat
const MAX_BODY = 1024;
const key = (id: DeviceId) => `hb:${id}`;
const ids = Object.keys(DEVICES) as DeviceId[];

const digest = (s: string) => createHash("sha256").update(s).digest();

export function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  // Hash both sides so lengths match and the comparison is constant-time.
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

export function parseBeat(raw: string): DeviceId | null {
  if (raw.length > MAX_BODY) return null;
  try {
    const body: unknown = JSON.parse(raw);
    const device = (body as { device?: unknown } | null)?.device;
    return typeof device === "string" && Object.hasOwn(DEVICES, device) ? (device as DeviceId) : null;
  } catch {
    return null;
  }
}

const reading = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v))) : undefined;

export function parseMetrics(raw: string): Metrics {
  try {
    const b = JSON.parse(raw) as Record<string, unknown>;
    return { cpu: reading(b.cpu, 0, 100), mem: reading(b.mem, 0, 100), temp: reading(b.temp, -40, 150) };
  } catch {
    return {};
  }
}

export async function recordBeat(store: BeatStore, id: DeviceId, now: number, m: Metrics = {}): Promise<Beat> {
  const prev = await store.get(key(id));
  const beat: Beat = { since: prev?.since ?? now, ts: now };
  if (m.cpu !== undefined) beat.cpu = [...(prev?.cpu ?? []), m.cpu].slice(-CPU_SAMPLES);
  if (m.mem !== undefined) beat.mem = m.mem;
  if (m.temp !== undefined) beat.temp = m.temp;
  await store.set(key(id), beat, TTL_SECONDS);
  return beat;
}

export async function readOnline(store: BeatStore) {
  const beats = await store.mget(ids.map(key));
  return ids.flatMap((id, i) => {
    const beat = beats[i];
    return beat ? [{ id, name: DEVICES[id], since: beat.since, ts: beat.ts, cpu: beat.cpu, mem: beat.mem, temp: beat.temp }] : [];
  });
}

export type OnlineDevice = { id: string; name: string; since: number; ts: number; cpu?: number[]; mem?: number; temp?: number };

// Cached HTML can outlive a device's key; re-check the last beat's age wherever the list is shown.
export function liveDevices<T extends { ts: number }>(devices: T[], now: number): T[] {
  return devices.filter((d) => now - d.ts < TTL_SECONDS * 1000);
}

export function formatUptime(since: number, now: number): string {
  const mins = Math.floor((now - since) / 60_000);
  if (mins < 1) return "up <1m";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d) return `up ${d}d ${h}h`;
  if (h) return `up ${h}h ${m}m`;
  return `up ${m}m`;
}
