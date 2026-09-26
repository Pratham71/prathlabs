"use client";

import { Fragment, useEffect, useRef } from "react";
import { onThemeChange } from "@/lib/theme";

type Dot = { x: number; y: number; c: number; d: number; sx: number; sy: number; sz: number; o: number };

const RESOLVE_MS = 1600;
let resolved = false; // assemble once per page load, not on every client-side return to /

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// The name as a halftone dot field in relief (after benday by Kacem Mathlouthi, MIT: rasterize the mark,
// distance-transform it, sample a dot grid, animate the dots). Dots assemble from a scatter, a contour wave
// runs from outline to core, the relief tilts toward the pointer in 3D and dots near the cursor lift away.
// The real h1 text stays in the DOM for search and screen readers; it goes transparent only once dots draw.
export function DotName({ text }: { text: string }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = h1.current;
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !canvas || !ctx) return;
    const html = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let W = 0;
    let H = 0;
    let fs = 16;
    let P = 4;
    let built = "";
    let start: number | null = resolved || reduce ? -Infinity : null;
    let raf = 0;
    let visible = false;
    const pointer = { x: 0, y: 0, nx: 0, ny: 0, on: false };
    const tilt = { x: 0, y: 0 };
    const colors = () => {
      const css = getComputedStyle(html);
      return { text: css.getPropertyValue("--text").trim(), amber: css.getPropertyValue("--amber").trim() };
    };
    let col = colors();

    const build = () => {
      const r = el.getBoundingClientRect();
      const key = `${Math.round(r.width)}x${Math.round(r.height)}`;
      if (!r.width || key === built) return;
      built = key;
      const cs = getComputedStyle(el);
      fs = parseFloat(cs.fontSize);
      P = Math.max(3, Math.round(fs / 11));
      const B = Math.round(fs * 0.6); // bleed so tilted/lifted dots aren't clipped
      W = Math.ceil(r.width + 2 * B);
      H = Math.ceil(r.height + 2 * B);

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      (o as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "semi-expanded"; // wdth 112.5
      o.textBaseline = "alphabetic";
      o.fillStyle = "#fff";
      el.querySelectorAll<HTMLElement>("[data-word]").forEach((span) => {
        const s = span.getBoundingClientRect();
        const word = span.textContent ?? "";
        const m = o.measureText(word);
        const asc = m.fontBoundingBoxAscent || fs * 0.8;
        const desc = m.fontBoundingBoxDescent || fs * 0.2;
        o.save();
        o.translate(s.left - r.left + B, s.top - r.top + B + (s.height - asc - desc) / 2 + asc);
        o.scale(s.width / m.width, 1); // match the laid-out word exactly, whatever the canvas font support
        o.fillText(word, 0, 0);
        o.restore();
      });

      // Coverage per grid cell (3x3 samples), then a chamfer distance transform for depth.
      const img = o.getImageData(0, 0, W, H).data;
      const cols = Math.floor(W / P);
      const rows = Math.floor(H / P);
      const cov = new Float32Array(cols * rows);
      const dist = new Float32Array(cols * rows);
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          let a = 0;
          for (let sy = 0; sy < 3; sy++)
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.floor(gx * P + ((sx + 0.5) * P) / 3);
              const y = Math.floor(gy * P + ((sy + 0.5) * P) / 3);
              a += img[(y * W + x) * 4 + 3];
            }
          const i = gy * cols + gx;
          cov[i] = a / (9 * 255);
          dist[i] = cov[i] > 0.12 ? 1e6 : 0;
        }
      const relax = (i: number, j: number, c: number) => {
        if (dist[j] + c < dist[i]) dist[i] = dist[j] + c;
      };
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          if (!dist[i]) continue;
          if (gx > 0) relax(i, i - 1, 1);
          if (gy > 0) relax(i, i - cols, 1);
          if (gx > 0 && gy > 0) relax(i, i - cols - 1, 1.4);
          if (gx < cols - 1 && gy > 0) relax(i, i - cols + 1, 1.4);
        }
      for (let gy = rows - 1; gy >= 0; gy--)
        for (let gx = cols - 1; gx >= 0; gx--) {
          const i = gy * cols + gx;
          if (!dist[i]) continue;
          if (gx < cols - 1) relax(i, i + 1, 1);
          if (gy < rows - 1) relax(i, i + cols, 1);
          if (gx < cols - 1 && gy < rows - 1) relax(i, i + cols + 1, 1.4);
          if (gx > 0 && gy < rows - 1) relax(i, i + cols - 1, 1.4);
        }
      let max = 1;
      for (let i = 0; i < dist.length; i++) if (dist[i] < 1e6 && dist[i] > max) max = dist[i];

      dots = [];
      for (let gy = 0; gy < rows; gy++)
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          if (cov[i] <= 0.12) continue;
          const ang = Math.random() * Math.PI * 2;
          const rad = fs * (0.8 + Math.random() * 1.6);
          dots.push({
            x: gx * P + P / 2,
            y: gy * P + P / 2,
            c: cov[i],
            d: dist[i] / max,
            sx: Math.cos(ang) * rad,
            sy: Math.sin(ang) * rad * 0.6,
            sz: (Math.random() - 0.3) * fs * 3,
            o: Math.random(),
          });
        }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      Object.assign(canvas.style, { left: `${-B}px`, top: `${-B}px`, width: `${W}px`, height: `${H}px` });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      if (!dots.length || start === null) return;
      const t = now / 1000;
      const e = clamp((now - start) / RESOLVE_MS);
      const still = reduce;
      const target = pointer.on
        ? { x: -pointer.ny * 0.32, y: pointer.nx * 0.42 }
        : { x: Math.sin(t * 0.5) * 0.05, y: Math.sin(t * 0.37) * 0.09 };
      if (!still) {
        tilt.x += (target.x - tilt.x) * 0.07;
        tilt.y += (target.y - tilt.y) * 0.07;
      }
      const [cx, sx, cy, sy] = [Math.cos(tilt.x), Math.sin(tilt.x), Math.cos(tilt.y), Math.sin(tilt.y)];
      const F = fs * 14;
      const depth = fs * 0.28;
      const reach = fs * 1.1;
      const buckets: Path2D[] = Array.from({ length: 10 }, () => new Path2D());

      for (const p of dots) {
        const k = still ? 1 : 1 - Math.pow(1 - clamp(e * 1.7 - p.o * 0.7), 3);
        let x = p.x - W / 2;
        let y = p.y - H / 2;
        let z = p.d * depth + (still ? 0 : Math.sin(t * 1.6 - p.d * 5) * fs * 0.035);
        let hot = 0;
        if (pointer.on && !still) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dd = Math.hypot(dx, dy) || 1;
          if (dd < reach) {
            hot = (1 - dd / reach) ** 2;
            x += (dx / dd) * hot * fs * 0.22;
            y += (dy / dd) * hot * fs * 0.22;
            z += hot * fs * 0.5;
          }
        }
        x = p.sx + (x - p.sx) * k;
        y = p.sy + (y - p.sy) * k;
        z = p.sz + (z - p.sz) * k;
        // rotate Y then X, then perspective
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y2 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        const s = F / (F - z2);
        const px = W / 2 + x1 * s;
        const py = H / 2 + y2 * s;
        const wave = still ? 1 : 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.4 - p.d * 6));
        const r = P * 0.45 * Math.sqrt(p.c) * s * (0.5 + 0.5 * k);
        const b = Math.min(4, Math.floor(wave * k * 5)); // 0..4 alpha steps
        const path = buckets[(hot > 0.2 ? 5 : 0) + b];
        path.moveTo(px + r, py);
        path.arc(px, py, r, 0, Math.PI * 2);
      }

      ctx.clearRect(0, 0, W, H);
      buckets.forEach((path, i) => {
        ctx.fillStyle = i >= 5 ? col.amber : col.text;
        ctx.globalAlpha = 0.2 + 0.2 * (i % 5);
        ctx.fill(path);
      });
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      raf = visible && !reduce && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const begin = () => {
      build();
      if (!dots.length) return;
      if (start === null) {
        start = performance.now();
        resolved = true;
      }
      el.dataset.dots = "";
      if (reduce) draw(performance.now());
      else kick();
    };

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const B = (W - r.width) / 2;
      pointer.x = ev.clientX - r.left + B;
      pointer.y = ev.clientY - r.top + B;
      pointer.nx = clamp((ev.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
      pointer.ny = clamp((ev.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
      pointer.on = true;
    };
    const onLeave = () => (pointer.on = false);
    const onUp = (ev: PointerEvent) => ev.pointerType !== "mouse" && onLeave(); // touch: release on lift
    const onVis = () => !document.hidden && visible && kick();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && start !== null) kick();
    });
    const ro = new ResizeObserver(() => {
      if (start === null) return;
      build();
      if (reduce) draw(performance.now());
    });
    io.observe(el);
    ro.observe(el);
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    document.addEventListener("visibilitychange", onVis);
    const offTheme = onThemeChange(() => {
      col = colors();
      if (start !== null) draw(performance.now()); // now, not next frame: the theme crossfade snapshots it
    });

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      col = colors();
      if (html.dataset.boot) addEventListener("boot:done", begin, { once: true });
      else begin();
    });

    return () => {
      offTheme();
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      removeEventListener("boot:done", begin);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [text]);

  return (
    <h1 className="display-name dot-name" ref={h1}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span data-word>{w}</span>
        </Fragment>
      ))}
      <canvas ref={cv} aria-hidden="true" />
    </h1>
  );
}
