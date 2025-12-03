"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { api } from "../../../convex/_generated/api";

const isGif = (url: string) => url.toLowerCase().includes(".gif");

const typeLabels: Record<string, string> = {
	project: "projects",
	paper: "papers",
	talk: "talks",
	job: "experience",
	other: "other",
};

const typeOrder = ["job", "project", "paper", "talk", "other"];

export default function WorkPage() {
	const work = useQuery(api.work.list, {});
	const [filter, setFilter] = useState<string | null>(null);

	const grouped = work?.reduce(
		(acc, item) => {
			if (!acc[item.type]) acc[item.type] = [];
			acc[item.type].push(item);
			return acc;
		},
		{} as Record<string, typeof work>,
	);

	const sortedTypes = typeOrder.filter((t) => grouped?.[t]?.length);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold">work</h1>
						<p className="text-muted-foreground mt-1">
							things i've built, written, and done
						</p>
					</div>
					<a
						href="/resume.pdf"
						target="_blank"
						rel="noopener noreferrer"
						className="px-3 py-1.5 text-sm border border-rose/50 bg-rose/10 text-rose rounded-lg hover:bg-rose/20 hover:border-rose transition-all flex items-center gap-1.5 shrink-0"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						resume
					</a>
				</div>

				{/* Filter tabs */}
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setFilter(null)}
						className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
							filter === null
								? "border-rose bg-rose/10 text-rose"
								: "border-border text-muted-foreground hover:border-rose/50 hover:bg-surface"
						}`}
					>
						all
					</button>
					{sortedTypes.map((type) => (
						<button
							key={type}
							onClick={() => setFilter(type)}
							className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
								filter === type
									? "border-rose bg-rose/10 text-rose"
									: "border-border text-muted-foreground hover:border-rose/50 hover:bg-surface"
							}`}
						>
							{typeLabels[type]}
						</button>
					))}
				</div>

				{!work ? (
					<div className="text-muted-foreground py-8 text-center">
						<div className="inline-block animate-pulse-subtle">loading...</div>
					</div>
				) : work.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						no work items yet
					</div>
				) : (
					<div className="space-y-12">
						{sortedTypes
							.filter((type) => !filter || filter === type)
							.map((type) => (
								<section key={type}>
									<h2 className="text-xl font-semibold text-rose mb-4 flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-rose animate-pulse-subtle" />
										{typeLabels[type]}
									</h2>
									<div className="space-y-4">
										{grouped?.[type]
											?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
											.map((item, index) => (
												<div
													key={item._id}
													className="p-4 bg-surface border border-border rounded-lg hover:border-rose/30 transition-all hover-lift group"
													style={{ animationDelay: `${index * 50}ms` }}
												>
													<div className="flex items-start justify-between gap-4">
														<div className="flex-1">
															<h3 className="font-semibold group-hover:text-rose transition-colors">
																{item.title}
															</h3>
															{item.date && (
																<p className="text-xs text-muted-foreground mt-0.5">
																	{item.date}
																	{item.endDate && ` - ${item.endDate}`}
																</p>
															)}
															{item.content && (
																<div className="text-sm text-muted-foreground mt-2">
																	<Markdown content={item.content} />
																</div>
															)}
															{item.tags && item.tags.length > 0 && (
																<div className="flex flex-wrap gap-1.5 mt-3">
																	{item.tags.map((tag) => (
																		<span
																			key={tag}
																			className="px-2 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
																		>
																			{tag}
																		</span>
																	))}
																</div>
															)}
															{item.links && item.links.length > 0 && (
																<div className="flex flex-wrap gap-3 mt-3">
																	{item.links.map((link, i) => (
																		<a
																			key={i}
																			href={link.url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-sm text-rose-deep hover:text-rose transition-colors"
																		>
																			{link.label} &rarr;
																		</a>
																	))}
																</div>
															)}
														</div>
														{item.imageUrl && (
															<div className="relative w-24 h-24 shrink-0">
																<Image
																src={item.imageUrl}
																alt={item.title}
																	fill
																	className="object-cover rounded-lg border border-border group-hover:border-rose/30 transition-colors"
																	sizes="96px"
																	unoptimized={isGif(item.imageUrl)}
																	placeholder={isGif(item.imageUrl) ? "empty" : "blur"}
																	blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQMEAQUAAAAAAAAAAAAAAQIDBAAFBhEhEiIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAQADAQEAAAAAAAAAAAAAAAEAAhEhA//aAAwDAQACEQMRAD8AyTG8guNjvEW5Q3AttJ3zjpChpQ4I+g6pMnymXyM/Xp3kl6YkqkOrUoqWtRJJJJJJJJPJJNKUq7V+CJE9J//Z"
															/>
															</div>
														)}
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
