import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/content/site";

export const alt = `${site.name} — ${site.whatis}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [display, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/MartianMono-ExtraBoldWide.ttf")),
    readFile(join(process.cwd(), "assets/MartianMono-Regular.ttf")),
  ]);
  const muted = "#7D8A96";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0D10", color: "#E6EDF3", padding: 64, fontFamily: "Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: muted, fontSize: 26 }}>
          <span>PRATHAM(1)</span>
          <span>User Commands</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>NAME</span>
          <span style={{ fontFamily: "Display", fontSize: 92, marginTop: 12, marginLeft: 48 }}>{site.name}</span>
          <span style={{ fontSize: 32, color: muted, marginLeft: 48, marginTop: 8 }}>— {site.whatis}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: muted, borderTop: "1px solid #232B33", paddingTop: 20 }}>
          <span style={{ color: "#FFB547" }}>{site.url.replace(/^https?:\/\//, "")}</span>
          <span>dxb · infrastructure · devops · backend</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Display", data: display, weight: 800 },
        { name: "Mono", data: regular, weight: 400 },
      ],
    },
  );
}
