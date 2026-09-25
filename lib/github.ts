export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Contributions = { total: number; days: Day[] };

const LEVELS: Record<string, Day["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

type RawDay = { date: string; contributionCount: number; contributionLevel: string };

export function parseCalendar(body: unknown): Contributions {
  const cal = (body as {
    data?: { user?: { contributionsCollection?: { contributionCalendar?: {
      totalContributions: number; weeks: { contributionDays: RawDay[] }[];
    } } } };
  }).data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error("GitHub response has no contribution calendar");
  const days = cal.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
  );
  return { total: cal.totalContributions, days };
}

export function activityStats(days: Day[]) {
  let busiest: Day | null = null;
  for (const d of days) if (d.count > 0 && (!busiest || d.count > busiest.count)) busiest = d;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--; // today isn't over yet
  let currentStreak = 0;
  while (i >= 0 && days[i].count > 0) {
    currentStreak++;
    i--;
  }
  return { busiest, currentStreak };
}

// Returns null on any failure so the page can say "unavailable" instead of showing fake data.
export async function getContributions(
  login: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Contributions | null> {
  if (!token) return null;
  try {
    const res = await fetchImpl("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
      cache: "no-store", // caching happens after a successful parse (lib/activity.ts), never on error bodies
    });
    if (!res.ok) return null;
    return parseCalendar(await res.json());
  } catch {
    return null;
  }
}
