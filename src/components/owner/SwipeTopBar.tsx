import { Button } from '@/components/ui/button';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface SwipeTopBarProps {
  currentIndex: number;
  totalCount: number;
  onBack: () => void;
  onFilters?: () => void;
}

export function SwipeTopBar({ currentIndex, totalCount, onBack, onFilters }: SwipeTopBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-transparent safe-area-pt-extra"
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Back Button - Increased Brightness */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 text-white hover:text-orange-200 transition-all active:scale-[0.95]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Counter - Increased Contrast */}
        <div className="text-white font-bold text-sm px-3 py-1.5 rounded-lg" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.25)',
        }}>
          <span>{currentIndex + 1}</span>
          <span className="text-gray-200"> / {totalCount}</span>
        </div>

        {/* Filter Button - Increased Brightness */}
        {onFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFilters}
            className="w-10 h-10 text-white hover:text-orange-200 transition-all active:scale-[0.95]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
