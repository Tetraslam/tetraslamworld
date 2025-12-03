"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
	{ href: "/", label: "~" },
	{ href: "/work", label: "work" },
	{ href: "/blog", label: "blog" },
	{ href: "/friends", label: "friends" },
	{ href: "/media", label: "media" },
	{ href: "/links", label: "links" },
	{ href: "/travel", label: "travel" },
	{ href: "/gallery", label: "gallery" },
	{ href: "/pixels", label: "pixels" },
];

export function SiteHeader() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Close mobile menu on route change
	useEffect(() => {
		setMobileMenuOpen(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	// Close mobile menu on escape
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileMenuOpen(false);
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, []);

	return (
		<header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-md">
			<nav className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
				<Link
					href="/"
					className="text-rose font-semibold hover:text-rose-deep transition-colors"
				>
					tetraslam
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:flex items-center gap-4">
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

					{/* Auth */}
					<SignedOut>
						<SignInButton mode="modal">
							<button
								type="button"
								className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:border-rose/50 transition-colors"
							>
								sign in
							</button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-7 h-7",
								},
							}}
						/>
					</SignedIn>
				</div>

				{/* Mobile nav trigger */}
				<div className="flex md:hidden items-center gap-3">
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-7 h-7",
								},
							}}
						/>
					</SignedIn>
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Toggle menu"
					>
						{mobileMenuOpen ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M18 6L6 18" />
								<path d="M6 6l12 12" />
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						)}
					</button>
				</div>
			</nav>

			{/* Mobile menu dropdown */}
			{mobileMenuOpen && (
				<div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md animate-fade-in">
					<ul className="flex flex-col p-4 space-y-1">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`block px-4 py-3 rounded-lg transition-colors ${
											isActive
												? "text-rose bg-rose/10"
												: "text-foreground hover:bg-surface"
										}`}
									>
										{item.label}
									</Link>
								</li>
							);
						})}
						<li className="pt-2 border-t border-border/50">
							<SignedOut>
								<SignInButton mode="modal">
									<button
										type="button"
										className="w-full px-4 py-3 text-left text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors"
									>
										sign in
									</button>
								</SignInButton>
							</SignedOut>
						</li>
					</ul>
				</div>
			)}
		</header>
	);
}
