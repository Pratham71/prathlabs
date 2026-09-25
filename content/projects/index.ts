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
    stack: ["Docker", "Debian", "Tailscale", "Coolify", "Grafana", "Prometheus", "n8n"],
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
    stack: ["Java", "Maven"],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
