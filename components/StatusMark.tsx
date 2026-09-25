import type { Status } from "@/content/projects";

// Drawn marks, one 10px grid, so status never depends on a font's glyph coverage.
function Mark({ kind }: { kind: Status | "online" }) {
  if (kind === "active" || kind === "online") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill="var(--ok)" />
      </svg>
    );
  }
  if (kind === "building") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
        <path d="M5 1.25a3.75 3.75 0 0 1 0 7.5z" fill="var(--amber)" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.25 4 7.75 8.5 2.5" fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatusMark({ kind, children }: { kind: Status | "online"; children?: React.ReactNode }) {
  return (
    <span className="status">
      <Mark kind={kind} />
      {children ?? kind}
    </span>
  );
}
