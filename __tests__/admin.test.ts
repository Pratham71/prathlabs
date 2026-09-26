jest.mock("next/cache", () => ({ unstable_cache: (f: unknown) => f }));
jest.mock("@/lib/redis", () => ({ getRedis: () => ({}) }));

import { checkPassword, newSession, validSession } from "@/lib/admin";
import { clean } from "@/lib/settings";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "hunter2";
  process.env.ADMIN_SECRET = "s3cret";
});

test("password check", () => {
  expect(checkPassword("hunter2")).toBe(true);
  expect(checkPassword("hunter3")).toBe(false);
  expect(checkPassword(undefined)).toBe(false);
});

test("session cookie: valid, expired, tampered", () => {
  const { value } = newSession(1000);
  expect(validSession(value, 2000)).toBe(true);
  expect(validSession(value, 1000 + 13 * 3600e3)).toBe(false);
  const [exp, mac] = value.split(".");
  expect(validSession(`${Number(exp) + 1}.${mac}`, 2000)).toBe(false);
  expect(validSession("junk", 2000)).toBe(false);
});

test("settings are cleaned", () => {
  const s = clean({
    defaultTheme: "nope",
    themes: ["gtav", "bogus"],
    spotify: false,
    music: { gtav: [{ title: "a", artist: "b", src: "https://x/y.mp3", start: 5, extra: 1 }, { title: 3 }], bogus: [] },
    reboot: { blade: { src: "/sfx/slash.mp3", volume: 9 } },
  });
  expect(s.defaultTheme).toBe("amber");
  expect(s.themes).toEqual(["amber", "gtav"]);
  expect(s.spotify).toBe(false);
  expect(s.music).toEqual({ gtav: [{ title: "a", artist: "b", src: "https://x/y.mp3", start: 5 }] });
  expect(s.reboot).toEqual({ blade: { src: "/sfx/slash.mp3", volume: 0.6 } });
  expect(clean(null).themes.length).toBeGreaterThan(5);
});
