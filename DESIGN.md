---
name: prathlab
description: Pratham Nagpal's portfolio, set as a Unix manual page.
colors:
  ink: "#0a0d10"
  panel: "#12171c"
  line: "#232b33"
  text: "#e6edf3"
  muted: "#7d8a96"
  amber: "#ffb547"
  ok: "#3ddc97"
typography:
  display:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "clamp(1.9rem, 1rem + 4.2vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
spacing:
  indent: "5ch"
  indent-mobile: "2ch"
  measure: "80ch"
components:
  project-row:
    textColor: "{colors.text}"
    padding: "0.7rem 0.5ch"
  project-row-hover:
    backgroundColor: "{colors.panel}"
  chip:
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 0.75ch"
  copy-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "0 0.75ch"
  heat-tip:
    backgroundColor: "{colors.text}"
    textColor: "{colors.ink}"
    padding: "0.15rem 0.75ch"
---

# Design System: prathlab

## Overview

The site is a man page: `PRATHAM(1)` in the header and footer, uppercase section labels (NAME, SYNOPSIS, DESCRIPTION, PROJECTS, ACTIVITY, DEVICES, SEE ALSO), and indented bodies. It is one monospace family on near-black. A single amber accent marks what you can act on. Nothing decorates for its own sake: the only display moment is the name, and the only illustration is the dithered contribution calendar.

## Colors

### Primary
- **amber `#ffb547`** is for links, project refs, the heatmap ink, focus rings and selection. If it is amber, it can be clicked, or it is data.

### Secondary
- **ok `#3ddc97`** only means "running": online devices, active projects, the boot `[ OK ]`.

### Neutral
- **ink `#0a0d10`** is the page. **panel `#12171c`** is the hover fill and the heatmap cell base. **line `#232b33`** is for rules, borders and empty days.
- **text `#e6edf3`** is body copy. **muted `#7d8a96`** is for chrome, flags, summaries and legends.

### Named Rules
- **One Accent Rule:** amber carries meaning, so it never becomes a background wash or a gradient.

## Typography

Martian Mono is variable (wght, and wdth 75–112.5), loaded through `next/font`.

### Hierarchy
- **Display** (800, wdth 112.5) is only the NAME line's `h1`.
- **Label** (700, 1rem) is for section names and project titles. It is the same size as the body; weight alone separates it.
- **Body** is 15px (14px under 640px) at line-height 1.65, with tabular numerals.

## Layout

- Single column, max `80ch + 4rem`, centred. Section bodies are indented `5ch` (`2ch` on mobile), like `man(1)` output.
- Project rows are a four-column grid (`16ch 12ch 1fr auto`). At ≤640px they collapse to ref + arrow, with the summary on its own row.
- At ≤640px the header and footer show only their left ref.

## Elevation & Depth

It is flat. Depth comes only from the panel hover fill and the fixed boot overlay. There are no shadows.

## Shapes

Square by default. `4px` radius only on chips and the copy button. The heatmap draws cells as squares made of 2px dither dots.

## Components

### Project row
A whole-row link: `slug(section)` in amber, a status mark, the summary, and `->`. On hover it takes the panel fill and the arrow moves 4px. Its ref morphs into the project page title on navigation.

### Chips
The stack list on project pages uses 1px `line` borders and no fill.

### Activity heatmap (signature)
A canvas contribution calendar with a 4×4 Bayer ordered dither, where the ink level maps to contribution level (after amicro, MIT). It ripples in from today once it is visible and the boot is done. The tooltip and cursor travel between cells. Keyboard: arrows, Home/End, Escape.

### Boot overlay (login)
An ssh login plays over a rotating dithered globe (3px ordered dither, 30deg graticule). An inline script rewrites the log for the visitor's timezone: nearest edge region, great-circle latencies and login time. The globe faces that region and draws an arc to each edge as its probe line prints. It plays once per session, and any key or tap skips it. It is skipped for reduced motion and background tabs, with a CSS failsafe at 4.5s.

### Dot-field name (hero)
The NAME h1 is redrawn as a halftone dot relief (after benday, MIT): the text is rasterized, distance-transformed and sampled into a dot grid. The dots assemble from a scatter once per load, and a contour wave runs from outline to core. The relief tilts in 3D toward the pointer, and dots near the cursor lift away and turn amber. The real text stays in the DOM.

### Shaders (WebGL, optional)
- **CRT glass (intro only):** scanlines, rounded screen edge, vignette, rolling band, grain and flicker. It only darkens, so it never samples the DOM. The intro exits with a TV power-off: it collapses to a bright line, then a point.
- **Signal field (behind NAME and SYNOPSIS):** domain-warped noise, ordered-dithered in 3px cells like the heatmap, with a warm swell around the pointer. It renders at 1x, pauses offscreen and in background tabs, is a still frame under reduced motion, and is absent without WebGL.

### Sound
Off by default, with a toggle bottom-right that is remembered. A generated ambient pad sits very low. Link ticks and boot-line sounds play only while sound is on.

