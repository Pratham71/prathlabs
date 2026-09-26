const kv = new Map<string, unknown>();
const fakeRedis = {
  get: jest.fn(async (k: string) => kv.get(k) ?? null),
  set: jest.fn(async (k: string, v: unknown) => {
    kv.set(k, v);
    return "OK";
  }),
  mget: jest.fn(async (...keys: string[]) => keys.map((k) => kv.get(k) ?? null)),
};
jest.mock("@/lib/redis", () => ({ getRedis: () => fakeRedis }));

import { POST } from "@/app/api/heartbeat/route";

const req = (body: string, auth?: string) =>
  new Request("http://localhost/api/heartbeat", {
    method: "POST",
    body,
    headers: auth ? { Authorization: auth } : {},
  });

beforeEach(() => {
  kv.clear();
  jest.clearAllMocks();
  process.env.HEARTBEAT_TOKEN = "s3cret";
});

it("401s without the right token and writes nothing", async () => {
  expect((await POST(req('{"device":"pi-01"}'))).status).toBe(401);
  expect((await POST(req('{"device":"pi-01"}', "Bearer wrong"))).status).toBe(401);
  expect(fakeRedis.set).not.toHaveBeenCalled();
});

it("400s on an unknown device", async () => {
  expect((await POST(req('{"device":"laptop"}', "Bearer s3cret"))).status).toBe(400);
});

it("204s and stores the beat with a 10 minute expiry", async () => {
  const res = await POST(req('{"device":"pi-01"}', "Bearer s3cret"));
  expect(res.status).toBe(204);
  expect(fakeRedis.set).toHaveBeenCalledWith("hb:pi-01", expect.objectContaining({ since: expect.any(Number) }), { ex: 600 });
});
