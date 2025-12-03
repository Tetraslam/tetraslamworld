"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface FriendForm {
	name: string;
	content: string;
	links: { label: string; url: string }[];
	imageUrl: string;
	order: number;
}

const emptyForm: FriendForm = {
	name: "",
	content: "",
	links: [],
	imageUrl: "",
	order: 0,
};

export default function AdminFriendsPage() {
	const friends = useQuery(api.friends.list);
	const create = useMutation(api.friends.create);
	const update = useMutation(api.friends.update);
	const remove = useMutation(api.friends.remove);
	const reorder = useMutation(api.friends.reorder);

	const [editing, setEditing] = useState<Id<"friends"> | "new" | null>(null);
	const [form, setForm] = useState<FriendForm>(emptyForm);
	const [newLink, setNewLink] = useState({ label: "", url: "" });

	const sortedFriends = friends
		? [...friends].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: [];

	const handleEdit = (item: NonNullable<typeof friends>[0]) => {
		setEditing(item._id);
		setForm({
			name: item.name,
			content: item.content || "",
			links: item.links || [],
			imageUrl: item.imageUrl || "",
			order: item.order || 0,
		});
	};

	const handleNew = () => {
		setEditing("new");
		setForm({ ...emptyForm, order: sortedFriends.length });
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
			name: form.name,
			content: form.content || undefined,
			links: form.links.length > 0 ? form.links : undefined,
			imageUrl: form.imageUrl || undefined,
			order: form.order || undefined,
		};

		if (editing === "new") {
			await create(data);
		} else if (editing) {
			await update({ id: editing, ...data });
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"friends">) => {
		if (confirm("Delete this friend?")) {
			await remove({ id });
		}
	};

	const handleReorder = async (items: typeof sortedFriends) => {
		await reorder({ orderedIds: items.map((item) => item._id) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">friends</h1>
					<p className="text-sm text-muted-foreground mt-1">drag to reorder</p>
				</div>
				<button
					onClick={handleNew}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add friend
				</button>
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							name *
						</label>
						<input
							type="text"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							required
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							description (markdown)
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
							image
						</label>
						<ImageUpload
							value={form.imageUrl || undefined}
							onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
							shape="circle"
							previewClassName="w-16 h-16 rounded-full object-cover border border-border"
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
									placeholder="label (e.g., twitter)"
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

			{!friends ? (
				<p className="text-muted-foreground">loading...</p>
			) : friends.length === 0 ? (
				<p className="text-muted-foreground">no friends added yet</p>
			) : (
				<SortableList
					items={sortedFriends}
					onReorder={handleReorder}
					renderItem={(item) => (
						<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
							<div className="flex items-center gap-3">
								{item.imageUrl && (
									<img
										src={item.imageUrl}
										alt={item.name}
										className="w-8 h-8 rounded-full object-cover"
									/>
								)}
								<span className="font-medium">{item.name}</span>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => handleEdit(item)}
									className="text-sm text-rose-deep hover:text-rose"
								>
									edit
								</button>
								<button
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
