import { projects } from "@/content/projects";
import { site } from "@/content/site";

export type Action =
  | { type: "nav"; href: string }
  | { type: "open"; href: string }
  | { type: "sound"; on: boolean }
  | { type: "theme"; name: "amber" | "phosphor" }
  | { type: "clear" }
  | { type: "close" }
  | { type: "shake" };

export type Result = { out: string[]; action?: Action };

const HELP: [string, string][] = [
  ["help", "this list"],
  ["ls", "list what's here"],
  ["projects", "list projects"],
  ["open <name>", "open a project (or: man <name>)"],
  ["cat about.txt", "who this is"],
  ["github", "open github profile"],
  ["mail", "how to reach me"],
  ["sound on|off", "ambient sound"],
  ["theme amber|phosphor", "switch colours"],
  ["clear", "clear the screen"],
  ["exit", "close this prompt"],
];

// Words the prompt completes on Tab (first word, then project names after open/man/cd).
export const COMMANDS = ["help", "ls", "projects", "open", "man", "cd", "cat", "github", "mail", "sound", "theme", "clear", "exit", "whoami", "date", "ping"];

export function complete(input: string): string[] {
  const parts = input.trimStart().split(/\s+/);
  if (parts.length <= 1) return COMMANDS.filter((c) => c.startsWith(parts[0] ?? ""));
  const [cmd, arg = ""] = parts;
  const pool =
    cmd === "open" || cmd === "man" || cmd === "cd"
      ? ["pratham", ...projects.map((p) => p.slug)]
      : cmd === "cat"
        ? ["about.txt", "contact.txt"]
        : cmd === "sound"
          ? ["on", "off"]
          : cmd === "theme"
            ? ["amber", "phosphor"]
            : [];
  return pool.filter((w) => w.startsWith(arg)).map((w) => `${cmd} ${w}`);
}

const pad = (s: string, n: number) => s + " ".repeat(Math.max(1, n - s.length));

export function run(line: string, home = "your nearest edge"): Result {
  const input = line.trim();
  const [cmd = "", ...rest] = input.split(/\s+/);
  const arg = rest.join(" ");
  const project = (name: string) => projects.find((p) => p.slug === name.toLowerCase() || p.name.toLowerCase() === name.toLowerCase());

  switch (cmd.toLowerCase()) {
    case "":
      return { out: [] };
    case "help":
    case "?":
      return { out: HELP.map(([c, d]) => `  ${pad(c, 22)}${d}`) };
    case "ls":
      return { out: ["projects/   about.txt   contact.txt"] };
    case "projects":
      return { out: projects.map((p) => `  ${pad(`${p.slug}(${p.section})`, 14)}${pad(p.status, 10)}${p.summary}`) };
    case "open":
    case "man":
    case "cd": {
      if (!arg || arg === "~" || arg === "/" || arg.toLowerCase() === "pratham") return { out: ["-> pratham(1)"], action: { type: "nav", href: "/" } };
      if (arg === "projects" || arg === "projects/") return run("projects");
      const p = project(arg.replace(/\(\d\)$/, ""));
      return p
        ? { out: [`-> ${p.slug}(${p.section})`], action: { type: "nav", href: `/projects/${p.slug}` } }
        : { out: [`No manual entry for ${arg}. Try: projects`] };
    }
    case "cat":
      if (arg === "about.txt") return { out: site.description };
      if (arg === "contact.txt") return run("mail");
      return { out: [`cat: ${arg || "(nothing)"}: No such file`] };
    case "github":
      return { out: [`-> ${site.github}`], action: { type: "open", href: site.github } };
    case "mail":
    case "contact":
      return site.email
        ? { out: [`-> ${site.email}`], action: { type: "open", href: `mailto:${site.email}` } }
        : { out: ["mail isn't public yet; reach me through github(1) for now."] };
    case "sound":
      if (arg === "on" || arg === "off") return { out: [`sound ${arg}`], action: { type: "sound", on: arg === "on" } };
      return { out: ["usage: sound on|off"] };
    case "theme":
      if (arg === "amber" || arg === "phosphor") return { out: [`theme: ${arg}`], action: { type: "theme", name: arg } };
      return { out: ["usage: theme amber|phosphor"] };
    case "clear":
      return { out: [], action: { type: "clear" } };
    case "exit":
    case "quit":
    case "q":
    case ":q":
    case ":wq":
      return { out: [], action: { type: "close" } };
    case "whoami":
      return { out: ["visitor. (the man page is about pratham)"] };
    case "date":
      return { out: [new Date().toString()] };
    case "ping":
      return { out: [`PING prathlab.com: 64 bytes from ${home}: time=2 ms`] };
    // --- easter eggs ---
    case "sudo":
      return { out: ["pratham is not in the sudoers file. This incident will be reported."] };
    case "rm":
      return /-\w*r\w*f|-\w*f\w*r/.test(arg)
        ? { out: ["rm: /projects is mounted read-only. nice try."], action: { type: "shake" } }
        : { out: [`rm: cannot remove '${arg || "?"}': Permission denied`] };
    case "vim":
    case "vi":
    case "nano":
      return { out: ["you are now trapped in vim. (kidding: type exit)"] };
    case "coffee":
    case "brew":
      return { out: ["418 I'm a teapot"] };
    case "hello":
    case "hi":
      return { out: ["hi. try: help"] };
    case "uptime":
      return { out: ["up since 2006, load average: coffee, code, homelab"] };
    default:
      return { out: [`command not found: ${cmd}. Try: help`] };
  }
}

// Up Up Down Down Left Right Left Right B A
export const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
