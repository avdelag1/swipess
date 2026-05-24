import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Globe, Fingerprint, MapPin, Briefcase, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

const SectionLabel = ({ text }: { text: string }) => (
  <p className="text-[7px] font-black uppercase tracking-widest text-primary opacity-50">{text}</p>
);

export const HolographicIDCard = ({ profile }: { profile: any }) => {
  const { isLight } = useAppTheme();
  
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

  const hasOwnerFields = profile?.business_name !== undefined;
  const name = profile?.business_name || profile?.name || profile?.full_name || 'Authorized Member';
  const city = profile?.business_location || profile?.city || '';
  const nationality = profile?.nationality || '';
  const occupation = profile?.occupation || '';
  const bio = profile?.business_description || profile?.bio || '';
  const years = profile?.years_in_city ? `${profile.years_in_city} yr` : '';

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
          "relative w-full rounded-[2.5rem] overflow-hidden border transition-all duration-500",
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
        <div className="p-6 flex flex-col gap-3 relative z-[1]">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/60">Swipess Global Registry</span>
              </div>
              <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>
                {hasOwnerFields ? 'Asset ID' : 'Resident ID'}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Identity Row */}
          <div className="flex gap-3 items-center">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_15px_rgba(255,77,0,0.2)]">
                <img 
                  src={profile?.profile_images?.[0] || profile?.avatar_url || '/placeholder-avatar.png'} 
                  alt={hasOwnerFields ? 'Asset' : 'Resident'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0A0F1A] border border-white/10 flex items-center justify-center">
                <Fingerprint className="w-2 h-2 text-primary" />
              </div>
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-black uppercase", isLight ? "text-slate-900" : "text-white")}>{name}</p>
              <p className="text-[9px] font-mono tracking-widest text-primary/60">{hasOwnerFields ? 'AST' : 'SWS'}-{profile?.user_id?.slice(0, 4).toUpperCase() || 'TX99'}</p>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-[7px] font-black text-primary uppercase tracking-widest">Verified</span>
              </div>
            </div>
          </div>

          {/* Details Row */}
          {(occupation || city || nationality || years) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-muted-foreground">
              {occupation && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-primary/60" />{occupation}</span>}
              {city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary/60" />{city}{nationality && !hasOwnerFields ? ` · ${nationality}` : ''}</span>}
              {years && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary/60" />{years}</span>}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <p className={cn("text-[10px] leading-relaxed italic line-clamp-2", isLight ? "text-slate-500" : "text-white/50")}>
              {bio}
            </p>
          )}
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
