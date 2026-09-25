import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManPage, Section } from "@/components/Man";
import { StatusMark } from "@/components/StatusMark";
import { getProject, projects } from "@/content/projects";
import { site } from "@/content/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p
    ? { title: p.name, description: `${p.name}: ${p.summary}.`, alternates: { canonical: `/projects/${p.slug}` } }
    : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const { default: Body } = await import(`@/content/projects/${slug}.mdx`);

  return (
    <ManPage title={p.title} section={p.section} footLeft={site.handle} footMid={p.lang}>
      <Section name="NAME">
        <p>
          <strong>{p.name}</strong> <span className="muted">— {p.summary}</span>
        </p>
      </Section>
      <Section name="STATUS">
        <StatusMark kind={p.status} />
      </Section>
      <Section name="DESCRIPTION">
        <div className="man-body">
          <Body />
        </div>
      </Section>
      <Section name="STACK">
        <ul className="chips">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>
      <Section name="SEE ALSO">
        <ul className="see-also">
          <li>
            <a href={p.repo}>source(1)</a>
          </li>
          <li>
            <Link href="/">pratham(1)</Link>
          </li>
        </ul>
      </Section>
    </ManPage>
  );
}
