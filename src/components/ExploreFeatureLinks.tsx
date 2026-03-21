import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, Megaphone, Ticket } from 'lucide-react';
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

      {/* Events feed */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { haptics.select(); navigate('/explore/eventos'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-16 rounded-2xl transition-all duration-300",
          "bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-[0_8px_24px_rgba(244,63,94,0.35)]"
        )}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shadow-inner">
          <Ticket className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black uppercase tracking-widest">Events</span>
      </motion.button>

      {/* Promote Your Event — advertise form */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { haptics.select(); navigate('/client/advertise'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-14 rounded-2xl transition-all duration-300",
          "text-white"
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(168,85,247,0.18) 100%)',
          border: '1.5px solid rgba(251,146,60,0.4)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 shadow-inner">
          <Megaphone className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent tracking-wide">
          Promote Your Event or Service
        </span>
      </motion.button>
    </div>
  );
}
