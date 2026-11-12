// Background events for three station themes, drawn into ThemeScenery's 3px-cell canvas:
// los santos: police chases (a car, a bike, a Deluxo that takes off, or an Oppressor that blows up a car
//   first) with cruisers and a helicopter, and flybys (Lazers, Hydras, a Strikeforce, a Buzzard); sirens,
//   rotors, jets, booms.
// battle bus: the bus crosses and drops players, they fight, and "you" win.
// vice city: one thing at a time crosses the sunset: a speedboat or jet ski with its wake, flamingos in a
//   loose V or a lone pelican, a low-rider with neon underglow, an airboat or a news chopper.
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
  M: ["1.1", "111", "111", "1.1", "1.1"],
  T: ["111", ".1.", ".1.", ".1.", ".1."],
  E: ["111", "1..", "11.", "1..", "111"],
  L: ["1..", "1..", "1..", "1..", "111"],
};
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, col: string) {
  [...s].forEach((ch, i) => put(ctx, FONT[ch] ?? [], { "1": col }, x + i * 4, y));
}

// ---------------------------------------------------------------- los santos

// side-on 8-bit drawings after the in-game vehicles (the cruiser, the police Maverick, the Deluxo, the
// Oppressor Mk II, the Lazer, Hydra, B-11 Strikeforce and Buzzard); all face right, flipped for leftward runs
const COP = [
  ".............rrbb.............",
  "..........KKKKKKKKKK..........",
  "........Kkwwwwkwwwwwwk........",
  "......KKkwwwwwkwwwwwwwkK......",
  "..KKKKKKkWWWWWWWWWWWWkKKKKKK..",
  ".RkkkkkkkWWWWWkWWWWWWkkkkkkkY.",
  "RkkkkkkkkWWWWWkWWWWWWkkkkkkkkY",
  "kkkkttttkkkkkkkkkkkkkkttttkkkk",
  "....tHHt..............tHHt....",
  ".....tt................tt.....",
];
const COP_PAL = { k: "#1c2026", K: "#4a525c", W: "#f2f2f2", w: "#8fb3d9", Y: "#fff3b0", R: "#c8102e", t: "#0a0a0a", H: "#8a8f96" };
// a civilian sedan: the cruiser without its lightbar, one colour all over
const CAR = COP.slice(1);
const WHEELS = { w: "#8fb3d9", Y: "#fff3b0", R: "#c8102e", t: "#0a0a0a", H: "#8a8f96" };
const sedan = (c: string) => ({ ...WHEELS, k: c, K: c, W: c });
const WRECK_PAL = { k: "#161616", K: "#3a2a20", W: "#241c18", w: "#161616", Y: "#161616", R: "#161616", t: "#0a0a0a", H: "#2a2a2a" };
const BIKE = ["....hh..", "...rrr..", ".mmmrmm.", "kk....kk", "kk....kk"];
const DELUXO = [
  ".........SSSSSSSSS..........",
  "......Ssdsdsswwwwwws........",
  "...SSSsssssswwwwwwsSSSS.....",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSSY",
  "RssssssssssssssssssssssssssY",
  "dddddddddddddddddddddddddddd",
  "...tHHt..............tHHt...",
  "....tt................tt....",
];
// hover mode: the wheels fold flat and glow
const DELUXO_FLY = [...DELUXO.slice(0, 6), "..cttttc............cttttc..", "....cc................cc...."];
const DELUXO_PAL = { S: "#e4e8ec", s: "#aeb4ba", w: "#2e3947", d: "#6b7178", Y: "#fff3b0", R: "#c8102e", t: "#0a0a0a", H: "#8a8f96" };
const MK2 = [
  "...........hh.........",
  "..........hhv.........",
  ".........rrr..........",
  "....KK...rrrKKKKKKK...",
  "...kkkkkkrrkkkkkkkkkKK",
  "yEEEEkkkkkkkkkkkkkk...",
  "yEEEE..gggggggg.......",
  ".EEE......gggg..g.....",
  ".........g............",
];
const HELI = [
  "......llllllllllllllllllllllll..",
  "..................kk............",
  "KK.............WWWWWWWWWW.......",
  "Kk...........WWWWWWWWWwwwwWW....",
  "kkkkkkkkkkkkkWWWWWWWWWWwwwwwwwW.",
  ".k..........kkkkkkkkkkkkkwwwwk..",
  "............kkkkkkkkkkkkkkkkk...",
  ".............k.........k........",
  "...........ssssssssssssssssss...",
];
const BUZZARD = [
  ".....llllllllllllllllllllll.....",
  ".................kk.............",
  "Kk............KKKKKKKKK.........",
  "kk...........KkkkkkkkkwwwK......",
  "kkkkkkkkkkkkkkkkkkkkkkwwwwwk....",
  "............kkkkkkkkkkkkkkkk....",
  "............GGGGGGGkkkkkk.......",
  ".............k........k.........",
  "...........ssssssssssssssss.....",
];
// the rotor's other frame: a shorter blade, so it reads as spinning
const spin = (rows: string[]) => {
  const r = rows[0], a = r.indexOf("l"), b = r.lastIndexOf("l"), q = (b - a) >> 2;
  return [".".repeat(a + q) + "l".repeat(b - a - 2 * q + 1) + ".".repeat(r.length - b + q - 1), ...rows.slice(1)];
};
const HELI_PAL = { l: "#9aa3ad", k: "#1c2026", K: "#4a525c", W: "#eef1f4", w: "#8fb3d9", s: "#5a616b" };
const BUZZARD_PAL = { l: "#9aa3ad", k: "#23282f", K: "#4a525c", w: "#6f8aa8", G: "#6b7079", s: "#5a616b" };
// jets: row 5 starts with the exhaust, where the afterburner and contrail attach
const LAZER = [
  "gg..............................",
  "ggg.............................",
  "gggg..................Www.......",
  "ggggg...............gwwwww......",
  "gggggggggggggggggggggggggggggg..",
  "dgGgGgGgGgGgGgGgGgGgGgGgGgGgGgg.",
  "....GGGGGGGGGGGGGGGGGG..........",
  ".......mmmmmmmmm................",
];
const HYDRA = [
  ".gg.gg..........................",
  "gggggg..........................",
  "gggggg................Wwww......",
  "ggggggg............gwwwwwww.....",
  "ggggggggggggggggggggggggggggggg.",
  "dGgGgGgGgGgGgGgGgGgGgGgGgGgGgg..",
  "..GGGGGGGGGGGGGGGGGGGGGGGGG.....",
  ".....mmmmmmmmmmmm...............",
];
const STRIKEFORCE = [
  "gg..............................",
  "gg...eeeee......................",
  "gg..eEEEEe............Www.......",
  "ggg...gg............gwwww.......",
  "gggggggggggggggggggggggggggggg..",
  "dGgGgGgGgGgGgGgGgGgGgGgGgGgGggg.",
  "........GGGGGGGGGGGGGG..........",
  "........mm.mm.mm.mm.............",
];
const GLASS = { W: "#cfe3f2", w: "#2b3a4a", d: "#33383e" };
const FLYBYS = [
  { rows: LAZER, pal: { ...GLASS, g: "#a3acb6", G: "#6c747d", m: "#e6e9ec" }, speed: 75, max: 3 },
  { rows: HYDRA, pal: { ...GLASS, g: "#a8a291", G: "#77725f", m: "#e6e9ec" }, speed: 70, max: 2 },
  { rows: STRIKEFORCE, pal: { ...GLASS, g: "#d4d6d3", G: "#9b9e9a", e: "#b8bbb7", E: "#6d706c", m: "#7a8a6a" }, speed: 60, max: 2 },
  { rows: BUZZARD, pal: BUZZARD_PAL, speed: 30, max: 1, heli: true },
];
const SUSPECT = ["#e2383b", "#2f7de1", "#f2c94c", "#46b36b", "#b061d6"];
const SPEED = { car: 32, bike: 38, mk2: 26, deluxo: 34 } as const;

