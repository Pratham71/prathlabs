import { STATIONS, midi, playlist, splitArtist, steps } from "@/lib/radio";
import { fmtTime, isSoundCloud, parseTime } from "@/content/music";

test("note names map to midi", () => {
  expect(midi("A4")).toBe(69);
  expect(midi("C#5")).toBe(73);
  expect(midi("Bb2")).toBe(46);
  expect(midi("x")).toBeNull();
});

test("compact and spaced step notation", () => {
  expect(steps("r..G2.")).toEqual(["r", ".", ".", "G2", "."]);
  expect(steps("E5 . C#5")).toEqual(["E5", ".", "C#5"]);
});

test("every track parses: notes valid, drum bars 16 steps, bass bar-aligned", () => {
  for (const station of Object.values(STATIONS)) {
    for (const tr of station!.tracks) {
      for (const c of tr.chords) for (const n of c.split(" ")) expect(midi(n)).not.toBeNull();
      for (const p of Object.values(tr.drums)) expect(p!.length).toBe(16);
      const bass = steps(tr.bass);
      expect(bass.length % 16).toBe(0);
      for (const t of [...bass, ...(tr.lead ? steps(tr.lead) : [])]) expect(t === "." || t === "r" || t === "R" || midi(t) !== null).toBe(true);
    }
  }
});

test("a station with no real files plays its loops; every station theme has one", () => {
  for (const t of ["blade", "gtav", "gtavi", "fortnite"] as const) expect(playlist(t).length).toBeGreaterThan(0);
  // blade leads with its SoundCloud song (streamed, not hosted), then the loops; unprobed files are skipped
  expect(playlist("blade").map((e) => e.title).slice(0, 2)).toEqual(["Blade", "sprinkler system"]);
  expect(playlist("minecraft")[0]).toMatchObject({ title: "grass block" });
});

test("a link pasted after the artist is split off", () => {
  expect(splitArtist("M83 (https://www.youtube.com/watch?v=dX3k_QDnzHE)")).toEqual(["M83", "https://www.youtube.com/watch?v=dX3k_QDnzHE"]);
  expect(splitArtist("M83 https://youtu.be/x")).toEqual(["M83", "https://youtu.be/x"]);
  expect(splitArtist("Maroon 5 feat. Christina Aguilera")).toEqual(["Maroon 5 feat. Christina Aguilera"]);
  expect(splitArtist("x (javascript:alert(1))")).toEqual(["x (javascript:alert(1))"]);
});

test("only soundcloud.com track pages count as SoundCloud songs", () => {
  expect(isSoundCloud("https://soundcloud.com/m83/midnight-city")).toBe(true);
  expect(isSoundCloud("https://on.soundcloud.com/abc123")).toBe(true);
  expect(isSoundCloud("http://soundcloud.com/m83/midnight-city")).toBe(false);
  expect(isSoundCloud("https://soundcloud.com.evil.io/x")).toBe(false);
  expect(isSoundCloud("/music/gtav/x.mp3")).toBe(false);
});

test("start times read as seconds, m:ss or h:mm:ss", () => {
  expect(parseTime("83")).toBe(83);
  expect(parseTime("1:23")).toBe(83);
  expect(parseTime(" 1:02:03 ")).toBe(3723);
  expect(parseTime("1:75")).toBeUndefined();
  expect(parseTime("abc")).toBeUndefined();
  expect(fmtTime(83)).toBe("1:23");
  expect(fmtTime(3723)).toBe("1:02:03");
});
