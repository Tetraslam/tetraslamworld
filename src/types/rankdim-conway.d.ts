declare module "@rankdim/conway" {
	export interface ConwayOptions {
		cellSize?: number;
		cellColor?: string;
		backgroundColor?: string;
		deadCellColor?: string;
		gridColor?: string;
		fps?: number;
		gridWidth?: number;
		gridHeight?: number;
		toroidal?: boolean;
		showGrid?: boolean;
		showDead?: boolean;
		animationSpeed?: number;
	}

	export interface ConwayInstance {
		start: () => void;
		stop: () => void;
		clear: () => void;
		randomize: (density?: number) => void;
		setCell: (x: number, y: number, alive: boolean) => void;
		getCell: (x: number, y: number) => boolean;
		resize: () => void;
		place: (pattern: number[][], x: number, y: number) => void;
	}

	export function conway(canvasId: string, options?: ConwayOptions): ConwayInstance;

	export const patterns: {
		glider: number[][];
		blinker: number[][];
		toad: number[][];
		beacon: number[][];
		pulsar: number[][];
		pentadecathlon: number[][];
		lwss: number[][];
		mwss: number[][];
		hwss: number[][];
		gliderGun: number[][];
		acorn: number[][];
		rPentomino: number[][];
		diehard: number[][];
		[key: string]: number[][];
	};
}
