"use client";

import { useEffect } from "react";
import { currentTheme, isGame, onThemeChange } from "@/lib/theme";
import { cursorSprite } from "@/lib/sprites";

// Tab icon follows the theme: station themes show their pixel sprite on the theme's ink, the others
// the prompt mark (app/icon.svg) recoloured with the theme's tokens. No-JS / first paint: icon.svg.
export function ThemeIcon() {
  useEffect(() => {
    const apply = () => {
      const t = currentTheme();
      const css = getComputedStyle(document.documentElement);
      const tok = (v: string) => css.getPropertyValue(v).trim();

      const s = isGame(t) ? cursorSprite(t) : null;
      if (s) {
        const c = document.createElement("canvas");
        c.width = c.height = 32;
        const x = c.getContext("2d")!;
        x.fillStyle = tok("--ink");
        x.beginPath();
        x.roundRect(0, 0, 32, 32, 6);
        x.fill();
        const img = new Image();
        img.src = s.url;
        x.imageSmoothingEnabled = false;
        img.onload = () => {
          x.drawImage(img, 0, 0, 32, 32);
          set(c.toDataURL());
        };
        return;
      }
      const href = `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${tok("--ink")}"/><path d="M8 10.5 14 16l-6 5.5" fill="none" stroke="${tok("--amber")}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="20.5" width="9" height="2.6" rx="1" fill="${tok("--text")}"/></svg>`,
      )}`;
      set(href);
    };
    const set = (href: string) => {
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => l.remove());
      const l = document.createElement("link");
      l.rel = "icon";
      l.href = href;
      document.head.append(l);
    };
    apply();
    return onThemeChange(apply);
  }, []);
  return null;
}
