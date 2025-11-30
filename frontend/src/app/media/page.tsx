"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { api } from "../../../convex/_generated/api";

const typeLabels: Record<string, string> = {
	anime: "anime",
	book: "books",
	game: "games",
	music: "music",
	movie: "movies",
	show: "shows",
	other: "other",
};

const typeOrder = ["anime", "book", "game", "music", "movie", "show", "other"];

interface MediaItem {
	_id: string;
	type: string;
	title: string;
	content?: string;
	imageUrl?: string;
	tags?: string[];
	links?: { label: string; url: string }[];
}

export default function MediaPage() {
	const media = useQuery(api.media.list);
	const [filter, setFilter] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);

	const grouped = media?.reduce(
		(acc, item) => {
			if (!acc[item.type]) acc[item.type] = [];
			acc[item.type].push(item);
			return acc;
		},
		{} as Record<string, typeof media>,
	);

	// Sort items within each group by order
	if (grouped) {
		for (const type of Object.keys(grouped)) {
			grouped[type]?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		}
	}

	const sortedTypes = typeOrder.filter((t) => grouped?.[t]?.length);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">media</h1>
					<p className="text-muted-foreground mt-1">
						things i've consumed and enjoyed
					</p>
				</div>

				{/* Filter tabs */}
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setFilter(null)}
						className={`px-3 py-1 text-sm rounded border transition-colors ${
							filter === null
								? "border-rose bg-rose/10 text-rose"
								: "border-border text-muted-foreground hover:border-rose/50"
						}`}
					>
						all
					</button>
					{sortedTypes.map((type) => (
						<button
							type="button"
							key={type}
							onClick={() => setFilter(type)}
							className={`px-3 py-1 text-sm rounded border transition-colors ${
								filter === type
									? "border-rose bg-rose/10 text-rose"
									: "border-border text-muted-foreground hover:border-rose/50"
							}`}
						>
							{typeLabels[type]}
						</button>
					))}
				</div>

				{!media ? (
					<div className="text-muted-foreground py-8 text-center">
						loading...
					</div>
				) : media.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						no media added yet
					</div>
				) : (
					<div className="space-y-10">
						{sortedTypes
							.filter((type) => !filter || filter === type)
							.map((type) => {
								const items = grouped?.[type] || [];
								const showAll = filter === type;
								const displayItems = showAll ? items : items.slice(0, 4);
								const hasMore = !showAll && items.length > 4;

								return (
									<section key={type}>
										<h2 className="text-xl font-semibold text-rose mb-4">
											{typeLabels[type]}
										</h2>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
											{displayItems.map((item) => (
												<MediaCard
													key={item._id}
													item={item}
													isExpanded={expanded === item._id}
													onExpand={() =>
														setExpanded(expanded === item._id ? null : item._id)
													}
												/>
											))}
										</div>
										{hasMore && (
											<button
												type="button"
												onClick={() => setFilter(type)}
												className="mt-4 text-sm text-muted-foreground hover:text-rose transition-colors"
											>
												see all {items.length} {typeLabels[type]} &rarr;
											</button>
										)}
									</section>
								);
							})}
					</div>
				)}
			</div>

			{/* Expanded modal */}
			{expanded && (
				<MediaModal
					item={media?.find((m) => m._id === expanded) || null}
					onClose={() => setExpanded(null)}
				/>
			)}
		</div>
	);
}

function MediaCard({
	item,
	onExpand,
}: {
	item: MediaItem;
	isExpanded: boolean;
	onExpand: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onExpand}
			className="group relative bg-surface border border-border rounded overflow-hidden hover:border-rose/50 transition-all hover-lift text-left w-full"
		>
			{item.imageUrl ? (
				<img
					src={item.imageUrl}
					alt={item.title}
					className="w-full aspect-[3/4] object-cover"
				/>
			) : (
				<div className="w-full aspect-[3/4] bg-background flex items-center justify-center text-muted-foreground text-xs">
					no image
				</div>
			)}
			{/* Always visible title at bottom */}
			<div className="p-2 border-t border-border/50 flex items-center justify-between gap-1">
				<h3 className="text-sm font-medium truncate">{item.title}</h3>
				{/* Mobile tap indicator - hidden on desktop where hover works */}
				<span className="md:hidden text-[10px] text-rose/60 shrink-0">tap</span>
			</div>
			{/* Hover overlay with "click to expand" hint - desktop only */}
			<div className="hidden md:flex absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
				<span className="text-xs text-rose">click to view</span>
			</div>
		</button>
	);
}

function MediaModal({
	item,
	onClose,
}: {
	item: MediaItem | null;
	onClose: () => void;
}) {
	if (!item) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-surface border border-border rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto animate-fade-in">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
				>
					&times;
				</button>

				{item.imageUrl && (
					<img
						src={item.imageUrl}
						alt={item.title}
						className="w-full aspect-video object-cover rounded-t-lg"
					/>
				)}

				<div className="p-4 space-y-3">
					<h2 className="text-xl font-bold text-rose">{item.title}</h2>

					<p className="text-xs text-muted-foreground uppercase">
						{typeLabels[item.type] || item.type}
					</p>

					{item.content && (
						<div className="text-sm">
							<Markdown content={item.content} />
						</div>
					)}

					{item.tags && item.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{item.tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-0.5 text-xs bg-background rounded border border-border"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					{item.links && item.links.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-2">
							{item.links.map((link, i) => (
								<a
									key={i}
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-rose-deep hover:text-rose"
								>
									{link.label} &rarr;
								</a>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
