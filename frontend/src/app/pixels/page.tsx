"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";

const GRID_SIZE = 32;
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

export default function PixelsPage() {
	const { isSignedIn } = useAuth();
	const pixels = useQuery(api.pixelBoard.getAll);
	const placePixel = useMutation(api.pixelBoard.place);
	const [selectedColor, setSelectedColor] = useState(COLORS[0]);
	const [hoveredCell, setHoveredCell] = useState<{
		x: number;
		y: number;
	} | null>(null);

	const pixelMap = new Map<string, string>();
	pixels?.forEach((p) => {
		pixelMap.set(`${p.x},${p.y}`, p.color);
	});

	const handleCellClick = useCallback(
		async (x: number, y: number) => {
			if (!isSignedIn) {
				alert("Sign in to place pixels!");
				return;
			}
			try {
				await placePixel({ x, y, color: selectedColor });
			} catch (err) {
				console.error("Failed to place pixel:", err);
			}
		},
		[isSignedIn, placePixel, selectedColor],
	);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold">pixel board</h1>
					<p className="text-muted-foreground mt-1">
						collaborative pixel art - leave your mark
					</p>
				</div>

				{/* Color picker */}
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-sm text-muted-foreground">color:</span>
					{COLORS.map((color) => (
						<button
							key={color}
							onClick={() => setSelectedColor(color)}
							className={`w-6 h-6 rounded border-2 transition-transform ${
								selectedColor === color
									? "border-foreground scale-110"
									: "border-border hover:scale-105"
							}`}
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>

				{/* Grid */}
				<div className="overflow-auto">
					<div
						className="grid border border-border bg-surface"
						style={{
							gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
							width: GRID_SIZE * 16,
							height: GRID_SIZE * 16,
						}}
					>
						{Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
							const x = i % GRID_SIZE;
							const y = Math.floor(i / GRID_SIZE);
							const color = pixelMap.get(`${x},${y}`);
							const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

							return (
								<button
									key={`${x}-${y}`}
									onClick={() => handleCellClick(x, y)}
									onMouseEnter={() => setHoveredCell({ x, y })}
									onMouseLeave={() => setHoveredCell(null)}
									className="w-4 h-4 border border-border/30 transition-colors"
									style={{
										backgroundColor: isHovered
											? selectedColor
											: color || "transparent",
										opacity: isHovered && !color ? 0.5 : 1,
									}}
								/>
							);
						})}
					</div>
				</div>

				{/* Info */}
				<div className="text-xs text-muted-foreground space-y-1">
					{hoveredCell && (
						<p>
							position: ({hoveredCell.x}, {hoveredCell.y})
						</p>
					)}
					<p>{pixels?.length ?? 0} pixels placed</p>
					{!isSignedIn && (
						<p className="text-rose-deep">sign in to place pixels</p>
					)}
				</div>
			</div>
		</div>
	);
}
