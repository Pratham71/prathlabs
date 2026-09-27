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
  | { type: "login" }
  | { type: "np" }
  | { type: "shake" }
  | { type: "wanted"; clear?: true }
  | { type: "webtrail" };

export type Fx =
  | "wasted" | "passed" | "victory" | "dance" | "placed" | "slash" | "failure" | "flatline" | "tbc" | "died"
  | "siren" | "storm" | "diamond" | "spoon" | "blood" | "note";
export type Result = { out: string[]; action?: Action; egg?: string };

// The hidden commands `eggs` counts: [name it shows, clue for `hint`, other words that count as it].
export const EGGS: [string, string, ...string[]][] = [
  ["sudo", "ask for root. it won't go well."],
  ["sandwich", "xkcd 149 still works here."],
  ["rm -rf", "try deleting everything. it's fine."],
  ["vim", "open the editor nobody can quit.", "vi", "nano"],
  ["coffee", "order a hot drink.", "brew"],
  ["gym", "where is he at 06:00?", "lift"],
  ["legday", "the day nobody skips. supposedly."],
  ["uptime", "how long has he been running?"],
  ["sl", "typo ls. on purpose."],
  ["xyzzy", "a magic word from 1976."],
  ["42", "the answer to everything."],
  ["ssh", "try connecting somewhere."],
  ["redpill", "take the pill morpheus offers.", "matrix"],
  ["bluepill", "or take the other one."],
  ["whiterabbit", "the rabbit is white. one word."],
  ["nightcity", "wake up, samurai. which city?", "cyberpunk"],
  ["spiderman", "your friendly neighbourhood...", "spidey", "peter"],
  ["web", "what do web-shooters shoot?"],
  ["creeper", "the green thing that hisses.", "minecraft"],
  ["diamonds", "what every miner digs for."],
  ["daywalker", "a vampire who walks in the sun.", "blade"],
  ["garlic", "what vampires can't stand."],
  ["vampire", "is anything hiding in the homelab?", "vampires"],
  ["hesoyam", "some cheats still work in 2026."],
  ["wasted", "what gta says when you die."],
  ["passed", "mission ___. respect +", "mission"],
  ["gta6", "the one everyone is waiting for.", "gtavi", "vice", "leonida"],
  ["fortnite", "thank the ___ driver.", "bus"],
  ["drop", "where we droppin'?"],
  ["gg", "say it after every match.", "victory"],
  ["dance", "do an emote.", "emote"],
  ["konami", "up up down down left right left right b a. anywhere on the page."],
  ["rockstar", "ask the studio when the next one is out."],
  ["aezakmi", "the san andreas cheat that loses the cops."],
  ["baguvix", "the san andreas cheat for infinite health."],
  ["wanted", "say wanted. then keep saying it. five stars."],
  ["storm", "the circle is closing. what's in it?"],
  ["gamemode", "minecraft: switch yourself to creative. slash and all."],
  ["give diamond", "minecraft: /give yourself something shiny."],
  ["great power", "with great power..."],
  ["neo", "who is the one?"],
  ["trinity", "neo's partner. one word."],
  ["spoon", "there is no ___."],
  ["bats", "blade theme: click a bat. then two more."],
  ["dots", "the name is made of dots. click it five times."],
  ["screensaver", "walk away for two minutes."],
  ["3am", "visit when dubai is asleep. around 3am."],
  ["debug", "developers add ?debug to urls. try it here."],
];

// Found some other way than typing its name (the Konami code, clicking bats; wanted counts at five).
const UNTYPED = ["konami", "bats", "wanted", "dots", "screensaver", "3am", "debug"];

// Which egg a command line finds. The ones that depend on the argument are spelled out.
function eggOf(cmd: string, arg: string) {
  if (UNTYPED.includes(cmd)) return undefined;
  if (cmd === "gamemode") return MODES.includes(arg) ? "gamemode" : undefined;
  if (cmd === "give") return arg === "diamond" ? "give diamond" : undefined;
  if (cmd === "with") return arg === "great power" ? "great power" : undefined;
  if (cmd === "there") return arg === "is no spoon" ? "spoon" : undefined;
  if (cmd === "sudo") return arg === "su" || arg === "-i" ? undefined : arg === "make me a sandwich" ? "sandwich" : "sudo";
  if (cmd === "make") return arg === "me a sandwich" ? "sandwich" : undefined;
  if (cmd === "rm") return /-\w*r\w*f|-\w*f\w*r/.test(arg) ? "rm -rf" : undefined;
  return EGGS.find(([name, , ...also]) => name === cmd || also.includes(cmd))?.[0];
}

