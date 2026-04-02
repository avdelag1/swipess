import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { CategorySwipeStack } from '@/components/CategorySwipeStack';
import { Home, Bike, Wrench, User, Briefcase, Coins, CircleDollarSign } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
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
  CategoryIcon,
  iconColor,
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
        className="relative w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-background"
        style={{ minHeight: 'calc(100dvh - 120px)', paddingTop: '2.5rem' }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm flex flex-col items-center space-y-8"
        >
            {role === 'client' ? (
              <div className="relative w-full scale-[0.85] -mb-8">
                <CategorySwipeStack />
              </div>
            ) : (
              <div className="w-full py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* 1. Intent Filters */}
                <div className="flex flex-col items-center gap-6">
                  <div className="flex justify-center gap-4">
                    {/* Intent Filters */}
                    {[
                      { id: 'rent', icon: Home, color: 'from-emerald-600 to-emerald-400' },
                      { id: 'buy', icon: CircleDollarSign, color: 'from-amber-600 to-amber-400' },
                    ].map((st) => {
                      const isActive = useFilterStore.getState().listingType === st.id || useFilterStore.getState().listingType === 'both';
                      return (
                        <motion.button
                          key={st.id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                          transition={isActive ? { repeat: Infinity, duration: 3 } : {}}
                          onClick={() => {
                            const current = useFilterStore.getState().listingType;
                            useFilterStore.getState().setListingType(current === st.id ? 'both' : st.id as any);
                            onRefresh();
                          }}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
                            isActive 
                              ? `bg-gradient-to-br ${st.color} text-white shadow-${st.id === 'rent' ? 'emerald' : 'amber'}-500/30 ring-2 ring-white/50`
                              : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <st.icon className="w-5 h-5" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Human-Centric Category Filters */}
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { id: 'property', icon: Home, color: 'from-indigo-600 to-indigo-500' },
                    { id: 'motorcycle', icon: MotorcycleIcon, color: 'from-orange-600 to-orange-500' },
                    { id: 'bicycle', icon: Bike, color: 'from-violet-600 to-violet-500' },
                    { id: 'services', icon: Briefcase, color: 'from-teal-600 to-teal-500' },
                  ].map((cat) => {
                    const isActive = useFilterStore.getState().categories.includes(cat.id as any);
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={isActive ? { repeat: Infinity, duration: 2.5 } : {}}
                        onClick={() => {
                          const actions = useFilterStore.getState();
                          actions.setCategories([cat.id as any]);
                          onRefresh();
                        }}
                        className={cn(
                          "relative group flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all duration-500 min-w-[84px]",
                          isActive 
                            ? `bg-gradient-to-b ${cat.color} border-white/20 shadow-2xl`
                            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07]"
                        )}
                        style={{
                           boxShadow: isActive ? '0 20px 40px -10px rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        {/* Profile/Human Reference Icon */}
                        <div className="relative">
                          <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                             isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                          )}>
                             <User className={cn(
                                "w-6 h-6",
                                isActive ? "text-white" : "text-white/40"
                             )} />
                          </div>
                          
                          {/* Small context icon badge */}
                          <div className={cn(
                             "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border",
                             isActive ? "bg-white text-indigo-600 border-indigo-200" : "bg-zinc-800 text-white/60 border-white/10"
                          )}>
                             <cat.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Subtle indicator shadow */}
                        {isActive && (
                           <motion.div 
                              layoutId="active-indicator-shadow"
                              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/40 blur-md rounded-full"
                           />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

          <div className="space-y-3">
            <h3 className="text-xl font-black text-foreground tracking-tight leading-none">{title}</h3>
            <p className="text-muted-foreground text-[13px] max-w-[280px] mx-auto leading-relaxed font-bold uppercase tracking-wider opacity-80">
              {description}
            </p>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-2">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-3 rounded-2xl px-12 py-7 bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90 shadow-2xl font-black uppercase tracking-[0.2em] text-[12px] border-none"
            >
              {isRefreshing ? (
                <RadarSearchIcon size={20} isActive={true} />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {isRefreshing ? 'Scanning...' : `Refresh ${categoryLabel}`}
            </Button>
          </motion.div>

          <div className="w-full pt-4">
            <SwipeDistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 italic">
              New {categoryLower} are added daily
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
