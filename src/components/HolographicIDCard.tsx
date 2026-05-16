import React, { useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, MapPin, Briefcase, Globe, Sparkles } from 'lucide-react';
import { CardTheme } from './vap-id/cardThemes';
import { cn } from '@/lib/utils';

export interface HolographicIDCardProps {
  name: string;
  occupation?: string;
  city?: string;
  nationality?: string;
  avatarUrl?: string;
  tags?: string[];
  theme: CardTheme;
  idNumber: string;
}

export function HolographicIDCard({
  name,
  occupation,
  city,
  nationality,
  avatarUrl,
  tags = [],
  theme,
  idNumber,
}: HolographicIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
  
  // Shimmer Logic
  const shimmerX = useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]);
  const shimmerOpacity = useTransform(mouseXSpring, [-0.5, 0.5], [0.1, 0.3]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="perspective-1000 w-full h-full p-1"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          background: theme.background,
        }}
        className={cn(
          "relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col p-6 sm:p-8",
          theme.isDark ? "text-white" : "text-zinc-900"
        )}
      >
        {/* Holographic Shimmer Layer */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 60%)",
            x: shimmerX,
            opacity: shimmerOpacity,
            mixBlendMode: "overlay",
          }}
        />

        {/* Pattern Layer */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            background: theme.pattern, 
            opacity: theme.patternOpacity 
          }} 
        />

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with Photo and Name */}
          <div className="flex gap-6 mb-6">
            <div className="relative shrink-0" style={{ transform: "translateZ(40px)" }}>
              <div className="glass-surface w-[120px] h-[150px] sm:w-[140px] sm:h-[180px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black opacity-20">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand-accent-2 border-2 border-white flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-2 space-y-4" style={{ transform: "translateZ(30px)" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-accent-2 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-brand-accent-2/80">Authorized Resident</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black leading-tight tracking-tighter italic uppercase drop-shadow-md">
                  {name}
                </h3>
              </div>

              <div className="space-y-3">
                {occupation && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="opacity-60" />
                    <span className="text-sm font-black uppercase tracking-widest italic opacity-90">{occupation}</span>
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 opacity-60">
                  {(city || nationality) && (
                    <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest">
                      <MapPin size={14} />
                      <span>{[city, nationality].filter(Boolean).join(' • ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest">
                    <Globe size={14} />
                    <span>ID: {idNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags / Interests Section */}
          <div className="flex-1 flex flex-col" style={{ transform: "translateZ(20px)" }}>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-pill px-4 py-1.5 text-[10px] font-black uppercase italic tracking-widest"
                    style={{
                      backgroundColor: theme.tagBg,
                      borderColor: theme.tagBorder,
                      color: theme.tagText
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Footer with Branding */}
            <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Swipes Identity Protocol</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.15em] opacity-30">Swipes • Tulum • Swipess</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <div className="h-1 w-12 bg-brand-accent-2/40 rounded-full mb-1" />
                    <div className="h-1 w-8 bg-brand-accent-2/20 rounded-full" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glossy Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-black/20" />
      </motion.div>
    </div>
  );
}
