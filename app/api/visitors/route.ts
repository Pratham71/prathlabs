import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(_req: NextRequest) {
  const count = (await redis.get<number>("visitors")) ?? 0;
  return NextResponse.json({ count });
}

export async function POST(_req: NextRequest) {
  const count = await redis.incr("visitors");
  return NextResponse.json({ count });
}
