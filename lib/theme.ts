// Colour themes. Tokens live in globals.css under html[data-theme="<id>"]; amber is the default (no attribute).
// Every theme except amber is a "station theme": its own intro, radio station, cursor, scenery and page
// structure. CSS targets them all with html[data-theme] (amber never sets the attribute).
import { clientSettings } from "@/lib/client-settings";

export const THEMES = ["amber", "matrix", "cyberpunk", "spiderman", "minecraft", "blade", "gtav", "gtavi", "fortnite"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABEL: Record<Theme, string> = {
  amber: "amber",
  matrix: "matrix",
  cyberpunk: "night city",
  spiderman: "spider-man",
  minecraft: "minecraft",
  blade: "blade",
  gtav: "los santos",
  gtavi: "vice city",
  fortnite: "battle bus",
};

export const isTheme = (s: string): s is Theme => (THEMES as readonly string[]).includes(s);

let pending: Theme | null = null; // set between setTheme() and the view transition applying it

export function currentTheme(): Theme {
  if (pending) return pending;
  const t = document.documentElement.dataset.theme ?? "amber";
  return isTheme(t) ? t : "amber";
}

// The themes switched on in /admin (all of them by default). Nothing reaches a theme that's off.
export const enabledThemes = (): readonly Theme[] => clientSettings().themes ?? THEMES;

export function setTheme(name: Theme) {
  if (!enabledThemes().includes(name)) return; // switched off in /admin: the palette, eggs and konami all stop here
  const d = document.documentElement;
  const apply = () => {
    pending = null;
    if (name === "amber") delete d.dataset.theme;
    else d.dataset.theme = name;
  };
  try {
    localStorage.setItem("theme", name);
    // the default this pick was made under; when /admin sets a new default, it wins over old picks (Boot.tsx)
    localStorage.setItem("theme-default", clientSettings().defaultTheme ?? "amber");
  } catch {}
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  pending = name;
  document.startViewTransition(apply);
}

// Cycles the themes switched on in /admin.
export function nextTheme(t: Theme): Theme {
  const list = enabledThemes();
  return list[(list.indexOf(t) + 1) % list.length];
}

// Canvas/WebGL components read CSS tokens into pixels; they call this to re-read when the theme flips.
export function onThemeChange(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

// Station themes: everything but amber.
export const GAME_THEMES: readonly Theme[] = THEMES.filter((t) => t !== "amber");
export const isGame = (t: string | undefined): t is Theme => !!t && t !== "amber" && isTheme(t);
