import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Compass, MapPin, Zap, Home, Bike, Car, Briefcase, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { OWNER_INTENT_CARDS } from './SwipeConstants';
import { triggerHaptic } from '@/utils/haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';

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
  const { setCategories, setClientType, setListingType } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleCategorySwitch = (card: any) => {
    triggerHaptic('medium');
    
    // 🚀 SPEED OF LIGHT: Pre-fetch before store update
    if (user?.id) {
      const filters = {
        clientType: card.clientType || 'all',
        listingType: card.listingType || 'all',
        categories: [card.category]
      };
      const filtersKey = JSON.stringify(filters);
      
      queryClient.prefetchQuery({
        queryKey: ['smart-clients', user.id, card.category, 0, false, filtersKey, false],
        staleTime: 60000,
      });
    }

    setCategories([card.category as any]);
    setClientType(card.clientType as any);
    setListingType(card.listingType as any);
  };

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
      title: `Refresh to discover more ${role === 'owner' ? 'Clients' : 'Listings'}`,
      description: `${role === 'owner' ? 'NEW CLIENTS ADDED REGULARLY.' : 'STAY TUNED FOR DAILY UPDATES.'}`,
      emoji: '🔍'
    };

    return base;
  };

  const emptyMsg = getEmptyMessage();
  const { title, description } = emptyMsg;
  const isError = 'isError' in emptyMsg ? emptyMsg.isError : false;

  // 🚀 SPEED: Manual category selection icons
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'property': return Home;
      case 'moto': return Car;
      case 'bicycle': return Bike;
      case 'workers': return Briefcase;
      default: return Settings2;
    }
  };

  if (isError) {
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
            <h3 className="text-2xl font-black mb-3 text-destructive tracking-tighter uppercase">{title}</h3>
            <p className="text-muted-foreground/80 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">{description}</p>
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
        key="empty" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative w-full z-50 flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0b]"
        style={{ minHeight: 'calc(100dvh - 120px)' }}
      >
        {/* 🚀 QUICK FILTERS (STRUCTURAL PARITY) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex-shrink-0 flex flex-wrap justify-center gap-3 mb-12"
        >
           {OWNER_INTENT_CARDS.map((card) => {
             const Icon = getCategoryIcon(card.category || '');
             const isActive = activeCategory === card.category;
             return (
               <button
                 key={card.id}
                 onClick={() => handleCategorySwitch(card)}
                 className={cn(
                   "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300",
                   "text-[10px] font-black uppercase tracking-widest border",
                   isActive 
                    ? "bg-brand-primary text-white border-brand-primary shadow-[0_0_20px_rgba(255,87,34,0.3)] scale-105" 
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20"
                 )}
               >
                 <Icon className="w-3.5 h-3.5" strokeWidth={3} />
                 {card.category}
               </button>
             );
           })}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-sm flex flex-col items-center space-y-12 z-10"
        >
          {/* ⚡️ REFRESH MODULE (SITS ABOVE RADAR PER REFERENCE) */}
          <div className="space-y-4">
             <h3 className="text-3xl font-black text-white tracking-tight leading-none">{title}</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{description}</p>
             
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-6">
               <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-16 px-10 rounded-[2rem] bg-gradient-to-r from-brand-primary to-orange-500 text-white font-black uppercase tracking-[0.25em] text-xs border-none shadow-[0_15px_40px_rgba(255,87,34,0.25)] relative overflow-hidden"
              >
                {isRefreshing && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                <div className="flex items-center gap-3">
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  <span>{isRefreshing ? 'Refreshing...' : `Refresh ${role === 'owner' ? 'Clients' : 'Listings'}`}</span>
                </div>
              </Button>
             </motion.div>
          </div>

          {/* 📍 RADAR MODULE (SITS AT BOTTOM PER REFERENCE) */}
          <div className="w-full bg-[#111112] border border-white/5 rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden group">
             {/* Glow rim */}
             <div className="absolute inset-0 border border-brand-primary/10 rounded-[2.5rem] group-hover:border-brand-primary/30 transition-colors duration-500" />
             
             <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                      <MapPin className="w-5 h-5 text-brand-primary" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Radar Radius</p>
                      <p className="text-base font-black text-white leading-none">Scanning Range</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                      <span className="text-base font-black italic text-brand-primary">{radiusKm}<span className="text-[10px] not-italic ml-1 opacity-50">km</span></span>
                    </div>
                    <button 
                      onClick={onDetectLocation}
                      className="h-9 px-4 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Zap className="w-3 h-3 text-brand-primary" fill="currentColor" />
                      Auto
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <SwipeDistanceSlider
                    radiusKm={radiusKm}
                    onRadiusChange={onRadiusChange}
                    onDetectLocation={onDetectLocation}
                    detecting={detecting}
                    detected={detected}
                  />
                </div>
                
                <div className="flex justify-between px-1">
                   <p className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">1 KM</p>
                   <p className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">100 KM+</p>
                </div>
             </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 pt-4 italic">
            NEW {role === 'owner' ? 'CLIENTS' : 'LISTINGS'} ARE ADDED DAILY
          </p>
        </motion.div>

        {/* 🚀 ATMOSPHERIC DEPTH (Z-INDEX 0) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] opacity-20" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
