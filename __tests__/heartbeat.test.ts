import {
  isAuthorized,
  parseBeat,
  recordBeat,
  parseMetrics,
  CPU_SAMPLES,
  readOnline,
  liveDevices,
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
    expect(await readOnline(store)).toEqual([{ id: "homeserver", name: "homeserver", since: 5, ts: 5 }]);
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

describe("liveDevices", () => {
  const d = (id: string, ts: number) => ({ id, name: id, since: 0, ts });
  it("drops devices whose last beat is older than the TTL, even if a cached page still lists them", () => {
    const now = 10 * 60_000 + 1;
    expect(liveDevices([d("a", now - 1_000), d("b", 0)], now).map((x) => x.id)).toEqual(["a"]);
  });
});

describe("metrics", () => {
  it("keeps finite numbers, clamps them, drops the rest", () => {
    expect(parseMetrics('{"device":"pi-01","cpu":12.6,"mem":140,"temp":"hot"}')).toEqual({ cpu: 13, mem: 100, temp: undefined });
    expect(parseMetrics("nope")).toEqual({});
  });

  it("builds a bounded cpu history across beats", async () => {
    const { store, data } = memoryStore();
    for (let i = 0; i < CPU_SAMPLES + 5; i++) await recordBeat(store, "pi-01", 1000 + i, { cpu: i, mem: 40, temp: 50 });
    const beat = data.get("hb:pi-01")!;
    expect(beat.cpu).toHaveLength(CPU_SAMPLES);
    expect(beat.cpu!.at(-1)).toBe(CPU_SAMPLES + 4);
    expect(beat).toMatchObject({ mem: 40, temp: 50, since: 1000 });
  });

  it("a beat without readings still records", async () => {
    const { store, data } = memoryStore();
    await recordBeat(store, "homeserver", 5);
    expect(data.get("hb:homeserver")).toEqual({ since: 5, ts: 5 });
  });
});
