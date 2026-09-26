const store = new Map<string, unknown>();
jest.mock("@/lib/redis", () => ({
  hasRedis: () => true,
  getRedis: () => ({ get: async (k: string) => store.get(k) ?? null, set: async (k: string, v: unknown) => void store.set(k, v) }),
}));

import { isAdmin, newSession, revokeSessions } from "@/lib/admin";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "hunter2";
  process.env.ADMIN_SECRET = "s3cret";
});

test("logout revokes every session issued before it, not later ones", async () => {
  const old = newSession(1_000).value;
  expect(await isAdmin(old, 2_000)).toBe(true);
  await revokeSessions(5_000);
  expect(await isAdmin(old, 6_000)).toBe(false); // a copied cookie dies with the logout
  const fresh = newSession(7_000).value;
  expect(await isAdmin(fresh, 8_000)).toBe(true);
});
