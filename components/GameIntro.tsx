"use client";

import { useEffect, useRef } from "react";
import { isGame } from "@/lib/theme";

// Game-theme boot scenes, drawn as ordered dither (4x4 Bayer) at 4px cells over a small palette:
// los santos loading screen (sunset over the hills and skyline), vice city (striped sun over the ocean),
// battle bus (the bus crossing a cloudy sky over the island), blade (a blood rave: strobes, crowd,
// the sprinklers, then one silver slash). Original art, drawn procedurally.

const CELL = 4;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
const fbm = (x: number, y: number) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1;

// Palm silhouette: curved trunk + drooping fronds. Returns true if (x, y) (aspect-corrected x) is inside.
export function palm(x: number, y: number, px: number, base: number, top: number, lean: number, s: number) {
  if (y > base || y < top - 0.12 * s) return false;
  const k = (base - y) / (base - top);
  if (y >= top && Math.abs(x - (px + lean * k * k)) < 0.007 * s * (1.3 - k * 0.5)) return true;
  const cx = px + lean, cy = top;
  const dx = x - cx, dy = y - cy;
  if (dx * dx + dy * dy > 0.03 * s * s) return false;
  for (let f = 0; f < 7; f++) {
    const ang = -Math.PI + (f / 6) * Math.PI + (f % 2) * 0.2;
    for (let q = 1; q <= 8; q++) {
      const u = q / 8;
      const fx = cx + Math.cos(ang) * u * 0.15 * s;
      const fy = cy + Math.sin(ang) * u * 0.1 * s + u * u * 0.08 * s;
      if (Math.abs(x - fx) < 0.012 * s * (1 - u * 0.7) && Math.abs(y - fy) < 0.008 * s) return true;
    }
  }
  return false;
}

