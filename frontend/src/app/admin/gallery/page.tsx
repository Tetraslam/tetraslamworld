"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface GalleryForm {
	imageUrl: string;
	caption: string;
}

const emptyForm: GalleryForm = {
	imageUrl: "",
	caption: "",
};

export default function AdminGalleryPage() {
	const images = useQuery(api.gallery.list);
	const create = useMutation(api.gallery.create);
	const update = useMutation(api.gallery.update);
	const remove = useMutation(api.gallery.remove);
	const reorder = useMutation(api.gallery.reorder);

	const [editing, setEditing] = useState<Id<"gallery"> | "new" | null>(null);
	const [form, setForm] = useState<GalleryForm>(emptyForm);

	const sortedImages = images
		? [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: [];

	const handleEdit = (item: NonNullable<typeof images>[0]) => {
		setEditing(item._id);
		setForm({
			imageUrl: item.imageUrl,
			caption: item.caption || "",
		});
	};

	const handleNew = () => {
		setEditing("new");
		setForm(emptyForm);
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.imageUrl) return;

		if (editing === "new") {
			await create({
				imageUrl: form.imageUrl,
				caption: form.caption || undefined,
				order: sortedImages.length,
			});
		} else if (editing) {
			await update({
				id: editing,
				imageUrl: form.imageUrl,
				caption: form.caption || undefined,
			});
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"gallery">) => {
		if (confirm("Delete this image?")) {
			await remove({ id });
		}
	};

	const handleReorder = async (items: typeof sortedImages) => {
		await reorder({ orderedIds: items.map((item) => item._id) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">gallery</h1>
					<p className="text-sm text-muted-foreground mt-1">
						drag to reorder images
					</p>
				</div>
				<button
					type="button"
					onClick={handleNew}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add image
				</button>
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							image *
						</label>
						<ImageUpload
							value={form.imageUrl || undefined}
							onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							caption
						</label>
						<input
							type="text"
							value={form.caption}
							onChange={(e) => setForm({ ...form, caption: e.target.value })}
							placeholder="optional caption"
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div className="flex gap-2">
						<button
							type="submit"
							disabled={!form.imageUrl}
							className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50"
						>
							{editing === "new" ? "add" : "save"}
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

			{!images ? (
				<p className="text-muted-foreground">loading...</p>
			) : sortedImages.length === 0 ? (
				<p className="text-muted-foreground">no images yet</p>
			) : (
				<SortableList
					items={sortedImages}
					onReorder={handleReorder}
					renderItem={(item) => (
						<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
							<div className="flex items-center gap-3">
								<img
									src={item.imageUrl}
									alt={item.caption || "Gallery image"}
									className="w-16 h-16 rounded object-cover"
								/>
								<div>
									<span className="text-sm text-muted-foreground">
										{item.caption || "no caption"}
									</span>
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
