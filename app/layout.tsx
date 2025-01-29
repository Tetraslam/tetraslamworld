import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { CozyModeProvider } from "@/lib/cozy-mode";
import { CozyToggle } from "@/components/ui/cozy-toggle";

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
        </CozyModeProvider>
      </body>
    </html>
  );
}
