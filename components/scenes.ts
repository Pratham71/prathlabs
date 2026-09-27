// Background events for two station themes, drawn into ThemeScenery's 3px-cell canvas:
// los santos: police chases (a car, a bike, or an Oppressor that blows up a car first) with cruisers and a
//   helicopter, and fighter jets passing over (inspired by the P-996 Lazer); sirens, rotors, jets, booms.
// battle bus: the bus crosses and drops players, they fight, and "you" win.
// All original pixel drawings. Each scene keeps its own state; ThemeScenery calls frame() every frame on a
// half-resolution canvas (one cell = 6 screen px), so speeds are in those cells per second.
import { clientSettings } from "@/lib/client-settings";
import type { SceneSound } from "@/lib/settings";

type Pal = Record<string, string>;
export type Scene = { frame: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void; reset: (t: number) => void };

export function put(ctx: CanvasRenderingContext2D, rows: string[], pal: Pal, x: number, y: number, s = 1, flip = false) {
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch === "." || !pal[ch]) return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(Math.round(x + (flip ? row.length - 1 - dx : dx) * s), Math.round(y + dy * s), s, s);
    }),
  );
}

// each sound as /admin set it (SCENE SOUNDS): switched off, turned up or down, or an uploaded clip
const sound = (k: SceneSound, dur?: number) => {
  const set = clientSettings().scene?.[k];
  if (!set?.off) void import("@/lib/audio").then((a) => a.scene(k, dur, set));
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);
// the ground the events stand on: above the radio card (bottom left) and the dock (bottom right)
const groundOf = (h: number) => h - 30;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };
function sparks(list: Spark[], x: number, y: number, n: number, cols: string[], speed = 16) {
  for (let i = 0; i < n; i++)
    list.push({ x, y, vx: rand(-speed, speed), vy: rand(-speed * 1.2, speed * 0.3), life: rand(0.6, 1.6), c: cols[Math.floor(Math.random() * cols.length)] });
}
function drawSparks(ctx: CanvasRenderingContext2D, list: Spark[], dt: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if ((p.life -= dt) <= 0) {
      list.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 10 * dt;
    ctx.globalAlpha = Math.min(1, p.life);
    ctx.fillStyle = p.c;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  ctx.globalAlpha = 1;
}
const FIRE = ["#ff7a1a", "#ffd23f", "#ff3b1a", "#555", "#333"];

// 3x5 letters for the battle bus tags
const FONT: Record<string, string[]> = {
  Y: ["1.1", "1.1", ".1.", ".1.", ".1."],
  O: ["111", "1.1", "1.1", "1.1", "111"],
  U: ["1.1", "1.1", "1.1", "1.1", "111"],
  "#": ["1.1", "111", "1.1", "111", "1.1"],
  "1": [".1.", "11.", ".1.", ".1.", "111"],
};
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, col: string) {
  [...s].forEach((ch, i) => put(ctx, FONT[ch] ?? [], { "1": col }, x + i * 4, y));
}

// ---------------------------------------------------------------- los santos

const CAR = ["...cccccc...", "..cwwccwwc..", "cccccccccccc", "cccccccccccc", ".kk......kk."];
const COP = [".....rb.....", "...WWWWWW...", "..WwwWWwwW..", "kkkkkkkkkkkk", "kWWWWWWWWWWk", ".kk......kk."];
const BIKE = ["....hh..", "...rrr..", ".mmmrmm.", "kk....kk", "kk....kk"];
const MK2 = ["....hh....", "...rrr....", "gggggrgggg", "..gggggg..", ".y......y."];
const HELI = ["llllllllllllll", "......k.......", "...kkkkkk.....", "..kwwkkkkkkkkk", "..kkkkkkk...kk", "...k...k......"];
const JET = ["gg..............", "ggg.............", "gggggggggggwwgg.", "gggggggggggggggg", "...ggggggg......", "....gg.........."];
const WRECK = ["...kkkkkk...", "..kkkkkkkk..", "kkkkkkkkkkkk", "kkkkkkkkkkkk", ".kk......kk."];
const SUSPECT = ["#e2383b", "#2f7de1", "#f2c94c", "#46b36b", "#b061d6"];

