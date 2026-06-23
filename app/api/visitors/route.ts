import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const count = (await getRedis().get<number>("visitors")) ?? 0;
  return NextResponse.json({ count });
}

export async function POST(_req: NextRequest) {
  const count = await getRedis().incr("visitors");
  return NextResponse.json({ count });
}
