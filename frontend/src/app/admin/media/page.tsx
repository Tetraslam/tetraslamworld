"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type MediaType =
	| "anime"
	| "book"
	| "game"
	| "music"
	| "movie"
	| "show"
	| "other";

const typeLabels: Record<MediaType, string> = {
	anime: "anime",
	book: "books",
	game: "games",
	music: "music",
	movie: "movies",
	show: "shows",
	other: "other",
};

const typeOrder: MediaType[] = ["anime", "book", "game", "music", "movie", "show", "other"];

interface MediaForm {
	type: MediaType;
	title: string;
	content: string;
	links: { label: string; url: string }[];
	imageUrl: string;
	tags: string;
	order: number;
}

const emptyForm: MediaForm = {
	type: "anime",
	title: "",
	content: "",
	links: [],
	imageUrl: "",
	tags: "",
	order: 0,
};

export default function AdminMediaPage() {
	const media = useQuery(api.media.list);
	const create = useMutation(api.media.create);
	const update = useMutation(api.media.update);
	const remove = useMutation(api.media.remove);
	const reorder = useMutation(api.media.reorder);

	const [editing, setEditing] = useState<Id<"media"> | "new" | null>(null);
	const [form, setForm] = useState<MediaForm>(emptyForm);
	const [newLink, setNewLink] = useState({ label: "", url: "" });
	const [selectedType, setSelectedType] = useState<MediaType | null>(null);

	// Group media by type
	const grouped = media?.reduce(
		(acc, item) => {
			if (!acc[item.type]) acc[item.type] = [];
			acc[item.type].push(item);
			return acc;
		},
		{} as Record<string, NonNullable<typeof media>>,
	);

	// Sort items within each group by order
	if (grouped) {
		for (const type of Object.keys(grouped)) {
			grouped[type]?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		}
	}


	const handleEdit = (item: NonNullable<typeof media>[0]) => {
		setEditing(item._id);
		setForm({
			type: item.type,
			title: item.title,
			content: item.content || "",
			links: item.links || [],
			imageUrl: item.imageUrl || "",
			tags: item.tags?.join(", ") || "",
			order: item.order || 0,
		});
	};

	const handleNew = (type?: MediaType) => {
		const targetType = type || "anime";
		const typeItems = grouped?.[targetType] || [];
		setEditing("new");
		setForm({ ...emptyForm, type: targetType, order: typeItems.length });
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
	};

	const handleAddLink = () => {
		if (newLink.label && newLink.url) {
			setForm({ ...form, links: [...form.links, newLink] });
			setNewLink({ label: "", url: "" });
		}
	};

	const handleRemoveLink = (index: number) => {
		setForm({ ...form, links: form.links.filter((_, i) => i !== index) });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const data = {
			type: form.type,
			title: form.title,
			content: form.content || undefined,
			links: form.links.length > 0 ? form.links : undefined,
			imageUrl: form.imageUrl || undefined,
			tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : undefined,
			order: form.order || undefined,
		};

		if (editing === "new") {
			await create(data);
		} else if (editing) {
			await update({ id: editing, ...data });
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"media">) => {
		if (confirm("Delete this media?")) {
			await remove({ id });
		}
	};

	const handleReorder = async (items: NonNullable<typeof media>) => {
		await reorder({ orderedIds: items.map((item) => item._id) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">media</h1>
					<p className="text-sm text-muted-foreground mt-1">drag to reorder within each type</p>
				</div>
				<button
					type="button"
					onClick={() => handleNew(selectedType || undefined)}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add media
				</button>
			</div>

			{/* Type filter tabs */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setSelectedType(null)}
					className={`px-3 py-1 text-sm rounded border transition-colors ${
						selectedType === null
							? "border-rose bg-rose/10 text-rose"
							: "border-border text-muted-foreground hover:border-rose/50"
					}`}
				>
					all
				</button>
				{typeOrder.map((type) => (
					<button
						type="button"
						key={type}
						onClick={() => setSelectedType(type)}
						className={`px-3 py-1 text-sm rounded border transition-colors ${
							selectedType === type
								? "border-rose bg-rose/10 text-rose"
								: "border-border text-muted-foreground hover:border-rose/50"
						}`}
					>
						{typeLabels[type]} {grouped?.[type]?.length ? `(${grouped[type].length})` : ""}
					</button>
				))}
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								type
							</label>
							<select
								value={form.type}
								onChange={(e) =>
									setForm({ ...form, type: e.target.value as MediaType })
								}
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							>
								<option value="anime">anime</option>
								<option value="book">book</option>
								<option value="game">game</option>
								<option value="music">music</option>
								<option value="movie">movie</option>
								<option value="show">show</option>
								<option value="other">other</option>
							</select>
						</div>
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
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							notes (markdown)
						</label>
						<textarea
							value={form.content}
							onChange={(e) => setForm({ ...form, content: e.target.value })}
							rows={3}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							cover image
						</label>
						<ImageUpload
							value={form.imageUrl || undefined}
							onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
							adaptivePreview
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							tags (comma separated)
						</label>
						<input
							type="text"
							value={form.tags}
							onChange={(e) => setForm({ ...form, tags: e.target.value })}
							placeholder="e.g., favorite, rewatched, classic"
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							links
						</label>
						<div className="space-y-2">
							{form.links.map((link, i) => (
								<div key={i} className="flex items-center gap-2">
									<span className="text-sm">
										{link.label}: {link.url}
									</span>
									<button
										type="button"
										onClick={() => handleRemoveLink(i)}
										className="text-xs text-rose-deep hover:text-rose"
									>
										remove
									</button>
								</div>
							))}
							<div className="flex gap-2">
								<input
									type="text"
									value={newLink.label}
									onChange={(e) =>
										setNewLink({ ...newLink, label: e.target.value })
									}
									placeholder="label"
									className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-rose/50"
								/>
								<input
									type="url"
									value={newLink.url}
									onChange={(e) =>
										setNewLink({ ...newLink, url: e.target.value })
									}
									placeholder="url"
									className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-rose/50"
								/>
								<button
									type="button"
									onClick={handleAddLink}
									className="px-3 py-1.5 bg-surface border border-border rounded text-sm hover:border-rose/50"
								>
									add
								</button>
							</div>
						</div>
					</div>

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

			{!media ? (
				<p className="text-muted-foreground">loading...</p>
			) : media.length === 0 ? (
				<p className="text-muted-foreground">no media added yet</p>
			) : (
				<div className="space-y-8">
					{typeOrder
						.filter((type) => !selectedType || selectedType === type)
						.filter((type) => grouped?.[type]?.length)
						.map((type) => (
							<section key={type}>
								<div className="flex items-center justify-between mb-3">
									<h2 className="text-lg font-semibold text-rose">
										{typeLabels[type]}
									</h2>
									<button
										type="button"
										onClick={() => handleNew(type)}
										className="text-sm text-muted-foreground hover:text-rose transition-colors"
									>
										+ add
									</button>
								</div>
								<SortableList
									items={grouped?.[type] || []}
									onReorder={handleReorder}
									renderItem={(item) => (
										<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
											<div className="flex items-center gap-3">
												{item.imageUrl && (
													<img
														src={item.imageUrl}
														alt={item.title}
														className="w-10 h-14 object-cover rounded"
													/>
												)}
												<span className="font-medium">{item.title}</span>
											</div>
											<div className="flex gap-2">
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
							</section>
						))}
				</div>
			)}
		</div>
	);
}
