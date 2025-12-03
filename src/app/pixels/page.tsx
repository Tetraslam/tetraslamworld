"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { useDevice } from "@/hooks/use-device";
import { api } from "../../../convex/_generated/api";

const GRID_SIZE = 32;
const CELL_SIZE_DESKTOP = 16;
const CELL_SIZE_MOBILE = 12;

const COLORS = [
	"#E8A6A6", // rose
	"#D46A7A", // rose-deep
	"#F7F4F1", // foreground
	"#221F22", // background
	"#2B262B", // surface
	"#4A3B46", // border
	"#9A8F94", // muted
	"#FF6B6B", // red
	"#4ECDC4", // teal
	"#FFE66D", // yellow
	"#95E1D3", // mint
	"#F38181", // coral
];

interface Pixel {
	x: number;
	y: number;
	color: string;
	clerkId?: string;
	placedAt: number;
	username?: string;
}

export default function PixelsPage() {
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const { openSignIn } = useClerk();
	const { isMobile } = useDevice();
	const pixels = useQuery(api.pixelBoard.getAll, {}) as Pixel[] | undefined;
	const placePixel = useMutation(api.pixelBoard.place);
	const [selectedColor, setSelectedColor] = useState(COLORS[0]);
	// Desktop: hover preview. Mobile: selected cell (tap to select, tap again to place)
	const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
	const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
	const [placing, setPlacing] = useState(false);

	const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;

	const pixelMap = new Map<string, Pixel>();
	pixels?.forEach((p) => {
		pixelMap.set(`${p.x},${p.y}`, p);
	});

	// On mobile, use selectedCell for info display; on desktop use hoveredCell
	const activeCell = isMobile ? selectedCell : hoveredCell;
	const activePixel = activeCell ? pixelMap.get(`${activeCell.x},${activeCell.y}`) : null;

	const placeAtCell = useCallback(
		async (x: number, y: number) => {
			if (!isSignedIn || !user) {
				openSignIn();
				return;
			}
			if (placing) return;
			setPlacing(true);
			try {
				await placePixel({
					x,
					y,
					color: selectedColor,
					clerkId: user.id,
					username: user.username || user.firstName || undefined,
				});
				// Clear selection after placing on mobile
				if (isMobile) setSelectedCell(null);
			} catch (err) {
				console.error("Failed to place pixel:", err);
			} finally {
				setPlacing(false);
			}
		},
		[isSignedIn, user, placePixel, selectedColor, placing, openSignIn, isMobile]
	);

	const handleCellClick = useCallback(
		(x: number, y: number) => {
			if (isMobile) {
				// Mobile: tap to select, tap selected cell again to place
				if (selectedCell?.x === x && selectedCell?.y === y) {
					// Same cell - place pixel
					placeAtCell(x, y);
				} else {
					// Different cell - select it
					setSelectedCell({ x, y });
				}
			} else {
				// Desktop: click to place immediately
				placeAtCell(x, y);
			}
		},
		[isMobile, selectedCell, placeAtCell]
	);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-6 animate-fade-in">
				<div>
					<h1 className="text-3xl font-bold">pixel board</h1>
					<p className="text-muted-foreground mt-1">
						collaborative pixel art - leave your mark
					</p>
				</div>

				{/* Color picker + Info */}
				<div className="flex flex-col md:flex-row gap-4 p-4 bg-surface border border-border rounded-lg">
					{/* Colors */}
					<div className="flex flex-wrap gap-2 items-center flex-1">
						<span className="text-sm text-muted-foreground mr-2">color:</span>
						{COLORS.map((color) => (
							<button
								type="button"
								key={color}
								onClick={() => setSelectedColor(color)}
								className={`w-8 h-8 md:w-7 md:h-7 rounded-lg border-2 transition-all ${
									selectedColor === color
										? "border-foreground scale-110 shadow-lg"
										: "border-transparent hover:scale-105 hover:border-border"
								}`}
								style={{ backgroundColor: color }}
								title={color}
								aria-label={`Select color ${color}`}
							/>
						))}
					</div>

					{/* Divider */}
					<div className="hidden md:block w-px bg-border" />
					<div className="md:hidden h-px bg-border" />

					{/* Info - Desktop: fixed width on right, Mobile: full width below */}
					<div className="flex flex-col justify-center text-xs text-muted-foreground md:min-w-[200px]">
						{/* Desktop info - always same structure */}
						<div className="hidden md:block">
							<p className="font-mono">
								{hoveredCell ? `(${hoveredCell.x}, ${hoveredCell.y})` : "hover to see position"}
							</p>
							{hoveredCell && activePixel ? (
								<p>
									<span className="text-rose">{activePixel.username || "anonymous"}</span>
									{" - "}
									{new Date(activePixel.placedAt).toLocaleDateString()}
								</p>
							) : (
								<p className="text-muted-foreground/50">click to place</p>
							)}
							<p className="mt-1">
								<span className="text-rose font-medium">{pixels?.length ?? 0}</span> pixels placed
							</p>
						</div>

						{/* Mobile info */}
						<div className="md:hidden">
							{selectedCell ? (
								<>
									<p className="font-mono text-foreground">
										({selectedCell.x}, {selectedCell.y})
										<span className="ml-2 text-rose">tap again to place</span>
									</p>
									{activePixel ? (
										<p>
											placed by <span className="text-rose">{activePixel.username || "anonymous"}</span>
											{" - "}
											{new Date(activePixel.placedAt).toLocaleDateString()}
										</p>
									) : (
										<p className="text-muted-foreground/50">empty cell</p>
									)}
								</>
							) : (
								<p>tap a cell to select, tap again to place</p>
							)}
							<div className="flex items-center justify-between mt-2">
								<p>
									<span className="text-rose font-medium">{pixels?.length ?? 0}</span> pixels placed
								</p>
								{!isSignedIn && (
									<button
										type="button"
										onClick={() => openSignIn()}
										className="text-rose-deep hover:text-rose transition-colors"
									>
										sign in to place
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Mobile: Place button when cell is selected */}
				{isMobile && selectedCell && (
					<button
						type="button"
						onClick={() => placeAtCell(selectedCell.x, selectedCell.y)}
						disabled={placing}
						className="w-full py-3 bg-rose text-background rounded-lg font-medium hover:bg-rose-deep transition-colors disabled:opacity-50"
					>
						{placing ? "placing..." : `place at (${selectedCell.x}, ${selectedCell.y})`}
					</button>
				)}

				{/* Grid */}
				<div className="overflow-auto pb-4 -mx-4 px-4">
					<div
						className="grid border border-border bg-surface rounded-lg overflow-hidden mx-auto touch-manipulation"
						style={{
							gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
							width: GRID_SIZE * cellSize,
							height: GRID_SIZE * cellSize,
						}}
					>
						{Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
							const x = i % GRID_SIZE;
							const y = Math.floor(i / GRID_SIZE);
							const pixel = pixelMap.get(`${x},${y}`);
							const isHovered = !isMobile && hoveredCell?.x === x && hoveredCell?.y === y;
							const isSelected = isMobile && selectedCell?.x === x && selectedCell?.y === y;
							const isActive = isHovered || isSelected;

							return (
								<button
									type="button"
									key={`${x}-${y}`}
									onClick={() => handleCellClick(x, y)}
									onMouseEnter={() => !isMobile && setHoveredCell({ x, y })}
									onMouseLeave={() => !isMobile && setHoveredCell(null)}
									disabled={placing}
									className="border border-border/20 transition-all"
									style={{
										width: cellSize,
										height: cellSize,
										backgroundColor: isActive ? selectedColor : pixel?.color || "transparent",
										opacity: isActive && !pixel ? 0.7 : 1,
										transform: isActive ? "scale(1.15)" : "scale(1)",
										zIndex: isActive ? 10 : 1,
										boxShadow: isSelected ? `0 0 0 2px ${selectedColor}` : undefined,
									}}
									aria-label={`Cell ${x}, ${y}${pixel ? ` - placed by ${pixel.username || "anonymous"}` : ""}`}
								/>
							);
						})}
					</div>
				</div>

				{/* Mobile hint */}
				{isMobile && !selectedCell && (
					<p className="text-center text-xs text-muted-foreground">
						scroll to pan, tap to select a cell
					</p>
				)}
			</div>
		</div>
	);
}
