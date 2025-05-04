'use client';
import dynamic from 'next/dynamic';

const NowPlayingDynamic = dynamic(() => import('@/app/components/now-playing').then(m => m.NowPlaying), { ssr: false });

export default function NowPlayingWrapper() {
  return <NowPlayingDynamic />;
} 