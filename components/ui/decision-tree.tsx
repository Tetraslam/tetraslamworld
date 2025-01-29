'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scenarios, type DecisionNode } from '@/lib/decision-tree-data';

export function DecisionTree() {
  const [currentNode, setCurrentNode] = useState<DecisionNode>(scenarios[0]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [history, setHistory] = useState<DecisionNode[]>([]);

  const handleOptionClick = (nextId?: string, outcome?: string) => {
    if (outcome) {
      setOutcome(outcome);
    } else if (nextId) {
      const nextNode = scenarios.find(s => s.id === nextId);
      if (nextNode) {
        setHistory([...history, currentNode]);
        setCurrentNode(nextNode);
      }
    }
  };

  const handleReset = () => {
    setCurrentNode(scenarios[0]);
    setOutcome(null);
    setHistory([]);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousNode = history[history.length - 1];
      setCurrentNode(previousNode);
      setHistory(history.slice(0, -1));
      setOutcome(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {outcome ? (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none p-6 before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1 after:absolute after:inset-0 after:border-2 after:border-primary/5 after:m-2">
              <h3 className="text-xl font-pixel text-primary mb-4">Shresht would...</h3>
              <p className="text-foreground/80 leading-relaxed">{outcome}</p>
            </div>
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleBack}
                className="px-6 py-3 font-pixel bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:text-accent transition-all duration-300"
              >
                Try Different Option
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
              >
                Start Over
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none p-6 before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1 after:absolute after:inset-0 after:border-2 after:border-primary/5 after:m-2">
              <h3 className="text-xl font-pixel text-primary mb-6">{currentNode.question}</h3>
              <div className="space-y-4 relative z-20">
                {currentNode.options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    onClick={() => handleOptionClick(option.nextId, option.outcome)}
                    className="group w-full p-4 text-left bg-background/40 border-2 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 relative z-30"
                  >
                    <span className="text-foreground/90 group-hover:text-primary transition-colors duration-300">{option.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            {history.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 font-pixel bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:text-accent transition-all duration-300"
                >
                  Go Back
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 