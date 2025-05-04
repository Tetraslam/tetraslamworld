'use client';
import useSWR, { mutate } from 'swr';
import { BOARD_SIZE, type PixelBoard } from '@/lib/pixel-board';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#FFA500', '#FFFF00', '#008000', '#00FFFF', '#0000FF', '#800080', '#FFC0CB',
];

export default function PixelBoardComponent() {
  const { data: board } = useSWR<PixelBoard>('/api/pixel', fetcher, { refreshInterval: 3000 });
  const [color, setColor] = useState<string>('#FF0000');
  const [painting, setPainting] = useState(false);

  const handlePaint = useCallback(
    async (x: number, y: number) => {
      await fetch('/api/pixel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, color }),
      });
      mutate('/api/pixel');
    },
    [color]
  );

  if (!board) return <p className="text-center">Loading board…</p>;

  return (
    <div className="space-y-6">
      {/* palette */}
      <div className="flex flex-wrap gap-2 justify-center">
        {COLORS.map((c) => (
          <button
            key={c}
            className={cn('w-6 h-6 border border-border', c === color && 'ring-2 ring-accent')}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      {/* grid */}
      <div className="flex justify-center">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 24px)` }}
          onMouseDown={() => setPainting(true)}
          onMouseUp={() => setPainting(false)}
          onMouseLeave={() => setPainting(false)}
        >
          {board.flatMap((row, y) =>
            row.map((cellColor, x) => (
              <div
                key={`${x}-${y}`}
                onClick={() => handlePaint(x, y)}
                onMouseEnter={() => painting && handlePaint(x, y)}
                style={{ backgroundColor: cellColor }}
                className="w-6 h-6 border border-secondary/50 cursor-crosshair"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 