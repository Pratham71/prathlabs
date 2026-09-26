import { getRedis } from "@/lib/redis";
import { redisBeatStore } from "@/lib/beat-store";
import { isAuthorized, parseBeat, parseMetrics, recordBeat } from "@/lib/heartbeat";
import { getLiveDevices } from "@/lib/devices";

// Public read for the side rail: whichever devices beat in the last 10 min, with their readings.
export async function GET() {
  const { devices } = await getLiveDevices();
  return Response.json(devices, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

// Devices POST here every 5 min while they're on: {"device":"pi-01","cpu":12,"mem":41,"temp":48}
// + Bearer HEARTBEAT_TOKEN. Readings are optional (scripts/heartbeat.sh sends them).
export async function POST(req: Request) {
  if (!isAuthorized(req.headers.get("authorization"), process.env.HEARTBEAT_TOKEN)) {
    return new Response(null, { status: 401 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > 1024) return new Response(null, { status: 413 });
  const raw = await req.text();
  const device = parseBeat(raw);
  if (!device) return new Response(null, { status: 400 });
  await recordBeat(redisBeatStore(getRedis()), device, Date.now(), parseMetrics(raw));
  return new Response(null, { status: 204 });
}
