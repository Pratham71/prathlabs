// Theme radio. Each station plays any real songs listed in content/music.ts first, then its built-in
// loops: original compositions in the spirit of the theme, synthesized live by a 16th-note step sequencer
// with a lookahead scheduler (drums, bass, chords, a lead; all Web Audio). Browser only. Everything runs
// through lib/audio's master, so the dock's sound toggle still silences it.
import { bedOn, graph } from "@/lib/audio";
import { MUSIC, isSoundCloud } from "@/content/music";
import { clientSettings } from "@/lib/client-settings";
import type { Theme } from "@/lib/theme";

type Drum = "kick" | "snare" | "clap" | "hat";
type Voice = "keys" | "saw" | "bell" | "pluck" | "brass" | "square" | "acid";

export type Track = {
  title: string;
  bpm: number;
  swing?: number; // 0..0.3 of a 16th, delays the off-beats
  drums: Partial<Record<Drum, string>>; // 16 chars per bar, "x" hit, "o" soft; repeats
  chords: string[]; // one chord per bar, e.g. "D3 F3 A3 C4"; loop length = chords.length bars
  chord: Voice;
  bass: string; // steps: note, "." rest, "r" = chord root an octave down, "R" = chord root
  lead?: string; // same notation as bass (space separated), any length that divides the loop
  leadVoice?: Voice;
};

export type Station = { name: string; tracks: Track[] };

const bar = (s: string) => s.replace(/\s+/g, "");

