import { envValue, nowPlaying } from "@/lib/spotify";

const track = (name: string) => ({
  type: "track",
  name,
  external_urls: { spotify: "https://open.spotify.com/track/x" },
  artists: [{ name: "M83" }],
  album: { images: [{ url: "https://i.scdn.co/image/big", width: 640 }, { url: "https://i.scdn.co/image/small", width: 64 }] },
});

const mock = (routes: Record<string, [number, unknown?]>) =>
  jest.spyOn(global, "fetch").mockImplementation(async (url) => {
    const key = Object.keys(routes).find((k) => String(url).includes(k))!;
    const [status, body] = routes[key];
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });

beforeAll(() => {
  process.env.SPOTIFY_CLIENT_ID = "id";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  process.env.SPOTIFY_REFRESH_TOKEN = "refresh";
});
afterEach(() => jest.restoreAllMocks());

test("currently playing, smallest cover", async () => {
  mock({ "api/token": [200, { access_token: "t" }], "currently-playing": [200, { is_playing: true, item: track("Midnight City") }] });
  expect(await nowPlaying()).toEqual({ playing: true, title: "Midnight City", artist: "M83", url: "https://open.spotify.com/track/x", art: "https://i.scdn.co/image/small" });
});

test("nothing playing falls back to the last played", async () => {
  mock({ "api/token": [200, { access_token: "t" }], "currently-playing": [204], "recently-played": [200, { items: [{ track: track("Wait") }] }] });
  expect(await nowPlaying()).toMatchObject({ playing: false, title: "Wait" });
});

test("errors say what went wrong", async () => {
  mock({ "api/token": [400, { error: "invalid_grant" }] });
  await expect(nowPlaying()).rejects.toThrow("token 400 invalid_grant");
  jest.restoreAllMocks();
  mock({ "api/token": [200, { access_token: "t" }], "currently-playing": [204], "recently-played": [403] });
  await expect(nowPlaying()).rejects.toThrow("recently-played 403");
});

test("env values survive sloppy pastes", () => {
  for (const raw of ["abc", " abc\n", '"abc"', "'abc'", "SPOTIFY_REFRESH_TOKEN=abc", 'SPOTIFY_REFRESH_TOKEN="abc" ']) {
    process.env.SPOTIFY_REFRESH_TOKEN = raw;
    expect(envValue("SPOTIFY_REFRESH_TOKEN")).toBe("abc");
  }
  process.env.SPOTIFY_REFRESH_TOKEN = "refresh";
});
