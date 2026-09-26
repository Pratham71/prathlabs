import { timeIn } from "@/components/WorldClock";

test("reads wall time in each zone (Dubai UTC+4, Delhi UTC+5:30, no DST)", () => {
  const d = new Date("2026-09-26T10:05:09Z");
  expect(timeIn("Asia/Dubai", d)).toEqual({ hh: "14", mm: "05", ss: 9, date: "sat 26 sep" });
  expect(timeIn("Asia/Kolkata", d)).toMatchObject({ hh: "15", mm: "35" });
  expect(timeIn("Asia/Kolkata", new Date("2026-09-26T18:31:00Z"))).toMatchObject({ hh: "00", mm: "01", date: "sun 27 sep" });
});
