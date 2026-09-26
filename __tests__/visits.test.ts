const list: string[] = [];
const fakeRedis = {
  lpush: jest.fn(async (_k: string, v: string) => list.unshift(v)),
  ltrim: jest.fn(async (_k: string, a: number, b: number) => list.splice(b + 1)),
  lrange: jest.fn(async () => list),
};
jest.mock("@/lib/redis", () => ({ getRedis: () => fakeRedis }));

import { GET, POST } from "@/app/api/visits/route";
import { VISITS_WINDOW_MS, parseVisit, tallyVisits } from "@/lib/visits";

const post = (body: string) => POST(new Request("http://localhost/api/visits", { method: "POST", body }));

beforeEach(() => {
  list.length = 0;
  jest.clearAllMocks();
  process.env.UPSTASH_REDIS_REST_URL = "http://x";
  process.env.UPSTASH_REDIS_REST_TOKEN = "t";
});

test("only known region ids are accepted", () => {
  expect(parseVisit(" dxb1\n")).toBe("dxb1");
  expect(parseVisit("evil")).toBeNull();
  expect(parseVisit('{"id":"dxb1"}')).toBeNull();
});

test("tally counts per region inside the window, busiest first, ignoring junk", () => {
  const now = 10 * VISITS_WINDOW_MS;
  const old = now - VISITS_WINDOW_MS - 1;
  expect(tallyVisits([`fra1:${now}`, `dxb1:${now}`, `dxb1:${now - 5}`, `dxb1:${old}`, "junk", `xxx1:${now}`], now)).toEqual([
    { id: "dxb1", n: 2 },
    { id: "fra1", n: 1 },
  ]);
});

test("POST stores a valid region and caps the list; rejects anything else", async () => {
  expect((await post("sin1")).status).toBe(204);
  expect(list[0]).toMatch(/^sin1:\d+$/);
  expect(fakeRedis.ltrim).toHaveBeenCalledWith("visits", 0, 199);
  expect((await post("nope")).status).toBe(400);
  expect(list).toHaveLength(1);
});

test("GET tallies what was stored and is CDN-cacheable", async () => {
  await post("bom1");
  await post("bom1");
  const res = await GET();
  expect(await res.json()).toEqual([{ id: "bom1", n: 2 }]);
  expect(res.headers.get("cache-control")).toContain("s-maxage=60");
});
