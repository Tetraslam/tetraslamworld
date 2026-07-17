"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { EmptyState } from "@/components/empty-state";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { BLUR_DATA_URL, isGif } from "@/lib/media";
import { api } from "../../../convex/_generated/api";


export function FriendsClient({
	preloadedFriends,
}: {
	preloadedFriends: Preloaded<typeof api.friends.list>;
}) {
	const friends = usePreloadedQuery(preloadedFriends);

	const sortedFriends = [...friends].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const breakpointColumns = {
		default: 2,
		640: 1,
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				{/* Header + intro */}
				<div className="space-y-4">
					<PageHeader
						path="/friends"
						title="friends"
						subtitle="people i think are cool"
						count={friends?.length}
						countLabel="people"
					/>

					{/* Intro section */}
					<div className="p-5 bg-surface/50 border border-border/50 rounded-lg">
						<p className="text-sm text-muted-foreground leading-relaxed">
							the people who've shaped how i think, inspired me to build things,
							or just made life more interesting.
						</p>
					</div>
				</div>

				{friends.length === 0 ? (
					<EmptyState message="no friends added yet" />
				) : (
					<Masonry
						breakpointCols={breakpointColumns}
						className="flex -ml-4 w-auto"
						columnClassName="pl-4 bg-clip-padding"
					>
						{sortedFriends.map((friend, index) => (
							<div
								key={friend._id}
								className="mb-4 p-5 tcard tcard-hover group"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<div className="flex items-start gap-4">
									{friend.imageUrl ? (
										<div className="relative w-16 h-16 shrink-0">
											<Image
											src={friend.imageUrl}
											alt={friend.name}
												fill
												className="rounded-full object-cover border-2 border-border group-hover:border-rose/50 transition-colors"
												sizes="64px"
												unoptimized={isGif(friend.imageUrl)}
												placeholder={isGif(friend.imageUrl) ? "empty" : "blur"}
												blurDataURL={BLUR_DATA_URL}
										/>
										</div>
									) : (
										<div className="w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center text-rose text-xl font-bold shrink-0">
											{friend.name.charAt(0).toUpperCase()}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-lg text-rose group-hover:text-rose-deep transition-colors">
											{friend.name}
										</h3>
										{friend.content && (
											<div className="text-sm text-muted-foreground mt-2 leading-relaxed">
												<Markdown content={friend.content} />
											</div>
										)}
										{friend.links && friend.links.length > 0 && (
											<div className="flex flex-wrap gap-2 mt-3">
												{friend.links.map((link, i) => (
													<a
														key={i}
														href={link.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs px-2.5 py-1 bg-background rounded border border-border hover:border-rose/50 text-rose-deep hover:text-rose transition-colors"
													>
														{link.label}
													</a>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</Masonry>
				)}
			</div>
		</div>
	);
}
