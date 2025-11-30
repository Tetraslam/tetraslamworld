"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import Masonry from "react-masonry-css";
import { api } from "../../../convex/_generated/api";

export default function GalleryPage() {
	const images = useQuery(api.gallery.list);
	const [lightbox, setLightbox] = useState<string | null>(null);

	const sortedImages = images
		? [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: [];

	const breakpointColumns = {
		default: 4,
		1100: 3,
		700: 2,
		500: 1,
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">gallery</h1>
					<p className="text-muted-foreground mt-1">
						random snapshots and visual ephemera
					</p>
				</div>

				{!images ? (
					<div className="text-muted-foreground py-8 text-center">
						<div className="inline-block animate-pulse-subtle">loading...</div>
					</div>
				) : sortedImages.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						no images yet
					</div>
				) : (
					<Masonry
						breakpointCols={breakpointColumns}
						className="flex -ml-4 w-auto"
						columnClassName="pl-4 bg-clip-padding"
					>
						{sortedImages.map((image) => (
							<button
								key={image._id}
								type="button"
								onClick={() => setLightbox(image.imageUrl)}
								className="mb-4 group relative overflow-hidden rounded-lg border border-border hover:border-rose/50 transition-all cursor-pointer block w-full"
							>
								{/* biome-ignore lint: gallery images are dynamic */}
								<img
									src={image.imageUrl}
									alt={image.caption || "Gallery image"}
									className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
									loading="lazy"
								/>
								{image.caption && (
									<div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end p-3">
										<p className="text-sm text-foreground">{image.caption}</p>
									</div>
								)}
							</button>
						))}
					</Masonry>
				)}
			</div>

			{/* Lightbox */}
			{lightbox && (
				<div
					className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
					onClick={() => setLightbox(null)}
					onKeyDown={(e) => e.key === "Escape" && setLightbox(null)}
					role="dialog"
					aria-modal="true"
				>
					<button
						type="button"
						onClick={() => setLightbox(null)}
						className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
					>
						x
					</button>
					{/* biome-ignore lint: image in lightbox */}
					<img
						src={lightbox}
						alt="Full size"
						className="max-w-full max-h-[90vh] object-contain rounded-lg"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</div>
	);
}
