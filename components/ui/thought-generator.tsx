'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, getRandomThought, getThoughtsByCategory, getThoughtsByMood } from '@/lib/integrations/thoughts';

export function ThoughtGenerator() {
  const [currentThought, setCurrentThought] = useState<Thought | null>(null);
  const [filter, setFilter] = useState<{
    type: 'category' | 'mood' | null;
    value: string | null;
  }>({ type: null, value: null });

  const generateThought = () => {
    let newThought: Thought;
    if (filter.type === 'category') {
      const thoughts = getThoughtsByCategory(filter.value as Thought['category']);
      newThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    } else if (filter.type === 'mood') {
      const thoughts = getThoughtsByMood(filter.value as Thought['mood']);
      newThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    } else {
      newThought = getRandomThought();
    }
    setCurrentThought(newThought);
  };

  useEffect(() => {
    generateThought();
  }, [filter, generateThought]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="bg-background border border-border rounded-sm px-3 py-2 text-sm"
          onChange={(e) => {
            const [type, value] = e.target.value.split(':');
            setFilter({ type: type as 'category' | 'mood' | null, value });
          }}
          value={filter.type ? `${filter.type}:${filter.value}` : ''}
        >
          <option value="">All Thoughts</option>
          <optgroup label="Categories">
            <option value="category:tech">Tech</option>
            <option value="category:philosophy">Philosophy</option>
            <option value="category:anime">Anime</option>
            <option value="category:gaming">Gaming</option>
            <option value="category:linguistics">Linguistics</option>
          </optgroup>
          <optgroup label="Moods">
            <option value="mood:playful">Playful</option>
            <option value="mood:thoughtful">Thoughtful</option>
            <option value="mood:accelerationist">Accelerationist</option>
            <option value="mood:analytical">Analytical</option>
          </optgroup>
        </select>
      </div>

      <AnimatePresence mode="wait">
        {currentThought && (
          <motion.div
            key={currentThought.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6"
          >
            <p className="text-lg mb-4">{currentThought.text}</p>
            <div className="flex gap-4">
              <span className="text-sm text-muted-foreground">
                #{currentThought.category}
              </span>
              <span className="text-sm text-muted-foreground">
                mood: {currentThought.mood}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={generateThought}
        className="w-full bg-primary text-primary-foreground rounded-sm px-4 py-2 font-medium"
      >
        Generate New Thought
      </motion.button>
    </div>
  );
} 