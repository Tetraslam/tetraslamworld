"use client";

import { useEffect, useState } from "react";

const SIZE = 6;
const TICK_MS = 350;

/** Standard glider, top-left. */
const GLIDER: [number, number][] = [
	[1, 0],
	[2, 1],
	[0, 2],
	[1, 2],
	[2, 2],
];

function initialGrid(): boolean[][] {
	const grid = Array.from({ length: SIZE }, () =>
		Array.from({ length: SIZE }, () => false),
	);
	for (const [x, y] of GLIDER) grid[y][x] = true;
	return grid;
}

/** One Game of Life step on a toroidal grid. */
function step(grid: boolean[][]): boolean[][] {
	return grid.map((row, y) =>
		row.map((alive, x) => {
			let neighbors = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					const ny = (y + dy + SIZE) % SIZE;
					const nx = (x + dx + SIZE) % SIZE;
					if (grid[ny][nx]) neighbors++;
				}
			}
			return alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
		}),
	);
}

/**
 * A live glider running actual Conway rules on a tiny wrapping grid.
 * Used on the 404 page: the page drifted off the grid; the glider is
 * genuinely out looking for it.
 */
export function Glider({ className }: { className?: string }) {
	const [grid, setGrid] = useState(initialGrid);

	useEffect(() => {
		const interval = setInterval(() => setGrid(step), TICK_MS);
		return () => clearInterval(interval);
	}, []);

	return (
		<pre
			aria-hidden="true"
			className={`leading-none select-none ${className ?? ""}`}
		>
			{grid
				.map((row) => row.map((cell) => (cell ? "██" : "  ")).join(""))
				.join("\n")}
		</pre>
	);
}
