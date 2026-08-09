import { FormEvent, useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

interface AISearchBarProps {
  className?: string;
  isLight: boolean;
  onFilterClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export function AISearchBar({ className, isLight, onFilterClick, onSearchSubmit }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      haptics.success();
      onSearchSubmit?.(trimmed);
      inputRef.current?.blur();
      return;
    }
    // Empty submit → open AI / filters entry point
    haptics.tap();
    if (onSearchSubmit) onSearchSubmit('');
    else onFilterClick?.();
  };

  const handleSubmit = (e: FormEvent) => {
    // Critical for Safari/Chrome: prevent native form navigation / full reload
    e.preventDefault();
    e.stopPropagation();
    runSearch();
  };

  // Light = blue ink frame (thicker). Dark = soft glass, no heavy frame.
  const barH = isLight ? 52 : 38;
  const glassStyle = isLight
    ? { color: '#111' }
    : {
        background: 'linear-gradient(145deg, rgba(28,28,36,0.58) 0%, rgba(16,16,22,0.38) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderTop: '1px solid rgba(255, 255, 255, 0.22)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        color: '#fff',
      };

  return (
    <form
      className={cn('relative flex items-center justify-end w-full', className)}
      style={{ height: barH }}
      onSubmit={handleSubmit}
      action="#"
      role="search"
      autoComplete="off"
    >
      <div
        className={cn(
          'absolute right-0 flex items-center rounded-full overflow-hidden w-full',
          isLight && 'neo-naive neo-naive-search',
        )}
        style={{ height: barH, ...glassStyle }}
      >
        <div
          className={cn(
            'shrink-0 flex items-center justify-center',
            isLight ? 'w-[52px] h-[52px]' : 'w-[38px] h-[38px]',
          )}
          aria-hidden
        >
          <Search
            className={cn(
              isLight ? 'w-[17px] h-[17px] text-[#3B82F6]/85' : 'w-[15px] h-[15px] text-white/90',
            )}
            strokeWidth={2.25}
          />
        </div>

        <div className="flex-1 flex items-center h-full min-w-0">
          <input
            ref={inputRef}
            type="search"
            name="swipess-ai-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Safari sometimes prefers keydown Enter over form submit for type=search
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                runSearch();
              } else if (e.key === 'Escape') {
                inputRef.current?.blur();
              }
            }}
            placeholder="Ask AI to find anything..."
            enterKeyHint="search"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            // Override global -webkit-user-select:none so Safari actually accepts typing
            className={cn(
              'w-full h-full min-w-0 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none border-none text-[13px] font-medium',
              isLight ? 'placeholder:text-black/40 text-black' : 'placeholder:text-white/80 text-white',
            )}
            style={{
              color: isLight ? '#000' : '#fff',
              WebkitUserSelect: 'text',
              userSelect: 'text',
              WebkitTouchCallout: 'default',
              boxShadow: 'none',
              outline: 'none',
            }}
          />

          <div className="shrink-0 flex items-center pr-1">
            <button
              type="submit"
              className="chrome-icon-btn flex items-center justify-center w-8 h-8 rounded-full bg-transparent shrink-0 group"
              style={{ WebkitTapHighlightColor: 'transparent', background: 'transparent', boxShadow: 'none', border: 'none' }}
              aria-label="Search"
            >
              <ArrowRight
                className={cn(
                  'w-[19px] h-[19px] transition-transform duration-150 group-active:scale-[0.9] group-hover:translate-x-0.5',
                  isLight ? 'text-[#3B82F6]' : 'text-white/90',
                )}
                strokeWidth={2.4}
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
