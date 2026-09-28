"use client";

import { useEffect, useRef } from "react";
import { isGame } from "@/lib/theme";
import { introSwing } from "@/components/spidey";

// Game-theme boot scenes, drawn as ordered dither (4x4 Bayer) at 4px cells over a small palette:
// los santos loading screen (sunset over the hills and skyline), vice city (striped sun over the ocean),
// battle bus (the bus crossing a cloudy sky over the island), blade (a blood rave: strobes, crowd,
// the sprinklers, then one silver slash), matrix (digital rain), night city (neon towers in the rain,
// an AV overhead, glitching), spider-man (Manhattan at night, a swing across it: a random suit chasing or fighting its villain), minecraft (block
// terrain, trees, drifting clouds). Original art, drawn procedurally.

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
  matrix: {
    palette: ["#010302", "#03140a", "#063d1b", "#0b6b2e", "#16a347", "#22ff66", "#b8ffcc", "#effff3"],
    at(x, y, t) {
      const c = Math.floor(x * 120);
      const speed = 0.35 + hash(c, 1) * 0.6;
      const len = 0.2 + hash(c, 2) * 0.45;
      const head = ((t * speed + hash(c, 3) * 3) % 1.5) - 0.25;
      const d = head - y;
      if (d < 0 || d > len) return 0.3;
      if (hash(c, Math.floor(y * 140)) < 0.35) return 0.6; // broken strokes read as glyphs
      if (d < 0.012) return 7;
      return 5.6 - (d / len) * 5;
    },
  },
  cyberpunk: {
    palette: ["#05050a", "#0d0d1c", "#1a1733", "#2c2350", "#00a3b0", "#00f0ff", "#fcee0a", "#ff2a6d"],
    at(x, y, t, a) {
      const band = Math.floor(y * 24);
      if (Math.sin(t * 23 + band * 1.7) > 0.985) x += 0.04 * Math.sin(band); // glitch: a band slips sideways
      const r = x * a * 70 + y * 22 - t * 11;
      if (((r % 1) + 1) % 1 < 0.035 && hash(Math.floor(r), 1) > 0.5) return 3.4; // rain
      const bx = Math.floor(x * 26 + 0.5);
      const top = 0.18 + hash(bx, 1) * 0.5;
      if (y > top) {
        const inX = x * 26 + 0.5 - bx;
        if (hash(bx, 5) > 0.55 && y > top + 0.04 && y < top + 0.1 && inX > 0.2 && inX < 0.8)
          return Math.sin(t * 6 + bx) > -0.6 ? [5, 6, 7][Math.floor(hash(bx, 6) * 3)] : 2; // neon, flickering
        if (inX < 0.06 || inX > 0.94) return 0;
        return hash(bx * 8 + Math.floor(inX * 8), Math.floor(y * 90)) > 0.95 ? 4 : 1.2;
      }
      return Math.min(3, 0.5 + 2.2 * y);
    },
    sprite(c, w, h, t) {
      // an AV crossing high over the towers, running lights on
      const x = Math.round(w + 30 - ((t * 0.18) % 1.4) * (w + 60));
      const y = Math.round(h * 0.12);
      c.fillStyle = "#1a1733";
      c.fillRect(x, y, 14, 3);
      c.fillRect(x + 3, y - 2, 7, 2);
      c.fillStyle = "#00f0ff";
      c.fillRect(x + 1, y + 3, 12, 1);
      c.fillStyle = "#ff2a6d";
      c.fillRect(x + 13, y + 1, 1, 1);
      c.fillStyle = "#fcee0a";
      c.fillRect(x, y + 1, 1, 1);
    },
  },
  spiderman: {
    palette: ["#040711", "#0a1226", "#14224a", "#1f3570", "#3a5fb0", "#e0243a", "#ffd98a", "#dfe6f5"],
    at(x, y, t, a) {
      const md = Math.hypot((x - 0.8) * a, y - 0.2);
      if (md < 0.06) return 7;
      const bx = Math.floor(x * 18 + t * 0.15);
      const tall = hash(bx, 4) > 0.85;
      const top = tall ? 0.22 + hash(bx, 1) * 0.1 : 0.4 + hash(bx, 1) * 0.35;
      const inX = x * 18 + t * 0.15 - bx;
      if (tall && y < top && y > top - 0.12 && Math.abs(inX - 0.5) < 0.08 * (1 - (top - y) / 0.12) + 0.02) return 0.4; // spire
      if (y > top) {
        if (inX < 0.05 || inX > 0.95) return 0;
        return hash(bx * 9 + Math.floor(inX * 9), Math.floor(y * 80)) > 0.88 ? 6 : 0.6;
      }
      return Math.min(4, 1 + 2.3 * y + 1.2 * Math.exp(-(md - 0.06) * 14));
    },
    sprite: introSwing,
  },
  minecraft: {
    palette: ["#0e0c0a", "#3b2a1a", "#5a3d24", "#79553a", "#6d6d6d", "#8e8e8e", "#3f7d2b", "#5fa83c", "#8fd15a", "#7fb3e6", "#a9cff5", "#ffffff"],
    at(x, y, t, a) {
      const X = (x * a + t * 0.03) * 22;
      const bx = Math.floor(X), by = Math.floor(y * 22);
      const tex = hash(Math.floor(X * 8), Math.floor(y * 22 * 8));
      const ground = (b: number) => 12 + Math.floor(noise(b * 0.12, 1) * 6);
      const surface = ground(bx);
      if (by < surface) {
        for (const k of [-1, 0, 1]) {
          const tb = bx + k;
          if (hash(tb, 7) < 0.9) continue;
          const s = ground(tb);
          if (k === 0 && by >= s - 4) return 2 + tex; // trunk
          if (by >= s - 7 && by <= s - 4 && (k !== 0 || by < s - 4)) return 6 + tex * 1.5; // leaves
        }
        const cb = Math.floor((x * a + t * 0.08) * 22);
        if ((by === 2 || by === 3) && noise(cb * 0.25, 5) > 0.62) return 11;
        return Math.min(10, 9.2 + y * 1.2);
      }
      const fy = Math.floor((y * 22 - by) * 8);
      if (by === surface) return fy < 3 ? 7 + tex : 2 + tex;
      if (by <= surface + 3) return 1 + tex * 2;
      return 4 + tex;
    },
  },
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
