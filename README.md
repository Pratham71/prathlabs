# prathlab

Pratham Nagpal's portfolio, written as a Unix man page: [prathlab.com](https://www.prathlab.com).

Next.js 16 (App Router), React 19, no UI framework. Dithered canvases, a command prompt, live homelab
status, a Spotify "now playing", nine themes (eight of them game/film themed, each with an intro,
radio station, cursor, scenery and reboot screen) and a small admin panel.

MIT licensed: take what's useful. Game, film and brand names belong to their owners.

## Using the site

| Key | Does |
|---|---|
| `:` `/` or Ctrl/Cmd+K | open the command prompt (also the `: cmd` dock button) |
| `help` | every command |
| `theme <name>` | switch theme (the dock's theme button cycles them) |
| `radio play\|pause\|next\|prev` | the station, in the game themes |
| `reboot` | replay the intro, the way the current theme's game would |
| `spotify` | what's playing |
| `sudo su` | admin login (password prompt) |
| `exit` / Esc | close the prompt |

There are more eggs; `help` doesn't list them.

## Run it locally

Needs Node 22+.

```bash
git clone https://github.com/Pratham71/prathlabs.git
cd prathlabs
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
```

Every integration switches itself off when its env vars are missing: no Redis means no globe
visits, homelab rail or admin saves; no Spotify means no "now playing"; and so on. The page itself
always renders.

Checks (the same ones CI runs on every PR):

```bash
npx eslint . && npx tsc --noEmit && npx jest && npm run build
```

Production build locally: `npm run build && npx next start`. Files added to `public/` after a build
are 404 until the next build.

## Environment variables

Set them in Vercel under **Settings → Environment Variables** (tick Production and Preview, mark
secrets Sensitive, redeploy afterwards). Locally, `.env.local` (git-ignored), or `npx vercel env pull .env.local`.

| Variable | What for | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical URL, sitemap, OG | `https://www.prathlab.com` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` (or `KV_REST_API_URL` / `_TOKEN`) | visits globe, homelab rail, admin settings, login throttle | Vercel → Storage → Upstash for Redis → connect (filled in automatically) |
| `BLOB_READ_WRITE_TOKEN` | songs and sounds uploaded in /admin | Vercel → Storage → Blob → connect, **tick "Add a read-write token env var"** |
| `ADMIN_PASSWORD` | the `sudo su` / `/admin` password | you choose it; make it long |
| `ADMIN_SECRET` | signs the admin session cookie | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GITHUB_TOKEN` | ACTIVITY heatmap | GitHub → Settings → Developer settings → fine-grained token, public repos read-only |
| `HEARTBEAT_TOKEN` | homelab devices authenticate with it | random string, same value on the devices |
| `SPOTIFY_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | now playing | see [Spotify](#spotify) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | overrides the email in `content/site.ts` | optional |

Logging out of /admin ends every admin session (a copied cookie stops working too); rotating `ADMIN_SECRET` does the same.

## Deploy (Vercel)

1. vercel.com/new → import this repo. Defaults are right (Next.js).
2. Storage: connect Upstash Redis and Blob (with the read-write token box ticked).
3. Add the env vars above, then redeploy.
4. Settings → Domains: add `prathlab.com` and `www.prathlab.com`, set the DNS records Vercel shows.
5. Enable Analytics and Speed Insights (both cookieless: no consent banner needed).
6. Google Search Console: add the domain, submit `/sitemap.xml`.

Pushes to `main` deploy to production; every PR gets a preview URL and CI.

## Admin panel

`sudo su` in the prompt (or go to `/admin`) and enter `ADMIN_PASSWORD`. The session lasts 12 hours;
5 wrong passwords block an IP for 15 minutes, 30 across all IPs block logins for 15 minutes.

- **Themes**: the default for first-time visitors, and which themes the dock button cycles through.
- **Spotify**: show or hide "now playing".
- **Music**: upload songs per station (title, artist, start time in seconds), reorder, remove
  (removing deletes the file from Blob).
- **Reboot sound**: replace a theme's reboot sound, set its volume, reset to the default.

Changes save immediately and reach visitors on their next page load. No rebuild.

## Music and sounds from the repo

The other way to add audio: drop files at the paths in [AUDIO.md](AUDIO.md) and rebuild. They're
listed in `content/music.ts`; missing files are skipped, and the synth loops always play.

## Spotify

1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → **Create app**.
   Redirect URI `http://127.0.0.1:8888/callback`, API: **Web API**.
2. Copy the Client ID and Client secret from the app's settings.
3. Run, then open the printed link and approve:
   ```bash
   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
   ```
4. It prints `SPOTIFY_REFRESH_TOKEN=...`. Set all three in Vercel. Development mode is fine: the
   site only reads your own account.

## Homelab heartbeats

Each device runs [`scripts/heartbeat.sh`](scripts/heartbeat.sh) every 5 minutes and shows up in the
right rail while it's beating. On the device:

```bash
echo 'HEARTBEAT_TOKEN=...' | sudo tee /etc/prathlab-heartbeat.env && sudo chmod 600 /etc/prathlab-heartbeat.env
# crontab -e
*/5 * * * * . /etc/prathlab-heartbeat.env; DEVICE=pi-01 HEARTBEAT_TOKEN=$HEARTBEAT_TOKEN /path/to/heartbeat.sh
```

Device ids are listed in `lib/heartbeat.ts`.

## Where things live

| Path | What |
|---|---|
| `content/site.ts` | all home-page copy: description, education, experience, skills, awards, hobbies, contact |
| `content/projects/` | projects: `index.ts` (list) + one `<slug>.mdx` write-up each; images in `public/projects` |
| `content/music.ts` | repo songs per theme and reboot sounds |
| `lib/theme.ts`, `app/globals.css` | themes (tokens and per-theme CSS) |
| `lib/commands.ts` | the command prompt |
| `lib/radio.ts` | synth stations and the player |
| `lib/admin.ts`, `lib/settings.ts`, `app/admin`, `app/api/admin` | admin auth and settings |
| `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt` | structured data, sitemap, robots, llms.txt |
| `.claude/skills/` | Claude Code skills for common changes to this repo |
