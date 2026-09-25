import Link from "next/link";
import { ManPage, Section } from "@/components/Man";
import { StatusMark } from "@/components/StatusMark";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { CopyEmail } from "@/components/CopyEmail";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { activityStats, getContributions } from "@/lib/github";
import { getDeviceLines, renderDate } from "@/lib/devices";

export const revalidate = 60;

export default async function Home() {
  const [activity, devices] = await Promise.all([
    getContributions(site.githubLogin, process.env.GITHUB_TOKEN),
    getDeviceLines(),
  ]);
  const stats = activity ? activityStats(activity.days) : null;

  return (
    <ManPage title={site.manName} section={1} footLeft={site.handle} footMid={renderDate()}>
      <Section name="NAME">
        <div className="name-line">
          <h1 className="display-name">{site.name}</h1>
          <span className="muted">— {site.whatis}</span>
        </div>
      </Section>

      <Section name="SYNOPSIS">
        <p>
          <strong>pratham</strong> <span className="flag">[--build systems]</span>{" "}
          <span className="flag">[--self-host]</span> <span className="flag">[--ship]</span>
        </p>
      </Section>

      <Section name="DESCRIPTION">
        {site.description.map((p, i) => (
          <p key={i} style={i ? { marginTop: "0.9rem" } : undefined}>
            {p}
          </p>
        ))}
      </Section>

      <Section name="PROJECTS">
        <ul className="rows">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link className="row" href={`/projects/${p.slug}`}>
                <span className="ref">
                  {p.slug}({p.section})
                </span>
                <StatusMark kind={p.status} />
                <span className="summary">{p.summary}</span>
                <span className="go" aria-hidden="true">
                  -&gt;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section name="ACTIVITY">
        {activity && stats ? (
          <>
            <ActivityHeatmap days={activity.days} />
            <p className="heat-legend">
              <span>
                <strong>{activity.total.toLocaleString("en-US")}</strong> contributions, last year
              </span>
              <span className="muted">
                {stats.currentStreak > 0 && `streak ${stats.currentStreak}d · `}
                {stats.busiest && `busiest ${stats.busiest.date} (${stats.busiest.count})`}
              </span>
            </p>
          </>
        ) : (
          <p className="muted">activity unavailable right now. See github(1).</p>
        )}
      </Section>

      {devices.length > 0 && (
        <Section name="DEVICES">
          <ul className="devices">
            {devices.map((d) => (
              <li key={d.id}>
                <span>{d.name}</span>
                <StatusMark kind="online">online · {d.uptime}</StatusMark>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section name="SEE ALSO">
        <ul className="see-also">
          <li>
            <a href={site.github}>github(1)</a>
          </li>
          {site.email && (
            <li>
              <a href={`mailto:${site.email}`}>mail(1)</a>
              <CopyEmail email={site.email} />
            </li>
          )}
        </ul>
      </Section>
    </ManPage>
  );
}
