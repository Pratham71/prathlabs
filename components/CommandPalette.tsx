"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KONAMI, complete, run, type Action } from "@/lib/commands";

type Entry = { cmd?: string; out: string[] };
const PROMPT = "visitor@prathlab:~$";
const GREETING: Entry = {
  out: ["type help for commands · Tab completes · ↑↓ history · Esc closes"],
};

export function setTheme(name: "amber" | "phosphor") {
  const d = document.documentElement;
  if (name === "phosphor") d.dataset.theme = "phosphor";
  else delete d.dataset.theme;
  try {
    localStorage.setItem("theme", name);
  } catch {}
}

// A terminal prompt over the page: `:`, `/` or Ctrl/Cmd+K opens it (also the dock button).
// Native <dialog> gives the focus trap and Esc. Konami code anywhere toggles the phosphor theme.
export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [log, setLog] = useState<Entry[]>([GREETING]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);

  const open = () => {
    const d = dialog.current;
    if (!d || d.open) return;
    d.showModal();
    input.current?.focus();
  };

  useEffect(() => {
    const konami: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      konami.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      konami.splice(0, konami.length - KONAMI.length);
      if (konami.join() === KONAMI.join()) {
        setTheme(
          document.documentElement.dataset.theme === "phosphor"
            ? "amber"
            : "phosphor",
        );
        konami.length = 0;
      }
      const t = e.target as HTMLElement;
      const typing =
        t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if (document.documentElement.dataset.boot || dialog.current?.open) return;
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (!typing && (e.key === ":" || e.key === "/"))
      ) {
        e.preventDefault();
        open();
      }
    };
    const onOpen = () => open();
    addEventListener("keydown", onKey);
    addEventListener("palette:open", onOpen);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("palette:open", onOpen);
    };
  }, []);

  useEffect(() => {
    const out = dialog.current?.querySelector(".term-out");
    out?.scrollTo({ top: out.scrollHeight });
  }, [log]);

  const act = (a?: Action) => {
    if (!a) return;
    if (a.type === "clear") setLog([]);
    if (a.type === "close") dialog.current?.close();
    if (a.type === "nav") {
      dialog.current?.close();
      router.push(a.href);
    }
    if (a.type === "open")
      window.open(
        a.href,
        a.href.startsWith("mailto:") ? "_self" : "_blank",
        "noopener",
      );
    if (a.type === "sound")
      dispatchEvent(new CustomEvent("sound:set", { detail: a.on }));
    if (a.type === "theme") setTheme(a.name);
    if (a.type === "shake")
      dialog.current?.animate(
        [
          { translate: "0" },
          { translate: "-8px" },
          { translate: "6px" },
          { translate: "-4px" },
          { translate: "0" },
        ],
        { duration: 320, easing: "ease-out" },
      );
  };

  const submit = () => {
    const line = value;
    const r = run(line, document.documentElement.dataset.bootHome);
    if (line.trim()) history.current.push(line);
    cursor.current = -1;
    setValue("");
    if (r.action?.type !== "clear")
      setLog((l) => [...l, { cmd: line, out: r.out }]);
    act(r.action);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") return submit();
    if (e.key === "Tab") {
      e.preventDefault();
      const c = complete(value);
      if (c.length === 1) setValue(c[0] + " ");
      else if (c.length > 1)
        setLog((l) => [...l, { cmd: value, out: [c.join("   ")] }]);
      return;
    }
    const h = history.current;
    if (e.key === "ArrowUp" && h.length) {
      e.preventDefault();
      cursor.current =
        cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1);
      setValue(h[cursor.current]);
    }
    if (e.key === "ArrowDown" && cursor.current >= 0) {
      e.preventDefault();
      cursor.current = cursor.current + 1 < h.length ? cursor.current + 1 : -1;
      setValue(cursor.current < 0 ? "" : h[cursor.current]);
    }
  };

  const hints = value.trim() ? complete(value).slice(0, 6) : [];

  return (
    <>
      <button
        type="button"
        className="dock-btn"
        onClick={open}
        aria-label="Open command prompt"
        aria-keyshortcuts=": / Control+K"
      >
        <span aria-hidden="true">:</span> cmd
      </button>
      <dialog
        ref={dialog}
        className="term"
        aria-label="Command prompt"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="term-out" role="log" aria-live="polite">
          {log.map((e, i) => (
            <div key={i}>
              {e.cmd !== undefined && (
                <p>
                  <span className="term-ps">{PROMPT}</span> {e.cmd}
                </p>
              )}
              {e.out.map((line, j) => (
                <p key={j} className="term-line">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
        <label className="term-in">
          <span className="term-ps">{PROMPT}</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
        <p className="term-hint muted" aria-hidden="true">
          {hints.length
            ? hints.join("   ")
            : "help · projects · open <name> · github · mail · sound · theme"}
        </p>
      </dialog>
    </>
  );
}
