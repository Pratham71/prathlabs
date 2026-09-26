// Same-origin copy of a Spotify cover so the canvas can read its pixels to dither it.
// Only Spotify's image CDN, so this can't be used as an open proxy.
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  if (!/^https:\/\/i\.scdn\.co\/image\/[a-f0-9]+$/.test(u)) return new Response(null, { status: 400 });
  const res = await fetch(u);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  // raster only: an SVG served from our origin could run script
  if (!res.ok || !["image/jpeg", "image/png", "image/webp"].includes(type)) return new Response(null, { status: 502 });
  return new Response(res.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
