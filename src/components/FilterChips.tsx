import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FILTER CHIPS - Active Filter Display
 *
 * Shows active filters as chips at the top of swipe view
 * - Easy to remove individual filters
 * - Clear all button
 * - Scrollable horizontal list
 * - Mobile-optimized
 */

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({ chips, onRemove, onClearAll, className }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-4",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.div
            key={chip.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Badge
              variant="secondary"
              className="pr-1 pl-3 py-1.5 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <span className="text-primary">{chip.label}</span>
              {chip.value && (
                <>
                  <span className="text-muted-foreground">:</span>
                  <span className="font-semibold text-primary">{chip.value}</span>
                </>
              )}
              <button
                onClick={() => onRemove(chip.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/30 transition-colors"
              >
                <X className="h-3 w-3 text-primary" />
              </button>
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>

      {chips.length > 1 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive whitespace-nowrap"
          >
            Clear all
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
