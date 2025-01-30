'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Waifu, 
  getWaifuRankings, 
  getRankingChange,
  getRankingChangeText,
  getRankingChangeClass
} from '@/lib/integrations/waifu';

export function WaifuRankings() {
  const [waifus, setWaifus] = useState<Waifu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWaifuId, setExpandedWaifuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaifus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rankings = await getWaifuRankings();
        setWaifus(rankings);
      } catch (err) {
        setError('Failed to load waifu rankings. Please try again later.');
        console.error('Error fetching waifu rankings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWaifus();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none p-6 animate-pulse"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-8 bg-primary/20 rounded" />
              <div className="w-16 h-16 bg-primary/20 rounded" />
              <div className="flex-grow space-y-2">
                <div className="h-6 w-32 bg-primary/20 rounded" />
                <div className="h-4 w-24 bg-primary/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none text-center">
        <p className="text-foreground/80">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {waifus.map((waifu, index) => {
        const change = getRankingChange(waifu.ranking, waifu.lastWeekRanking);
        const changeText = getRankingChangeText(change);
        const changeClass = getRankingChangeClass(change);
        const isExpanded = expandedWaifuId === waifu.id;

        return (
          <motion.div
            key={waifu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none p-6 before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1 after:absolute after:inset-0 after:border-2 after:border-primary/5 after:m-2 group hover:bg-card/40 transition-all duration-300"
          >
            <div 
              className="w-full cursor-pointer relative z-10"
              onClick={() => setExpandedWaifuId(isExpanded ? null : waifu.id)}
            >
              <div className="flex items-center gap-6">
                <div className="text-3xl font-pixel text-primary w-12 group-hover:text-accent transition-colors duration-300">#{waifu.ranking}</div>
                <div className="relative w-16 h-16 border-2 border-primary/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none z-10" />
                  <Image
                    src={waifu.image}
                    alt={waifu.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-pixel text-lg text-foreground/90 group-hover:text-primary transition-colors duration-300">{waifu.name}</h3>
                  <p className="text-sm text-muted-foreground font-pixel">{waifu.series}</p>
                </div>
                <div className={`text-sm font-pixel ${changeClass} group-hover:scale-110 transition-transform duration-300`}>
                  {changeText}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 overflow-hidden relative z-20"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 select-text space-y-4">
                        <h4 className="font-pixel text-xl text-primary glow-text-primary">{waifu.name}</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed font-pixel">
                          {waifu.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {waifu.traits.map((trait) => (
                            <span
                              key={trait}
                              className="text-xs font-pixel px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary/90 hover:bg-primary/20 hover:text-accent transition-colors duration-300"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="relative w-64 h-64 shrink-0 border-2 border-primary/30 overflow-hidden hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none z-10" />
                        <Image
                          src={waifu.image}
                          alt={waifu.name}
                          fill
                          className="object-cover"
                          sizes="256px"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
} 