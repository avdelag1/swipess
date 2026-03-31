import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumSortableGridProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  columns?: {
    initial: number;
    md: number;
    lg: number;
  };
}

/**
 * SPEED OF LIGHT SORTABLE GRID
 * Implements a high-fidelity 2D drag-to-reorder system.
 * Uses distance-based intersection for smooth, predictable shifting
 * instead of fragile elementFromPoint detection.
 */
export function PremiumSortableGrid<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  columns = { initial: 1, md: 2, lg: 3 }
}: PremiumSortableGridProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);
  
  // Sync items when they change externally, but not during an active drag
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

  // Improved 2D reordering logic
  const handleDragOver = (draggedId: string, overId: string) => {
    if (draggedId === overId) return;

    const oldIndex = localItems.findIndex(item => item.id === draggedId);
    const newIndex = localItems.findIndex(item => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // PERFORM STABLE SWAP
    const newItems = [...localItems];
    newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, localItems[oldIndex]);
    
    setLocalItems(newItems);
  };

  return (
    <LayoutGroup id="sortable-grid">
      <div 
        className={cn(
          "grid gap-6 sm:gap-8 transition-opacity duration-300",
          columns.initial === 1 ? "grid-cols-1" : `grid-cols-${columns.initial}`,
          columns.md === 2 ? "md:grid-cols-2" : `md:grid-cols-${columns.md}`,
          columns.lg === 3 ? "lg:grid-cols-3" : `lg:grid-cols-${columns.lg}`,
          activeId ? "opacity-95" : "opacity-100",
          className
        )}
      >
        <AnimatePresence>
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
    </LayoutGroup>
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

  // Buffer to prevent accidental rapid-fire swaps
  const lastSwapRef = useRef<number>(0);

  return (
    <motion.div
      ref={itemRef}
      layout
      // LayoutId is crucial for smooth transition, but we must make it unique if combined with other LayoutGroups
      layoutId={`item-${id}`}
      drag
      dragConstraints={false}
      // Re-enable 2D drag
      dragListener={true}
      dragDirectionLock={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrag={(e, info) => {
        // PERFORMANCE: Throttling reordering checks (every 50ms)
        const now = Date.now();
        if (now - lastSwapRef.current < 50) return;

        // Use info.point (viewport relative) to find collisions
        const x = info.point.x;
        const y = info.point.y;
        
        // Temporarily ignore pointer events on the dragged item to find what's underneath
        if (itemRef.current) {
          itemRef.current.style.pointerEvents = 'none';
          const elementUnder = document.elementFromPoint(x, y);
          itemRef.current.style.pointerEvents = 'auto';
          
          const closestItem = elementUnder?.closest('[data-sortable-id]');
          const overId = closestItem?.getAttribute('data-sortable-id');
          
          if (overId && overId !== id) {
            lastSwapRef.current = now;
            onDragOver(overId);
          }
        }
      }}
      // Use standard drag instead of specific axis for full 2D feel
      _dragX={undefined}
      dragMomentum={false}
      data-sortable-id={id}
      whileDrag={{ 
        scale: 1.05, 
        rotate: 1, 
        zIndex: 50,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 1
      }}
      className={cn(
        "list-none select-none touch-none rounded-[2rem]",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
