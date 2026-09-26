"use client";

import { useEffect, useRef } from "react";
import { fullscreenShader, rgb } from "@/lib/gl";

const CELL = 3; // css px per dither cell (canvas renders at 1x and is scaled pixelated)

// Dim "signal" behind the hero: domain-warped noise, ordered-dithered in 3px cells like the heatmap and
// globe, with a warm swell around the pointer. Drawn at 1 css px per pixel; stops offscreen and in
// background tabs; a single still frame under reduced motion; nothing at all without WebGL.
const FRAG = `
precision mediump float;
uniform vec2 res;
uniform float t;
uniform vec2 mouse;
uniform float cell;
uniform vec3 dim;
uniform vec3 warm;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main(){
  vec2 c = floor(gl_FragCoord.xy / cell);
  vec2 px = (c + 0.5) * cell;
  vec2 uv = px / res.y;
  vec2 w = vec2(fbm(uv * 1.6 + t * 0.03), fbm(uv * 1.6 - t * 0.025 + 7.3));
  float n = fbm(uv * 2.4 + w * 1.8 + vec2(t * 0.02, 0.0));
  float level = smoothstep(0.5, 0.82, n) * 0.5;
  float d = length(px - mouse) / (res.y * 0.45);
  float glow = exp(-d * d * 3.0) * step(0.0, mouse.x);
  level += glow * 0.35;
  // fade out toward the canvas edges so it never has a hard border
  vec2 e = px / res;
  level *= smoothstep(0.0, 0.18, e.x) * smoothstep(1.0, 0.7, e.x) * smoothstep(0.0, 0.25, e.y) * smoothstep(1.0, 0.75, e.y);
  float ink = step(bayer4(c) + 0.04, level); // +0.04: empty stays empty (no faint grid)
  float a = ink * (0.3 + 0.35 * glow);
  gl_FragColor = vec4(mix(dim, warm, glow) * a, a);
}`;

export function SignalField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const sh = fullscreenShader(canvas, FRAG);
    if (!sh) return;
    const { gl } = sh;
    const css = getComputedStyle(document.documentElement);
    gl.uniform3f(sh.uniform("dim"), ...rgb(css.getPropertyValue("--muted")));
    gl.uniform3f(sh.uniform("warm"), ...rgb(css.getPropertyValue("--amber")));
    gl.uniform1f(sh.uniform("cell"), CELL);
    const uRes = sh.uniform("res");
    const uT = sh.uniform("t");
    const uMouse = sh.uniform("mouse");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -1e4, y: -1e4 };
    let visible = false;
    let raf = 0;

    const size = () => {
      const w = Math.round(canvas.clientWidth);
      const h = Math.round(canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.uniform2f(uRes, w, h);
    };
    const render = (now: number) => {
      size();
      gl.uniform1f(uT, reduce ? 0 : now / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      sh.draw();
    };
    const loop = (now: number) => {
      render(now);
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => reduce && render(0));
    ro.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = r.height - (e.clientY - r.top); // GL y is up
    };
    const onVis = () => !document.hidden && visible && kick();
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="signal" aria-hidden="true" />;
}
