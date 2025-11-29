"use client";

import { conway, patterns } from "@rankdim/conway";
import { useEffect, useRef } from "react";

type Pattern = number[][];
const allPatterns: Pattern[] = [
	patterns.glider,
	patterns.blinker,
	patterns.toad,
	patterns.beacon,
];

function placePatterns(game: ReturnType<typeof conway>, gridWidth: number, gridHeight: number) {
	// Random number of patterns (8-15)
	const count = 8 + Math.floor(Math.random() * 8);

	// Center exclusion zone (where the main content is)
	const centerX = gridWidth / 2;
	const centerY = gridHeight / 2;
	const exclusionW = gridWidth * 0.35; // 35% width exclusion
	const exclusionH = gridHeight * 0.4; // 40% height exclusion

	const isInCenter = (x: number, y: number) => {
		return (
			x > centerX - exclusionW / 2 &&
			x < centerX + exclusionW / 2 &&
			y > centerY - exclusionH / 2 &&
			y < centerY + exclusionH / 2
		);
	};

	for (let i = 0; i < count; i++) {
		// Pick random pattern
		const pattern = allPatterns[Math.floor(Math.random() * allPatterns.length)];

		// Random position, retry if in center
		const margin = 5;
		let x: number, y: number;
		let attempts = 0;
		do {
			x = margin + Math.floor(Math.random() * (gridWidth - margin * 2));
			y = margin + Math.floor(Math.random() * (gridHeight - margin * 2));
			attempts++;
		} while (isInCenter(x, y) && attempts < 20);

		game.place(pattern, x, y);
	}
}

export function ConwayBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<ReturnType<typeof conway> | null>(null);
	const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		const cellSize = 14;

		const initGame = () => {
			if (gameRef.current) {
				gameRef.current.stop();
			}

			const gridWidth = Math.ceil(window.innerWidth / cellSize) + 2;
			const gridHeight = Math.ceil(window.innerHeight / cellSize) + 2;

			const game = conway(canvasRef.current!.id, {
				cellSize,
				gridWidth,
				gridHeight,
				backgroundColor: "rgba(34, 31, 34, 0)",
				cellColor: "rgba(232, 166, 166, 0.35)",
				deadCellColor: "rgba(34, 31, 34, 0)",
				gridColor: "rgba(0, 0, 0, 0)",
				showGrid: false,
				showDead: false,
				animationSpeed: 250,
				toroidal: true,
			});

			placePatterns(game, gridWidth, gridHeight);
			game.start();
			gameRef.current = game;
		};

		initGame();

		// Reset every 30 seconds with fresh random patterns
		resetIntervalRef.current = setInterval(() => {
			initGame();
		}, 30000);

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
