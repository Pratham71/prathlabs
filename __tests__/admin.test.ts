jest.mock("next/cache", () => ({ unstable_cache: (f: unknown) => f }));
jest.mock("@/lib/redis", () => ({ getRedis: () => ({}), hasRedis: () => false }));

import { checkPassword, newSession, validSession } from "@/lib/admin";
import { clean, isBlob, isSitePath } from "@/lib/settings";

test("file urls: our blob store or a site path, nothing that leaves the site", () => {
  expect(isBlob("https://abc123.public.blob.vercel-storage.com/music/gtav/a.mp3")).toBe(true);
  expect(isBlob("https://evil.com/x.mp3")).toBe(false);
  expect(isBlob("https://abc.public.blob.vercel-storage.com.evil.com/x")).toBe(false);
  expect(isSitePath("/sfx/wasted.mp3")).toBe(true);
  expect(isSitePath("//evil.com/x.mp3")).toBe(false);
  expect(isSitePath("/\\evil.com/x.mp3")).toBe(false);
  expect(isSitePath("https://evil.com")).toBe(false);
});

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

test("song volume survives clean; out-of-range drops the song", () => {
  const src = "https://abc.public.blob.vercel-storage.com/music/gtav/a.mp3";
  const s = clean({ music: { gtav: [{ title: "a", artist: "", src, volume: 0.4 }, { title: "b", artist: "", src, volume: 3 }, { title: "c", artist: "", src, volume: 1 }] } });
  expect(s.music.gtav).toEqual([{ title: "a", artist: "", src, volume: 0.4 }, { title: "c", artist: "", src }]);
});

test("egg sounds keep only known eggs; upload volume defaults to full", () => {
  const src = "https://abc.public.blob.vercel-storage.com/sfx/egg-storm/a.mp3";
  const s = clean({ sfx: { storm: { src, volume: 0.3 }, nope: { src }, wanted: { src: "" } }, uploadVolume: 7 });
  expect(s.sfx).toEqual({ storm: { src, volume: 0.3 } });
  expect(s.uploadVolume).toBe(1);
  expect(clean({ uploadVolume: 0.6 }).uploadVolume).toBe(0.6);
});
