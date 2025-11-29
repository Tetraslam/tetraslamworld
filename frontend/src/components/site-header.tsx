"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "~" },
  { href: "/work", label: "work" },
  { href: "/blog", label: "blog" },
  { href: "/friends", label: "friends" },
  { href: "/media", label: "media" },
  { href: "/links", label: "links" },
  { href: "/travel", label: "travel" },
  { href: "/pixels", label: "pixels" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-rose font-semibold hover:text-rose-deep transition-colors"
        >
          tetraslam
        </Link>

        <ul className="flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-2 py-1 rounded transition-colors ${
                    isActive
                      ? "text-rose bg-rose/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
