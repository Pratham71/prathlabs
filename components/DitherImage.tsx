"use client";

import { useEffect, useRef } from "react";
import { ditherImage } from "@/lib/dither";

// Screenshot shown as an ordered dither; hover or focus clears to the real image underneath.
// Without JS (or before the canvas draws) the real image simply shows.
export function DitherImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const img = useRef<HTMLImageElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = img.current;
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!image || !canvas || !ctx) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue("--text").trim();
    let last = 0;
    const draw = () => {
      const w = Math.round(image.clientWidth);
      const h = Math.round(image.clientHeight);
      if (!w || !image.complete || !image.naturalWidth || w === last) return;
      last = w;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ditherImage(ctx, image, w, h, 2, color);
      canvas.dataset.ready = "";
    };
    const ro = new ResizeObserver(draw);
    ro.observe(image);
    image.addEventListener("load", draw);
    draw();
    return () => {
      ro.disconnect();
      image.removeEventListener("load", draw);
    };
  }, []);

  return (
    <span className="dither" tabIndex={0} data-cursor="frame">
      {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized webp; the canvas reads its pixels */}
      <img ref={img} src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      <canvas ref={cv} aria-hidden="true" />
    </span>
  );
}
