import { unstable_cache } from "next/cache";
import { getRedis, hasRedis } from "@/lib/redis";
import { redisBeatStore } from "@/lib/beat-store";
import { liveDevices, readOnline } from "@/lib/heartbeat";

// Cached for 60s so page traffic never multiplies Redis reads; any failure means "show nothing".
const getOnlineDevices = unstable_cache(
  async () => {
    if (!hasRedis()) return [];
    try {
      return await readOnline(redisBeatStore(getRedis()));
    } catch {
      return [];
    }
  },
  ["online-devices"],
  { revalidate: 60 },
);

export async function getLiveDevices() {
  const renderedAt = Date.now();
  return { devices: liveDevices(await getOnlineDevices(), renderedAt), renderedAt };
}

export const renderDate = () => new Date().toISOString().slice(0, 10);
