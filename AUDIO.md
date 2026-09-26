# Audio files

Drop files at exactly these paths. Nothing else to do: the site finds them on its own
(missing ones are skipped, and the built-in synth loops keep playing).

Base folder on this machine:
`C:\Users\prath\OneDrive\Desktop\Projects\Portfolio\Prathlabs.com\prathlabs\public`

Format: `.mp3`, lowercase names, exactly as written. After adding files: `npm run build`
(or just refresh during `npm run dev`).

## Theme songs (`public/music/<theme>/`)

Each theme's radio plays these first, in this order, then its two built-in loops.

| Theme (dock label) | Save as | Song |
|---|---|---|
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

Played by the `reboot` command before the intro replays.

| Theme | Save as | What it is |
|---|---|---|
| los santos, vice city | `public/sfx/wasted.mp3` | the GTA "wasted" sound (plays at 35% volume) |
| battle bus | `public/sfx/placed.mp3` | Fortnite elimination / placement sound |
| blade | `public/sfx/slash.mp3` | sword slash |
| matrix, night city | `public/sfx/glitch.mp3` | glitch / system failure |
| spider-man | `public/sfx/thwip.mp3` | web-shooter "thwip" |
| minecraft | `public/sfx/oof.mp3` | Minecraft damage / death sound |

## Fonts (optional, `public/fonts/`)

| Font | Save as | Used for |
|---|---|---|
| Pricedown | `public/fonts/pricedown.woff2` | GTA titles |
| Burbank Big Condensed Black | `public/fonts/burbank-big-condensed-black.woff2` | Fortnite titles |

Without them, Anton stands in.

## Note

The songs, sounds and fonts above belong to their owners and aren't covered by this repo's MIT
license. Putting them on the public site is your call.
