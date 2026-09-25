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
