import { readFileSync } from "node:fs";
import path from "node:path";
import { projects, type Project } from "@/content/projects";
import { site } from "@/content/site";

// schema.org structured data. Only facts already on the page.
export function personLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${site.url}/#page`,
        url: site.url,
        name: `${site.name}: ${site.whatis}`,
        mainEntity: { "@id": `${site.url}/#person` },
        isPartOf: { "@id": `${site.url}/#site` },
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.name,
        url: site.url,
        jobTitle: "Computer science student",
        description: site.description[0],
        affiliation: { "@type": "CollegeOrUniversity", name: site.education[0].what },
        alumniOf: site.education.slice(1).map((e) => ({ "@type": "EducationalOrganization", name: e.what })),
        homeLocation: { "@type": "Place", name: site.location },
        knowsAbout: ["Infrastructure", "DevOps", "Backend development", "Self-hosting", ...site.skills.flatMap(([, s]) => s.split(", "))],
        award: site.awards.map(([when, what]) => `${what} (${when})`),
        hasOccupation: site.experience.map((x) => ({
          "@type": "Role",
          roleName: x.role,
          description: x.points.join("; "),
          worksFor: { "@type": "Organization", name: x.org },
        })),
        sameAs: [site.github],
        email: `mailto:${site.email}`,
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#site`,
        url: site.url,
        name: site.name,
        author: { "@id": `${site.url}/#person` },
        copyrightHolder: { "@id": `${site.url}/#person` },
        copyrightYear: new Date().getFullYear(),
      },
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
// full: also inlines each project's write-up (/llms-full.txt).
export function llmsTxt(full = false) {
  const line = (p: Project) => `- [${p.name}](${site.url}/projects/${p.slug}): ${p.summary} (${p.status}; ${p.stack.join(", ")}). Source: ${p.repo}`;
  const body = (p: Project) => readFileSync(path.join(process.cwd(), "content/projects", `${p.slug}.mdx`), "utf-8").trim();
  return [
    `# ${site.name}`,
    "",
    `> ${site.name} is a third-year computer science student at ${site.education[0].what} (${site.location}, graduating 2028) who works on ${site.whatis}.`,
    "",
    ...site.description,
    "",
    "## Education",
    ...site.education.map((e) => `- ${e.what}: ${e.detail} (${e.when})`),
    "",
    "## Experience",
    ...site.experience.flatMap((x) => [`- ${x.role} at ${x.org}, ${x.when}`, ...x.points.map((p) => `  - ${p}`)]),
    "",
    "## Projects",
    ...(full ? projects.flatMap((p) => [`### ${p.name}`, line(p).slice(2), "", body(p), ""]) : projects.map(line)),
    ...(full ? [] : [""]),
    "## Skills",
    ...site.skills.map(([k, v]) => `- ${k.replace(/^--/, "")}: ${v}`),
    "",
    "## Awards",
    ...site.awards.map(([when, what]) => `- ${what} (${when}, G.D. Goenka)`),
    "",
    "## Hobbies",
    ...site.hobbies.map(([k, v]) => `- ${k.replace(/^--/, "")}: ${v}`),
    "",
    "## Contact",
    `- Email: ${site.email} (replies ${site.responseTime}, ${site.timezone})`,
    `- GitHub: ${site.github}`,
    "",
    ...(full ? [] : ["## Optional", `- [Full text](${site.url}/llms-full.txt): everything above plus each project's write-up`, ""]),
  ].join("\n");
}
