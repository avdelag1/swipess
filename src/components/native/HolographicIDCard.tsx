import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

export const HolographicIDCard = ({ profile }: { profile: any }) => {
  const { isLight } = useAppTheme();
  
  // Motion values for the tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 30 });

  function handleMouse(event: React.MouseEvent | React.TouchEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(clientX - centerX);
    y.set(clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        perspective: 1000,
        touchAction: 'pan-y',
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      className="relative w-full group"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-56 w-full rounded-[2.5rem] overflow-hidden border transition-all duration-500",
          isLight ? "bg-white border-slate-200 shadow-xl" : "bg-[#0A0F1A] border-white/10 shadow-2xl shadow-primary/10"
        )}
      >
        {/* Holographic Shimmer Layer */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, 
              rgba(255,255,255,0) 0%, 
              rgba(255,255,255,0.05) 45%, 
              rgba(255,255,255,0.2) 50%, 
              rgba(255,255,255,0.05) 55%, 
              rgba(255,255,255,0) 100%)`,
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '200% 200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/60">Swipess Global Registry</span>
              </div>
              <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>
                Resident ID
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex gap-4 items-center">
              {/* Resident Photo Cluster */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_15px_rgba(255,77,0,0.2)]">
                  <img 
                    src={profile?.profile_images?.[0] || profile?.avatar_url || '/placeholder-avatar.png'} 
                    alt="Resident"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0A0F1A] border border-white/10 flex items-center justify-center">
                  <Fingerprint className="w-3 h-3 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-8">
                  <div className="space-y-0.5">
                    <p className="text-[7px] font-black uppercase tracking-widest text-primary opacity-50">Identity Name</p>
                    <p className={cn("text-sm font-black uppercase", isLight ? "text-slate-900" : "text-white")}>{profile?.name || profile?.full_name || 'Authorized Member'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[7px] font-black uppercase tracking-widest text-primary opacity-50">VAP Code</p>
                    <p className={cn("text-sm font-black uppercase", isLight ? "text-slate-900" : "text-white")}>SWS-{profile?.id?.slice(0, 4).toUpperCase() || profile?.user_id?.slice(0, 4).toUpperCase() || 'TX99'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Verified Resident</span>
                  </div>
                </div>
              </div>
            </div>

            <Fingerprint className="w-12 h-12 text-primary/10 opacity-0" />
          </div>
        </div>

        {/* Micro-Circuit Pattern Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '16px 16px',
          }}
        />
      </motion.div>
    </motion.div>
  );
};
