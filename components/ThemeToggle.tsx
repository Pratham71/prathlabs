"use client";

import { useSyncExternalStore } from "react";
import { THEME_LABEL, currentTheme, nextTheme, onThemeChange, setTheme } from "@/lib/theme";

// Dock button: cycles the colour themes. Swatch shows the current accent; label names the theme.
export function ThemeToggle() {
  const theme = useSyncExternalStore(onThemeChange, currentTheme, () => null);

  return (
    <button
      type="button"
      className="dock-btn theme-toggle"
      onClick={() => setTheme(nextTheme(currentTheme()))}
      aria-label={theme ? `Theme: ${THEME_LABEL[theme]}. Switch theme` : "Switch theme"}
    >
      <i className="swatch" aria-hidden="true" />
      {theme ? THEME_LABEL[theme] : "theme"}
    </button>
  );
}
