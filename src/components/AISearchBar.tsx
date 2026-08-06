import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface AISearchBarProps {
  className?: string;
  isLight: boolean;
  onFilterClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export function AISearchBar({ className, isLight, onFilterClick, onSearchSubmit }: AISearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();

  // Handle click outside to collapse
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          setIsExpanded(false);
          inputRef.current?.blur();
        }
      }
    }
    
    // Handle scroll to collapse
    function handleScroll() {
      if (isExpanded) {
        setIsExpanded(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isExpanded]);

  const handleExpand = () => {
    if (!isExpanded) {
      haptics.tap();
      setIsExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // slight delay to let animation start
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      haptics.success();
      onSearchSubmit?.(query);
      setIsExpanded(false);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  // Glass styles
  const glassStyle = {
    background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 15, 20, 0.4)',
    border: isLight ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,0.2)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    color: isLight ? '#000' : '#fff',
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative flex items-center h-[46px] w-full max-w-[500px]", className)}
    >
      <motion.div
        layout
        onClick={handleExpand}
        className={cn(
          "absolute left-0 flex items-center rounded-full overflow-hidden cursor-pointer shadow-sm",
          isExpanded ? "w-full" : "w-[46px]"
        )}
        style={{
          height: '46px',
          ...glassStyle,
          transformOrigin: 'left center',
        }}
        initial={false}
        animate={{
          width: isExpanded ? '100%' : '46px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="shrink-0 flex items-center justify-center w-[46px] h-[46px]">
          {isExpanded ? (
            <Search className="w-[18px] h-[18px] opacity-60" strokeWidth={2} />
          ) : (
            <Search className="w-[20px] h-[20px]" strokeWidth={2.5} />
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="flex-1 flex items-center h-full"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to find anything..."
                className="w-full h-full bg-transparent outline-none border-none text-[15px] font-medium placeholder:italic placeholder:opacity-50"
                style={{ color: 'inherit' }}
              />
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.tap();
                  onFilterClick?.();
                }}
                className="shrink-0 flex items-center justify-center w-[46px] h-[46px] opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Filters"
              >
                <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
