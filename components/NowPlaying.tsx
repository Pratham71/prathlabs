"use client";

import { useEffect, useRef, useState } from "react";
import { ditherImage } from "@/lib/dither";
import { onThemeChange } from "@/lib/theme";
import { clientSettings } from "@/lib/client-settings";
import type { NowPlaying as Track } from "@/lib/spotify";

const ART = 48;

// Right rail: what Pratham has on Spotify, cover dithered in the theme's ink. Hidden when switched off
// in /admin or when Spotify isn't set up (the API answers {off: true}).
export function NowPlaying() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (clientSettings().spotify === false) return;
    let alive = true;
    const load = () =>
      fetch("/api/now-playing")
        .then((r) => r.json())
        .then((d: Track | { off: true }) => alive && setTrack("off" in d ? null : d))
        .catch(() => {});
    void load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!track) return null;
  return (
    <section className="rail-np" aria-label="Now playing on Spotify">
      <p className="rail-label">{track.playing ? "listening now" : "last played"}</p>
      <a href={track.url} target="_blank" rel="noopener noreferrer" className="np">
        {track.art && <Cover src={track.art} />}
        <span>
          <span className="np-title">{track.title}</span>
          <span className="muted np-artist">{track.artist}</span>
        </span>
      </a>
    </section>
  );
}

function Cover({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = ART * dpr;
    const img = new Image();
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ditherImage(ctx, img, ART, ART, 3, getComputedStyle(document.documentElement).getPropertyValue("--amber").trim());
    };
    img.onload = draw;
    img.src = `/api/art?u=${encodeURIComponent(src)}`;
    const off = onThemeChange(draw);
    return () => {
      off();
      img.onload = null;
    };
  }, [src]);

  return <canvas ref={ref} className="np-art" width={ART} height={ART} style={{ width: ART, height: ART }} aria-hidden="true" />;
}
