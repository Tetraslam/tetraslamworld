"use client";

import { SignInButton, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { isAdminUser } from "@/lib/admin";

const pages = [
  ["/admin", "overview"],
  ["/admin/homepage", "homepage"],
  ["/admin/work", "work"],
  ["/admin/friends", "friends"],
  ["/admin/media", "media"],
  ["/admin/links", "links"],
  ["/admin/taste", "taste"],
  ["/admin/link-suggestions", "suggestions"],
  ["/admin/travel", "travel"],
  ["/admin/gallery", "gallery"],
  ["/admin/emails", "emails"],
  ["/admin/wet-mode", "wet mode"],
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [accountError, setAccountError] = useState("");
  if (!isLoaded)
    return (
      <div className="admin-content">
        <h1 className="text-2xl">admin</h1>
        <output className="text-muted-foreground">
          checking your account…
        </output>
      </div>
    );
  if (!user)
    return (
      <div className="admin-content max-w-xl mx-auto py-16">
        <h1 className="text-3xl mb-6">admin</h1>
        <SignInButton mode="modal" forceRedirectUrl={pathname}>
          <button type="button" className="text-action">
            sign in to continue
          </button>
        </SignInButton>
      </div>
    );
  if (!isAdminUser(user.id))
    return (
      <div className="admin-content max-w-xl mx-auto py-16">
        <h1 className="text-2xl mb-4">administrator account required</h1>
        <p className="text-muted-foreground mb-5">
          this account doesn’t have access to the editor.
        </p>
        <button
          type="button"
          className="text-action"
          onClick={async () => {
            try {
              await signOut({ redirectUrl: "/admin" });
            } catch {
              setAccountError("couldn’t sign out. please try again.");
            }
          }}
        >
          sign out and switch account
        </button>
        {accountError && (
          <p role="alert" className="text-destructive mt-4">
            {accountError}
          </p>
        )}
      </div>
    );
  return (
    <div className="admin-layout">
      <aside className="admin-navigation">
        <nav aria-label="Admin navigation">
          {pages.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(`${href}/`))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
