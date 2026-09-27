import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const dev = process.env.NODE_ENV !== "production";

// Content Security Policy: scripts, audio, uploads and frames only from here and the few services the
// site uses (Vercel Analytics, the Blob store, the Vercel preview toolbar). Inline scripts stay allowed:
// the boot/theme script must run before paint and pages are static, so there's no per-request nonce.
// ponytail: 'unsafe-inline' scripts; switch to nonces if the site ever renders user-supplied HTML.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://w.soundcloud.com${dev ? " 'unsafe-eval'" : ""}`, // w.soundcloud.com: the radio's Widget API
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  "font-src 'self' data: https://vercel.live https://assets.vercel.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-src https://vercel.live https://w.soundcloud.com", // the radio's SoundCloud player
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  // CSP above, no framing (clickjacking on /admin), no MIME sniffing, no full URLs leaked to other sites.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default createMDX({})(nextConfig);
