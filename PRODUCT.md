# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people evaluating Pratham Nagpal as an engineer (recruiters, engineers, potential collaborators) who arrive from GitHub, a CV, or a shared link and decide within a minute whether he builds real systems and is worth contacting.

## Product Purpose

Personal portfolio for Pratham Nagpal, a CS student at BITS Pilani Dubai working on infrastructure, DevOps and backend systems. Success is a visitor reaching out.

## Positioning

He self-hosts and operates his own infrastructure (Raspberry Pi, home server) and builds working systems, not tutorials. When his machines are running, the site can show that directly; no other portfolio can truthfully show his hardware being alive.

## Operating Context

- Visitors come from the GitHub profile README (Pratham71/Pratham71), which shares this site's identity.
- The homelab (Pi + home server) is off most of the time and is due for a rebuild; it may stay lightly used afterwards.

## Capabilities and Constraints

- Stack: existing Next.js 16 (App Router) app on Vercel, with Upstash Redis, `@vercel/analytics` and `@vercel/speed-insights`.
- Sections: boot-sequence intro, about/intro, projects (one page per project), contact. Live device status appears only while a device is on and is absent otherwise; it must cost negligible compute.
- The previous rickroll, retro page and visitor counter are removed.
- Open: final domain (www.prathlab.com today; prathamnagpal.dev being considered). Contact method and public email address not yet chosen.

## Brand Commitments

- Shared identity with the GitHub profile README: terminal / ops-console direction, the README's palette tokens (ink, panel, line, text, muted, amber, ok) and Martian Mono. Status is always a shape plus a word, never color alone.
- Name shown as "Pratham Nagpal".

## Evidence on Hand

- Projects: homelab-infrastructure (Shell, active), Vessel (Java notebook environment, shipped); Cruzr (Go) to be added when it ships.
- Real GitHub activity via the GitHub API (contributions, languages).
- No testimonials, client names, metrics or case studies exist; none may be invented. Homelab uptime must never be shown as live when a device is off.

## Product Principles

1. Show real, working systems; never fabricate numbers or status.
2. Recruiter-scannable in the first screen; depth one click away.
3. One memorable moment, everything else quiet.
4. Honest absence beats fake presence: hide what isn't running.

## Accessibility & Inclusion

WCAG AA contrast; full keyboard use; `prefers-reduced-motion` skips the boot sequence and all animation; the boot sequence is skippable and never blocks content for screen readers.
