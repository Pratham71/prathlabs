---
name: ship-change
description: Verify and ship a change to this portfolio (checks, visual check, commit, PR, merge after CI). Use before committing, opening a PR, or when asked to deploy/ship/push changes to this repo.
---

# Ship a change

1. Next.js here is 16.x and differs from older versions: read `node_modules/next/dist/docs/` for any
   Next API you touch (e.g. `revalidateTag(tag, "max")` needs two args).
2. Run exactly what CI runs:
   ```bash
   npx eslint . && npx tsc --noEmit && npx jest && npm run build
   ```
   The build wants `GITHUB_TOKEN` for the heatmap; `GITHUB_TOKEN=$(gh auth token) npm run build`
   works locally. Never write tokens into files.
3. UI changes: `npx next start -p 3100` and check it in a browser at desktop (1440px) and phone
   (390px) width, in amber and at least one game theme (`localStorage.theme = "gtav"`), no console
   errors, no horizontal scroll. Set `sessionStorage["boot-seen"]="1"` to skip the intro.
4. Commit on a branch off `main`. **No `Co-Authored-By` trailer, never add Claude as an author.**
   Don't commit `public/sfx/*.mp3` / `public/music/**` audio unless the user asked.
5. `gh pr create --base main`, wait for CI (`check`) and the Vercel preview to pass, then merge
   only if the user asked for it. Pushing to `main` deploys to production.
