---
name: add-theme
description: Add a new station theme (a game or film homage with its own colours, intro, radio station, cursor, scenery, reboot screen and eggs) to this portfolio. Use when asked to add, create or build a theme, or to remove one.
---

# Add a theme

A theme is an id in `THEMES` plus a slot in each system below. Copy an existing theme that's
closest in spirit (`minecraft` is the simplest; `gtav` / `fortnite` have background events) and
change it piece by piece. All art is drawn in code and must be original: homage, never traced.

Id: short, lowercase, `[a-z]` (`gtavi`, `spiderman`). Label: what people call it ("vice city").

## Required (the theme won't hold together without these)

1. **`lib/theme.ts`**: add the id to `THEMES` (order = dock cycle order) and its `THEME_LABEL`.
2. **`app/globals.css`**, colour tokens: a `html[data-theme="<id>"] { --ink ... --amber ... }` block
   next to the others (the six tokens are the same everywhere; `--amber` means "the accent"). Check
   WCAG AA for `--text` and `--muted` on `--ink`.
3. **Intro**, two parts:
   - `components/Boot.tsx`: the title markup (`<div className="gi gi-<id>">`), styled in
     `globals.css` under `.gi-<id>`.
   - `components/GameIntro.tsx`: a `SCENES.<id>` entry, a small palette plus an `at(x, y, t, a)`
     function returning a palette position; it's drawn as 4x4 Bayer dither.
4. **Radio**: `lib/radio.ts` `STATIONS.<id>` with a station name and two synth tracks (the step
   notation is documented at the top of the file).
5. **Reboot**: the `<id>` branch in `reboot()` in `components/CommandPalette.tsx` (an fx plus a sting),
   the fx's CSS, and `REBOOT_SOUNDS.<id>` in `content/music.ts` (a file in `public/sfx`, or leave it
   out for the synth sting). New stings go in `Sting` in `lib/audio.ts`.
6. **Cursor**: `lib/sprites.ts` `DRAW.<id>` (hot spot and a draw function on a small canvas).

## Optional, but they're what make a theme feel alive

- **Scenery**: `components/ThemeScenery.tsx`, the static layer (drawn once) and the moving layer
  (`moving` list). Big events live in `components/scenes.ts` (half-resolution canvas, blown up 2x).
- **Page structure**: per-theme CSS that reshapes sections (see the minecraft "GUI panels" block).
- **Display font**: `app/layout.tsx` (preload off, so only this theme pays for it).
- **Eggs**: a word that switches to the theme from anywhere (`creeper`, `hesoyam`), eggs that only
  work inside it (`EGG_THEME`), and a `THEME_CLUE` for the radio card. See the `add-egg` skill.

## Check

- `npx jest`: the commands tests cover `theme <id>`, completion and the egg list.
- Look at it: intro (clear `sessionStorage["boot-seen"]`), page, radio, reboot, at 1440px and 390px,
  and with `prefers-reduced-motion` (everything should hold still). Then the `ship-change` skill.

## Removing a theme

Reverse the list: `THEMES` / `THEME_LABEL`, its CSS blocks (search `data-theme="<id>"` and
`.gi-<id>`), `SCENES`, `STATIONS`, the reboot branch, `REBOOT_SOUNDS`, `DRAW`, scenery, `MUSIC`,
eggs and clues. `npx tsc --noEmit` catches the `Record<Theme, ...>` maps you missed.
