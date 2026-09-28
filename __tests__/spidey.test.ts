import { stepSwing, swinger } from "@/components/spidey";

// the chase's pursuit, as webChase runs it: he should keep up without overtaking, and stay on screen
test("spider-man keeps a villain in reach, swinging, for the whole crossing", () => {
  const h = 133;
  for (const speed of [40, 48]) {
    let fx = -20;
    const p = swinger(fx - 40, h * 0.2, 55);
    let swings = 0, was = false;
    for (let t = 0; t < 12; t += 1 / 60) {
      fx += speed / 60;
      const behind = fx - p.x - 20;
      stepSwing(p, 1 / 60, 220, 1, Math.min(60, Math.max(8, behind * 0.5 + 12)), Math.min(120, Math.max(15, speed + behind * 0.8)), -12, h * 0.55);
      if (p.anchor && !was) swings++;
      was = !!p.anchor;
      if (t > 2) {
        expect(fx - p.x).toBeGreaterThan(5);
        expect(fx - p.x).toBeLessThan(60);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(h * 0.6);
      }
    }
    expect(swings).toBeGreaterThan(8);
  }
});
