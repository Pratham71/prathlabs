import { ClockText } from "@/components/WorldClock";
import { site } from "@/content/site";

// Man page chrome. The ref (PRATHAM(1)) shows once, top left; real man pages repeat it, this one doesn't.
export function ManPage({
  title,
  section,
  footLeft,
  footMid,
  children,
}: {
  title: string;
  section: number;
  footLeft: string;
  footMid: string;
  children: React.ReactNode;
}) {
  const ref = `${title}(${section})`;
  return (
    <div className="man">
      <header className="man-edge" aria-label="Manual page header" style={{ viewTransitionName: "man-head" }}>
        <span>{ref}</span>
        <span className="mid">{section === 7 ? "Miscellaneous" : "User Commands"}</span>
        <span className="right">
          <ClockText />
        </span>
      </header>
      <main id="main">{children}</main>
      <footer className="man-edge man-edge--foot">
        <span>{footLeft}</span>
        <span className="mid">{footMid}</span>
      </footer>
      <p className="copyright">
        © {new Date().getFullYear()} {site.name}. Open source under the{" "}
        <a href={`${site.github}/prathlabs`}>MIT license</a>: take what’s useful. Game, film and brand names belong to
        their owners and are referenced for fan theming only.
      </p>
    </div>
  );
}

// `plain` renders the section name as a label, for the section holding the page's h1 (NAME),
// so the outline reads h1 then h2s instead of h2 before h1.
export function Section({
  name,
  children,
  id,
  plain,
}: {
  name: string;
  children: React.ReactNode;
  id?: string;
  plain?: boolean;
}) {
  const hid = `${(id ?? name).toLowerCase().replace(/\s+/g, "-")}-h`;
  const Label = plain ? "p" : "h2";
  return (
    <section className="man-section" aria-labelledby={plain ? undefined : hid} id={id}>
      <Label id={hid} className="man-label">
        {name}
      </Label>
      <div className="body">{children}</div>
    </section>
  );
}
