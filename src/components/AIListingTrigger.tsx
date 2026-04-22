import { Sparkles, Building2, Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/state/modalStore';
import { triggerHaptic } from '@/utils/haptics';
import { MotorcycleIcon } from './icons/MotorcycleIcon';
import { WorkersIcon } from './icons/WorkersIcon';

interface AIListingTriggerProps {
  glassPillStyle?: React.CSSProperties;
}

export function AIListingTrigger({ glassPillStyle }: AIListingTriggerProps) {
  const { openAIListing } = useModalStore();

  const handleSelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker') => {
    triggerHaptic('medium');
    openAIListing(category);
  };

  const categories = [
    { id: 'property', label: 'Property', icon: Building2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'motorcycle', label: 'Motorcycle', icon: MotorcycleIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'worker', label: 'Worker', icon: WorkersIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic('light');
          }}
          className="w-10 h-10 flex items-center justify-center p-0 rounded-full relative group overflow-hidden"
          style={glassPillStyle}
          title="Magic AI Listing"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Sparkles 
            className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform duration-300" 
            strokeWidth={2.5} 
          />
          
          {/* Active status pulse */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        sideOffset={12}
        className="w-72 p-0 border-none bg-transparent overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-morphism rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Magic Wizard</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Choose Category</p>
              </div>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="p-3 grid grid-cols-2 gap-2 bg-black/40">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(cat.id)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] border border-white/5 transition-all group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner", cat.bg)}>
                  <cat.icon className={cn("w-5 h-5", cat.color)} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Footer Label */}
          <div className="px-6 py-3 bg-indigo-600 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white italic">Nexus AI Protocol Active</p>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