// Eggs that belong to a theme only work there; elsewhere the prompt says which theme to switch to.
// (The ones that switch themes, like hesoyam or creeper, work everywhere: they're the way in.)
const GTA: Theme[] = ["gtav", "gtavi"];
export const EGG_THEME: Record<string, Theme[]> = {
  rockstar: GTA, aezakmi: GTA, baguvix: GTA, wanted: GTA, wasted: GTA, passed: GTA,
  storm: ["fortnite"], drop: ["fortnite"], gg: ["fortnite"], dance: ["fortnite"],
  gamemode: ["minecraft"], "give diamond": ["minecraft"], diamonds: ["minecraft"],
  "great power": ["spiderman"], web: ["spiderman"],
  neo: ["matrix"], trinity: ["matrix"], spoon: ["matrix"],
  garlic: ["blade"], vampire: ["blade"],
};

// One clue per station theme, on the radio card while it's paused.
export const THEME_CLUE: Partial<Record<Theme, string>> = {
  gtav: "cheats still work: hesoyam",
  gtavi: "try: mission",
  fortnite: "try: gg",
  matrix: "try: bluepill",
  cyberpunk: "try: sudo",
  spiderman: "try: web",
  minecraft: "try: diamonds",
  blade: "try: garlic",
};

const MODES = ["survival", "creative", "adventure", "spectator"];

const FORTUNES = [
  "it works on my machine. the machine is a raspberry pi.",
  "there is no cloud. it's just someone else's homelab.",
  "a container a day keeps the dependency hell away. mostly.",
  "the best time to write the backup script was yesterday.",
  "DNS. it's always DNS.",
  "rest days are part of the program.",
  "the rabbit is white.",
  "some cheats still work in 2026.",
  "not everything here is in help. try: eggs",
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
  ["spotify", "what i'm listening to"],
  ["neofetch · fortune", "system info · a fortune"],
  ["whoami · date · ping", "the usual"],
  ["eggs · hint", "easter eggs found · a clue"],
  ["clear", "clear the screen"],
  ["exit", "close this prompt"],
];

// Words the prompt completes on Tab (first word, then project names after open/man/cd).
export const COMMANDS = ["help", "ls", "projects", "open", "man", "cd", "cat", "github", "mail", "sound", "theme", "clear", "exit", "whoami", "date", "ping", "neofetch", "fortune", "reboot", "hobbies", "radio", "spotify", "eggs", "hint"];

// `found`: eggs this visitor has. Once they have one, egg names complete too (from 3 letters, so it's a nudge,
// not a list).
export function complete(input: string, found: string[] = [], enabled: readonly Theme[] = THEMES): string[] {
  const parts = input.trimStart().split(/\s+/);
  if (parts.length <= 1) {
    const word = parts[0] ?? "";
    const eggs = found.length && word.length >= 3 ? EGGS.map(([n]) => n).filter((n) => !n.includes(" ") && !UNTYPED.includes(n)) : [];
    return [...COMMANDS, ...eggs].filter((c) => c.startsWith(word));
  }
  const [cmd, arg = ""] = parts;
  const pool =
    cmd === "open" || cmd === "man" || cmd === "cd"
      ? ["pratham", ...projects.map((p) => p.slug)]
      : cmd === "cat"
        ? ["about.txt", "contact.txt", "hobbies.txt"]
        : cmd === "sound"
          ? ["on", "off"]
          : cmd === "theme"
            ? [...enabled]
            : cmd === "radio"
              ? ["play", "pause", "next", "prev"]
              : [];
  return pool.filter((w) => w.startsWith(arg)).map((w) => `${cmd} ${w}`);
}

const pad = (s: string, n: number) => s + " ".repeat(Math.max(1, n - s.length));

// `theme`: the visitor's current theme, for the theme-bound eggs; `enabled`: the themes switched on in /admin.
// Either omitted: no gate (tests).
export function run(line: string, home = "your nearest edge", found: string[] = [], theme?: Theme, enabled: readonly Theme[] = THEMES): Result {
  const [raw = "", ...rest] = line.trim().split(/\s+/);
  const cmd = raw.replace(/^\/(?=\w)/, ""); // "/give", "/gamemode": minecraft-style, slash optional
  const arg = rest.join(" ").toLowerCase();
  const egg = eggOf(cmd.toLowerCase(), arg);
  const only = EGG_THEME[egg ?? cmd.toLowerCase()]?.filter((t) => enabled.includes(t));
  // an egg whose themes are all switched off doesn't exist
  if (only && !only.length) return { out: [`command not found: ${cmd}. Try: help`] };
  if (theme && only && !only.includes(theme))
    return { out: [`${cmd}: only works in ${only.map((t) => THEME_LABEL[t]).join(" or ")}. try: theme ${only[0]}`] };
  const r = answer(cmd, rest.join(" "), home, found, enabled);
  // eggs and `theme` can't take anyone to a theme that's switched off
  if (r.action?.type === "theme" && !enabled.includes(r.action.name))
    return { out: [cmd.toLowerCase() === "theme" ? `theme: no such theme '${r.action.name}'. try: theme` : `command not found: ${cmd}. Try: help`] };
  return egg ? { ...r, egg } : r;
}

