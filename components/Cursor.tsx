"use client";

import { useEffect, useRef, useState } from "react";
import { ditherImage } from "@/lib/dither";
import { currentTheme, isGame, onThemeChange } from "@/lib/theme";
import { cursorSprite } from "@/lib/sprites";

type Mode = "block" | "caret" | "frame";

const TEXT = "p, li, h1, h2, h3, dd, dt, figcaption, code, .man-edge span, .man-label";
const TARGET = "a, button, [data-cursor='frame']";
const previews = new Map<string, Promise<string>>();

// Dithered preview for a row's data-cursor-image, rendered once per image and colour, and cached.
function preview(src: string, color: string) {
  const key = `${src} ${color}`;
  let p = previews.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = 280;
        const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
        const c = document.createElement("canvas");
        c.width = w * 2;
        c.height = h * 2;
        const ctx = c.getContext("2d");
        if (!ctx) return reject();
        ctx.scale(2, 2);
        ditherImage(ctx, img, w, h, 2, color);
        resolve(c.toDataURL());
      };
      img.onerror = reject;
      img.src = src;
    });
    previews.set(key, p);
  }
  return p;
}

// Terminal cursor (after Motion's "adaptive caret" and custom-cursor examples on 21st.dev, written without Motion):
// an amber block that blinks at rest, narrows to a text-height caret over copy, and becomes a bracket frame
// snapped around links and buttons. Rows with data-cursor-image carry a dithered screenshot beside it.
// Fine pointers only; touch keeps the native behaviour. The native cursor is hidden only while this runs.
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const html = document.documentElement;
    const snap = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let amber = "";
    // station themes swap the block/caret for a pixel sprite at the pointer (frames stay)
    const retheme = () => {
      amber = getComputedStyle(html).getPropertyValue("--amber").trim();
      const t = currentTheme();
      const s = isGame(t) ? cursorSprite(t) : null;
      if (!s) return void delete el.dataset.sprite;
      el.dataset.sprite = "";
      el.style.setProperty("--sprite", `url(${s.url})`);
      el.style.setProperty("--hx", `${s.hx}px`);
      el.style.setProperty("--hy", `${s.hy}px`);
    };
    retheme();
    const offTheme = onThemeChange(retheme);
    const want = { x: -100, y: -100, w: 10, h: 18 };
    const now = { ...want };
    const mouse = { x: -100, y: -100 };
    let mode: Mode = "block";
    let imageSrc: string | null = null;
    let raf = 0;
    let idle = 0;

    const step = () => {
      const k = snap ? 1 : 0.28;
      let moving = false;
      for (const key of ["x", "y", "w", "h"] as const) {
        now[key] += (want[key] - now[key]) * k;
        if (Math.abs(want[key] - now[key]) > 0.1) moving = true;
        else now[key] = want[key];
      }
      el.style.transform = `translate(${now.x}px, ${now.y}px)`;
      el.style.width = `${now.w}px`;
      el.style.height = `${now.h}px`;
      el.style.setProperty("--mx", `${mouse.x - now.x}px`);
      el.style.setProperty("--my", `${mouse.y - now.y}px`);
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const aim = (target: Element | null) => {
      const hit = target?.closest(TARGET);
      if (hit) {
        const r = hit.getBoundingClientRect();
        mode = "frame";
        Object.assign(want, { x: r.left - 4, y: r.top - 3, w: r.width + 8, h: r.height + 6 });
      } else if (target?.closest(TEXT)) {
        const lh = parseFloat(getComputedStyle(target as Element).fontSize) * 1.3 || 20;
        mode = "caret";
        Object.assign(want, { x: mouse.x - 1, y: mouse.y - lh / 2, w: 2, h: lh });
      } else {
        mode = "block";
        Object.assign(want, { x: mouse.x - 1, y: mouse.y - 9, w: 10, h: 18 });
      }
      el.dataset.mode = mode;
      const src = hit?.closest<HTMLElement>("[data-cursor-image]")?.dataset.cursorImage ?? null;
      if (src !== imageSrc) {
        imageSrc = src;
        if (!src) setImage(null);
        else preview(src, amber).then((url) => imageSrc === src && setImage(url), () => {});
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      el.dataset.on = "";
      el.dataset.idle = "false";
      clearTimeout(idle);
      idle = window.setTimeout(() => (el.dataset.idle = "true"), 900);
      aim(e.target as Element);
      kick();
    };
    const onScroll = () => {
      aim(document.elementFromPoint(mouse.x, mouse.y));
      kick();
    };
    const onLeave = () => delete el.dataset.on;
    const onDown = () => el.animate([{ scale: 1 }, { scale: 0.88 }, { scale: 1 }], { duration: 250, easing: "ease-out" });

    html.dataset.cursor = "";
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointerdown", onDown);
    html.addEventListener("pointerleave", onLeave);
    return () => {
      offTheme();
      delete html.dataset.cursor;
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", onScroll);
      removeEventListener("pointerdown", onDown);
      html.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true" data-mode="block">
      <span className="cursor-tl" />
      <span className="cursor-br" />
      <i className="cursor-sprite" />
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      {image && <img className="cursor-preview" src={image} alt="" />}
    </div>
  );
}
