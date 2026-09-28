// Spider-man theme: five suits and the villain each one fights, as original 8-bit drawings after the films
// (Tobey's classic and symbiote suits, Andrew's, Tom's Iron Spider, Miles), web-swinging physics, and the
// background chase that uses them. The intro (GameIntro) swings one of them across the screen.
// All drawing is in the caller's canvas cells; s is sprite pixels per cell.

export type Suit = "tobey" | "symbiote" | "andrew" | "tom" | "miles";
export type Foe = "ock" | "goblin" | "electro" | "mysterio" | "spot";
export const FIGHTS: [Suit, Foe][] = [["tobey", "ock"], ["symbiote", "goblin"], ["andrew", "electro"], ["tom", "mysterio"], ["miles", "spot"]];

type Pal = Record<string, string>;
type Ctx = CanvasRenderingContext2D;

// r suit, b lower suit, w eyes, s spider logo, g shoulder trim; all face right
const SWING = [
  "........rr..",
  "........r...",
  "...rrr..r...",
  "..rrrrr.r...",
  "..rwrwr.r...",
  "..rrrrr.r...",
  "...rrr..r...",
  "..grsrrgr...",
  ".rrrsrrr....",
  "r.rrrrr.....",
  "r.bbbbb.....",
  "..bb.bb.....",
  ".bb...bb....",
  ".b.....bb...",
  ".r......r...",
  "rr.......rr.",
];
const LEAP = [
  "..........rrr...",
  ".........rwrwr.r",
  ".........rrrrrr.",
  "....bb..grsrg...",
  "..bbbbbrrrrr....",
  ".bb..bbbrrr.....",
  "rb....bb........",
  "r......rr.......",
];
export const HAND = { swing: [8, 0], leap: [15, 1] } as const; // where the web leaves, in sprite pixels
export type Pose = keyof typeof HAND;
const POSES: Record<Pose, string[]> = { swing: SWING, leap: LEAP };

// o: an outline, so the dark suits still read against the night sky
const SUITS: Record<Suit, Pal> = {
  tobey: { r: "#c81e2a", b: "#1f3c9e", w: "#e8eef5", s: "#141414", g: "#c81e2a" },
  symbiote: { r: "#1b1c24", b: "#111218", w: "#eef1f6", s: "#eef1f6", g: "#2c2e3a", o: "#4b5170" },
  andrew: { r: "#d3202e", b: "#1a47b8", w: "#f2eecb", s: "#141414", g: "#d3202e" },
  tom: { r: "#b3121f", b: "#6e0a14", w: "#eaf4ff", s: "#e0b54a", g: "#e0b54a" },
  miles: { r: "#16161c", b: "#0e0e12", w: "#f2f2f2", s: "#d11f2d", g: "#d11f2d", o: "#6a2231" },
};

const FOES: Record<Foe, { rows: string[]; pal: Pal }> = {
  ock: {
    rows: ["....hhhh....", "....ssss....", "....gsgs....", "....ssss....", "...cccccc...", "..cccMMccc..", "..cccccccc..", "..cccccccc..", "...cccccc...", "...cccccc...", "...cc..cc...", "....d..d....", "...kk..kk..."],
    pal: { h: "#2a1d16", s: "#c9a27e", g: "#111", c: "#6b4a2c", M: "#8a8f99", d: "#2b2b30", k: "#141414" },
  },
  goblin: {
    rows: [".....ggg......", "....gyggy.....", ".....ggg......", "....pgggpp....", "...gggggggg...", ".....ggg......", ".....g.g......", "..dddddddddd..", "ddd.rDDDr.ddd.", "d..........d.."],
    pal: { g: "#3f8f2f", y: "#f4d03f", p: "#6a2c8f", d: "#7a7f8a", D: "#3a3d44", r: "#e2383b" },
  },
  electro: {
    rows: ["....kkk.....", "...kbbbk....", "...kbwbk....", "....bbb.....", "...kkkkk....", "..kkkkkkk...", ".b.kkkkk.b..", "...kkkkk....", "...kk.kk....", "...k...k....", "..kk...kk..."],
    pal: { k: "#1a1d26", b: "#6fd3ff", w: "#ffffff", o: "#1f5f8a" },
  },
  mysterio: {
    rows: ["....www.....", "...wbbbw....", "..wbbbbbw...", "..wbbbbbw...", "...wbbbw....", "..cgGGGgc...", ".ccgGGGgcc..", ".ccggGggcc..", ".cc.ggg.cc..", "cc..g.g..cc.", "c...g.g...c.", "...gg.gg...."],
    pal: { w: "#cfeff5", b: "#5aa7b8", c: "#9c1b2a", g: "#2f6b3a", G: "#c9a23a" },
  },
  spot: {
    rows: ["....www.....", "...wkwww....", "....www.....", "...wwwww....", "..wwkwwkw...", "..w.wwww.w..", "..k.wkww.w..", "....wwww....", "....w..k....", "...ww..ww..."],
    pal: { w: "#eef0f2", k: "#0a0a0c" },
  },
};
export const FOE_SIZE = (f: Foe) => [FOES[f].rows[0].length, FOES[f].rows.length] as const;
export const SPIDEY_H = SWING.length;

