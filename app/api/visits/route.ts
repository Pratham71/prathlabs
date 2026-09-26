import { getRedis } from "@/lib/redis";
import { VISITS_KEEP, VISITS_KEY, parseVisit, tallyVisits, visitEntry } from "@/lib/visits";

const hasRedis = () => Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

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
// ponytail: no rate limit; the list is capped at VISITS_KEEP, so spam can only skew the dots, add one if it happens.
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 64) return new Response(null, { status: 413 });
  const id = parseVisit(await req.text());
  if (!id) return new Response(null, { status: 400 });
  if (hasRedis()) {
    const redis = getRedis();
    await redis.lpush(VISITS_KEY, visitEntry(id, Date.now()));
    await redis.ltrim(VISITS_KEY, 0, VISITS_KEEP - 1);
  }
  return new Response(null, { status: 204 });
}
