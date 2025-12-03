"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../../convex/_generated/api";

interface MultiImageUploadProps {
	value: string[];
	onChange: (urls: string[]) => void;
}

export function MultiImageUpload({ value, onChange }: MultiImageUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [urlInput, setUrlInput] = useState("");
	const [mode, setMode] = useState<"upload" | "url">("upload");

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = value.indexOf(active.id as string);
			const newIndex = value.indexOf(over.id as string);
			onChange(arrayMove(value, oldIndex, newIndex));
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setError(null);
		setUploading(true);

		try {
			const newUrls: string[] = [];

			for (const file of Array.from(files)) {
				if (!file.type.startsWith("image/")) {
					continue;
				}

				const uploadUrl = await generateUploadUrl();
				const result = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});

				if (!result.ok) continue;

				const { storageId } = await result.json();
				const urlResponse = await fetch(`/api/storage?id=${storageId}`);
				const { url } = await urlResponse.json();

				if (url) {
					newUrls.push(url);
				}
			}

			if (newUrls.length > 0) {
				onChange([...value, ...newUrls]);
			}
		} catch (err) {
			setError("Failed to upload images");
			console.error(err);
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleUrlSubmit = async () => {
		const url = urlInput.trim();
		if (!url) return;

		setError(null);
		setUploading(true);

		try {
			// Fetch through proxy and upload to Convex
			const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
			if (!response.ok) throw new Error("Failed to fetch image");

			const blob = await response.blob();

			const uploadUrl = await generateUploadUrl();
			const uploadResult = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": blob.type || "image/jpeg" },
				body: blob,
			});

			if (!uploadResult.ok) throw new Error("Upload failed");

			const { storageId } = await uploadResult.json();
			const urlResponse = await fetch(`/api/storage?id=${storageId}`);
			const { url: convexUrl } = await urlResponse.json();

			if (convexUrl) {
				onChange([...value, convexUrl]);
				setUrlInput("");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add image");
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = (urlToRemove: string) => {
		onChange(value.filter((url) => url !== urlToRemove));
	};

	return (
		<div className="space-y-3">
			{/* Mode toggle */}
			<div className="flex gap-2 text-xs">
				<button
					type="button"
					onClick={() => setMode("upload")}
					className={`px-2 py-1 rounded transition-colors ${
						mode === "upload"
							? "bg-rose/20 text-rose"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					upload
				</button>
				<button
					type="button"
					onClick={() => setMode("url")}
					className={`px-2 py-1 rounded transition-colors ${
						mode === "url"
							? "bg-rose/20 text-rose"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					from url
				</button>
			</div>

			{/* Upload input */}
			{mode === "upload" ? (
				<div key="upload-mode">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleFileChange}
						disabled={uploading}
						className="hidden"
						aria-label="Upload images"
					/>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploading}
						className="px-4 py-2 bg-surface border border-border rounded text-sm hover:border-rose/50 transition-colors disabled:opacity-50"
					>
						{uploading ? "uploading..." : "+ add images"}
					</button>
				</div>
			) : (
				<div key="url-mode" className="flex gap-2">
					<input
						type="url"
						value={urlInput || ""}
						onChange={(e) => setUrlInput(e.target.value)}
						placeholder="paste image url"
						className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-rose/50"
						disabled={uploading}
					/>
					<button
						type="button"
						onClick={handleUrlSubmit}
						disabled={uploading || !urlInput.trim()}
						className="px-4 py-2 bg-rose text-background rounded text-sm hover:bg-rose-deep transition-colors disabled:opacity-50"
					>
						{uploading ? "..." : "add"}
					</button>
				</div>
			)}

			{error && <p className="text-xs text-red-400">{error}</p>}

			{/* Image grid with drag-and-drop */}
			{value.length > 0 && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={value} strategy={rectSortingStrategy}>
						<div className="grid grid-cols-4 gap-2">
							{value.map((url, index) => (
								<SortableImage
									key={url}
									url={url}
									index={index}
									onRemove={() => handleRemove(url)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}

			{value.length > 0 && (
				<p className="text-xs text-muted-foreground">
					drag to reorder. first image is the cover.
				</p>
			)}
		</div>
	);
}

function SortableImage({
	url,
	index,
	onRemove,
}: {
	url: string;
	index: number;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: url });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="relative group aspect-square"
		>
			{/* biome-ignore lint: dynamic image */}
			<img
				src={url}
				alt={`Image ${index + 1}`}
				className="w-full h-full object-cover rounded border border-border cursor-grab active:cursor-grabbing"
				{...attributes}
				{...listeners}
			/>
			{/* Index badge */}
			{index === 0 && (
				<span className="absolute top-1 left-1 px-1.5 py-0.5 bg-rose text-background text-[10px] rounded font-medium">
					cover
				</span>
			)}
			{/* Remove button */}
			<button
				type="button"
				onClick={onRemove}
				className="absolute top-1 right-1 w-5 h-5 bg-background/80 hover:bg-red-500 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
			>
				x
			</button>
		</div>
	);
}
