"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Day } from "@/lib/github";
import { inked } from "@/lib/dither";
import { onThemeChange } from "@/lib/theme";

const DOT = 2; // css px per dither dot
const GAP = 2; // css px between day cells
const REVEAL_MS = 900;

type Cell = { day: Day; col: number; row: number };

const label = (d: Day) => `${d.count} contribution${d.count === 1 ? "" : "s"} · ${d.date}`;

function toCells(days: Day[], weeks: number): Cell[] {
  if (!days.length) return [];
  const firstDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const all = days.map((day, i) => ({ day, col: Math.floor((i + firstDow) / 7), row: (i + firstDow) % 7 }));
  const first = all[all.length - 1].col - weeks + 1;
  return all.filter((c) => c.col >= first).map((c) => ({ ...c, col: c.col - Math.max(first, 0) }));
}

// Dithered contribution calendar. Canvas lifecycle after amicro's useCanvasSetup (MIT):
// size cached by ResizeObserver, DPR capped at 2, drawn only on reveal/resize, no loop at rest.
export function ActivityHeatmap({ days }: { days: Day[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const progress = useRef(0); // 0..1 reveal, rippling back from today
  const revealStart = useRef<number | null>(null);
  const size = useRef({ w: 0, h: 0, dpr: 0 });

  const weeks = width && width < 520 ? 26 : 53;
  const cells = useMemo(() => toCells(days, weeks), [days, weeks]);
  const cols = cells.length ? cells[cells.length - 1].col + 1 : weeks;
  const cell = Math.max(6, Math.floor((width - (cols - 1) * GAP) / cols / DOT) * DOT);
  const height = 7 * cell + 6 * GAP;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (size.current.w !== width || size.current.h !== height || size.current.dpr !== dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      size.current = { w: width, h: height, dpr };
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const color = (v: string) => css.getPropertyValue(v).trim();
    const [line, panel, amber] = [color("--line"), color("--panel"), color("--amber")];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const last = cells.length - 1;
    const shown = 1 - Math.pow(1 - progress.current, 3); // ease-out
    cells.forEach((c, i) => {
      if (last > 0 && (last - i) / last > shown) return;
      const x = c.col * (cell + GAP);
      const y = c.row * (cell + GAP);
      if (c.day.level === 0) {
        ctx.fillStyle = line;
        ctx.fillRect(x, y, cell, cell);
        return;
      }
      ctx.fillStyle = panel;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = amber;
      for (let dy = 0; dy < cell / DOT; dy++)
        for (let dx = 0; dx < cell / DOT; dx++)
          if (inked(c.day.level, dx, dy)) ctx.fillRect(x + dx * DOT, y + dy * DOT, DOT, DOT);
    });
  }, [cells, cell, height, width]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => onThemeChange(draw), [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    if (progress.current >= 1) return draw();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progress.current = 1;
      return draw();
    }
    let raf = 0;
    const html = document.documentElement;
    const run = () => {
      revealStart.current ??= performance.now();
      const tick = (now: number) => {
        progress.current = Math.min(1, (now - (revealStart.current ?? now)) / REVEAL_MS);
        draw();
        if (progress.current < 1 && !document.hidden) raf = requestAnimationFrame(tick);
        else if (progress.current < 1) {
          progress.current = 1;
          draw();
        }
      };
      raf = requestAnimationFrame(tick);
    };
    // Wait for the boot overlay to clear so the ripple is actually seen.
    const start = () => (html.dataset.boot ? addEventListener("boot:done", run, { once: true }) : run());
    if (revealStart.current !== null) run();
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      start();
    }, { threshold: 0.3 });
    draw();
    if (revealStart.current === null) io.observe(canvas);
    return () => {
      io.disconnect();
      removeEventListener("boot:done", run);
      cancelAnimationFrame(raf);
    };
  }, [draw, width]);

  const select = (i: number | null) => {
    setActive(i);
    if (i !== null) setAnnounce(label(cells[i].day));
  };

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") setActive(null);
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left) / (cell + GAP));
    const row = Math.floor((e.clientY - r.top) / (cell + GAP));
    const i = cells.findIndex((c) => c.col === col && c.row === row);
    setActive(i >= 0 ? i : null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!cells.length) return;
    const cur = active ?? cells.length - 1;
    const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next: number | null = null;
    if (e.key in step) next = cur + step[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = cells.length - 1;
    else if (e.key === "Escape") return select(null);
    if (next === null) return;
    e.preventDefault();
    select(Math.max(0, Math.min(cells.length - 1, next)));
  };

  const a = active !== null ? cells[active] : null;
  const ax = a ? a.col * (cell + GAP) : 0;
  const ay = a ? a.row * (cell + GAP) : 0;
  // Anchor the tip to whichever side keeps it inside the grid; no measuring needed.
  const tipTransform = a && a.col >= cols / 2
    ? `translate(calc(${ax + cell}px - 100%), ${ay - 30}px)`
    : `translate(${ax}px, ${ay - 30}px)`;

  return (
    <div className="heat" ref={wrapRef} data-active={a ? "true" : "false"}>
      <div
        className="heat-frame"
        data-measured={width ? "" : undefined}
        tabIndex={0}
        role="application"
        aria-roledescription="contribution calendar"
        aria-label="Contribution calendar. Use arrow keys to move between days."
        onKeyDown={onKey}
        onFocus={() => active === null && cells.length && select(cells.length - 1)}
        onBlur={() => setActive(null)}
      >
        <canvas
          ref={canvasRef}
          style={width ? { height } : undefined}
          aria-hidden="true"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={onPointerLeave}
        />
      </div>
      <div className="heat-cursor" aria-hidden="true" style={{ width: cell + 2, height: cell + 2, transform: `translate(${ax - 1}px, ${ay - 1}px)` }} />
      <div className="heat-tip" aria-hidden="true" style={{ transform: tipTransform }}>
        {a ? label(a.day) : " "}
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
