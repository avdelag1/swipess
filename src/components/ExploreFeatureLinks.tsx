import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

interface ExploreFeatureLinksProps {
  isClient?: boolean;
}

export function ExploreFeatureLinks({ isClient: _isClient = true }: ExploreFeatureLinksProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8 flex flex-col gap-3">
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1">
        Explore Tulum
      </h3>

      {/* Promote Your Event — redesigned to match bold gradient pill style */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { haptics.select(); navigate('/client/advertise'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-16 rounded-2xl transition-all duration-300",
          "text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)]"
        )}
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.25),transparent_60%)] rounded-2xl pointer-events-none" />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shadow-inner relative z-10">
          <Megaphone className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black uppercase tracking-widest relative z-10">Promote Your Event</span>
      </motion.button>
    </div>
  );
}