// ---- the music (original compositions) ----
export const STATIONS: Partial<Record<Theme, Station>> = {
  matrix: {
    name: "the construct",
    tracks: [
      {
        title: "red pill",
        bpm: 128,
        drums: { kick: "x...x...x...x...", clap: "....x.......x...", hat: "..x...x...x...x." },
        chords: ["E2 G2 B2", "E2 G2 B2", "C2 E2 G2", "D2 F#2 A2"],
        chord: "square",
        bass: bar("..r...r...r...r. ..r...r...r...r. ..r...r...r...r. ..r...r...r.r.r."),
        lead: "E4 . B4 . G4 . B4 . E5 . B4 . G4 . D5 . E4 . B4 . G4 . B4 . E5 . G5 . F#5 . D5 . C4 . G4 . E4 . G4 . C5 . G4 . E4 . B4 . D4 . A4 . F#4 . A4 . D5 . A4 . F#4 . A4 .",
        leadVoice: "square",
      },
      {
        title: "bullet time",
        bpm: 78,
        drums: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
        chords: ["E3 G3 B3", "C3 E3 G3", "A2 C3 E3", "B2 D#3 F#3"],
        chord: "saw",
        bass: bar("r.......r...r... r.......r...r... r.......r...r... r.......r.r.r..."),
        lead: ". . . . B4 . . . . . G4 . . . . . . . . . C5 . . . B4 . . . . . . . . . . . A4 . . . . . E4 . . . . . . . . . . . F#4 . . . . . D#5 . . . . . . .",
        leadVoice: "bell",
      },
    ],
  },
  cyberpunk: {
    name: "neon static fm",
    tracks: [
      {
        title: "chrome & rain",
        bpm: 112,
        drums: { kick: "x..x..x.x..x..x.", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx" },
        chords: ["F#2 A2 C#3", "D2 F#2 A2", "E2 G#2 B2", "C#2 E2 G#2"],
        chord: "saw",
        bass: bar("rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr"),
        lead: "F#3 . F#3 A3 . F#3 C#4 . B3 . A3 . F#3 . E3 . D3 . D3 F#3 . D3 A3 . G#3 . F#3 . E3 . D3 . E3 . E3 G#3 . E3 B3 . A3 . G#3 . E3 . B2 . C#3 . C#3 E3 . C#3 G#3 . F#3 . E3 . C#3 . G#2 .",
        leadVoice: "acid",
      },
      {
        title: "braindance",
        bpm: 90,
        drums: { kick: "x.......x.......", snare: "....x.......x...", hat: "..x...x...x...x." },
        chords: ["A2 C3 E3 G3", "F2 A2 C3 E3", "D2 F2 A2 C3", "E2 G#2 B2 D3"],
        chord: "saw",
        bass: bar("r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r."),
        lead: "E5 . . . D5 . C5 . . . A4 . . . . . C5 . . . B4 . A4 . . . E4 . . . . . F4 . . . A4 . D5 . . . C5 . . . . . B4 . . . G#4 . E4 . . . D5 . . . . . . .",
        leadVoice: "saw",
      },
    ],
  },
  spiderman: {
    name: "queens radio",
    tracks: [
      {
        title: "swing over sixth",
        bpm: 118,
        drums: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
        chords: ["D3 F#3 A3", "B2 D3 F#3", "G2 B2 D3", "A2 C#3 E3"],
        chord: "brass",
        bass: bar("r...r...r...r... r...r...r...r... r...r...r...r... r...r...r.r.r.r."),
        lead: "A4 . D5 . F#5 . . . E5 . D5 . A4 . . . B4 . D5 . F#5 . . . A5 . G5 . F#5 . . . G5 . . . F#5 . E5 . D5 . . . B4 . . . A4 . . . C#5 . E5 . A5 . . . . . . .",
        leadVoice: "brass",
      },
      {
        title: "rooftop, after",
        bpm: 76,
        drums: { kick: "x.........x.....", hat: "....o.......o..." },
        chords: ["G2 D3 B3", "E2 B2 G3", "C3 G3 E4", "D3 A3 F#4"],
        chord: "keys",
        bass: bar("r............... r............... r............... r..............."),
        lead: ". . B4 . . . D5 . . . G5 . . . F#5 . . . . . E5 . . . B4 . . . . . . . . . C5 . . . E5 . . . G5 . . . A5 . F#5 . . . D5 . . . . . . . . . . .",
        leadVoice: "bell",
      },
    ],
  },
  minecraft: {
    name: "overworld radio",
    tracks: [
      {
        title: "grass block",
        bpm: 72,
        drums: {},
        chords: ["C3 G3 E4", "A2 E3 C4", "F2 C3 A3", "G2 D3 B3"],
        chord: "keys",
        bass: bar("r............... r............... r............... r..............."),
        lead: "E5 . . . . . G5 . . . . . D5 . . . . . . . C5 . . . . . . . . . . . A4 . . . . . C5 . . . . . E5 . . . . . . . D5 . . . . . . . . . . . . . . .",
        leadVoice: "keys",
      },
      {
        title: "creeper nearby",
        bpm: 96,
        drums: { kick: "x.......x.......", hat: "..o...o...o...o." },
        chords: ["D3 F3 A3", "D3 F3 A#3", "C3 E3 G3", "C#3 E3 G3"],
        chord: "saw",
        bass: bar("r...r...r...r... r...r...r...r... r...r...r...r... r...r...r...r..."),
        lead: "A4 . . . A#4 . . . A4 . . . G4 . . . F4 . . . . . . . E4 . . . . . . . D4 . . . F4 . . . A4 . . . C#5 . . . D5 . . . . . . . . . . . . . . .",
        leadVoice: "pluck",
      },
    ],
  },
  blade: {
    name: "blood rave radio",
    tracks: [
      {
        title: "sprinkler system",
        bpm: 132,
        drums: { kick: "x...x...x...x...", clap: "....x.......x...", hat: "..x...x...x...xo" },
        chords: ["A2 C3 E3", "A2 C3 E3", "F2 A2 C3", "G2 B2 D3"],
        chord: "square",
        bass: bar("..r...r...r...r. ..r...r...r...r. ..r...r...r...r. ..r...r...r.r.r."),
        lead: "A2 A2 A3 A2 C3 A2 E3 A2 A2 G2 A3 A2 C3 A2 D3 E3 A2 A2 A3 A2 C3 A2 E3 A2 G3 A2 E3 A2 C3 D3 C3 G2",
        leadVoice: "acid",
      },
      {
        title: "daywalker",
        bpm: 96,
        drums: { kick: "x.....x.x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
        chords: ["D3 F3 A3", "C3 E3 G3", "A#2 D3 F3", "A2 C#3 E3"],
        chord: "saw",
        bass: bar("r...r...r.r.r... r...r...r.r.r... r...r...r.r.r... r...r...r.r.r.r."),
        lead: "D5 . . . F5 . E5 . D5 . . . A4 . . . C5 . . . E5 . D5 . C5 . . . G4 . . . A#4 . . . D5 . C5 . A#4 . . . F4 . . . A4 . . . C#5 . E5 . A5 . . . . . . .",
        leadVoice: "saw",
      },
    ],
  },
  gtav: {
    name: "vinewood fm",
    tracks: [
      {
        title: "grove street, 2am",
        bpm: 92,
        swing: 0.22,
        drums: { kick: "x.....x...x.....", snare: "....x.......x...", hat: "x.x.x.xox.x.x.xo" },
        chords: ["D3 F3 A3 C4 E4", "G2 F3 B3 E4", "C3 E3 G3 B3 D4", "A2 G3 C#4 E4"],
        chord: "keys",
        bass: bar("r... ..r. r... .... r... ..r. r.r. .... r... ..r. r... .... r... ..r. r... r..."),
        lead: ". . . . A4 . C5 . . . . . G4 . . . . . . . E4 . D4 . . . . . . . . . . . . . G4 . A4 . . . E4 . . . . . . . . . . . . . . C#5 . . . . . . .",
        leadVoice: "bell",
      },
      {
        title: "freeway lights",
        bpm: 106,
        drums: { kick: "x...x...x...x...", snare: "....x.......x...", hat: "..x...x...x...x.", clap: "....x.......x..." },
        chords: ["E3 G3 B3 D4", "C3 E3 G3 B3", "G3 B3 D4 F#4", "D3 F#3 A3 C#4"],
        chord: "saw",
        bass: bar("r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r. r.r.r.r.r.r.r.r."),
        lead: "B4 . E5 . G5 . E5 . B4 . E5 . G5 . A5 . G5 . E5 . C5 . E5 . G5 . E5 . C5 . B5 . A5 . G5 . D5 . G5 . B4 . D5 . F#5 . A5 . F#5 . D5 . A4 . D5 . F#5 . C#5 .",
        leadVoice: "saw",
      },
    ],
  },
  gtavi: {
    name: "ocean drive fm",
    tracks: [
      {
        title: "neon causeway",
        bpm: 116,
        drums: { kick: "x.......x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
        chords: ["F3 A3 C4 E4", "E3 G3 B3 D4", "D3 F3 A3 C4", "C3 E3 G3 B3"],
        chord: "saw",
        bass: "rRrRrRrRrRrRrRrR", // octave bounce on the root
        lead: "C5 . A4 . F4 . A4 . C5 . E5 . . . B4 . G4 . E4 . G4 . B4 . D5 . . . A4 . F4 . D4 . F4 . A4 . C5 . . . G4 . E4 . C4 . E4 . G4 . B4 . C5 .",
        leadVoice: "bell",
      },
      {
        title: "leonida after dark",
        bpm: 84,
        swing: 0.12,
        drums: { kick: "x.........x.....", snare: "....x.......x...", hat: "x...x...x...x.o." },
        chords: ["A2 E3 G3 C4 E4", "F2 C3 E3 A3", "D3 F3 A3 C4", "E2 D3 G#3 B3"],
        chord: "keys",
        bass: bar("r.......r...r... r.......r....... r.......r...r... r.......r...r.r."),
        lead: ". . E5 . D5 . C5 . . . A4 . . . . . . . C5 . D5 . E5 . . . G5 . E5 . . . . . F5 . E5 . D5 . . . C5 . . . . . B4 . . . . . . . . . . . . . . .",
        leadVoice: "bell",
      },
    ],
  },
  fortnite: {
    name: "lobby radio",
    tracks: [
      {
        title: "ready up",
        bpm: 124,
        drums: { kick: "x.......x.x.....", snare: "....x.......x.x.", hat: "x.xxx.xxx.xxx.xx" },
        chords: ["C3 E3 G3 C4", "F3 A3 C4 F4", "G3 B3 D4 G4", "C3 E3 G3 C4", "A2 C3 E3 A3", "F3 A3 C4 F4", "D3 F#3 A3 D4", "G3 B3 D4 F4"],
        chord: "brass",
        bass: bar(
          "r...G2..r...G2.. r...C3..r...C3.. r...D3..r...D3.. r...G2..r...G2.. r...E2..r...E2.. r...C3..r...C3.. r...A2..r...A2.. r...D3..r...B2..",
        ),
        lead: "E5 . G5 . C6 . . . G5 . E5 . . . F5 . A5 . C6 . . . A5 . F5 . . . G5 . B5 . D6 . . . B5 . G5 . . . E5 . D5 . C5 . . . . . . . . . . E5 . A5 . C6 . . . A5 . E5 . . . F5 . A5 . C6 . . . A5 . F5 . . . F#5 . A5 . D6 . . . A5 . F#5 . . . G5 . . . F5 . . . D5 . . . B4 . . .",
        leadVoice: "pluck",
      },
      {
        title: "the storm is shrinking",
        bpm: 138,
        drums: { kick: "x..x..x...x..x..", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx" },
        chords: ["D3 F3 A3", "D3 F3 A#3", "C3 E3 G3", "A2 C#3 E3 A3"],
        chord: "square",
        bass: bar("rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr rrrrrrrrrrrrrrrr"),
        lead: "D5 . . D5 . . F5 . . . E5 . D5 . C5 . D5 . . D5 . . A#5 . . . A5 . G5 . F5 . E5 . . E5 . . G5 . . . F5 . E5 . D5 . C#5 . . . E5 . . . A5 . . . . . . .",
        leadVoice: "square",
      },
    ],
  },
};

// ---- notation ----
const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(n: string): number | null {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// "r... D3.." -> per-step tokens; single-char tokens for r/./x, note names kept whole
export function steps(s: string): string[] {
  if (s.includes(" ")) return s.trim().split(/\s+/);
  return s.match(/[A-G]#?\d|./g) ?? [];
}

// ---- instruments ----
type Out = { ac: AudioContext; bus: GainNode; noise: AudioBuffer };

function env(g: GainNode, t: number, peak: number, a: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function drum(o: Out, kind: Drum, t: number, vel: number) {
  const { ac, bus } = o;
  const g = ac.createGain();
  g.connect(bus);
  if (kind === "kick") {
    const osc = ac.createOscillator();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(g, t, 0.9 * vel, 0.003, 0.32);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.4);
    return;
  }
  const src = ac.createBufferSource();
  src.buffer = o.noise;
  const f = ac.createBiquadFilter();
  src.connect(f).connect(g);
  if (kind === "hat") {
    f.type = "highpass";
    f.frequency.value = 7500;
    env(g, t, 0.18 * vel, 0.001, 0.045);
  } else {
    f.type = "bandpass";
    f.frequency.value = kind === "clap" ? 1300 : 1900;
    f.Q.value = kind === "clap" ? 1.2 : 0.7;
    env(g, t, (kind === "clap" ? 0.35 : 0.45) * vel, 0.002, kind === "clap" ? 0.12 : 0.17);
    if (kind === "snare") {
      const body = ac.createOscillator();
      const bg = ac.createGain();
      body.type = "triangle";
      body.frequency.value = 190;
      env(bg, t, 0.25 * vel, 0.002, 0.08);
      body.connect(bg).connect(bus);
      body.start(t);
      body.stop(t + 0.12);
    }
  }
  src.start(t);
  src.stop(t + 0.3);
}

function tone(o: Out, voice: Voice, m: number, t: number, dur: number, peak: number) {
  const { ac, bus } = o;
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.connect(g).connect(bus);
  const f0 = hz(m);
  const osc = (type: OscillatorType, freq: number, detune = 0) => {
    const x = ac.createOscillator();
    x.type = type;
    x.frequency.value = freq;
    x.detune.value = detune;
    x.connect(f);
    x.start(t);
    x.stop(t + dur + 0.6);
    return x;
  };
  switch (voice) {
    case "keys": // electric-piano-ish: sine + soft triangle, bell-like decay
      f.frequency.value = 2400;
      osc("sine", f0);
      osc("triangle", f0 * 2, 4);
      env(g, t, peak, 0.005, dur * 1.6);
      break;
    case "saw": // detuned supersaw pad/lead
      f.frequency.setValueAtTime(900, t);
      f.frequency.linearRampToValueAtTime(2600, t + 0.08);
      osc("sawtooth", f0, -9);
      osc("sawtooth", f0, 9);
      env(g, t, peak * 0.6, 0.02, dur);
      break;
    case "bell": { // two-operator FM bell (80s keyboard flavour)
      f.frequency.value = 6000;
      const car = osc("sine", f0);
      const mod = ac.createOscillator();
      const mg = ac.createGain();
      mod.frequency.value = f0 * 3.5;
      mg.gain.setValueAtTime(f0 * 2.2, t);
      mg.gain.exponentialRampToValueAtTime(1, t + dur * 1.5);
      mod.connect(mg).connect(car.frequency);
      mod.start(t);
      mod.stop(t + dur + 0.6);
      env(g, t, peak, 0.003, dur * 1.8);
      break;
    }
    case "pluck":
      f.frequency.setValueAtTime(4000, t);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.25);
      osc("triangle", f0);
      osc("square", f0, 3);
      env(g, t, peak * 0.7, 0.002, 0.28);
      break;
    case "brass": // synth brass: filter swells open
      f.frequency.setValueAtTime(400, t);
      f.frequency.linearRampToValueAtTime(2200, t + 0.12);
      osc("sawtooth", f0, -5);
      osc("sawtooth", f0, 5);
      env(g, t, peak * 0.55, 0.05, dur);
      break;
    case "square":
      f.frequency.value = 1800;
      osc("square", f0);
      env(g, t, peak * 0.4, 0.004, dur);
      break;
    case "acid": // 303-style: resonant lowpass snapping open and shut, random accents
      f.Q.value = 12;
      f.frequency.setValueAtTime(260, t);
      f.frequency.exponentialRampToValueAtTime(1600 + Math.random() * 1600, t + 0.02);
      f.frequency.exponentialRampToValueAtTime(260, t + dur);
      osc("sawtooth", f0);
      env(g, t, peak * 0.7, 0.003, dur);
      break;
  }
}

function bassNote(o: Out, m: number, t: number, dur: number, sub: boolean) {
  const { ac, bus } = o;
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  const x = ac.createOscillator();
  x.type = sub ? "sine" : "sawtooth";
  x.frequency.value = hz(m);
  f.type = "lowpass";
  f.frequency.setValueAtTime(sub ? 400 : 1100, t);
  f.frequency.exponentialRampToValueAtTime(220, t + dur);
  x.connect(f).connect(g).connect(bus);
  env(g, t, sub ? 0.5 : 0.32, 0.005, dur);
  x.start(t);
  x.stop(t + dur + 0.1);
}

// ---- transport ----
// One playlist per station: real files (content/music.ts) first, then the synth loops.
export type Entry = { title: string; artist?: string; src?: string; start?: number; volume?: number; synth?: Track };
// Real files count only once a HEAD check (probe) has found them; until then the station shows its loops.
const found = new Set<string>();
const probed = new Set<Theme>();

export function playlist(theme: Theme): Entry[] {
  // songs uploaded in /admin (Blob URLs, known to exist) play before the repo's files
  const uploaded = clientSettings().music?.[theme] ?? [];
  const real = (MUSIC[theme] ?? []).filter((r) => isSoundCloud(r.src) || found.has(r.src));
  return [...uploaded, ...real, ...(STATIONS[theme]?.tracks ?? []).map((t) => ({ title: t.title, synth: t }))];
}

// Once per theme per visit: ask which listed songs are actually in public/music.
export async function probe(theme: Theme) {
  if (probed.has(theme)) return;
  probed.add(theme);
  await Promise.all(
    (MUSIC[theme] ?? []).filter((r) => !isSoundCloud(r.src)).map((r) =>
      fetch(r.src, { method: "HEAD" })
        .then((res) => res.ok && (res.headers.get("content-type") ?? "").startsWith("audio") && found.add(r.src))
        .catch(() => {}),
    ),
  );
  if (state.theme === theme && !state.playing) emit(); // the card can now show the real first song
}

type State = { theme: Theme | null; index: number; playing: boolean };
let state: State = { theme: null, index: 0, playing: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
export const snapshot = () => state;

let out: Out | null = null;
let analyser: AnalyserNode | null = null;
let file: HTMLAudioElement | null = null;
let fileGain: GainNode | null = null;
let level: GainNode | null = null;
let timer = 0;
let loopT0 = 0; // when the current synth loop started (audio clock)
let step = 0;
let nextAt = 0;

export const getAnalyser = () => analyser;

// The listener's own volume knob (0 to 1), kept in their browser. Scales the whole station.
const LEVEL = 0.16; // under the page, not over it
export function volume() {
  try {
    const v = Number(localStorage.getItem("radio-volume") ?? 1);
    return v >= 0 && v <= 1 ? v : 1;
  } catch {
    return 1;
  }
}
export function setVolume(v: number) {
  try {
    localStorage.setItem("radio-volume", String(v));
  } catch {}
  if (level && out) level.gain.setTargetAtTime(LEVEL * v, out.ac.currentTime, 0.03);
  const e = state.theme ? playlist(state.theme)[state.index] : undefined;
  if (e && isSoundCloud(e.src)) widget?.setVolume(scLevel(e));
}

// "M83 (https://youtube.com/...)": the artist, and a link to the song if one was pasted after it.
export function splitArtist(artist: string): [string, string?] {
  const m = artist.match(/^(.*?)\s*\(?\s*(https:\/\/[^\s()]+)\s*\)?\s*$/);
  return m ? [m[1], m[2]] : [artist];
}

// Where the station is (seconds), for the card's timer. Songs: the file's time (dur NaN until it loads).
// Synth loops: position within one pass of the chord progression; `loop` marks them (no seeking).
export function position(theme: Theme): { cur: number; dur: number; loop?: true } {
  const i = state.theme === theme ? state.index : 0;
  const e = playlist(theme)[i];
  const live = state.theme === theme && state.playing;
  if (e?.synth) {
    const dur = (e.synth.chords.length * 16 * 60) / e.synth.bpm / 4;
    return { cur: live && out ? (out.ac.currentTime - loopT0) % dur : 0, dur, loop: true };
  }
  if (isSoundCloud(e?.src)) return sc.src === e?.src ? { cur: sc.cur, dur: sc.dur } : { cur: 0, dur: NaN };
  if (!e?.src || !file || file.dataset.src !== e.src) return { cur: 0, dur: NaN };
  return { cur: file.currentTime, dur: file.duration };
}
export function seek(sec: number) {
  if (!Number.isFinite(sec)) return;
  const e = state.theme ? playlist(state.theme)[state.index] : undefined;
  if (isSoundCloud(e?.src)) return void (widget?.seekTo(sec * 1000), (sc.cur = sec));
  if (file) file.currentTime = sec;
}

function setup(): Out {
  if (out) return out;
  const { ac, master } = graph();
  const bus = ac.createGain();
  bus.gain.value = 0;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  analyser = ac.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;
  level = ac.createGain();
  level.gain.value = LEVEL * volume();
  bus.connect(comp).connect(analyser).connect(level).connect(master);
  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (out = { ac, bus, noise });
}

// Real songs play through one <audio>, routed into the same analyser (so the visualizer still works).
function fileEl(o: Out) {
  if (file) return file;
  const el = (file = new Audio());
  el.preload = "auto";
  el.crossOrigin = "anonymous"; // uploads live on the Blob host; without CORS mode Web Audio gets silence
  el.addEventListener("ended", () => state.theme && skip(state.theme, 1)); // songs advance; loops loop
  // times the shared level: mastered tracks sit a little above the loops (and each song's own volume)
  fileGain = o.ac.createGain();
  o.ac.createMediaElementSource(el).connect(fileGain).connect(analyser!);
  // a listed file that isn't there (or won't decode): move on rather than sit silent
  el.addEventListener("error", () => state.playing && state.theme && skip(state.theme, 1));
  return el;
}

function stopAll() {
  clearInterval(timer);
  file?.pause();
  widget?.pause();
}

// ---- SoundCloud ----
// Songs whose src is a SoundCloud page stream through SoundCloud's embedded player (their Widget API),
// which RadioPlayer keeps visible in the card: that's the licence (SoundCloud's player, credited, linked).
// The site only drives it: play, pause, seek, volume, next. Its audio can't reach Web Audio, so the
// visualizer fakes it and the site's master gain doesn't apply (the sound toggle pauses it instead).
type Widget = {
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  setVolume(v: number): void;
  getDuration(cb: (ms: number) => void): void;
  load(url: string, o: Record<string, unknown>): void;
  bind(ev: string, cb: (e?: { currentPosition: number }) => void): void;
};
type SCApi = { Widget: ((el: HTMLIFrameElement) => Widget) & { Events: Record<"READY" | "PLAY_PROGRESS" | "FINISH", string> } };
let frame: HTMLIFrameElement | null = null;
let widget: Widget | null = null;
const sc = { src: "", cur: 0, dur: NaN, moved: false };

// the card hands over its iframe (and takes it back when it unmounts)
export function soundCloudFrame(el: HTMLIFrameElement | null) {
  frame = el;
  if (!el) [widget, sc.src] = [null, ""];
}

let api: Promise<SCApi> | null = null;
const loadApi = () =>
  (api ??= new Promise<SCApi>((ok, no) => {
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.onload = () => ok((window as unknown as { SC: SCApi }).SC);
    s.onerror = () => ((api = null), no(new Error("soundcloud api")));
    document.head.append(s);
  }));

// same level a hosted file would get: 2x the station level, times the song's own volume, as 0..100
const scLevel = (e: Entry) => Math.round(Math.min(1, 2 * LEVEL * volume() * (e.volume ?? 1)) * 100);

// SoundCloud's mini player, its buttons in the theme's accent
function widgetUrl(src: string) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--amber").trim().replace("#", "");
  const q = new URLSearchParams({ url: src, auto_play: "true", color: accent || "ffb547", hide_related: "true", show_comments: "false", show_reposts: "false", show_teaser: "false", visual: "false" });
  return `https://w.soundcloud.com/player/?${q}`;
}

async function playSoundCloud(e: Entry) {
  const src = e.src!;
  if (!frame) return;
  if (widget && sc.src === src) return widget.play(); // same song: resume
  const SC = await loadApi().catch(() => null);
  if (!SC || !frame) return state.theme && skip(state.theme, 1);
  Object.assign(sc, { src, cur: e.start ?? 0, dur: NaN, moved: false });
  const ready = () => {
    if (sc.src !== src || !widget) return;
    widget.setVolume(scLevel(e));
    if (e.start) widget.seekTo(e.start * 1000);
    widget.getDuration((ms) => (sc.dur = ms / 1000));
    if (state.playing) widget.play();
    else widget.pause();
    // a song SoundCloud won't play here (blocked in the visitor's country, taken down) never makes
    // progress and fires no error: give it 8s, then move on
    setTimeout(() => sc.src === src && !sc.moved && state.playing && state.theme && skip(state.theme, 1), 8000);
  };
  if (widget) return widget.load(src, { auto_play: state.playing, callback: ready });
  frame.src = widgetUrl(src);
  const w = (widget = SC.Widget(frame));
  const E = SC.Widget.Events;
  w.bind(E.READY, ready);
  w.bind(E.PLAY_PROGRESS, (p) => p && Object.assign(sc, { cur: p.currentPosition / 1000, moved: true }));
  w.bind(E.FINISH, () => state.playing && state.theme && skip(state.theme, 1));
  // ponytail: presses on SoundCloud's own play button aren't mirrored into the card's state
}

function schedule(o: Out, tr: Track, s: number, t: number) {
  const beat = 60 / tr.bpm;
  const sixteenth = beat / 4;
  const inBar = s % 16;
  const barN = Math.floor(s / 16) % tr.chords.length;
  for (const [k, pat] of Object.entries(tr.drums) as [Drum, string][]) {
    const c = pat[inBar % pat.length];
    if (c === "x" || c === "o") drum(o, k, t, c === "x" ? 1 : 0.5);
  }
  const chord = tr.chords[barN].split(" ").map(midi).filter((m): m is number => m !== null);
  if (inBar === 0) chord.forEach((m) => tone(o, tr.chord, m, t, beat * (tr.chord === "keys" || tr.chord === "saw" ? 3.6 : 1.8), 0.11));
  if (tr.chord === "brass" && inBar === 8) chord.forEach((m) => tone(o, "brass", m, t, beat * 1.5, 0.09));
  if (tr.chord === "square" && inBar % 4 === 2) chord.forEach((m) => tone(o, "square", m + 12, t, sixteenth * 1.5, 0.07));
  const bs = steps(tr.bass);
  const b = bs[s % bs.length];
  if (b && b !== ".") {
    const m = b === "r" ? chord[0] - 12 : b === "R" ? chord[0] : midi(b);
    if (m !== null) bassNote(o, m, t, sixteenth * 1.8, tr.bpm < 100);
  }
  if (tr.lead) {
    const ls = steps(tr.lead);
    const n = ls[s % ls.length];
    const m = n && n !== "." ? midi(n) : null;
    if (m !== null) tone(o, tr.leadVoice ?? "bell", m, t, sixteenth * 2.5, 0.12);
  }
}

function run() {
  const o = setup();
  const tr = state.theme ? playlist(state.theme)[state.index]?.synth : undefined;
  if (!tr) return;
  const sixteenth = 60 / tr.bpm / 4;
  while (nextAt < o.ac.currentTime + 0.12) {
    const swing = step % 2 ? (tr.swing ?? 0) * sixteenth : 0;
    schedule(o, tr, step, nextAt + swing);
    step++;
    nextAt += sixteenth;
  }
}

function startClock() {
  const o = setup();
  clearInterval(timer);
  step = 0;
  nextAt = o.ac.currentTime + 0.08;
  loopT0 = nextAt;
  timer = window.setInterval(run, 25);
  run();
}

// Must follow a user gesture the first time (audio.start() resumes the context).
export async function play(theme: Theme, index = state.index) {
  const list = playlist(theme);
  if (!list.length) return;
  const audio = await import("@/lib/audio");
  if (!(await audio.start())) return;
  const o = setup();
  const i = ((index % list.length) + list.length) % list.length;
  if (state.playing && state.theme === theme && state.index === i) return;
  state = { theme, index: i, playing: true };
  emit();
  bedOn(false);
  stopAll();
  const e = list[i];
  if (isSoundCloud(e.src)) {
    o.bus.gain.setTargetAtTime(0, o.ac.currentTime, 0.05);
    void playSoundCloud(e);
  } else if (e.src) {
    o.bus.gain.setTargetAtTime(0, o.ac.currentTime, 0.05);
    const el = fileEl(o);
    fileGain!.gain.value = 2 * (e.volume ?? 1);
    // new song: start at its peak (media fragment #t=); same song: resume where it paused
    if (el.dataset.src !== e.src) {
      el.dataset.src = e.src;
      el.src = e.start ? `${e.src}#t=${e.start}` : e.src;
    }
    void el.play().catch(() => {});
  } else {
    o.bus.gain.setTargetAtTime(1, o.ac.currentTime, 0.05);
    startClock();
  }
}

export function pause() {
  if (out) out.bus.gain.setTargetAtTime(0, out.ac.currentTime, 0.08);
  stopAll();
  state = { ...state, playing: false };
  emit();
}

// Leaving the station themes: stop the station and let the ambient bed back in.
export function off() {
  pause();
  state = { ...state, theme: null, index: 0 };
  emit();
  bedOn(true);
}

export function skip(theme: Theme, dir: 1 | -1) {
  const n = playlist(theme).length || 1;
  const index = (state.index + dir + n) % n;
  if (state.playing) void play(theme, index);
  else {
    state = { ...state, theme, index };
    emit();
  }
}
