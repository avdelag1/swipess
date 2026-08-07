import { FormEvent, useRef, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
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

  // True iOS Liquid Glass styles for Search Bar
  const glassStyle = {
    background: isLight
      ? 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
      : 'linear-gradient(145deg, rgba(15,15,20,0.6) 0%, rgba(15,15,20,0.3) 100%)',
    border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: isLight
      ? '0 10px 40px rgba(0, 0, 0, 0.05), inset 0 2px 10px rgba(255,255,255,0.8)'
      : '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    color: isLight ? '#000' : '#fff',
  };

  return (
    <form
      className={cn('relative flex items-center justify-end h-[38px] w-full', className)}
      onSubmit={handleSubmit}
      action="#"
      role="search"
      autoComplete="off"
    >
      <div
        className="absolute right-0 flex items-center rounded-full overflow-hidden w-full"
        style={{ height: '38px', ...glassStyle }}
      >
        <div className="shrink-0 flex items-center justify-center w-[38px] h-[38px]" aria-hidden>
          <Search className={cn('w-[15px] h-[15px]', isLight ? 'text-black/60' : 'text-white/90')} strokeWidth={2} />
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
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Search with AI"
            >
              <Sparkles
                className={cn(
                  'w-[18px] h-[18px] transition-transform duration-150 group-active:scale-[0.9]',
                  isLight ? 'text-black/80' : 'text-[#fff0f5]',
                )}
                strokeWidth={2}
                style={{
                  filter: isLight
                    ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.2))'
                    : 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.6))',
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
