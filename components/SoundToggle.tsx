"use client";

import { useEffect, useState } from "react";

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
    const resume = () => void import("@/lib/audio").then((a) => a.start());
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

    const timers: number[] = [];
    const t0 = (window as { __bootT0?: number }).__bootT0;
    if (document.documentElement.dataset.boot === "1" && t0 !== undefined) {
      const lines = document.querySelectorAll<HTMLElement>(".boot-log p");
      const elapsed = performance.now() - t0;
      lines.forEach((p) => {
        const at = parseFloat(p.style.getPropertyValue("--t")) - elapsed;
        if (at < 0) return;
        const ok = p.classList.contains("ok-line") || p.textContent?.startsWith("route");
        timers.push(window.setTimeout(() => void import("@/lib/audio").then((a) => (ok ? a.sfx.ok() : a.sfx.key())), at));
      });
    }
    return () => {
      removeEventListener("pointerover", onOver);
      timers.forEach(clearTimeout);
    };
  }, [on]);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
    const a = await import("@/lib/audio");
    if (next) await a.start();
    else a.stop();
  };

  return (
    <button type="button" className="sound-toggle" aria-pressed={on} onClick={toggle} data-on={on || undefined}>
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      sound {on ? "on" : "off"}
    </button>
  );
}
