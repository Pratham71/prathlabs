---
name: add-music
description: Add, replace or remove songs and reboot sounds for the themed radio stations on prathlab. Use when asked about theme songs, radio tracks, reboot/wasted sounds, or where to put audio files.
---

# Add music or a reboot sound

Two ways; pick by whether the file should live in the public repo.

## No code change: the admin panel (preferred)
Tell the user: `sudo su` in the site's prompt (or `/admin`) → MUSIC or REBOOT SOUND → upload.
Files go to Vercel Blob, never into the repo, and show up on the next page load. Needs Redis and
Blob connected in Vercel (the panel's STATUS line says what's missing).

## In the repo
1. File goes in `public/music/<theme>/<lowercase-name>.mp3` (songs) or `public/sfx/<name>.mp3`
   (reboot sounds). Themes: see `THEMES` in `lib/theme.ts`.
2. Songs: add `{ title, artist, src, start? }` to `MUSIC[<theme>]` in `content/music.ts`.
   `artist` is the full credit ("Maroon 5 feat. Christina Aguilera"); `start` is the second to
   begin at (the song's peak). Order = play order; missing files are skipped at runtime.
3. Reboot sounds: `REBOOT_SOUNDS[<theme>] = { src, volume }` (volume 0 to 1; "wasted" is 0.35).
4. Update the tables in `AUDIO.md` to match.
5. Remind the user: production only serves `public/` files present at build time, so rebuild or
   push. Copyrighted audio committed here becomes public; that's their call, so say so.

Never download audio from YouTube or similar for the user; they supply the files.
