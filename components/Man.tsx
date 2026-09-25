// Man page chrome: "NAME(1)   User Commands   NAME(1)" header and footer.
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
      <header className="man-edge" aria-label="Manual page header">
        <span>{ref}</span>
        <span className="mid">{section === 7 ? "Miscellaneous" : "User Commands"}</span>
        <span className="right">{ref}</span>
      </header>
      <main id="main">{children}</main>
      <footer className="man-edge man-edge--foot">
        <span>{footLeft}</span>
        <span className="mid">{footMid}</span>
        <span className="right">{ref}</span>
      </footer>
    </div>
  );
}

export function Section({ name, children, id }: { name: string; children: React.ReactNode; id?: string }) {
  const hid = `${(id ?? name).toLowerCase().replace(/\s+/g, "-")}-h`;
  return (
    <section className="man-section" aria-labelledby={hid} id={id}>
      <h2 id={hid}>{name}</h2>
      <div className="body">{children}</div>
    </section>
  );
}
