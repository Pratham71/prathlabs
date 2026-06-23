# PrathLabs Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fun rickroll website for prathlabs.com — gate screen → fullscreen Rick Astley → retro under-construction page with a real visitor counter.

**Architecture:** Single Next.js 15 App Router app, one route, three UI states managed via React `useState`. Vercel KV stores the visitor count incremented server-side via an API route. Vercel Analytics and Speed Insights live in the root layout.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, @vercel/kv, @vercel/analytics, @vercel/speed-insights, Jest + ts-jest

## Global Constraints

- Next.js 15, App Router only — no Pages Router
- TypeScript strict mode
- Tailwind CSS for layout/utilities; CSS keyframes for retro effects
- No component library
- Hosted on Vercel — KV env vars provided by Vercel Storage integration
- YouTube video ID: `dQw4w9WgXcQ` (Never Gonna Give You Up)

---

### Task 1: Scaffold the Project

**Files:**
- Create: `prathlabs-website/` (via create-next-app)
- Modify: `package.json` (Vercel deps added)
- Create: `.env.local` (KV placeholder)
- Modify: `app/page.tsx` (clear boilerplate)
- Modify: `app/globals.css` (clear boilerplate)

**Interfaces:**
- Produces: working `npm run dev` at http://localhost:3000 with all deps installed

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest prathlabs-website --typescript --tailwind --app --no-src-dir --no-import-alias --yes
cd prathlabs-website
```

Expected: project created with `app/`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 2: Install Vercel dependencies**

```bash
npm install @vercel/analytics @vercel/speed-insights @vercel/kv
```

Expected: packages added to `node_modules/`, `package.json` updated

- [ ] **Step 3: Create .env.local for local KV dev**

Create `.env.local`:
```
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
```

Note: real values come from Vercel dashboard → Storage → KV → `.env.local` download. Leave as placeholders for now — KV calls will gracefully fail locally and show `??????` in the UI.

- [ ] **Step 4: Remove Next.js boilerplate**

Replace `app/page.tsx` with:
```tsx
export default function Home() {
  return <div>placeholder</div>;
}
```

Delete `public/vercel.svg` and `public/next.svg` and `app/favicon.ico`.

Replace `app/globals.css` with:
```css
@import "tailwindcss";
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000, shows "placeholder" text with no console errors

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with Vercel deps"
```

---

### Task 2: Favicon + Root Layout

**Files:**
- Create: `app/icon.svg`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `@vercel/analytics/react` → `{ Analytics }`, `@vercel/speed-insights/next` → `{ SpeedInsights }`
- Produces: `RootLayout` wrapping all pages with analytics; `icon.svg` served as favicon automatically by Next.js

- [ ] **Step 1: Create the PL monogram favicon**

Create `app/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial, sans-serif" font-weight="700" font-size="14"
    fill="#ffffff" letter-spacing="1">PL</text>
</svg>
```

- [ ] **Step 2: Write the root layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrathLabs",
  description: "Welcome to PrathLabs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify favicon appears**

```bash
npm run dev
```

Open http://localhost:3000 in browser. Check browser tab for "PL" favicon and title "PrathLabs".

- [ ] **Step 4: Commit**

```bash
git add app/icon.svg app/layout.tsx
git commit -m "feat: add PL favicon and root layout with Vercel analytics"
```

---

### Task 3: Visitor Counter API

**Files:**
- Create: `lib/kv.ts`
- Create: `app/api/visitors/route.ts`
- Create: `__tests__/api/visitors.test.ts`
- Create: `jest.config.ts`

**Interfaces:**
- Consumes: `@vercel/kv` → `{ kv }` with `.get<number>(key)` and `.incr(key)` methods
- Produces:
  - `GET /api/visitors` → `NextResponse` with body `{ count: number }`
  - `POST /api/visitors` → `NextResponse` with body `{ count: number }` (incremented)

- [ ] **Step 1: Install Jest**

```bash
npm install -D jest @types/jest ts-jest
```

- [ ] **Step 2: Create jest.config.ts**

```ts
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
```

- [ ] **Step 3: Write the failing test**

Create `__tests__/api/visitors.test.ts`:
```ts
import { GET, POST } from "@/app/api/visitors/route";
import { NextRequest } from "next/server";

jest.mock("@vercel/kv", () => ({
  kv: {
    incr: jest.fn().mockResolvedValue(42),
    get: jest.fn().mockResolvedValue(42),
  },
}));

describe("GET /api/visitors", () => {
  it("returns current count", async () => {
    const req = new NextRequest("http://localhost/api/visitors");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 42 });
  });
});