export function losSantos(): Scene {
  type Kind = keyof typeof SPEED;
  type Chase = { t0: number; dir: 1 | -1; kind: Kind; cops: number; heli: boolean; col: string; victim?: { x: number; hitAt: number | null }; liftAt?: number };
  let chase: Chase | null = null;
  let jets: { t0: number; dir: 1 | -1; y: number; n: number; f: (typeof FLYBYS)[number] } | null = null;
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
        const kind = (Object.keys(SPEED) as Kind[])[Math.floor(Math.random() * 4)];
        const dir = Math.random() < 0.5 ? 1 : -1;
        chase = { t0: t, dir, kind, cops: 1 + Math.floor(Math.random() * 3), heli: kind === "mk2" || Math.random() < 0.6, col: SUSPECT[Math.floor(Math.random() * SUSPECT.length)] };
        if (kind === "mk2") chase.victim = { x: dir > 0 ? w * rand(0.1, 0.2) : w * rand(0.8, 0.9) - CAR[0].length, hitAt: null };
        const cross = (w + 200) / SPEED[kind];
        sound("siren", cross);
        if (chase.heli) sound("heli", cross);
      }
      if (chase) {
        const c = chase, k = t - c.t0, dir = c.dir;
        const speed = SPEED[c.kind];
        const at = (lead: number) => (dir > 0 ? -40 + k * speed - lead : w + 10 - k * speed + lead);
        const sx = at(0);
        // the deluxo drives until mid-screen, then folds its wheels and lifts away from the cruisers
        if (c.kind === "deluxo" && c.liftAt === undefined && (dir > 0 ? sx > w * 0.45 : sx < w * 0.55 - DELUXO[0].length)) c.liftAt = t;
        const up = c.liftAt === undefined ? 0 : Math.min(30, (t - c.liftAt) * 12);
        const flash = Math.floor(t * 7) % 2 ? { r: "#ff2a2a", b: "#2a5bff" } : { r: "#2a5bff", b: "#ff2a2a" };
        // the oppressor's victim: a car minding its business, until a missile finds it
        if (c.victim) {
          const v = c.victim, cx = v.x + 15, my = road - 27;
          if (v.hitAt === null && Math.abs(sx + 11 - cx) < 34) {
            v.hitAt = t;
            sound("boom", 1.6);
          }
          const hit = v.hitAt !== null && t - v.hitAt > 0.35;
          if (v.hitAt !== null && !hit) {
            // the missile: a streak from the bike down to the car
            const p = (t - v.hitAt) / 0.35;
            ctx.fillStyle = "#ffd23f";
            ctx.fillRect(Math.round(sx + 11 + (cx - sx - 11) * p), Math.round(my + 6 + (road - 5 - my - 6) * p), 1, 1);
          }
          if (hit && fx.length < 400 && t - v.hitAt! < 0.45) sparks(fx, cx, road - 5, 35, FIRE, 22);
          put(ctx, CAR, hit ? WRECK_PAL : sedan("#7a8a9a"), v.x, road - CAR.length, 1);
        }
        if (c.kind === "car") put(ctx, CAR, sedan(c.col), sx, road - CAR.length, 1, dir < 0);
        else if (c.kind === "bike") put(ctx, BIKE, { h: "#222", r: c.col, m: "#666", k: "#151515" }, sx, road - BIKE.length * 2, 2, dir < 0);
        else if (c.kind === "mk2") put(ctx, MK2, { h: "#222", v: "#8fb3d9", r: c.col, k: "#2a2d33", K: "#5b6068", E: "#44484f", g: "#6b7079", y: Math.floor(t * 10) % 2 ? "#ffb347" : "#ff5a1a" }, sx, road - 27 + Math.sin(k * 3) * 1.5, 1, dir < 0);
        else put(ctx, c.liftAt === undefined ? DELUXO : DELUXO_FLY, { ...DELUXO_PAL, c: Math.floor(t * 12) % 2 ? "#3ff0ff" : "#1aa8c0" }, sx, road - DELUXO.length - up, 1, dir < 0);
        // the cruisers only join once a car's been hit (the oppressor case)
        const late = c.victim ? (c.victim.hitAt === null ? Infinity : c.victim.hitAt - c.t0 + 1) : 0;
        for (let i = 0; i < c.cops; i++) {
          if (k < late) break;
          const cx = dir > 0 ? -40 + (k - late) * (speed + 2) - 36 - i * 34 : w + 10 - (k - late) * (speed + 2) + 36 + i * 34;
          put(ctx, COP, { ...COP_PAL, r: flash.r, b: flash.b }, cx, road - COP.length, 1, dir < 0);
        }
        if (c.heli) {
          const hx = sx - dir * 14, hy = road - 46 - up + Math.sin(k * 1.7) * 1.5; // climbs with a lifting deluxo, never into it
          // searchlight on the suspect
          ctx.fillStyle = "rgba(255,255,220,0.1)";
          ctx.beginPath();
          ctx.moveTo(hx + 18, hy + 7);
          ctx.lineTo(sx - 4, road - up);
          ctx.lineTo(sx + 34, road - up);
          ctx.fill();
          put(ctx, Math.floor(t * 14) % 2 ? HELI : spin(HELI), HELI_PAL, hx, hy, 1, dir < 0);
        }
        if (k * speed > w + 200 + (Number.isFinite(late) ? late * speed : 0)) {
          chase = null;
          nextChase = t + rand(22, 40);
        }
      }
      if (!jets && t > nextJets) {
        const f = FLYBYS[Math.floor(Math.random() * FLYBYS.length)];
        jets = { t0: t, dir: Math.random() < 0.5 ? 1 : -1, y: h * rand(0.05, 0.14), n: 1 + Math.floor(Math.random() * f.max), f };
        sound(f.heli ? "heli" : "jet", (w + 200) / f.speed);
      }
      if (jets) {
        const k = t - jets.t0, f = jets.f, len = f.rows[0].length;
        for (let i = 0; i < jets.n; i++) {
          const x = jets.dir > 0 ? -40 + k * f.speed - i * 40 : w + 10 - k * f.speed + i * 40;
          const y = jets.y + i * 9;
          if (f.heli) {
            put(ctx, Math.floor(t * 14) % 2 ? f.rows : spin(f.rows), f.pal, x, y, 1, jets.dir < 0);
            continue;
          }
          // contrail
          ctx.fillStyle = "rgba(230,235,240,0.18)";
          ctx.fillRect(jets.dir > 0 ? Math.max(0, x - 60) : x + len, Math.round(y + 5), 60, 1);
          ctx.fillStyle = Math.floor(t * 20) % 2 ? "#ffb347" : "#ff5a1a";
          ctx.fillRect(jets.dir > 0 ? x - 1 : x + len, Math.round(y + 5), 1, 1); // afterburner
          put(ctx, f.rows, f.pal, x, y, 1, jets.dir < 0);
        }
        if (k * f.speed > w + 200) {
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

// ---------------------------------------------------------------- vice city

// all face right (flipped for leftward runs); the boats' bottom row sits on the water line
const SPEEDBOAT = [
  ".......h............",
  "......ksw...........",
  "KKKKKKKKKKKKKK......",
  "HHHHHHHHHHHHHHHHHHH.",
  "HppppppppppppppppH..",
  ".HHHHHHHHHHHHHHHH...",
];
const SPEEDBOAT_PAL = { h: "#d69a72", k: "#2a1a3d", s: "#3fe0d0", w: "#cfe3f2", K: "#3fe0d0", H: "#e9e2f0", p: "#ff5fae" };
const JETSKI = ["....h......", "...ssb.....", "...s..b....", "jjjjjjjjj..", "JJJJJJJJJJj"];
const JETSKI_PAL = { h: "#d69a72", s: "#ff5fae", b: "#b89ac8", j: "#3fe0d0", J: "#e9e2f0" };
// wings up / down: the same cells mirrored, so a bird is always the same size
const FLAMINGO = [
  ["......P......", ".....PP......", "LLLLpppppNNbk", ".............", "............."],
  [".............", ".............", "LLLLpppppNNbk", ".....PP......", "......P......"],
];
const FLAMINGO_PAL = { P: "#ff4f9a", p: "#ff7eb6", L: "#ff9cc8", N: "#ff7eb6", b: "#fdeefe", k: "#b89ac8" };
const PELICAN = [
  ["......GG...........", ".....GWW...........", "....GWWW...........", "GGWWWWWWWWWHHyyyyyy", "...........HYYYY..."],
  ["...................", "...................", "...................", "GGWWWWWWWWWHHyyyyyy", "....GWWW...HYYYY...", ".....GWW...........", "......GG..........."],
];
const PELICAN_PAL = { G: "#7d6f8c", W: "#d9d2e3", H: "#fdeefe", y: "#ffd36e", Y: "#ff8a5c" };
// the low-rider's body bounces on its hydraulics; the wheels stay on the road
const LOWRIDER = [
  "...........KKKKKKKKKK...........",
  "..........KwwwwwKwwwwwK.........",
  "..KKKKKKKKKwwwwwKwwwwwwKKKKKKKK.",
  ".KbbbbbbbbbbbbbbbbbbbbbbbbbbbbbY",
  "RbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbY",
  "bbbb....bbbbbbbbbbbbbbbb....bbbb",
];
const LOW_WHEELS = ["....tHHt................tHHt....", ".....tt..................tt....."];
const LOWRIDER_PAL = { K: "#9a6fd0", w: "#2a1a3d", b: "#5b2a86", Y: "#fff3b0", R: "#ff4f9a", t: "#0a0a0a", H: "#b89ac8" };
// the airboat: a caged fan (two blade frames) spliced onto the back of the hull
const FANS = [
  ["..ccc..", ".c.F.c.", "c..F..c", "c..H..c", "c..F..c", ".c.F.c.", "..ccc.."],
  ["..ccc..", ".c...c.", "c.....c", "cFFHFFc", "c.....c", ".c...c.", "..ccc.."],
];
const AIRBOAT_TOP = [".................", ".................", "..h..............", ".sss.............", ".s.s.............", "kkkkk............", "k...k............"];
const AIRBOAT_HULL = ["mmmmmmmmmmmmmmmmmmmmmm..", "MMMMMMMMMMMMMMMMMMMMMMMM", ".MMMMMMMMMMMMMMMMMMMMMM."];
const airboat = (f: number) => [...FANS[f].map((r, i) => r + AIRBOAT_TOP[i]), ...AIRBOAT_HULL];
const AIRBOAT_PAL = { c: "#b89ac8", F: "#fdeefe", H: "#ff5fae", h: "#d69a72", s: "#3fe0d0", k: "#7d6f8c", m: "#9a8aa8", M: "#4a2f63" };
// a news chopper: round teal cabin, pink tail and stripe, a camera under the nose
const CHOPPER = [
  "..llllllllllllllllllllllll..",
  "..............kk............",
  "T.........bbbbbbbbbb........",
  "TT.......bbbbbbbbbbggg......",
  "TTbbbbbbbbpppppppppbggggg...",
  "..T......bbbbbbbbbbbbbbgg...",
  ".........bbbbbbbbbbbbbbb....",
  "...........k.......k..oo....",
  ".........sssssssssssssss....",
];
const CHOPPER_PAL = { l: "#b89ac8", k: "#7d6f8c", T: "#ff5fae", b: "#2fb8aa", p: "#ff5fae", g: "#cfe3f2", o: "#fdeefe", s: "#b89ac8" };
const VICE_SPEED = { speedboat: 34, jetski: 40, flamingos: 18, pelican: 13, lowrider: 14, airboat: 22, chopper: 28 } as const;
type ViceKind = keyof typeof VICE_SPEED;
const VICE_LEAD: Record<ViceKind, string[]> = { speedboat: SPEEDBOAT, jetski: JETSKI, flamingos: FLAMINGO[0], pelican: PELICAN[0], lowrider: LOWRIDER, airboat: airboat(0), chopper: CHOPPER };
// one of four, then one of its pair
const VICE_PAIRS: [ViceKind, ViceKind][] = [["speedboat", "jetski"], ["flamingos", "pelican"], ["lowrider", "lowrider"], ["airboat", "chopper"]];
export const FOAM = ["#fdeefe", "#7fe8dc"];
// birds in a loose V: each rank 15 cells further back (a bird is 13 wide), 6 rows out to either side
const FLOCK_GAP = 15;

export function viceCity(): Scene {
  type Ev = { t0: number; dir: 1 | -1; kind: ViceKind; y: number; n: number; len: number; trail: number };
  let ev: Ev | null = null;
  let next = 0;
  // a wake: foam strung out behind the stern, never inside the hull's own columns
  const wake = (ctx: CanvasRenderingContext2D, x: number, len: number, dir: 1 | -1, y: number, n: number, t: number) => {
    for (let i = 1; i <= n; i++) {
      if ((i + Math.floor(t * 8)) % 3 === 0) continue;
      ctx.globalAlpha = 1 - i / (n + 1);
      ctx.fillStyle = FOAM[i > n / 2 ? 1 : 0];
      ctx.fillRect(dir > 0 ? x - i : x + len - 1 + i, y - (i % 4 === 1 ? 1 : 0) + Math.floor(i / 12), 1, 1);
    }
    ctx.globalAlpha = 1;
  };
  return {
    reset(t) {
      ev = null;
      next = t + 5;
    },
    frame(ctx, w, h, t) {
      const water = groundOf(h); // the waterline runs across the sun; the low-rider's road is the same line
      if (!ev && t > next) {
        const pair = VICE_PAIRS[Math.floor(Math.random() * VICE_PAIRS.length)];
        const kind = pair[Math.random() < 0.5 ? 0 : 1];
        const dir = Math.random() < 0.5 ? 1 : -1;
        const n = kind === "flamingos" ? 4 + Math.floor(Math.random() * 3) : 1;
        // birds high enough that the V's outer ranks stay on screen
        const y = kind === "flamingos" || kind === "pelican" ? Math.max(24, h * rand(0.14, 0.3)) : kind === "chopper" ? h * rand(0.06, 0.16) : water;
        const len = VICE_LEAD[kind][0].length;
        const trail = kind === "flamingos" ? Math.ceil((n - 1) / 2) * FLOCK_GAP : ["speedboat", "jetski", "airboat"].includes(kind) ? 30 : 0;
        ev = { t0: t, dir, kind, y, n, len, trail };
        if (kind === "chopper") sound("heli", (w + len + 20) / VICE_SPEED.chopper);
      }
      if (!ev) return;
      const e = ev, k = t - e.t0, dir = e.dir, speed = VICE_SPEED[e.kind];
      // the lead's left edge: starts just off one side; whatever follows trails behind it
      const x = Math.round(dir > 0 ? -e.len + k * speed : w - k * speed);
      const flip = dir < 0;
      switch (e.kind) {
        case "speedboat":
          wake(ctx, x, e.len, dir, water - 1, e.trail, t);
          put(ctx, SPEEDBOAT, SPEEDBOAT_PAL, x, water - SPEEDBOAT.length, 1, flip);
          break;
        case "jetski":
          wake(ctx, x, e.len, dir, water - 1, e.trail, t);
          put(ctx, JETSKI, JETSKI_PAL, x, water - JETSKI.length + Math.round(Math.sin(k * 9) * 0.6), 1, flip);
          break;
        case "airboat": {
          const rows = airboat(Math.floor(t * 16) % 2);
          wake(ctx, x, e.len, dir, water - 1, e.trail, t);
          put(ctx, rows, AIRBOAT_PAL, x, water - rows.length, 1, flip);
          break;
        }
        case "flamingos":
          for (let i = 0; i < e.n; i++) {
            const rank = Math.ceil(i / 2), side = i === 0 ? 0 : i % 2 ? -1 : 1;
            const by = Math.round(e.y + side * rank * 6 + Math.sin(t * 1.3 + i));
            put(ctx, FLAMINGO[Math.floor(t * 5 + i * 0.7) % 2], FLAMINGO_PAL, x - dir * rank * FLOCK_GAP, by - 2, 1, flip);
          }
          break;
        case "pelican":
          // mostly gliding, a slow flap now and then
          put(ctx, PELICAN[Math.floor(k * 2.5) % 6 === 1 ? 1 : 0], PELICAN_PAL, x, Math.round(e.y + Math.sin(k * 0.8) * 2) - 3, 1, flip);
          break;
        case "lowrider": {
          const bounce = Math.max(0, Math.round(Math.sin(k * 2.2) * 2));
          // the underglow: a strip under the body between the wheels, and its pool on the road
          ctx.fillStyle = Math.floor(k / 1.5) % 2 ? "#3fe0d0" : "#ff5fae";
          ctx.fillRect(x + 9, water - 2, 14, 1);
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x + 2, water, 28, 1);
          ctx.globalAlpha = 1;
          put(ctx, LOW_WHEELS, LOWRIDER_PAL, x, water - LOW_WHEELS.length, 1, flip);
          put(ctx, LOWRIDER, LOWRIDER_PAL, x, water - LOW_WHEELS.length - LOWRIDER.length - bounce, 1, flip);
          break;
        }
        case "chopper":
          put(ctx, Math.floor(t * 14) % 2 ? CHOPPER : spin(CHOPPER), CHOPPER_PAL, x, Math.round(e.y + Math.sin(k * 1.5) * 1.5), 1, flip);
          break;
      }
      if (k * speed > w + e.len + e.trail + 10) {
        ev = null;
        next = t + rand(18, 35);
      }
    },
  };
}

// the motel sign by the left palms (ThemeScenery's 3px cells): a neon box with MOTEL in it, on a pole
export const MOTEL_SIGN = { w: 23, h: 21 };
export function motelSign(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  ctx.fillStyle = on ? "#3fe0d0" : "#1f4a48";
  ctx.fillRect(x, y, MOTEL_SIGN.w, 1);
  ctx.fillRect(x, y + 8, MOTEL_SIGN.w, 1);
  ctx.fillRect(x, y, 1, 9);
  ctx.fillRect(x + MOTEL_SIGN.w - 1, y, 1, 9);
  ctx.fillStyle = "#3a2352";
  ctx.fillRect(x + 11, y + 9, 1, MOTEL_SIGN.h - 9);
  text(ctx, "MOTEL", x + 2, y + 2, on ? "#ff5fae" : "#4a2238");
}
