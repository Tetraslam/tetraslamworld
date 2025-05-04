'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AutoScrollGalleryProps {
  className?: string;
  speed?: number; // Speed multiplier, higher = faster
}

export function AutoScrollGallery({ className, speed = 3 }: AutoScrollGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const imagePaths: string[] = [];
    
    // Add the base image.png
    imagePaths.push('/about-pics/image.png');
    
    // Add "image copy.png"
    imagePaths.push('/about-pics/image copy.png');
    
    // Add "image copy X.png" files (2-33)
    for (let i = 2; i <= 33; i++) {
      imagePaths.push(`/about-pics/image copy ${i}.png`);
    }
    
    // Shuffle array for more interesting presentation
    const shuffled = imagePaths.sort(() => Math.random() - 0.5);
    setImages(shuffled);

    // Preload images so they appear immediately when gallery mounts
    shuffled.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);
  
  const animationDuration = Math.max(20, 60 / (speed || 1));
  
  return (
    <div className={cn("w-full overflow-hidden py-8 relative", className)}>
      {/* Pause/Resume toggle */}
      <button
        onClick={() => setIsPaused((p) => !p)}
        className="mb-4 px-3 py-1 bg-background/80 backdrop-blur-md border border-border text-sm font-pixel hover:bg-background/60 transition-colors"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      <div 
        className="flex gap-6 animate-scroll"
        style={{
          '--duration': `${animationDuration}s`,
          width: 'fit-content',
          animationPlayState: isPaused ? 'paused' : 'running'
        } as React.CSSProperties}
      >
        {/* First copy of images */}
        {images.map((src, index) => (
          <div key={index} className="flex-shrink-0">
            <div className="h-80 w-80 relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:z-10">
              <Image 
                src={src}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
                sizes="(max-width: 768px) 100vw, 320px"
                quality={85}
                loading="eager"
              />
            </div>
          </div>
        ))}
        
        {/* Duplicate images for seamless loop */}
        {images.map((src, index) => (
          <div key={`dup-${index}`} className="flex-shrink-0">
            <div className="h-80 w-80 relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:z-10">
              <Image 
                src={src}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
                sizes="(max-width: 768px) 100vw, 320px"
                quality={85}
                loading="eager"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 