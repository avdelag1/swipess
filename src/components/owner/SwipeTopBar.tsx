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
          className="w-10 h-10 text-gray-200 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Counter - Increased Contrast */}
        <div className="text-gray-300 font-semibold text-sm">
          <span>{currentIndex + 1}</span>
          <span className="text-gray-500"> / {totalCount}</span>
        </div>

        {/* Filter Button - Increased Brightness */}
        {onFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFilters}
            className="w-10 h-10 text-gray-200 hover:bg-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
