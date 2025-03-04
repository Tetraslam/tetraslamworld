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
    setImages(imagePaths.sort(() => Math.random() - 0.5));
  }, []);
  
  const animationDuration = Math.max(20, 60 / (speed || 1));
  
  return (
    <div className={cn("w-full overflow-hidden py-8", className)}>
      <div 
        className="flex gap-6 animate-scroll hover:pause"
        style={{
          '--duration': `${animationDuration}s`,
          width: 'fit-content'
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
                priority={index < 5}
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
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 