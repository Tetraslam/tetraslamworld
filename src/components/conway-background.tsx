"use client";

import { conway } from "@rankdim/conway";
import { useEffect, useRef } from "react";

type ShapeType = "circle" | "triangle" | "diamond" | "hexagon" | "star" | "heart";

interface PolygonZone {
	cx: number; // center x
	cy: number; // center y
	size: number; // radius/size
	shape: ShapeType;
}

// Check if point is inside a polygon shape
function isInsideShape(px: number, py: number, zone: PolygonZone): boolean {
	const { cx, cy, size, shape } = zone;
	const dx = px - cx;
	const dy = py - cy;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const angle = Math.atan2(dy, dx);

	switch (shape) {
		case "circle":
			return dist <= size;

		case "triangle": {
			// Equilateral triangle pointing up
			const triSize = size * 1.2;
			const y1 = cy - triSize;
			const y2 = cy + triSize * 0.6;
			const x2 = cx - triSize * 0.9;
			const x3 = cx + triSize * 0.9;
			// Barycentric check
			const denom = (y2 - y1) * (x3 - cx) + (cx - x2) * (y1 - cy);
			if (Math.abs(denom) < 0.001) return false;
			const a = ((y2 - y1) * (px - cx) + (cx - x2) * (py - cy)) / denom;
			const b = ((cy - y1) * (px - cx) + (x2 - cx) * (py - cy)) / denom;
			const c = 1 - a - b;
			return a >= 0 && b >= 0 && c >= 0;
		}

		case "diamond":
			return Math.abs(dx) / size + Math.abs(dy) / size <= 1;

		case "hexagon": {
			// Regular hexagon
			const hexAngle = Math.abs((angle + Math.PI) % (Math.PI / 3) - Math.PI / 6);
			const hexRadius = size * Math.cos(Math.PI / 6) / Math.cos(hexAngle);
			return dist <= hexRadius;
		}

		case "star": {
			// 5-pointed star
			const starAngle = (angle + Math.PI * 2.5) % (Math.PI * 2);
			const spike = starAngle % (Math.PI * 0.4);
			const inner = size * 0.4;
			const outer = size;
			const starRadius = inner + (outer - inner) * (1 - Math.abs(spike - Math.PI * 0.2) / (Math.PI * 0.2));
			return dist <= starRadius;
		}

		case "heart": {
			// Heart shape approximation
			const hx = dx / size;
			const hy = -dy / size + 0.3;
			return (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy <= 0;
		}

		default:
			return dist <= size;
	}
}

function spawnRandomCells(game: ReturnType<typeof conway>, gridWidth: number, gridHeight: number) {
	// Center exclusion zone
	const centerX = gridWidth / 2;
	const centerY = gridHeight / 2;
	const exclusionW = gridWidth * 0.20;
	const exclusionH = gridHeight * 0.4;

	const isInCenter = (x: number, y: number) => {
		return (
			x > centerX - exclusionW / 2 &&
			x < centerX + exclusionW / 2 &&
			y > centerY - exclusionH / 2 &&
			y < centerY + exclusionH / 2
		);
	};

	// Create random polygon zones for soup clusters
	const zones: PolygonZone[] = [];
	const shapes: ShapeType[] = ["circle", "triangle", "diamond", "hexagon", "star", "heart"];
	const zoneCount = 4 + Math.floor(Math.random() * 8);
	const minSize = 8;
	const maxSize = 14;
	const minDistance = 12;

	// Check if zone overlaps with center content area (with padding)
	const overlapsCenter = (zone: PolygonZone) => {
		const padding = 10;
		const centerLeft = centerX - exclusionW / 2 - padding;
		const centerRight = centerX + exclusionW / 2 + padding;
		const centerTop = centerY - exclusionH / 2 - padding;
		const centerBottom = centerY + exclusionH / 2 + padding;

		// Check bounding box
		return !(zone.cx - zone.size > centerRight || 
				 zone.cx + zone.size < centerLeft || 
				 zone.cy - zone.size > centerBottom || 
				 zone.cy + zone.size < centerTop);
	};

	const isTooClose = (zone: PolygonZone) => {
		if (overlapsCenter(zone)) return true;

		for (const existing of zones) {
			const dx = zone.cx - existing.cx;
			const dy = zone.cy - existing.cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < zone.size + existing.size + minDistance) return true;
		}
		return false;
	};

	// Generate polygon zones
	const margin = 8;
	for (let i = 0; i < zoneCount; i++) {
		let attempts = 0;
		while (attempts < 50) {
			const size = minSize + Math.floor(Math.random() * (maxSize - minSize));
			const cx = margin + size + Math.floor(Math.random() * (gridWidth - size * 2 - margin * 2));
			const cy = margin + size + Math.floor(Math.random() * (gridHeight - size * 2 - margin * 2));
			const shape = shapes[Math.floor(Math.random() * shapes.length)];

			const zone = { cx, cy, size, shape };
			if (!isTooClose(zone)) {
				zones.push(zone);
				break;
			}
			attempts++;
		}
	}

	// Fill polygon zones with random soup
	const density = 0.22;
	for (const zone of zones) {
		const bounds = Math.ceil(zone.size) + 2;
		for (let dy = -bounds; dy <= bounds; dy++) {
			for (let dx = -bounds; dx <= bounds; dx++) {
				const x = Math.floor(zone.cx + dx);
				const y = Math.floor(zone.cy + dy);
				if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
				if (isInCenter(x, y)) continue;
				if (isInsideShape(x, y, zone) && Math.random() < density) {
					game.place([[1]], x, y);
				}
			}
		}
	}
}

