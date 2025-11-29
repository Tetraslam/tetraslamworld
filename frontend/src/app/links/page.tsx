"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export default function LinksPage() {
	const links = useQuery(api.links.list);
	const [search, setSearch] = useState("");

	const filtered = links?.filter(
		(link) =>
			link.title.toLowerCase().includes(search.toLowerCase()) ||
			link.url.toLowerCase().includes(search.toLowerCase()) ||
			link.content?.toLowerCase().includes(search.toLowerCase()) ||
			link.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
	);

	const pinned = filtered?.filter((l) => l.pinned);
	const unpinned = filtered?.filter((l) => !l.pinned);

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold">links</h1>
					<p className="text-muted-foreground mt-1">
						bookmarks, resources, and interesting finds
					</p>
				</div>

				<input
					type="text"
					placeholder="search links..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-2 bg-surface border border-border rounded focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground"
				/>

				{!links ? (
					<div className="text-muted-foreground py-8 text-center">
						loading...
					</div>
				) : filtered?.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						{search ? "no links found" : "no links saved yet"}
					</div>
				) : (
					<div className="space-y-6">
						{pinned && pinned.length > 0 && (
							<section>
								<h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
									pinned
								</h2>
								<div className="space-y-2">
									{pinned.map((link) => (
										<LinkCard key={link._id} link={link} />
									))}
								</div>
							</section>
						)}

						{unpinned && unpinned.length > 0 && (
							<section>
								{pinned && pinned.length > 0 && (
									<h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
										all links
									</h2>
								)}
								<div className="space-y-2">
									{unpinned
										.sort((a, b) => b.createdAt - a.createdAt)
										.map((link) => (
											<LinkCard key={link._id} link={link} />
										))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function LinkCard({
	link,
}: {
	link: {
		_id: string;
		title: string;
		url: string;
		content?: string;
		tags?: string[];
		pinned?: boolean;
	};
}) {
	const domain = new URL(link.url).hostname.replace("www.", "");

	return (
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			className="block p-3 bg-surface border border-border rounded hover:border-rose/50 transition-colors"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-rose truncate">{link.title}</h3>
					<p className="text-xs text-muted-foreground">{domain}</p>
					{link.content && (
						<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
							{link.content}
						</p>
					)}
					{link.tags && link.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{link.tags.map((tag) => (
								<span
									key={tag}
									className="px-1.5 py-0.5 text-xs bg-background rounded border border-border"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>
				<span className="text-muted-foreground text-lg">&rarr;</span>
			</div>
		</a>
	);
}
