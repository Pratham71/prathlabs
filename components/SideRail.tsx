"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { formatUptime, liveDevices, type OnlineDevice } from "@/lib/heartbeat";
import { inked } from "@/lib/dither";
import { onThemeChange } from "@/lib/theme";

type Entry = { id: string; name: string };

// Right gutter (>= 1400px, mirrors the clocks): the page's man sections with scroll-spy, then the
// homelab: each device beating in the last 10 min with a dithered cpu trace, mem and temp.
export function SideRail() {
  const pathname = usePathname();
  const [sections, setSections] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [devices, setDevices] = useState<OnlineDevice[] | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const labels = [...document.querySelectorAll<HTMLElement>("main .man-label")];
    const first = setTimeout(() => setSections(labels.map((l) => ({ id: l.id, name: l.textContent ?? "" }))), 0);
    // active = the last section whose label has passed the upper third of the viewport
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.boundingClientRect.top < innerHeight * 0.35));
        const passed = labels.filter((l) => seen.get(l.id));
        setActive((passed.at(-1) ?? labels[0])?.id ?? null);
      },
      { rootMargin: "0px 0px -65% 0px", threshold: [0, 1] },
    );
    labels.forEach((l) => io.observe(l));
    return () => {
      clearTimeout(first);
      io.disconnect();
    };
  }, [pathname]);

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
    <aside className="rail" aria-label="On this page">
      {sections.length > 1 && (
        <nav className="rail-index">
          <p className="rail-label">contents</p>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={s.id === active ? "location" : undefined}>
                  {s.name.toLowerCase()}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
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
