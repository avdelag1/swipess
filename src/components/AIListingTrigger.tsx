import { Sparkles, Building2, Bike, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/state/modalStore';
import { triggerHaptic } from '@/utils/haptics';
import { MotorcycleIcon } from './icons/MotorcycleIcon';
import { WorkersIcon } from './icons/WorkersIcon';
import { useState } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AIListingTriggerProps {
  glassPillStyle?: React.CSSProperties;
}

export function AIListingTrigger({ glassPillStyle }: AIListingTriggerProps) {
  const { openAIListing } = useModalStore();
  const [open, setOpen] = useState(false);
  const { isLight } = useAppTheme();

  const handleSelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker') => {
    triggerHaptic('medium');
    openAIListing(category);
    setOpen(false);
  };

  const categories = [
    { 
      id: 'property', 
      label: 'Automate Listing Property', 
      icon: Building2,
      color: 'text-rose-500'
    },
    { 
      id: 'motorcycle', 
      label: 'Motorcycles', 
      icon: MotorcycleIcon,
      color: 'text-orange-500'
    },
    { 
      id: 'bicycle', 
      label: 'Bicycle', 
      icon: Bike,
      color: 'text-violet-500'
    },
    { 
      id: 'worker', 
      label: 'Workers', 
      icon: WorkersIcon,
      color: 'text-amber-500'
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic('light');
          }}
          className="w-11 h-11 flex items-center justify-center p-0 rounded-full relative group transition-all duration-300"
          style={glassPillStyle}
          title="Magic AI Listing"
        >
          <Sparkles 
            className="w-5 h-5 text-indigo-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" 
            strokeWidth={2} 
          />
        </motion.button>
      </DialogTrigger>
      
      <DialogContent 
        hideCloseButton
        className="!p-0 !border-none !bg-transparent !max-w-[420px] !w-[90vw] !aspect-square overflow-visible shadow-none focus:outline-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={cn(
            "relative w-full h-full rounded-[2.5rem] border overflow-hidden flex flex-col p-6 shadow-[0_20px_80px_rgba(0,0,0,0.9)]",
            isLight 
              ? "bg-white border-black/10 text-black" 
              : "bg-[#050505]/95 backdrop-blur-3xl border-white/10 text-white"
          )}
        >
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Header Area */}
          <div className="flex items-center justify-between mb-6 px-2">
             <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h2 className={cn(
                  "text-[10px] font-black uppercase tracking-[0.4em] italic",
                  isLight ? "text-black/40" : "text-white/40"
                )}>Swipess AI Listing</h2>
             </div>
             <DialogClose className={cn(
               "p-2 rounded-full transition-colors",
               isLight ? "hover:bg-black/5" : "hover:bg-white/5"
             )}>
                <X className={cn("w-4 h-4", isLight ? "text-black/20" : "text-white/20")} />
             </DialogClose>
          </div>

          {/* 4 Large Rectangle Title Buttons */}
          <div className="flex-1 grid grid-cols-1 gap-3">
             {categories.map((cat, idx) => (
                <motion.button
                   key={cat.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.04 }}
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelect(cat.id)}
                   className={cn(
                     "group relative flex items-center justify-between px-8 rounded-3xl border transition-all duration-300",
                     isLight 
                       ? "bg-black/[0.03] border-black/5 hover:bg-black/[0.06] hover:border-black/10" 
                       : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10"
                   )}
                >
                   <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110",
                        isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/[0.04]",
                        cat.id === 'property' ? 'text-rose-500' :
                        cat.id === 'motorcycle' ? 'text-orange-500' :
                        cat.id === 'bicycle' ? 'text-violet-500' :
                        'text-amber-500'
                      )}>
                         <cat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={cn(
                          "text-[13px] font-black uppercase tracking-[0.15em] italic transition-colors",
                          isLight ? "text-black" : "text-white/90"
                        )}>
                           {cat.label}
                        </span>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] transition-colors",
                          isLight ? "text-black/30 group-hover:text-black/60" : "text-white/20 group-hover:text-white/40"
                        )}>
                          {cat.id === 'property' ? 'Residential Matrix' : 
                           cat.id === 'motorcycle' ? 'Velocity Units' : 
                           cat.id === 'bicycle' ? 'Pedal Kinetics' : 'Professional Units'}
                        </span>
                      </div>
                   </div>
                   <ChevronRight className={cn(
                     "w-4 h-4 transition-all group-hover:translate-x-1",
                     isLight ? "text-black/10 group-hover:text-black/40" : "text-white/10 group-hover:text-white/40"
                   )} />
                </motion.button>
             ))}
          </div>

          {/* Footer Branding */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center">
             <p className={cn(
               "text-[8px] font-black uppercase tracking-[0.5em] italic",
               isLight ? "text-black/10" : "text-white/10"
             )}>Secure Protocol Layer 4.0</p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
