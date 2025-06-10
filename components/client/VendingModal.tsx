'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type VendingItem } from '@/lib/vending-items';
import styles from './VendingMachine.module.css';

interface VendingModalProps {
  item: VendingItem | null;
  onClose: () => void;
  onPurchase: (item: VendingItem) => void;
  isVending: boolean;
}

export default function VendingModal({ item, onClose, onPurchase, isVending }: VendingModalProps) {
  const [showPurchaseButton, setShowPurchaseButton] = useState(false);
  const [insertingCoins, setInsertingCoins] = useState(false);
  const insertCoinsButtonRef = useRef<HTMLButtonElement>(null);
  const purchaseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (item) {
      setShowPurchaseButton(false);
      setInsertingCoins(false);
      // Auto-focus the INSERT COINS button when modal opens
      setTimeout(() => {
        insertCoinsButtonRef.current?.focus();
      }, 300); // Small delay to allow modal animation to complete
    }
  }, [item]);

  // Auto-focus the PURCHASE button when it becomes available
  useEffect(() => {
    if (showPurchaseButton && purchaseButtonRef.current) {
      purchaseButtonRef.current.focus();
    }
  }, [showPurchaseButton]);

  const handleInsertCoins = () => {
    setInsertingCoins(true);
    // Simulate coin insertion animation
    setTimeout(() => {
      setShowPurchaseButton(true);
      setInsertingCoins(false);
    }, 1500);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle button keyboard events
  const handleButtonKeyDown = (e: React.KeyboardEvent, action: () => void, disabled = false) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      action();
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalCode}>{item.code}</div>
            <button className={styles.modalClose} onClick={onClose}>×</button>
          </div>

          {/* Modal Body */}
          <div className={styles.modalBody}>
            {/* Product Image */}
            <div className={styles.modalImage}>
              <div className={styles.modalImagePlaceholder}>
                <div className={styles.modalIcon}>
                  {item.category === 'digital' ? '💾' : '📦'}
                </div>
              </div>
              <div 
                className={styles.modalGlow}
                style={{ '--glow-color': item.glowColor || '#FFB04D' } as React.CSSProperties}
              />
            </div>

            {/* Product Info */}
            <div className={styles.modalInfo}>
              <h2 className={styles.modalTitle}>{item.name}</h2>
              <div className={styles.modalPrice}>{item.price}</div>
              
              {/* Typewriter Description */}
              <div className={styles.modalDescription}>
                <TypewriterText text={item.description} />
              </div>

              {/* Purchase Section */}
              <div className={styles.modalPurchase}>
                {!showPurchaseButton ? (
                  <button
                    ref={insertCoinsButtonRef}
                    className={`${styles.insertCoinsButton} ${insertingCoins ? styles.inserting : ''}`}
                    onClick={handleInsertCoins}
                    disabled={insertingCoins || !item.available}
                    onKeyDown={(e) => handleButtonKeyDown(e, handleInsertCoins, insertingCoins || !item.available)}
                  >
                    {!item.available ? 'COMING SOON' : insertingCoins ? 'INSERTING...' : 'INSERT COINS'}
                  </button>
                ) : (
                  <button
                    ref={purchaseButtonRef}
                    className={`${styles.purchaseButton} ${isVending ? styles.vending : ''}`}
                    onClick={() => onPurchase(item)}
                    disabled={isVending}
                    onKeyDown={(e) => handleButtonKeyDown(e, () => onPurchase(item), isVending)}
                  >
                    {isVending ? 'VENDING...' : 'PURCHASE'}
                  </button>
                )}

                {/* Coin Animation */}
                {insertingCoins && (
                  <div className={styles.coinAnimation}>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={styles.animatedCoin}
                        style={{ animationDelay: `${i * 0.2}s` }}
                      >
                        ¥
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scanline Effect */}
          <div className={styles.modalScanlines} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Typewriter component for description
function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <>
      {displayText}
      {currentIndex < text.length && <span className={styles.typewriterCursor}>_</span>}
    </>
  );
} 