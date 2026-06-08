import { memo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FilterCategory, FILTERS } from './filterData';
import type { QuickFilterCategory } from '@/types/filters';

export const WelcomeState = memo(({ isSwipess, isLight, onPick }: { isSwipess: boolean; isLight: boolean; onPick: (prompt: string, category?: QuickFilterCategory | null) => void }) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
  const txtClr = isLight && !isSwipess ? 'text-foreground' : 'text-white';

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full">
      <div className={cn("pb-4 flex items-center gap-3", txtClr)}>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
           {activeCategory ? <activeCategory.icon className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            {activeCategory ? activeCategory.label : 'Hey there'}
          </h2>
          <p className="text-[11px] font-medium opacity-50 mt-0.5">
            {activeCategory ? 'Tap an option to search' : 'What are you looking for?'}
          </p>
        </div>
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
          {FILTERS.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 group",
                "active:scale-[0.96]",
                isLight && !isSwipess
                  ? "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                  : "bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-white/20",
                i === FILTERS.length - 1 && "col-span-2"
              )}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at right bottom, ${cat.glowColor}, transparent 70%)` }} />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300" style={{ background: `linear-gradient(135deg, ${cat.glowColor}11, transparent)`, border: `1px solid ${cat.glowColor}33`, color: cat.glowColor }}>
                  <cat.icon className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" />
                </div>
                <span className={cn("text-sm font-bold tracking-wide", isLight && !isSwipess ? "text-slate-800" : "text-white/90")}>
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
