"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ImageGalleryUpload } from "@/components/image-gallery-upload";
import { Markdown } from "@/components/markdown";
import { SortableList } from "@/components/sortable-list";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface GalleryImage {
	url: string;
	storageId?: string;
}

interface TravelForm {
	location: string;
	lat: string;
	lng: string;
	startDate: string;
	endDate: string;
	content: string;
	photos: GalleryImage[];
	order: number;
}

const emptyForm: TravelForm = {
	location: "",
	lat: "",
	lng: "",
	startDate: "",
	endDate: "",
	content: "",
	photos: [],
	order: 0,
};

export default function AdminTravelPage() {
	const travel = useQuery(api.travel.list);
	const create = useMutation(api.travel.create);
	const update = useMutation(api.travel.update);
	const remove = useMutation(api.travel.remove);
	const reorder = useMutation(api.travel.reorder);

	const [editing, setEditing] = useState<Id<"travel"> | "new" | null>(null);
	const [form, setForm] = useState<TravelForm>(emptyForm);

	const sortedTravel = travel
		? [...travel].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: [];

	const [showPreview, setShowPreview] = useState(false);

	const handleEdit = (item: NonNullable<typeof travel>[0]) => {
		setEditing(item._id);
		setForm({
			location: item.location,
			lat: item.coordinates.lat.toString(),
			lng: item.coordinates.lng.toString(),
			startDate: item.dates.start,
			endDate: item.dates.end || "",
			content: item.content || "",
			photos: item.photoUrls || [],
			order: item.order || 0,
		});
		setShowPreview(false);
	};

	const handleNew = () => {
		setEditing("new");
		setForm({ ...emptyForm, order: sortedTravel.length });
		setShowPreview(false);
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowPreview(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const data = {
			location: form.location,
			coordinates: {
				lat: parseFloat(form.lat),
				lng: parseFloat(form.lng),
			},
			dates: {
				start: form.startDate,
				end: form.endDate || undefined,
			},
			content: form.content || undefined,
			photoUrls:
				form.photos.length > 0 ? form.photos.map((p) => p.url) : undefined,
			order: form.order || undefined,
		};

		if (editing === "new") {
			await create(data);
		} else if (editing) {
			await update({ id: editing, ...data });
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"travel">) => {
		if (confirm("Delete this location?")) {
			await remove({ id });
		}
	};

	const handleReorder = async (items: typeof sortedTravel) => {
		await reorder({ orderedIds: items.map((item) => item._id) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">travel</h1>
					<p className="text-sm text-muted-foreground mt-1">drag to reorder</p>
				</div>
				<button
					onClick={handleNew}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add location
				</button>
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							location name *
						</label>
						<input
							type="text"
							value={form.location}
							onChange={(e) => setForm({ ...form, location: e.target.value })}
							required
							placeholder="e.g., Tokyo, Japan"
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								latitude *
							</label>
							<input
								type="text"
								value={form.lat}
								onChange={(e) => setForm({ ...form, lat: e.target.value })}
								required
								placeholder="e.g., 35.6762"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							/>
						</div>
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								longitude *
							</label>
							<input
								type="text"
								value={form.lng}
								onChange={(e) => setForm({ ...form, lng: e.target.value })}
								required
								placeholder="e.g., 139.6503"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-muted-foreground mb-1">
								start date *
							</label>
							<input
								type="text"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
								required
								placeholder="e.g., Dec 2023"
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
								placeholder="e.g., Jan 2024"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
							/>
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="block text-sm text-muted-foreground">
								notes (markdown)
							</label>
							<button
								type="button"
								onClick={() => setShowPreview(!showPreview)}
								className="text-xs text-rose-deep hover:text-rose"
							>
								{showPreview ? "edit" : "preview"}
							</button>
						</div>
						{showPreview ? (
							<div className="p-3 bg-background border border-border rounded min-h-[120px]">
								{form.content ? (
									<Markdown content={form.content} />
								) : (
									<p className="text-muted-foreground text-sm">
										no content to preview
									</p>
								)}
							</div>
						) : (
							<textarea
								value={form.content}
								onChange={(e) => setForm({ ...form, content: e.target.value })}
								rows={6}
								placeholder="Write your notes here... Reference images by number, e.g., 'see image 3 for the view from the hotel'"
								className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-y font-mono text-sm"
							/>
						)}
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-2">
							photos (gallery)
						</label>
						<ImageGalleryUpload
							value={form.photos}
							onChange={(photos) => setForm({ ...form, photos })}
							maxImages={20}
						/>
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

			{!travel ? (
				<p className="text-muted-foreground">loading...</p>
			) : travel.length === 0 ? (
				<p className="text-muted-foreground">no locations added yet</p>
			) : (
				<SortableList
					items={sortedTravel}
					onReorder={handleReorder}
					renderItem={(item) => (
						<div className="flex items-center justify-between p-3 bg-surface border border-border rounded flex-1">
							<div>
								<span className="font-medium">{item.location}</span>
								<p className="text-xs text-muted-foreground">
									{item.coordinates.lat.toFixed(4)},{" "}
									{item.coordinates.lng.toFixed(4)} | {item.dates.start}
									{item.dates.end && ` - ${item.dates.end}`}
								</p>
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
