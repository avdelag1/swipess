import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

interface ExploreFeatureLinksProps {
  isClient?: boolean;
}

export function ExploreFeatureLinks({ isClient = true }: ExploreFeatureLinksProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 mb-3 px-1">
        Explore Tulum
      </h3>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { haptics.select(); navigate('/explore/eventos'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-16 rounded-2xl transition-all duration-300",
          "bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-[0_8px_24px_rgba(244,63,94,0.35)]"
        )}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shadow-inner">
          <PartyPopper className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black uppercase tracking-widest">What's Up Tulum</span>
      </motion.button>
    </div>
  );
}
