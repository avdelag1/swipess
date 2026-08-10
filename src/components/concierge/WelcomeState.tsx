import { memo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FilterCategory, FILTERS } from './filterData';
import type { QuickFilterCategory } from '@/types/filters';

export const WelcomeState = memo(({ isSwipess, isLight, onPick }: { isSwipess: boolean; isLight: boolean; onPick: (prompt: string, category?: QuickFilterCategory | null) => void }) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
  const txtClr = isLight && !isSwipess ? 'text-foreground' : 'text-white';

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 pt-5 pb-4">
      <div className={cn("pb-5", txtClr)}>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase mb-1.5">
          {activeCategory ? activeCategory.label : 'Intel Core'}
        </h2>
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">
          {activeCategory ? 'Pick a prompt' : 'Choose a category'}
        </p>
      </div>

      {activeCategory ? (
        <div className="w-full space-y-3 flex-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn("text-[11px] font-semibold tracking-wide opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1", txtClr)}
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Back to categories
          </button>
          <div className="grid grid-cols-2 gap-3 content-start">
            {activeCategory.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => onPick(opt.prompt, activeCategory.category)}
                className={cn(
                  "relative overflow-hidden px-5 py-4 text-left transition-all duration-300 group active:scale-[0.96]",
                  isLight && !isSwipess ? "neo-naive-tile text-slate-800" : "neo-naive-tile--dark text-white"
                )}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(to right, transparent, ${activeCategory.glowColor})` }} />
                <span className="text-[13px] font-semibold leading-snug relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 flex-1 content-start">
          {FILTERS.map((cat, _i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "relative overflow-hidden p-6 text-center transition-all duration-300 group active:scale-[0.96]",
                isLight && !isSwipess ? "neo-naive-panel text-slate-800" : "neo-naive-panel--dark text-white"
              )}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${cat.glowColor}, transparent 80%)` }} />
              <div className="relative z-10">
                <span className={cn("text-base font-black uppercase tracking-widest", isLight && !isSwipess ? "text-slate-800" : "text-white/90")}>
                  {cat.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
WelcomeState.displayName = 'WelcomeState';
