"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Status = "pending" | "accepted" | "rejected";

export default function AdminLinkSuggestionsPage() {
	const suggestions = useQuery(api.linkSuggestions.list, {});
	const updateStatus = useMutation(api.linkSuggestions.updateStatus);
	const removeSuggestion = useMutation(api.linkSuggestions.remove);
	const createLink = useMutation(api.links.create);

	const [filter, setFilter] = useState<Status | "all">("pending");

	const filteredSuggestions = suggestions
		?.filter((s) => filter === "all" || s.status === filter)
		.sort((a, b) => b.createdAt - a.createdAt);

	const pendingCount = suggestions?.filter((s) => s.status === "pending").length || 0;

	const handleAccept = async (suggestion: NonNullable<typeof suggestions>[0]) => {
		// Create the link with suggestion data - this also marks the suggestion as accepted
		await createLink({
			title: suggestion.title,
			url: suggestion.url,
			content: suggestion.reason
				? `${suggestion.reason}${suggestion.submitterName ? ` (suggested by ${suggestion.submitterName})` : ""}`
				: suggestion.submitterName
					? `(suggested by ${suggestion.submitterName})`
					: undefined,
			fromSuggestionId: suggestion._id,
		});
	};

	const handleReject = async (id: Id<"linkSuggestions">) => {
		await updateStatus({ id, status: "rejected" });
	};

	const handleDelete = async (id: Id<"linkSuggestions">) => {
		if (confirm("Delete this suggestion permanently?")) {
			await removeSuggestion({ id });
		}
	};

	const handleUseAsTemplate = (suggestion: NonNullable<typeof suggestions>[0]) => {
		// Open the links admin page with prefilled data via URL params
		const params = new URLSearchParams({
			prefill: "true",
			title: suggestion.title,
			url: suggestion.url,
			content: suggestion.reason || "",
			suggestionId: suggestion._id,
			submitter: suggestion.submitterName || "",
		});
		window.location.href = `/admin/links?${params.toString()}`;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">link suggestions</h1>
					{pendingCount > 0 && (
						<p className="text-sm text-muted-foreground mt-1">
							{pendingCount} pending suggestion{pendingCount !== 1 ? "s" : ""}
						</p>
					)}
				</div>
			</div>

			{/* Filter tabs */}
			<div className="flex gap-2">
				{(["pending", "accepted", "rejected", "all"] as const).map((status) => (
					<button
						key={status}
						type="button"
						onClick={() => setFilter(status)}
						className={`px-3 py-1.5 text-sm rounded border transition-colors ${
							filter === status
								? "border-rose bg-rose/10 text-rose"
								: "border-border text-muted-foreground hover:border-rose/50"
						}`}
					>
						{status}
						{status === "pending" && pendingCount > 0 && (
							<span className="ml-1.5 px-1.5 py-0.5 bg-rose text-background text-xs rounded-full">
								{pendingCount}
							</span>
						)}
					</button>
				))}
			</div>

			{!suggestions ? (
				<p className="text-muted-foreground">loading...</p>
			) : filteredSuggestions?.length === 0 ? (
				<p className="text-muted-foreground">
					{filter === "all" ? "no suggestions yet" : `no ${filter} suggestions`}
				</p>
			) : (
				<div className="space-y-3">
					{filteredSuggestions?.map((suggestion) => (
						<div
							key={suggestion._id}
							className={`p-4 bg-surface border rounded-lg ${
								suggestion.status === "pending"
									? "border-rose/30"
									: suggestion.status === "accepted"
										? "border-green-500/30"
										: "border-border"
							}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h3 className="font-medium">{suggestion.title}</h3>
										<span
											className={`text-xs px-2 py-0.5 rounded ${
												suggestion.status === "pending"
													? "bg-rose/20 text-rose"
													: suggestion.status === "accepted"
														? "bg-green-500/20 text-green-400"
														: "bg-muted text-muted-foreground"
											}`}
										>
											{suggestion.status}
										</span>
									</div>
									<a
										href={suggestion.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-rose-deep hover:text-rose break-all"
									>
										{suggestion.url}
									</a>
									{suggestion.reason && (
										<p className="text-sm text-muted-foreground mt-2">
											"{suggestion.reason}"
										</p>
									)}
									<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
										{suggestion.submitterName && (
											<span>from: {suggestion.submitterName}</span>
										)}
										<span>
											{new Date(suggestion.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>

								{suggestion.status === "pending" && (
									<div className="flex flex-col gap-1 shrink-0">
										<button
											type="button"
											onClick={() => handleAccept(suggestion)}
											className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
										>
											accept & add
										</button>
										<button
											type="button"
											onClick={() => handleUseAsTemplate(suggestion)}
											className="px-3 py-1 text-xs bg-rose/20 text-rose rounded hover:bg-rose/30 transition-colors"
										>
											edit & add
										</button>
										<button
											type="button"
											onClick={() => handleReject(suggestion._id)}
											className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
										>
											reject
										</button>
									</div>
								)}

								{suggestion.status !== "pending" && (
									<button
										type="button"
										onClick={() => handleDelete(suggestion._id)}
										className="text-xs text-muted-foreground hover:text-rose-deep transition-colors"
									>
										delete
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
