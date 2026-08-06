import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

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

  // True iOS Liquid Glass styles for Search Bar
  const glassStyle = {
    background: isLight 
      ? 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 100%)' 
      : 'linear-gradient(145deg, rgba(15,15,20,0.6) 0%, rgba(15,15,20,0.3) 100%)',
    border: isLight ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.7)' : '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: isLight
      ? '0 10px 40px rgba(0, 0, 0, 0.1), inset 0 2px 10px rgba(255,255,255,0.6)'
      : '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    color: isLight ? '#000' : '#fff',
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative flex items-center justify-end h-[48px] w-full", className)}
    >
      <motion.div
        layout
        onClick={handleExpand}
        className={cn(
          "absolute right-0 flex items-center rounded-full overflow-hidden cursor-pointer",
          isExpanded ? "w-full" : "w-[48px]"
        )}
        style={{
          height: '48px',
          ...glassStyle,
          transformOrigin: 'right center',
        }}
        initial={false}
        animate={{
          width: isExpanded ? '100%' : '48px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="shrink-0 flex items-center justify-center w-[48px] h-[48px]">
          {isExpanded ? (
            <Search className="w-[18px] h-[18px] opacity-50" strokeWidth={2.5} />
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
                className="w-full h-full bg-transparent outline-none border-none text-[15px] font-medium placeholder:opacity-50"
                style={{ color: 'inherit' }}
              />
              
              <div className="shrink-0 flex items-center pr-1">
                <Sparkles className="w-4 h-4 mr-2 opacity-60 text-purple-500" strokeWidth={2.5} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.tap();
                    onFilterClick?.();
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full opacity-80 hover:opacity-100 hover:bg-black/5 transition-all"
                  aria-label="Filters"
                >
                  <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
