"use client";

import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";

type SortOrder = "newest" | "oldest" | "alpha";
type PinnedFilter = "all" | "pinned" | "unpinned";

export default function LinksPage() {
	const links = useQuery(api.links.list);
	const [search, setSearch] = useState("");
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [pinnedFilter, setPinnedFilter] = useState<PinnedFilter>("all");
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

	// Extract unique tags from all links
	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		links?.forEach((link) => {
			if (link.tags) {
				for (const tag of link.tags) {
					tagSet.add(tag);
				}
			}
		});
		return Array.from(tagSet).sort();
	}, [links]);

	// Filter and sort links
	const filteredLinks = useMemo(() => {
		if (!links) return [];

		const result = links.filter((link) => {
			// Text search
			const matchesSearch =
				!search ||
				link.title.toLowerCase().includes(search.toLowerCase()) ||
				link.url.toLowerCase().includes(search.toLowerCase()) ||
				link.content?.toLowerCase().includes(search.toLowerCase()) ||
				link.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

			// Tag filter
			const matchesTag = !tagFilter || link.tags?.includes(tagFilter);

			// Pinned filter
			const matchesPinned =
				pinnedFilter === "all" ||
				(pinnedFilter === "pinned" && link.pinned) ||
				(pinnedFilter === "unpinned" && !link.pinned);

			return matchesSearch && matchesTag && matchesPinned;
		});

		// Sort
		result.sort((a, b) => {
			if (sortOrder === "alpha") {
				return a.title.localeCompare(b.title);
			}
			const dateA = a.createdAt;
			const dateB = b.createdAt;
			return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
		});

		return result;
	}, [links, search, tagFilter, pinnedFilter, sortOrder]);

	const pinned = filteredLinks.filter((l) => l.pinned);
	const unpinned = filteredLinks.filter((l) => !l.pinned);

	const hasActiveFilters =
		search || tagFilter || pinnedFilter !== "all" || sortOrder !== "newest";

	const clearAllFilters = () => {
		setSearch("");
		setTagFilter(null);
		setPinnedFilter("all");
		setSortOrder("newest");
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-6 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">links</h1>
					<p className="text-muted-foreground mt-1">
						bookmarks, resources, and interesting finds
					</p>
				</div>

				{/* Search and filters */}
				<div className="space-y-3">
					<div className="relative">
						<input
							type="text"
							placeholder="search links..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground transition-colors"
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								&times;
							</button>
						)}
					</div>

					{/* Filter row */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Tag filter */}
						{allTags.length > 0 && (
							<>
								<div className="flex items-center gap-1">
									<span className="text-xs text-muted-foreground">tag:</span>
									<div className="flex flex-wrap gap-1">
										<button
											onClick={() => setTagFilter(null)}
											className={`px-2 py-1 text-xs rounded transition-colors ${
												tagFilter === null
													? "bg-rose/20 text-rose border border-rose/50"
													: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
											}`}
										>
											all
										</button>
										{allTags.slice(0, 5).map((tag) => (
											<button
												key={tag}
												onClick={() => setTagFilter(tag)}
												className={`px-2 py-1 text-xs rounded transition-colors ${
													tagFilter === tag
														? "bg-rose/20 text-rose border border-rose/50"
														: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
												}`}
											>
												{tag}
											</button>
										))}
										{allTags.length > 5 && (
											<select
												value={tagFilter || ""}
												onChange={(e) =>
													setTagFilter(e.target.value || null)
												}
												className="px-2 py-1 text-xs rounded bg-surface border border-border text-muted-foreground focus:outline-none focus:border-rose/30"
											>
												<option value="">more...</option>
												{allTags.slice(5).map((tag) => (
													<option key={tag} value={tag}>
														{tag}
													</option>
												))}
											</select>
										)}
									</div>
								</div>

								<span className="text-border">|</span>
							</>
						)}

						{/* Pinned filter */}
						<div className="flex items-center gap-1">
							<span className="text-xs text-muted-foreground">show:</span>
							<div className="flex gap-1">
								{(["all", "pinned", "unpinned"] as const).map((option) => (
									<button
										key={option}
										onClick={() => setPinnedFilter(option)}
										className={`px-2 py-1 text-xs rounded transition-colors ${
											pinnedFilter === option
												? "bg-rose/20 text-rose border border-rose/50"
												: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
										}`}
									>
										{option}
									</button>
								))}
							</div>
						</div>

						<span className="text-border">|</span>

						{/* Sort order */}
						<div className="flex items-center gap-1">
							<span className="text-xs text-muted-foreground">sort:</span>
							<div className="flex gap-1">
								{(
									[
										["newest", "newest"],
										["oldest", "oldest"],
										["alpha", "a-z"],
									] as const
								).map(([value, label]) => (
									<button
										key={value}
										onClick={() => setSortOrder(value)}
										className={`px-2 py-1 text-xs rounded transition-colors ${
											sortOrder === value
												? "bg-rose/20 text-rose border border-rose/50"
												: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						{/* Clear all filters */}
						{hasActiveFilters && (
							<>
								<span className="text-border">|</span>
								<button
									onClick={clearAllFilters}
									className="px-2 py-1 text-xs text-muted-foreground hover:text-rose transition-colors"
								>
									clear all
								</button>
							</>
						)}
					</div>

					{/* Results count */}
					{links && (
						<div className="text-xs text-muted-foreground">
							{filteredLinks.length} link
							{filteredLinks.length !== 1 ? "s" : ""}
							{hasActiveFilters && " found"}
						</div>
					)}
				</div>

				{!links ? (
					<div className="text-muted-foreground py-8 text-center">
						<div className="inline-block animate-pulse-subtle">loading...</div>
					</div>
				) : filteredLinks.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						{hasActiveFilters ? "no links match your filters" : "no links saved yet"}
					</div>
				) : pinnedFilter === "all" ? (
					// Group by pinned/unpinned when showing all
					<div className="space-y-8">
						{pinned.length > 0 && (
							<section>
								<h2 className="text-sm font-medium text-rose mb-3 uppercase tracking-wider flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-rose" />
									pinned
								</h2>
								<div className="space-y-2">
									{pinned.map((link, index) => (
										<LinkCard
											key={link._id}
											link={link}
											delay={index * 30}
											isPinned
										/>
									))}
								</div>
							</section>
						)}

						{unpinned.length > 0 && (
							<section>
								{pinned.length > 0 && (
									<h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
										all links
									</h2>
								)}
								<div className="space-y-2">
									{unpinned.map((link, index) => (
										<LinkCard
											key={link._id}
											link={link}
											delay={(pinned?.length || 0) * 30 + index * 30}
										/>
									))}
								</div>
							</section>
						)}
					</div>
				) : (
					// Flat list when filtering by pinned/unpinned
					<div className="space-y-2">
						{filteredLinks.map((link, index) => (
							<LinkCard
								key={link._id}
								link={link}
								delay={index * 30}
								isPinned={link.pinned}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function LinkCard({
	link,
	delay = 0,
	isPinned = false,
}: {
	link: {
		_id: string;
		title: string;
		url: string;
		content?: string;
		tags?: string[];
		pinned?: boolean;
	};
	delay?: number;
	isPinned?: boolean;
}) {
	let domain = "";
	try {
		domain = new URL(link.url).hostname.replace("www.", "");
	} catch {
		domain = link.url;
	}

	return (
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			className={`block p-4 bg-surface border rounded-lg hover-lift transition-all group ${
				isPinned ? "border-rose/30" : "border-border hover:border-rose/50"
			}`}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-rose group-hover:text-rose-deep transition-colors truncate">
						{link.title}
					</h3>
					<p className="text-xs text-muted-foreground">{domain}</p>
					{link.content && (
						<p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
							{link.content}
						</p>
					)}
					{link.tags && link.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-2">
							{link.tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>
				<span className="text-muted-foreground group-hover:text-rose group-hover:translate-x-1 transition-all text-lg">
					&rarr;
				</span>
			</div>
		</a>
	);
}
