import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { CozyModeProvider } from "@/lib/cozy-mode";
import { CozyToggle } from "@/components/ui/cozy-toggle";
import { Analytics } from '@vercel/analytics/react';
import NowPlayingWrapper from '@/components/ui/now-playing-wrapper';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shresht Bhowmick",
  description: "I build robots, turing machines, ML models, fantasy worlds, and other cool stuff!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pixel-bg min-h-screen`}>
        <CozyModeProvider>
          <NavigationMenu />
          <div className="pt-16">
            {children}
          </div>
          <CozyToggle />
          <NowPlayingWrapper />
          <Analytics />
        </CozyModeProvider>
        <Script
          src="//instant.page/5.2.0"
          type="module"
          integrity="sha384-jnZyxPjiipYXnSU0ygqeac2q7CVYMbh84q0uHVRRxEtvFPiQYbXWUorga2aqZJ0z"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