// one sprite, optionally flipped; color() can recolour per pixel (the symbiote spreading)
function draw(c: Ctx, rows: string[], pal: Pal, x: number, y: number, s: number, flip: boolean, color?: (ch: string, dx: number, dy: number) => string | undefined) {
  const W = rows[0].length;
  const cell = (dx: number, dy: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x + (flip ? W - 1 - dx : dx) * s), Math.round(y + dy * s), s, s);
  };
  if (pal.o)
    rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch !== ".") return;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => (rows[dy + b]?.[dx + a] ?? ".") !== ".");
        if (near) cell(dx, dy, pal.o);
      }),
    );
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch === ".") return;
      const col = color?.(ch, dx, dy) ?? pal[ch];
      if (col) cell(dx, dy, col);
    }),
  );
}

// goo: 0 = classic suit, 1 = symbiote. It spreads out from the spider on the chest, with a wet black edge.
export function drawSpidey(c: Ctx, suit: Suit, pose: Pose, x: number, y: number, s: number, flip: boolean, goo = 0) {
  const rows = POSES[pose];
  const pal = SUITS[goo >= 1 ? "symbiote" : suit];
  if (goo <= 0 || goo >= 1) return draw(c, rows, pal, x, y, s, flip);
  const cy = rows.findIndex((r) => r.includes("s")), cx = rows[cy].indexOf("s");
  const reach = goo * 14;
  draw(c, rows, pal, x, y, s, flip, (ch, dx, dy) => {
    const d = Math.hypot(dx - cx, dy - cy);
    if (d > reach) return undefined;
    return reach - d < 1.2 ? "#050507" : SUITS.symbiote[ch];
  });
}

// ---- villains, with what each one does

export function drawFoe(c: Ctx, foe: Foe, x: number, y: number, s: number, flip: boolean, t: number) {
  const { rows, pal } = FOES[foe];
  if (foe === "ock") ockArms(c, x, y, s, flip, t);
  if (foe === "mysterio") {
    // green smoke rolling off him
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.7 + i / 6) % 1;
      c.globalAlpha = 0.5 * (1 - k);
      c.fillStyle = i % 2 ? "#3f8f5a" : "#7fd39a";
      c.fillRect(Math.round(x + (3 + ((i * 5) % 7) + Math.sin(t * 2 + i) * 2) * s), Math.round(y + (12 + k * 5) * s), s, s);
    }
    c.globalAlpha = 1;
  }
  draw(c, rows, pal, x, y, s, flip);
  if (foe === "electro" && Math.floor(t * 9) % 3 === 0) {
    // sparks crawling over his hands
    c.fillStyle = "#e8fbff";
    c.fillRect(Math.round(x + (flip ? 2 : 9) * s + Math.sin(t * 40) * s), Math.round(y + 5 * s), s, s);
  }
}

// four tentacles out of the harness, curling on their own time, claws open at the tips
function ockArms(c: Ctx, x: number, y: number, s: number, flip: boolean, t: number) {
  const ox = x + (flip ? 5 : 6) * s, oy = y + 5.5 * s;
  for (let a = 0; a < 4; a++) {
    const side = a < 2 ? -1 : 1, up = a % 2 ? 1 : -1;
    let px = ox, py = oy;
    for (let i = 1; i <= 9; i++) {
      const ang = Math.atan2(up * 0.9, side) + Math.sin(t * 2.4 + a * 1.7 + i * 0.5) * 0.35 * (i / 9) + up * i * 0.06;
      px += Math.cos(ang) * s * 1.1;
      py += Math.sin(ang) * s * 1.1;
      c.fillStyle = i === 9 ? "#c4c8cf" : i % 2 ? "#8a8f99" : "#5f646d";
      c.fillRect(Math.round(px), Math.round(py), s, s);
    }
    c.fillStyle = "#ff8a3d"; // the claw's light
    c.fillRect(Math.round(px), Math.round(py), Math.max(1, s >> 1), Math.max(1, s >> 1));
  }
}