type Scene = { palette: string[]; at: (x: number, y: number, t: number, a: number) => number; sprite?: (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void };

// v is a palette position; the dither picks floor or ceil per cell.
const SCENES: Record<string, Scene> = {
  blade: {
    palette: ["#050203", "#12060a", "#2a070c", "#5c0b12", "#a3101a", "#e3121b", "#ff5a5a", "#d9dbe0"],
    at(x, y, t, a) {
      // the slash: one diagonal cut, drawn fast at ~3s, then it stays
      const cut = Math.abs(y - (0.9 - 0.75 * x));
      if (x < clamp((t - 3) / 0.22) && cut < 0.022) return cut < 0.004 ? 7 : 5.6;
      // crowd, bouncing to the beat
      const crowd = 0.8 + 0.05 * Math.abs(Math.sin(x * a * 26)) + 0.03 * noise(x * 40, 0) - 0.012 * Math.abs(Math.sin(t * 7.2 + Math.floor(x * a * 12)));
      if (y > crowd) return 0;
      let v = 0.4 + 0.7 * (1 - y);
      // strobing red beams sweeping from the rig
      for (let k = 0; k < 3; k++) {
        const x0 = 0.2 + k * 0.3;
        const ang = Math.atan2(x * a - x0 * a, y + 0.05) - Math.sin(t * 1.3 + k * 2.1) * 0.4;
        const on = Math.sin(t * 18 + k * 1.7) > -0.3 ? 1 : 0.25;
        if (Math.abs(ang) < 0.07) v += 2.6 * on * (1 - y * 0.6);
      }
      // the sprinklers open at ~1.5s: red streaks falling
      if (t > 1.5) {
        const col = Math.floor(x * 150);
        const speed = 0.9 + hash(col, 7) * 0.8;
        const py = (((hash(col, 3) * 7 + (t - 1.5) * speed) % 1.2) + 1.2) % 1.2 - 0.1;
        if (Math.abs(y - py) < 0.035 && (x * 150) % 1 < 0.4 && hash(col, 9) > 0.35) return 5 - (py - y) * 20;
      }
      return Math.min(4.5, v);
    },
  },
  gtav: {
    palette: ["#07060c", "#1d1030", "#4a1f45", "#9c3b4f", "#e8683f", "#ffb45a", "#ffe3a0"],
    at(x, y, t, a) {
      const pan = t * 0.012;
      const X = x * a;
      if (palm(X, y, 0.1 * a, 1.02, 0.42, 0.05, 1.3) || palm(X, y, 0.86 * a, 1.02, 0.5, -0.04, 1.05)) return 0;
      if (y > 0.93) return 0;
      // skyline: blocks with lit windows
      const bx = Math.floor((x + pan * 2.2) * 46);
      const top = 0.9 - hash(bx, 3) * 0.16 * smooth(0.15, 0.55, 1 - Math.abs(x - 0.45));
      if (y > top) return hash(Math.floor((x + pan * 2.2) * 400), Math.floor(y * 240)) > 0.93 ? 5 : 0.3;
      // hills (the far ones hazy)
      const h2 = 0.74 + 0.05 * Math.sin((x + pan) * 9) + 0.03 * noise((x + pan) * 12, 1);
      if (y > h2) return 1.1;
      const h1 = 0.68 + 0.04 * noise((x + pan * 0.5) * 5, 2);
      if (y > h1) return 2.3;
      // sky + sun
      const sx = 0.62 - pan * 0.3, sy = 0.6;
      const d = Math.hypot((x - sx) * a, y - sy);
      let v = 1 + 4.7 * Math.pow(clamp(y / 0.68), 1.5);
      if (d < 0.075) v = 6;
      else v += 1.3 * Math.exp(-(d - 0.075) * 9);
      return Math.min(6, v);
    },
  },
  gtavi: {
    palette: ["#12091c", "#2a0f3d", "#5b1a6b", "#a8287f", "#ff4f9a", "#ff8a5c", "#ffd36e", "#0b0f2e", "#1d2d66", "#ff6fb0"],
    at(x, y, t, a) {
      const X = x * a;
      if (palm(X, y, 0.07 * a, 1.02, 0.38, 0.06, 1.5) || palm(X, y, 0.95 * a, 1.02, 0.46, -0.07, 1.2) || palm(X, y, 0.84 * a, 1.02, 0.6, 0.03, 0.8)) return 0;
      const hz = 0.66;
      const sx = 0.5, sy = 0.5, r = 0.21;
      if (y > hz) {
        // ocean: dark swell with the sun's reflection broken into bands
        const reach = r * (1 - (y - hz) * 1.6);
        const band = (y * 90 + Math.sin(x * 50 + t * 2.4) * 0.6) % 1 < 0.5;
        if (Math.abs(x - sx) * a < reach && band) return 9;
        return 7 + 0.9 * noise(x * 30, y * 60 - t) * smooth(hz, 1, y);
      }
      const d = Math.hypot((x - sx) * a, y - sy);
      if (d < r) {
        const k = (y - (sy - r)) / (2 * r); // 0 top .. 1 bottom
        const ph = ((((y - sy) * 28 - t * 0.6) % 1) + 1) % 1;
        const gap = k > 0.5 && ph < (k - 0.5) * 0.9;
        if (!gap) return 6 - k * 2.2;
      }
      if (y < 0.3 && hash(Math.floor(x * 300), Math.floor(y * 200)) > 0.996) return 6;
      return Math.min(5, 0.6 + 4.2 * Math.pow(y / hz, 1.3) + 0.8 * Math.exp(-Math.abs(d - r) * 10));
    },
  },
  fortnite: {
    palette: ["#0a1440", "#16307e", "#2a5cc4", "#4d8fe8", "#8cc4ff", "#e8f4ff", "#ffffff", "#1b4d2a", "#2f8a3a", "#5fe36b"],
    at(x, y, t, a) {
      const hz = 0.74;
      if (y > hz) {
        // the island far below: grass over water
        const n = fbm(x * 5 * a + 3, (y - hz) * 14);
        if (n > 0.52) return 7 + clamp((n - 0.52) * 9, 0, 2);
        return 3.2 + (y - hz) * 2;
      }
      const c = fbm(x * 3.2 * a - t * 0.06, y * 7);
      if (c > 0.6) return 5 + clamp((c - 0.6) * 10, 0, 1);
      return 1.2 + 3.4 * Math.pow(y / hz, 1.2);
    },
    sprite(c, w, h, t) {
      const at = (tt: number) => ({ x: Math.round(-50 + (tt / 5.2) * (w + 100)), y: Math.round(h * 0.2 + Math.sin(tt * 1.6) * 2) });
      // players dropping out of the back: freefall, then the glider opens and they drift down
      for (let i = 0; i < JUMPERS; i++) {
        const t0 = 1.3 + i * 0.42;
        if (t < t0) continue;
        const dt = t - t0;
        const from = at(t0);
        const fall = dt < 0.55 ? 34 * dt * dt * 3 : 31 + (dt - 0.55) * 7;
        const x = from.x + 4 + (1 - Math.exp(-dt * 2)) * (6 + (i % 3) * 3) + Math.sin(dt * 2 + i) * (dt > 0.55 ? 2 : 0);
        const y = from.y + 8 + fall;
        if (y > h) continue;
        if (dt > 0.55) glider(c, Math.round(x), Math.round(y) - 6, GLIDERS[i % GLIDERS.length]);
        person(c, Math.round(x), Math.round(y), i);
      }
      const { x, y } = at(t);
      bus(c, x, y, t);
    },
  },
};

// ---- battle bus pieces (4px cells) ----
const JUMPERS = 8;
const GLIDERS = ["#ff4f9a", "#ffe03a", "#5fe36b", "#3d9bff", "#b65cf5", "#ff8a1f", "#ffffff", "#3fe0d0"];
const BUS = [
  "......kkkkkkkkkkkkkkkkkkkkkkkkkk.....",
  ".....kRRRRRRRRRRRRRRRRRRRRRRRRRRk....",
  "....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBk...",
  "...kBBwWWwWWwWWwWWwWWwWWwWWBBwWWWBk..",
  "...kBBwWWwWWwWWwWWwWWwWWwWWBBwWWWWBk.",
  "..GkBBwwwwwwwwwwwwwwwwwwwwwBBwwwwwBk.",
  "..GkYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYk.",
  "..GkBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBHBk",
  "...kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk",
  "....kkkTTTkkkkkkkkkkkkkkkkkkTTTkkkkk.",
  "......TTTTT...............TTTTT......",
  ".......TTT.................TTT.......",
];
const BUS_COL: Record<string, string> = {
  k: "#0a1440", R: "#e8f0ff", B: "#2f6fd8", b: "#1f4fa8", W: "#cfe8ff", w: "#16307e",
  Y: "#ffe03a", H: "#fff3a0", T: "#111827", G: "#9aa4b4",
};

function bus(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const px = (dx: number, dy: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x + dx, y + dy, 1, 1);
  };
  // balloon: striped envelope, a yellow band, ropes down to the roof
  const cx = 18, cy = -16, rx = 15, ry = 12;
  for (let dy = -ry; dy <= ry + 3; dy++) {
    const k = dy <= ry ? Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)) : 0;
    const half = dy <= ry * 0.6 ? Math.round(k * rx) : Math.round(k * rx * (1 - (dy - ry * 0.6) / (ry * 1.1)));
    for (let dx = -half; dx <= half; dx++) {
      const edge = Math.abs(dx) === half || dy === -ry;
      const band = dy >= ry * 0.45 && dy <= ry * 0.62;
      const stripe = Math.floor((dx + 32) / 4) % 2 === 0;
      px(cx + dx, cy + dy, edge ? "#0a1440" : band ? "#ffe03a" : stripe ? "#2a6be0" : "#5fa0ff");
    }
  }
  for (const [ax, bx] of [[9, 7], [27, 29]]) {
    for (let i = 0; i <= 6; i++) px(Math.round(ax + ((bx - ax) * i) / 6), cy + ry - 1 + i, "#0a1440");
  }
  BUS.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== "." && px(dx, dy, BUS_COL[ch])));
  // thrusters at the back, flickering
  const f = Math.floor(t * 20) % 2;
  for (const [dx, dy, col] of [[1, 5, "#ff8a1f"], [1, 7, "#ff8a1f"], [0, 6, "#ffd23a"], [0 - f, 5, "#ffd23a"], [0 - f, 7, "#ff8a1f"], [-1 - f, 6, "#ff8a1f"]] as [number, number, string][]) px(dx, dy, col);
}

