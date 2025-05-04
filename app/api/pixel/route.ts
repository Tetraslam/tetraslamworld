import { NextRequest, NextResponse } from 'next/server';
import { getBoard, setPixel } from '@/lib/pixel-board';

export async function GET() {
  const board = await getBoard();
  return NextResponse.json(board, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const { x, y, color } = await req.json();
  const board = await setPixel(x, y, color);
  return NextResponse.json(board);
} 