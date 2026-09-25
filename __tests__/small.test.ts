import { inked } from "@/lib/dither";
import { projects } from "@/content/projects";

describe("dither", () => {
  const coverage = (level: number) => {
    let n = 0;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (inked(level, x, y)) n++;
    return n;
  };
  it("inks more of each 4x4 tile as the level rises", () => {
    expect([0, 1, 2, 3, 4].map(coverage)).toEqual([0, 4, 8, 12, 16]);
  });
});

describe("project registry", () => {
  it("has unique slugs, known statuses and https repos", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of projects) {
      expect(["active", "building", "shipped"]).toContain(p.status);
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.repo).toMatch(/^https:\/\/github\.com\//);
      expect(p.summary.length).toBeLessThanOrEqual(40);
    }
  });
});
