"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { STATIONS, getAnalyser, off, pause, play, playlist, skip, snapshot, subscribe } from "@/lib/radio";
import { currentTheme, isGame, onThemeChange } from "@/lib/theme";
import { inked } from "@/lib/dither";

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

  useEffect(() => {
    if (!theme) return;
    if (!isGame(theme)) {
      if (radio.theme) off();
      return;
    }
    if (radio.theme !== theme && soundOn()) void play(theme, 0);
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
        <p className="radio-title" aria-live="polite">
          {track.title}
        </p>
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
      </div>
      <p className="radio-note muted">{track.artist ?? "original loop, made for this site"}</p>
    </aside>
  );
}
