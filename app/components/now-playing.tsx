'use client';
import useSWR from 'swr';
import Image from 'next/image';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function NowPlaying() {
  const { data } = useSWR('/api/spotify', fetcher, { refreshInterval: 30_000 });
  if (!data || !data.isPlaying) return null;

  return (
    <a
      href={data.songUrl}
      target="_blank"
      className="fixed bottom-20 right-4 flex items-center gap-3 bg-card/60 backdrop-blur-md border border-border p-3 rounded-sm hover:bg-card/80 transition-colors"
      rel="noopener noreferrer"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        className="relative w-10 h-10 rounded-full overflow-hidden"
      >
        <Image src={data.albumArt} alt="album art" fill className="object-cover" />
      </motion.div>
      <div className="text-xs">
        <p className="font-semibold leading-none text-primary">{data.title}</p>
        <p className="text-muted-foreground leading-none">{data.artist}</p>
      </div>
    </a>
  );
} 