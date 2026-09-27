---
name: add-egg
description: Add, change or remove a hidden easter-egg command in the site's command prompt (the ones `eggs` counts and `hint` clues). Use when asked for a new easter egg, secret command, cheat code or hidden interaction.
---

# Add an easter egg

All in `lib/commands.ts` unless it needs a visual effect.

1. **Register it** in `EGGS`: `[name, hint, ...aliases]`. The name is what `eggs` shows; the hint is
   one lowercase line for `hint` (a clue, not the answer); aliases also count (`["vim", "...", "vi", "nano"]`).
   Names must be unique (a test checks).
2. **Answer it** in `answer()`: a `case "<name>":` returning `{ out: [...lines] }`, optionally with an
   `action`: `{ type: "theme", name }` to switch theme, `{ type: "fx", name }` for a full-screen
   effect, `{ type: "nav", href }` to go somewhere.
3. **Multi-word eggs** (`give diamond`, `there is no spoon`) are matched in `eggOf()`: add a line
   that checks the argument.
4. **Theme-only eggs**: add it to `EGG_THEME` (`name: ["<theme>"]`). Outside that theme the prompt
   says which theme to switch to. Eggs that *switch to* a theme should work everywhere; don't gate them.
5. **Eggs found without typing** (a click, idle time, a date): add the name to `UNTYPED` and
   dispatch `dispatchEvent(new CustomEvent("egg", { detail: { name, text } }))` from the component;
   the palette records it.
6. **A visual effect**: add the name to `Fx`, handle it in `playFx()` in
   `components/CommandPalette.tsx`, and style it in `app/globals.css` with a reduced-motion version.
   A sound for it: `lib/audio.ts` (synth), or an uploadable one via `EGG_SOUNDS` in `lib/settings.ts`.

## Rules

- Keep replies short, lowercase, and kind to the visitor. No references that need the owner's
  private life explained.
- Never break the page: an egg can't hide content for more than a few seconds or trap focus.
- `llms.txt` mentions the egg count only; don't list answers anywhere public.

## Check

`npx jest __tests__/commands.test.ts` (uniqueness, `eggs` count, `hint`, completion), then try it in
the prompt: the command, `eggs` before and after, `hint`, and Tab completion.
