"use client";

import { usePathname } from "next/navigation";
import { CommandMenu } from "./command-menu";
import { PageBackground } from "./page-background";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/terrace") return <main>{children}</main>;
  return (
    <>
      <PageBackground />
      <SiteHeader />
      <main className="pt-12 min-h-screen">{children}</main>
      <SiteFooter />
      <CommandMenu />
    </>
  );
}
