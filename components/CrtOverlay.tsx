"use client";

import { useEffect, useRef } from "react";
import { fullscreenShader } from "@/lib/gl";

// CRT glass over the login intro: scanlines, curved-screen corners and vignette, a slow rolling band,
// grain and a faint flicker. It only darkens (black with alpha), so it sits over the DOM log and the globe
// without sampling them. Runs only while the boot overlay is up.
const FRAG = `
precision mediump float;
uniform vec2 res;
uniform float t;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / res;
  vec2 c = uv * 2.0 - 1.0;
  // barrel-ish screen edge: round the corners off, darken toward the rim
  vec2 k = c * (1.0 + 0.06 * dot(c, c));
  vec2 edge = smoothstep(vec2(0.975), vec2(1.03), abs(k));
  float mask = max(edge.x, edge.y);
  float vig = smoothstep(0.7, 1.6, length(c * vec2(1.0, 0.9)));
  float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159 * 0.5);
  float band = exp(-pow((uv.y - fract(1.0 - t * 0.11)) * 9.0, 2.0));
  float grain = hash(floor(gl_FragCoord.xy) + fract(t) * 91.0);
  float a = 0.16 * (1.0 - scan) + 0.45 * vig + 0.07 * band + 0.05 * grain + 0.015 * sin(t * 57.0);
  a = max(a, mask);
  gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 1.0));
}`;

export function CrtOverlay() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const html = document.documentElement;
    if (!canvas || !html.dataset.boot) return;
    const sh = fullscreenShader(canvas, FRAG);
    if (!sh) return;
    const uRes = sh.uniform("res");
    const uT = sh.uniform("t");
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      // 1 css px per pixel: scanlines stay crisp 2px bands at any DPR
      if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
      }
      sh.gl.uniform2f(uRes, canvas.width, canvas.height);
      sh.gl.uniform1f(uT, (now - t0) / 1000);
      sh.draw();
      if (html.dataset.boot) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="crt" aria-hidden="true" />;
}
