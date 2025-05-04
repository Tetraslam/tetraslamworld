'use client';

import { motion } from 'framer-motion';
import { useCozyMode } from '@/lib/cozy-mode';
import { useState, useEffect } from 'react';

export function CozyToggle() {
  const { isCozyMode, toggleCozyMode } = useCozyMode();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null; // Don't render on mobile

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleCozyMode}
      className={`
        fixed bottom-6 right-6 z-50
        px-4 py-2 rounded-sm
        bg-card border border-border
        transition-colors duration-200
        ${isCozyMode ? 'text-orange-400 border-orange-400/50' : ''}
      `}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-medium">
          {isCozyMode ? 'Disable' : 'Enable'} Cozy Mode
        </span>
      </div>
    </motion.button>
  );
} 