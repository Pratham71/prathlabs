# Audio files

For the live site, upload songs and sounds in /admin (below). This file lists the paths the repo
looks for, for playing songs locally.

**Audio files are git-ignored** (`public/music/**`, `public/sfx/**`): they play only on the machine that has them and
never reach GitHub or Vercel. Songs you own the rights to, or royalty-free ones, go through /admin.

Paths are relative to the repo's `public/` folder. Format: `.mp3`, lowercase names, exactly as written.
Missing files are skipped, and the built-in synth loops keep playing.

**After adding files, rebuild** (`npm run build`, then `npx next start`). The production server
only serves files that were in `public/` at build time. (`npm run dev` picks new files up on refresh.)

## Or: upload from /admin

`sudo su` in the command prompt (or go to `/admin`), then MUSIC or REBOOT SOUND. Uploads go to Vercel
Blob, show up on the next page load, need no rebuild, and play before the repo's files. Remove deletes
the file.

## Theme songs (`public/music/<theme>/`)

Each theme's radio plays these first, in this order, then its two built-in loops.

| Theme (dock label) | Save as | Song |
|---|---|---|
| los santos | `public/music/gtav/lady-hear-me-tonight.mp3` | Lady (Hear Me Tonight), Modjo |
| los santos | `public/music/gtav/meet-me-halfway.mp3` | Meet Me Halfway, The Black Eyed Peas |
| los santos | `public/music/gtav/music-sounds-better-with-you.mp3` | Music Sounds Better with You, Stardust |
| los santos | `public/music/gtav/moves-like-jagger.mp3` | Moves Like Jagger, Maroon 5 feat. Christina Aguilera |
| los santos | `public/music/gtav/midnight-city.mp3` | Midnight City, M83 |
| los santos | `public/music/gtav/welcome-to-los-santos.mp3` | Welcome to Los Santos, Oh No & The Alchemist |
| los santos | `public/music/gtav/sleepwalking.mp3` | Sleepwalking, The Chain Gang of 1974 |
| vice city | `public/music/gtavi/love-is-a-long-road.mp3` | Love Is a Long Road, Tom Petty |
| vice city | `public/music/gtavi/hot-together.mp3` | Hot Together, The Pointer Sisters |
| battle bus | `public/music/fortnite/lobby-chapter-1.mp3` | Lobby theme (Chapter 1), Epic Games |
| blade | `public/music/blade/confusion.mp3` | Confusion (Pump Panel Reconstruction Mix), New Order |
| matrix | `public/music/matrix/clubbed-to-death.mp3` | Clubbed to Death, Rob Dougan |
| matrix | `public/music/matrix/spybreak.mp3` | Spybreak!, Propellerheads |
| night city | `public/music/cyberpunk/never-fade-away.mp3` | Never Fade Away, SAMURAI |
| night city | `public/music/cyberpunk/i-really-want-to-stay-at-your-house.mp3` | I Really Want to Stay at Your House, Rosa Walton |
| spider-man | `public/music/spiderman/main-title.mp3` | The Amazing Spider-Man main title, James Horner |
| minecraft | `public/music/minecraft/sweden.mp3` | Sweden, C418 |
| minecraft | `public/music/minecraft/wet-hands.mp3` | Wet Hands, C418 |

Want a different song? Save it in the theme's folder and change the matching line in
`content/music.ts` (title, artist, file path). To start a song at its best part, add
`start: <seconds>` to its line, e.g. `start: 52`.

## Reboot sounds (`public/sfx/`)

Played by the `reboot` command before the intro replays. Each theme has its own entry in
`content/music.ts` (`REBOOT_SOUNDS`): change the file or the volume (0 to 1) per theme there.

| Theme | Save as | Default volume | What it is |
|---|---|---|---|
| los santos | `public/sfx/wasted.mp3` | 0.35 | GTA "wasted" |
| vice city | `public/sfx/wasted.mp3` (same file; point it elsewhere if you like) | 0.35 | GTA "wasted" |
| battle bus | `public/sfx/placed.mp3` | 0.6 | Fortnite elimination / placement |
| blade | `public/sfx/slash.mp3` | 0.6 | sword slash |
| matrix | `public/sfx/system-failure.mp3` | 0.6 | system failure / glitch |
| night city | `public/sfx/flatline.mp3` | 0.6 | flatline / glitch |
| spider-man | `public/sfx/thwip.mp3` | 0.6 | web-shooter "thwip" |
| minecraft | `public/sfx/oof.mp3` | 0.6 | Minecraft damage / death |

## Fonts (optional, `public/fonts/`)

| Font | Save as | Used for |
|---|---|---|
| Pricedown | `public/fonts/pricedown.woff2` | GTA titles |
| Burbank Big Condensed Black | `public/fonts/burbank-big-condensed-black.woff2` | Fortnite titles |

Without them, Anton stands in.

## Note

The songs, sounds and fonts above belong to their owners and aren't covered by this repo's MIT
license. Putting them on the public site is your call.