// a jagged bolt, new zigzag each call
export function bolt(c: Ctx, x0: number, y0: number, x1: number, y1: number, s: number) {
  const n = 8;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    const nx = x0 + (x1 - x0) * k + (i < n ? (Math.random() - 0.5) * 6 * s : 0);
    const ny = y0 + (y1 - y0) * k + (i < n ? (Math.random() - 0.5) * 6 * s : 0);
    line(c, px, py, nx, ny, i % 3 ? "#9fe6ff" : "#ffffff", s);
    px = nx;
    py = ny;
  }
}

// spot's portal: a black hole with a ragged white rim
export function portal(c: Ctx, x: number, y: number, s: number, r: number) {
  if (r <= 0) return;
  for (let dy = -r * 1.4; dy <= r * 1.4; dy += s)
    for (let dx = -r; dx <= r; dx += s) {
      const d = Math.hypot(dx / r, dy / (r * 1.4));
      if (d > 1) continue;
      c.fillStyle = d > 0.82 ? "#eef0f2" : "#030305";
      c.fillRect(Math.round(x + dx), Math.round(y + dy), s, s);
    }
}

export function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string, s = 1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, s * 0.8)));
  c.fillStyle = col;
  for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), Math.max(1, s >> 1), Math.max(1, s >> 1));
}

// a web line that has gone slack: it sags under its own weight as it falls away
function slack(c: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, col: string) {
  const n = 16;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    const nx = x0 + (x1 - x0) * k, ny = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag;
    line(c, px, py, nx, ny, col);
    px = nx;
    py = ny;
  }
}

// ---- web-swinging physics: a point on a rope. Attached, gravity pulls it round the anchor (the rope only
// pulls, never pushes); past the bottom of the arc it lets go, flies on its own momentum, and fires the
// next web ahead as it starts to fall. Units are canvas cells and seconds.

export type Swinger = {
  x: number; y: number; vx: number; vy: number;
  anchor: { x: number; y: number; len: number } | null;
  loose: { x: number; y: number; t: number } | null; // the last web, falling away
  air: number; // seconds since letting go
};

export const swinger = (x: number, y: number, vx: number): Swinger => ({ x, y, vx, vy: 0, anchor: null, loose: null, air: 0 });

// dir: which way he's heading; lead: how far ahead to aim the next web; pace: how fast he flicks off the end
// of a swing (the chase sets it, so he keeps up without overtaking); top: where webs stick (rooftops above the
// frame); floor: never swing lower than this
export function stepSwing(p: Swinger, dt: number, g: number, dir: 1 | -1, lead: number, pace: number, top: number, floor: number) {
  for (let n = 0; n < 4; n++) {
    const h = dt / 4;
    p.vy += g * h;
    p.x += p.vx * h;
    p.y += p.vy * h;
    const a = p.anchor;
    if (a) {
      const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
      if (p.y > floor) a.len = Math.max(8, a.len - 60 * h); // reel in rather than scrape the street
      if (d > a.len) {
        const ux = dx / d, uy = dy / d;
        p.x = a.x + ux * a.len;
        p.y = a.y + uy * a.len;
        const out = p.vx * ux + p.vy * uy;
        if (out > 0) {
          p.vx -= out * ux;
          p.vy -= out * uy;
        }
      }
      p.air += h; // time on this web
      // let go once he's swung past the anchor and is rising (or has hung there too long), with a flick
      const past = (p.x - a.x) * dir;
      if ((past > a.len * 0.45 && p.vy < 0) || (past > 0 && p.air > 1.4)) {
        p.loose = { x: a.x, y: a.y, t: 0 };
        p.anchor = null;
        p.air = 0;
        p.vx = dir * Math.max(Math.abs(p.vx) * 0.5, pace);
        if (p.y > floor * 0.6) p.vy -= g * 0.12; // up only when he's low, or he'd climb off the top
      }
    } else {
      p.air += h;
      if (p.vy > 0 && (p.air > 0.25 || p.y > floor * 0.8)) {
        const ax = p.x + dir * lead, ay = top;
        p.anchor = { x: ax, y: ay, len: Math.hypot(ax - p.x, ay - p.y) };
        p.air = 0;
      }
    }
  }
  if (p.y < top + 4) p.vy = Math.max(p.vy, 0);
  if (p.loose && (p.loose.t += dt) > 0.6) p.loose = null;
}

