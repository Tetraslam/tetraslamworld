"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

const typeLabels: Record<string, string> = {
	project: "projects",
	paper: "papers",
	talk: "talks",
	job: "experience",
	other: "other",
};

const typeOrder = ["job", "project", "paper", "talk", "other"];

export default function WorkPage() {
	const work = useQuery(api.work.list);
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
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold">work</h1>
					<p className="text-muted-foreground mt-1">
						things i've built, written, and done
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

				{!work ? (
					<div className="text-muted-foreground py-8 text-center">
						loading...
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
									<h2 className="text-xl font-semibold text-rose mb-4">
										{typeLabels[type]}
									</h2>
									<div className="space-y-4">
										{grouped?.[type]
											?.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
											.map((item) => (
												<div
													key={item._id}
													className="p-4 bg-surface border border-border rounded"
												>
													<div className="flex items-start justify-between gap-4">
														<div className="flex-1">
															<h3 className="font-medium">{item.title}</h3>
															{item.date && (
																<p className="text-xs text-muted-foreground mt-0.5">
																	{item.date}
																	{item.endDate && ` - ${item.endDate}`}
																</p>
															)}
															{item.content && (
																<p className="text-sm text-muted-foreground mt-2">
																	{item.content}
																</p>
															)}
															{item.tags && item.tags.length > 0 && (
																<div className="flex flex-wrap gap-1 mt-2">
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
																<div className="flex flex-wrap gap-2 mt-3">
																	{item.links.map((link, i) => (
																		<a
																			key={i}
																			href={link.url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-xs text-rose-deep hover:text-rose"
																		>
																			{link.label} &rarr;
																		</a>
																	))}
																</div>
															)}
														</div>
														{item.imageUrl && (
															<img
																src={item.imageUrl}
																alt={item.title}
																className="w-20 h-20 object-cover rounded border border-border"
															/>
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
