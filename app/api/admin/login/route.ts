import { cookies } from "next/headers";
import { hasRedis } from "@/lib/redis";
import { ADMIN_COOKIE, adminConfigured, checkPassword, clientIp, loginBlocked, newSession, noteFailure } from "@/lib/admin";

// POST {password}: the palette's `sudo su` and /admin's form both land here. DELETE logs out.
export async function POST(req: Request) {
  if (!adminConfigured()) return Response.json({ error: "admin is not configured (ADMIN_PASSWORD, ADMIN_SECRET)" }, { status: 503 });
  // the login throttle lives in Redis; in production, no Redis means no throttle, so no login either
  if (process.env.NODE_ENV === "production" && !hasRedis()) return Response.json({ error: "connect Redis first (it rate-limits this login)" }, { status: 503 });
  const ip = clientIp(req);
  if (await loginBlocked(ip)) return Response.json({ error: "too many tries, wait 15 minutes" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (!checkPassword(body?.password)) {
    await noteFailure(ip);
    return Response.json({ error: "Sorry, try again." }, { status: 401 });
  }
  const s = newSession();
  (await cookies()).set(ADMIN_COOKIE, s.value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: s.maxAge,
  });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return new Response(null, { status: 204 });
}
