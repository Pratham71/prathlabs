import type { Metadata, Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Boot, bootScript } from "@/components/Boot";
import { site } from "@/content/site";
import "./globals.css";

const mono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.whatis}`, template: `%s — ${site.name}` },
  description: site.description[0],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.name, url: "/" },
};

export const viewport: Viewport = { themeColor: "#0a0d10", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Boot />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
