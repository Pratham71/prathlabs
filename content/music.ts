import type { Theme } from "@/lib/theme";

// Real songs for the theme stations. Drop the audio file in public/music/<theme>/ and list it here;
// it plays ahead of that station's built-in synth loops, through the same player and visualizer.
// Leave a theme's list empty to keep only the synth loops. If a file is missing, the player skips it.
//
// Heads-up: these are commercial recordings. Hosting them on a public site is your call (DMCA risk).
// `start` (seconds) is where the song begins when it comes on: set it to the drop, chorus or hook.
export type RealTrack = { title: string; artist: string; src: string; start?: number };

export const MUSIC: Partial<Record<Theme, RealTrack[]>> = {
  gtav: [
    // { title: "Midnight City", artist: "M83", src: "/music/gtav/midnight-city.mp3" },
    // { title: "Welcome to Los Santos", artist: "Oh No & The Alchemist", src: "/music/gtav/welcome-to-los-santos.mp3" },
    // { title: "Sleepwalking", artist: "The Chain Gang of 1974", src: "/music/gtav/sleepwalking.mp3" },
  ],
  gtavi: [
    // { title: "Love Is a Long Road", artist: "Tom Petty", src: "/music/gtavi/love-is-a-long-road.mp3" },
    // { title: "Hot Together", artist: "The Pointer Sisters", src: "/music/gtavi/hot-together.mp3" },
  ],
  fortnite: [
    // { title: "Lobby Theme (Chapter 1)", artist: "Epic Games", src: "/music/fortnite/lobby-c1.mp3" },
  ],
  matrix: [],
  cyberpunk: [],
  spiderman: [],
  minecraft: [],
  blade: [
    // { title: "Confusion (Pump Panel Reconstruction Mix)", artist: "New Order", src: "/music/blade/confusion.mp3" },
  ],
};
