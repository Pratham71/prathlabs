import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getRedis } from "@/lib/redis";

// Admin session: the password lives only in ADMIN_PASSWORD (server env, never in the bundle). A correct
// login gets a signed, httpOnly cookie ("<expiry>.<hmac>") good for 12 hours. ADMIN_SECRET signs it.
export const ADMIN_COOKIE = "admin";
const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5; // per IP per 15 minutes
const MAX_FAILS_ALL = 30; // across all IPs per 15 minutes, so rotating IPs doesn't help

const sha = (s: string) => createHash("sha256").update(s).digest();
const sign = (exp: string, secret: string) => createHmac("sha256", secret).update(exp).digest("hex");

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

export function checkPassword(input: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || typeof input !== "string" || input.length > 256) return false;
  return timingSafeEqual(sha(input), sha(pw)); // hashed: equal lengths, constant time
}

export function newSession(now = Date.now()) {
  const exp = String(now + TTL_MS);
  return { value: `${exp}.${sign(exp, process.env.ADMIN_SECRET!)}`, maxAge: TTL_MS / 1000 };
}

export function validSession(value: string | undefined, now = Date.now()): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!value || !secret) return false;
  const [exp, mac] = value.split(".");
  if (!exp || !mac || Number(exp) < now) return false;
  const want = Buffer.from(sign(exp, secret));
  const got = Buffer.from(mac);
  return want.length === got.length && timingSafeEqual(want, got);
}

// Reads the cookie off a Request (route handlers).
export function isAdminRequest(req: Request) {
  const c = req.headers.get("cookie") ?? "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return validSession(m?.[1]);
}

// Login throttle in Redis; without Redis (local dev) it's off.
const hasRedis = () => Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const failKey = (ip: string) => `admin:fail:${ip}`;
const ALL = "admin:fail:*all";

export async function loginBlocked(ip: string) {
  if (!hasRedis()) return false;
  const [mine, all] = await getRedis().mget<(number | null)[]>(failKey(ip), ALL);
  return (mine ?? 0) >= MAX_FAILS || (all ?? 0) >= MAX_FAILS_ALL;
}

export async function noteFailure(ip: string) {
  if (!hasRedis()) return;
  const r = getRedis();
  for (const k of [failKey(ip), ALL]) if ((await r.incr(k)) === 1) await r.expire(k, 15 * 60);
}

// Vercel sets x-real-ip itself (clients can't forge it); otherwise the rightmost x-forwarded-for entry,
// the one our proxy appended. The leftmost is whatever the client sent.
export const clientIp = (req: Request) =>
  req.headers.get("x-real-ip")?.trim() || (req.headers.get("x-forwarded-for") ?? "").split(",").at(-1)?.trim() || "local";