function answer(cmd: string, arg: string, home: string, found: string[], enabled: readonly Theme[]): Result {
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
    case "reply":
    case "eta":
      return { out: [`i reply ${site.responseTime} (${site.timezone}).`] };
    case "sound":
      if (arg === "on" || arg === "off") return { out: [`sound ${arg}`], action: { type: "sound", on: arg === "on" } };
      return { out: ["usage: sound on|off"] };
    case "theme":
      if (isTheme(arg)) return { out: [`theme: ${THEME_LABEL[arg]}`], action: { type: "theme", name: arg } };
      return { out: [...enabled.map((t) => `${pad(t, 10)}${THEME_LABEL[t] === t ? "" : THEME_LABEL[t]}`), "usage: theme <name>"] };
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
      return { out: [`PING prathlabs.com: 64 bytes from ${home}: time=2 ms`] };
    case "eggs": {
      const cells = EGGS.map(([n]) => pad(found.includes(n) ? n : "???", 14));
      const rows = [];
      for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4).join("").trimEnd());
      const got = EGGS.filter(([n]) => found.includes(n)).length;
      return { out: [`found ${got}/${EGGS.length}${got ? "" : ". stuck? try: hint"}`, ...rows] };
    }
    case "hint": {
      // not found yet, and not tied to themes that are all switched off
      const left = EGGS.filter(([n]) => !found.includes(n) && (!EGG_THEME[n] || EGG_THEME[n].some((t) => enabled.includes(t))));
      if (!left.length) return { out: ["all found. go touch grass."] };
      const [name, clue] = left[Math.floor(Math.random() * left.length)];
      const only = EGG_THEME[name];
      return { out: [`hint: ${only ? `(${THEME_LABEL[only[0]]}) ` : ""}${clue}`] };
    }
    // --- easter eggs ---
    case "spotify":
    case "np":
      return { out: ["checking spotify..."], action: { type: "np" } };
    // the way into /admin: asks for ADMIN_PASSWORD (checked server-side)
    case "su":
      return { out: [], action: { type: "login" } };
    case "sudo":
      if (arg === "make me a sandwich") return { out: ["okay."] };
      if (arg === "su" || arg === "-i") return { out: [], action: { type: "login" } };
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
    case "redpill":
      return { out: ["wake up, visitor..."], action: { type: "theme", name: "matrix" } };
    case "bluepill":
      return { out: ["the story ends. you wake up in your bed."], action: { type: "theme", name: "amber" } };
    case "whiterabbit":
      return { out: ["follow it: type matrix."] };
    case "cyberpunk":
    case "nightcity":
      return { out: ["night city never sleeps. neither does the homelab."], action: { type: "theme", name: "cyberpunk" } };
    case "spiderman":
    case "spidey":
    case "peter":
      return { out: ["web-shooters loaded. mind the gap between buildings."], action: { type: "theme", name: "spiderman" } };
    case "web":
      return { out: ["thwip."] };
    case "minecraft":
    case "creeper":
      return { out: ["sss... (it's fine. this page is blast-resistant.)"], action: { type: "theme", name: "minecraft" } };
    case "diamonds":
      return { out: ["found 0 diamonds at y=-58. keep digging."] };
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
    case "rockstar":
      return { out: ["gta vi release date: yes."] };
    case "aezakmi":
      return { out: ["cheat activated: wanted level cleared."], action: { type: "wanted", clear: true } };
    case "baguvix":
      return { out: ["cheat activated: infinite health. (the homelab still needs backups.)"] };
    case "wanted":
      return { out: [], action: { type: "wanted" } };
    case "storm":
      return { out: ["the storm is closing in. get to the circle."], action: { type: "fx", name: "storm" } };
    case "gamemode": {
      const mode = arg.toLowerCase();
      if (!MODES.includes(mode)) return { out: ["usage: /gamemode survival|creative|adventure|spectator"] };
      return { out: [`Set own game mode to ${mode[0].toUpperCase()}${mode.slice(1)} Mode`] };
    }
    case "give":
      return arg.toLowerCase() === "diamond"
        ? { out: ["Gave 1 [Diamond] to visitor"], action: { type: "fx", name: "diamond" } }
        : { out: [`Unknown item '${arg || "?"}'. try: /give diamond`] };
    case "with":
      return arg.toLowerCase() === "great power"
        ? { out: ["comes great responsibility.", "(your cursor spins webs now. spider-man theme only.)"], action: { type: "webtrail" } }
        : { out: [`command not found: ${cmd}. Try: help`] };
    case "neo":
      return { out: ["whoa."] };
    case "trinity":
      return { out: ["dodge this."] };
    case "spoon":
    case "there":
      return cmd === "spoon" || arg.toLowerCase() === "is no spoon"
        ? { out: ["then it's not the spoon that bends. it's the page."], action: { type: "fx", name: "spoon" } }
        : { out: [`command not found: ${cmd}. Try: help`] };
    default:
      return { out: [`command not found: ${cmd}. Try: help`] };
  }
}

// Up Up Down Down Left Right Left Right B A
export const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
