<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# What this repo is

A personal portfolio written as a Unix man page (`PRATHAM(1)`): one monospace family, near-black, one
accent, dithered canvases, a command prompt with hidden easter eggs, and eight game/film "station
themes" (each with an intro, radio, cursor, scenery and reboot screen). MIT licensed, and meant to be
forked: the skills below turn it into someone else's site.

Read before changing anything visual: `DESIGN.md` (the design system) and `PRODUCT.md` (who the site
is for, and what it must never fake).

# Skills

Step-by-step guides for the common jobs, in `.claude/skills/<name>/SKILL.md`. Claude Code loads them
on its own; any other agent (Codex, Cursor, Copilot...) should open the matching file and follow it.

| Skill | Use it to |
|---|---|
| `make-it-yours` | fork this into your own portfolio: name, copy, projects, time zones, eggs, deploy |
| `add-project` | add a project (home row, its page, sitemap, llms.txt, JSON-LD) |
| `add-theme` | add or remove a station theme (tokens, intro, radio, cursor, scenery, reboot, eggs) |
| `add-egg` | add a hidden command to the prompt |
| `add-music` | songs and sounds for the themes (through the /admin panel) |
| `ship-change` | the checks CI runs, the visual check, and how to ship |

# Map

| Path | What |
|---|---|
| `content/site.ts` | every line of home-page copy, the name, email, time zone, birthday |
| `content/projects/` | `index.ts` (the list) + one `<slug>.mdx` per project |
| `content/music.ts` | songs per theme and reboot sounds |
| `app/page.tsx`, `components/Man.tsx` | the man page layout and its sections |
| `lib/theme.ts`, `app/globals.css` | themes: ids, labels, CSS tokens per `html[data-theme]` |
| `components/Boot.tsx`, `components/GameIntro.tsx`, `lib/boot-lines.ts` | the intro (terminal boot, and each theme's scene) |
| `lib/commands.ts`, `components/CommandPalette.tsx` | the prompt: commands, eggs, reboot effects |
| `lib/radio.ts`, `components/RadioPlayer.tsx`, `lib/audio.ts` | synth stations, the player, all Web Audio |
| `components/ThemeScenery.tsx`, `components/scenes.ts`, `components/spidey.ts`, `lib/sprites.ts` | background scenes and events (spidey.ts: the suits, villains and web-swing physics), cursors |
| `lib/settings.ts`, `lib/admin.ts`, `app/admin`, `app/api/admin` | the admin panel and the settings it saves |
| `lib/seo.ts`, `app/sitemap.ts`, `app/robots.txt`, `app/llms.txt` | structured data, sitemap, robots, llms.txt |
| `lib/dither.ts` | the ordered-dither helper the canvases use (`inked()`) |

# How it works (the parts that surprise people)

- **Settings reach the browser inline.** /admin saves to Upstash Redis; the layout inlines them as
  `window.__site`, read with `clientSettings()` (`lib/client-settings.ts`). No client fetch, no rebuild.
- **Every integration is optional.** Missing env vars switch a feature off (no Redis: no globe or
  admin saves; no Spotify: no "now playing"). The page always renders. Keep it that way.
- **Theme gating.** A theme switched off in /admin is unreachable: `setTheme()` refuses it and the
  prompt hides it. Eggs listed in `EGG_THEME` only work inside their theme.
- **Canvas art is procedural.** Sprites are strings of palette letters; scenes are drawn in cells and
  dithered. No image assets for themes, and all of it is original drawing (never trace a game's art).
- **CSP** lives in `next.config.ts`. A new third-party script, frame, image or media host must be
  added there or the browser blocks it.
- **Audio files never go in git.** `public/music/**` audio is git-ignored; songs are uploaded through
  /admin (Vercel Blob). Hosting a commercial song anywhere needs a licence from its owners.

# Conventions

- Match the surrounding code: short, lowercase UI copy, comments that say why, no new dependencies
  for what a few lines can do.
- React lint rules in force: no `setState` inside effects (derive at render), no mutating values that
  come from props or state (`el.dataset.x = ...` in a handler trips it; use `setAttribute`).
- `prefers-reduced-motion`: every animation has a still version. Status is a shape plus a word,
  never colour alone. Keyboard reaches everything.
- Never invent facts about the owner: projects, numbers and status come from real sources.