describe("POST /api/visitors", () => {
  it("increments and returns new count", async () => {
    const req = new NextRequest("http://localhost/api/visitors", {
      method: "POST",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 42 });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx jest __tests__/api/visitors.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/visitors/route'"

- [ ] **Step 5: Create the KV helper**

Create `lib/kv.ts`:
```ts
import { kv } from "@vercel/kv";
export { kv };
```

- [ ] **Step 6: Create the API route**

Create `app/api/visitors/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export async function GET(_req: NextRequest) {
  const count = (await kv.get<number>("visitors")) ?? 0;
  return NextResponse.json({ count });
}

export async function POST(_req: NextRequest) {
  const count = await kv.incr("visitors");
  return NextResponse.json({ count });
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npx jest __tests__/api/visitors.test.ts
```

Expected: PASS — 2 tests, 0 failures

- [ ] **Step 8: Commit**

```bash
git add lib/kv.ts app/api/visitors/route.ts __tests__/api/visitors.test.ts jest.config.ts
git commit -m "feat: add visitor counter API with Vercel KV"
```

---

### Task 4: Gate State

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `Home` component rendering gate UI when `phase === "gate"`; clicking Enter calls `setPhase("rickroll")`

- [ ] **Step 1: Add base global styles**

Replace `app/globals.css`:
```css
@import "tailwindcss";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.4); }
  50% { box-shadow: 0 0 20px 6px rgba(255, 255, 255, 0.9); }
}

.btn-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Build page.tsx with gate state**

Replace `app/page.tsx`:
```tsx
"use client";

import { useState } from "react";

type Phase = "gate" | "rickroll" | "construction";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("gate");

  if (phase === "gate") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-white text-4xl md:text-6xl font-bold tracking-widest">
            PRATHLABS
          </h1>
          <p className="text-zinc-400 text-sm mt-3 tracking-[0.3em] uppercase">
            Welcome
          </p>
        </div>
        <button
          onClick={() => setPhase("rickroll")}
          className="btn-glow mt-4 px-10 py-3 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer"
        >
          Enter
        </button>
      </div>
    );
  }

  return <div>phase: {phase}</div>;
}
```

- [ ] **Step 3: Verify gate screen renders**

```bash
npm run dev
```

Open http://localhost:3000. Confirm: black screen, "PRATHLABS" heading, "Welcome" subtitle, glowing "Enter" button. Clicking Enter shows "phase: rickroll" text.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: add gate state with glowing enter button"
```

---

### Task 5: Rickroll State

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `phase === "rickroll"`, `setPhase` dispatcher from Task 4
- Produces: fullscreen YouTube iframe when `phase === "rickroll"`; Skip button calls `setPhase("construction")`

- [ ] **Step 1: Add rickroll branch to page.tsx**

In `app/page.tsx`, replace the final `return <div>phase: {phase}</div>;` line with:
```tsx
  if (phase === "rickroll") {
    return (
      <div className="relative bg-black" style={{ height: "100dvh" }}>
        <iframe
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
        <button
          onClick={() => setPhase("construction")}
          className="absolute bottom-6 right-6 z-10 bg-black/70 text-white text-xs px-4 py-2 border border-white/40 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Skip »
        </button>
      </div>
    );
  }

  return <div>phase: {phase}</div>;
```

Note: `100dvh` (dynamic viewport height) is used instead of `min-h-screen` so the iframe fills the screen correctly on mobile browsers where the address bar shrinks/expands.

- [ ] **Step 2: Verify rickroll works**

```bash
npm run dev
```

Walk through: Enter → Rick Astley autoplays fullscreen with sound. "Skip »" button in bottom-right. Clicking Skip shows "phase: construction".

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add rickroll state with YouTube embed and skip button"
```

---

### Task 6: Under Construction State

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `phase === "construction"` from Task 5; `POST /api/visitors` → `{ count: number }` from Task 3
- Produces: fully rendered retro page with live visitor count; `Construction` extracted as a sub-component

- [ ] **Step 1: Add retro CSS animations to globals.css**

Append to `app/globals.css`:
```css
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.blink {
  animation: blink 1s step-end infinite;
}

@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.marquee-inner {
  display: inline-block;
  animation: marquee 12s linear infinite;
  white-space: nowrap;
}

@keyframes construction-flash {
  0%, 100% { background-color: #ffcc00; color: #000; }
  50% { background-color: #000; color: #ffcc00; }
}

.construction-banner {
  animation: construction-flash 0.8s step-end infinite;
}

body.retro {
  background-color: #000080;
  background-image: repeating-linear-gradient(
    45deg,
    #000080 0px,
    #000080 10px,
    #0000aa 10px,
    #0000aa 20px
  );
  overflow: auto;
}
```

- [ ] **Step 2: Update imports at top of page.tsx**

Change the import line at the top of `app/page.tsx` from:
```tsx
import { useState } from "react";
```
to:
```tsx
import { useState, useEffect } from "react";
```

- [ ] **Step 3: Add Construction component and wire up final state**

In `app/page.tsx`, replace the final `return <div>phase: {phase}</div>;` with:
```tsx
  // phase === "construction"
  return <Construction />;
}

function Construction() {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visitors", { method: "POST" })
      .then((r) => r.json())
      .then((data: { count: number }) => setVisitors(data.count))
      .catch(() => setVisitors(null));

    document.body.classList.add("retro");
    return () => document.body.classList.remove("retro");
  }, []);

  const displayCount =
    visitors !== null ? String(visitors).padStart(6, "0") : "??????";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 py-12 px-4 text-center font-mono">
      <div className="construction-banner text-lg md:text-2xl font-black px-4 py-3 w-full max-w-xl">
        🚧 UNDER CONSTRUCTION 🚧
      </div>

      <h1 className="text-yellow-300 text-3xl md:text-4xl font-black drop-shadow-lg">
        PrathLabs
      </h1>

      <p className="text-white text-xl">
        <span className="blink">🚧</span>{" "}
        PrathLabs is under construction{" "}
        <span className="blink">🚧</span>
      </p>

      <div className="border-4 border-yellow-400 bg-black px-6 py-4">
        <div className="text-yellow-400 text-xs mb-1 tracking-widest uppercase">
          Visitor Count
        </div>
        <div className="text-green-400 text-4xl tracking-[0.5em] font-black">
          {displayCount}
        </div>
      </div>

      <div className="w-full max-w-xl overflow-hidden border border-yellow-400/40 py-2 bg-black/40">
        <span className="marquee-inner text-yellow-200 text-sm">
          ★ Coming Soon... Maybe... Probably Not... ★ &nbsp;&nbsp;&nbsp; ★
          Coming Soon... Maybe... Probably Not... ★
        </span>
      </div>

      <p className="text-zinc-400 text-xs mt-8">
        Best viewed in Internet Explorer 6 · 800×600 resolution
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify the full flow**

```bash
npm run dev
```

Walk through the complete flow:
1. http://localhost:3000 → black gate screen ✓
2. Click Enter → Rick Astley fullscreen ✓
3. Click Skip → retro blue diagonal-stripe background, flashing yellow/black "UNDER CONSTRUCTION" banner, blinking emoji text, visitor counter showing `??????` (no KV locally — expected), scrolling marquee, IE6 footer ✓

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: add under-construction state with retro styling and live visitor counter"
```

---

### Task 7: Deploy to Vercel

**Files:**
- No code changes — deploy and wire up infrastructure

**Interfaces:**
- Consumes: all tasks 1–6
- Produces: live site at prathlabs.com with working KV visitor counter, Analytics, and Speed Insights

- [ ] **Step 1: Verify .env.local is gitignored**

```bash
cat .gitignore | grep env
```

Expected output includes `.env.local`. If not, add it manually to `.gitignore`.

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/prathlabs-website.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Create Vercel KV store**

In Vercel dashboard:
1. Storage → Create Database → KV (Upstash)
2. Name: `prathlabs-kv`, region closest to you
3. Connect to your project
4. Vercel auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN` in environment variables

- [ ] **Step 4: Import and deploy on Vercel**

1. vercel.com → Add New Project → Import `prathlabs-website` from GitHub
2. Framework: Next.js (auto-detected)
3. Click Deploy

Expected: build succeeds in ~1 minute, site live at `<project>.vercel.app`

- [ ] **Step 5: Point prathlabs.com to Vercel**

In Vercel → Project → Settings → Domains:
1. Add `prathlabs.com`
2. Follow the DNS instructions shown (add A record `76.76.21.21` and CNAME `cname.vercel-dns.com` at your registrar)
3. Wait for DNS propagation (up to 24h, usually under 5 min)

- [ ] **Step 6: Smoke test live site**

Open https://prathlabs.com and verify:
1. Gate screen loads with "PRATHLABS" and glowing Enter button ✓
2. Click Enter → Rick Astley autoplays fullscreen ✓
3. Click Skip → retro under-construction page loads ✓
4. Visitor counter shows a real number (not `??????`) ✓
5. Vercel dashboard → Analytics shows a page view ✓
6. Vercel dashboard → Speed Insights shows Core Web Vitals ✓
