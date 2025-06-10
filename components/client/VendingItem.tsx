'use client';

import { motion } from 'framer-motion';
import { type VendingItem } from '@/lib/vending-items';
import Image from 'next/image';
import styles from './VendingMachine.module.css';

interface VendingItemProps {
  item: VendingItem;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
}

export default function VendingItemComponent({ item, isSelected, onClick, onHover }: VendingItemProps) {
  return (
    <motion.div
      className={`${styles.vendingItem} ${!item.available ? styles.soldOut : ''} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      onHoverStart={onHover}
      whileHover={item.available ? { y: -4 } : {}}
      animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
      style={{
        '--glow-color': item.glowColor || '#FFB04D'
      } as React.CSSProperties}
    >
      {/* Item Code */}
      <div className={styles.itemCode}>{item.code}</div>

      {/* Item Image Container */}
      <div className={styles.itemImageContainer}>
        {/* Placeholder for now - you'll add actual images later */}
        <div className={styles.itemImagePlaceholder}>
          <div className={styles.itemIcon}>
            {item.category === 'digital' ? '💾' : '📦'}
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className={styles.itemGlow} />
      </div>

      {/* Item Name */}
      <div className={styles.itemName}>{item.name}</div>

      {/* Price Tag */}
      <div className={styles.itemPrice}>{item.price}</div>

      {/* Sold Out Overlay */}
      {!item.available && (
        <div className={styles.soldOutOverlay}>
          <div className={styles.soldOutText}>SOLD OUT</div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && item.available && (
        <div className={styles.selectionIndicator}>
          <div className={styles.selectionArrow}>▶</div>
        </div>
      )}
    </motion.div>
  );
} 