function person(c: CanvasRenderingContext2D, x: number, y: number, i: number) {
  c.fillStyle = "#f1c27d";
  c.fillRect(x, y, 1, 1);
  c.fillStyle = ["#1d2d66", "#7a1f2b", "#2f5a2a", "#3a3a44"][i % 4];
  c.fillRect(x, y + 1, 1, 2);
  c.fillRect(x - 1, y + 1, 1, 1);
  c.fillRect(x + 1, y + 1, 1, 1);
}

// the default-style hang glider: a wide chevron wing with a keel, lines down to the rider
function glider(c: CanvasRenderingContext2D, x: number, y: number, col: string) {
  const wing: [number, number][] = [[0, 0], [-1, 1], [1, 1], [-2, 1], [2, 1], [-3, 2], [3, 2], [-4, 2], [4, 2], [-5, 3], [5, 3]];
  c.fillStyle = "#0a1440";
  for (const [dx, dy] of wing) c.fillRect(x + dx, y + dy + 1, 1, 1);
  c.fillStyle = col;
  for (const [dx, dy] of wing) c.fillRect(x + dx, y + dy, 1, 1);
  c.fillStyle = "rgba(10,20,64,0.8)";
  c.fillRect(x - 2, y + 3, 1, 2);
  c.fillRect(x + 2, y + 3, 1, 2);
}

export function GameIntro() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const scene = isGame(html.dataset.theme) ? SCENES[html.dataset.theme] : undefined;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!scene || !canvas || !ctx || html.dataset.boot !== "1") return;
    const pal = scene.palette.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    });
    const w = Math.ceil(innerWidth / CELL);
    const h = Math.ceil(innerHeight / CELL);
    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);
    const t0 = (window as { __bootT0?: number }).__bootT0 ?? performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const a = w / h;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const v = scene.at(x / w, y / h, t, a);
          const i = Math.floor(v);
          const k = Math.min(pal.length - 1, v - i > BAYER[(y & 3) * 4 + (x & 3)] ? i + 1 : i);
          const [r, g, b] = pal[Math.max(0, k)];
          const o = (y * w + x) * 4;
          img.data[o] = r;
          img.data[o + 1] = g;
          img.data[o + 2] = b;
          img.data[o + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
      scene.sprite?.(ctx, w, h, t);
      raf = html.dataset.boot ? requestAnimationFrame(frame) : 0;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="gi-scene" aria-hidden="true" />;
}
