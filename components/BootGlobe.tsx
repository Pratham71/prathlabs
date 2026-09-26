"use client";

import { useEffect, useRef } from "react";
import { BOOT_T, NODES } from "@/lib/boot-lines";
import { inked } from "@/lib/dither";

const DOT = 3; // css px per dither cell
const RAD = Math.PI / 180;
const ARC_MS = 450;

type V = [number, number, number];
const vec = (lat: number, lon: number): V => [
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
];
const LIGHT: V = (() => {
  const l: V = [-0.5, 0.6, 0.65];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

// Dithered globe for the login intro (ordered dither like the activity heatmap; after ditther.com's look).
// Faces the visitor's nearest region, then draws a great-circle arc to each edge as its probe line prints.
// Runs only while the boot overlay is up.
export function BootGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || html.dataset.boot !== "1") return;
    const home = NODES.find((n) => n.id === html.dataset.bootHome) ?? NODES[0];
    const homeV = vec(home.lat, home.lon);
    const t0 = (window as { __bootT0?: number }).__bootT0 ?? performance.now();
    const css = getComputedStyle(html);
    const [muted, text, amber, ok] = ["--muted", "--text", "--amber", "--ok"].map((v) => css.getPropertyValue(v).trim());
    const pitch = home.lat * RAD * 0.6;
    let w = 0;
    let h = 0;
    let raf = 0;

    const frame = (now: number) => {
      const t = now - t0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== innerWidth || h !== innerHeight) {
        w = innerWidth;
        h = innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const wide = w >= 720;
      const cx = wide ? w * 0.68 : w / 2;
      const cy = wide ? h * 0.44 : h * 0.3;
      const R = wide ? Math.min(w * 0.25, h * 0.36) : Math.min(w * 0.42, h * 0.22);
      const yaw = -home.lon * RAD + t * 0.00006;
      const [cyw, syw, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
      // world -> view
      const rot = ([x, y, z]: V): V => {
        const x1 = x * cyw + z * syw;
        const z1 = -x * syw + z * cyw;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };
      // view -> world (transpose)
      const unrot = ([x, y, z]: V): V => {
        const z1 = -y * sp + z * cp;
        const y0 = y * cp + z * sp;
        return [x * cyw - z1 * syw, y0, x * syw + z1 * cyw];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Sphere body: Lambert shade, ordered dither; graticule every 30deg drawn brighter so the spin reads.
      const body = new Path2D();
      const grid = new Path2D();
      for (let py = Math.floor((cy - R) / DOT); py <= (cy + R) / DOT; py++) {
        for (let px = Math.floor((cx - R) / DOT); px <= (cx + R) / DOT; px++) {
          const nx = (px * DOT + DOT / 2 - cx) / R;
          const ny = -(py * DOT + DOT / 2 - cy) / R;
          const r2 = nx * nx + ny * ny;
          if (r2 > 1) continue;
          const nz = Math.sqrt(1 - r2);
          const shade = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
          const [wx, wy, wz] = unrot([nx, ny, nz]);
          const lat = Math.asin(wy) / RAD;
          const lon = Math.atan2(wx, wz) / RAD;
          // degrees to the nearest 30deg line (0 on the line); meridians stop short of the poles
          const dLat = Math.abs(((lat + 105) % 30) - 15);
          const dLon = Math.abs(((lon + 375) % 30) - 15) * Math.cos(lat * RAD);
          const onGrid = (dLat < 0.6 || (dLon < 0.6 && Math.abs(lat) < 75)) && shade > 0.05;
          if (onGrid) grid.rect(px * DOT, py * DOT, DOT - 1, DOT - 1);
          else if (inked(0.2 + 2.6 * shade * shade, px, py)) body.rect(px * DOT, py * DOT, DOT - 1, DOT - 1);
        }
      }
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = muted;
      ctx.fill(body);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = text;
      ctx.fill(grid);

      // Arcs from home to each edge, lifted off the surface, drawn as that probe row prints.
      const project = (v: V) => {
        const [x, y, z] = rot(v);
        return { x: cx + x * R, y: cy - y * R, seen: z > 0 || x * x + y * y > 1 };
      };
      ctx.lineWidth = 1.25;
      NODES.forEach((n, i) => {
        if (n.id === home.id) return;
        const at = BOOT_T.probe + Math.floor(i / 2) * BOOT_T.step + (i % 2) * (BOOT_T.step / 2);
        const p = Math.min(1, Math.max(0, (t - at) / ARC_MS));
        if (!p) return;
        const b = vec(n.lat, n.lon);
        const omega = Math.acos(Math.min(1, homeV[0] * b[0] + homeV[1] * b[1] + homeV[2] * b[2]));
        const steps = 48;
        ctx.strokeStyle = amber;
        ctx.globalAlpha = t > BOOT_T.route ? 0.45 : 0.9;
        ctx.beginPath();
        let open = false;
        let head = project(homeV);
        for (let s = 0; s <= steps * p; s++) {
          const f = s / steps;
          const ka = Math.sin((1 - f) * omega) / Math.sin(omega);
          const kb = Math.sin(f * omega) / Math.sin(omega);
          const lift = 1 + 0.22 * Math.sin(Math.PI * f) * (omega / Math.PI);
          const pt = project([
            (homeV[0] * ka + b[0] * kb) * lift,
            (homeV[1] * ka + b[1] * kb) * lift,
            (homeV[2] * ka + b[2] * kb) * lift,
          ]);
          if (pt.seen && open) ctx.lineTo(pt.x, pt.y);
          else if (pt.seen) ctx.moveTo(pt.x, pt.y);
          open = pt.seen;
          head = pt;
        }
        ctx.stroke();
        const dot = project(b);
        ctx.fillStyle = amber;
        if (p === 1 && dot.seen) ctx.fillRect(dot.x - 2, dot.y - 2, 4, 4);
        else if (p < 1 && head.seen) ctx.fillRect(head.x - 1.5, head.y - 1.5, 3, 3);
      });

      // Home region: steady mark, pulsing ring once the route is chosen.
      const hp = project(homeV);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ok;
      ctx.fillRect(hp.x - 2.5, hp.y - 2.5, 5, 5);
      if (t > BOOT_T.route) {
        const k = ((t - BOOT_T.route) % 1100) / 1100;
        ctx.strokeStyle = ok;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 4 + k * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (html.dataset.boot) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="boot-globe" />;
}
