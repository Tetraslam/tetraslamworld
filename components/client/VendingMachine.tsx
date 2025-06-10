'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendingItems, type VendingItem } from '@/lib/vending-items';
import VendingItemComponent from './VendingItem';
import VendingModal from './VendingModal';
import styles from './VendingMachine.module.css';

export default function VendingMachine() {
  const [selectedItem, setSelectedItem] = useState<VendingItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0); // For keyboard navigation
  const [isVending, setIsVending] = useState(false);
  const [coinSlotClicks, setCoinSlotClicks] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);
  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Preload audio
  useEffect(() => {
    const sounds = ['button-press', 'coin-insert', 'vending-drop', 'electric-hum'];
    sounds.forEach(sound => {
      audioRef.current[sound] = new Audio(`/audio/${sound}.mp3`);
      audioRef.current[sound].preload = 'auto';
    });
  }, []);

  // Play sound effect
  const playSound = (soundName: string) => {
    if (audioRef.current[soundName]) {
      audioRef.current[soundName].currentTime = 0;
      audioRef.current[soundName].play().catch(() => {
        console.log('Audio playback blocked');
      });
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const itemsPerRow = 5;
      const totalItems = vendingItems.length;
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - itemsPerRow));
          playSound('button-press');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(totalItems - 1, prev + itemsPerRow));
          playSound('button-press');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          playSound('button-press');
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(totalItems - 1, prev + 1));
          playSound('button-press');
          break;
        case 'Enter':
          e.preventDefault();
          const item = vendingItems[selectedIndex];
          if (item.available) {
            setSelectedItem(item);
            playSound('button-press');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedItem(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Handle coin slot easter egg
  const handleCoinSlotClick = () => {
    setCoinSlotClicks(prev => prev + 1);
    playSound('coin-insert');
    
    if (coinSlotClicks + 1 === 10) {
      setShowJackpot(true);
      setTimeout(() => {
        setShowJackpot(false);
        setCoinSlotClicks(0);
      }, 3000);
    }
  };

  // Handle purchase
  const handlePurchase = (item: VendingItem) => {
    setIsVending(true);
    playSound('vending-drop');
    
    // Open polar link after animation
    setTimeout(() => {
      window.open(item.polarLink, '_blank');
      setIsVending(false);
      setSelectedItem(null);
    }, 2000);
  };

  return (
    <div className={styles.vendingMachine}>
      {/* Under Construction Banner */}
      <div className={styles.constructionBanner}>
        <div className={styles.constructionText}>
          🚧 UNDER CONSTRUCTION 🚧
        </div>
        <div className={styles.constructionSubtext}>
          Vending machine calibration in progress...
        </div>
      </div>

      {/* CRT Effect Overlay */}
      <div className={styles.crtOverlay} />
      
      {/* Main Machine Body */}
      <div className={styles.machineBody}>
        {/* LED Display */}
        <div className={styles.ledDisplay}>
          <div className={styles.ledText}>
            TETRASLAM'S TERRIFICALLY TANTALIZING TECHWARES!!!
          </div>
        </div>

        {/* Product Display Window */}
        <div className={styles.displayWindow}>
          <div className={styles.productGrid}>
            {vendingItems.map((item, index) => (
              <VendingItemComponent
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                onClick={() => {
                  if (item.available) {
                    setSelectedItem(item);
                    playSound('button-press');
                  }
                }}
                onHover={() => playSound('button-press')}
              />
            ))}
          </div>
          
          {/* Glass Reflection Effect */}
          <div className={styles.glassReflection} />
        </div>

        {/* Control Panel */}
        <div className={styles.controlPanel}>
          {/* Coin Slot */}
          <div 
            className={styles.coinSlot}
            onClick={handleCoinSlotClick}
          >
            <div className={styles.coinSlotLabel}>INSERT COIN</div>
            <div className={styles.coinSlotHole} />
          </div>

          {/* Bill Acceptor */}
          <div className={styles.billAcceptor}>
            <div className={styles.billSlot} />
            <div className={styles.billLabel}>¥1000 ¥5000</div>
          </div>
        </div>

        {/* Dispensing Slot */}
        <div className={`${styles.dispensingSlot} ${isVending ? styles.dispensingActive : ''}`}>
          <div className={styles.dispensingFlap} />
          <div className={styles.dispensingGlow} />
        </div>

        {/* Machine Vents with Steam */}
        <div className={styles.vents}>
          <div className={styles.steam} />
          <div className={styles.steam} style={{ animationDelay: '1s' }} />
          <div className={styles.steam} style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Neon Border Glow */}
      <div className={styles.neonBorder} />

      {/* Electrical Sparks */}
      <div className={styles.sparks}>
        <div className={styles.spark} />
        <div className={styles.spark} style={{ animationDelay: '0.5s' }} />
        <div className={styles.spark} style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Jackpot Animation */}
      <AnimatePresence>
        {showJackpot && (
          <motion.div
            className={styles.jackpot}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <div className={styles.jackpotText}>JACKPOT!</div>
            <div className={styles.jackpotCoins}>
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={styles.jackpotCoin}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    left: `${Math.random() * 100}%`
                  }}
                >
                  ¥
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <VendingModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onPurchase={handlePurchase}
        isVending={isVending}
      />
    </div>
  );
} 