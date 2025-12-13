"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface LinkForm {
	title: string;
	url: string;
	content: string;
	tags: string[];
	pinned: boolean;
}

const emptyForm: LinkForm = {
	title: "",
	url: "",
	content: "",
	tags: [],
	pinned: false,
};

export default function AdminLinksPage() {
	const searchParams = useSearchParams();
	const links = useQuery(api.links.list, {});
	const create = useMutation(api.links.create);
	const update = useMutation(api.links.update);
	const remove = useMutation(api.links.remove);
	const reorder = useMutation(api.links.reorder);

	const [editing, setEditing] = useState<Id<"links"> | "new" | null>(null);
	const [form, setForm] = useState<LinkForm>(emptyForm);
	const [prefillSuggestionId, setPrefillSuggestionId] = useState<Id<"linkSuggestions"> | null>(null);

	// Extract all unique tags from existing links
	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		links?.forEach((link) => {
			if (link.tags) {
				for (const tag of link.tags) {
					tagSet.add(tag);
				}
			}
		});
		return Array.from(tagSet).sort();
	}, [links]);

	// Handle prefill from URL params (from suggestion "edit & add")
	useEffect(() => {
		if (searchParams.get("prefill") === "true") {
			const title = searchParams.get("title") || "";
			const url = searchParams.get("url") || "";
			const content = searchParams.get("content") || "";
			const submitter = searchParams.get("submitter");
			const suggestionId = searchParams.get("suggestionId");

			const description = content
				? `${content}${submitter ? ` (suggested by ${submitter})` : ""}`
				: submitter
					? `(suggested by ${submitter})`
					: "";

			setForm({
				title,
				url,
				content: description,
				tags: [],
				pinned: false,
			});
			setEditing("new");
			if (suggestionId) {
				setPrefillSuggestionId(suggestionId as Id<"linkSuggestions">);
			}

			// Clear URL params
			window.history.replaceState({}, "", "/admin/links");
		}
	}, [searchParams]);

	// Sort links by order (ordered links first, then legacy unordered links by createdAt desc)
	const sortedLinks = links
		? [...links].sort((a, b) => {
				// If both have order, sort by order ascending (lower = first)
				if (a.order !== undefined && b.order !== undefined) {
					return a.order - b.order;
				}
				// If neither has order, sort by createdAt desc (newest first)
				if (a.order === undefined && b.order === undefined) {
					return b.createdAt - a.createdAt;
				}
				// Ordered links come first, unordered (legacy) links come after
				if (a.order !== undefined) return -1;
				return 1;
			})
		: [];

	const handleReorder = async (items: typeof sortedLinks) => {
		await reorder({ ids: items.map((item) => item._id) });
	};

	const handleEdit = (item: NonNullable<typeof links>[0]) => {
		setEditing(item._id);
		setForm({
			title: item.title,
			url: item.url,
			content: item.content || "",
			tags: item.tags || [],
			pinned: item.pinned || false,
		});
	};

	const handleNew = () => {
		setEditing("new");
		setForm(emptyForm);
		setPrefillSuggestionId(null);
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
		setPrefillSuggestionId(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const data = {
			title: form.title,
			url: form.url,
			content: form.content || undefined,
			tags: form.tags.length > 0 ? form.tags : undefined,
			pinned: form.pinned,
		};

		if (editing === "new") {
			// Pass suggestion ID if this came from a suggestion - create handles marking it as accepted
			await create({
				...data,
				fromSuggestionId: prefillSuggestionId || undefined,
			});
			setPrefillSuggestionId(null);
		} else if (editing) {
			await update({ id: editing, ...data });
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"links">) => {
		if (confirm("Delete this link?")) {
			await remove({ id });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">links</h1>
				<button
					onClick={handleNew}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add link
				</button>
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							title *
						</label>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							required
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							url *
						</label>
						<input
							type="url"
							value={form.url}
							onChange={(e) => setForm({ ...form, url: e.target.value })}
							required
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							description
						</label>
						<textarea
							value={form.content}
							onChange={(e) => setForm({ ...form, content: e.target.value })}
							rows={2}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							tags
						</label>
						<TagInput
							tags={form.tags}
							allTags={allTags}
							onChange={(tags) => setForm({ ...form, tags })}
						/>
					</div>

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={form.pinned}
							onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
							className="rounded border-border"
						/>
						<span className="text-sm">pinned</span>
					</label>

					<div className="flex gap-2">
						<button
							type="submit"
							className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
						>
							{editing === "new" ? "create" : "save"}
						</button>
						<button
							type="button"
							onClick={handleCancel}
							className="px-4 py-2 border border-border rounded hover:border-rose/50 transition-colors"
						>
							cancel
						</button>
					</div>
				</form>
			)}

			{!links ? (
				<p className="text-muted-foreground">loading...</p>
			) : links.length === 0 ? (
				<p className="text-muted-foreground">no links saved yet</p>
			) : (
				<SortableList
					items={sortedLinks}
					onReorder={handleReorder}
					renderItem={(item) => (
						<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-medium">{item.title}</span>
									{item.pinned && (
										<span className="text-xs text-rose">pinned</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground truncate max-w-md">
									{item.url}
								</p>
								{item.tags && item.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-1">
										{item.tags.map((tag) => (
											<span
												key={tag}
												className="px-1.5 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
											>
												{tag}
											</span>
										))}
									</div>
								)}
							</div>
							<div className="flex gap-2 shrink-0 ml-4">
								<button
									type="button"
									onClick={() => handleEdit(item)}
									className="text-sm text-rose-deep hover:text-rose"
								>
									edit
								</button>
								<button
									type="button"
									onClick={() => handleDelete(item._id)}
									className="text-sm text-muted-foreground hover:text-rose-deep"
								>
									delete
								</button>
							</div>
						</div>
					)}
				/>
			)}
		</div>
	);
}

// Tag input component with autocomplete
function TagInput({
	tags,
	allTags,
	onChange,
}: {
	tags: string[];
	allTags: string[];
	onChange: (tags: string[]) => void;
}) {
	const [input, setInput] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Filter suggestions based on input
	const suggestions = useMemo(() => {
		if (!input.trim()) return allTags.filter((t) => !tags.includes(t));
		const lower = input.toLowerCase();
		return allTags.filter(
			(t) => t.toLowerCase().includes(lower) && !tags.includes(t)
		);
	}, [input, allTags, tags]);

	// Check if current input is a new tag (not in allTags)
	const isNewTag = input.trim() && !allTags.includes(input.trim().toLowerCase()) && !tags.includes(input.trim().toLowerCase());

	const addTag = (tag: string) => {
		const trimmed = tag.trim().toLowerCase();
		if (trimmed && !tags.includes(trimmed)) {
			onChange([...tags, trimmed]);
		}
		setInput("");
		setShowSuggestions(false);
		setHighlightedIndex(0);
		inputRef.current?.focus();
	};

	const removeTag = (tag: string) => {
		onChange(tags.filter((t) => t !== tag));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (suggestions.length > 0 && showSuggestions) {
				addTag(suggestions[highlightedIndex]);
			} else if (input.trim()) {
				addTag(input);
			}
		} else if (e.key === "Backspace" && !input && tags.length > 0) {
			removeTag(tags[tags.length - 1]);
		} else if (e.key === "ArrowDown" && showSuggestions) {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev < suggestions.length - 1 ? prev + 1 : prev
			);
		} else if (e.key === "ArrowUp" && showSuggestions) {
			e.preventDefault();
			setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
		} else if (e.key === ",") {
			e.preventDefault();
			if (input.trim()) {
				addTag(input);
			}
		}
	};

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Auto-scroll to highlighted item
	useEffect(() => {
		if (showSuggestions && dropdownRef.current) {
			const highlighted = dropdownRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
			if (highlighted) {
				highlighted.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex, showSuggestions]);

	return (
		<div ref={containerRef} className="relative">
			<div className="flex flex-wrap gap-1.5 p-2 bg-background border border-border rounded focus-within:border-rose/50 min-h-[42px]">
				{tags.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 px-2 py-0.5 bg-rose/10 text-rose text-sm rounded border border-rose/30"
					>
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="hover:text-rose-deep"
						>
							&times;
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						setShowSuggestions(true);
						setHighlightedIndex(0);
					}}
					onFocus={() => setShowSuggestions(true)}
					onKeyDown={handleKeyDown}
					placeholder={tags.length === 0 ? "type to add tags..." : ""}
					className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
				/>
			</div>

			{/* Suggestions dropdown */}
			{showSuggestions && (suggestions.length > 0 || isNewTag) && (
				<div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-surface border border-border rounded shadow-lg max-h-48 overflow-y-auto">
					{isNewTag && (
						<button
							type="button"
							onClick={() => addTag(input)}
							className="w-full px-3 py-2 text-left text-sm hover:bg-rose/10 flex items-center gap-2"
						>
							<span className="text-rose">+</span>
							<span>create "{input.trim()}"</span>
						</button>
					)}
					{suggestions.map((tag, index) => (
						<button
							key={tag}
							type="button"
							data-index={index}
							onClick={() => addTag(tag)}
							className={`w-full px-3 py-2 text-left text-sm ${
								index === highlightedIndex
									? "bg-rose/10 text-rose"
									: "hover:bg-rose/5"
							}`}
						>
							{tag}
						</button>
					))}
				</div>
			)}

			<p className="text-xs text-muted-foreground/60 mt-1">
				press enter or comma to add, backspace to remove
			</p>
		</div>
	);
}
