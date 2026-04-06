import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { CategorySwipeStack } from '@/components/CategorySwipeStack';
import { Home, Bike, User, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useFilterStore } from '@/state/filterStore';
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
        title: 'Oops! Something went wrong',
        description: `Let's try again to find some ${categoryLower}.`,
        isError: true
      };
    }

    if (categoryLower === 'properties') {
      return {
        title: 'Refresh to discover more Properties',
        description: 'New opportunities appear every day. Keep swiping!'
      };
    }
    if (categoryLower === 'motorcycles') {
      return {
        title: 'Refresh to find more Motorcycles',
        description: 'New bikes listed daily. Stay tuned!'
      };
    }
    if (categoryLower === 'bicycles') {
      return {
        title: 'Refresh to discover more Bicycles',
        description: 'Fresh rides added regularly. Keep checking!'
      };
    }
    if (categoryLower === 'workers' || categoryLower === 'services') {
      return {
        title: 'Refresh to find more Workers',
        description: 'New professionals join every day.'
      };
    }
    if (categoryLower === 'all') {
      return {
        title: 'Refresh to discover Everything',
        description: 'Combined feed of all active categories.'
      };
    }
    return {
      title: `Refresh to discover more ${categoryLabel}`,
      description: `New ${categoryLower} added regularly.`
    };
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
          className="relative w-full flex-1 flex items-center justify-center px-4 bg-background"
          style={{ minHeight: 'calc(100dvh - 140px)' }}
        >
          <Card className="text-center bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 p-8">
            <div className="text-6xl mb-4">:(</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            <Button onClick={onRefresh} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Try Again
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
        className="relative w-full flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
        style={{ 
          minHeight: 'calc(100dvh - 120px)', 
          paddingTop: '2.5rem',
          backgroundColor: '#0a0a0b', // Deep flagship black
        }}
      >
        {/* 🚀 VISUAL DEPTH: Discovery Protocol Ambient Auras */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] opacity-40 animate-pulse" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-accent-2/5 rounded-full blur-[100px] opacity-30" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] opacity-30" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm flex flex-col items-center space-y-10"
        >
          {/* 🚀 WELL DONE DESIGN: Information Hub Header */}
          <div className="flex flex-col items-center gap-6">
            <div className={cn(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden group",
              categoryLower === 'all' ? "bg-gradient-to-br from-brand-accent-2/20 to-brand-primary/20" : "bg-white/5"
            )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 text-transparent pointer-events-none" />
              {React.isValidElement(_CategoryIcon) ? (
                _CategoryIcon
              ) : (
                (() => {
                  const IconComp = _CategoryIcon as React.ComponentType<any>;
                  return <IconComp className={cn("w-10 h-10 transition-all duration-500 group-hover:scale-110", _iconColor || "text-white/60")} strokeWidth={2.5} />;
                })()
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
               <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{title}</h3>
               <div className="flex items-center justify-center animate-pulse gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-2" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Ready for scanning</p>
               </div>
              </div>
              <p className="text-muted-foreground text-[14px] max-w-[280px] mx-auto leading-relaxed font-medium opacity-80 decoration-brand-accent-2/20 underline-offset-8">
                {description}
              </p>
            </div>
          </div>

          {/* 🚀 DISTANCE SELECTOR NAVIGATION */}
          <div className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black px-4 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent-2">{radiusKm} KM RADIUS</span>
            </div>
            
            <SwipeDistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
            
            <div className="mt-8 flex items-center justify-center gap-2 py-2 px-4 bg-white/5 rounded-2xl border border-white/5">
              <RadarSearchIcon size={12} isActive={true} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 italic">Searching {categoryLabel} near you</span>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-2 w-full">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full h-20 rounded-[2rem] bg-gradient-to-r from-primary via-orange-500 to-brand-accent-2 text-white hover:opacity-90 shadow-[0_20px_40px_rgba(244,63,94,0.3)] font-black uppercase tracking-[0.3em] text-[13px] border-none"
            >
              {isRefreshing ? (
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                  <span>Scanning Field...</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <RefreshCw className="w-5 h-5" />
                  <span>Refresh {categoryLabel}</span>
                </div>
              )}
            </Button>
          </motion.div>

          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic pt-4">
            Sentient Discovery Protocol v4.0
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
