import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { CategorySwipeStack } from '@/components/CategorySwipeStack';
import { Home, Bike, Wrench } from 'lucide-react';
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
              <div className="w-full py-4 mb-4">
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { id: 'property', label: 'Property', icon: Home },
                    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon },
                    { id: 'bicycle', label: 'Bicycle', icon: Bike },
                    { id: 'services', label: 'Workers', icon: Wrench },
                  ].map((cat) => {
                    const isActive = useFilterStore.getState().categories.includes(cat.id as any);
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const actions = useFilterStore.getState();
                          actions.setCategories([cat.id as any]);
                          onRefresh();
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all shadow-lg font-black uppercase tracking-widest text-[10px]",
                          isActive 
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-500 border-indigo-400 text-white shadow-indigo-500/30"
                            : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        <cat.icon className="w-4 h-4" />
                        <span>{cat.label}</span>
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
