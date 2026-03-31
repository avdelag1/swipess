import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumSortableGridProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  gap?: number;
  columns?: {
    initial: number;
    md: number;
    lg: number;
  };
}

/**
 * ZENITH STANDARD: True 2D Sortable Grid
 * Replaces Framer Motion's 1D Reorder.Group for multi-column layouts.
 * Supports fluid reordering in all directions (X and Y).
 */
export function PremiumSortableGrid<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  columns = { initial: 1, md: 2, lg: 3 }
}: PremiumSortableGridProps<T>) {
  // Local state to handle visual reordering during drag
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);
  
  // Sync with prop updates but ignore while dragging
  useEffect(() => {
    if (!activeId) {
      setLocalItems(items);
    }
  }, [items, activeId]);

  const handleDragStart = (id: string) => {
    setActiveId(id);
  };

  const handleDragEnd = () => {
    setActiveId(null);
    onReorder(localItems);
  };

  const handleDragOver = (draggedId: string, overId: string) => {
    if (draggedId === overId) return;

    const oldIndex = localItems.findIndex(item => item.id === draggedId);
    const newIndex = localItems.findIndex(item => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...localItems];
    newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, localItems[oldIndex]);
    
    setLocalItems(newItems);
  };

  return (
    <div 
      className={cn(
        "grid gap-6 sm:gap-8 transition-all duration-500",
        columns.initial === 1 ? "grid-cols-1" : `grid-cols-${columns.initial}`,
        columns.md === 2 ? "md:grid-cols-2" : `md:grid-cols-${columns.md}`,
        columns.lg === 3 ? "lg:grid-cols-3" : `lg:grid-cols-${columns.lg}`,
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {localItems.map((item, index) => (
          <SortableItem
            key={item.id}
            id={item.id}
            index={index}
            isDragging={activeId === item.id}
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(draggedId) => handleDragOver(draggedId, item.id)}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </SortableItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SortableItemProps {
  id: string;
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (draggedId: string) => void;
  children: React.ReactNode;
  className?: string;
}

function SortableItem({
  id,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  children,
  className
}: SortableItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={itemRef}
      layout
      layoutId={id}
      drag
      dragSnapToOrigin={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrag={(e, info) => {
        // Detect collision with other items
        // We use document.elementFromPoint to find what's under the cursor
        const x = info.point.x;
        const y = info.point.y;
        
        // Hide current element temporarily to see what's underneath
        if (itemRef.current) {
          itemRef.current.style.pointerEvents = 'none';
          const elementUnder = document.elementFromPoint(x, y);
          itemRef.current.style.pointerEvents = 'auto';
          
          const closestItem = elementUnder?.closest('[data-sortable-id]');
          const overId = closestItem?.getAttribute('data-sortable-id');
          
          if (overId && overId !== id) {
            onDragOver(overId);
          }
        }
      }}
      data-sortable-id={id}
      style={{
        zIndex: isDragging ? 50 : 0,
        position: 'relative'
      }}
      whileDrag={{ 
        scale: 1.05, 
        rotate: 1,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1
      }}
      className={cn("list-none select-none touch-none", className)}
    >
      {children}
    </motion.div>
  );
}
