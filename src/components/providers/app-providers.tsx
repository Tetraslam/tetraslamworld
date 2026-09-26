"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { ConvexClientProvider } from "./convex-provider";

function ThemedAuth({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
      meta.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#171e20" : "#ffffff",
      );
  }, [resolvedTheme]);
  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "var(--rose-deep)",
          colorBackground: "var(--background)",
          colorInputBackground: "var(--surface)",
          colorInputText: "var(--foreground)",
          colorText: "var(--foreground)",
          colorTextSecondary: "var(--muted-foreground)",
          borderRadius: "0.3rem",
        },
        elements: {
          card: "bg-background border border-border",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-surface border border-border",
          formButtonPrimary: "bg-primary text-primary-foreground",
          footerActionLink: "text-rose-deep",
        },
      }}
    >
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="tetraslam-theme"
      disableTransitionOnChange
    >
      <ThemedAuth>{children}</ThemedAuth>
    </ThemeProvider>
  );
}
