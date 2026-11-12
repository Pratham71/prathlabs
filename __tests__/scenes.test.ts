import { FOAM, losSantos, viceCity } from "@/components/scenes";

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

// vice city at phone (390px) and desktop (1400px) sizes, in half-resolution cells
const SIZES = [[65, 141], [234, 150]];
function crossing(rolls: number[], w: number, h: number, check: (cells: Map<string, Set<string>>) => void) {
  const queue = [...rolls];
  const random = jest.spyOn(Math, "random").mockImplementation(() => queue.shift() ?? 0.5);
  const scene = viceCity();
  scene.reset(0);
  let seen = 0;
  for (let t = 5.01; t < 40; t += 1 / 30) {
    const { ctx, cells } = fakeCtx();
    scene.frame(ctx, w, h, t, 1 / 30);
    if (!cells.size) {
      if (seen) break; // one crossing: the next event is someone else's
      continue;
    }
    seen++;
    const ys = [...cells.values()].flatMap((set) => [...set].map((c) => +c.split(",")[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThan(h);
    check(cells);
  }
  random.mockRestore();
  expect(seen).toBeGreaterThan(30);
}

test("a flamingo V never stacks two birds on the same cells", () => {
  const pink = ["#ff4f9a", "#ff7eb6", "#ff9cc8", "#fdeefe", "#b89ac8"];
  // rolls: pair (birds), flamingos, leftward, six birds, height
  for (const [w, h] of SIZES) crossing([0.3, 0.1, 0.9, 0.99, 0], w, h, (cells) => expect(pick(cells, pink).size).toBe(6 * 16));
});

test("a speedboat's wake trails behind it, never through the hull", () => {
  const hull = ["#d69a72", "#2a1a3d", "#3fe0d0", "#cfe3f2", "#e9e2f0", "#ff5fae"];
  for (const [w, h] of SIZES)
    for (const dir of [0.1, 0.9])
      crossing([0, 0.1, dir], w, h, (cells) => {
        const boat = pick(cells, hull), foam = pick(cells, FOAM);
        expect(boat.size).toBeGreaterThan(0);
        for (const c of foam) expect(boat.has(c)).toBe(false);
      });
});
