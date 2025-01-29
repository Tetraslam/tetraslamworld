'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CozyModeContextType {
  isCozyMode: boolean;
  toggleCozyMode: () => void;
  audioPlayer: HTMLAudioElement | null;
}

const CozyModeContext = createContext<CozyModeContextType>({
  isCozyMode: false,
  toggleCozyMode: () => {},
  audioPlayer: null,
});

export function CozyModeProvider({ children }: { children: React.ReactNode }) {
  const [isCozyMode, setIsCozyMode] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const audio = new Audio('/audio/lofi.mp3');
    audio.loop = true;
    setAudioPlayer(audio);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleCozyMode = () => {
    console.log('Toggling cozy mode');
    setIsCozyMode((prev) => {
      const newState = !prev;
      console.log('Cozy mode state:', newState);
      if (audioPlayer) {
        if (newState) {
          audioPlayer.play().catch(() => {
            console.log('Audio autoplay blocked. Click again to play.');
          });
        } else {
          audioPlayer.pause();
        }
      }
      return newState;
    });
  };

  useEffect(() => {
    console.log('Current cozy mode state:', isCozyMode);
  }, [isCozyMode]);

  return (
    <CozyModeContext.Provider value={{ isCozyMode, toggleCozyMode, audioPlayer }}>
      <div className={isCozyMode ? 'cozy-mode relative w-full h-full' : 'relative w-full h-full'}>
        {children}
        {isMounted && createPortal(
          <>
            {/* Debug element - always visible */}
            <div className="fixed top-20 left-4 bg-black text-white px-4 py-2 rounded text-base font-bold z-[99999] shadow-lg border-2 border-white">
              Cozy Mode: {isCozyMode ? 'ON' : 'OFF'}
            </div>
            {isCozyMode && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Fireplace */}
                <div className="absolute" style={{ right: '5vw', bottom: '5vh' }}>
                  {/* Logs */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#3a1f14] rounded-sm transform -rotate-6" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#4a2618] rounded-sm transform rotate-6" />
                  
                  {/* Main fire */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="w-16 h-24 bg-[#ff4d00] rounded-t-full animate-fire-main opacity-90" />
                    <div className="absolute bottom-0 left-0 w-8 h-16 bg-[#ff9d00] rounded-full animate-fire-left opacity-80" />
                    <div className="absolute bottom-0 right-0 w-8 h-16 bg-[#ff9d00] rounded-full animate-fire-right opacity-80" />
                  </div>
                  
                  {/* Sparks */}
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-32 h-32">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#ffd700] rounded-full animate-spark"
                        style={{
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${1 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Ambient glow */}
                  <div className="absolute -bottom-20 -right-20 w-96 h-96">
                    <div className="absolute inset-0 bg-gradient-radial from-[#ff6b0040] to-transparent opacity-50 mix-blend-screen" />
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    </CozyModeContext.Provider>
  );
}

export const useCozyMode = () => useContext(CozyModeContext); 