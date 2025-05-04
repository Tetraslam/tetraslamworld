import PixelBoardClient from '@/components/client/PixelBoardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pixel Board – Shresht Bhowmick',
  description: 'Collaborative 64×64 pixel art board. Paint something fun!',
};

export default function PixelsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-10 text-center">
        <h1 className="text-4xl font-bold">Pixel Art Board</h1>
        <p className="text-muted-foreground">Pick a color and click/drag to paint. Board updates every few seconds.</p>
        <PixelBoardClient />
      </div>
    </main>
  );
} 