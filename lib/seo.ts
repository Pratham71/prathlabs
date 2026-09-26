import { projects, type Project } from "@/content/projects";
import { site } from "@/content/site";

// schema.org structured data. Only facts already on the page.
export function personLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.name,
        url: site.url,
        description: site.description[0],
        affiliation: { "@type": "CollegeOrUniversity", name: "BITS Pilani, Dubai Campus" },
        knowsAbout: ["Infrastructure", "DevOps", "Backend development", "Self-hosting", "Docker", "Linux"],
        sameAs: [site.github],
        ...(site.email ? { email: `mailto:${site.email}` } : {}),
      },
      { "@type": "WebSite", "@id": `${site.url}/#site`, url: site.url, name: site.name, author: { "@id": `${site.url}/#person` } },
    ],
  };
}

export function projectLd(p: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: p.name,
    description: p.summary,
    url: `${site.url}/projects/${p.slug}`,
    codeRepository: p.repo,
    programmingLanguage: p.lang,
    keywords: p.stack.join(", "),
    image: p.images.map((i) => `${site.url}${i.src}`),
    author: { "@type": "Person", name: site.name, url: site.url },
  };
}

// Serialized for a <script type="application/ld+json">; "<" escaped so no string can close the tag.
export const ldJson = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

// /llms.txt: a plain-text map of the site for language models (llmstxt.org format).
export function llmsTxt() {
  const line = (p: Project) => `- [${p.name}](${site.url}/projects/${p.slug}): ${p.summary} (${p.status}; ${p.stack.join(", ")}). Source: ${p.repo}`;
  return [
    `# ${site.name}`,
    "",
    `> ${site.whatis}. ${site.description.join(" ")}`,
    "",
    "## Projects",
    ...projects.map(line),
    "",
    "## Contact",
    `- GitHub: ${site.github}`,
    ...(site.email ? [`- Email: ${site.email}`] : []),
    "",
  ].join("\n");
}
