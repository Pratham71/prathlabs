import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { ManPage, Section } from "@/components/Man";
import { StatusMark } from "@/components/StatusMark";
import { DitherImage } from "@/components/DitherImage";
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
      <Section name="NAME" plain>
        <h1 className="project-name">
          <ViewTransition name={`project-${p.slug}`} share="morph">
            <span className="project-ref">{p.name}</span>
          </ViewTransition>{" "}
          <span className="muted">— {p.summary}</span>
        </h1>
      </Section>
      <Section name="STATUS">
        <StatusMark kind={p.status} />
      </Section>
      <Section name="DESCRIPTION">
        <div className="man-body">
          <Body />
        </div>
      </Section>
      <Section name="FIGURES">
        <div className="figures">
          {p.images.map((im, i) => (
            <figure key={im.src}>
              <DitherImage src={im.src} alt={im.alt} width={im.width} height={im.height} />
              <figcaption>
                <span className="muted">fig.{i + 1}</span> {im.caption}
              </figcaption>
            </figure>
          ))}
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
            <Link href="/" transitionTypes={["nav-back"]}>pratham(1)</Link>
          </li>
        </ul>
      </Section>
    </ManPage>
  );
}
