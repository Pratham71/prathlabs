"use client";

import { useEffect, useRef, useState } from "react";

// Text decodes left to right when its link is hovered or focused, reusing its own characters
// (after amicro ScrambleHover, MIT). Screen readers get the plain text.
export function Scramble({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current?.closest("a");
    if (!host || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pool = text.replace(/[\s()]/g, "");
    let timer = 0;
    const run = () => {
      let i = 0;
      clearInterval(timer);
      timer = window.setInterval(() => {
        i++;
        setShown(
          text
            .split("")
            .map((ch, k) => (k < i || /[\s()]/.test(ch) ? ch : pool[Math.floor(Math.random() * pool.length)]))
            .join(""),
        );
        if (i >= text.length) clearInterval(timer);
      }, 28);
    };
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => {
      clearInterval(timer);
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
    };
  }, [text]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
