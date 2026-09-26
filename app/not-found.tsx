import Link from "next/link";
import { ManPage, Section } from "@/components/Man";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <ManPage title="MAN" section={1} footLeft={site.handle} footMid="404">
      <Section name="ERROR" plain>
        <h1 className="project-name">No manual entry for this page.</h1>
      </Section>
      <Section name="SEE ALSO">
        <p>
          <Link href="/" transitionTypes={["nav-back"]}>pratham(1)</Link>
        </p>
      </Section>
    </ManPage>
  );
}
