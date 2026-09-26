import { ldJson, llmsTxt, personLd, projectLd } from "@/lib/seo";
import { projects } from "@/content/projects";

test("ld+json can't be broken out of by a closing script tag", () => {
  expect(ldJson({ x: "</script><script>alert(1)</script>" })).not.toContain("</script>");
});

test("person and project data carry the essentials", () => {
  const person = personLd()["@graph"][0] as Record<string, unknown>;
  expect(person).toMatchObject({ "@type": "Person", name: "Pratham Nagpal" });
  expect(projectLd(projects[0])).toMatchObject({ "@type": "SoftwareSourceCode", codeRepository: projects[0].repo });
});

test("llms.txt lists every project with a link", () => {
  const txt = llmsTxt();
  expect(txt.startsWith("# Pratham Nagpal")).toBe(true);
  for (const p of projects) expect(txt).toContain(`/projects/${p.slug})`);
});
