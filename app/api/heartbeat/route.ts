import { getRedis } from "@/lib/redis";
import { redisBeatStore } from "@/lib/beat-store";
import { isAuthorized, parseBeat, recordBeat } from "@/lib/heartbeat";

// Devices POST here every 5 min while they're on: {"device":"pi-01"} + Bearer HEARTBEAT_TOKEN.
export async function POST(req: Request) {
  if (!isAuthorized(req.headers.get("authorization"), process.env.HEARTBEAT_TOKEN)) {
    return new Response(null, { status: 401 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > 1024) return new Response(null, { status: 413 });
  const device = parseBeat(await req.text());
  if (!device) return new Response(null, { status: 400 });
  await recordBeat(redisBeatStore(getRedis()), device, Date.now());
  return new Response(null, { status: 204 });
}
