import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { SwipeDistanceSlider } from './SwipeDistanceSlider';
import { deckFadeVariants } from '@/utils/modernAnimations';

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
  isInitialLoad = false
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
        style={{ minHeight: '100%' }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm flex flex-col items-center space-y-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse" />
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-current/10 to-current/5 border border-current/25 flex items-center justify-center ${iconColor || 'text-primary'} shadow-lg`}
              >
                {React.isValidElement(CategoryIcon) ? (
                  CategoryIcon
                ) : typeof CategoryIcon === 'function' || (typeof CategoryIcon === 'object' && CategoryIcon !== null) ? (
                  React.createElement(CategoryIcon as any, { 
                    className: "w-11 h-11", 
                    strokeWidth: 1.5 
                  })
                ) : (
                  CategoryIcon
                )}
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-foreground tracking-tight leading-none">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
              {description}
            </p>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-3 rounded-full px-10 py-6 bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90 shadow-xl font-black uppercase tracking-[0.15em] text-[11px] border-none"
            >
              {isRefreshing ? (
                <RadarSearchIcon size={20} isActive={true} />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {isRefreshing ? 'Scanning...' : `Refresh ${categoryLabel}`}
            </Button>
          </motion.div>

          <div className="w-full pt-6">
            <SwipeDistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.25em] text-foreground/60">
              New {categoryLower} are added daily
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
