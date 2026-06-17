import React, { useMemo } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Briefcase, Clock, Fingerprint, Globe, MapPin, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { ensureAbsoluteSupabaseUrl } from '@/utils/imageOptimization';

export const HolographicIDCard = ({ profile }: { profile: any }) => {
  const { isLight } = useAppTheme();
  const prefersReducedMotion = useReducedMotion();

  const disableTilt = useMemo(() => {
    if (prefersReducedMotion) return true;
    if (typeof navigator === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, [prefersReducedMotion]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 30 });

  function handleMouse(event: React.MouseEvent | React.TouchEvent) {
    if (disableTilt) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set(clientX - centerX);
    y.set(clientY - centerY);
  }

  function handleMouseLeave() {
    if (disableTilt) return;
    x.set(0);
    y.set(0);
  }

  const name = profile?.name || 'Authorized Member';
  const city = profile?.vap_city || profile?.city || '';
  const nationality = profile?.vap_nationality || profile?.nationality || '';
  const occupation = profile?.vap_occupation || profile?.occupation || '';
  const bio = profile?.vap_bio || profile?.bio || '';
  const years = profile?.vap_years_in_city || profile?.years_in_city ? `${profile.vap_years_in_city || profile.years_in_city} yr` : '';
  const avatar = profile?.vap_avatar || profile?.profile_images?.[0];
  
  const initials = name !== 'Authorized Member' ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'AM';

  return (
    <motion.div
      style={disableTilt ? { touchAction: 'pan-y' } : { perspective: 1000, touchAction: 'pan-y' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      className="relative w-full group"
    >
      <motion.div
        style={disableTilt ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
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
                Resident ID
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Identity Row */}
          <div className="flex gap-3 items-center">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                {avatar ? (
                  <img 
                    src={ensureAbsoluteSupabaseUrl(avatar)} 
                    alt={'Resident'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-black text-lg">{initials}</span>
                  </div>
                )}
              </div>
              <div className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border flex items-center justify-center", isLight ? "bg-white border-black/10" : "bg-[#0A0F1A] border-white/10")}>
                <Fingerprint className="w-2 h-2 text-primary" />
              </div>
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-black uppercase", isLight ? "text-slate-900" : "text-white")}>{name}</p>
              <p className="text-[9px] font-mono tracking-widest text-primary/60">SWS-{profile?.user_id?.slice(0, 4).toUpperCase() || 'TX99'}</p>
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
              {city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary/60" />{city}{nationality ? ` · ${nationality}` : ''}</span>}
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
