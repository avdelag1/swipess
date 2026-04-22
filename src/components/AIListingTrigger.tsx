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

interface AIListingTriggerProps {
  glassPillStyle?: React.CSSProperties;
}

export function AIListingTrigger({ glassPillStyle }: AIListingTriggerProps) {
  const { openAIListing } = useModalStore();
  const [open, setOpen] = useState(false);

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
          className="w-10 h-10 flex items-center justify-center p-0 rounded-full relative group transition-all duration-300"
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
        className="!p-0 !border-none !bg-transparent !max-w-[420px] !w-[90vw] !aspect-square overflow-visible shadow-none focus:outline-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full h-full rounded-[2.5rem] border border-white/10 bg-[#050505]/95 backdrop-blur-3xl overflow-hidden flex flex-col p-6 shadow-[0_20px_80px_rgba(0,0,0,0.9)]"
        >
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Header Area */}
          <div className="flex items-center justify-between mb-6 px-2">
             <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Nexus AI Listing</h2>
             </div>
             <DialogClose className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-white/20" />
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
                   whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.15)' }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelect(cat.id)}
                   className="group relative flex items-center justify-between px-8 rounded-3xl border border-white/[0.04] bg-white/[0.01] transition-all duration-300"
                >
                   <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.04] group-hover:scale-110 transition-transform duration-500",
                        cat.id === 'property' ? 'text-rose-500' :
                        cat.id === 'motorcycle' ? 'text-orange-500' :
                        cat.id === 'bicycle' ? 'text-violet-500' :
                        'text-amber-500'
                      )}>
                         <cat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[13px] font-black uppercase tracking-[0.15em] text-white/90 italic transition-colors">
                           {cat.label}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">
                          {cat.id === 'property' ? 'Residential Matrix' : 
                           cat.id === 'motorcycle' ? 'Velocity Units' : 
                           cat.id === 'bicycle' ? 'Pedal Kinetics' : 'Professional Units'}
                        </span>
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </motion.button>
             ))}
          </div>

          {/* Footer Branding */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center">
             <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/10 italic">Secure Protocol Layer 4.0</p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
