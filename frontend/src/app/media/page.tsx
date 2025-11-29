"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
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

export default function MediaPage() {
	const media = useQuery(api.media.list);
	const [filter, setFilter] = useState<string | null>(null);

	const grouped = media?.reduce(
		(acc, item) => {
			if (!acc[item.type]) acc[item.type] = [];
			acc[item.type].push(item);
			return acc;
		},
		{} as Record<string, typeof media>,
	);

	const sortedTypes = typeOrder.filter((t) => grouped?.[t]?.length);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold">media</h1>
					<p className="text-muted-foreground mt-1">
						things i've consumed and enjoyed
					</p>
				</div>

				{/* Filter tabs */}
				<div className="flex flex-wrap gap-2">
					<button
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
							.map((type) => (
								<section key={type}>
									<h2 className="text-xl font-semibold text-rose mb-4">
										{typeLabels[type]}
									</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
										{grouped?.[type]?.map((item) => (
											<div
												key={item._id}
												className="group relative bg-surface border border-border rounded overflow-hidden hover:border-rose/50 transition-colors"
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
												<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
													<h3 className="text-sm font-medium truncate">
														{item.title}
													</h3>
													{item.content && (
														<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
															{item.content}
														</p>
													)}
												</div>
												<div className="p-2 group-hover:hidden">
													<h3 className="text-sm font-medium truncate">
														{item.title}
													</h3>
												</div>
											</div>
										))}
									</div>
								</section>
							))}
					</div>
				)}
			</div>
		</div>
	);
}
