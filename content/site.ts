// All home-page copy lives here.
export const site = {
  name: "Pratham Nagpal",
  manName: "PRATHAM",
  handle: "prathlab",
  github: "https://github.com/Pratham71",
  githubLogin: "Pratham71",
  whatis: "infrastructure, devops and backend",
  description: [
    "CS student at BITS Pilani Dubai. I build self-hosted infrastructure, backend services, and the automation that ties them together.",
    "I run my own hardware, a Raspberry Pi and a home server, and I prefer building the real thing over reading about it.",
  ],
  // EDUCATION, EXPERIENCE, SKILLS, AWARDS: the resume, man-page style.
  education: [
    { what: "BITS Pilani, Dubai Campus", detail: "computer science, 3rd year, graduating 2028", when: "2024 to 28" },
    { what: "G.D. Goenka, The Flagship School, Vasant Kunj, New Delhi", detail: "class of 2024", when: "2024" },
  ],
  experience: [
    {
      role: "software development and automation",
      org: "Inter Event Management Services Pvt. Ltd., Delhi",
      when: "jun 2026 to jul 2026",
      points: [
        "built IEMS ONE, the company's ERP: FastAPI backend, Celery workers, Postgres, Redis, MinIO and a Streamlit staff UI, all in Docker behind Caddy",
        "redesigned the company website (live on a temporary address for now)",
      ],
    },
  ],
  skills: [
    ["--build", "Python, Java, TypeScript, FastAPI, Next.js, PostgreSQL, MongoDB"],
    ["--run", "Docker, Debian, Tailscale, Coolify, Grafana, Prometheus, n8n, Bash"],
  ] as [string, string][],
  // from school (G.D. Goenka), kept short
  awards: [
    ["2023", "Roll of Honour in Computer Science"],
    ["2023", "Certificate of Achievement, ADOBE AI-THON inter-school hackathon"],
    ["2023", "Certificates of Appreciation: Goenkan Tech Week, Goenkan Tech Fest, Saviors Foundation"],
  ] as [string, string][],
  // HOBBIES: flag-style lines, like the SYNOPSIS. Edit freely.
  hobbies: [
    ["--gaming", "gta, fortnite, minecraft; the dock's theme button has all three"],
    ["--gym", "lifting most mornings; rest days are part of the program"],
    ["--homelab", "tinkering with the raspberry pi and the home server, self-hosting whatever looks fun"],
  ] as [string, string][],
  // Photo shown dithered beside DESCRIPTION (hover reveals it). Drop a file in public/ and set it here.
  portrait: null as { src: string; alt: string; width: number; height: number } | null,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prathlabs.com").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "pn.prathamnagpal@gmail.com",
  // CONTACT section
  responseTime: "usually within 24 to 48 hours",
  location: "Dubai, UAE",
  timezone: "GST, UTC+4",
  // "MM-DD": confetti on the site that day (Dubai time). null: no birthday easter egg.
  birthday: "12-13" as string | null,
};
