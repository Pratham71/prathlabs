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
  if (p.anchor) line(c, p.anchor.x, p.anchor.y, handX, handY, "#dfe6f5");
  if (p.loose) {
    c.globalAlpha = 1 - p.loose.t / 0.6;
    slack(c, p.loose.x, p.loose.y, handX - dir * 6 * s, handY + p.loose.t * 30, 4 + p.loose.t * 20, "#dfe6f5");
    c.globalAlpha = 1;
  }
  drawSpidey(c, suit, pose, x, y, s, dir < 0, goo);
}

// ---- the background event: one of the five fights crosses the sky

type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };

export function webChase() {
  type Run = { t0: number; dir: 1 | -1; suit: Suit; foe: Foe; p: Swinger; fx: number; fy: number; bomb: { x: number; y: number; vx: number; vy: number } | null; next: number; hop: { from: number; at: number } | null };
  let run: Run | null = null;
  let nextRun = 0;
  const sparks: Spark[] = [];
  const burst = (x: number, y: number, cols: string[]) => {
    for (let i = 0; i < 24; i++) sparks.push({ x, y, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40, life: 0.5 + Math.random(), c: cols[i % cols.length] });
  };
  return {
    reset(t: number) {
      run = null;
      nextRun = t + 4;
      sparks.length = 0;
    },
    frame(c: Ctx, w: number, h: number, t: number, dt: number) {
      dt = Math.min(dt, 1 / 20);
      if (!run && t > nextRun) {
        const [suit, foe] = FIGHTS[Math.floor(Math.random() * FIGHTS.length)];
        const dir = Math.random() < 0.5 ? 1 : -1;
        const fx = dir > 0 ? -20 : w + 20;
        run = { t0: t, dir, suit, foe, p: swinger(fx - dir * 40, h * 0.2, dir * 55), fx, fy: h * 0.3, bomb: null, next: t + 1.5, hop: null };
      }
      if (run) {
        const r = run, k = t - r.t0, dir = r.dir;
        const speed = r.foe === "goblin" ? 48 : 40;
        const [fw, fh] = FOE_SIZE(r.foe);
        // the villain's own way of moving
        r.fx += dir * speed * dt;
        const base = r.foe === "ock" || r.foe === "spot" ? h * 0.34 : h * 0.24;
        let fy = base + Math.sin(k * 1.6) * 3;
        if (r.foe === "ock") fy = base - Math.abs(Math.sin(k * 3)) * 3; // walking on the tentacles
        let hidden = false;
        if (r.foe === "spot" && t > r.next && !r.hop) {
          r.hop = { from: r.fx, at: t };
          r.next = t + 2.4;
        }
        if (r.hop) {
          // steps into one portal and out of another further on
          const e = t - r.hop.at, far = r.hop.from + dir * 45;
          portal(c, r.hop.from + fw / 2, fy + fh / 2, 1, Math.min(6, e * 20) * (e < 0.7 ? 1 : Math.max(0, 1.2 - e)));
          portal(c, far + fw / 2, fy + fh / 2, 1, e > 0.35 ? Math.min(6, (e - 0.35) * 20) * Math.max(0, 1.3 - e) : 0);
          if (e > 0.25 && e < 0.55) hidden = true;
          if (e >= 0.55 && e < 0.6) r.fx = far;
          if (e > 1.3) r.hop = null;
        }
        r.fy = fy;
        // spider-man, swinging after it
        const gap = (r.fx + fw / 2 - r.p.x) * dir, behind = gap - 20; // centre to centre: about 20 cells back
        stepSwing(r.p, dt, 220, dir, Math.min(60, Math.max(8, behind * 0.5 + 12)), Math.min(120, Math.max(15, speed + behind * 0.8)), -12, h * 0.55);
        const goo = r.suit === "tobey" ? Math.min(1, Math.max(0, (k - 5) / 1.6)) : 0; // mid-chase, the symbiote takes him
        drawSwinger(c, r.p, r.suit, 1, dir, goo);
        if (!hidden) {
          if (r.foe === "mysterio" && Math.floor(k / 3) % 2 === 1) {
            // illusions: two copies drifting off either side
            c.globalAlpha = 0.35;
            drawFoe(c, r.foe, r.fx - 14, fy - 4, 1, dir < 0, t + 1);
            drawFoe(c, r.foe, r.fx + 14, fy + 4, 1, dir < 0, t + 2);
            c.globalAlpha = 1;
          }
          drawFoe(c, r.foe, r.fx, fy, 1, dir < 0, t);
        }
        if (r.foe === "electro" && Math.floor(t * 2.5) % 2 === 0 && Math.random() < 0.6)
          bolt(c, r.fx + (dir < 0 ? 2 : 9), fy + 6, r.p.x, r.p.y + 4, 1);
        if (r.foe === "goblin") {
          if (!r.bomb && t > r.next) {
            r.bomb = { x: r.fx + fw / 2, y: fy + fh, vx: dir * speed, vy: -10 };
            r.next = t + 2.2;
          }
          const b = r.bomb;
          if (b) {
            b.vy += 60 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            c.fillStyle = Math.floor(t * 10) % 2 ? "#ff8a1f" : "#ffd23f";
            c.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
            if (b.y > h * 0.6) {
              burst(b.x, b.y, ["#ff7a1a", "#ffd23f", "#ff3b1a", "#555"]);
              r.bomb = null;
            }
          }
        }
        // a web shot now and then while he's in the air
        if (!r.p.anchor && r.p.air < 0.12 && gap > 0) line(c, r.p.x, r.p.y, r.fx + fw / 2, fy + fh / 2, "rgba(223,230,245,0.8)");
        const gone = (x: number) => (dir > 0 ? x > w + 40 : x < -40);
        if (gone(r.fx) && gone(r.p.x)) {
          run = null;
          nextRun = t + 14 + Math.random() * 16;
        } else if (k > 40) run = null;
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        if ((p.life -= dt) <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        p.vy += 40 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        c.globalAlpha = Math.min(1, p.life);
        c.fillStyle = p.c;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      c.globalAlpha = 1;
    },
  };
}

// ---- the intro: one long swing across Manhattan, as a random suit either chasing its villain or fighting it

let pick: { suit: Suit; foe: Foe; fight: boolean } | null = null;

export function introSwing(c: Ctx, w: number, h: number, t: number) {
  if (!pick) {
    const [suit, foe] = FIGHTS[Math.floor(Math.random() * FIGHTS.length)];
    pick = { suit, foe, fight: Math.random() < 0.5 };
  }
  const { suit, foe, fight } = pick, s = 2;
  // the web anchor slides across as the pendulum carries him; in a fight they face off across the title
  const ax = Math.min(-w * 0.1 + t * w * 0.22, fight ? w * 0.1 : Infinity), L = h * 0.5;
  const th = Math.sin(t * 2.2) * 0.85;
  const bx = ax + Math.sin(th) * L, by = Math.cos(th) * L - h * 0.05;
  const [hx, hy] = HAND.swing;
  const px = bx - (hx + 0.5) * s, py = by - hy * s;
  line(c, ax, -h * 0.05, bx, by, "#dfe6f5", s);
  const goo = suit === "tobey" ? Math.min(1, Math.max(0, (t - 2.2) / 1.2)) : 0;
  drawSpidey(c, suit, "swing", px, py, s, false, goo);
  // chase: it runs ahead of him; fight: it holds its ground, turned to face him
  const [fw, fh] = FOE_SIZE(foe);
  const vx = fight ? w * 0.8 : px + w * 0.2, vy = h * 0.36 - fh + Math.sin(t * 2) * 2;
  if (foe === "spot") portal(c, vx + (fight ? fw * s + 6 : -6), vy + fh, s, (4 + Math.sin(t * 3) * 1.5) * s);
  drawFoe(c, foe, vx, vy, s, fight, t);
  const cx = vx + (fw * s) / 2, cy = vy + (fh * s) / 2;
  if (foe === "electro" && Math.floor(t * 6) % 3 === 0) bolt(c, cx, cy, px + 6 * s, py + 8 * s, s);
  if (foe === "goblin") {
    // a pumpkin bomb lobbed back at him on a gravity arc
    const k = (t * 0.8) % 1;
    c.fillStyle = Math.floor(t * 10) % 2 ? "#ff8a1f" : "#ffd23f";
    c.fillRect(Math.round(cx + (px + 6 * s - cx) * k), Math.round(cy - Math.sin(k * Math.PI) * h * 0.15), 2 * s, 2 * s);
  }
  if (t % 1.3 < 0.12) line(c, px + 11 * s, py + 7 * s, cx, cy, "#eef2fa", s); // thwip
}
