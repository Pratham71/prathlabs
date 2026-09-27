"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

// Eggs nobody types (CommandPalette records them from the "egg" event):
// idle two minutes and a DVD-style screensaver bounces the initials; 3am in Dubai gets a note;
// ?debug in the URL outlines the page and shows a (mostly fake) dev panel; on the birthday (India time), confetti.

const IDLE_MS = 120_000;
const WAKE = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
const egg = (detail: { name?: string; text?: string }) => dispatchEvent(new CustomEvent("egg", { detail }));
const accents = () => {
  const css = getComputedStyle(document.documentElement);
  return ["--amber", "--text", "--ok", "--muted"].map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
};

// The hour and MM-DD in a time zone: Dubai for the 3am note (where he is), India for the birthday.
function zoned(timeZone: string, d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23", month: "2-digit", day: "2-digit" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { hour: Number(p.hour), md: `${p.month}-${p.day}` };
}

export function Quirks() {
  const [saver, setSaver] = useState(false);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ready = () => {
      const { hour } = zoned("Asia/Dubai");
      const { md } = zoned("Asia/Kolkata");
      if (hour === 3 && !sessionStorage.getItem("3am")) {
        sessionStorage.setItem("3am", "1");
        egg({ name: "3am", text: "you should be asleep. so should I. (the pi isn't)" });
      }
      if (site.birthday === md && !sessionStorage.getItem("bday")) {
        sessionStorage.setItem("bday", "1");
        egg({ text: `it's ${site.name.split(" ")[0].toLowerCase()}'s birthday today.` });
        if (!reduce) confetti();
      }
      if (new URLSearchParams(location.search).has("debug")) debugPanel();
    };
    // a tick later: the palette (which records eggs) may mount after this
    if (document.documentElement.dataset.boot) addEventListener("boot:done", ready, { once: true });
    else setTimeout(ready, 0);

    let t = setTimeout(() => setSaver(true), IDLE_MS);
    const wake = () => {
      clearTimeout(t);
      t = setTimeout(() => !document.documentElement.dataset.boot && setSaver(true), IDLE_MS);
    };
    WAKE.forEach((e) => addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(t);
      removeEventListener("boot:done", ready);
      WAKE.forEach((e) => removeEventListener(e, wake));
    };
  }, []);

  return saver ? <Screensaver onWake={() => setSaver(false)} /> : null;
}

// The DVD logo, with the initials: bounces off the edges, changes colour at every bounce.
function Screensaver({ onWake }: { onWake: () => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cols = accents();
    let c = 0;
    const pos = { x: Math.random() * (innerWidth - 160), y: Math.random() * (innerHeight - 90), vx: 110, vy: 80 };
    let last = 0;
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      pos.x += pos.vx * dt;
      pos.y += pos.vy * dt;
      const [w, h] = [innerWidth - el.offsetWidth, innerHeight - el.offsetHeight];
      if (pos.x < 0 || pos.x > w) {
        pos.vx *= -1;
        pos.x = Math.min(w, Math.max(0, pos.x));
        c = (c + 1) % cols.length;
      }
      if (pos.y < 0 || pos.y > h) {
        pos.vy *= -1;
        pos.y = Math.min(h, Math.max(0, pos.y));
        c = (c + 1) % cols.length;
      }
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      el.style.color = cols[c];
      raf = requestAnimationFrame(frame);
    };
    if (reduce) el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    else raf = requestAnimationFrame(frame);

    // the first input after it shows wakes the page; that counts as finding it
    const wake = () => {
      onWake();
      egg({ name: "screensaver" });
    };
    const arm = setTimeout(() => WAKE.forEach((e) => addEventListener(e, wake, { once: true, passive: true })), 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(arm);
      WAKE.forEach((e) => removeEventListener(e, wake));
    };
  }, [onWake]);

  const initials = site.name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="saver" aria-hidden="true">
      <div ref={box} className="saver-logo">
        <strong>{initials}</strong>
        <span>prathlabs</span>
      </div>
    </div>
  );
}

// ?debug: outlines on everything and a corner panel. The fps and node count are real; the rest is a joke.
function debugPanel() {
  document.documentElement.setAttribute("data-debug", "");
  const panel = document.createElement("pre");
  panel.className = "debug-panel";
  panel.setAttribute("aria-hidden", "true");
  document.body.append(panel);
  let frames = 0;
  const count = () => {
    frames++;
    requestAnimationFrame(count);
  };
  requestAnimationFrame(count);
  const paint = () => {
    const eggs = (() => {
      try {
        return JSON.parse(localStorage.getItem("eggs") ?? "[]").length;
      } catch {
        return 0;
      }
    })();
    panel.textContent = [
      "DEBUG · prathlabs",
      `fps          ${frames * 2}`,
      `dom nodes    ${document.getElementsByTagName("*").length}`,
      `theme        ${document.documentElement.dataset.theme ?? "amber"}`,
      `viewport     ${innerWidth}x${innerHeight}`,
      `eggs found   ${eggs}`,
      "render       3ms (made up)",
      "bugs         0 (also made up)",
      "coffee       none. pre-workout only",
    ].join("\n");
    frames = 0;
  };
  paint();
  setInterval(paint, 500);
  egg({ name: "debug" });
}

// Birthday confetti in the theme's colours, for a few seconds.
function confetti() {
  const c = document.createElement("canvas");
  c.className = "confetti";
  c.setAttribute("aria-hidden", "true");
  document.body.append(c);
  const ctx = c.getContext("2d")!;
  c.width = innerWidth;
  c.height = innerHeight;
  const cols = accents();
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * c.width,
    y: -20 - Math.random() * c.height * 0.5,
    vx: (Math.random() - 0.5) * 60,
    vy: 60 + Math.random() * 120,
    r: Math.random() * 6,
    col: cols[Math.floor(Math.random() * cols.length)],
  }));
  let last = 0;
  const end = performance.now() + 6000;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r += dt * 4;
      ctx.fillStyle = b.col;
      ctx.fillRect(b.x, b.y, 6, 3 + Math.abs(Math.sin(b.r)) * 5); // flipping as it falls
    }
    if (now < end) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}
