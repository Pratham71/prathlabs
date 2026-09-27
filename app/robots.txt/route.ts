import { site } from "@/content/site";

export const dynamic = "force-static";

// A route, not app/robots.ts: the metadata version can't carry the comment for humans.
export function GET() {
  const body = ["# humans: press : on the site and type hesoyam", "User-Agent: *", "Allow: /", "Disallow: /api/", "Disallow: /admin", "", `Sitemap: ${site.url}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
