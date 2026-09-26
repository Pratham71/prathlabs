"use client";

import { useEffect, useRef, useState } from "react";
import { formatUptime, liveDevices, type OnlineDevice } from "@/lib/heartbeat";
import { inked } from "@/lib/dither";
import { onThemeChange } from "@/lib/theme";

// Right gutter (>= 1400px, mirrors the clocks): the homelab, each device beating in the last 10 min
// with a dithered cpu trace, mem and temp.
export function SideRail() {
  const [devices, setDevices] = useState<OnlineDevice[] | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/heartbeat")
        .then((r) => (r.ok ? r.json() : []))
        .then((d: OnlineDevice[]) => {
          if (!alive) return;
          setDevices(d);
          setNow(Date.now());
        })
        .catch(() => alive && setDevices([]));
    void load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const live = devices ? liveDevices(devices, now) : [];

  return (
    <aside className="rail" aria-label="Homelab">
      {devices && (
        <section className="rail-lab" aria-label="Homelab status">
          <p className="rail-label">homelab</p>
          {live.length ? (
            live.map((d) => (
              <div key={d.id} className="rail-dev">
                <p>
                  <span className="rail-on" aria-hidden="true" /> {d.name} <span className="muted">{formatUptime(d.since, now)}</span>
                </p>
                {d.cpu && d.cpu.length > 1 && <CpuTrace samples={d.cpu} />}
                <p className="muted">
                  {[d.cpu?.length && `cpu ${d.cpu.at(-1)}%`, d.mem !== undefined && `mem ${d.mem}%`, d.temp !== undefined && `${d.temp}°c`]
                    .filter(Boolean)
                    .join("  ")}
                </p>
              </div>
            ))
          ) : (
            <p className="muted">all machines asleep</p>
          )}
        </section>
      )}
    </aside>
  );
}

const DOT = 3;
const ROWS = 7; // dots per column; each sample is one 2-dot-wide column

// cpu history as dithered columns, same 4x4 Bayer ink as the heatmap: height = load, density fades with age.
function CpuTrace({ samples }: { samples: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const W = samples.length * DOT * 2;
    const H = ROWS * DOT;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const css = getComputedStyle(document.documentElement);
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      samples.forEach((v, i) => {
        const tall = Math.max(1, Math.round((v / 100) * ROWS));
        const age = 4 - Math.floor(((samples.length - 1 - i) / samples.length) * 3); // 4 newest .. 2 oldest
        for (let y = 0; y < ROWS; y++)
          for (let dx = 0; dx < 2; dx++) {
            const lit = ROWS - y <= tall;
            ctx.fillStyle = css.getPropertyValue(lit ? "--amber" : "--line").trim();
            if (!lit || inked(age, i * 2 + dx, y)) ctx.fillRect((i * 2 + dx) * DOT, y * DOT, DOT - (lit ? 0 : 1), DOT - (lit ? 0 : 1));
          }
      });
    };
    draw();
    return onThemeChange(draw);
  }, [samples]);

  return <canvas ref={ref} className="rail-trace" role="img" aria-label={`cpu over the last ${samples.length * 5} minutes, now ${samples.at(-1)}%`} />;
}
