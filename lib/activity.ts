import { unstable_cache } from "next/cache";
import { getContributions } from "@/lib/github";
import { site } from "@/content/site";

// Only successful parses are cached (a thrown error is never stored), refreshed every 6h.
const cached = unstable_cache(
  async () => {
    const c = await getContributions(site.githubLogin, process.env.GITHUB_TOKEN);
    if (!c) throw new Error("activity unavailable");
    return c;
  },
  ["activity"],
  { revalidate: 21600 },
);

export async function getActivity() {
  try {
    return await cached();
  } catch {
    return null;
  }
}
