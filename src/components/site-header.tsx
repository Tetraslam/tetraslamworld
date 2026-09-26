"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { IntentLink as Link } from "./intent-link";

const pages = [
  ["/work", "work"],
  ["/blog", "writing"],
  ["/friends", "friends"],
  ["/media", "media"],
  ["/links", "links"],
  ["/taste", "taste"],
  ["/travel", "travel"],
  ["/gallery", "gallery"],
  ["/pixels", "pixels"],
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <a className="skip-link" href="#content">
        skip to content
      </a>
      <Link className="site-wordmark" href="/">
        tetraslam’s world
      </Link>
      <nav aria-label="Main navigation">
        {pages.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={
              pathname === href || pathname.startsWith(`${href}/`)
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      {!pathname.startsWith("/admin") && (
        <button
          type="button"
          className="nav-search"
          aria-label="Search site"
          title="Search (Ctrl/⌘ K)"
          onClick={() => document.dispatchEvent(new CustomEvent("site:search"))}
        >
          search
        </button>
      )}
      {pathname.startsWith("/admin") && (
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button">sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      )}
    </header>
  );
}
