"use client";

import { isGame } from "@/lib/theme";
import { useEffect, useRef } from "react";
import { BOOT_T, NODES } from "@/lib/boot-lines";
import { fullscreenShader, rgb } from "@/lib/gl";

const CELL = 3; // css px per dither cell
const RAD = Math.PI / 180;
const ARC_MS = 450;

// The sphere, per pixel on the GPU: land from a Natural Earth mask (public/land.png, rasterized from
// world-atlas, ISC), Lambert light with a soft terminator, a sun glint on the sea, a fresnel rim and an
// atmosphere halo, all ordered-dithered in 3px cells like the heatmap. Rotation uniforms match rot() below,
// which the 2D overlay uses for arcs, regions and visitors.
const FRAG = `
precision mediump float;
uniform vec2 res;
uniform vec2 center;
uniform float R;
uniform float cy; uniform float sy; uniform float cp; uniform float sp;
uniform float cell;
uniform sampler2D land;
uniform float hasLand;
uniform vec3 cLand; uniform vec3 cSea; uniform vec3 cRim;
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main(){
  vec2 c = floor(gl_FragCoord.xy / cell);
  vec2 d = ((c + 0.5) * cell - center) / R;
  float r2 = dot(d, d);
  float level; vec3 col; float alpha;
  if (r2 > 1.0) {
    float h = exp(-(sqrt(r2) - 1.0) * 30.0);
    level = h * 0.35; col = cRim; alpha = 0.45;
  } else {
    vec3 n = vec3(d, sqrt(1.0 - r2));
    // view -> world (inverse of yaw then pitch)
    float z1 = -n.y * sp + n.z * cp;
    vec3 w = vec3(n.x * cy - z1 * sy, n.y * cp + n.z * sp, n.x * sy + z1 * cy);
    vec2 uv = vec2(atan(w.x, w.z) / 6.28318 + 0.5, 0.5 - asin(clamp(w.y, -1.0, 1.0)) / 3.14159);
    float isLand = hasLand * smoothstep(0.35, 0.65, texture2D(land, uv).r);
    vec3 L = normalize(vec3(-0.55, 0.5, 0.65));
    float lam = dot(n, L);
    float day = smoothstep(-0.15, 0.35, lam);
    float glint = pow(max(0.0, dot(reflect(-L, n), vec3(0.0, 0.0, 1.0))), 24.0) * (1.0 - isLand);
    float rim = pow(1.0 - n.z, 2.5);
    float landLvl = 0.1 + 0.62 * day * (0.45 + 0.55 * max(lam, 0.0));
    float seaLvl = 0.05 + 0.13 * day;
    level = mix(seaLvl, landLvl, isLand) + glint * 0.5 + rim * 0.15;
    col = mix(cSea, cLand, isLand);
    col = mix(col, cRim, rim * 0.45);
    alpha = mix(0.5, 0.8, isLand);
  }
  float ink = step(bayer4(c) + 0.02, level);
  gl_FragColor = vec4(col * ink * alpha, ink * alpha);
}`;

type V = [number, number, number];
const vec = (lat: number, lon: number): V => [
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
];

