"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sitewide footer. Grounds every page (they used to just end) and puts the
 * site's agent-friendliness on the surface instead of hiding it in a
 * display:none div.
 */
export function SiteFooter() {
  const pathname = usePathname();

  // Travel is a full-viewport map; admin is a CMS. No footer there.
  if (pathname === "/travel" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-sm">
        <div className="space-y-1">
          <p className="text-rose font-semibold">
            <span className="text-rose/50 select-none" aria-hidden="true">
              ▲{" "}
            </span>
            tetraslam's world
          </p>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} shresht bhowmick
          </p>
        </div>
        <div className="space-y-1.5 sm:text-right">
          <p className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end text-muted-foreground">
            <a
              href="https://x.com/tetraslam"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose"
            >
              twitter
            </a>
            <a
              href="https://github.com/tetraslam"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose"
            >
              github
            </a>
            <a
              href="https://blog.tetraslam.world/rss"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose"
            >
              rss
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose"
            >
              resume
            </a>
            <Link href="/sitemap.xml" className="hover:text-rose">
              sitemap
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/60">
            agents: append <code className="text-rose/70">.md</code> to any page
            url ·{" "}
            <a
              href="/llms.txt"
              className="text-muted-foreground/80 hover:text-rose underline underline-offset-2"
            >
              llms.txt
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
