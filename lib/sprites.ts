import type { Theme } from "@/lib/theme";

// Pixel-art cursors for the station themes: drawn at 16x16 with smoothing off, shown at 2x.
// Original drawings in each theme's spirit: red pill, netrunner arrow, spider emblem, diamond sword,
// GTA aim reticle, neon arrow, build pencil, silver blade.
type Sprite = { url: string; hx: number; hy: number }; // hotspot in shown (2x) pixels

const line = (c: CanvasRenderingContext2D, pts: [number, number][], w: number, col: string) => {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = "square";
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
};

const poly = (c: CanvasRenderingContext2D, pts: [number, number][], fill: string, stroke?: string, dx = 0) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x + dx, y + dx) : c.moveTo(x + dx, y + dx)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
};
const ARROW: [number, number][] = [[1, 1], [1, 13], [4, 10], [7, 15], [9, 14], [6, 9], [11, 9]];

const DRAW: Partial<Record<Theme, { hot: [number, number]; draw: (c: CanvasRenderingContext2D) => void }>> = {
  matrix: {
    hot: [2, 13],
    draw(c) {
      c.lineCap = "round";
      line(c, [[4, 11], [11, 4]], 6, "#1a0406"); // outline
      c.lineCap = "round";
      c.strokeStyle = "#e3121b";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(4, 11);
      c.lineTo(11, 4);
      c.stroke();
      line(c, [[6, 7], [8, 5]], 1, "#ffb3b8"); // shine
    },
  },
  cyberpunk: {
    hot: [1, 1],
    draw(c) {
      poly(c, ARROW, "#00f0ff", undefined, 1); // cyan misregistration
      poly(c, ARROW, "#fcee0a", "#0a0a12");
    },
  },
  spiderman: {
    hot: [8, 8],
    draw(c) {
      // long-legged chest emblem on a red disc, like the Amazing suit's
      c.fillStyle = "#e0243a";
      c.beginPath();
      c.arc(8, 8, 7.5, 0, Math.PI * 2);
      c.fill();
      for (const s of [-1, 1])
        for (const [a, b] of [[[8, 7], [3, 1]], [[8, 8], [1, 7]], [[8, 9], [2, 13]], [[8, 10], [5, 15]]] as [number, number][][])
          line(c, [a, [8 + (b[0] - 8) * s, b[1]]], 1, "#0b0b12");
      c.fillStyle = "#0b0b12";
      c.fillRect(7, 5, 2, 7);
      c.fillRect(6.5, 7, 3, 3);
    },
  },
  minecraft: {
    hot: [1, 1],
    draw(c) {
      line(c, [[1, 1], [10, 10]], 4, "#123034"); // outline
      line(c, [[2, 2], [9, 9]], 2, "#5de0e6"); // diamond
      line(c, [[3, 2], [9, 8]], 1, "#b9fbff"); // edge light
      line(c, [[7, 12], [12, 7]], 2, "#3a2a1a"); // guard
      line(c, [[11, 11], [14, 14]], 2, "#6b4a2b"); // handle
    },
  },
  gtav: {
    hot: [8, 8],
    draw(c) {
      for (const [a, b] of [[[8, 1], [8, 4]], [[8, 12], [8, 15]], [[1, 8], [4, 8]], [[12, 8], [15, 8]]] as [number, number][][]) {
        line(c, [a, b], 3, "#000");
        line(c, [a, b], 1, "#fff");
      }
      c.fillStyle = "#000";
      c.fillRect(6.5, 6.5, 3, 3);
      c.fillStyle = "#fff";
      c.fillRect(7.5, 7.5, 1, 1);
    },
  },
  gtavi: {
    hot: [1, 1],
    draw(c) {
      c.beginPath();
      [[1, 1], [1, 13], [4, 10], [7, 15], [9, 14], [6, 9], [11, 9]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fillStyle = "#fff0fa";
      c.fill();
      c.strokeStyle = "#ff4fa3";
      c.lineWidth = 1;
      c.stroke();
    },
  },
  fortnite: {
    hot: [1, 14], // the graphite tip
    draw(c) {
      line(c, [[3, 12], [12, 3]], 4, "#1c2233"); // outline
      line(c, [[4, 11], [11, 4]], 2, "#ffe03a"); // body
      line(c, [[11, 4], [12, 3]], 2, "#b8c4d6"); // ferrule
      line(c, [[12, 3], [14, 1]], 3, "#1c2233");
      line(c, [[12, 3], [13, 2]], 2, "#ff7aa8"); // eraser
      c.fillStyle = "#f2c89b"; // sharpened wood
      c.fillRect(2, 12, 2, 2);
      c.fillStyle = "#1c2233";
      c.fillRect(1, 14, 1, 1); // graphite
    },
  },
  blade: {
    hot: [1, 1],
    draw(c) {
      line(c, [[1, 1], [10, 10]], 3, "#1a1a1d");
      line(c, [[1, 1], [10, 10]], 1, "#e9eaee"); // edge
      line(c, [[8, 12], [12, 8]], 2, "#e3121b"); // guard
      line(c, [[11, 11], [14, 14]], 2, "#2a2a2e"); // grip
    },
  },
};

const cache = new Map<Theme, Sprite>();

export function cursorSprite(theme: Theme): Sprite | null {
  const spec = DRAW[theme];
  if (!spec) return null;
  const hit = cache.get(theme);
  if (hit) return hit;
  const small = document.createElement("canvas");
  small.width = small.height = 16;
  const c = small.getContext("2d");
  if (!c) return null;
  spec.draw(c);
  const big = document.createElement("canvas");
  big.width = big.height = 32;
  const b = big.getContext("2d")!;
  b.imageSmoothingEnabled = false;
  b.drawImage(small, 0, 0, 32, 32);
  const s = { url: big.toDataURL(), hx: spec.hot[0] * 2, hy: spec.hot[1] * 2 };
  cache.set(theme, s);
  return s;
}
