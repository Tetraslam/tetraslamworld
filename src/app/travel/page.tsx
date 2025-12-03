"use client";

import { useQuery } from "convex/react";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { api } from "../../../convex/_generated/api";
import "mapbox-gl/dist/mapbox-gl.css";

const isGif = (url: string) => url.toLowerCase().includes(".gif");

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Location {
	_id: string;
	location: string;
	coordinates: { lat: number; lng: number };
	dates?: { start?: string; end?: string };
	content?: string;
	photoUrls?: string[];
}

export default function TravelPage() {
	const locationsRaw = useQuery(api.travel.list, {});
	// Sort by order field
	const locations = locationsRaw
		? [...locationsRaw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		: undefined;
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const [selectedLocation, setSelectedLocation] = useState<Location | null>(
		null,
	);
	const [mapLoaded, setMapLoaded] = useState(false);

	// Draggable panel state
	const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	// Photo viewer state
	const [viewingPhoto, setViewingPhoto] = useState<{
		url: string;
		index: number;
	} | null>(null);
	
	// Expanded detail view
	const [showExpanded, setShowExpanded] = useState(false);
	
	// Mobile destinations list
	const [showMobileDestinations, setShowMobileDestinations] = useState(false);

	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		map.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/dark-v11",
			center: [0, 20],
			zoom: 1.5,
			projection: "globe" as unknown as undefined,
			attributionControl: false, // Hide default attribution
			logoPosition: "bottom-left", // Move logo to less intrusive spot
		});

		map.current.on("load", () => {
			setMapLoaded(true);

			// Add atmosphere effect with our theme colors
			map.current?.setFog({
				color: "rgb(34, 31, 34)",
				"high-color": "rgb(43, 38, 43)",
				"horizon-blend": 0.02,
				"space-color": "rgb(17, 15, 17)",
				"star-intensity": 0.3,
			});
		});

		// Enable scroll zoom
		map.current.scrollZoom.enable();

		// Add navigation controls to bottom-right, above cmdk
		map.current.addControl(
			new mapboxgl.NavigationControl({
				showCompass: true,
			}),
			"bottom-right",
		);

		// Add minimal attribution (required by Mapbox TOS but can be small)
		map.current.addControl(
			new mapboxgl.AttributionControl({
				compact: true,
			}),
			"bottom-left",
		);

		return () => {
			map.current?.remove();
			map.current = null;
		};
	}, []);

	// Add markers when locations load
	useEffect(() => {
		if (!map.current || !mapLoaded || !locations) return;

		// Clear existing markers
		const markers = document.querySelectorAll(".mapboxgl-marker");
		markers.forEach((m) => m.remove());

		// Add markers for each location
		locations.forEach((loc) => {
			const el = document.createElement("div");
			el.className = "travel-marker";
			el.innerHTML = `
				<div class="marker-pulse"></div>
				<div class="marker-dot"></div>
			`;

			el.addEventListener("click", () => {
				setSelectedLocation(loc);
				map.current?.flyTo({
					center: [loc.coordinates.lng, loc.coordinates.lat],
					zoom: 5,
					duration: 1500,
				});
			});

			new mapboxgl.Marker({ element: el })
				.setLngLat([loc.coordinates.lng, loc.coordinates.lat])
				.addTo(map.current!);
		});
	}, [locations, mapLoaded]);

	// Drag handlers
	const handleMouseDown = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest("button")) return;
		setIsDragging(true);
		const panel = (e.target as HTMLElement).closest(".draggable-panel");
		if (panel) {
			const rect = panel.getBoundingClientRect();
			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		setPanelPos({
			x: e.clientX - dragOffset.current.x,
			y: e.clientY - dragOffset.current.y,
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Reset panel position and expanded state when closed
	useEffect(() => {
		if (!selectedLocation) {
			setPanelPos({ x: 0, y: 0 });
			setShowExpanded(false);
		}
	}, [selectedLocation]);

	if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-12">
				<h1 className="text-3xl font-bold mb-4">travel</h1>
				<div className="p-6 bg-surface border border-border rounded">
					<p className="text-muted-foreground">
						Mapbox token not configured. Add{" "}
						<code className="text-rose">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your
						.env.local file.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="h-[calc(100vh-3rem)] relative"
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{/* JARVIS-style HUD overlay */}
			<div className="absolute inset-0 pointer-events-none z-10">
				{/* Top left info - next to corner bracket */}
				<div className="absolute top-4 left-4 text-xs text-rose/60 font-mono">
					<div>TRAVEL LOG</div>
					<div className="text-muted-foreground">
						{locations?.length || 0} locations indexed
					</div>
				</div>

				<div className="absolute top-4 right-4 text-xs text-rose/60 font-mono text-right">
					<div>SYSTEM ONLINE</div>
					<div className="text-muted-foreground">
						{new Date().toISOString().slice(0, 10)}
					</div>
				</div>

				{/* Scan line effect */}
				<div className="absolute inset-0 overflow-hidden opacity-30">
					<div className="scan-line" />
				</div>

				{/* Corner brackets */}
				<div className="absolute top-2 left-2 w-6 h-6 border-l border-t border-rose/20" />
				<div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-rose/20" />
				<div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-rose/20" />
				<div className="absolute bottom-2 right-2 w-6 h-6 border-r border-b border-rose/20" />
			</div>

			{/* Map container */}
			<div ref={mapContainer} className="w-full h-full" />

			{/* Location info panel */}
			{selectedLocation && !showExpanded && (
				<div
					className="draggable-panel fixed bg-surface/95 backdrop-blur-sm border border-rose/30 rounded-lg p-4 z-30 animate-fade-in cursor-move select-none"
					style={{
						left: panelPos.x || "auto",
						top: panelPos.y || "auto",
						right: panelPos.x ? "auto" : "4rem",
						bottom: panelPos.y ? "auto" : "6rem",
						width: "320px",
						maxHeight: "60vh",
					}}
					onMouseDown={handleMouseDown}
				>
					<div className="flex items-start justify-between mb-2">
						<div className="text-xs text-muted-foreground font-mono">
							LOCATION DATA
						</div>
						<button
							type="button"
							onClick={() => setSelectedLocation(null)}
							className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
						>
							&times;
						</button>
					</div>

					<div className="space-y-3 max-h-[calc(60vh-100px)] overflow-y-auto pr-1">
						{/* Location name - truncated */}
						<h3 className="text-lg font-semibold text-rose truncate" title={selectedLocation.location}>
							{selectedLocation.location}
						</h3>

						{/* Coordinates and date */}
						<div className="flex justify-between text-xs">
							<span className="font-mono text-muted-foreground">
								{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
							</span>
							{(selectedLocation.dates?.start || selectedLocation.dates?.end) && (
							<span className="text-foreground/80">
								{selectedLocation.dates.start}
									{selectedLocation.dates.end && (selectedLocation.dates.start ? ` → ${selectedLocation.dates.end}` : selectedLocation.dates.end)}
							</span>
							)}
						</div>

						{/* Photo preview - show first 4 */}
						{selectedLocation.photoUrls && selectedLocation.photoUrls.length > 0 && (
							<div>
								<div className="text-xs text-muted-foreground font-mono mb-1.5">
									PHOTOS ({selectedLocation.photoUrls.length})
								</div>
								<div className="grid grid-cols-4 gap-1">
									{selectedLocation.photoUrls.slice(0, 4).map((url, index) => (
										<button
											key={url}
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setViewingPhoto({ url, index });
											}}
											className="relative aspect-square bg-background rounded overflow-hidden border border-border/50 hover:border-rose/50 transition-colors group cursor-pointer"
										>
											<Image
												src={url}
												alt={`${selectedLocation.location} - ${index + 1}`}
												fill
												className="object-cover"
												sizes="64px"
												unoptimized={isGif(url)}
											/>
											<div className="absolute top-0.5 left-0.5 w-4 h-4 bg-rose text-background text-[10px] font-bold rounded-full flex items-center justify-center z-10">
												{index + 1}
											</div>
										</button>
									))}
								</div>
								{selectedLocation.photoUrls.length > 4 && (
									<div className="text-xs text-muted-foreground mt-1">
										+{selectedLocation.photoUrls.length - 4} more
									</div>
								)}
							</div>
						)}

						{/* Notes preview - truncated */}
						{selectedLocation.content && (
							<div>
								<div className="text-xs text-muted-foreground font-mono mb-1">NOTES</div>
								<div className="text-xs text-foreground/80 line-clamp-3 bg-background/30 rounded p-2 border border-border/30">
									{selectedLocation.content.slice(0, 150)}
									{selectedLocation.content.length > 150 && "..."}
								</div>
							</div>
						)}
					</div>

					{/* Expand button */}
					{(selectedLocation.photoUrls?.length || selectedLocation.content) && (
						<button
							type="button"
							onClick={() => setShowExpanded(true)}
							className="w-full mt-3 py-1.5 text-xs text-rose-deep hover:text-rose border border-rose-deep/30 hover:border-rose/50 rounded transition-colors"
						>
							view full details
						</button>
					)}

					<div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground/60 text-center">
						drag to move
					</div>
				</div>
			)}

			{/* Expanded detail modal */}
			{selectedLocation && showExpanded && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-40 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
					onClick={() => setShowExpanded(false)}
				>
					<div
						className="bg-surface border border-rose/30 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-in"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-border">
							<div>
								<div className="text-xs text-muted-foreground font-mono mb-1">LOCATION DETAILS</div>
								<h2 className="text-xl font-semibold text-rose">{selectedLocation.location}</h2>
							</div>
							<button
								type="button"
								onClick={() => setShowExpanded(false)}
								className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-xl"
							>
								&times;
							</button>
						</div>

						{/* Content */}
						<div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
							{/* Coordinates and dates */}
							<div className={`grid gap-4 mb-6 ${(selectedLocation.dates?.start || selectedLocation.dates?.end) ? "grid-cols-2" : "grid-cols-1"}`}>
								<div className="bg-background/50 p-3 rounded border border-border/50">
									<div className="text-xs text-muted-foreground font-mono mb-1">COORDINATES</div>
									<div className="text-sm font-mono text-rose">
										{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
									</div>
								</div>
								{(selectedLocation.dates?.start || selectedLocation.dates?.end) && (
								<div className="bg-background/50 p-3 rounded border border-border/50">
									<div className="text-xs text-muted-foreground font-mono mb-1">DATE RANGE</div>
									<div className="text-sm text-foreground">
										{selectedLocation.dates.start}
											{selectedLocation.dates.end && (selectedLocation.dates.start ? ` → ${selectedLocation.dates.end}` : selectedLocation.dates.end)}
									</div>
								</div>
								)}
							</div>

							{/* Photo Gallery */}
							{selectedLocation.photoUrls && selectedLocation.photoUrls.length > 0 && (
								<div className="mb-6">
									<div className="text-xs text-muted-foreground font-mono mb-3">
										PHOTOS ({selectedLocation.photoUrls.length})
									</div>
									<div className="grid grid-cols-3 md:grid-cols-4 gap-2">
										{selectedLocation.photoUrls.map((url, index) => (
											<button
												key={url}
												type="button"
												onClick={() => setViewingPhoto({ url, index })}
												className="relative aspect-square bg-background rounded-lg overflow-hidden border border-border hover:border-rose/50 transition-colors group"
											>
												<Image
													src={url}
													alt={`${selectedLocation.location} - ${index + 1}`}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 33vw, 25vw"
													unoptimized={isGif(url)}
													placeholder={isGif(url) ? "empty" : "blur"}
													blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQMEAQUAAAAAAAAAAAAAAQIDBAAFBhEhEiIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAQADAQEAAAAAAAAAAAAAAAEAAhEhA//aAAwDAQACEQMRAD8AyTG8guNjvEW5Q3AttJ3zjpChpQ4I+g6pMnymXyM/Xp3kl6YkqkOrUoqWtRJJJJJJJJPJJNKUq7V+CJE9J//Z"
												/>
												<div className="absolute top-1 left-1 w-5 h-5 bg-rose text-background text-xs font-bold rounded-full flex items-center justify-center shadow z-10">
													{index + 1}
												</div>
												<div className="absolute inset-0 bg-rose/20 opacity-0 group-hover:opacity-100 transition-opacity" />
											</button>
										))}
									</div>
								</div>
							)}

							{/* Notes with Markdown */}
							{selectedLocation.content && (
								<div>
									<div className="text-xs text-muted-foreground font-mono mb-3">NOTES</div>
									<div className="bg-background/30 rounded-lg p-4 border border-border/30">
										<Markdown content={selectedLocation.content} />
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Photo Lightbox */}
			{viewingPhoto && selectedLocation?.photoUrls && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
					onClick={() => setViewingPhoto(null)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setViewingPhoto(null);
						if (e.key === "ArrowLeft" && viewingPhoto.index > 0) {
							const newIndex = viewingPhoto.index - 1;
							const photoUrls = selectedLocation.photoUrls;
							if (photoUrls)
								setViewingPhoto({ url: photoUrls[newIndex], index: newIndex });
						}
						if (
							e.key === "ArrowRight" &&
							selectedLocation.photoUrls &&
							viewingPhoto.index < selectedLocation.photoUrls.length - 1
						) {
							const newIndex = viewingPhoto.index + 1;
							const photoUrls = selectedLocation.photoUrls;
							if (photoUrls)
								setViewingPhoto({ url: photoUrls[newIndex], index: newIndex });
						}
					}}
					tabIndex={0}
				>
					<div
						className="relative max-w-4xl max-h-[90vh] p-4"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Close button */}
						<button
							type="button"
							onClick={() => setViewingPhoto(null)}
							className="absolute -top-2 -right-2 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-rose/50 transition-colors z-10"
						>
							&times;
						</button>

						{/* Image number indicator */}
						<div className="absolute top-2 left-2 px-2 py-1 bg-rose text-background text-sm font-bold rounded z-10">
							{viewingPhoto.index + 1} / {selectedLocation.photoUrls.length}
						</div>

						{/* Main image */}
						<div className="relative w-[80vw] h-[80vh]">
							<Image
							src={viewingPhoto.url}
							alt={`${selectedLocation.location} - ${viewingPhoto.index + 1}`}
								fill
								className="object-contain"
								sizes="80vw"
								unoptimized={isGif(viewingPhoto.url)}
								priority
						/>
						</div>

						{/* Navigation */}
						<div className="absolute inset-y-0 left-0 flex items-center">
							{viewingPhoto.index > 0 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										const newIndex = viewingPhoto.index - 1;
										const photoUrls = selectedLocation.photoUrls;
										if (photoUrls)
											setViewingPhoto({
												url: photoUrls[newIndex],
												index: newIndex,
											});
									}}
									className="ml-2 w-10 h-10 bg-surface/80 border border-border rounded-full flex items-center justify-center text-foreground hover:bg-surface hover:border-rose/50 transition-colors"
								>
									&larr;
								</button>
							)}
						</div>
						<div className="absolute inset-y-0 right-0 flex items-center">
							{viewingPhoto.index < selectedLocation.photoUrls.length - 1 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										const newIndex = viewingPhoto.index + 1;
										const photoUrls = selectedLocation.photoUrls;
										if (photoUrls)
											setViewingPhoto({
												url: photoUrls[newIndex],
												index: newIndex,
											});
									}}
									className="mr-2 w-10 h-10 bg-surface/80 border border-border rounded-full flex items-center justify-center text-foreground hover:bg-surface hover:border-rose/50 transition-colors"
								>
									&rarr;
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Locations list - Desktop */}
			<div className="absolute top-16 left-4 w-48 bg-surface/90 backdrop-blur-sm border border-border rounded-lg z-20 hidden md:block">
				<div className="p-2 border-b border-border">
					<span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
						destinations
					</span>
				</div>
				<div className="p-1 max-h-64 overflow-y-auto">
					{locations?.map((loc) => (
						<button
							type="button"
							key={loc._id}
							onClick={() => {
								setSelectedLocation(loc);
								map.current?.flyTo({
									center: [loc.coordinates.lng, loc.coordinates.lat],
									zoom: 5,
									duration: 1500,
								});
							}}
							className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
								selectedLocation?._id === loc._id
									? "bg-rose/20 text-rose"
									: "hover:bg-rose/10 text-foreground"
							}`}
						>
							{loc.location}
						</button>
					))}
					{(!locations || locations.length === 0) && (
						<div className="px-3 py-4 text-sm text-muted-foreground text-center">
							no destinations yet
						</div>
					)}
				</div>
			</div>

			{/* Mobile destinations toggle */}
			<button
				type="button"
				onClick={() => setShowMobileDestinations(!showMobileDestinations)}
				className="md:hidden absolute top-16 left-4 px-3 py-2 bg-surface/90 backdrop-blur-sm border border-border rounded-lg z-20 text-xs font-mono text-muted-foreground"
			>
				{showMobileDestinations ? "hide" : "destinations"} ({locations?.length || 0})
			</button>

			{/* Mobile destinations list */}
			{showMobileDestinations && (
				<div className="md:hidden absolute top-28 left-4 right-4 bg-surface/95 backdrop-blur-sm border border-border rounded-lg z-20 animate-fade-in">
					<div className="p-2 border-b border-border flex items-center justify-between">
						<span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
							destinations
						</span>
						<button
							type="button"
							onClick={() => setShowMobileDestinations(false)}
							className="text-muted-foreground hover:text-foreground"
						>
							&times;
						</button>
					</div>
					<div className="p-1 max-h-48 overflow-y-auto">
						{locations?.map((loc) => (
							<button
								type="button"
								key={loc._id}
								onClick={() => {
									setSelectedLocation(loc);
									setShowMobileDestinations(false);
									map.current?.flyTo({
										center: [loc.coordinates.lng, loc.coordinates.lat],
										zoom: 5,
										duration: 1500,
									});
								}}
								className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
									selectedLocation?._id === loc._id
										? "bg-rose/20 text-rose"
										: "text-foreground active:bg-rose/10"
								}`}
							>
								{loc.location}
							</button>
						))}
						{(!locations || locations.length === 0) && (
							<div className="px-3 py-4 text-sm text-muted-foreground text-center">
								no destinations yet
							</div>
						)}
					</div>
				</div>
			)}

			{/* Custom styles */}
			<style jsx global>{`
				.travel-marker {
					cursor: pointer;
				}

				.marker-dot {
					width: 10px;
					height: 10px;
					background: #e8a6a6;
					border-radius: 50%;
					border: 2px solid #221f22;
					box-shadow: 0 0 12px rgba(232, 166, 166, 0.6);
				}

				.marker-pulse {
					position: absolute;
					width: 20px;
					height: 20px;
					background: rgba(232, 166, 166, 0.4);
					border-radius: 50%;
					transform: translate(-5px, -5px);
					animation: pulse 2s ease-out infinite;
				}

				@keyframes pulse {
					0% {
						transform: translate(-5px, -5px) scale(1);
						opacity: 0.6;
					}
					100% {
						transform: translate(-5px, -5px) scale(2.5);
						opacity: 0;
					}
				}

				.scan-line {
					position: absolute;
					width: 100%;
					height: 1px;
					background: linear-gradient(
						to right,
						transparent,
						rgba(232, 166, 166, 0.3),
						transparent
					);
					animation: scan 6s linear infinite;
				}

				@keyframes scan {
					0% { top: 0; }
					100% { top: 100%; }
				}

				/* Style mapbox controls */
				.mapboxgl-ctrl-group {
					background: rgba(43, 38, 43, 0.9) !important;
					border: 1px solid #4a3b46 !important;
					backdrop-filter: blur(4px);
				}

				.mapboxgl-ctrl-group button {
					background-color: transparent !important;
					width: 30px !important;
					height: 30px !important;
				}

				.mapboxgl-ctrl-group button:hover {
					background-color: rgba(232, 166, 166, 0.15) !important;
				}

				.mapboxgl-ctrl-group button + button {
					border-top: 1px solid #4a3b46 !important;
				}

				.mapboxgl-ctrl button .mapboxgl-ctrl-icon {
					filter: invert(0.9) sepia(0.2) saturate(0.5) hue-rotate(300deg);
				}

				/* Hide mapbox logo */
				.mapboxgl-ctrl-logo {
					display: none !important;
				}

				/* Style attribution */
				.mapboxgl-ctrl-attrib {
					background: rgba(34, 31, 34, 0.7) !important;
					font-size: 9px !important;
					padding: 2px 5px !important;
				}

				.mapboxgl-ctrl-attrib a {
					color: #9A8F94 !important;
				}

				/* Compass styling */
				.mapboxgl-ctrl-compass {
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
				}

				/* Position bottom-right controls above cmdk button */
				.mapboxgl-ctrl-bottom-right {
					bottom: 3rem !important;
					right: 1rem !important;
				}
			`}</style>
		</div>
	);
}
