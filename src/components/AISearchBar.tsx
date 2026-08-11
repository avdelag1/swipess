import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

interface AISearchBarProps {
  className?: string;
  isLight: boolean;
  onFilterClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

/** Rounded-rect path matching the pill frame (inset so stroke sits ON the blue border). */
function pillFramePath(width: number, height: number, inset = 1.25): string {
  const w = Math.max(height, width);
  const h = height;
  const r = Math.max(0, h / 2 - inset);
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  return [
    `M ${x0 + r} ${y0}`,
    `H ${x1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V ${y1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H ${x0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V ${y0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    'Z',
  ].join(' ');
}

export function AISearchBar({ className, isLight, onFilterClick, onSearchSubmit }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLFormElement>(null);
  const [frameW, setFrameW] = useState(320);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => setFrameW(Math.max(el.clientWidth, 58));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  const frameColor = isLight ? '#2563EB' : '#60A5FA';
  const glowColor = isLight ? '#3B82F6' : '#93C5FD';
  const framePath = pillFramePath(frameW, barH);

  return (
    <form
      ref={shellRef}
      className={cn('relative flex items-center justify-end w-full overflow-visible', className)}
      style={{ height: barH, minHeight: barH }}
      onSubmit={handleSubmit}
      action="#"
      role="search"
      autoComplete="off"
    >
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

      {/* Bright blue light that travels ON the pill frame stroke */}
      <svg
        className="neo-search-frame-chase pointer-events-none absolute inset-0 z-[4] overflow-visible"
        width={frameW}
        height={barH}
        viewBox={`0 0 ${frameW} ${barH}`}
        aria-hidden
      >
        <defs>
          <filter id="neo-search-frame-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Soft thin trail */}
        <path
          d={framePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={2.25}
          strokeLinecap="round"
          pathLength={100}
          className="neo-search-frame-chase__trail"
          filter="url(#neo-search-frame-glow)"
        />
        {/* Sudden bright head on the border line */}
        <path
          d={framePath}
          fill="none"
          stroke={frameColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          pathLength={100}
          className="neo-search-frame-chase__head"
          filter="url(#neo-search-frame-glow)"
        />
      </svg>
    </form>
  );
}
