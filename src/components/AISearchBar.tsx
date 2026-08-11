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
    haptics.tap();
    if (onSearchSubmit) onSearchSubmit('');
    else onFilterClick?.();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    runSearch();
  };

  const barH = 58;
  const glassStyle = { color: isLight ? '#111' : '#fff', minHeight: barH };

  return (
    <form
      className={cn('relative flex items-center justify-end w-full overflow-visible', className)}
      style={{ height: barH, minHeight: barH }}
      onSubmit={handleSubmit}
      action="#"
      role="search"
      autoComplete="off"
    >
      {/* Blue rim light lives OUTSIDE overflow:hidden so it can hug the frame */}
      <span
        className={cn(
          'neo-search-light-travel pointer-events-none absolute z-[3]',
          !isLight && 'neo-search-light-travel--dark',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute inset-0 z-[2] flex items-center rounded-full overflow-hidden w-full neo-naive',
          isLight ? 'neo-naive-search' : 'neo-naive--dark neo-naive-search--dark',
        )}
        style={{ height: barH, minHeight: barH, ...glassStyle }}
      >
        <div className="relative z-[2] shrink-0 flex items-center justify-center w-[58px] h-[58px]" aria-hidden>
          <Search
            className={cn(
              'w-[18px] h-[18px]',
              isLight ? 'text-[#2563EB]/90' : 'text-[#60A5FA]',
            )}
            strokeWidth={2.35}
          />
        </div>

        <div className="relative z-[2] flex-1 flex items-center h-full min-w-0">
          <input
            ref={inputRef}
            type="search"
            name="swipess-ai-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
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
            className={cn(
              'w-full h-full min-w-0 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none border-none text-[15px] font-medium',
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
                  isLight ? 'text-[#2563EB]' : 'text-[#60A5FA]',
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
