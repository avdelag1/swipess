import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

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
 * ⚡ SPEED OF LIGHT SORTABLE GRID 2.1
 * Implements a high-fidelity 'Geometric-Swap' reordering system.
 * Enhanced with tactile haptics and sentient displacement.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Sync items when they change externally, but not during an active drag
  useEffect(() => {
    if (!activeId) {
      setLocalItems(items);
    }
  }, [items, activeId]);

  const handleDragStart = (id: string) => {
    setActiveId(id);
    triggerHaptic('medium');
  };

  const handleDragEnd = () => {
    setActiveId(null);
    onReorder(localItems);
    triggerHaptic('success');
  };

  const handleDragItem = useCallback((draggedId: string, point: { x: number, y: number }) => {
    if (!containerRef.current) return;
    
    let targetId = draggedId;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, id) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Threshold: 60% of item size for snappier swaps
      const threshold = Math.min(rect.width, rect.height) * 0.6;
      
      if (distance < minDistance && distance < threshold) {
        minDistance = distance;
        targetId = id;
      }
    });

    if (targetId !== draggedId) {
      const oldIndex = localItems.findIndex(item => item.id === draggedId);
      const newIndex = localItems.findIndex(item => item.id === targetId);

      if (oldIndex !== -1 && newIndex !== -1) {
        // TACTILE FEEDBACK: Sentient swap confirmation
        triggerHaptic('light');
        
        setLocalItems(prev => {
          const updated = [...prev];
          const [movedItem] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, movedItem);
          return updated;
        });
      }
    }
  }, [localItems]);

  const gridColsClasses = useCallback((cols: number) => {
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      default: return `grid-cols-${cols}`;
    }
  }, []);

  return (
    <LayoutGroup id="sortable-grid">
      <div 
        ref={containerRef}
        className={cn(
          "grid gap-6 sm:gap-8 transition-opacity duration-300",
          gridColsClasses(columns.initial),
          `md:${gridColsClasses(columns.md)}`,
          `lg:${gridColsClasses(columns.lg)}`,
          activeId ? "opacity-95" : "opacity-100",
          className
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {localItems.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              index={index}
              isDragging={activeId === item.id}
              onDragStart={() => handleDragStart(item.id)}
              onDragEnd={handleDragEnd}
              onDrag={(point) => handleDragItem(item.id, point)}
              setRef={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
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
  onDrag: (point: { x: number, y: number }) => void;
  setRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  className?: string;
}

function SortableItem({
  id,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrag,
  setRef,
  children,
  className
}: SortableItemProps) {
  const lastUpdateRef = useRef<number>(0);

  return (
    <motion.div
      layout
      layoutId={`item-${id}`}
      drag
      dragConstraints={false}
      dragElastic={0.05}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrag={(_, info) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = now;
        onDrag(info.point);
      }}
      whileDrag={{ 
        scale: 1.1,
        rotate: 1.5,
        zIndex: 100,
        boxShadow: "0 40px 80px -15px rgba(0, 0, 0, 0.5)",
      }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 600,
          damping: 45,
          mass: 0.8
        },
        scale: { duration: 0.2 },
        boxShadow: { duration: 0.2 }
      }}
      ref={setRef}
      className={cn(
        "list-none select-none touch-none rounded-[2rem] relative",
        isDragging ? "cursor-grabbing z-50" : "cursor-grab z-0",
        className
      )}
    >
      {isDragging && (
        <motion.div 
          layoutId={`highlight-${id}`}
          className="absolute -inset-3 rounded-[2.8rem] bg-brand-accent-1/15 border-2 border-brand-accent-1/40 z-[-1] blur-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        />
      )}
      {children}
    </motion.div>
  );
}
