
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sparkles, Zap, Moon, Sun, Check, ExternalLink } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const VIBES = [
  { 
    id: 'light', 
    name: 'Liquid Light', 
    desc: 'Crystalline & airy', 
    icon: Sun,
    color: 'bg-white',
    textColor: 'text-slate-900',
    preview: 'bg-slate-50'
  },
  { 
    id: 'ivanna-style', 
    name: 'Ivanna Art', 
    desc: 'Painted boutique luxury', 
    icon: Palette,
    color: 'bg-[#DDF4EF]',
    textColor: 'text-[#2C4C45]',
    preview: 'bg-[#DDF4EF]/30'
  },
  { 
    id: 'dark', 
    name: 'Black Matte', 
    desc: 'Cinematic deep dark', 
    icon: Moon,
    color: 'bg-zinc-900',
    textColor: 'text-white',
    preview: 'bg-zinc-800'
  },
  { 
    id: 'nexus-style', 
    name: 'Nexus Radar', 
    desc: 'High-tech neon matrix', 
    icon: Zap,
    color: 'bg-black',
    textColor: 'text-pink-500',
    preview: 'bg-blue-950/20'
  }
] as const;

export function ThemeSelector() {
  const { theme, setTheme, isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeVibe = VIBES.find(v => v.id === theme) || VIBES[0];

  const handleSelect = (vibeId: any, e: React.MouseEvent) => {
    triggerHaptic('medium');
    setTheme(vibeId, { x: e.clientX, y: e.clientY });
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button 
          onClick={() => triggerHaptic('light')}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all active:scale-95 group",
            isLight ? "bg-white/80 border-black/10 text-black shadow-sm" : "bg-black/60 border-white/10 text-white shadow-xl"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12",
            isLight ? "bg-black text-white" : "bg-white text-black"
          )}>
            <Palette className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic hidden sm:block">
            {activeVibe.name}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className={cn(
          "rounded-t-[3rem] border-t-0 p-0 overflow-hidden",
          isLight ? "bg-white text-slate-900" : "bg-black text-white"
        )}
      >
        <div className="p-8 pb-12">
          <SheetHeader className="mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <SheetTitle className={cn(
                        "text-3xl font-black uppercase italic tracking-tighter",
                        isLight ? "text-slate-900" : "text-white"
                    )}>
                        Select App Vibe
                    </SheetTitle>
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">
                        Synchronize your aesthetic interface
                    </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VIBES.map((vibe) => (
              <button
                key={vibe.id}
                onClick={(e) => handleSelect(vibe.id, e)}
                className={cn(
                  "relative p-6 rounded-[2rem] border transition-all text-left group overflow-hidden",
                  theme === vibe.id 
                    ? "border-primary ring-2 ring-primary/20 scale-[1.02]" 
                    : isLight ? "border-slate-100 bg-slate-50 hover:border-slate-300" : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                {/* Preview Accent */}
                <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
                    theme === vibe.id ? "bg-primary" : vibe.color
                )} />

                <div className="flex items-start gap-4 relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    vibe.color, vibe.textColor
                  )}>
                    <vibe.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase italic tracking-tighter text-lg">{vibe.name}</h3>
                        {theme === vibe.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{vibe.desc}</p>
                  </div>
                </div>

                {theme === vibe.id && (
                    <motion.div 
                        layoutId="active-vibe"
                        className="absolute inset-x-0 bottom-0 h-1 bg-primary"
                    />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Interface synchronized with cloud</span>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#EB4898] hover:underline">
                  Design Docs <ExternalLink className="w-3 h-3" />
              </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default memo(ThemeSelector);
