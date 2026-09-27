---
name: add-project
description: Add a project to the portfolio (home page row, its /projects/<slug> page, sitemap, llms.txt, structured data). Use when asked to add, feature or showcase a project or repo on this portfolio.
---

# Add a project

Everything derives from `content/projects/index.ts`; the page, sitemap, llms.txt, JSON-LD, OG image
and the prompt's `projects` / `open <name>` commands all pick the new entry up.

1. Read the repo first (`gh api repos/<owner>/<repo>/readme -H "Accept: application/vnd.github.raw"`,
   `gh api repos/<owner>/<repo>/languages`). Only state facts the README or code supports.
2. Add an entry to `projects` in `content/projects/index.ts` (order = home page order):
   - `slug`: lowercase, `[a-z0-9-]`, short (it's shown as `slug(section)`).
   - `section`: 1 for a program/app, 7 for an overview/system (like homelab).
   - `status`: `active` | `building` | `shipped`.
   - `summary`: **40 characters max** (a test enforces it), lowercase, no trailing period.
   - `repo`: `https://github.com/...`. `stack`: the real stack, most important first.
   - `images`: `[]` is fine. With images: put `.webp` files in `public/projects/`, give real
     `width`/`height`, an `alt` describing the screenshot and a short lowercase `caption`.
     Never use screenshots that show personal info.
3. Write `content/projects/<slug>.mdx`: one plain sentence on what it is, then 2 to 4 bullets on
   how it's built. Match the tone of `vessel.mdx` / `homelab.mdx` (short, concrete, no hype).
4. Run the checks from the `ship-change` skill.
