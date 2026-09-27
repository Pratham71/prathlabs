---
name: make-it-yours
description: Turn a fork of this portfolio into someone else's site - name, copy, projects, time zones, easter eggs, themes, domain and deploy. Use when someone forked or cloned the repo and wants it to be their portfolio, or asks to rebrand, personalise or "make a portfolio like this".
---

# Make it yours

The site is Pratham Nagpal's. Everything personal is in a known set of places; this walks through
them in order. Work on a branch, and run the `ship-change` checks at the end.

## 1. Ask first (one message, then wait)

Get these from the person. Never invent any of them:

- full name, and the short lowercase handle for the man page (`pratham` -> `PRATHAM(1)`)
- one line on what they do (the `whatis`: "infrastructure, devops and backend")
- 2 short description paragraphs, education, experience, skills, awards, hobbies (any can be empty)
- contact email, city, time zone (IANA, e.g. `Europe/Berlin`), GitHub login
- their projects: repo URLs (you'll read the READMEs yourself)
- which themes to keep (default: all; they can also switch themes off later in /admin)
- birthday as `MM-DD` for the confetti egg, or none
- domain, if they have one

## 2. Copy and identity

| File | Change |
|---|---|
| `content/site.ts` | everything: name, manName, handle, github, githubLogin, whatis, description, education, experience, skills, awards, hobbies, email, location, timezone, birthday, url fallback |
| `content/projects/` | replace with theirs: follow the `add-project` skill per repo, delete the old `.mdx` files |
| `LICENSE` | the copyright line (keep the original notice too: MIT requires it) |
| `package.json` | `name` |
| `.env.example`, `README.md` | the site URL, the name, the deploy steps' domain |
| `PRODUCT.md`, `DESIGN.md` | rewrite PRODUCT for them (who visits, what counts as success); DESIGN stays unless they change the look |

## 3. The name in the code

These spell the handle or name directly (search `pratham`, `prathlab`, `Pratham71` to catch any new ones):

- `app/page.tsx` (the SYNOPSIS line), `app/not-found.tsx`, `app/projects/[slug]/page.tsx` (`pratham(1)` links)
- `app/opengraph-image.tsx` (`PRATHAM(1)`), `app/layout.tsx` (`keywords`, `openGraph.firstName` / `lastName`)
- `components/Boot.tsx` (each theme's intro title), `lib/boot-lines.ts` (the fake `ssh` / `man` lines)
- `components/CommandPalette.tsx` (`PROMPT`, the `sudo` password line, the console note)
- `components/AdminPanel.tsx` (`[sudo] password for ...`), `components/Man.tsx` (the licence link repo)
- `components/Quirks.tsx` (`prathlabs` on the screensaver and debug panel)
- `lib/commands.ts`: `cd`/`whoami`/`ping`/`ssh` replies and the `neofetch` card
- `scripts/heartbeat.sh` (default URL), `DEVICES` in `lib/heartbeat.ts` (their machines, or empty if no homelab)
- tests that pin the old name: `__tests__/seo.test.ts`, `__tests__/github.test.ts`, `__tests__/boot-lines.test.ts`

## 4. Places and times

- `components/WorldClock.tsx`: the clocks (their home city first).
- `components/Quirks.tsx`: `zoned("Asia/Dubai")` is where the 3am note fires, `zoned("Asia/Kolkata")`
  is the birthday's day; use their zone for both. The birthday itself is `site.birthday`.
- `lib/commands.ts`: the `3am` egg's hint mentions dubai.
- `lib/boot-lines.ts`: the edge-region table is fine as it is (it's the visitor's nearest region).

## 5. Easter eggs

`lib/commands.ts` has personal ones: `gym`, `legday`, `uptime` ("where is he at 06:00?"). Replace
them with the person's own habits or delete them (the `add-egg` skill covers the list, hints and
tests). Keep the count honest: `eggs` reports `found x/<EGGS.length>`.

## 6. Themes

Themes are game/film homages; the art is original and the names belong to their owners (the footer
says so). To drop one for good, remove it from `THEMES` in `lib/theme.ts` and follow the `add-theme`
skill's file list in reverse. To hide one without code, switch it off in /admin.

## 7. Deploy

Follow README "Deploy (Vercel)" and "Environment variables": import the repo on Vercel, connect
Upstash Redis and Blob, set `ADMIN_PASSWORD` / `ADMIN_SECRET` (generate the secret), add the domain.
Every integration is optional; the page renders with none of them.

## 8. Finish

Run the `ship-change` checks, then look at the site in amber and one game theme. Tell the person
what's still theirs to do: add a portrait (`site.portrait`), set up Spotify, upload songs in /admin.
