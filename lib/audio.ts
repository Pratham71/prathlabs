// Site audio: a quiet generated ambient bed plus tiny UI/boot sound effects, all synthesized with Web Audio
// (no files). Browser only; nothing is created until the visitor turns sound on.
// ponytail: generated bed; to use a recorded track instead, play an <audio loop> through `master` in start().

const CHORDS = [
  [110, 164.81, 220, 246.94, 329.63], // Am9
  [87.31, 130.81, 174.61, 220, 329.63], // Fmaj9
  [98, 146.83, 196, 246.94, 293.66], // G6/9
];
const BED_GAIN = 0.05;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voices: OscillatorNode[][] = [];
const timers: number[] = [];
let wanted = false;

function ensure() {
  if (ctx) return ctx;
  const ac = (ctx = new AudioContext());
  master = ac.createGain();
  master.gain.value = 0;
  master.connect(ac.destination);
  // silent in background tabs
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) void ac.suspend();
    else if (wanted) void ac.resume();
  });
  return ac;
}

function bed(ac: AudioContext, out: GainNode) {
  const bus = ac.createGain();
  bus.gain.value = BED_GAIN;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 650;
  lp.Q.value = 0.4;
  // slow filter drift so the pad breathes
  const lfo = ac.createOscillator();
  const lfoAmt = ac.createGain();
  lfo.frequency.value = 0.045;
  lfoAmt.gain.value = 220;
  lfo.connect(lfoAmt).connect(lp.frequency);
  lfo.start();
  lp.connect(bus).connect(out);

  voices = CHORDS[0].map((f, i) => {
    const g = ac.createGain();
    g.gain.value = i === 0 ? 0.5 : 0.28;
    const amp = ac.createOscillator();
    const ampAmt = ac.createGain();
    amp.frequency.value = 0.03 + Math.random() * 0.05;
    ampAmt.gain.value = 0.12;
    amp.connect(ampAmt).connect(g.gain);
    amp.start();
    g.connect(lp);
    return (["triangle", "sine"] as OscillatorType[]).map((type, k) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = k ? 7 : -7;
      o.connect(g);
      o.start();
      return o;
    });
  });

  // low room hum: filtered noise, barely there
  const noise = ac.createBufferSource();
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) d[i] = last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
  noise.buffer = buf;
  noise.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 180;
  const ng = ac.createGain();
  ng.gain.value = 0.6;
  noise.connect(bp).connect(ng).connect(out);
  noise.start();

  // chord changes every 16s, gliding
  let c = 0;
  timers.push(
    window.setInterval(() => {
      c = (c + 1) % CHORDS.length;
      voices.forEach((pair, i) => pair.forEach((o) => o.frequency.setTargetAtTime(CHORDS[c][i], ac.currentTime, 2.5)));
    }, 16000),
  );
  // sparse "data" pings, pentatonic, far in the background
  const ping = () => {
    const notes = [880, 987.77, 1318.5, 1479.98, 1760];
    blip(notes[Math.floor(Math.random() * notes.length)], 0.012, 0.9, "sine");
    timers.push(window.setTimeout(ping, 3500 + Math.random() * 5000));
  };
  timers.push(window.setTimeout(ping, 2500));
}

function blip(freq: number, gain: number, dur: number, type: OscillatorType = "square") {
  if (!ctx || !master || ctx.state !== "running") return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  tick: () => blip(2200, 0.012, 0.03),
  key: () => blip(1400 + Math.random() * 300, 0.01, 0.025),
  ok: () => {
    blip(880, 0.02, 0.25, "sine");
    window.setTimeout(() => blip(1318.5, 0.018, 0.35, "sine"), 70);
  },
};

// Must be called from a user gesture (click/key) the first time; browsers block audio before one.
export async function start() {
  wanted = true;
  const ac = ensure();
  if (!master) return false;
  if (!voices.length) bed(ac, master);
  await ac.resume().catch(() => {});
  if (ac.state !== "running") return false;
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(1, ac.currentTime, 0.6);
  return true;
}

export function stop() {
  wanted = false;
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  const ac = ctx;
  window.setTimeout(() => !wanted && void ac.suspend(), 900);
}
