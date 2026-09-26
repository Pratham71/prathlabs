"use client";

import { useEffect, useRef, useState } from "react";

export const ZONES = [
  { id: "dxb", tz: "Asia/Dubai", city: "dubai", note: "home" },
  { id: "del", tz: "Asia/Kolkata", city: "delhi", note: "india" },
] as const;

// 5x7 dot-matrix digits, rows top to bottom.
const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ":": ["0", "0", "1", "0", "1", "0", "0"],
};

export function timeIn(tz: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", day: "numeric", month: "short", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hh: get("hour"), mm: get("minute"), ss: Number(get("second")), date: `${get("weekday")} ${get("day")} ${get("month")}`.toLowerCase() };
}

const P = 5; // dot pitch, css px

// One dot-matrix readout (HH:MM). Changed digits resolve dot by dot; the colon blinks; a 60-dot seconds
// rail fills underneath. Lit dots use --text, unlit ones --line so the matrix itself is visible.
function DotClock({ tz }: { tz: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const col = (v: string) => css.getPropertyValue(v).trim();
    const cols = 5 + 1 + 5 + 1 + 1 + 1 + 5 + 1 + 5; // HH : MM with 1-dot gaps
    const W = cols * P;
    const H = 7 * P + 3 * P; // digits + gap + seconds rail
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // lit[x][y] target and per-dot fade 0..1
    const target = new Float32Array(cols * 7);
    const level = new Float32Array(cols * 7);
    const delay = Float32Array.from({ length: cols * 7 }, () => Math.random() * 220);
    let changedAt = 0;
    let ss = 0;
    let raf = 0;

    const layout = (s: string) => {
      target.fill(0);
      let x = 0;
      for (const ch of s) {
        const g = GLYPHS[ch];
        g.forEach((row, y) => [...row].forEach((b, dx) => b === "1" && (target[(x + dx) * 7 + y] = 1)));
        x += g[0].length + 1;
      }
    };

    const draw = (now: number) => {
      const [text, line, amber] = [col("--text"), col("--line"), col("--amber")];
      ctx.clearRect(0, 0, W, H);
      let busy = false;
      for (let x = 0; x < cols; x++)
        for (let y = 0; y < 7; y++) {
          const i = x * 7 + y;
          if (!reduce && now - changedAt > delay[i]) level[i] += (target[i] - level[i]) * 0.25;
          if (reduce) level[i] = target[i];
          if (Math.abs(target[i] - level[i]) > 0.02) busy = true;
          const colon = x === 12; // HH(0-4) gap HH(6-10) gap : (12)
          const on = colon ? target[i] * (ss % 2 === 0 ? 1 : 0.25) : level[i];
          ctx.fillStyle = line;
          ctx.beginPath();
          ctx.arc(x * P + P / 2, y * P + P / 2, P * 0.32, 0, Math.PI * 2);
          ctx.fill();
          if (on > 0.02) {
            ctx.globalAlpha = on;
            ctx.fillStyle = colon ? amber : text;
            ctx.beginPath();
            ctx.arc(x * P + P / 2, y * P + P / 2, P * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      // seconds rail: 60 ticks squeezed into the width
      const rail = 9 * P;
      for (let s = 0; s < 60; s++) {
        const x = (s / 59) * (W - 2) + 1;
        ctx.fillStyle = s <= ss ? amber : line;
        ctx.fillRect(Math.round(x), rail, 1, s % 15 === 0 ? P : P / 2);
      }
      raf = busy ? requestAnimationFrame(draw) : 0;
    };

    let last = "";
    const tick = () => {
      const t = timeIn(tz);
      ss = t.ss;
      const s = `${t.hh}:${t.mm}`;
      if (s !== last) {
        last = s;
        layout(s);
        changedAt = performance.now();
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [tz]);

  return <canvas ref={ref} aria-hidden="true" />;
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

// Wide screens: the left gutter. Rendered client-only (times differ per visitor), so nothing to hydrate.
export function WorldClock() {
  const now = useNow();
  if (!now) return null;
  return (
    <aside className="clocks" aria-label="Local time">
      {ZONES.map((z) => {
        const t = timeIn(z.tz, now);
        const h = Number(t.hh);
        return (
          <div className="clock" key={z.id}>
            <p className="clock-label">
              {z.id} <span className="muted">{z.city} · {z.note}</span>
            </p>
            <DotClock tz={z.tz} />
            <p className="clock-meta muted">
              <span className="sr-only">{`${t.hh}:${t.mm} `}</span>
              {t.date} · {h >= 6 && h < 18 ? "day" : "night"}
            </p>
          </div>
        );
      })}
    </aside>
  );
}

// Narrower screens: a compact line for the man-page header's right slot.
export function ClockText() {
  const now = useNow();
  if (!now) return null;
  return (
    <span className="clock-text">
      {ZONES.map((z, i) => {
        const t = timeIn(z.tz, now);
        return (
          <span key={z.id}>
            {i > 0 && " · "}
            {z.id} {t.hh}:{t.mm}
          </span>
        );
      })}
    </span>
  );
}
