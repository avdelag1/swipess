import { Sparkles, Building2, Bike, X, Briefcase } from 'lucide-react';
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
import { useState, memo } from 'react';

interface AIListingTriggerProps {
  glassPillStyle?: React.CSSProperties;
}

const categories = [
  { 
    id: 'property', 
    label: 'PROPERTY', 
    icon: Building2,
    color: 'text-rose-500'
  },
  { 
    id: 'motorcycle', 
    label: 'MOTORCYCLE', 
    icon: MotorcycleIcon,
    color: 'text-orange-500'
  },
  { 
    id: 'bicycle', 
    label: 'BICYCLE', 
    icon: Bike,
    color: 'text-violet-500'
  },
  { 
    id: 'worker', 
    label: 'JOB / SERVICE', 
    icon: Briefcase,
    color: 'text-amber-500'
  },
] as const;

export function AIListingTrigger({ glassPillStyle }: AIListingTriggerProps) {
  const { openAIListing } = useModalStore();
  const [open, setOpen] = useState(false);

  const handleSelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker') => {
    triggerHaptic('medium');
    openAIListing(category);
    setOpen(false);
  };

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
          className={cn(
            "w-11 h-11 flex items-center justify-center p-0 rounded-full relative group transition-all duration-500",
            "bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          )}
          title="Magic AI Listing"
        >
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          <Sparkles 
            className="w-5 h-5 text-white group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
            strokeWidth={2.5} 
          />
          {/* Pulsing ring for flagship visibility */}
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[ping_3s_infinite] opacity-50" />
        </motion.button>
      </DialogTrigger>
      
      <DialogContent 
        hideCloseButton
        className="!p-0 !border-none !bg-transparent !max-w-[760px] !w-[95vw] overflow-visible shadow-none focus:outline-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className={cn(
            "relative w-full rounded-[3.5rem] border overflow-hidden flex flex-col p-10 pb-12 shadow-[0_40px_120px_rgba(0,0,0,0.8)]",
            "bg-[#050505] border-white/10 text-white"
          )}
        >
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[100px]" />
          </div>

          {/* Header Area */}
          <div className="relative z-10 flex items-center justify-between mb-12">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-lg">
                   <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50">Swipess Intelligence</h2>
             </div>
             <DialogClose className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all group">
                <X className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
             </DialogClose>
          </div>

          {/* Hero Text */}
          <div className="relative z-10 mb-10 max-w-lg">
             <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 italic leading-none">
               Target Platform
             </h1>
             <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40 leading-relaxed">
               Select the deployment sector for your new Swipess artifact. Flagship intelligence will optimize for the target audience.
             </p>
          </div>

          {/* 2x2 Grid of Deployment Cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
             {categories.map((cat, idx) => (
                <motion.button
                   key={cat.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                   whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.04)' }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelect(cat.id)}
                   className="group relative flex items-center p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 transition-all duration-500 hover:border-white/15 shadow-2xl"
                >
                   {/* Card Glow */}
                   <div className={cn(
                     "absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-10 transition-opacity blur-2xl",
                     cat.id === 'property' ? 'bg-rose-500' :
                     cat.id === 'motorcycle' ? 'bg-orange-500' :
                     cat.id === 'bicycle' ? 'bg-violet-500' :
                     'bg-amber-500'
                   )} />

                   <div className="flex items-center gap-6 relative z-10">
                      <div className={cn(
                        "w-16 h-16 flex items-center justify-center rounded-[1.5rem] border transition-all duration-700 shadow-2xl",
                        "bg-white/[0.03] border-white/10 group-hover:scale-110 group-hover:rotate-3",
                        cat.id === 'property' ? 'text-rose-500 border-rose-500/20' :
                        cat.id === 'motorcycle' ? 'text-orange-500 border-orange-500/20' :
                        cat.id === 'bicycle' ? 'text-violet-500 border-violet-500/20' :
                        'text-amber-500 border-amber-500/20'
                      )}>
                         <cat.icon className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-lg font-black uppercase tracking-tight italic">
                           {cat.label}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">
                           Deploy Protocol
                        </span>
                      </div>
                   </div>
                </motion.button>
             ))}
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20">
             <div className="h-[1px] w-8 bg-white/20" />
             <span className="text-[8px] font-black uppercase tracking-[0.5em]">Secure Protocol Layer 4.0</span>
             <div className="h-[1px] w-8 bg-white/20" />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export const AIListingTriggerMemo = memo(AIListingTrigger);
export default AIListingTriggerMemo;
