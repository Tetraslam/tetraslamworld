import { NextResponse } from 'next/server';
import { getNowPlaying } from '@/lib/spotify';

export async function GET() {
  try {
    const track = await getNowPlaying();
    return NextResponse.json(track ?? { isPlaying: false }, { headers: { 'cache-control': 's-maxage=30, stale-while-revalidate=30' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 