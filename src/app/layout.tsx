import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./paper.css";
import "./refinements.css";
import "./themes.css";
import "./taste.css";
import "./writing.css";
import "./motion.css";
import "./almanac.css";

const iosevka = localFont({
  src: [
    {
      path: "../fonts/iosevka-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/iosevka-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/iosevka-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/iosevka-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-iosevka",
  display: "swap",
  preload: false,
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

import { Analytics } from "@vercel/analytics/next";
import { AgentHint } from "@/components/agent-hint";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteFrame } from "@/components/site-frame";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#161e22" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "tetraslam's world",
    template: "%s | tetraslam",
  },
  description:
    "building cool stuff :D / mts @ stealth neolab. prev natural.co, mit media lab.",
  keywords: [
    "shresht bhowmick",
    "tetraslam",
    "engineer",
    "robotics",
    "ai",
    "portfolio",
  ],
  authors: [{ name: "Shresht Bhowmick", url: "https://tetraslam.world" }],
  creator: "Shresht Bhowmick",
  metadataBase: new URL("https://tetraslam.world"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tetraslam.world",
    siteName: "tetraslam's world",
    title: "tetraslam's world",
    description:
      "building cool stuff :D / mts @ stealth neolab. prev natural.co, mit media lab.",
    images: [
      {
        url: "/social.png",
        width: 1200,
        height: 630,
        alt: "tetraslam's world",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tetraslam's world",
    description:
      "building cool stuff :D / mts @ stealth neolab. prev natural.co, mit media lab.",
    creator: "@tetraslam",
    images: ["/social.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "llms.txt": "https://tetraslam.world/llms.txt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${iosevka.variable} ${newsreader.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="LLM-friendly site directory"
        />
      </head>
      <body className="antialiased">
        <AgentHint />
        <AppProviders>
          <SiteFrame>{children}</SiteFrame>
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
