# PrathLabs Website Design Spec
**Date:** 2026-06-23  
**Domain:** prathlabs.com  
**Stack:** Next.js (App Router), hosted on Vercel

---

## Purpose

A fun, joke website for prathlabs.com. The entire point is to rickroll visitors. No real content — just vibes.

---

## Architecture

Single Next.js app, one route (`/`). All logic lives in a single page component managing three UI states via React `useState`. One API route handles the visitor counter.

```
prathlabs-website/
├── app/
│   ├── page.tsx          # Main page — all three states
│   ├── layout.tsx        # Root layout with Analytics + SpeedInsights
│   └── api/
│       └── visitors/
│           └── route.ts  # GET: fetch count, POST: increment + return count
├── lib/
│   └── kv.ts             # Vercel KV client helper
└── public/               # Any static assets
```

---

## Page States

### State 1: Gate

- Full-screen dark background
- Centered "PrathLabs" wordmark and tagline
- Single glowing "Enter" button
- Clicking Enter → transitions to State 2 (rickroll)
- Keeps illusion of a legitimate site to maximize rickroll effectiveness

### State 2: Rickroll

- Fullscreen YouTube iframe embed of Rick Astley — Never Gonna Give You Up
- Auto-plays with sound (user-initiated click bypasses browser autoplay restrictions)
- Small "Skip »" button in bottom-right corner (styled like a YouTube ad skip button)
- Clicking Skip → transitions to State 3 (under construction)

### State 3: Under Construction

Classic early-internet aesthetic:

- Tiled/gaudy background (CSS — starfield or checkerboard pattern)
- Animated "UNDER CONSTRUCTION" banner (CSS animation, no external GIFs)
- Blinking text: "🚧 PrathLabs is under construction 🚧"
- **Real visitor counter** — fetches live count from Vercel KV via `/api/visitors`
- Marquee-style scrolling text: "Coming Soon... Maybe... Probably Not..."
- Footer: "Best viewed in Internet Explorer 6"

---

## Visitor Counter

- **Storage:** Vercel KV (Redis-compatible, native Vercel integration)
- **API route:** `app/api/visitors/route.ts`
  - `POST` — atomically increments `visitors` key in KV, returns new count
  - `GET` — returns current count without incrementing
- **Page behavior:** On mount of State 3, fires a `POST` to increment then displays the returned count
- **Display:** Styled as a retro hit counter, zero-padded to 6 digits (e.g., `000042`)

---

## Vercel Integrations

- `@vercel/analytics` — installed in root `layout.tsx`, tracks page views in Vercel dashboard
- `@vercel/speed-insights` — installed in root `layout.tsx`, tracks Core Web Vitals in Vercel dashboard

---

## Styling

- Tailwind CSS for layout and utilities
- Inline styles or CSS modules for the retro under-construction effects (blinking, marquee, tiled bg)
- No component library needed — this is intentionally janky

---

## Favicon

- "PL" monogram, generated as an SVG favicon
- Dark background, clean sans-serif letters — matches the gate screen aesthetic
- Placed in `app/icon.svg` (Next.js App Router picks it up automatically)

---

## Mobile

The site must work on mobile. Key considerations:
- Gate and under-construction screens use Tailwind flex centering — naturally responsive
- Rickroll iframe must use `100dvh` (dynamic viewport height) so it fills the screen correctly on mobile browsers where the URL bar takes up space
- Under-construction font sizes should scale down on small screens using Tailwind responsive prefixes (`text-2xl md:text-4xl`, etc.)
- `body { overflow: hidden }` applies only during gate/rickroll states; under-construction overrides it with `overflow: auto` so content is scrollable on small screens

---

## Out of Scope

- Authentication
- Any real content or links
- Multiple pages or routes
