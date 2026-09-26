"use client";

import { useEffect, useState } from "react";
import { currentTheme, isGame } from "@/lib/theme";

const KEY = "sound";

// Sound is off by default. Turning it on is itself the user gesture browsers require; the choice is
// remembered, and for a returning visitor audio resumes on their first click or key press.
// The audio engine is loaded only when needed.
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(KEY) === "on";
    } catch {}
    if (!stored) return;
    const t = setTimeout(() => setOn(true), 0);
    const resume = () => {
      const theme = currentTheme();
      if (isGame(theme)) void import("@/lib/radio").then((r) => r.play(theme));
      else void import("@/lib/audio").then((a) => a.start());
    };
    addEventListener("pointerdown", resume, { once: true });
    addEventListener("keydown", resume, { once: true });
    return () => {
      clearTimeout(t);
      removeEventListener("pointerdown", resume);
      removeEventListener("keydown", resume);
    };
  }, []);

  // While on: a tick when the pointer lands on a link or button, and boot-log sounds for lines still to print.
  useEffect(() => {
    if (!on) return;
    let last: Element | null = null;
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element).closest?.("a, button");
      if (hit && hit !== last) void import("@/lib/audio").then((a) => a.sfx.tick());
      last = hit ?? null;
    };
    addEventListener("pointerover", onOver, { passive: true });

    // Boot-log sounds for lines still to print (server-login intro only). Load the engine and wait for
    // it to run first, then measure: the chunk fetch and resume used to push every sound late.
    const t0 = (window as { __bootT0?: number }).__bootT0;
    const html = document.documentElement;
    if (html.dataset.boot === "1" && t0 !== undefined && !isGame(html.dataset.theme)) {
      void import("@/lib/audio").then(async (a) => {
        if (!(await a.start())) return;
        const elapsed = performance.now() - t0;
        const events = [...document.querySelectorAll<HTMLElement>(".boot-log p")]
          .map((p) => ({
            at: parseFloat(p.style.getPropertyValue("--t")) - elapsed,
            ok: p.classList.contains("ok-line") || !!p.textContent?.startsWith("route"),
          }))
          .filter((e) => e.at >= 0);
        a.bootSfx(events);
      });
    }
    return () => removeEventListener("pointerover", onOver);
  }, [on]);

  const set = async (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
    const a = await import("@/lib/audio");
    if (next) await a.start();
    else a.stop();
    // game themes: the station is the sound, not the ambient bed
    const theme = currentTheme();
    if (isGame(theme)) {
      const radio = await import("@/lib/radio");
      if (next) void radio.play(theme);
      else radio.pause();
    }
  };

  // the command prompt's `sound on|off` arrives here
  useEffect(() => {
    const onSet = (e: Event) => void set((e as CustomEvent<boolean>).detail);
    addEventListener("sound:set", onSet);
    return () => removeEventListener("sound:set", onSet);
  });

  return (
    <button type="button" className="sound-toggle" aria-pressed={on} onClick={() => set(!on)} data-on={on || undefined}>
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      sound {on ? "on" : "off"}
    </button>
  );
}
