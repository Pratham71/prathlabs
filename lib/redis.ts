import { Redis } from "@upstash/redis";

let _instance: Redis | undefined;

export function getRedis(): Redis {
  if (!_instance) {
    _instance = Redis.fromEnv();
  }
  return _instance;
}
