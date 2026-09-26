export type Status = "active" | "building" | "shipped";

export type Project = {
  slug: string;
  title: string; // man page name, e.g. HOMELAB
  section: number; // man section: 1 = user command, 7 = misc/overview
  name: string;
  status: Status;
  lang: string;
  summary: string;
  repo: string;
  stack: string[];
  // First image is the cover (shown in the cursor on the home page). Files live in public/projects.
  images: { src: string; alt: string; caption: string; width: number; height: number }[];
};

// Order = order on the home page. Body copy lives in <slug>.mdx.
export const projects: Project[] = [
  {
    slug: "homelab",
    title: "HOMELAB",
    section: 7,
    name: "homelab-infrastructure",
    status: "active",
    lang: "Shell",
    summary: "multi-node self-hosted stack",
    repo: "https://github.com/Pratham71/homelab-infrastructure",
    stack: ["Docker", "Debian", "Tailscale", "Coolify", "Homepage", "Dozzle", "Uptime Kuma", "Grafana", "Prometheus", "n8n"],
    images: [
      { src: "/projects/homelab-dashboard.webp", alt: "Homepage dashboard listing the lab's services with response times", caption: "homepage: every service, one screen", width: 1400, height: 467 },
      { src: "/projects/homelab-logs.webp", alt: "Dozzle showing both hosts and their running containers", caption: "dozzle: 2 hosts, 8 containers", width: 1400, height: 665 },
      { src: "/projects/homelab-uptime.webp", alt: "Uptime Kuma monitor for the home server", caption: "uptime kuma: the pi watches the server", width: 1289, height: 789 },
    ],
  },
  {
    slug: "vessel",
    title: "VESSEL",
    section: 1,
    name: "Vessel",
    status: "shipped",
    lang: "Java",
    summary: "minimal interactive java notebook",
    repo: "https://github.com/Pratham71/Vessel",
    stack: ["Java", "JavaFX", "JShell", "Maven"],
    images: [
      { src: "/projects/vessel-notebook.webp", alt: "Vessel notebook window with a Java cell ready to run", caption: "a cell, a run button, output below", width: 1248, height: 849 },
    ],
  },
  {
    slug: "infirmary",
    title: "INFIRMARY",
    section: 1,
    name: "medical-appointment-system",
    status: "shipped",
    lang: "Python",
    summary: "college infirmary appointments and records",
    repo: "https://github.com/Pratham71/medical-appointment-system",
    stack: ["FastAPI", "MySQL", "raw SQL", "JWT", "Next.js", "TypeScript", "Tailwind"],
    images: [],
  },
  {
    slug: "ytdl",
    title: "YTDL",
    section: 1,
    name: "yt-downloader",
    status: "shipped",
    lang: "Python",
    summary: "youtube video and mp3 from the terminal",
    repo: "https://github.com/Pratham71/YtDownloader",
    stack: ["Python", "uv", "yt-dlp", "FFmpeg"],
    images: [],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
