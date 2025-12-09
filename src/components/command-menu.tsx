"use client";

import { getCalApi } from "@calcom/embed-react";
import { useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDevice } from "@/hooks/use-device";

const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || "").split(",").filter(Boolean);

interface CommandItem {
	id: string;
	label: string;
	shortcut?: string[];
	action: () => void;
	icon?: string;
	group: string;
}

export function CommandMenu() {
	const [open, setOpen] = useState(false);
	const [calApi, setCalApi] = useState<Awaited<ReturnType<typeof getCalApi>> | null>(null);
	const router = useRouter();
	const { isMobile, isMac } = useDevice();
	const { user } = useUser();
	
	const isAdmin = useMemo(() => {
		return user && ADMIN_USER_IDS.length > 0 && ADMIN_USER_IDS.includes(user.id);
	}, [user]);

	// Initialize Cal.com
	useEffect(() => {
		(async () => {
			const cal = await getCalApi({ namespace: "30min" });
			cal("ui", {
				theme: "dark",
				cssVarsPerTheme: {
					light: { "cal-brand": "#2B262B" },
					dark: { "cal-brand": "#E8A6A6" },
				},
				hideEventTypeDetails: false,
				layout: "month_view",
			});
			setCalApi(() => cal);
		})();
	}, []);

	const openBooking = useCallback(() => {
		track("book_call_click", { source: "cmdk" });
		if (calApi) {
			calApi("modal", {
				calLink: "tetraslam/30min",
				config: { layout: "month_view", theme: "dark" },
			});
		}
		setOpen(false);
	}, [calApi]);

	const navigate = useCallback(
		(path: string) => {
			track("cmdk_action", { action: "navigate", path });
			router.push(path);
			setOpen(false);
		},
		[router],
	);

	const openExternal = useCallback((url: string, label: string) => {
		track("cmdk_action", { action: "external", url, label });
		track("external_link_click", { url, label, source: "cmdk" });
		window.open(url, "_blank");
		setOpen(false);
	}, []);

	const openResume = useCallback(() => {
		track("cmdk_action", { action: "resume" });
		track("resume_download", { source: "cmdk" });
		window.open("/resume.pdf", "_blank");
		setOpen(false);
	}, []);

	const commands: CommandItem[] = [
		// Navigation
		{
			id: "home",
			label: "home",
			shortcut: ["H"],
			action: () => navigate("/"),
			group: "navigation",
			icon: "~",
		},
		{
			id: "work",
			label: "work",
			shortcut: ["W"],
			action: () => navigate("/work"),
			group: "navigation",
			icon: ">",
		},
		{
			id: "blog",
			label: "blog",
			shortcut: ["B"],
			action: () => navigate("/blog"),
			group: "navigation",
			icon: "#",
		},
		{
			id: "friends",
			label: "friends",
			shortcut: ["F"],
			action: () => navigate("/friends"),
			group: "navigation",
			icon: "@",
		},
		{
			id: "media",
			label: "media",
			shortcut: ["M"],
			action: () => navigate("/media"),
			group: "navigation",
			icon: "*",
		},
		{
			id: "links",
			label: "links",
			shortcut: ["L"],
			action: () => navigate("/links"),
			group: "navigation",
			icon: "&",
		},
		{
			id: "travel",
			label: "travel",
			shortcut: ["T"],
			action: () => navigate("/travel"),
			group: "navigation",
			icon: "^",
		},
		{
			id: "pixels",
			label: "pixel board",
			shortcut: ["P"],
			action: () => navigate("/pixels"),
			group: "navigation",
			icon: "%",
		},
		{
			id: "gallery",
			label: "gallery",
			shortcut: ["G"],
			action: () => navigate("/gallery"),
			group: "navigation",
			icon: "[]",
		},

		// External
		{
			id: "twitter",
			label: "twitter",
			action: () => openExternal("https://twitter.com/tetraslam", "twitter"),
			group: "external",
			icon: "x",
		},
		{
			id: "github",
			label: "github",
			action: () => openExternal("https://github.com/tetraslam", "github"),
			group: "external",
			icon: "gh",
		},
		{
			id: "email",
			label: "email",
			action: () => openExternal("mailto:bhowmickshresht@gmail.com", "email"),
			group: "external",
			icon: "@",
		},
		{
			id: "book-call",
			label: "book a call",
			shortcut: ["C"],
			action: openBooking,
			group: "external",
			icon: "cal",
		},

		// Meta
		{
			id: "resume",
			label: "resume",
			shortcut: ["R"],
			action: openResume,
			group: "meta",
			icon: "pdf",
		},
		{
			id: "sitemap",
			label: "sitemap",
			action: () => {
				track("cmdk_action", { action: "sitemap" });
				window.open("/sitemap.xml", "_blank");
				setOpen(false);
			},
			group: "meta",
			icon: "/",
		},
		{
			id: "rss",
			label: "blog rss",
			action: () => openExternal("https://blog.tetraslam.world/rss", "blog_rss"),
			group: "meta",
			icon: "rss",
		},
		// Admin (only visible to admins)
		...(isAdmin ? [{
			id: "admin",
			label: "admin dashboard",
			shortcut: ["A"],
			action: () => navigate("/admin"),
			group: "admin",
			icon: "!",
		}] : []),
	];

	// Toggle with cmd+k / ctrl+k
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((o) => !o);
			}
			// Escape to close
			if (e.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	// Group commands
	const groups = commands.reduce(
		(acc, cmd) => {
			if (!acc[cmd.group]) acc[cmd.group] = [];
			acc[cmd.group].push(cmd);
			return acc;
		},
		{} as Record<string, CommandItem[]>,
	);

	// Hide command menu button on mobile
	if (!open) {
		if (isMobile) return null;
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-4 right-4 px-3 py-1.5 text-xs text-muted-foreground bg-surface border border-border rounded hover:border-rose/50 transition-colors z-50"
			>
				<span className="opacity-60">press</span>{" "}
				<kbd className="text-rose">{isMac ? "cmd" : "ctrl"}+k</kbd>
			</button>
		);
	}

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={() => setOpen(false)}
			/>

			{/* Command palette */}
			<div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
				<Command
					className="bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
					loop
				>
					<Command.Input
						placeholder="where to?"
						className="w-full px-4 py-3 bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none"
						autoFocus
					/>

					<Command.List className="max-h-80 overflow-y-auto p-2">
						<Command.Empty className="px-4 py-8 text-center text-muted-foreground text-sm">
							nothing found.
						</Command.Empty>

						{Object.entries(groups).map(([group, items]) => (
							<Command.Group
								key={group}
								heading={group}
								className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
							>
								{items.map((item) => (
									<Command.Item
										key={item.id}
										value={item.label}
										onSelect={item.action}
										className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-foreground data-[selected=true]:bg-rose/10 data-[selected=true]:text-rose transition-colors"
									>
										{item.icon && (
											<span className="w-6 text-center text-muted-foreground font-bold">
												{item.icon}
											</span>
										)}
										<span className="flex-1">{item.label}</span>
										{item.shortcut && (
											<div className="flex gap-1">
												{item.shortcut.map((key) => (
													<kbd
														key={key}
														className="px-1.5 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
													>
														{key}
													</kbd>
												))}
											</div>
										)}
									</Command.Item>
								))}
							</Command.Group>
						))}
					</Command.List>

					<div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between">
						<span>
							<kbd className="px-1 bg-background rounded border border-border">
								↑↓
							</kbd>{" "}
							navigate
						</span>
						<span>
							<kbd className="px-1 bg-background rounded border border-border">
								↵
							</kbd>{" "}
							select
						</span>
						<span>
							<kbd className="px-1 bg-background rounded border border-border">
								esc
							</kbd>{" "}
							close
						</span>
					</div>
				</Command>
			</div>
		</div>
	);
}
