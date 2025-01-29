'use client';

import { useState } from 'react';
import { scenarios, type DecisionNode, type DecisionOption } from './decision-tree-data';
import { motion } from 'framer-motion';

export function DecisionTree() {
  const [currentNode, setCurrentNode] = useState<DecisionNode>(scenarios.find(s => s.id === 'start')!);
  const [history, setHistory] = useState<DecisionNode[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);

  const handleOptionClick = (option: DecisionOption) => {
    if (option.outcome) {
      setOutcome(option.outcome);
    } else if (option.nextId) {
      const nextNode = scenarios.find(s => s.id === option.nextId);
      if (nextNode) {
        setHistory([...history, currentNode]);
        setCurrentNode(nextNode);
        setOutcome(null);
      }
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousNode = history[history.length - 1];
      setCurrentNode(previousNode);
      setHistory(history.slice(0, -1));
      setOutcome(null);
    } else {
      // Reset to start
      setCurrentNode(scenarios.find(s => s.id === 'start')!);
      setOutcome(null);
    }
  };

  const handleReset = () => {
    setCurrentNode(scenarios.find(s => s.id === 'start')!);
    setHistory([]);
    setOutcome(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 relative z-10"
    >
      <div className="relative bg-card/30 backdrop-blur-md rounded-lg p-6 shadow-xl border border-accent/20">
        <h3 className="text-xl font-semibold mb-4 text-primary">
          {outcome ? "Shresht's Decision:" : currentNode.question}
        </h3>

        <div className="space-y-4">
          {outcome ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-invert"
            >
              <p className="text-lg text-accent-foreground">{outcome}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
              >
                Start Over
              </button>
            </motion.div>
          ) : (
            <>
              {currentNode.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className={`group w-full p-4 text-left ${
                    option.isShreshtChoice
                      ? 'bg-primary/20 hover:bg-primary/30 border-l-4 border-primary'
                      : 'bg-background/40 hover:bg-background/60'
                  } backdrop-blur-sm rounded-md transition-all duration-200 relative`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-sm text-primary/80">Option {index + 1}</span>
                  <p className="text-base mt-1">{option.text}</p>
                  {option.isShreshtChoice && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary/60">
                      Shresht's Choice ✨
                    </div>
                  )}
                </motion.button>
              ))}
            </>
          )}
        </div>

        {history.length > 0 && !outcome && (
          <motion.button
            onClick={handleBack}
            className="mt-4 text-sm text-primary/60 hover:text-primary transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ← Go Back
          </motion.button>
        )}
      </div>
    </motion.div>
  );
} 