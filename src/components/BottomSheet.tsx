import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  onReset?: () => void;
  resetLabel?: string;
  height?: 'full' | 'large' | 'medium' | 'small';
  showDragHandle?: boolean;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  onReset,
  resetLabel = 'Clear All',
  height = 'large',
  showDragHandle = true,
  className,
}: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Height configurations
  const heightClasses = {
    full: 'h-[100vh]',
    large: 'h-[85vh]',
    medium: 'h-[60vh]',
    small: 'h-[40vh]',
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Close if dragged down (more responsive threshold for better UX)
    // Triggers on: 50px+ down OR 300+ velocity OR momentum downward
    if (info.offset.y > 50 || info.velocity.y > 300 || (info.velocity.y > 100 && info.offset.y > 20)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - light overlay for visibility */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 z-[100]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,        // Slightly increased for stability
              stiffness: 400,      // Slightly increased for snappier feel
              mass: 0.8,           // Lower mass for faster response
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',  // GPU acceleration
              backfaceVisibility: 'hidden'
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-[101]',
              heightClasses[height],
              isDragging && 'cursor-grabbing opacity-95',  // Visual feedback while dragging
              className
            )}
          >
            {/* Drag Handle */}
            {showDragHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || onReset) && (
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                </div>
                {onReset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {resetLabel}
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto px-6 py-4"
              style={{
                maxHeight: height === 'full' ? 'calc(100vh - 140px)' : 'calc(85vh - 140px)',
                willChange: 'scroll-position',  // Optimize scrolling
                WebkitOverflowScrolling: 'touch'  // Smooth iOS scroll
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
