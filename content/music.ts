import type { Theme } from "@/lib/theme";

// Real songs for the theme stations (filenames and folders: see AUDIO.md). Each plays ahead of that
// station's built-in synth loops, through the same player and visualizer. A listed file that isn't in
// public/music yet is skipped (the player checks before showing it), so this list can stay as it is.
//
// `start` (seconds) is where the song begins when it comes on: set it to the drop, chorus or hook.
// These are commercial recordings: hosting them on the public site is the owner's call.
export type RealTrack = { title: string; artist: string; src: string; start?: number };

export const MUSIC: Partial<Record<Theme, RealTrack[]>> = {
  gtav: [
    { title: "Midnight City", artist: "M83", src: "/music/gtav/midnight-city.mp3" },
    { title: "Welcome to Los Santos", artist: "Oh No & The Alchemist", src: "/music/gtav/welcome-to-los-santos.mp3" },
    { title: "Sleepwalking", artist: "The Chain Gang of 1974", src: "/music/gtav/sleepwalking.mp3" },
  ],
  gtavi: [
    { title: "Love Is a Long Road", artist: "Tom Petty", src: "/music/gtavi/love-is-a-long-road.mp3" },
    { title: "Hot Together", artist: "The Pointer Sisters", src: "/music/gtavi/hot-together.mp3" },
  ],
  fortnite: [{ title: "Lobby Theme (Chapter 1)", artist: "Epic Games", src: "/music/fortnite/lobby-chapter-1.mp3" }],
  blade: [{ title: "Confusion (Pump Panel Reconstruction Mix)", artist: "New Order", src: "/music/blade/confusion.mp3" }],
  matrix: [
    { title: "Clubbed to Death", artist: "Rob Dougan", src: "/music/matrix/clubbed-to-death.mp3" },
    { title: "Spybreak!", artist: "Propellerheads", src: "/music/matrix/spybreak.mp3" },
  ],
  cyberpunk: [
    { title: "Never Fade Away", artist: "SAMURAI", src: "/music/cyberpunk/never-fade-away.mp3" },
    { title: "I Really Want to Stay at Your House", artist: "Rosa Walton", src: "/music/cyberpunk/i-really-want-to-stay-at-your-house.mp3" },
  ],
  spiderman: [{ title: "The Amazing Spider-Man (Main Title)", artist: "James Horner", src: "/music/spiderman/main-title.mp3" }],
  minecraft: [
    { title: "Sweden", artist: "C418", src: "/music/minecraft/sweden.mp3" },
    { title: "Wet Hands", artist: "C418", src: "/music/minecraft/wet-hands.mp3" },
  ],
};
