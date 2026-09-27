"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { STATIONS, getAnalyser, off, pause, play, playlist, position, probe, seek, setVolume, skip, snapshot, splitArtist, subscribe, volume } from "@/lib/radio";
import { currentTheme, isGame, onThemeChange } from "@/lib/theme";
import { inked } from "@/lib/dither";
import { THEME_CLUE } from "@/lib/commands";

const clock = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "-:--");

const soundOn = () => {
  try {
    return localStorage.getItem("sound") === "on";
  } catch {
    return false;
  }
};

// Station card for the station themes (bottom left): dithered spectrum, track, prev/play/next.
// Switching into a game theme tunes in (and plays if sound is on); leaving it switches the radio off.
export function RadioPlayer() {
  const theme = useSyncExternalStore(onThemeChange, currentTheme, () => null);
  const radio = useSyncExternalStore(subscribe, snapshot, snapshot);
  const viz = useRef<HTMLCanvasElement>(null);
  const [, tick] = useState(0);
  const [vol, setVol] = useState(volume);

  // the timer: re-render 4x a second while playing (plenty for m:ss); position() is read at render
  useEffect(() => {
    if (!radio.playing) return;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [radio.playing]);

  useEffect(() => {
    if (!theme) return;
    if (!isGame(theme)) {
      if (radio.theme) off();
      return;
    }
    // check which real songs exist first, so the station starts on one if it's there
    void probe(theme).then(() => {
      if (snapshot().theme !== theme && soundOn()) void play(theme, 0);
    });
    // radio.* intentionally not a dependency: react to theme changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    const canvas = viz.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !isGame(theme ?? undefined)) return;
    const COLS = 24;
    const ROWS = 7;
    const P = 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = COLS * P * dpr;
    canvas.height = ROWS * P * dpr;
    canvas.style.width = `${COLS * P}px`;
    canvas.style.height = `${ROWS * P}px`;
    const css = getComputedStyle(document.documentElement);
    const bins = new Uint8Array(128);
    let raf = 0;
    const draw = () => {
      const a = getAnalyser();
      if (a && radio.playing) a.getByteFrequencyData(bins);
      else bins.fill(0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, COLS * P, ROWS * P);
      const [on, dim] = [css.getPropertyValue("--amber").trim(), css.getPropertyValue("--line").trim()];
      for (let x = 0; x < COLS; x++) {
        // log-ish bin spread so bass doesn't hog the whole display
        const i = Math.min(127, Math.floor(Math.pow(x / COLS, 1.7) * 90) + 1);
        const v = (bins[i] / 255) * ROWS;
        for (let y = 0; y < ROWS; y++) {
          const h = ROWS - y; // 1 at the bottom
          const lit = h <= v ? 4 : h - 1 < v ? Math.round((v - (h - 1)) * 4) : 0;
          ctx.fillStyle = lit ? on : dim;
          if (lit ? inked(lit, x, y) : true) ctx.fillRect(x * P, y * P, P - 1, P - 1);
        }
      }
      raf = radio.playing && !document.hidden ? requestAnimationFrame(draw) : 0;
    };
    draw();
    const onVis = () => !document.hidden && !raf && draw();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [theme, radio.playing]);

  if (!theme || !isGame(theme)) return null;
  const station = STATIONS[theme]!;
  const track = playlist(theme)[radio.theme === theme ? radio.index : 0];
  const playing = radio.playing && radio.theme === theme;
  const pos = position(theme);

  const toggle = () => {
    if (playing) return pause();
    if (!soundOn()) dispatchEvent(new CustomEvent("sound:set", { detail: true }));
    void play(theme);
  };

  return (
    <aside className="radio" aria-label={`${station.name} radio`} data-playing={playing || undefined}>
      <canvas ref={viz} className="radio-viz" aria-hidden="true" />
      <div className="radio-meta">
        <p className="radio-station">{station.name}</p>
        <Scroll className="radio-title" live>
          {track.title}
        </Scroll>
      </div>
      <div className="radio-ctl">
        <button type="button" onClick={() => skip(theme, -1)} aria-label="Previous track">
          &lt;&lt;
        </button>
        <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "pause" : "play"}
        </button>
        <button type="button" onClick={() => skip(theme, 1)} aria-label="Next track">
          &gt;&gt;
        </button>
        <Knob
          value={vol}
          onChange={(v) => {
            setVol(v);
            setVolume(v);
          }}
        />
      </div>
      <div className="radio-time">
        <span>{clock(pos.cur)}</span>
        <input
          type="range"
          min={0}
          max={Number.isFinite(pos.dur) ? pos.dur : 0}
          step={0.5}
          value={Math.min(pos.cur, Number.isFinite(pos.dur) ? pos.dur : 0)}
          onChange={(e) => (seek(Number(e.target.value)), tick((n) => n + 1))}
          disabled={pos.loop || !Number.isFinite(pos.dur)}
          aria-label="Seek"
          aria-valuetext={`${clock(pos.cur)} of ${clock(pos.dur)}`}
          style={{ "--p": `${Number.isFinite(pos.dur) && pos.dur ? (pos.cur / pos.dur) * 100 : 0}%` } as CSSProperties}
        />
        <span title={pos.loop ? "loop length" : undefined}>{clock(pos.dur)}</span>
      </div>
      <div className="radio-foot">
        {!playing && THEME_CLUE[theme] ? (
          <Scroll className="radio-note muted">{THEME_CLUE[theme]}</Scroll>
        ) : (
          <Note artist={track.artist} />
        )}
      </div>
    </aside>
  );
}

function Note({ artist }: { artist?: string }) {
  if (!artist) return <Scroll className="radio-note muted">original loop, made for this site</Scroll>;
  const [name, url] = splitArtist(artist);
  return (
    <>
      <Scroll className="radio-note muted">{name}</Scroll>
      {url && (
        <a className="radio-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} link`}>
          {/youtu\.?be/.test(url) ? "yt" : "link"} ↗
        </a>
      )}
    </>
  );
}

// Volume as a car-radio knob (drag up/down or arrow keys; a slider to assistive tech), plus a field to
// type the level in.
function Knob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null); // what's being typed, until it's a valid 0-100
  const set = (v: number) => onChange(Math.min(1, Math.max(0, Math.round(v * 20) / 20)));
  const step: Record<string, number> = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05, Home: -1, End: 1 };
  return (
    <span className="radio-vol">
      <span
        className="radio-knob"
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        title={`volume ${Math.round(value * 100)}%`}
        style={{ "--turn": `${-135 + value * 270}deg` } as CSSProperties}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, v: value };
        }}
        onPointerMove={(e) => drag.current && set(drag.current.v + (drag.current.y - e.clientY) / 120)}
        onPointerUp={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (!(e.key in step)) return;
          e.preventDefault();
          set(value + step[e.key]);
        }}
      />
      <label className="radio-vol-text">
        vol{" "}
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          aria-label="Volume percent"
          value={draft ?? Math.round(value * 100)}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== "" && n >= 0 && n <= 100) onChange(Math.round(n) / 100);
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        %
      </label>
    </span>
  );
}

// One line of text; if it's wider than the card, it glides to its end and back (car-radio style),
// so the full song name and artist are always readable. Reduced motion: it wraps instead.
function Scroll({ className, live, children }: { className: string; live?: boolean; children: string }) {
  const box = useRef<HTMLParagraphElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const fit = () => {
      const over = i.scrollWidth - b.clientWidth;
      if (over > 2) {
        b.dataset.scroll = "";
        b.style.setProperty("--over", `${-over}px`);
        b.style.setProperty("--dur", `${Math.max(4, over / 18)}s`);
      } else delete b.dataset.scroll;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [children]);
  return (
    <p ref={box} className={`${className} scroll-line`} aria-live={live ? "polite" : undefined} title={children}>
      <span ref={inner}>{children}</span>
    </p>
  );
}