### Terminal cursor
Fine pointers only. At rest it is an amber block that blinks when idle. Over copy it narrows to a text-height caret. Over links and buttons it becomes a bracket frame snapped to the target. Project rows carry a dithered cover screenshot beside it.

### Figures
Project screenshots are shown as ordered dither in `--text` on ink. The black point sits at the image median, so backgrounds drop out. Hover or focus reveals the real image.

### Scramble refs
Project refs decode left to right on hover or focus (after amicro ScrambleHover, MIT).

## Motion

Tokens follow transitions.dev: stagger 40ms, micro 80ms, quick 150ms, fast 250ms, slow 400ms, very-slow 500ms, and `--ease-smooth-out` `cubic-bezier(0.22, 1, 0.36, 1)`.

- **First paint:** sections rise in (12px, 3px blur, 500ms), `--duration-micro` apart. The rise starts as the boot fades.
- **Route change:** React `<ViewTransition>`. Content slides 32px in the travel direction (`nav-forward` / `nav-back` Link types): the old content leaves in 150ms and the new arrives after it. The header stays put and crossfades its title. The project ref morphs into the page title with a mid-flight blur.
- **Small swaps:** the copy/copied swap, the SEE ALSO sibling blur, and the row arrow nudge.
- Every animation is disabled under `prefers-reduced-motion`, including the view-transition pseudo-elements.

## Do's and Don'ts

### Do:
- Keep new pages inside `ManPage` / `Section` so they read as manual pages.
- Tag internal links with `transitionTypes` (`nav-forward` deeper, `nav-back` up).
- Use the motion tokens; reach for transitions.dev patterns before custom keyframes.

### Don't:
- Don't add a second typeface, a second accent or gradients.
- Don't show a device unless it has sent a heartbeat within 10 minutes.
- Don't animate anything that has no reduced-motion fallback.

## Themes, rail, eggs

- **Themes** (`lib/theme.ts`, tokens in `globals.css`): amber (default), phosphor, solarized, blade (Marvel), los santos (GTA V), vice city (GTA VI), battle bus (Fortnite). Colours only, no game logos or fonts. Same six tokens in every theme; `--amber` is "the accent". Switch via the dock button, `theme <name>`, or eggs. Crossfades with a view transition. Every canvas/WebGL piece re-reads tokens through `onThemeChange`.
- **Right rail** (≥1400px, mirrors the clocks): homelab: devices that beat in the last 10 min, a dithered cpu trace (2h), mem and temp. Devices send readings with `scripts/heartbeat.sh`.
- **Eggs**: `hesoyam`, `wasted`, `mission`, `gta6`, `fortnite`, `gg`, `dance`, `gym`, `neofetch`, `fortune`, `sl`, `matrix`, `incident`, `sudo make me a sandwich`, Konami.

## Game themes (branch game-themes)

- **Intros**: with a game theme saved, the boot is a loading screen instead of the ssh login. `GameIntro` draws a dithered scene (4px Bayer over a small palette): los santos sunset over hills and skyline, vice city striped sun over the ocean, the battle bus crossing the sky. Titles are HTML over it (Anton / Kaushan Script / Luckiest Guy, loaded only in those themes). Exits: GTA cuts to black, the bus closes a storm eye.
- **Radio** (`lib/radio.ts`, `RadioPlayer`): original loops written for this site in each game's style, synthesized live with a step sequencer. No recordings or samples of the real songs. Two tracks per station; the dithered spectrum reads an AnalyserNode. In game themes the station replaces the ambient bed; the dock's sound toggle still silences everything.
- **Accents**: GTA wanted stars and FN shield bar fill with scroll (CSS scroll-driven), vice sunset glow along the bottom, section labels restyled per game, FN rarity edges on project rows.
- `reboot` in the prompt replays the intro.
- **Blade** (Marvel): replaces red alert. Blood-rave intro (strobes, crowd, the sprinklers, one silver slash), exit cuts the screen along the diagonal; steel labels with red underscores, blood drips from the top edge; "blood rave radio" with an acid-techno loop and a slower industrial one.
- **Real songs**: list files in `content/music.ts` (files in `public/music/<theme>/`). They play before the synth loops, advance on end, and a missing file is skipped. Commercial recordings: hosting them is the owner's call.
- **Structure per station theme** (CSS over the same markup): los santos pause-menu panels with a white selection bar; vice city neon-framed signs; battle bus plates and item-shop rarity cards for projects; blade slash dividers and a red sweep on rows.
- **Scenery** (`ThemeScenery`, behind the page): blade blood moon and bats at random; vice palms and a striped sun; los santos skyline with sweeping searchlights.
- **Cursors / tab icon**: pixel sprites per station theme (`lib/sprites.ts`: reticle, neon arrow, pickaxe, blade); the favicon follows the theme.
- **Reboot**: GTA themes show WASTED with a slow-motion boom; Fortnite shows "#N, you placed" with this week's visitor count; blade cuts the screen. Then the intro replays.
- **Name**: `--name` token; the dotted name takes the accent in station themes. Finer dot grid for legibility.
- **Fonts**: Pricedown (GTA) and Burbank Big Condensed (Fortnite) are used when installed or placed at `public/fonts/`; Anton stands in.
