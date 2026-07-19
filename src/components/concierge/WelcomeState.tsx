import { memo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FilterCategory, FILTERS } from './filterData';
import type { QuickFilterCategory } from '@/types/filters';

export const WelcomeState = memo(({ isSwipess, isLight, onPick }: { isSwipess: boolean; isLight: boolean; onPick: (prompt: string, category?: QuickFilterCategory | null) => void }) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
  const txtClr = isLight && !isSwipess ? 'text-foreground' : 'text-white';

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full">
      <div className={cn("pb-6", txtClr)}>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
          {activeCategory ? activeCategory.label : 'Intel Core'}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50">
          {activeCategory ? 'Select target trajectory' : 'Initialize search parameters'}
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
                  "relative overflow-hidden rounded-2xl px-5 py-4 text-left transition-all duration-300 group active:scale-[0.96]",
                  "border shadow-sm hover:shadow-lg",
                  isLight && !isSwipess
                    ? "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                    : "bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20 backdrop-blur-xl"
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
                "relative overflow-hidden rounded-[2rem] p-6 text-center transition-all duration-300 group active:scale-[0.96]",
                isLight && !isSwipess
                  ? "bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                  : "bg-white/[0.02] border-2 border-white/10 backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-white/20"
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
