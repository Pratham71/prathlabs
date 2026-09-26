import { getRedis, hasRedis } from "@/lib/redis";
import { clientIp } from "@/lib/admin";
import { VISITS_KEEP, VISITS_KEY, parseVisit, tallyVisits, visitEntry } from "@/lib/visits";


// GET: recent visits per region (CDN-cached a minute). Empty when Redis isn't configured or errors.
export async function GET() {
  let visits: { id: string; n: number }[] = [];
  if (hasRedis()) {
    try {
      visits = tallyVisits(await getRedis().lrange<string>(VISITS_KEY, 0, VISITS_KEEP - 1), Date.now());
    } catch {}
  }
  return Response.json(visits, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
}

// POST: the intro records the visitor's region once per session (body: region id, e.g. "dxb1").
// A few per IP per 10 minutes (a real visitor sends one per session), so one script can't paint the globe.
const PER_IP = 3;

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 64) return new Response(null, { status: 413 });
  const id = parseVisit(await req.text());
  if (!id) return new Response(null, { status: 400 });
  if (hasRedis()) {
    const redis = getRedis();
    const key = `visits:ip:${clientIp(req)}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 10 * 60);
    if (n > PER_IP) return new Response(null, { status: 429 });
    await redis.lpush(VISITS_KEY, visitEntry(id, Date.now()));
    await redis.ltrim(VISITS_KEY, 0, VISITS_KEEP - 1);
  }
  return new Response(null, { status: 204 });
}
