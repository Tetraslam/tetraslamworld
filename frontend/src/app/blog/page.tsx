"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface BlogPost {
	id: string;
	slug: string;
	title: string;
	link: string;
	published: string;
	summary?: string;
}

type SortOrder = "newest" | "oldest";

export default function BlogPage() {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [yearFilter, setYearFilter] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

	useEffect(() => {
		async function fetchPosts() {
			try {
				const res = await fetch("/api/blog");
				const data = await res.json();
				setPosts(data.posts || []);
			} catch (err) {
				console.error("Failed to fetch posts:", err);
			} finally {
				setLoading(false);
			}
		}
		fetchPosts();
	}, []);

	// Extract unique years from posts
	const years = useMemo(() => {
		const yearSet = new Set<string>();
		posts.forEach((post) => {
			const year = new Date(post.published).getFullYear().toString();
			yearSet.add(year);
		});
		return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
	}, [posts]);

	// Filter and sort posts
	const filteredPosts = useMemo(() => {
		const result = posts.filter((post) => {
			// Text search
			const matchesSearch =
				!search ||
				post.title.toLowerCase().includes(search.toLowerCase()) ||
				post.summary?.toLowerCase().includes(search.toLowerCase());

			// Year filter
			const matchesYear =
				!yearFilter ||
				new Date(post.published).getFullYear().toString() === yearFilter;

			return matchesSearch && matchesYear;
		});

		// Sort
		result.sort((a, b) => {
			const dateA = new Date(a.published).getTime();
			const dateB = new Date(b.published).getTime();
			return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
		});

		return result;
	}, [posts, search, yearFilter, sortOrder]);

	const activeFilters = [
		yearFilter,
		sortOrder !== "newest" ? sortOrder : null,
	].filter(Boolean).length;

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="space-y-6 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">blog</h1>
					<p className="text-muted-foreground mt-1">
						thoughts, notes, and ramblings
					</p>
				</div>

				{/* Search and filters */}
				<div className="space-y-3">
					<div className="relative">
						<input
							type="text"
							placeholder="search posts..."
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
						{/* Year filter */}
						<div className="flex items-center gap-1">
							<span className="text-xs text-muted-foreground">year:</span>
							<div className="flex gap-1">
								<button
									onClick={() => setYearFilter(null)}
									className={`px-2 py-1 text-xs rounded transition-colors ${
										yearFilter === null
											? "bg-rose/20 text-rose border border-rose/50"
											: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
									}`}
								>
									all
								</button>
								{years.map((year) => (
									<button
										key={year}
										onClick={() => setYearFilter(year)}
										className={`px-2 py-1 text-xs rounded transition-colors ${
											yearFilter === year
												? "bg-rose/20 text-rose border border-rose/50"
												: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
										}`}
									>
										{year}
									</button>
								))}
							</div>
						</div>

						<span className="text-border">|</span>

						{/* Sort order */}
						<div className="flex items-center gap-1">
							<span className="text-xs text-muted-foreground">sort:</span>
							<div className="flex gap-1">
								<button
									onClick={() => setSortOrder("newest")}
									className={`px-2 py-1 text-xs rounded transition-colors ${
										sortOrder === "newest"
											? "bg-rose/20 text-rose border border-rose/50"
											: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
									}`}
								>
									newest
								</button>
								<button
									onClick={() => setSortOrder("oldest")}
									className={`px-2 py-1 text-xs rounded transition-colors ${
										sortOrder === "oldest"
											? "bg-rose/20 text-rose border border-rose/50"
											: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
									}`}
								>
									oldest
								</button>
							</div>
						</div>

						{/* Clear all filters */}
						{(search || yearFilter || sortOrder !== "newest") && (
							<>
								<span className="text-border">|</span>
								<button
									onClick={() => {
										setSearch("");
										setYearFilter(null);
										setSortOrder("newest");
									}}
									className="px-2 py-1 text-xs text-muted-foreground hover:text-rose transition-colors"
								>
									clear all
								</button>
							</>
						)}
					</div>

					{/* Results count */}
					{!loading && (
						<div className="text-xs text-muted-foreground">
							{filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
							{(search || yearFilter) && " found"}
						</div>
					)}
				</div>

				{loading ? (
					<div className="text-muted-foreground py-8 text-center">
						<div className="inline-block animate-pulse-subtle">loading...</div>
					</div>
				) : filteredPosts.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						{search || yearFilter
							? "no posts match your filters"
							: "no posts yet"}
					</div>
				) : (
					<div className="space-y-3">
					{filteredPosts.map((post, index) => (
						<Link
							key={post.id}
							href={`/blog/${post.slug}`}
							className="block p-4 bg-surface border border-border rounded-lg hover:border-rose/50 transition-all hover-lift group"
							style={{ animationDelay: `${index * 30}ms` }}
						>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<h2 className="text-lg font-medium text-rose group-hover:text-rose-deep transition-colors">
											{post.title}
										</h2>
										{post.summary && (
											<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
												{post.summary}
											</p>
										)}
									</div>
									<time className="text-xs text-muted-foreground whitespace-nowrap">
										{new Date(post.published).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</time>
								</div>
							</Link>
						))}
					</div>
				)}

				<p className="text-xs text-muted-foreground text-center pt-4">
					posts pulled from{" "}
					<a
						href="https://blog.tetraslam.world"
						target="_blank"
						rel="noopener noreferrer"
						className="text-rose-deep hover:text-rose"
					>
						blog.tetraslam.world
					</a>
				</p>
			</div>
		</div>
	);
}
