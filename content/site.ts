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
  // HOBBIES: flag-style lines, like the SYNOPSIS. Edit freely.
  hobbies: [
    ["--gaming", "gta, fortnite, minecraft; the dock's theme button has all three"],
    ["--gym", "lifting most mornings; rest days are part of the program"],
    ["--homelab", "tinkering with the raspberry pi and the home server, self-hosting whatever looks fun"],
  ] as [string, string][],
  // Photo shown dithered beside DESCRIPTION (hover reveals it). Drop a file in public/ and set it here.
  portrait: null as { src: string; alt: string; width: number; height: number } | null,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prathlab.com").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "pn.prathamnagpal@gmail.com",
  // CONTACT section
  responseTime: "usually within 24 to 48 hours",
  location: "Dubai, UAE",
  timezone: "GST, UTC+4",
};
