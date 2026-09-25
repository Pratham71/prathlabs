import {
  isAuthorized,
  parseBeat,
  recordBeat,
  readOnline,
  formatUptime,
  TTL_SECONDS,
  type Beat,
  type BeatStore,
} from "@/lib/heartbeat";

function memoryStore() {
  const data = new Map<string, Beat>();
  const ttls = new Map<string, number>();
  const store: BeatStore = {
    get: async (k) => data.get(k) ?? null,
    set: async (k, v, ttl) => {
      data.set(k, v);
      ttls.set(k, ttl);
    },
    mget: async (keys) => keys.map((k) => data.get(k) ?? null),
  };
  return { store, data, ttls };
}

describe("isAuthorized", () => {
  it("rejects a missing header", () => {
    expect(isAuthorized(null, "s3cret")).toBe(false);
  });
  it("rejects a wrong token", () => {
    expect(isAuthorized("Bearer nope", "s3cret")).toBe(false);
  });
  it("rejects when no secret is configured", () => {
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });
  it("accepts the right token", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
  });
});

describe("parseBeat", () => {
  it("accepts an allowlisted device", () => {
    expect(parseBeat('{"device":"pi-01"}')).toBe("pi-01");
    expect(parseBeat('{"device":"homeserver"}')).toBe("homeserver");
  });
  it("rejects unknown devices, bad JSON and oversized bodies", () => {
    expect(parseBeat('{"device":"laptop"}')).toBeNull();
    expect(parseBeat("{not json")).toBeNull();
    expect(parseBeat('{"device":"pi-01","pad":"' + "x".repeat(1100) + '"}')).toBeNull();
    expect(parseBeat('{"device":"__proto__"}')).toBeNull();
    expect(parseBeat("null")).toBeNull();
  });
});

describe("recordBeat", () => {
  it("sets a fresh key with the TTL and keeps `since` across beats", async () => {
    const { store, ttls } = memoryStore();
    const first = await recordBeat(store, "pi-01", 1_000);
    expect(first).toEqual({ since: 1_000, ts: 1_000 });
    expect(ttls.get("hb:pi-01")).toBe(TTL_SECONDS);
    const second = await recordBeat(store, "pi-01", 301_000);
    expect(second).toEqual({ since: 1_000, ts: 301_000 });
  });
});

describe("readOnline", () => {
  it("returns nothing when no device has beaten", async () => {
    expect(await readOnline(memoryStore().store)).toEqual([]);
  });
  it("returns only devices with a live key, in allowlist order", async () => {
    const { store } = memoryStore();
    await recordBeat(store, "homeserver", 5);
    expect(await readOnline(store)).toEqual([{ id: "homeserver", name: "homeserver", since: 5 }]);
    await recordBeat(store, "pi-01", 7);
    expect((await readOnline(store)).map((d) => d.id)).toEqual(["pi-01", "homeserver"]);
  });
});

describe("formatUptime", () => {
  const m = 60_000;
  it.each([
    [0, "up <1m"],
    [12 * m, "up 12m"],
    [3 * 60 * m + 5 * m, "up 3h 5m"],
    [2 * 24 * 60 * m + 4 * 60 * m, "up 2d 4h"],
  ])("%d ms → %s", (elapsed, text) => {
    expect(formatUptime(0, elapsed)).toBe(text);
  });
});
