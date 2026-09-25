import { unstable_cache } from "next/cache";
import { getRedis } from "@/lib/redis";
import { redisBeatStore } from "@/lib/beat-store";
import { formatUptime, readOnline } from "@/lib/heartbeat";

// Cached for 60s so page traffic never multiplies Redis reads; any failure means "show nothing".
export const getOnlineDevices = unstable_cache(
  async () => {
    if (!process.env.UPSTASH_REDIS_REST_URL) return [];
    try {
      return await readOnline(redisBeatStore(getRedis()));
    } catch {
      return [];
    }
  },
  ["online-devices"],
  { revalidate: 60 },
);

// Uptime is formatted at render time so "up 3h" is accurate to the page's 60s revalidate.
export async function getDeviceLines() {
  const now = Date.now();
  return (await getOnlineDevices()).map((d) => ({ ...d, uptime: formatUptime(d.since, now) }));
}

export const renderDate = () => new Date().toISOString().slice(0, 10);