export function losSantos(): Scene {
  type Chase = { t0: number; dir: 1 | -1; kind: "car" | "bike" | "mk2"; cops: number; heli: boolean; col: string; victim?: { x: number; hitAt: number | null } };
  let chase: Chase | null = null;
  let jets: { t0: number; dir: 1 | -1; y: number; n: number } | null = null;
  let nextChase = 0, nextJets = 0;
  const fx: Spark[] = [];
  return {
    reset(t) {
      chase = jets = null;
      nextChase = t + 5;
      nextJets = t + 14;
      fx.length = 0;
    },
    frame(ctx, w, h, t, dt) {
      const road = groundOf(h);
      if (!chase && t > nextChase) {
        const kind = (["car", "bike", "mk2"] as const)[Math.floor(Math.random() * 3)];
        const dir = Math.random() < 0.5 ? 1 : -1;
        chase = { t0: t, dir, kind, cops: 1 + Math.floor(Math.random() * 3), heli: kind === "mk2" || Math.random() < 0.6, col: SUSPECT[Math.floor(Math.random() * SUSPECT.length)] };
        if (kind === "mk2") chase.victim = { x: dir > 0 ? w * rand(0.1, 0.2) : w * rand(0.8, 0.9), hitAt: null };
        const cross = (w + 120) / (kind === "mk2" ? 26 : kind === "bike" ? 38 : 32);
        sound("siren", cross);
        if (chase.heli) sound("heli", cross);
      }
      if (chase) {
        const c = chase, k = t - c.t0, dir = c.dir;
        const speed = c.kind === "mk2" ? 26 : c.kind === "bike" ? 38 : 32;
        const at = (lead: number) => (dir > 0 ? -20 + k * speed - lead : w + 20 - k * speed + lead);
        const sx = at(0);
        const flash = Math.floor(t * 7) % 2 ? { r: "#ff2a2a", b: "#2a5bff" } : { r: "#2a5bff", b: "#ff2a2a" };
        // the oppressor's victim: a car minding its business, until a missile finds it
        if (c.victim) {
          const v = c.victim;
          if (v.hitAt === null && Math.abs(sx - v.x) < 28) {
            v.hitAt = t;
            sound("boom", 1.6);
          }
          const hit = v.hitAt !== null && t - v.hitAt > 0.35;
          if (v.hitAt !== null && !hit) {
            // the missile: a streak from the bike down to the car
            const p = (t - v.hitAt) / 0.35;
            ctx.fillStyle = "#ffd23f";
            ctx.fillRect(Math.round(sx + 5 + (v.x + 6 - sx - 5) * p), Math.round(road - 20 + 16 * p), 1, 1);
          }
          if (hit && fx.length < 400 && t - v.hitAt! < 0.45) sparks(fx, v.x + 6, road - 5, 25, FIRE, 20);
          put(ctx, hit ? WRECK : CAR, { c: "#7a8a9a", w: "#cfe3f2", k: "#151515" }, v.x, road - CAR.length, 1);
        }
        if (c.kind === "car") put(ctx, CAR, { c: c.col, w: "#cfe3f2", k: "#151515" }, sx, road - CAR.length, 1, dir < 0);
        else if (c.kind === "bike") put(ctx, BIKE, { h: "#222", r: c.col, m: "#666", k: "#151515" }, sx, road - BIKE.length, 1, dir < 0);
        else put(ctx, MK2, { h: "#222", r: c.col, g: "#3c3f45", y: Math.floor(t * 10) % 2 ? "#ffb347" : "#ff5a1a" }, sx, road - 22 + Math.sin(k * 3) * 1.5, 1, dir < 0);
        // the cruisers only join once a car's been hit (the oppressor case)
        const late = c.victim ? (c.victim.hitAt === null ? Infinity : c.victim.hitAt - c.t0 + 1) : 0;
        for (let i = 0; i < c.cops; i++) {
          if (k < late) break;
          const cx = dir > 0 ? -20 + (k - late) * (speed + 2) - 18 - i * 16 : w + 20 - (k - late) * (speed + 2) + 18 + i * 16;
          put(ctx, COP, { r: flash.r, b: flash.b, W: "#f2f2f2", w: "#9fb6c9", k: "#151515" }, cx, road - COP.length, 1, dir < 0);
        }
        if (c.heli) {
          const hx = sx - dir * 10, hy = road - 34 + Math.sin(k * 1.7) * 1.5;
          // searchlight on the suspect
          ctx.fillStyle = "rgba(255,255,220,0.1)";
          ctx.beginPath();
          ctx.moveTo(hx + 7, hy + 5);
          ctx.lineTo(sx - 6, road);
          ctx.lineTo(sx + 16, road);
          ctx.fill();
          const rotor = Math.floor(t * 14) % 2 ? HELI : ["...llllllll...", ...HELI.slice(1)];
          put(ctx, rotor, { l: "#9aa3ad", k: "#1b2230", w: "#8fb3d9" }, hx, hy, 1, dir < 0);
        }
        if (k * speed > w + 140 + (Number.isFinite(late) ? late * speed : 0)) {
          chase = null;
          nextChase = t + rand(22, 40);
        }
      }
      if (!jets && t > nextJets) {
        jets = { t0: t, dir: Math.random() < 0.5 ? 1 : -1, y: h * rand(0.05, 0.14), n: 1 + Math.floor(Math.random() * 3) };
        sound("jet", (w + 120) / 75);
      }
      if (jets) {
        const k = t - jets.t0;
        for (let i = 0; i < jets.n; i++) {
          const x = jets.dir > 0 ? -30 + k * 75 - i * 22 : w + 30 - k * 75 + i * 22;
          const y = jets.y + i * 7;
          // contrail
          ctx.fillStyle = "rgba(230,235,240,0.18)";
          ctx.fillRect(jets.dir > 0 ? Math.max(0, x - 60) : x + 16, Math.round(y + 3), 60, 1);
          ctx.fillStyle = Math.floor(t * 20) % 2 ? "#ffb347" : "#ff5a1a";
          ctx.fillRect(jets.dir > 0 ? x - 1 : x + 16, Math.round(y + 3), 1, 1); // afterburner
          put(ctx, JET, { g: "#7c858f", w: "#2b3a4a" }, x, y, 1, jets.dir < 0);
        }
        if (k * 75 > w + 120) {
          jets = null;
          nextJets = t + rand(30, 55);
        }
      }
      drawSparks(ctx, fx, dt);
    },
  };
}

