import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Home, Bike, User } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ListingSuccessCelebrationProps {
  isOpen: boolean;
  category: 'property' | 'motorcycle' | 'bicycle' | 'worker';
  onComplete: () => void;
}

const CATEGORY_CONFIG = {
  property: {
    color: 'from-rose-500 to-teal-600',
    glow: 'rgba(16, 185, 129, 0.5)',
    icon: Home,
    label: 'Property Materialized'
  },
  motorcycle: {
    color: 'from-orange-500 to-red-600',
    glow: 'rgba(249, 115, 22, 0.5)',
    icon: MotorcycleIcon,
    label: 'Engine Ignited'
  },
  bicycle: {
    color: 'from-purple-500 to-indigo-600',
    glow: 'rgba(168, 85, 247, 0.5)',
    icon: Bike,
    label: 'Gear Engaged'
  },
  worker: {
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.5)',
    icon: User,
    label: 'Expert Enlisted'
  }
};

export function ListingSuccessCelebration({ isOpen, category, onComplete }: ListingSuccessCelebrationProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const [_hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasStarted(true);
      const timer = setTimeout(() => {
        onComplete();
        setHasStarted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none"
        >
          {/* Main Success Aura - Ripple */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 4], 
              opacity: [0, 0.8, 0],
              borderRadius: ["20%", "40%", "50%"]
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn(
              "absolute w-[80vh] h-[80vh] bg-gradient-to-br blur-3xl",
              config.color
            )}
          />

          {/* Central Success Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ 
              scale: [0.8, 1.05, 1], 
              opacity: 1, 
              y: 0 
            }}
            exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* The Floating Core */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative group bg-card border border-border/50 backdrop-blur-xl"
              )}
            >
              {/* Spinning energy ring */}
              <motion.div
                className="absolute -inset-2 rounded-[2.5rem] border border-dashed border-primary/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              <Icon className={cn("w-10 h-10", category === 'property' ? 'text-rose-500' : category === 'motorcycle' ? 'text-orange-500' : category === 'bicycle' ? 'text-purple-500' : 'text-amber-500')} />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg border-2 border-background"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            </motion.div>

            <div className="text-center space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-foreground tracking-tight"
              >
                {config.label}
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Liquid Confetti (Soft Blobs) */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute w-4 h-4 rounded-full blur-md opacity-0",
                config.color
              )}
              initial={{ x: 0, y: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                opacity: [0, 0.6, 0],
                scale: [0, 2, 0]
              }}
              transition={{ 
                duration: 2, 
                delay: 0.2 + (i * 0.1),
                ease: "easeOut" 
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


