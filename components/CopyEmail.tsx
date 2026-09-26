"use client";

import { useState } from "react";

// Copy → copied swap (transitions.dev icon swap; after amicro "Copy Hash").
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <button type="button" className="copy" onClick={copy} aria-label={`Copy ${email}`}>
      <span data-shown={!copied}>copy</span>
      <span data-shown={copied} aria-live="polite">
        {copied ? "copied" : ""}
      </span>
    </button>
  );
}