// ---------------------------------------------------------------- battle bus

const BUS = ["....bbbbbbbb....", "...bwwbbbbwwb...", "....bbbbbbbb....", ".....b....b.....", "..BBBBBBBBBBBBB.", "..BwwBwwBwwBwwB.", "..BBBBBBBBBBBBB.", "...kk......kk..."];
const BUS_PAL = { b: "#3aa3ff", w: "#f2f2f2", B: "#2456c7", k: "#111" };
const PLAYER = [".hh.", ".ss.", "cccc", ".cc.", ".pp.", ".p.p"];
const GLIDER = ["gggggg", "g....g", ".g..g."];
const OUTFITS = ["#f2c94c", "#46b36b", "#e2383b", "#b061d6", "#ff8a3d", "#29c7c7"];
type Player = { x: number; y: number; landed: boolean; hp: number; you: boolean; col: string; next: number; shot?: { tx: number; ty: number; until: number } };

export function battleBus(): Scene {
  let bus: { t0: number; dir: 1 | -1; drops: number[] } | null = null;
  let players: Player[] = [];
  let won: number | null = null;
  let nextBus = 0;
  const fx: Spark[] = [];
  return {
    reset(t) {
      bus = null;
      players = [];
      won = null;
      nextBus = t + 4;
      fx.length = 0;
    },
    frame(ctx, w, h, t, dt) {
      const ground = groundOf(h);
      const busY = Math.round(h * 0.1);
      if (!bus && !players.length && t > nextBus) {
        // drop points in the side margins, where the page doesn't cover them
        const side = () => (Math.random() < 0.5 ? rand(0.03, 0.18) : rand(0.82, 0.96)) * w;
        // at least one on the left: that's where "you" land
        bus = { t0: t, dir: Math.random() < 0.5 ? 1 : -1, drops: [rand(0.04, 0.16) * w, ...Array.from({ length: 5 }, side)] };
      }
      if (bus) {
        const b = bus, x = b.dir > 0 ? -20 + (t - b.t0) * 22 : w + 4 - (t - b.t0) * 22;
        put(ctx, BUS, BUS_PAL, x, busY + Math.sin(t * 2) * 1.5, 1, b.dir < 0);
        b.drops = b.drops.filter((dx) => {
          if (Math.abs(x + 8 - dx) > 2) return true;
          players.push({ x: dx, y: busY + 9, landed: false, hp: 2, you: false, col: OUTFITS[players.length % OUTFITS.length], next: 0 });
          return false;
        });
        if (b.dir > 0 ? x > w + 20 : x < -24) {
          bus = null;
          const left = players.filter((p) => p.x < w / 2);
          const you = left[Math.floor(Math.random() * left.length)] ?? players[0];
          if (you) Object.assign(you, { you: true, hp: 6 });
        }
      }
      const alive = players.filter((p) => p.hp > 0);
      for (const p of alive) {
        if (!p.landed) {
          p.y += 11 * dt;
          if (p.y >= ground - PLAYER.length) {
            p.y = ground - PLAYER.length;
            p.landed = true;
            p.next = t + rand(0.5, 1.5);
          }
          put(ctx, GLIDER, { g: p.col }, p.x - 1, p.y - 4);
        } else if (!bus && alive.length > 1 && t > p.next) {
          // shoot someone: the nearest other player; hits sometimes
          const foe = alive.filter((q) => q !== p).sort((a, b2) => Math.abs(a.x - p.x) - Math.abs(b2.x - p.x))[0];
          p.shot = { tx: foe.x + 2, ty: foe.y + 3, until: t + 0.08 };
          // "you" can be hit, but never eliminated: the visitor always takes the #1
          if (Math.random() < (p.you ? 0.8 : 0.45) && !(foe.you && foe.hp <= 1) && --foe.hp <= 0) sparks(fx, foe.x + 2, foe.y + 3, 18, ["#3aa3ff", "#b3e0ff", "#f2f2f2"], 12);
          p.next = t + rand(0.5, 1.2);
        }
        if (p.shot && t < p.shot.until) {
          ctx.strokeStyle = "rgba(255,230,120,0.8)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x + 2, p.y + 3);
          ctx.lineTo(p.shot.tx, p.shot.ty);
          ctx.stroke();
        }
        put(ctx, PLAYER, { h: "#3a2418", s: "#d69a72", c: p.col, p: "#2d2d3a" }, p.x, p.y);
        if (p.you) text(ctx, "YOU", p.x - 4, p.y - 8, "#f2f2f2");
      }
      if (!bus && players.length && alive.length === 1 && won === null) won = t;
      if (won !== null) {
        const p = alive[0];
        if (p) text(ctx, "#1", p.x - 2, p.y - 15, "#f2c94c");
        if (t - won > 5) {
          players = [];
          won = null;
          nextBus = t + rand(25, 40);
        }
      }
      drawSparks(ctx, fx, dt);
    },
  };
}

