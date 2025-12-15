"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Comma-separated list of admin Clerk user IDs
const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || "").split(",").filter(Boolean);

const navItems = [
	{ href: "/admin", label: "overview" },
	{ href: "/admin/work", label: "work" },
	{ href: "/admin/friends", label: "friends" },
	{ href: "/admin/media", label: "media" },
	{ href: "/admin/links", label: "links" },
	{ href: "/admin/link-suggestions", label: "suggestions" },
	{ href: "/admin/travel", label: "travel" },
	{ href: "/admin/gallery", label: "gallery" },
	{ href: "/admin/emails", label: "emails" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
	const { user, isLoaded } = useUser();
	const pathname = usePathname();

	if (!isLoaded) {
		return (
			<div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
				<p className="text-muted-foreground">loading...</p>
			</div>
		);
	}

	// Deny if: no user, no admin IDs configured, or user not in admin list
	if (!user || ADMIN_USER_IDS.length === 0 || !ADMIN_USER_IDS.includes(user.id)) {
		return (
			<div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-rose">access denied</h1>
					<p className="text-muted-foreground">
						you don't have permission to access this page.
					</p>
					<Link href="/" className="text-rose-deep hover:text-rose">
						&larr; go home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-3rem)] flex">
			{/* Sidebar */}
			<aside className="w-48 border-r border-border bg-surface/50 p-4">
				<h2 className="text-lg font-semibold text-rose mb-4">admin</h2>
				<nav className="space-y-1">
					{navItems.map((item) => {
						const isActive =
							item.href === "/admin"
								? pathname === "/admin"
								: pathname.startsWith(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`block px-3 py-2 rounded text-sm transition-colors ${
									isActive
										? "bg-rose/10 text-rose"
										: "text-muted-foreground hover:text-foreground hover:bg-surface"
								}`}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex-1 p-6 overflow-auto">{children}</main>
		</div>
	);
}
