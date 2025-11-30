"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type WorkType = "project" | "paper" | "talk" | "job" | "other";
const WORK_TYPES: WorkType[] = ["project", "paper", "talk", "job", "other"];

interface WorkForm {
	type: WorkType;
	title: string;
	content: string;
	tags: string;
	date: string;
	endDate: string;
	links: { label: string; url: string }[];
	imageUrl: string;
	featured: boolean;
	order: number;
}

const emptyForm: WorkForm = {
	type: "project",
	title: "",
	content: "",
	tags: "",
	date: "",
	endDate: "",
	links: [],
	imageUrl: "",
	featured: false,
	order: 0,
};

export default function AdminWorkPage() {
	const work = useQuery(api.work.list);
	const create = useMutation(api.work.create);
	const update = useMutation(api.work.update);
	const remove = useMutation(api.work.remove);
	const reorder = useMutation(api.work.reorder);

	const [editing, setEditing] = useState<Id<"work"> | "new" | null>(null);
	const [form, setForm] = useState<WorkForm>(emptyForm);
	const [newLink, setNewLink] = useState({ label: "", url: "" });
	const [selectedType, setSelectedType] = useState<WorkType>("project");

	// Group work by type
	const workByType = work
		? WORK_TYPES.reduce(
				(acc, type) => {
					acc[type] = work
						.filter((item) => item.type === type)
						.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
					return acc;
				},
				{} as Record<WorkType, NonNullable<typeof work>>,
			)
		: null;

	const handleEdit = (item: NonNullable<typeof work>[0]) => {
		setEditing(item._id);
		setSelectedType(item.type);
		setNewLink({ label: "", url: "" }); // Reset pending link input
		setForm({
			type: item.type,
			title: item.title,
			content: item.content || "",
			tags: item.tags?.join(", ") || "",
			date: item.date || "",
			endDate: item.endDate || "",
			links: item.links ? [...item.links] : [], // Clone to avoid mutations
			imageUrl: item.imageUrl || "",
			featured: item.featured || false,
			order: item.order || 0,
		});
	};

	const handleNew = (type: WorkType) => {
		setEditing("new");
		setNewLink({ label: "", url: "" }); // Reset pending link input
		const typeItems = workByType?.[type] || [];
		setForm({ ...emptyForm, type, order: typeItems.length });
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
		setNewLink({ label: "", url: "" }); // Reset pending link input
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
		
		// Include pending link if both fields are filled
		const allLinks = newLink.label && newLink.url 
			? [...form.links, newLink] 
			: form.links;
		
		if (editing === "new") {
			await create({
				type: form.type,
				title: form.title,
				content: form.content || undefined,
				tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : undefined,
				date: form.date || undefined,
				endDate: form.endDate || undefined,
				links: allLinks.length > 0 ? allLinks : undefined,
				imageUrl: form.imageUrl || undefined,
				featured: form.featured || undefined,
				order: form.order || undefined,
			});
		} else if (editing) {
			// For updates, explicitly include imageUrl even if empty to allow clearing
			await update({
				id: editing,
				type: form.type,
				title: form.title,
				content: form.content || undefined,
				tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : undefined,
				date: form.date || undefined,
				endDate: form.endDate || undefined,
				links: allLinks.length > 0 ? allLinks : undefined,
				imageUrl: form.imageUrl, // Pass empty string to clear, not undefined
				featured: form.featured || undefined,
				order: form.order || undefined,
			});
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"work">) => {
		if (confirm("Delete this item?")) {
			await remove({ id });
		}
	};

	const handleReorder = async (_type: WorkType, items: NonNullable<typeof work>) => {
		await reorder({ orderedIds: items.map((item) => item._id) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">work</h1>
					<p className="text-sm text-muted-foreground mt-1">drag to reorder within each type</p>
				</div>
			</div>

			{/* Type tabs */}
			<div className="flex flex-wrap gap-2">
				{WORK_TYPES.map((type) => (
					<button
						key={type}
						type="button"
						onClick={() => setSelectedType(type)}
						className={`px-3 py-1.5 rounded text-sm transition-colors ${
							selectedType === type
								? "bg-rose text-background"
								: "bg-surface border border-border hover:border-rose/50"
						}`}
					>
						{type} ({workByType?.[type]?.length ?? 0})
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={() => handleNew(selectedType)}
				className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
			>
				+ add {selectedType}
			</button>

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
									setForm({ ...form, type: e.target.value as WorkType })
								}
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							>
								<option value="project">project</option>
								<option value="paper">paper</option>
								<option value="talk">talk</option>
								<option value="job">job</option>
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
							content (markdown)
						</label>
						<textarea
							value={form.content}
							onChange={(e) => setForm({ ...form, content: e.target.value })}
							rows={4}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								start date
							</label>
							<input
								type="text"
								value={form.date}
								onChange={(e) => setForm({ ...form, date: e.target.value })}
								placeholder="e.g., Jan 2024"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							/>
						</div>
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								end date
							</label>
							<input
								type="text"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
								placeholder="e.g., Present"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							tags (comma separated)
						</label>
						<input
							type="text"
							value={form.tags}
							onChange={(e) => setForm({ ...form, tags: e.target.value })}
							placeholder="e.g., react, typescript, ml"
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							image
						</label>
						<ImageUpload
							value={form.imageUrl || undefined}
							onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
							adaptivePreview
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

					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={form.featured}
								onChange={(e) =>
									setForm({ ...form, featured: e.target.checked })
								}
								className="rounded border-border"
							/>
							<span className="text-sm">featured</span>
						</label>
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

			{!work ? (
				<p className="text-muted-foreground">loading...</p>
			) : !workByType?.[selectedType]?.length ? (
				<p className="text-muted-foreground">no {selectedType} items yet</p>
			) : (
				<SortableList
					items={workByType[selectedType]}
					onReorder={(items) => handleReorder(selectedType, items)}
					renderItem={(item) => (
						<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
							<div className="flex items-center gap-3">
								{item.imageUrl && (
									<img
										src={item.imageUrl}
										alt={item.title}
										className="w-10 h-10 rounded object-cover"
									/>
								)}
								<div>
									<span className="font-medium">{item.title}</span>
									{item.featured && (
										<span className="ml-2 text-xs text-rose">featured</span>
									)}
								</div>
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
			)}
		</div>
	);
}
