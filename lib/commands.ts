import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { THEMES, THEME_LABEL, isTheme, type Theme } from "@/lib/theme";

export type Action =
  | { type: "nav"; href: string }
  | { type: "open"; href: string }
  | { type: "sound"; on: boolean }
  | { type: "theme"; name: Theme }
  | { type: "fx"; name: Fx }
  | { type: "clear" }
  | { type: "reboot" }
  | { type: "radio"; op: "play" | "pause" | "next" | "prev" }
  | { type: "close" }
  | { type: "shake" };

export type Fx = "wasted" | "passed" | "victory" | "dance" | "placed" | "slash";
export type Result = { out: string[]; action?: Action };

const FORTUNES = [
  "it works on my machine. the machine is a raspberry pi.",
  "there is no cloud. it's just someone else's homelab.",
  "a container a day keeps the dependency hell away. mostly.",
  "the best time to write the backup script was yesterday.",
  "DNS. it's always DNS.",
  "rest days are part of the program.",
];

const HELP: [string, string][] = [
  ["help", "this list"],
  ["ls", "list what's here"],
  ["projects", "list projects"],
  ["open <name>", "open a project (or: man <name>)"],
  ["cat about.txt", "who this is"],
  ["hobbies", "off the keyboard"],
  ["github", "open github profile"],
  ["mail", "how to reach me"],
  ["sound on|off", "ambient sound"],
  ["theme [name]", "switch colours (theme lists them)"],
  ["radio play|pause|next", "the station (game themes)"],
  ["reboot", "replay the intro"],
  ["neofetch · fortune", "system info · a fortune"],
  ["whoami · date · ping", "the usual"],
  ["clear", "clear the screen"],
  ["exit", "close this prompt"],
];

// Words the prompt completes on Tab (first word, then project names after open/man/cd).
export const COMMANDS = ["help", "ls", "projects", "open", "man", "cd", "cat", "github", "mail", "sound", "theme", "clear", "exit", "whoami", "date", "ping", "neofetch", "fortune", "reboot", "hobbies", "radio"];

export function complete(input: string): string[] {
  const parts = input.trimStart().split(/\s+/);
  if (parts.length <= 1) return COMMANDS.filter((c) => c.startsWith(parts[0] ?? ""));
  const [cmd, arg = ""] = parts;
  const pool =
    cmd === "open" || cmd === "man" || cmd === "cd"
      ? ["pratham", ...projects.map((p) => p.slug)]
      : cmd === "cat"
        ? ["about.txt", "contact.txt", "hobbies.txt"]
        : cmd === "sound"
          ? ["on", "off"]
          : cmd === "theme"
            ? [...THEMES]
            : cmd === "radio"
              ? ["play", "pause", "next", "prev"]
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
      return { out: HELP.map(([c, d]) => `${pad(c, 22)}${d}`) };
    case "ls":
      return { out: ["projects/   about.txt   contact.txt   hobbies.txt"] };
    case "projects":
      return { out: projects.map((p) => `${pad(`${p.slug}(${p.section})`, 14)}${pad(p.status, 10)}${p.summary}`) };
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
      if (arg === "hobbies.txt") return run("hobbies");
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
      if (isTheme(arg)) return { out: [`theme: ${THEME_LABEL[arg]}`], action: { type: "theme", name: arg } };
      return { out: [...THEMES.map((t) => `${pad(t, 10)}${THEME_LABEL[t] === t ? "" : THEME_LABEL[t]}`), "usage: theme <name>"] };
    case "clear":
      return { out: [], action: { type: "clear" } };
    case "hobbies":
      return { out: site.hobbies.map(([flag, what]) => `${pad(flag, 10)}${what}`) };
    case "radio":
      if (arg === "play" || arg === "pause" || arg === "next" || arg === "prev") return { out: [], action: { type: "radio", op: arg } };
      return { out: ["usage: radio play|pause|next|prev (in a game theme)"] };
    case "reboot":
    case "intro":
    case "replay":
      return { out: ["broadcast message: the system is going down for reboot NOW"], action: { type: "reboot" } };
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
      if (arg === "make me a sandwich") return { out: ["okay."] };
      return { out: ["pratham is not in the sudoers file. This incident will be reported."] };
    case "make":
      return arg === "me a sandwich" ? { out: ["what? make it yourself."] } : { out: [`make: *** No rule to make target '${arg || "all"}'. Stop.`] };
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
      return { out: ["418 I'm a teapot. (no coffee here; pre-workout only)"] };
    case "gym":
    case "lift":
      return { out: ["gym.service: active (running) since 06:00", "rest timer: 90s. phone: away. form: before ego."] };
    case "legday":
      return { out: ["skipping leg day is not a supported configuration."] };
    case "hello":
    case "hi":
      return { out: ["hi. try: help"] };
    case "uptime":
      return { out: ["up since 2006, load average: gym, code, homelab"] };
    case "neofetch":
      return {
        out: [
          " ___     visitor@prathlab",
          "| . |    ----------------",
          "|  _|    os: man-page 1.0 (next.js)",
          "|_|      host: " + home,
          "         shell: this prompt",
          "         theme: see `theme`",
          "         cpu: one raspberry pi, one home server",
          "         ram: enough. never enough.",
        ],
      };
    case "fortune":
      return { out: [FORTUNES[Math.floor(Math.random() * FORTUNES.length)]] };
    case "sl":
      return { out: ["choo choo. (you meant ls)", ...run("ls").out] };
    case "xyzzy":
      return { out: ["nothing happens."] };
    case "42":
      return { out: ["the answer. still working on the question."] };
    case "ssh":
      return { out: [`ssh: connect to host ${arg || "prathlab"} port 22: you're already here.`] };
    case "matrix":
      return { out: ["wake up, visitor..."], action: { type: "theme", name: "phosphor" } };
    case "blade":
    case "daywalker":
      return { out: ["sunlight: not a problem. sunglasses: on."], action: { type: "theme", name: "blade" } };
    case "garlic":
      return { out: ["allergic reaction avoided. this site is daywalker-safe."] };
    case "vampire":
    case "vampires":
      return { out: ["scanning... 0 vampires found. homelab is uv-lit."] };
    // --- games ---
    case "hesoyam":
      return { out: ["cheat activated: health, armor, $250k."], action: { type: "theme", name: "gtav" } };
    case "wasted":
      return { out: ["wasted."], action: { type: "fx", name: "wasted" } };
    case "mission":
    case "passed":
      return { out: ["mission passed. respect +"], action: { type: "fx", name: "passed" } };
    case "gta6":
    case "gtavi":
    case "vice":
    case "leonida":
      return { out: ["loading leonida... it'll be worth the wait."], action: { type: "theme", name: "gtavi" } };
    case "fortnite":
    case "bus":
      return { out: ["thank the bus driver."], action: { type: "theme", name: "fortnite" } };
    case "drop":
      return { out: ["where we droppin'? (the homelab. it's always the homelab.)"] };
    case "gg":
    case "victory":
      return { out: ["#1 victory royale"], action: { type: "fx", name: "victory" } };
    case "dance":
    case "emote":
      return { out: ["*default dance*"], action: { type: "fx", name: "dance" } };
    default:
      return { out: [`command not found: ${cmd}. Try: help`] };
  }
}

// Up Up Down Down Left Right Left Right B A
export const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
