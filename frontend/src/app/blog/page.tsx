"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BlogPost {
	id: string;
	title: string;
	link: string;
	published: string;
	summary?: string;
}

export default function BlogPage() {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

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

	const filteredPosts = posts.filter(
		(post) =>
			post.title.toLowerCase().includes(search.toLowerCase()) ||
			post.summary?.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">blog</h1>
					<p className="text-muted-foreground mt-1">
						thoughts, notes, and ramblings
					</p>
				</div>

				<input
					type="text"
					placeholder="search posts..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-2 bg-surface border border-border rounded focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground"
				/>

				{loading ? (
					<div className="text-muted-foreground py-8 text-center">
						loading...
					</div>
				) : filteredPosts.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						{search ? "no posts found" : "no posts yet"}
					</div>
				) : (
					<div className="space-y-4">
						{filteredPosts.map((post) => (
							<Link
								key={post.id}
								href={`/blog/${encodeURIComponent(post.id)}`}
								className="block p-4 bg-surface border border-border rounded hover:border-rose/50 transition-colors"
							>
								<h2 className="text-lg font-medium text-rose">{post.title}</h2>
								<time className="text-xs text-muted-foreground">
									{new Date(post.published).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</time>
								{post.summary && (
									<p className="text-sm text-muted-foreground mt-2 line-clamp-2">
										{post.summary}
									</p>
								)}
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
