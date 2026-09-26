"use client";

import { useEffect, useRef } from "react";
import { currentTheme, onThemeChange } from "@/lib/theme";
import { palm } from "@/components/GameIntro";

// Behind-the-page scenery for the station themes, drawn in 3px cells like the intros:
// blade: a blood moon and bats breaking out of the dark at random; vice city: palms and a striped sun
// low on the horizon; los santos: the skyline with premiere searchlights sweeping over it.
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
        // skyline along the bottom with a few lit windows
        for (let x = 0; x < w; ) {
          const bw = 4 + Math.floor(hash(x, 1) * 9);
          const bh = Math.floor(h * (0.05 + hash(x, 2) * 0.16 * (0.6 + 0.4 * Math.sin((x / w) * Math.PI))));
          l.fillStyle = "#0d1410";
          l.fillRect(x, h - bh, bw - 1, bh);
          for (let yy = h - bh + 2; yy < h - 1; yy += 3)
            for (let xx = x + 1; xx < x + bw - 2; xx += 2)
              if (hash(xx, yy) > 0.86) {
                l.fillStyle = hash(yy, xx) > 0.5 ? "#f2c94c" : "#eef3ee";
                l.fillRect(xx, yy, 1, 1);
              }
          x += bw;
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
      const moving = !reduce && (theme === "gtav" || theme === "blade");
      raf = moving && !document.hidden ? requestAnimationFrame(frame) : 0;
    };

    const restart = () => {
      theme = currentTheme();
      cancelAnimationFrame(raf);
      raf = 0;
      bats = [];
      canvas.dataset.theme = theme;
      if (!["gtav", "gtavi", "blade"].includes(theme)) {
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
