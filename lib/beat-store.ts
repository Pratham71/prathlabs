import type { Redis } from "@upstash/redis";
import type { Beat, BeatStore } from "@/lib/heartbeat";

export function redisBeatStore(redis: Pick<Redis, "get" | "set" | "mget">): BeatStore {
  return {
    get: (key) => redis.get<Beat>(key),
    set: async (key, value, ttlSeconds) => {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    mget: (keys) => redis.mget<(Beat | null)[]>(...keys),
  };
}