// Battle bus props for the empty sides (ThemeScenery's static layer, 3px cells, drawn at 2x):
// a loot llama and a pine on the left, a gold chest, a bush and a supply drop on the right.
const LLAMA = ["...pp.......", "...ppp......", "..pwkp......", "..pppp......", "...pp.......", "...pp.......", "...pppppppp.", "..pybbpybbp.", "..pmmyymmpp.", "..pppppppppp", "..p.p...p.p.", "..p.p...p.p."];
const PINE = ["....g....", "...ggg...", "..ggggg..", "...ggg...", "..ggggg..", ".ggggggg.", "..ggggg..", ".ggggggg.", "ggggggggg", "....t....", "....t...."];
const CHEST = ["..yyyyyy..", ".yooooooy.", "yooooooooy", "yyyyqqyyyy", "yooooooooy", "yooooooooy", "yyyyyyyyyy"];
const BUSH = ["..gggg..", ".gggggg.", "gggggggg", "gggggggg"];
const DROP = ["..bbbb..", ".bbbbbb.", ".bbbbbb.", "..bbbb..", "...ll...", "..l..l..", ".cccccc.", ".cwccwc.", ".cccccc."];

export function fortniteProps(l: CanvasRenderingContext2D, w: number, h: number) {
  const S = 2;
  const ground = h - 60; // 180px up: level with where the players land, above the radio card and dock
  const at = (rows: string[], pal: Record<string, string>, fx: number, y?: number) =>
    put(l, rows, pal, Math.round(w * fx), y ?? ground - rows.length * S, S);
  // a strip of grass in each margin
  l.fillStyle = "#2f8f3a";
  l.fillRect(0, ground, Math.round(w * 0.19), 2);
  l.fillRect(Math.round(w * 0.81), ground, w, 2);
  at(LLAMA, { p: "#b37bff", w: "#fff", k: "#111", b: "#3aa3ff", m: "#ff5fa2", y: "#f2c94c" }, 0.03);
  at(PINE, { g: "#2f8f3a", t: "#6b4a2b" }, 0.12);
  at(CHEST, { y: "#f2c94c", o: "#c8932a", q: "#fff6c2" }, 0.85);
  at(BUSH, { g: "#3fa34d" }, 0.93);
  at(DROP, { b: "#3aa3ff", l: "#cfd8e3", c: "#6b4a2b", w: "#c8932a" }, 0.9, Math.round(h * 0.2));
}
