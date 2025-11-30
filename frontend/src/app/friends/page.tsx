"use client";

import { useQuery } from "convex/react";
import { Markdown } from "@/components/markdown";
import { api } from "../../../convex/_generated/api";

export default function FriendsPage() {
	const friends = useQuery(api.friends.list);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">friends</h1>
					<p className="text-muted-foreground mt-1">people i think are cool</p>
				</div>

				{!friends ? (
					<div className="text-muted-foreground py-8 text-center">
						loading...
					</div>
				) : friends.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						no friends added yet
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{friends
							.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
							.map((friend, index) => (
								<div
									key={friend._id}
									className="p-4 bg-surface border border-border rounded hover:border-rose/30 transition-all hover-lift group"
									style={{ animationDelay: `${index * 50}ms` }}
								>
									<div className="flex items-start gap-3">
										{friend.imageUrl ? (
											<img
												src={friend.imageUrl}
												alt={friend.name}
												className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-rose/50 transition-colors"
											/>
										) : (
											<div className="w-14 h-14 rounded-full bg-background border-2 border-border flex items-center justify-center text-rose text-lg font-bold">
												{friend.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-rose group-hover:text-rose-deep transition-colors">
												{friend.name}
											</h3>
											{friend.content && (
												<div className="text-sm text-muted-foreground mt-1">
													<Markdown content={friend.content} />
												</div>
											)}
											{friend.links && friend.links.length > 0 && (
												<div className="flex flex-wrap gap-2 mt-2">
													{friend.links.map((link, i) => (
														<a
															key={i}
															href={link.url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs px-2 py-0.5 bg-background rounded border border-border hover:border-rose/50 text-rose-deep hover:text-rose transition-colors"
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
					</div>
				)}
			</div>
		</div>
	);
}
