"use client";

import { usePathname } from "next/navigation";
import { CommandMenu } from "./command-menu";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin"))
    return (
      <div className="admin-theme">
        <SiteHeader />
        <main className="pt-12 min-h-screen">{children}</main>
      </div>
    );
  return (
    <div className="public-site">
      <SiteHeader />
      <main id="content" className="site-content">
        {children}
      </main>
      <SiteFooter />
      <CommandMenu />
    </div>
  );
}
