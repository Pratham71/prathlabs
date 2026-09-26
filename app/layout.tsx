/// <reference types="react/canary" />
import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { Anton, Kaushan_Script, Martian_Mono, Pixelify_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Boot, bootScript } from "@/components/Boot";
import { Cursor } from "@/components/Cursor";
import { SoundToggle } from "@/components/SoundToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { WorldClock } from "@/components/WorldClock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SideRail } from "@/components/SideRail";
import { RadioPlayer } from "@/components/RadioPlayer";
import { ThemeAccents } from "@/components/ThemeAccents";
import { ThemeIcon } from "@/components/ThemeIcon";
import { ThemeScenery } from "@/components/ThemeScenery";
import { site } from "@/content/site";
import "./globals.css";

// Route changes update this boundary; Link transitionTypes pick the slide direction.
// Untyped updates (browser back, state changes) don't animate.
const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

const mono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-mono",
});

// Display faces for the game themes only. preload off: a browser fetches one only when a game theme
// actually renders text in it, so the default theme pays nothing.
const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap", preload: false, variable: "--font-ls" });
const kaushan = Kaushan_Script({ weight: "400", subsets: ["latin"], display: "swap", preload: false, variable: "--font-vice" });
const pixel = Pixelify_Sans({ weight: ["500", "700"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-block" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.whatis}`, template: `%s — ${site.name}` },
  description: site.description[0],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.name, url: "/" },
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  other: { copyright: `© ${new Date().getFullYear()} ${site.name}. All rights reserved.` },
};

export const viewport: Viewport = { themeColor: "#0a0d10", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${anton.variable} ${kaushan.variable} ${pixel.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Boot />
        <ViewTransition update={SLIDE} default="none">
          {children}
        </ViewTransition>
        <WorldClock />
        <SideRail />
        <RadioPlayer />
        <ThemeAccents />
        <ThemeIcon />
        <ThemeScenery />
        <div className="dock">
          <CommandPalette />
          <ThemeToggle />
          <SoundToggle />
        </div>
        <Cursor />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
