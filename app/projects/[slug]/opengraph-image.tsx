import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProject, projects } from "@/content/projects";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project manual page";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

// Per-project share card: man-page header, project name + summary, and its cover screenshot as a
// pre-rendered dither (assets/og/<slug>.png; satori can't run the canvas dither).
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) return new Response(null, { status: 404 });
  const [display, regular, cover] = await Promise.all([
    readFile(join(process.cwd(), "assets/MartianMono-ExtraBoldWide.ttf")),
    readFile(join(process.cwd(), "assets/MartianMono-Regular.ttf")),
    readFile(join(process.cwd(), `assets/og/${p.slug}.png`)).catch(() => null),
  ]);
  const muted = "#7D8A96";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0D10", color: "#E6EDF3", padding: 64, fontFamily: "Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: muted, fontSize: 26 }}>
          <span>{`${p.title}(${p.section})`}</span>
          <span>{p.section === 7 ? "Miscellaneous" : "User Commands"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>NAME</span>
            <span style={{ fontFamily: "Display", fontSize: 60, marginTop: 12, marginLeft: 36 }}>{p.name}</span>
            <span style={{ fontSize: 28, color: muted, marginLeft: 36, marginTop: 10 }}>— {p.summary}</span>
            <span style={{ fontSize: 22, color: "#FFB547", marginLeft: 36, marginTop: 24 }}>{p.stack.slice(0, 5).join(" · ")}</span>
          </div>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element -- satori renders plain img only
            <img src={`data:image/png;base64,${cover.toString("base64")}`} width={440} alt="" style={{ border: "1px solid #232B33" }} />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: muted, borderTop: "1px solid #232B33", paddingTop: 20 }}>
          <span style={{ color: "#FFB547" }}>{`${site.url.replace(/^https?:\/\//, "")}/projects/${p.slug}`}</span>
          <span>{site.name}</span>
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
