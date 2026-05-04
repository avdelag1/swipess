import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Building2 } from 'lucide-react';
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

      {/* Promote Your Event */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onPointerDown={() => { haptics.select(); navigate('/client/advertise'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-14 rounded-2xl transition-all duration-300",
          "text-white shadow-[0_8px_16px_rgba(236,72,153,0.25)]"
        )}
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.2),transparent_60%)] rounded-2xl pointer-events-none" />
        <Megaphone className="w-4 h-4 text-white relative z-10" strokeWidth={1.5} />
        <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Promote Your Event</span>
      </motion.button>

      {/* Advertise Your Brand */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onPointerDown={() => { haptics.select(); navigate('/client/advertise'); }}
        className={cn(
          "relative w-full flex items-center justify-center gap-3 h-14 rounded-2xl transition-all duration-300",
          "text-white shadow-[0_8px_16px_rgba(168,85,247,0.25)] border border-white/10"
        )}
        style={{
          background: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',
        }}
      >
        <Building2 className="w-4 h-4 text-white relative z-10" />
        <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Advertise Your Brand</span>
      </motion.button>
    </div>
  );
}


