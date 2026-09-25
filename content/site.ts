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
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prathlab.com").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
};
