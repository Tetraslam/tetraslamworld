"use client";

import { conway, patterns } from "@rankdim/conway";
import { useEffect, useRef } from "react";

// Define custom patterns as 2D arrays (1 = alive, 0 = dead)
const customPatterns = {
	block: [
		[1, 1],
		[1, 1],
	],
	beehive: [
		[0, 1, 1, 0],
		[1, 0, 0, 1],
		[0, 1, 1, 0],
	],
	loaf: [
		[0, 1, 1, 0],
		[1, 0, 0, 1],
		[0, 1, 0, 1],
		[0, 0, 1, 0],
	],
	boat: [
		[1, 1, 0],
		[1, 0, 1],
		[0, 1, 0],
	],
};

type Pattern = number[][];

function getPatternSize(pattern: Pattern): { width: number; height: number } {
	return {
		height: pattern.length,
		width: pattern[0]?.length ?? 0,
	};
}

export function ConwayStatic() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const initialized = useRef(false);

	useEffect(() => {
		if (!canvasRef.current || initialized.current) return;
		initialized.current = true;

		const cellSize = 12;
		const gridWidth = Math.ceil(window.innerWidth / cellSize) + 4;
		const gridHeight = Math.ceil(window.innerHeight / cellSize) + 4;

		const game = conway(canvasRef.current.id, {
			cellSize,
			gridWidth,
			gridHeight,
			backgroundColor: "rgba(34, 31, 34, 0)",
			cellColor: "rgba(232, 166, 166, 0.04)",
			deadCellColor: "rgba(34, 31, 34, 0)",
			gridColor: "rgba(0, 0, 0, 0)",
			showGrid: false,
			showDead: false,
			animationSpeed: 1000000,
			toroidal: true,
		});

		// Use library patterns + custom ones, filter out any undefined
		const allPatterns: Pattern[] = [
			patterns.glider,
			patterns.blinker,
			patterns.toad,
			patterns.beacon,
			customPatterns.block,
			customPatterns.beehive,
			customPatterns.loaf,
			customPatterns.boat,
		].filter(Boolean) as Pattern[];

		// Safe placement function that accounts for pattern size
		const placePattern = (pattern: Pattern, x: number, y: number) => {
			const { width, height } = getPatternSize(pattern);
			// Ensure pattern fits within grid bounds
			const safeX = Math.min(x, gridWidth - width - 1);
			const safeY = Math.min(y, gridHeight - height - 1);
			if (safeX >= 0 && safeY >= 0) {
				game.place(pattern, safeX, safeY);
			}
		};

		const sectionsX = 6;
		const sectionsY = 4;
		const sectionWidth = gridWidth / sectionsX;
		const sectionHeight = gridHeight / sectionsY;
		const margin = 10; // Keep patterns away from edges

		for (let sx = 0; sx < sectionsX; sx++) {
			for (let sy = 0; sy < sectionsY; sy++) {
				if (Math.random() > 0.3) {
					const pattern =
						allPatterns[Math.floor(Math.random() * allPatterns.length)];
					const x = Math.floor(
						margin + sx * sectionWidth + Math.random() * (sectionWidth - margin * 2)
					);
					const y = Math.floor(
						margin + sy * sectionHeight + Math.random() * (sectionHeight - margin * 2)
					);
					placePattern(pattern, x, y);
				}
			}
		}

		const extraCount = 8 + Math.floor(Math.random() * 6);
		for (let i = 0; i < extraCount; i++) {
			const pattern =
				allPatterns[Math.floor(Math.random() * allPatterns.length)];
			const x = Math.floor(margin + Math.random() * (gridWidth - margin * 2));
			const y = Math.floor(margin + Math.random() * (gridHeight - margin * 2));
			placePattern(pattern, x, y);
		}
	}, []);

	return (
		<canvas
			id="conway-static-bg"
			ref={canvasRef}
			className="fixed inset-0 -z-10 pointer-events-none"
			aria-hidden="true"
		/>
	);
}
