import Link from "next/link";
import { ViewTransition } from "react";
import { ManPage, Section } from "@/components/Man";
import { StatusMark } from "@/components/StatusMark";
import { Devices } from "@/components/Devices";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { CopyEmail } from "@/components/CopyEmail";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { activityStats } from "@/lib/github";
import { getActivity } from "@/lib/activity";
import { getLiveDevices, renderDate } from "@/lib/devices";

export const revalidate = 60;

export default async function Home() {
  const [activity, { devices, renderedAt }] = await Promise.all([getActivity(), getLiveDevices()]);
  const stats = activity ? activityStats(activity.days) : null;

  return (
    <ManPage title={site.manName} section={1} footLeft={site.handle} footMid={renderDate()}>
      <Section name="NAME" plain>
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
              <Link className="row" href={`/projects/${p.slug}`} transitionTypes={["nav-forward"]}>
                <ViewTransition name={`project-${p.slug}`} share="morph">
                  <span className="ref">
                    {p.slug}({p.section})
                  </span>
                </ViewTransition>
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

      <Devices devices={devices} renderedAt={renderedAt} />

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