// Faces the visitor's nearest region, draws a great-circle arc to each edge as its probe line prints, and
// marks regions other recent visitors came from. Runs only while the boot overlay is up.
export function BootGlobe() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const glCanvas = glRef.current;
    const fx = fxRef.current;
    const ctx = fx?.getContext("2d");
    // ponytail: game themes skip the globe (and so don't record the visit region); fine for a rare path
    if (!glCanvas || !fx || !ctx || html.dataset.boot !== "1" || isGame(html.dataset.theme)) return;
    const home = NODES.find((n) => n.id === html.dataset.bootHome) ?? NODES[0];
    const homeV = vec(home.lat, home.lon);
    const t0 = (window as { __bootT0?: number }).__bootT0 ?? performance.now();
    const css = getComputedStyle(html);
    const tok = (v: string) => css.getPropertyValue(v).trim();
    const [text, muted, amber, ok, ink] = ["--text", "--muted", "--amber", "--ok", "--ink"].map(tok);

    // Record this session's region, then fetch where others came from (region ids only).
    let visitors: { v: V; n: number }[] = [];
    void fetch("/api/visits", { method: "POST", body: home.id, keepalive: true }).catch(() => {});
    void fetch("/api/visits")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string; n: number }[]) => {
        visitors = list
          .filter((x) => x.id !== home.id)
          .map((x) => {
            const node = NODES.find((n) => n.id === x.id);
            return node ? { v: vec(node.lat, node.lon), n: x.n } : null;
          })
          .filter((x): x is { v: V; n: number } => x !== null);
      })
      .catch(() => {});

    const sh = fullscreenShader(glCanvas, FRAG);
    if (sh) {
      const { gl } = sh;
      gl.uniform3f(sh.uniform("cLand"), ...rgb(text));
      gl.uniform3f(sh.uniform("cSea"), ...rgb(muted));
      gl.uniform3f(sh.uniform("cRim"), ...rgb(amber));
      gl.uniform1f(sh.uniform("cell"), CELL);
      gl.uniform1f(sh.uniform("hasLand"), 0);
      const img = new Image();
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
        gl.uniform1f(sh.uniform("hasLand"), 1);
      };
      img.src = "/land.png";
    }

    const pitch = home.lat * RAD * 0.6;
    let w = 0;
    let h = 0;
    let raf = 0;

    const frame = (now: number) => {
      const t = now - t0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== innerWidth || h !== innerHeight) {
        w = innerWidth;
        h = innerHeight;
        glCanvas.width = w; // dither cells are 3 css px: 1x is plenty, and cheap
        glCanvas.height = h;
        fx.width = Math.round(w * dpr);
        fx.height = Math.round(h * dpr);
      }
      const wide = w >= 720;
      const cx = wide ? w * 0.68 : w / 2;
      const cyy = wide ? h * 0.44 : h * 0.3;
      const R = wide ? Math.min(w * 0.25, h * 0.36) : Math.min(w * 0.42, h * 0.22);
      const yaw = -home.lon * RAD + t * 0.00007; // steady drift, ~4deg/s
      const [cyw, syw, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];

      if (sh) {
        const { gl } = sh;
        gl.uniform2f(sh.uniform("res"), w, h);
        gl.uniform2f(sh.uniform("center"), cx, h - cyy);
        gl.uniform1f(sh.uniform("R"), R);
        gl.uniform1f(sh.uniform("cy"), cyw);
        gl.uniform1f(sh.uniform("sy"), syw);
        gl.uniform1f(sh.uniform("cp"), cp);
        gl.uniform1f(sh.uniform("sp"), sp);
        sh.draw();
      }

      // world -> view, same as the shader's inverse
      const rot = ([x, y, z]: V): V => {
        const x1 = x * cyw + z * syw;
        const z1 = -x * syw + z * cyw;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };
      const project = (v: V) => {
        const [x, y, z] = rot(v);
        return { x: cx + x * R, y: cyy - y * R, seen: z > 0 || x * x + y * y > 1 };
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // other visitors' regions: quiet rings
      visitors.forEach(({ v, n }, i) => {
        const p = project(v);
        if (!p.seen || rot(v)[2] < 0) return;
        const k = ((t + i * 380) % 2400) / 2400;
        // dark-outlined so it reads on lit land and dark sea alike
        ctx.globalAlpha = 1;
        ctx.fillStyle = ink;
        ctx.fillRect(p.x - 3.5, p.y - 3.5, 7, 7);
        ctx.fillStyle = text;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.lineWidth = 3;
        ctx.strokeStyle = ink;
        ctx.globalAlpha = (1 - k) * 0.6;
        const rr = 4 + k * (10 + Math.min(n, 10));
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = text;
        ctx.globalAlpha = 1 - k;
        ctx.stroke();
      });

      // probe arcs, lifted off the surface, drawn as each probe row prints
      ctx.lineWidth = 1.25;
      NODES.forEach((n, i) => {
        if (n.id === home.id) return;
        const at = BOOT_T.probe + Math.floor(i / 2) * BOOT_T.step + (i % 2) * (BOOT_T.step / 2);
        const p = Math.min(1, Math.max(0, (t - at) / ARC_MS));
        if (!p) return;
        const b = vec(n.lat, n.lon);
        const omega = Math.acos(Math.min(1, homeV[0] * b[0] + homeV[1] * b[1] + homeV[2] * b[2]));
        const steps = 48;
        ctx.strokeStyle = amber;
        ctx.globalAlpha = t > BOOT_T.route ? 0.4 : 0.9;
        ctx.beginPath();
        let open = false;
        let head = project(homeV);
        for (let s = 0; s <= steps * p; s++) {
          const f = s / steps;
          const ka = Math.sin((1 - f) * omega) / Math.sin(omega);
          const kb = Math.sin(f * omega) / Math.sin(omega);
          const lift = 1 + 0.22 * Math.sin(Math.PI * f) * (omega / Math.PI);
          const pt = project([
            (homeV[0] * ka + b[0] * kb) * lift,
            (homeV[1] * ka + b[1] * kb) * lift,
            (homeV[2] * ka + b[2] * kb) * lift,
          ]);
          if (pt.seen && open) ctx.lineTo(pt.x, pt.y);
          else if (pt.seen) ctx.moveTo(pt.x, pt.y);
          open = pt.seen;
          head = pt;
        }
        ctx.stroke();
        const dot = project(b);
        ctx.fillStyle = amber;
        if (p === 1 && dot.seen) ctx.fillRect(dot.x - 2, dot.y - 2, 4, 4);
        else if (p < 1 && head.seen) ctx.fillRect(head.x - 1.5, head.y - 1.5, 3, 3);
      });

      // home region: steady mark, pulsing ring once the route is chosen
      const hp = project(homeV);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ok;
      ctx.fillRect(hp.x - 2.5, hp.y - 2.5, 5, 5);
      if (t > BOOT_T.route) {
        const k = ((t - BOOT_T.route) % 1100) / 1100;
        ctx.strokeStyle = ok;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 4 + k * 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (visitors.length) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = muted;
        ctx.font = "11px " + css.getPropertyValue("--font-mono");
        ctx.textAlign = "center";
        const total = visitors.reduce((s, x) => s + x.n, 0);
        ctx.fillText(`○ ${total} recent visit${total === 1 ? "" : "s"} from ${visitors.length} region${visitors.length === 1 ? "" : "s"}`, cx, cyy + R + 40);
      }
      ctx.globalAlpha = 1;

      if (html.dataset.boot) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <canvas ref={glRef} className="boot-globe boot-globe--gl" />
      <canvas ref={fxRef} className="boot-globe" />
    </>
  );
}
