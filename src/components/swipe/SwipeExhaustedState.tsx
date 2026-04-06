import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Compass, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';

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
  const categoryLower = categoryLabel.toLowerCase();

  // Generate specific empty message based on category
  const getEmptyMessage = () => {
    if (error && isInitialLoad) {
      return {
        title: 'System Disconnected',
        description: `We've lost the uplink to the ${categoryLower} grid. Recalibrate and try again.`,
        isError: true,
        emoji: '📡'
      };
    }

    const base = {
      title: `Discovery Complete`,
      description: `You've scanned all available ${categoryLower} in this sectors. Expand your range to reveal more.`,
      emoji: '🔍'
    };

    if (categoryLower === 'properties') {
      return { ...base, title: 'Real Estate Grid Exhausted', description: 'All active listings have been processed. New properties are syncing daily.' };
    }
    if (categoryLower === 'all') {
      return { ...base, title: 'Global Scan Complete', description: 'Every category in this region has been explored. Stay tuned for new updates.' };
    }
    return base;
  };

  const { title, description, isError } = getEmptyMessage();

  if (isError) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="error" 
          variants={deckFadeVariants} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          className="relative w-full flex-1 flex items-center justify-center px-4 bg-[#0a0a0b]"
          style={{ minHeight: 'calc(100dvh - 140px)' }}
        >
          <Card className="text-center bg-destructive/5 border-destructive/20 p-10 rounded-[3rem] backdrop-blur-3xl">
            <div className="text-7xl mb-6 animate-bounce">📡</div>
            <h3 className="text-2xl font-black mb-3 text-destructive tracking-tighter uppercase">{title}</h3>
            <p className="text-muted-foreground/80 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">{description}</p>
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              className="gap-3 h-14 px-8 rounded-full border-destructive/30 hover:bg-destructive/10 transition-all font-black uppercase text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Reconnect System
            </Button>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="empty" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden"
        style={{ backgroundColor: '#0a0a0b' }}
      >
        {/* 🚀 DISCOVERY PROTOCOL AMBIENT AURAS */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[160px] opacity-40 animate-pulse" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent-2/10 rounded-full blur-[140px] opacity-30" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] opacity-20" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="w-full max-w-md flex flex-col items-center space-y-8 z-10"
        >
          {/* 💎 WELL DONE DESIGN: Flagship Informative Hub */}
          <div className="w-full bg-white/[0.02] backdrop-blur-[32px] border border-white/10 rounded-[3.5rem] p-10 py-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            {/* Top Rim Catchlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Category Scan Marker */}
            <div className="flex flex-col items-center gap-8 mb-10">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-[20px] animate-pulse" />
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20 relative shadow-2xl">
                  {React.isValidElement(_CategoryIcon) ? (
                    _CategoryIcon
                  ) : _CategoryIcon ? (
                    (() => {
                      const IconComp = _CategoryIcon as React.ComponentType<any>;
                      return <IconComp className={cn("w-10 h-10 transition-all duration-500 group-hover:scale-110", _iconColor || "text-white")} strokeWidth={2.5} />;
                    })()
                  ) : (
                    <Compass className="w-10 h-10 text-brand-primary animate-spin-slow" strokeWidth={2.5} />
                  )}
                </div>
                {/* Orbital Particle */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-dashed border border-white/10 rounded-full pointer-events-none"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{title}</h3>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Sector Scanned & Ready</p>
                </div>
              </div>
            </div>

            <p className="text-white/60 text-sm max-w-[260px] mx-auto leading-relaxed font-medium mb-10">
              {description}
            </p>

            {/* 🚀 DISTANCE CONTROL MODULE */}
            <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-brand-primary px-3 py-0.5 rounded-full shadow-lg">
                <span className="text-[9px] font-black uppercase tracking-wider text-white">Coverage</span>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    <span className="text-xl font-black italic text-white">{radiusKm}<span className="text-[10px] uppercase ml-1 opacity-50">KM</span></span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/10">
                    Auto-Scale
                  </Button>
                </div>
                
                <SwipeDistanceSlider
                  radiusKm={radiusKm}
                  onRadiusChange={onRadiusChange}
                  onDetectLocation={onDetectLocation}
                  detecting={detecting}
                  detected={detected}
                />
              </div>
            </div>
          </div>
          
          {/* ⚡️ ACTION RADIUS */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full px-2">
             <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full h-20 rounded-[2.5rem] bg-gradient-to-br from-brand-primary to-orange-500 text-white hover:opacity-90 shadow-[0_20px_60px_rgba(255,87,34,0.3)] font-black uppercase tracking-[0.3em] text-[13px] border-none group relative overflow-hidden"
            >
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
              )}
              {isRefreshing ? (
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                  <span>Synchronizing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Zap className="w-5 h-5 fill-white group-hover:animate-pulse" />
                  <span>Expand Discovery</span>
                </div>
              )}
            </Button>
          </motion.div>

          <footer className="flex flex-col items-center gap-2 pt-4">
            <RadarSearchIcon size={16} isActive={true} />
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/20 italic">
              Discovery Engine v5.0.1
            </p>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
