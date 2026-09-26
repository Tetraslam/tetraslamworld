export const MOSAIC_SIZE = 32;
export type Cell = { x: number; y: number };
export type Draft = Cell & { color: string };

export function moveCell(cell: Cell, key: string): Cell {
  const { x, y } = cell;
  switch (key) {
    case "ArrowLeft":
      return { x: Math.max(0, x - 1), y };
    case "ArrowRight":
      return { x: Math.min(MOSAIC_SIZE - 1, x + 1), y };
    case "ArrowUp":
      return { x, y: Math.max(0, y - 1) };
    case "ArrowDown":
      return { x, y: Math.min(MOSAIC_SIZE - 1, y + 1) };
    case "Home":
      return { x: 0, y };
    case "End":
      return { x: MOSAIC_SIZE - 1, y };
    default:
      return cell;
  }
}

// One in-flight placement per editor. The submitted value is a snapshot, so
// a late callback can never accidentally place a later colour/selection.
export function createPlacementGate() {
  let pending = false;
  return {
    get pending() {
      return pending;
    },
    async place(draft: Draft, write: (draft: Draft) => Promise<unknown>) {
      if (pending) return false;
      if (
        !Number.isInteger(draft.x) ||
        !Number.isInteger(draft.y) ||
        draft.x < 0 ||
        draft.y < 0 ||
        draft.x >= MOSAIC_SIZE ||
        draft.y >= MOSAIC_SIZE ||
        !/^#[\da-f]{6}$/i.test(draft.color)
      )
        throw new Error("Invalid mosaic draft");
      pending = true;
      try {
        await write({ ...draft });
        return true;
      } finally {
        pending = false;
      }
    },
  };
}
