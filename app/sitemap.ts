import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

// lastModified = build time: content only changes with a deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: site.url, lastModified, changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
