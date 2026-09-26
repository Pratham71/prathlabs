import { readFileSync } from "node:fs";
import { join } from "node:path";
import { THEMES } from "@/lib/theme";

// Each intro block (.gi-<theme>) is hidden by `.gi { display: none }` and shown only under its theme.
// A bare `.gi-<theme> { display: ... }` rule wins over that and leaks the block into every intro.
test("intro blocks are only displayed under their own theme", () => {
  const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
  const leaks = THEMES.filter((t) => new RegExp(`^\\.gi-${t} \\{[^}]*\\bdisplay:\\s*(?!none)`, "m").test(css));
  expect(leaks).toEqual([]);
});