// the web (taut, or the loose one sagging away) and the swinger in the right pose
export function drawSwinger(c: Ctx, p: Swinger, suit: Suit, s: number, dir: 1 | -1, goo = 0) {
  const pose: Pose = p.anchor ? "swing" : "leap";
  const rows = POSES[pose], W = rows[0].length;
  const [hx, hy] = HAND[pose];
  const x = p.x - (W / 2) * s, y = p.y - 2 * s;
  const handX = x + (dir < 0 ? W - 1 - hx : hx) * s + s / 2, handY = y + hy * s;
  if (p.anchor) line(c, p.anchor.x, p.anchor.y, handX, handY, "#dfe6f5", s);
  if (p.loose) {
    c.globalAlpha = 1 - p.loose.t / 0.6;
    slack(c, p.loose.x, p.loose.y, handX - dir * 6 * s, handY + p.loose.t * 30 * s, (4 + p.loose.t * 20) * s, "#dfe6f5");
    c.globalAlpha = 1;
  }
  drawSpidey(c, suit, pose, x, y, s, dir < 0, goo);
}

// ---- the background event: one of the five fights crosses the sky

type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };
const FIRE = ["#ff7a1a", "#ffd23f", "#ff3b1a", "#555"];
const WEB = ["#eef2fa", "#dfe6f5", "#aab4c8"];

function sparkle(list: Spark[], x: number, y: number, cols: string[], s: number, n = 24) {
  for (let i = 0; i < n; i++) list.push({ x, y, vx: (Math.random() - 0.5) * 50 * s, vy: -Math.random() * 40 * s, life: 0.5 + Math.random(), c: cols[i % cols.length] });
}
function drawSparks(c: Ctx, list: Spark[], dt: number, s: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if ((p.life -= dt) <= 0) {
      list.splice(i, 1);
      continue;
    }
    p.vy += 40 * s * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    c.globalAlpha = Math.min(1, p.life);
    c.fillStyle = p.c;
    c.fillRect(Math.round(p.x), Math.round(p.y), s, s);
  }
  c.globalAlpha = 1;
}

