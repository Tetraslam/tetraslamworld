'use client';

import { useEffect, useState } from 'react';
import { debounce, generateSparkles } from '@/lib/utils';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const debouncedUpdatePosition = debounce(updatePosition, 5);
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, a, [role="button"]')) {
        setIsHovering(true);
        const cursorElement = document.querySelector('.custom-cursor');
        if (cursorElement instanceof HTMLElement) {
          generateSparkles(e, cursorElement);
        }
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    document.addEventListener('mousemove', debouncedUpdatePosition);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mousemove', debouncedUpdatePosition);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div
      className={`custom-cursor ${isHovering ? 'hover' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  );
} 