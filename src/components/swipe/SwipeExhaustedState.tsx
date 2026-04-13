import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, MapPin, Zap, Home, Bike, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Button } from '@/components/ui/button';
import { RadarSearchEffect } from '@/components/ui/RadarSearchEffect';
import { DistanceSlider } from './DistanceSlider';
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
  const [scanIteration, setScanIteration] = useState(0);
  const [isScanBurstActive, setIsScanBurstActive] = useState(false);

  useEffect(() => {
    if (scanIteration === 0) return;

    setIsScanBurstActive(true);
    const timeout = window.setTimeout(() => {
      setIsScanBurstActive(false);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [scanIteration]);

  const handleCategorySwitch = (catId: string) => {
    triggerHaptic('medium');
    setCategories([catId as any]);
  };

  const handleRefreshClick = () => {
    triggerHaptic('medium');
    setScanIteration((current) => current + 1);
    onRefresh();
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
          className="relative w-full z-50 flex flex-col items-center justify-center px-4 bg-background"
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
        className="relative z-50 h-full w-full overflow-y-auto overscroll-contain bg-background"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10"
            style={{ background: activeCatInfo?.color || '#ec4899' }}
          />
        </div>

        <div className="relative z-10 flex min-h-full flex-col px-4 pb-3 pt-2 sm:px-6 sm:pb-4 sm:pt-3">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex w-full justify-center"
          >
            <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2">
              {Object.entries(CATEGORY_ICONS).filter(([k]) => k !== 'worker').map(([catId, info]) => {
                const Icon = info.icon;
                const isActive = activeCategory === catId;
                return (
                  <button
                    key={catId}
                    onClick={() => handleCategorySwitch(catId)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] transition-all duration-300 sm:px-4",
                      isActive
                        ? "border-border bg-card/80 text-foreground shadow-lg"
                        : "border-border/60 bg-card/45 text-muted-foreground hover:bg-card/70 hover:text-foreground/80"
                    )}
                    style={isActive ? { boxShadow: `0 0 20px ${info.color}20` } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} style={isActive ? { color: info.color } : undefined} />
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex min-h-0 flex-1 flex-col items-center gap-3 py-2 sm:gap-4 sm:py-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <RadarSearchEffect
                key={scanIteration === 0 ? 'idle' : `scan-${scanIteration}`}
                size={96}
                color={activeCatInfo?.color || '#ec4899'}
                isActive={isScanBurstActive}
                autoStopMs={6000}
                icon={<ActiveIcon className="h-6 w-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" strokeWidth={1.5} />}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex max-w-sm flex-col items-center gap-3 text-center"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full bg-primary", scanIteration > 0 && "animate-pulse")} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    {isRefreshing || isScanBurstActive
                      ? `Scanning for ${role === 'owner' ? 'clients' : activeCatInfo?.label?.toLowerCase() || 'listings'}`
                      : 'Radar standing by'}
                  </span>
                  <div className={cn("h-1.5 w-1.5 rounded-full bg-primary", isScanBurstActive && "animate-pulse")} />
                </div>
                
                <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                  No new {role === 'owner' ? 'clients' : 'listings'} right now
                </h3>
                
                <p className="max-w-[320px] text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground/80">
                  Expand your radius or launch another short scan
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  className="relative h-10 overflow-hidden rounded-full border-0 px-7 text-[10px] font-black uppercase tracking-[0.24em] shadow-[var(--shadow-elegant)]"
                >
                  {isRefreshing && <div className="absolute inset-0 bg-background/15 animate-pulse" />}
                  <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? 'Scanning...' : 'Refresh'}
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto w-full max-w-md"
            >
              <div className="rounded-2xl border border-border/60 bg-card/55 p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Coverage</p>
                      <p className="text-sm font-black leading-none text-foreground">Search Radius</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1">
                      <span className="text-sm font-black text-primary">{radiusKm}<span className="ml-0.5 text-[9px] opacity-50">km</span></span>
                    </div>
                    {onDetectLocation && (
                      <button 
                        onClick={onDetectLocation}
                        className="flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/35 px-3 text-[8px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-secondary/55 hover:text-foreground"
                      >
                        <Zap className="h-3 w-3 text-primary" fill="currentColor" />
                        Auto
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <DistanceSlider
                    radiusKm={radiusKm}
                    onRadiusChange={onRadiusChange}
                    onDetectLocation={onDetectLocation || (() => {})}
                    detecting={detecting ?? false}
                    detected={detected ?? false}
                  />
                </div>
                
                <div className="mt-2 flex justify-between px-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/70">Local</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/70">100 km+</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
