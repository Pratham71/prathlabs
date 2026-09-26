"use client";

import { useEffect, useRef } from "react";
import { currentTheme, isGame, onThemeChange } from "@/lib/theme";
import { palm } from "@/components/GameIntro";

// Behind-the-page scenery for the station themes, drawn in 3px cells like the intros:
// blade: a blood moon and bats breaking out of the dark at random; vice city: palms and a striped sun
// low on the horizon; los santos: the skyline with premiere searchlights sweeping over it; matrix: faint
// rain; night city: neon skyline in the rain; spider-man: Manhattan and a web in the corner; minecraft:
// block hills and drifting clouds.
// Static layers render once per resize; only bats and beams animate. Paused offscreen and in
// background tabs; with reduced motion, a single still frame.

const CELL = 3;
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const BAT = [
  ["k.......k", "kk.....kk", ".kkkrkkk.", "...kkk..."],
  ["...k.k...", ".kkkrkkk.", "kk.kkk.kk", "k.......k"],
];
type Bat = { x: number; y: number; vx: number; phase: number; amp: number; scale: number };

export function ThemeScenery() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("canvas");
    let theme = currentTheme();
    let w = 0, h = 0, raf = 0, last = 0, nextBat = 0;
    let bats: Bat[] = [];
    let rain: { x: number; y: number; v: number; len: number }[] = [];

    // skyline helper: towers along the bottom, lit windows in `lit`, neon strips in `neon`
    const skyline = (l: CanvasRenderingContext2D, body: string, lit: string[], neon: string[], maxH: number) => {
      for (let x = 0; x < w; ) {
        const bw = 4 + Math.floor(hash(x, 1) * 9);
        const bh = Math.floor(h * (0.05 + hash(x, 2) * maxH));
        l.fillStyle = body;
        l.fillRect(x, h - bh, bw - 1, bh);
        if (neon.length && hash(x, 9) > 0.7) {
          l.fillStyle = neon[Math.floor(hash(x, 8) * neon.length)];
          l.fillRect(x + 1, h - bh + 2, Math.max(1, bw - 3), 1);
        }
        for (let yy = h - bh + 4; yy < h - 1; yy += 3)
          for (let xx = x + 1; xx < x + bw - 2; xx += 2)
            if (hash(xx, yy) > 0.86) {
              l.fillStyle = lit[Math.floor(hash(yy, xx) * lit.length)];
              l.fillRect(xx, yy, 1, 1);
            }
        x += bw;
      }
    };

    const paintStatic = () => {
      w = Math.ceil(innerWidth / CELL);
      h = Math.ceil(innerHeight / CELL);
      canvas.width = layer.width = w;
      canvas.height = layer.height = h;
      const l = layer.getContext("2d")!;
      l.clearRect(0, 0, w, h);
      const a = w / h;
      if (theme === "gtavi") {
        // striped sun sinking on the right, palms at both edges
        const sx = w * 0.84, sy = h * 0.9, r = h * 0.16;
        for (let y = Math.floor(sy - r); y < h; y++)
          for (let x = Math.floor(sx - r); x < sx + r; x++) {
            const d = Math.hypot(x - sx, y - sy);
            if (d > r) continue;
            const k = (y - (sy - r)) / (2 * r);
            if (k > 0.45 && ((y - sy) / r * 10 + 20) % 1 < (k - 0.45) * 1.2) continue;
            l.fillStyle = k < 0.35 ? "#ffd36e" : k < 0.55 ? "#ff8a5c" : "#ff4f9a";
            l.fillRect(x, y, 1, 1);
          }
        l.fillStyle = "#07030d";
        for (let y = Math.floor(h * 0.3); y < h; y++)
          for (let x = 0; x < w; x++) {
            if (x > w * 0.22 && x < w * 0.7) continue; // keep the reading column clear
            const X = (x / w) * a, Y = y / h;
            if (palm(X, Y, 0.05 * a, 1.02, 0.42, 0.05, 1.4) || palm(X, Y, 0.16 * a, 1.02, 0.6, -0.03, 0.9) || palm(X, Y, 0.95 * a, 1.02, 0.5, -0.06, 1.2))
              l.fillRect(x, y, 1, 1);
          }
      } else if (theme === "gtav") {
        skyline(l, "#0d1410", ["#f2c94c", "#eef3ee"], [], 0.14);
      } else if (theme === "cyberpunk") {
        skyline(l, "#101020", ["#00f0ff", "#fcee0a", "#3a3560"], ["#00f0ff", "#fcee0a", "#ff2a6d"], 0.3);
      } else if (theme === "spiderman") {
        skyline(l, "#0b1224", ["#ffd98a", "#7f8fb5"], [], 0.26);
        // a web strung across the top-left corner
        l.fillStyle = "rgba(223,230,245,0.35)";
        const R = Math.min(w, h) * 0.32;
        for (let k = 0; k < 7; k++) {
          const ang = (k / 6) * (Math.PI / 2);
          for (let r = 0; r < R; r++) l.fillRect(Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r), 1, 1);
        }
        for (let ring = 1; ring <= 5; ring++) {
          const rr = (R * ring) / 5.5;
          for (let k = 0; k < 6; k++) {
            const a0 = (k / 6) * (Math.PI / 2), a1 = ((k + 1) / 6) * (Math.PI / 2);
            for (let q = 0; q <= 20; q++) {
              const u = q / 20;
              const sag = Math.sin(u * Math.PI) * rr * 0.08; // strands sag toward the corner
              const px = Math.cos(a0) * rr * (1 - u) + Math.cos(a1) * rr * u;
              const py = Math.sin(a0) * rr * (1 - u) + Math.sin(a1) * rr * u;
              const len = Math.hypot(px, py) || 1;
              l.fillRect(Math.round(px - (px / len) * sag), Math.round(py - (py / len) * sag), 1, 1);
            }
          }
        }
      } else if (theme === "minecraft") {
        // block hills along the bottom: grass tops, dirt below
        const B = 6;
        for (let bx = 0; bx * B < w; bx++) {
          const tall = 2 + Math.floor((Math.sin(bx * 0.35) * 0.5 + 0.5) * 3 + hash(bx, 3) * 2);
          for (let k = 0; k < tall; k++) {
            const y0 = h - (k + 1) * B;
            for (let yy = 0; yy < B; yy++)
              for (let xx = 0; xx < B; xx++) {
                const top = k === tall - 1 && yy < 2;
                const v = hash(bx * B + xx, y0 + yy);
                l.fillStyle = top ? (v > 0.5 ? "#5fa83c" : "#3f7d2b") : v > 0.6 ? "#79553a" : v > 0.25 ? "#5a3d24" : "#3b2a1a";
                l.fillRect(bx * B + xx, y0 + yy, 1, 1);
              }
          }
        }
      } else if (theme === "blade") {
        // blood moon, top right, with a dithered halo
        const mx = w * 0.86, my = h * 0.16, r = h * 0.08;
        for (let y = Math.floor(my - r * 3); y < my + r * 3; y++)
          for (let x = Math.floor(mx - r * 3); x < mx + r * 3; x++) {
            const d = Math.hypot(x - mx, y - my) / r;
            if (d < 1) l.fillStyle = hash(x, y) > 0.2 + d * 0.4 ? "#7a0f16" : "#4a0a0f";
            else if (d < 3 && hash(x, y) < 0.18 * (3 - d) / 2) l.fillStyle = "#2a070c";
            else continue;
            l.fillRect(x, y, 1, 1);
          }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(layer, 0, 0);
      if (theme === "gtav") {
        // two searchlights sweeping from the skyline
        for (const [bx, ph] of [[0.28, 0], [0.74, 2.2]]) {
          const ang = Math.sin(t * 0.35 + ph) * 0.5;
          const ox = w * bx, oy = h * 0.9, len = h * 1.1, spread = 0.035;
          ctx.fillStyle = "rgba(238,243,238,0.07)";
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + Math.sin(ang - spread) * len, oy - Math.cos(ang - spread) * len);
          ctx.lineTo(ox + Math.sin(ang + spread) * len, oy - Math.cos(ang + spread) * len);
          ctx.fill();
        }
      } else if (theme === "matrix" && !reduce) {
        if (!rain.length) rain = Array.from({ length: Math.floor(w / 6) }, (_, i) => ({ x: i * 6 + Math.floor(Math.random() * 4), y: Math.random() * h, v: 12 + Math.random() * 30, len: 10 + Math.random() * 30 }));
        for (const d of rain) {
          d.y += d.v * dt;
          if (d.y - d.len > h) d.y = -Math.random() * h * 0.5;
          for (let k = 0; k < d.len; k += 2) {
            ctx.fillStyle = k === 0 ? "rgba(184,255,204,0.55)" : `rgba(34,255,102,${0.28 * (1 - k / d.len)})`;
            ctx.fillRect(d.x, Math.round(d.y - k), 1, 1);
          }
        }
      } else if (theme === "cyberpunk" && !reduce) {
        ctx.fillStyle = "rgba(140,148,179,0.25)";
        for (let i = 0; i < 70; i++) {
          const x = (hash(i, 1) * w + t * 40) % w;
          const y = (hash(i, 2) * h + t * (120 + hash(i, 3) * 80)) % h;
          ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
        }
      } else if (theme === "minecraft" && !reduce) {
        // flat blocky clouds drifting right
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        for (let i = 0; i < 5; i++) {
          const cw = 18 + Math.floor(hash(i, 4) * 26);
          const x = ((hash(i, 5) * w + t * 3 * (1 + i * 0.2)) % (w + cw)) - cw;
          const y = Math.floor(h * (0.05 + hash(i, 6) * 0.2));
          ctx.fillRect(Math.round(x), y, cw, 5);
          ctx.fillRect(Math.round(x) + 4, y - 3, cw - 10, 3);
        }
      } else if (theme === "blade" && !reduce) {
        if (t > nextBat) {
          // a lone bat, sometimes a small colony
          const n = Math.random() < 0.3 ? 3 + Math.floor(Math.random() * 3) : 1;
          const fromLeft = Math.random() < 0.5;
          const y0 = h * (0.08 + Math.random() * 0.5);
          for (let i = 0; i < n; i++)
            bats.push({
              x: fromLeft ? -12 - i * 8 : w + 12 + i * 8,
              y: y0 + (Math.random() - 0.5) * 20,
              vx: (fromLeft ? 1 : -1) * (35 + Math.random() * 35),
              phase: Math.random() * 6,
              amp: 3 + Math.random() * 6,
              scale: Math.random() < 0.25 ? 2 : 1,
            });
          nextBat = t + 1.2 + Math.random() * 3.5;
        }
        bats = bats.filter((b) => b.x > -40 && b.x < w + 40);
        for (const b of bats) {
          b.x += b.vx * dt;
          const y = b.y + Math.sin(t * 3 + b.phase) * b.amp;
          const sprite = BAT[Math.floor(t * 9 + b.phase) % 2];
          sprite.forEach((row, dy) =>
            [...row].forEach((ch, dx) => {
              if (ch === ".") return;
              ctx.fillStyle = ch === "r" ? "#e3121b" : "#3a1a1e";
              ctx.fillRect(Math.round(b.x) + dx * b.scale, Math.round(y) + dy * b.scale, b.scale, b.scale);
            }),
          );
        }
      }
      const moving = !reduce && ["gtav", "blade", "matrix", "cyberpunk", "minecraft"].includes(theme);
      raf = moving && !document.hidden ? requestAnimationFrame(frame) : 0;
    };

    const restart = () => {
      theme = currentTheme();
      cancelAnimationFrame(raf);
      raf = 0;
      bats = [];
      rain = [];
      canvas.dataset.theme = theme;
      if (!isGame(theme)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      paintStatic();
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    restart();
    const onResize = () => restart();
    const onVis = () => !document.hidden && !raf && restart();
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    const off = onThemeChange(restart);
    return () => {
      off();
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="scenery" aria-hidden="true" />;
}
