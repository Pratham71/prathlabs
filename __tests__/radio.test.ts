import { STATIONS, midi, playlist, steps } from "@/lib/radio";

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
  expect(playlist("blade")[0]).toMatchObject({ title: "sprinkler system" });
});
