"use client";

import { useMutation } from "convex/react";
import { useId, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

interface GalleryImage {
	url: string;
	storageId?: string;
}

interface ImageGalleryUploadProps {
	value: GalleryImage[];
	onChange: (images: GalleryImage[]) => void;
	maxImages?: number;
	className?: string;
}

export function ImageGalleryUpload({
	value,
	onChange,
	maxImages = 20,
	className = "",
}: ImageGalleryUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [urlInput, setUrlInput] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const remainingSlots = maxImages - value.length;
		if (remainingSlots <= 0) {
			setError(`Maximum ${maxImages} images allowed`);
			return;
		}

		const filesToUpload = Array.from(files).slice(0, remainingSlots);
		const invalidFiles = filesToUpload.filter(
			(f) => !f.type.startsWith("image/")
		);

		if (invalidFiles.length > 0) {
			setError("Some files were skipped (must be images)");
		} else {
			setError(null);
		}

		const validFiles = filesToUpload.filter(
			(f) => f.type.startsWith("image/")
		);

		if (validFiles.length === 0) return;

		setUploading(true);

		try {
			const uploadedImages: GalleryImage[] = [];

			for (const file of validFiles) {
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
					uploadedImages.push({ url, storageId });
				}
			}

			onChange([...value, ...uploadedImages]);
		} catch (err) {
			console.error("Upload error:", err);
			setError("Failed to upload some images");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const handleAddUrl = () => {
		if (!urlInput.trim()) return;
		if (value.length >= maxImages) {
			setError(`Maximum ${maxImages} images allowed`);
			return;
		}
		onChange([...value, { url: urlInput.trim() }]);
		setUrlInput("");
		setError(null);
	};

	const handleRemove = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const handleMoveUp = (index: number) => {
		if (index === 0) return;
		const newImages = [...value];
		[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
		onChange(newImages);
	};

	const handleMoveDown = (index: number) => {
		if (index === value.length - 1) return;
		const newImages = [...value];
		[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
		onChange(newImages);
	};

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Upload controls */}
			<div className="flex flex-col gap-3">
				{/* File upload */}
				<div>
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleFileChange}
						disabled={uploading || value.length >= maxImages}
						className="hidden"
						id={inputId}
					/>
					<label
						htmlFor={inputId}
						className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded cursor-pointer hover:border-rose/50 transition-colors ${
							uploading || value.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{uploading ? (
							<span className="text-sm text-muted-foreground animate-pulse">
								uploading...
							</span>
						) : (
							<>
								<span className="text-rose text-lg">+</span>
								<span className="text-sm text-muted-foreground">
									upload images (max 5MB each)
								</span>
							</>
						)}
					</label>
				</div>

				{/* URL input */}
				<div className="flex gap-2">
					<input
						type="url"
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
						placeholder="or paste image URL..."
						className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 text-sm"
						disabled={value.length >= maxImages}
					/>
					<button
						type="button"
						onClick={handleAddUrl}
						disabled={!urlInput.trim() || value.length >= maxImages}
						className="px-3 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors text-sm disabled:opacity-50"
					>
						add
					</button>
				</div>
			</div>

			{error && <p className="text-sm text-red-400">{error}</p>}

			{/* Gallery preview with numbers */}
			{value.length > 0 && (
				<div className="space-y-2">
					<div className="text-xs text-muted-foreground">
						{value.length} / {maxImages} images - reference by number in notes (e.g., "see image 3")
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						{value.map((img, index) => (
							<div
								key={img.url}
								className="relative group border border-border rounded overflow-hidden bg-background"
							>
								{/* Number badge */}
								<div className="absolute top-1 left-1 z-10 w-6 h-6 bg-rose text-background text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
									{index + 1}
								</div>

								{/* Image - smart sizing */}
								<div className="aspect-video flex items-center justify-center bg-background/50">
									<img
										src={img.url}
										alt={`Gallery item ${index + 1}`}
										className="max-w-full max-h-full object-contain"
									/>
								</div>

								{/* Controls overlay */}
								<div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
									{index > 0 && (
										<button
											type="button"
											onClick={() => handleMoveUp(index)}
											className="p-1.5 bg-surface border border-border rounded hover:border-rose/50 text-xs"
											title="Move up"
										>
											&larr;
										</button>
									)}
									<button
										type="button"
										onClick={() => handleRemove(index)}
										className="p-1.5 bg-rose-deep text-background rounded hover:bg-rose text-xs"
									>
										remove
									</button>
									{index < value.length - 1 && (
										<button
											type="button"
											onClick={() => handleMoveDown(index)}
											className="p-1.5 bg-surface border border-border rounded hover:border-rose/50 text-xs"
											title="Move down"
										>
											&rarr;
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
