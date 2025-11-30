"use client";

import { useMutation } from "convex/react";
import { useId, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

interface ImageUploadProps {
	value?: string;
	onChange: (url: string | undefined) => void;
	className?: string;
	previewClassName?: string;
	shape?: "square" | "circle";
	/** Use object-contain for non-portrait images, object-cover for portraits */
	adaptivePreview?: boolean;
}

export function ImageUpload({
	value,
	onChange,
	className = "",
	previewClassName = "",
	shape = "square",
	adaptivePreview = false,
}: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mode, setMode] = useState<"upload" | "url">("upload");
	const [urlInput, setUrlInput] = useState("");
	const [isLandscape, setIsLandscape] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();
	
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	// Check image orientation when value changes
	const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget;
		setIsLandscape(img.naturalWidth > img.naturalHeight);
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setError("Image must be smaller than 5MB");
			return;
		}

		setError(null);
		setUploading(true);

		try {
			const uploadUrl = await generateUploadUrl();
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) throw new Error("Upload failed");

			const { storageId } = await result.json();
			
			// Immediately fetch the URL for this storage ID
			const urlResponse = await fetch(`/api/storage?id=${storageId}`);
			const { url } = await urlResponse.json();
			
			if (url) {
				onChange(url);
			} else {
				throw new Error("Could not get image URL");
			}
		} catch (err) {
			console.error("Upload error:", err);
			setError("Failed to upload image");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const handleUrlSubmit = async () => {
		const url = urlInput.trim();
		if (!url) return;

		setError(null);
		setUploading(true);

		try {
			// Fetch the image from the URL
			const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
			if (!response.ok) throw new Error("Failed to fetch image");
			
			const blob = await response.blob();
			
			if (blob.size > 5 * 1024 * 1024) {
				throw new Error("Image must be smaller than 5MB");
			}

			// Upload to Convex storage
			const uploadUrl = await generateUploadUrl();
			const uploadResult = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": blob.type || "image/jpeg" },
				body: blob,
			});

			if (!uploadResult.ok) throw new Error("Upload failed");

			const { storageId } = await uploadResult.json();
			
			// Get the permanent Convex URL
			const urlResponse = await fetch(`/api/storage?id=${storageId}`);
			const { url: convexUrl } = await urlResponse.json();
			
			if (convexUrl) {
				onChange(convexUrl);
				setUrlInput("");
			} else {
				throw new Error("Could not get image URL");
			}
		} catch (err) {
			console.error("URL upload error:", err);
			setError(err instanceof Error ? err.message : "Failed to upload image from URL");
		} finally {
			setUploading(false);
		}
	};

	const handleClear = () => {
		onChange(undefined);
		setUrlInput("");
		if (inputRef.current) inputRef.current.value = "";
	};

	const shapeClass = shape === "circle" ? "rounded-full" : "rounded";
	const defaultPreviewClass = shape === "circle" 
		? "w-20 h-20 rounded-full object-cover border border-border"
		: "w-24 h-24 rounded object-cover border border-border";

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Mode toggle */}
			<div className="flex gap-2 text-xs">
				<button
					type="button"
					onClick={() => setMode("upload")}
					className={`px-2 py-1 rounded transition-colors ${
						mode === "upload"
							? "bg-rose/20 text-rose border border-rose/50"
							: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
					}`}
				>
					upload
				</button>
				<button
					type="button"
					onClick={() => setMode("url")}
					className={`px-2 py-1 rounded transition-colors ${
						mode === "url"
							? "bg-rose/20 text-rose border border-rose/50"
							: "bg-surface border border-border text-muted-foreground hover:border-rose/30"
					}`}
				>
					url
				</button>
			</div>

			{/* Upload or URL input */}
			{mode === "upload" ? (
				<div key="upload-mode">
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						disabled={uploading}
						className="hidden"
						id={inputId}
					/>
					<label
						htmlFor={inputId}
						className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border ${shapeClass} cursor-pointer hover:border-rose/50 transition-colors ${
							uploading ? "opacity-50 cursor-not-allowed" : ""
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
									choose file (max 5MB)
								</span>
							</>
						)}
					</label>
				</div>
			) : (
				<div key="url-mode" className="flex gap-2">
					<input
						type="url"
						value={urlInput || ""}
						onChange={(e) => setUrlInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
						placeholder="https://..."
						disabled={uploading}
						className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 text-sm disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={handleUrlSubmit}
						disabled={!urlInput.trim() || uploading}
						className="px-3 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors text-sm disabled:opacity-50 min-w-[60px]"
					>
						{uploading ? "..." : "upload"}
					</button>
				</div>
			)}

			{error && <p className="text-sm text-red-400">{error}</p>}

			{/* Preview */}
			{value && (
				<div className="p-3 bg-background/50 border border-border rounded">
					<div className={`flex ${adaptivePreview && isLandscape ? "flex-col items-start" : "flex-row items-center"} gap-3`}>
						{adaptivePreview ? (
							<div className={`${isLandscape ? "w-full max-w-xs" : "w-24"} bg-background border border-border rounded overflow-hidden`}>
								<img
									src={value}
									alt="Preview"
									onLoad={handleImageLoad}
									className={isLandscape ? "w-full h-auto object-contain" : "w-24 h-32 object-cover"}
								/>
							</div>
						) : (
							<img
								src={value}
								alt="Preview"
								className={previewClassName || defaultPreviewClass}
							/>
						)}
						<button
							type="button"
							onClick={handleClear}
							className="text-sm bg-rose-deep/20 text-rose-deep hover:bg-rose-deep hover:text-background px-3 py-1.5 border border-rose-deep/50 hover:border-rose rounded transition-colors shrink-0"
						>
							remove image
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
