import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, MapPin, Zap, Home, Bike, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Button } from '@/components/ui/button';
import { RadarSearchEffect } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';

interface SwipeExhaustedStateProps {
  categoryLabel: string;
  CategoryIcon: React.ReactNode | React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconColor?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
  error?: any;
  isInitialLoad?: boolean;
  role?: 'client' | 'owner';
}

const CATEGORY_ICONS: Record<string, { icon: any; label: string; color: string }> = {
  property:   { icon: Home,           label: 'Properties',  color: '#3b82f6' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motorcycles', color: '#f97316' },
  bicycle:    { icon: Bike,           label: 'Bicycles',    color: '#f43f5e' },
  services:   { icon: Briefcase,      label: 'Workers',     color: '#a855f7' },
  worker:     { icon: Briefcase,      label: 'Workers',     color: '#a855f7' },
};

export const SwipeExhaustedState = ({
  categoryLabel,
  CategoryIcon: _CategoryIcon,
  iconColor: _iconColor,
  isRefreshing,
  onRefresh,
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  error,
  isInitialLoad = false,
  role = 'client'
}: SwipeExhaustedStateProps) => {
  const { setCategories } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);

  const handleCategorySwitch = (catId: string) => {
    triggerHaptic('medium');
    setCategories([catId as any]);
  };

  const activeCatInfo = activeCategory ? CATEGORY_ICONS[activeCategory] : null;
  const ActiveIcon = activeCatInfo?.icon || Home;

  if (error && isInitialLoad) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="error" 
          variants={deckFadeVariants} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          className="relative w-full z-50 flex flex-col items-center justify-center px-4 bg-[#0a0a0b]"
          style={{ minHeight: 'calc(100dvh - 120px)' }}
        >
          <div className="text-center bg-destructive/5 border-destructive/20 p-10 rounded-[3rem] backdrop-blur-3xl border">
            <div className="text-7xl mb-6">📡</div>
            <h3 className="text-2xl font-black mb-3 text-destructive tracking-tighter uppercase">System Disconnected</h3>
            <p className="text-muted-foreground/80 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
              We've lost the uplink. Recalibrate and try again.
            </p>
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              className="gap-3 h-14 px-8 rounded-full border-destructive/30 hover:bg-destructive/10 transition-all font-black uppercase text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Repair Connection
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="searching" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative w-full h-full z-50 flex flex-col items-center justify-center bg-[#0a0a0b] overflow-hidden"
      >
        {/* Category Quick-Switch Pills */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-6 left-0 right-0 flex justify-center gap-2 px-4 z-20"
        >
          {Object.entries(CATEGORY_ICONS).filter(([k]) => k !== 'worker').map(([catId, info]) => {
            const Icon = info.icon;
            const isActive = activeCategory === catId;
            return (
              <button
                key={catId}
                onClick={() => handleCategorySwitch(catId)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                  "text-[9px] font-black uppercase tracking-widest border",
                  isActive 
                    ? "bg-white/10 text-white border-white/20 shadow-lg" 
                    : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"
                )}
                style={isActive ? { boxShadow: `0 0 20px ${info.color}20` } : undefined}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={isActive ? { color: info.color } : undefined} />
                <span className="hidden sm:inline">{info.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Central Radar + Searching Animation */}
        <div className="flex flex-col items-center gap-8">
          <RadarSearchEffect
            size={200}
            color={activeCatInfo?.color || '#ec4899'}
            isActive={true}
            icon={<ActiveIcon size={44} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                Scanning for {role === 'owner' ? 'clients' : activeCatInfo?.label?.toLowerCase() || 'listings'}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            
            <h3 className="text-xl font-black text-white/90 tracking-tight">
              No new {role === 'owner' ? 'clients' : 'listings'} right now
            </h3>
            
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 max-w-[260px]">
              Try expanding your radius or refreshing
            </p>
          </motion.div>

          {/* Refresh Button */}
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-14 px-10 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-black uppercase tracking-[0.2em] text-[10px] border-none shadow-[0_12px_35px_rgba(255,87,34,0.2)] relative overflow-hidden"
            >
              {isRefreshing && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Scanning...' : 'Refresh'}
            </Button>
          </motion.div>
        </div>

        {/* Distance Radar Module — Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-8 left-4 right-4 max-w-sm mx-auto"
        >
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2rem] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25">Coverage</p>
                  <p className="text-sm font-black text-white/80 leading-none">Search Radius</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.08]">
                  <span className="text-sm font-black text-primary">{radiusKm}<span className="text-[9px] ml-0.5 opacity-40">km</span></span>
                </div>
                {onDetectLocation && (
                  <button 
                    onClick={onDetectLocation}
                    className="h-8 px-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-[8px] font-black uppercase tracking-widest text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 text-primary" fill="currentColor" />
                    Auto
                  </button>
                )}
              </div>
            </div>

            <SwipeDistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
            
            <div className="flex justify-between px-1 mt-2">
              <span className="text-[7px] font-black uppercase tracking-widest text-white/15">Local</span>
              <span className="text-[7px] font-black uppercase tracking-widest text-white/15">100 km+</span>
            </div>
          </div>
        </motion.div>

        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10"
            style={{ background: activeCatInfo?.color || '#ec4899' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
