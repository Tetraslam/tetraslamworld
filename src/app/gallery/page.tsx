"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import Masonry from "react-masonry-css";
import { api } from "../../../convex/_generated/api";

const isGif = (url: string) => url.toLowerCase().includes(".gif");

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
								className="mb-4 group relative overflow-hidden rounded-lg border border-border hover:border-rose/50 transition-all cursor-pointer block w-full bg-surface"
							>
								<Image
									src={image.imageUrl}
									alt={image.caption || "Gallery image"}
									width={400}
									height={300}
									className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
									sizes="(max-width: 500px) 100vw, (max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
									unoptimized={isGif(image.imageUrl)}
									placeholder={isGif(image.imageUrl) ? "empty" : "blur"}
									blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQMEAQUAAAAAAAAAAAAAAQIDBAAFBhEhEiIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAQADAQEAAAAAAAAAAAAAAAEAAhEhA//aAAwDAQACEQMRAD8AyTG8guNjvEW5Q3AttJ3zjpChpQ4I+g6pMnymXyM/Xp3kl6YkqkOrUoqWtRJJJJJJJJPJJNKUq7V+CJE9J//Z"
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
					className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl z-10"
					>
						x
					</button>
					<div 
						className="relative max-w-full max-h-[90vh] w-[90vw] h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<Image
						src={lightbox}
						alt="Full size"
							fill
							className="object-contain"
							sizes="90vw"
							unoptimized={isGif(lightbox)}
							priority
						/>
					</div>
				</div>
			)}
		</div>
	);
}
