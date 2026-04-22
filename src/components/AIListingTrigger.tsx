import { Sparkles, Building2, Bike, LayoutGrid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      label: 'Property', 
      description: 'Houses, Condos & Villas',
      icon: Building2, 
      color: '#ff4b6b', 
      bg: 'bg-[#ff4b6b]/15',
      glow: 'shadow-[#ff4b6b]/30',
      border: 'border-[#ff4b6b]/40'
    },
    { 
      id: 'motorcycle', 
      label: 'Motorcycle', 
      description: 'Vespas & Superbikes',
      icon: MotorcycleIcon, 
      color: '#ff8a3d', 
      bg: 'bg-[#ff8a3d]/15',
      glow: 'shadow-[#ff8a3d]/30',
      border: 'border-[#ff8a3d]/40'
    },
    { 
      id: 'bicycle', 
      label: 'Bicycle', 
      description: 'E-Bikes & Road Bikes',
      icon: Bike, 
      color: '#b166ff', 
      bg: 'bg-[#b166ff]/15',
      glow: 'shadow-[#b166ff]/30',
      border: 'border-[#b166ff]/40'
    },
    { 
      id: 'worker', 
      label: 'Worker', 
      description: 'Cleaners & Helpers',
      icon: WorkersIcon, 
      color: '#fbbd23', 
      bg: 'bg-[#fbbd23]/15',
      glow: 'shadow-[#fbbd23]/30',
      border: 'border-[#fbbd23]/40'
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
          className="w-10 h-10 flex items-center justify-center p-0 rounded-full relative group"
          style={glassPillStyle}
          title="Magic AI Listing"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          <Sparkles 
            className="w-5 h-5 text-indigo-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" 
            strokeWidth={2.5} 
          />
          
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
        </motion.button>
      </DialogTrigger>
      
      <DialogContent 
        className="!p-0 !border-none !bg-transparent !max-w-[480px] !w-[95vw] !h-auto sm:!max-h-[90vh] overflow-visible shadow-none focus:outline-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100, rotateX: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 150 }}
          className="relative rounded-[4rem] border border-white/20 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] bg-[#0a0a10]"
        >
          {/* 🌌 CINEMATIC DECORATION */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-950/60 via-[#0a0a10] to-purple-950/60" />
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-500/20 blur-[140px] rounded-full animate-pulse" />
             <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500/20 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
             <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>

          {/* 🏰 NEXUS HEADER */}
          <div className="relative px-12 pt-14 pb-10">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 animate-pulse" />
                      <div className="relative w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-[0_12px_48px_rgba(79,70,229,0.5)] ring-2 ring-white/30 group">
                         <Sparkles className="w-10 h-10 text-white animate-pulse" strokeWidth={2.5} />
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <h2 className="text-4xl font-black uppercase italic tracking-[0.05em] text-white leading-none drop-shadow-2xl">Nexus AI</h2>
                      <div className="flex items-center gap-3 mt-4">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                         <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.5em] opacity-80">Matrix Deployment v2.8</p>
                      </div>
                   </div>
                </div>
                <DialogClose className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:rotate-90 active:scale-90">
                   <X className="w-6 h-6 text-white/50" />
                </DialogClose>
             </div>
          </div>

          {/* 🎴 NEXUS GRID */}
          <div className="relative px-8 pb-10 grid grid-cols-2 gap-6">
             {categories.map((cat, idx) => (
                <motion.button
                   key={cat.id}
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 15 }}
                   whileHover={{ y: -10, scale: 1.03 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => handleSelect(cat.id)}
                   className={cn(
                      "group relative flex flex-col items-center justify-center p-10 rounded-[3.5rem] border border-white/[0.08] bg-white/[0.03] transition-all duration-500 overflow-hidden min-h-[220px]",
                      "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                   )}
                >
                   {/* Background Glow on Hover */}
                   <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl", cat.bg)} />
                   
                   <div className="relative z-10 flex flex-col items-center gap-8">
                      <div className={cn(
                         "w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                         cat.bg,
                         cat.glow,
                         "border-2",
                         cat.border,
                         "shadow-[inset_0_4px_12px_rgba(255,255,255,0.1)]"
                      )}>
                         <cat.icon 
                            className="w-10 h-10 transition-all duration-300" 
                            style={{ 
                               color: cat.color,
                               filter: `drop-shadow(0 0 12px ${cat.color})`
                            }} 
                         />
                      </div>
                      <div className="text-center">
                         <h4 className="text-[15px] font-black uppercase tracking-[0.3em] text-white/90 group-hover:text-white transition-colors leading-none italic">
                            {cat.label}
                         </h4>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 group-hover:text-white/40 mt-4 transition-colors">
                            {cat.description}
                         </p>
                      </div>
                   </div>
                </motion.button>
             ))}
          </div>

          {/* 🦾 NEXUS PROTOCOL BAR */}
          <div className="relative px-12 py-8 bg-gradient-to-r from-indigo-700 to-purple-800 flex items-center justify-between overflow-hidden">
             {/* Dynamic Scan Effect */}
             <motion.div 
                animate={{ x: ['-200%', '300%'] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-1/4 bg-white/30 skew-x-[45deg] blur-2xl opacity-50"
             />
             
             <div className="flex items-center gap-5 relative z-10">
                <div className="relative w-3 h-3">
                   <div className="absolute inset-0 bg-white blur-md animate-pulse" />
                   <div className="relative w-3 h-3 rounded-full bg-white shadow-[0_0_20px_#fff]" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-white italic drop-shadow-lg">Uplink Active</span>
             </div>
             
             <div className="flex items-center gap-4 relative z-10">
                <LayoutGrid className="w-5 h-5 text-white/60 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Nexus V2.8</span>
             </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
