"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/Man";
import { StatusMark } from "@/components/StatusMark";
import { formatUptime, liveDevices, type OnlineDevice } from "@/lib/heartbeat";

// Server already dropped stale beats, but this HTML may be served from cache long after;
// re-check age in the browser so a switched-off machine never reads as online.
export function Devices({ devices, renderedAt }: { devices: OnlineDevice[]; renderedAt: number }) {
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const live = liveDevices(devices, now);
  if (!live.length) return null;
  return (
    <Section name="DEVICES">
      <ul className="devices">
        {live.map((d) => (
          <li key={d.id}>
            <span>{d.name}</span>
            <StatusMark kind="online">online · {formatUptime(d.since, now)}</StatusMark>
          </li>
        ))}
      </ul>
    </Section>
  );
}
