import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const BOARD_KEY = 'pixel-board-v1';
export const BOARD_SIZE = 16; // 32x32

export type PixelBoard = string[][]; // hex color string per pixel

function emptyBoard(): PixelBoard {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => '#000000'));
}

export async function getBoard(): Promise<PixelBoard> {
  const data = await redis.get<PixelBoard>(BOARD_KEY);
  if (data) return data;
  const board = emptyBoard();
  await redis.set(BOARD_KEY, board);
  return board;
}

export async function setPixel(x: number, y: number, color: string) {
  const board = await getBoard();
  if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
    board[y][x] = color;
    await redis.set(BOARD_KEY, board);
  }
  return board;
} 