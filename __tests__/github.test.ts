import { parseCalendar, activityStats, getContributions } from "@/lib/github";

const fixture = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 9,
          weeks: [
            {
              contributionDays: [
                { date: "2026-09-21", contributionCount: 0, contributionLevel: "NONE" },
                { date: "2026-09-22", contributionCount: 5, contributionLevel: "FOURTH_QUARTILE" },
                { date: "2026-09-23", contributionCount: 1, contributionLevel: "FIRST_QUARTILE" },
                { date: "2026-09-24", contributionCount: 3, contributionLevel: "THIRD_QUARTILE" },
                { date: "2026-09-25", contributionCount: 0, contributionLevel: "NONE" },
              ],
            },
          ],
        },
      },
    },
  },
};

describe("parseCalendar", () => {
  it("flattens weeks into days with numeric levels", () => {
    const c = parseCalendar(fixture);
    expect(c.total).toBe(9);
    expect(c.days.map((d) => d.level)).toEqual([0, 4, 1, 3, 0]);
    expect(c.days[1]).toEqual({ date: "2026-09-22", count: 5, level: 4 });
  });
  it("throws on a GraphQL error payload", () => {
    expect(() => parseCalendar({ errors: [{ message: "bad" }] })).toThrow();
  });
});

describe("activityStats", () => {
  it("finds the busiest day and counts the streak from yesterday when today is 0", () => {
    const s = activityStats(parseCalendar(fixture).days);
    expect(s.busiest).toEqual({ date: "2026-09-22", count: 5, level: 4 });
    expect(s.currentStreak).toBe(3);
  });
  it("handles an empty year", () => {
    expect(activityStats([])).toEqual({ busiest: null, currentStreak: 0 });
  });
});

describe("getContributions", () => {
  it("returns parsed data on success", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => fixture });
    const c = await getContributions("Pratham71", "tok", fetchImpl as unknown as typeof fetch);
    expect(c?.total).toBe(9);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe("bearer tok");
  });
  it("never lets fetch cache a response, so an error body can't stick for hours", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => fixture });
    await getContributions("Pratham71", "tok", fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0][1].cache).toBe("no-store");
  });
  it("returns null without a token, on HTTP errors, and on thrown errors", async () => {
    expect(await getContributions("x", undefined)).toBeNull();
    const notOk = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await getContributions("x", "t", notOk as unknown as typeof fetch)).toBeNull();
    const boom = jest.fn().mockRejectedValue(new Error("down"));
    expect(await getContributions("x", "t", boom as unknown as typeof fetch)).toBeNull();
  });
});