// s scales everything (sprite pixels per cell, and so distances, speeds and gravity with them: the same
// swing at any size). pick forces the fight and starts it at once (the intro); otherwise one comes along
// now and then.
export function webChase(opts: { s?: number; pick?: [Suit, Foe]; dir?: 1 | -1 } = {}) {
  const s = opts.s ?? 1;
  type Run = { t0: number; dir: 1 | -1; suit: Suit; foe: Foe; p: Swinger; fx: number; bomb: { x: number; y: number; vx: number; vy: number } | null; next: number; hop: { from: number; at: number } | null };
  let run: Run | null = null;
  let nextRun = 0;
  const sparks: Spark[] = [];
  return {
    reset(t: number) {
      run = null;
      nextRun = opts.pick ? t : t + 4;
      sparks.length = 0;
    },
    frame(c: Ctx, w: number, h: number, t: number, dt: number) {
      dt = Math.min(dt, 1 / 20);
      if (!run && t >= nextRun) {
        const [suit, foe] = opts.pick ?? FIGHTS[Math.floor(Math.random() * FIGHTS.length)];
        const dir = opts.dir ?? (Math.random() < 0.5 ? 1 : -1);
        const fx = opts.pick ? (dir > 0 ? w * 0.12 : w * 0.88) : dir > 0 ? -20 * s : w + 20 * s; // the intro starts on screen
        run = { t0: t, dir, suit, foe, p: swinger(fx - dir * 40 * s, h * 0.2, dir * 55 * s), fx, bomb: null, next: t + 1.5, hop: null };
      }
      if (run) {
        const r = run, k = t - r.t0, dir = r.dir;
        const speed = (r.foe === "goblin" ? 48 : 40) * s * (opts.pick ? 0.8 : 1); // the intro's run lasts it out
        const [fw, fh] = FOE_SIZE(r.foe).map((v) => v * s);
        // the villain's own way of moving
        r.fx += dir * speed * dt;
        const base = r.foe === "ock" || r.foe === "spot" ? h * 0.34 : h * 0.24;
        let fy = base + Math.sin(k * 1.6) * 3 * s;
        if (r.foe === "ock") fy = base - Math.abs(Math.sin(k * 3)) * 3 * s; // walking on the tentacles
        let hidden = false;
        if (r.foe === "spot" && t > r.next && !r.hop) {
          r.hop = { from: r.fx, at: t };
          r.next = t + 2.4;
        }
        if (r.hop) {
          // steps into one portal and out of another further on
          const e = t - r.hop.at, far = r.hop.from + dir * 45 * s;
          portal(c, r.hop.from + fw / 2, fy + fh / 2, s, Math.min(6, e * 20) * s * (e < 0.7 ? 1 : Math.max(0, 1.2 - e)));
          portal(c, far + fw / 2, fy + fh / 2, s, e > 0.35 ? Math.min(6, (e - 0.35) * 20) * s * Math.max(0, 1.3 - e) : 0);
          if (e > 0.25 && e < 0.55) hidden = true;
          if (e >= 0.55 && e < 0.6) r.fx = far;
          if (e > 1.3) r.hop = null;
        }
        // spider-man, swinging after it
        const gap = (r.fx + fw / 2 - r.p.x) * dir, behind = gap - 20 * s; // centre to centre: about 20 cells back
        stepSwing(r.p, dt, 220 * s, dir, Math.min(60 * s, Math.max(8 * s, behind * 0.5 + 12 * s)), Math.min(120 * s, Math.max(15 * s, speed + behind * 0.8)), -12 * s, h * 0.55);
        const goo = r.suit === "tobey" ? Math.min(1, Math.max(0, (k - (opts.pick ? 2.2 : 5)) / 1.6)) : 0; // mid-chase, the symbiote takes him
        drawSwinger(c, r.p, r.suit, s, dir, goo);
        if (!hidden) {
          if (r.foe === "mysterio" && Math.floor(k / 3) % 2 === 1) {
            // illusions: two copies drifting off either side
            c.globalAlpha = 0.35;
            drawFoe(c, r.foe, r.fx - 14 * s, fy - 4 * s, s, dir < 0, t + 1);
            drawFoe(c, r.foe, r.fx + 14 * s, fy + 4 * s, s, dir < 0, t + 2);
            c.globalAlpha = 1;
          }
          drawFoe(c, r.foe, r.fx, fy, s, dir < 0, t);
        }
        if (r.foe === "electro" && Math.floor(t * 2.5) % 2 === 0 && Math.random() < 0.6)
          bolt(c, r.fx + (dir < 0 ? 2 : 9) * s, fy + 6 * s, r.p.x, r.p.y + 4 * s, s);
        if (r.foe === "goblin") {
          if (!r.bomb && t > r.next) {
            r.bomb = { x: r.fx + fw / 2, y: fy + fh, vx: dir * speed, vy: -10 * s };
            r.next = t + 2.2;
          }
          const b = r.bomb;
          if (b) {
            b.vy += 60 * s * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            c.fillStyle = Math.floor(t * 10) % 2 ? "#ff8a1f" : "#ffd23f";
            c.fillRect(Math.round(b.x), Math.round(b.y), 2 * s, 2 * s);
            if (b.y > h * 0.6) {
              sparkle(sparks, b.x, b.y, FIRE, s);
              r.bomb = null;
            }
          }
        }
        // a web shot now and then while he's in the air
        if (!r.p.anchor && r.p.air < 0.12 && gap > 0) line(c, r.p.x, r.p.y, r.fx + fw / 2, fy + fh / 2, "rgba(223,230,245,0.8)", s);
        const gone = (x: number) => (dir > 0 ? x > w + 40 * s : x < -40 * s);
        if (gone(r.fx) && gone(r.p.x)) {
          run = null;
          nextRun = opts.pick ? Infinity : t + 14 + Math.random() * 16;
        } else if (k > 40) run = null;
      }
      drawSparks(c, sparks, dt, s);
    },
  };
}

// ---- the intro fight: he swings on one web from a rooftop (a real pendulum he pumps to keep going), trading
// shots with the villain across the title. Web balls and pumpkin bombs fly on gravity; a hit knocks the
// villain back on a spring, and he shakes it off.

