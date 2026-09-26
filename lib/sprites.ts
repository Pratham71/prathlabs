import type { Theme } from "@/lib/theme";

// Pixel-art cursors for the station themes: drawn at 16x16 with smoothing off, shown at 2x.
// Original drawings in each theme's spirit (GTA aim reticle, neon arrow, pickaxe, silver blade).
type Sprite = { url: string; hx: number; hy: number }; // hotspot in shown (2x) pixels

const line = (c: CanvasRenderingContext2D, pts: [number, number][], w: number, col: string) => {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = "square";
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
};

const DRAW: Partial<Record<Theme, { hot: [number, number]; draw: (c: CanvasRenderingContext2D) => void }>> = {
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
    hot: [1, 3],
    draw(c) {
      line(c, [[4, 4], [14, 14]], 2, "#8a5a2b"); // handle
      line(c, [[12, 12], [14, 14]], 2, "#4a2e14"); // grip
      c.lineCap = "round";
      c.strokeStyle = "#1c2233";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(1, 9);
      c.quadraticCurveTo(1, 1, 9, 1);
      c.stroke();
      c.strokeStyle = "#b8c4d6";
      c.lineWidth = 2;
      c.stroke();
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
