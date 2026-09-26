// 4x4 ordered (Bayer) dither: a pixel is inked when its threshold falls under level/4.
// Technique after amicro's dither charts (MIT, github.com/Subhan-code/Amicro--Micro-transitions-).
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function inked(level: number, x: number, y: number): boolean {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16 < level / 4;
}

// Ordered-dither a loaded image into ctx at w x h css px: one `dot` px cell per sample, luminance
// contrast-stretched so dark UI screenshots still resolve. Browser only (reads pixels via a canvas).
export function ditherImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  w: number,
  h: number,
  dot: number,
  color: string,
) {
  const cols = Math.ceil(w / dot);
  const rows = Math.ceil(h / dot);
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const o = off.getContext("2d", { willReadFrequently: true });
  if (!o) return;
  o.drawImage(img, 0, 0, cols, rows);
  const px = o.getImageData(0, 0, cols, rows).data;
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < lum.length; i++)
    lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
  // Black point at the median (the screenshot's background drops out), white point at the 99th percentile.
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(sorted.length * 0.5)];
  const hi = sorted[Math.floor(sorted.length * 0.99)];
  const span = Math.max(0.05, hi - lo);
  const path = new Path2D();
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const l = Math.max(0, (lum[y * cols + x] - lo) / span);
      if (inked(Math.pow(l, 0.8) * 4, x, y)) path.rect(x * dot, y * dot, dot, dot);
    }
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.fill(path);
}
