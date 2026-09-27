---
name: add-music
description: Add, replace or remove songs and sounds for the themed radio stations, reboot screens, eggs and background scenes. Use when asked about theme songs, radio tracks, reboot/wasted sounds, egg or scene sound effects, song volume or start times, or where audio files go.
---

# Add music or a sound

## The admin panel (the way to do it)

`sudo su` in the site's prompt (or `/admin`), then:

- **MUSIC**: pick the theme, upload a song with title, artist, start second and volume. Songs play
  before the station's synth loops, in list order (the `up` button reorders). Removing a song deletes
  its file. Pasting a link after the artist (`M83 (https://youtu.be/...)`) shows a `yt ↗` link.
- **default volume for new uploads**: what the volume field starts at.
- **REBOOT SOUND**: a theme's `reboot` sound, with its volume; reset returns to the repo default.
- **EGG SOUNDS** (storm, "with great power", wanted) and **SCENE SOUNDS** (los santos siren, heli,
  jets, explosion): on/off, volume, or an uploaded clip instead of the synth.

Files go to Vercel Blob (never the repo) and reach visitors on the next page load, no rebuild. It
needs Redis and Blob connected in Vercel; the panel's STATUS line says what's missing.

## In the repo (local only)

`content/music.ts` lists songs per theme (`MUSIC`) and reboot sounds (`REBOOT_SOUNDS`), with the
paths in `AUDIO.md`. Audio under `public/music/` and `public/sfx/` is git-ignored, so it only plays
on the machine that has it; the live site gets songs and sounds through the panel. Listed files
that are missing are skipped at runtime (reboot falls back to its synth sting).

## Rules

- Commercial songs need a licence to be hosted, on Blob or anywhere else. Say so when someone adds
  one; it's their call, but they should know. Royalty-free libraries (Pixabay Music, Incompetech,
  Free Music Archive) are the safe source.
- Never download audio from YouTube, Spotify or SoundCloud for anyone; they supply the files.
- Never `git add -A` with audio lying around in `public/`; stage files by name.
