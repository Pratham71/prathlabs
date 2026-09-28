import { losSantos } from "@/components/scenes";

jest.mock("@/lib/audio", () => ({ scene: jest.fn() }));

// a canvas stand-in that keeps each frame's filled cells by colour
function fakeCtx() {
  const cells = new Map<string, Set<string>>();
  const ctx = {
    fillStyle: "",
    globalAlpha: 1,
    fillRect(x: number, y: number) {
      if (!cells.has(ctx.fillStyle)) cells.set(ctx.fillStyle, new Set());
      cells.get(ctx.fillStyle)!.add(`${Math.round(x)},${Math.round(y)}`);
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    fill() {},
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, cells };
}
const pick = (cells: Map<string, Set<string>>, cols: string[]) => new Set(cols.flatMap((c) => [...(cells.get(c) ?? [])]));

test("a lifting deluxo never flies into the chasing helicopter", () => {
  // rolls, in order: kind (deluxo), direction (left), cruisers, heli (yes), colour
  const rolls = [0.9, 0.9, 0.1, 0.1, 0];
  const random = jest.spyOn(Math, "random").mockImplementation(() => rolls.shift() ?? 0.5);
  const scene = losSantos();
  const [w, h] = [240, 133];
  scene.reset(0);
  let lifted = 0;
  for (let t = 0; t < 13; t += 1 / 30) {
    const { ctx, cells } = fakeCtx();
    scene.frame(ctx, w, h, t, 1 / 30);
    const heli = pick(cells, ["#eef1f4", "#9aa3ad", "#5a616b"]);
    const car = pick(cells, ["#e4e8ec", "#aeb4ba", "#6b7178"]);
    for (const c of car) expect(heli.has(c)).toBe(false);
    if (heli.size && car.size) lifted = Math.max(lifted, h - 30 - Math.min(...[...car].map((c) => +c.split(",")[1])));
  }
  random.mockRestore();
  expect(lifted).toBeGreaterThan(30); // it did take off, with the heli overhead
});