export function ConwayBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<ReturnType<typeof conway> | null>(null);
	const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const perturbIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const gridDimensionsRef = useRef({ width: 0, height: 0 });

	useEffect(() => {
		if (!canvasRef.current) return;

		const cellSize = 14;

		// Center exclusion check for perturbations
		const isInCenter = (x: number, y: number, gridWidth: number, gridHeight: number) => {
			const centerX = gridWidth / 2;
			const centerY = gridHeight / 2;
			const exclusionW = gridWidth * 0.28;
			const exclusionH = gridHeight * 0.4;
			return (
				x > centerX - exclusionW / 2 &&
				x < centerX + exclusionW / 2 &&
				y > centerY - exclusionH / 2 &&
				y < centerY + exclusionH / 2
			);
		};

		// Periodically add random perturbations
		const perturbGame = () => {
			const game = gameRef.current;
			if (!game) return;

			const { width: gridWidth, height: gridHeight } = gridDimensionsRef.current;
			const margin = 5;

			// Spawn 2-5 random live cells outside exclusion zone
			const spawnCount = 2 + Math.floor(Math.random() * 4);
			for (let i = 0; i < spawnCount; i++) {
				let attempts = 0;
				while (attempts < 20) {
					const x = margin + Math.floor(Math.random() * (gridWidth - margin * 2));
					const y = margin + Math.floor(Math.random() * (gridHeight - margin * 2));
					if (!isInCenter(x, y, gridWidth, gridHeight)) {
						game.place([[1]], x, y);
						break;
					}
					attempts++;
				}
			}

			// Spawn small "eraser" patterns (2x2 dead zones) at random spots to break up masses
			// Since we can't directly kill cells, place a small dead pattern that disrupts
			const eraserCount = 1 + Math.floor(Math.random() * 2);
			for (let i = 0; i < eraserCount; i++) {
				const x = margin + Math.floor(Math.random() * (gridWidth - margin * 2 - 2));
				const y = margin + Math.floor(Math.random() * (gridHeight - margin * 2 - 2));
				if (!isInCenter(x, y, gridWidth, gridHeight)) {
					// Place a "block" still life which can disrupt growing patterns
					game.place([[1, 1], [1, 1]], x, y);
				}
			}
		};

		const initGame = () => {
			if (gameRef.current) {
				gameRef.current.stop();
			}

			const gridWidth = Math.ceil(window.innerWidth / cellSize) + 2;
			const gridHeight = Math.ceil(window.innerHeight / cellSize) + 2;
			gridDimensionsRef.current = { width: gridWidth, height: gridHeight };

			const game = conway(canvasRef.current!.id, {
				cellSize,
				gridWidth,
				gridHeight,
				backgroundColor: "rgba(34, 31, 34, 0)",
				cellColor: "rgba(232, 166, 166, 0.6)",
				deadCellColor: "rgba(34, 31, 34, 0)",
				gridColor: "rgba(0, 0, 0, 0)",
				showGrid: false,
				showDead: false,
				animationSpeed: 250,
				toroidal: true,
			});

			spawnRandomCells(game, gridWidth, gridHeight);
			game.start();
			gameRef.current = game;
		};

		initGame();

		// Reset every 45 seconds with fresh random patterns
		resetIntervalRef.current = setInterval(() => {
			initGame();
		}, 45000);

		// Perturb every 3 seconds to keep things dynamic
		perturbIntervalRef.current = setInterval(() => {
			perturbGame();
		}, 3000);

		const handleResize = () => {
			initGame();
		};

		let resizeTimeout: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(handleResize, 250);
		};

		window.addEventListener("resize", debouncedResize);

		return () => {
			window.removeEventListener("resize", debouncedResize);
			clearTimeout(resizeTimeout);
			if (resetIntervalRef.current) {
				clearInterval(resetIntervalRef.current);
			}
			if (perturbIntervalRef.current) {
				clearInterval(perturbIntervalRef.current);
			}
			if (gameRef.current) {
				gameRef.current.stop();
			}
		};
	}, []);

	return (
		<canvas
			id="conway-bg"
			ref={canvasRef}
			className="fixed inset-0 -z-10 pointer-events-none"
			aria-hidden="true"
		/>
	);
}
