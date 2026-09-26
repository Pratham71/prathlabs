import { Redis } from "@upstash/redis";

let _instance: Redis | undefined;

// Upstash's own names, or the KV_* names Vercel's Redis integration sets; Redis.fromEnv() reads either.
export const hasRedis = () =>
  Boolean((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));

export function getRedis(): Redis {
  if (!_instance) {
    _instance = Redis.fromEnv();
  }
  return _instance;
}
