"use client";

import { useQuery } from "convex/react";
import Masonry from "react-masonry-css";
import { Markdown } from "@/components/markdown";
import { api } from "../../../convex/_generated/api";

export default function FriendsPage() {
	const friends = useQuery(api.friends.list);

	const sortedFriends = friends
		? [...friends].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: [];

	const breakpointColumns = {
		default: 2,
		640: 1,
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				{/* Header + intro */}
				<div className="space-y-4">
					<div>
						<h1 className="text-3xl font-bold">friends</h1>
						<p className="text-muted-foreground mt-1">people i think are cool</p>
					</div>
					
					{/* Intro section */}
					<div className="p-5 bg-surface/50 border border-border/50 rounded-lg">
						<p className="text-sm text-muted-foreground leading-relaxed">
							the people who've shaped how i think, inspired me to build things, 
							or just made life more interesting.
						</p>
					</div>
				</div>

				{!friends ? (
					<div className="text-muted-foreground py-8 text-center">
						<div className="inline-block animate-pulse-subtle">loading...</div>
					</div>
				) : friends.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						no friends added yet
					</div>
				) : (
					<Masonry
						breakpointCols={breakpointColumns}
						className="flex -ml-4 w-auto"
						columnClassName="pl-4 bg-clip-padding"
					>
						{sortedFriends.map((friend, index) => (
							<div
								key={friend._id}
								className="mb-4 p-5 bg-surface border border-border rounded-lg hover:border-rose/30 transition-all hover-lift group"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<div className="flex items-start gap-4">
									{friend.imageUrl ? (
										// biome-ignore lint: dynamic user image
										<img
											src={friend.imageUrl}
											alt={friend.name}
											className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-rose/50 transition-colors shrink-0"
										/>
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
