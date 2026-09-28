"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useDevice } from "@/hooks/use-device";
import { IntentLink as Link } from "./intent-link";
import { ShortcutLabel } from "./shortcut-label";
import { ThemeControl } from "./theme-control";

const pages = [
  ["/work", "work", "W"],
  ["/blog", "writing", "R"],
  ["/friends", "friends", "F"],
  ["/media", "media", "M"],
  ["/links", "links", "L"],
  ["/taste", "taste", "S"],
  ["/travel", "travel", "T"],
  ["/gallery", "gallery", "G"],
  ["/pixels", "pixels", "P"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isMac } = useDevice();
  return (
    <header className="site-header">
      <a className="skip-link" href="#content">
        skip to content
      </a>
      <Link className="site-wordmark" href="/">
        tetraslam’s world
      </Link>
      <nav aria-label="Main navigation">
        {pages.map(([href, label, shortcut]) => (
          <Link
            key={href}
            href={href}
            aria-keyshortcuts={shortcut}
            aria-current={
              pathname === href || pathname.startsWith(`${href}/`)
                ? "page"
                : undefined
            }
          >
            <ShortcutLabel label={label} shortcut={shortcut} />
          </Link>
        ))}
      </nav>
      <div className="header-tools">
        <button
          type="button"
          className="nav-search"
          aria-label="Search site"
          aria-keyshortcuts="Control+k Meta+k"
          title="Search (Ctrl/⌘ K)"
          onClick={() => document.dispatchEvent(new CustomEvent("site:search"))}
        >
          search
          <kbd className="search-shortcut">{isMac ? "⌘ K" : "ctrl K"}</kbd>
        </button>
        <ThemeControl />
        {pathname.startsWith("/admin") && (
          <div>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl={pathname}>
                <button type="button">sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        )}
      </div>
    </header>
  );
}