export function webFight(suit: Suit, foe: Foe, s: number) {
  type Shot = { x: number; y: number; vx: number; vy: number; web: boolean };
  let th = -1.1, om = 0, last = -1, nextWeb = 0.6, nextBomb = 1.4;
  let kx = 0, kv = 0; // knockback offset and its speed
  const shots: Shot[] = [];
  const sparks: Spark[] = [];
  // launch so it lands on (tx, ty) after T seconds under gravity g
  const lob = (x: number, y: number, tx: number, ty: number, T: number, g: number, web: boolean) =>
    shots.push({ x, y, vx: (tx - x) / T, vy: (ty - y) / T - (g * T) / 2, web });
  return (c: Ctx, w: number, h: number, t: number) => {
    const dt = last < 0 ? 0 : Math.min(1 / 20, t - last);
    last = t;
    const g = 220 * s, ax = w * 0.14, ay = -6 * s, L = h * 0.42;
    // pendulum: th'' = -(g / L) sin th, and he pumps (or eases off) toward the energy of a 1 rad arc
    const E0 = -(g / L) * Math.cos(1);
    for (let n = 0; n < 4; n++) {
      const q = dt / 4;
      const E = 0.5 * om * om - (g / L) * Math.cos(th);
      om += (-(g / L) * Math.sin(th) + Math.sign(om) * Math.max(-3, Math.min(3, (E0 - E) * 0.5))) * q;
      th += om * q;
    }
    const px = ax + Math.sin(th) * L, py = ay + Math.cos(th) * L;
    const [hx, hy] = HAND.swing;
    const x = px - (hx + 0.5) * s, y = py - hy * s;
    line(c, ax, ay, px, py, "#dfe6f5", s);
    const goo = suit === "tobey" ? Math.min(1, Math.max(0, (t - 2.2) / 1.2)) : 0;
    drawSpidey(c, suit, "swing", x, y, s, false, goo);
    // the villain: knocked back on a damped spring when a web ball lands
    kv += (-40 * kx - 7 * kv) * dt;
    kx += kv * dt;
    const [fw, fh] = FOE_SIZE(foe).map((v) => v * s);
    const vx = w * 0.8 + kx, vy = h * 0.36 - fh + Math.sin(t * 2) * 2 * s;
    const cx = vx + fw / 2, cy = vy + fh / 2;
    if (foe === "spot") portal(c, vx + fw + 6 * s, vy + fh, s, (4 + Math.sin(t * 3) * 1.5) * s);
    drawFoe(c, foe, vx, vy, s, true, t);
    if (foe === "electro" && Math.floor(t * 6) % 3 === 0) bolt(c, cx, cy, x + 6 * s, y + 8 * s, s);
    // shots: his web balls at it, its bombs back at him
    if (t > nextWeb) {
      lob(x + 11 * s, y + 7 * s, cx, cy, 0.55, g * 0.5, true);
      nextWeb = t + 0.9 + Math.random() * 0.5;
    }
    if (foe === "goblin" && t > nextBomb) {
      lob(cx, cy, x + 6 * s, y + 8 * s, 0.9, g * 0.5, false);
      nextBomb = t + 1.6;
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const b = shots[i];
      b.vy += g * 0.5 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const [tx, ty] = b.web ? [cx, cy] : [x + 6 * s, y + 8 * s];
      if (Math.hypot(b.x - tx, b.y - ty) < 5 * s || b.y > h) {
        shots.splice(i, 1);
        if (b.y > h) continue;
        sparkle(sparks, b.x, b.y, b.web ? WEB : FIRE, s, 14);
        if (b.web) kv += 90 * s; // the hit shoves it back
        continue;
      }
      c.fillStyle = b.web ? "#eef2fa" : Math.floor(t * 10) % 2 ? "#ff8a1f" : "#ffd23f";
      c.fillRect(Math.round(b.x), Math.round(b.y), 2 * s, 2 * s);
    }
    drawSparks(c, sparks, dt, s);
  };
}

// ---- the intro: a random suit, either chasing its villain across Manhattan or fighting it across the title

let intro: ((c: Ctx, w: number, h: number, t: number) => void) | null = null;

export function introSwing(c: Ctx, w: number, h: number, t: number) {
  if (!intro) {
    const [suit, foe] = FIGHTS[Math.floor(Math.random() * FIGHTS.length)];
    if (Math.random() < 0.5) intro = webFight(suit, foe, 2);
    else {
      const chase = webChase({ s: 2, pick: [suit, foe], dir: 1 });
      chase.reset(t);
      let last = t;
      intro = (c, w, h, t) => {
        chase.frame(c, w, h, t, t - last);
        last = t;
      };
    }
  }
  intro(c, w, h, t);
}
