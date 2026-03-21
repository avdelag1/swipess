import { useState, useCallback, useEffect, memo, useRef, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/utils/haptics';
import { SimpleSwipeCard, SimpleSwipeCardRef } from './SimpleSwipeCard';
import { SwipeActionButtonBar } from './SwipeActionButtonBar';
import { preloadImageToCache } from '@/lib/swipe/imageCache';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';

// FIX #3: Lazy-load modals to prevent them from affecting swipe tree
// These are rendered via portal outside the swipe container's React tree
const SwipeInsightsModal = lazy(() => import('./SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
import { useSmartListingMatching, ListingFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useSwipe } from '@/hooks/useSwipe';
import { useStartConversation } from '@/hooks/useConversations';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { useSwipePrefetch, usePrefetchManager } from '@/hooks/usePrefetchManager';
import { useSwipeDeckStore, persistDeckToSession } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, RefreshCw, Home, Bike, Briefcase, MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { logger } from '@/utils/prodLogger';
import { MessageConfirmationDialog } from './MessageConfirmationDialog';
import { DirectMessageDialog } from './DirectMessageDialog';
import { isDirectMessagingListing } from '@/utils/directMessaging';
import { useQueryClient } from '@tanstack/react-query';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';

// Category configuration for dynamic empty states
const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; plural: string; color: string }> = {
  property: { icon: Home, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: Bike, label: 'Bicycle', plural: 'Bicycles', color: 'text-emerald-500' },
  services: { icon: Briefcase, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: Briefcase, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
};

// Helper to get the active category display info from filters
// Accepts optional storeCategory (directly from Zustand) for guaranteed sync with quick filters
const getActiveCategoryInfo = (filters?: ListingFilters, storeCategory?: string | null) => {
  try {
    // PRIORITY 1: Direct store category (most reliable - always in sync with quick filter UI)
    if (storeCategory && typeof storeCategory === 'string' && categoryConfig[storeCategory]) {
      return categoryConfig[storeCategory];
    }

    // Safety: Handle null/undefined filters
    if (!filters) return categoryConfig.property;

    // Check for activeUiCategory first (original UI category before DB mapping)
    const activeUiCategory = (filters as any).activeUiCategory;
    if (activeUiCategory && typeof activeUiCategory === 'string' && categoryConfig[activeUiCategory]) {
      return categoryConfig[activeUiCategory];
    }

    // Check for activeCategory string first (from AdvancedFilters)
    const activeCategory = (filters as any).activeCategory;
    if (activeCategory && typeof activeCategory === 'string' && categoryConfig[activeCategory]) {
      return categoryConfig[activeCategory];
    }

    // Check for categories array (from quick filters) - may be DB-mapped names
    const categories = filters?.categories;
    if (Array.isArray(categories) && categories.length > 0) {
      const cat = categories[0] as any;
      if (typeof cat === 'string') {
        // Direct match
        if (categoryConfig[cat]) {
          return categoryConfig[cat];
        }
        // Handle DB-mapped names back to UI names
        if (cat === 'worker' && categoryConfig['services']) {
          return categoryConfig['services'];
        }
        // Handle common variations/misspellings
        const normalized = cat.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
        if (categoryConfig[normalized]) {
          return categoryConfig[normalized];
        }
        // Map 'services' -> 'worker' (common mapping)
        if (cat === 'services' && categoryConfig['worker']) {
          return categoryConfig['worker'];
        }
        // Map 'moto' <-> 'motorcycle'
        if ((cat === 'moto' || cat === 'motorcycle')) {
          return categoryConfig['motorcycle'];
        }
      }
    }

    // Check for single category
    const category = filters?.category;
    if (category && typeof category === 'string' && categoryConfig[category]) {
      return categoryConfig[category];
    }

    // Default to properties (no category filter selected)
    return categoryConfig.property;
  } catch (error) {
    logger.error('[SwipessSwipeContainer] Error in getActiveCategoryInfo:', error);
    return categoryConfig.property;
  }
};

// Navigation guard to prevent double-taps
function useNavigationGuard() {
  const isNavigatingRef = useRef(false);
  const lastNavigationRef = useRef(0);

  const canNavigate = useCallback(() => {
    const now = Date.now();
    if (isNavigatingRef.current || now - lastNavigationRef.current < 300) {
      return false;
    }
    return true;
  }, []);

  const startNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    lastNavigationRef.current = Date.now();
  }, []);

  const endNavigation = useCallback(() => {
    isNavigatingRef.current = false;
  }, []);

  return { canNavigate, startNavigation, endNavigation };
}

// PrefetchScheduler imported from '@/lib/swipe/PrefetchScheduler'

// ── Distance Slider Component ─────────────────────────────────────────────────
interface DistanceSliderProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
}

const DistanceSlider = ({ radiusKm, onRadiusChange, onDetectLocation, detecting, detected }: DistanceSliderProps) => {
  const maxKm = 100;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="w-full max-w-xs mx-auto mt-2 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Distance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-primary">{radiusKm} km</span>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all"
            style={{
              background: detected ? 'rgba(249,115,22,0.12)' : 'transparent',
              borderColor: detected ? 'rgba(249,115,22,0.4)' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              color: detected ? '#f97316' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
            }}
          >
            <Navigation className="w-2.5 h-2.5" />
            {detecting ? '...' : detected ? 'GPS' : 'Detect'}
          </button>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(radiusKm / maxKm) * 100}%`,
              background: 'linear-gradient(90deg, #ec4899, #f97316)',
            }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={maxKm}
          step={1}
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="absolute w-full opacity-0 h-6 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${(radiusKm / maxKm) * 100}% - 10px)`,
            background: 'linear-gradient(135deg, #ec4899, #f97316)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground font-bold">1 km</span>
        <span className="text-[10px] text-muted-foreground font-bold">100 km</span>
      </div>
    </div>
  );
};

// Module-level constant — no state dependencies, safe to share across sub-components
const deckFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

// ── FAN POKER CARD QUICK FILTER ───────────────────────────────────────────────
// 5 carousel photos per category, glassmorphic cards fanned like a poker hand

const FAN_CARD_PHOTOS: Record<string, string[]> = {
  property: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=320&q=75&auto=format',
  ],
  motorcycle: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1568772585407-9f217f7b5f5e?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=320&q=75&auto=format',
  ],
  bicycle: [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=320&q=75&auto=format',
  ],
  services: [
    'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=320&q=75&auto=format',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=320&q=75&auto=format',
  ],
};

// Minimal single-weight SVG line icons — no color, no fill, no cartoonish detail
const IconProperty = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z"/>
    <path d="M9 21V13h6v8"/>
  </svg>
);
const IconMoto = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17" r="2.5"/>
    <circle cx="18.5" cy="17" r="2.5"/>
    <path d="M8 17h7"/>
    <path d="M18.5 17 16 9h-4.5L10 13 5.5 17"/>
    <path d="M15 9l1-3h3"/>
  </svg>
);
const IconBicycle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17" r="3"/>
    <circle cx="18.5" cy="17" r="3"/>
    <path d="M5.5 17 10 9h5l3.5 8"/>
    <path d="M5.5 17 9 11"/>
    <circle cx="12" cy="7" r="1"/>
    <path d="M12 8v1"/>
  </svg>
);
const IconWorker = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const FAN_CARDS = [
  { id: 'property' as const, label: 'Properties', Icon: IconProperty, accent: '#3b82f6', accentRgb: '59,130,246', description: 'Houses & apts', rotate: -11, tx: -56, ty: 14 },
  { id: 'motorcycle' as const, label: 'Motorcycles', Icon: IconMoto, accent: '#f97316', accentRgb: '249,115,22', description: 'Bikes & scooters', rotate: -3.5, tx: -19, ty: 3 },
  { id: 'bicycle' as const, label: 'Bicycles', Icon: IconBicycle, accent: '#22c55e', accentRgb: '34,197,94', description: 'City & mountain', rotate: 3.5, tx: 19, ty: 3 },
  { id: 'services' as const, label: 'Workers', Icon: IconWorker, accent: '#a855f7', accentRgb: '168,85,247', description: 'Skilled freelancers', rotate: 11, tx: 56, ty: 14 },
];

// Card dimensions — large enough to feel immersive, tight enough to fit the fan
const CARD_W = 215;
const CARD_H = 355;

// Fan geometry — very slight tilt so cards feel almost upright
const FAN_CARDS_WITH_POS = [
  { ...FAN_CARDS[0], rotate: -7,  tx: -26, ty: 10  },
  { ...FAN_CARDS[1], rotate: -2.2,tx: -9,  ty: 2   },
  { ...FAN_CARDS[2], rotate: 2.2, tx: 9,   ty: 2   },
  { ...FAN_CARDS[3], rotate: 7,   tx: 26,  ty: 10  },
];

const FanPokerCard = memo(({ card, index, isPreviewing, onTap, photoIdx }: {
  card: typeof FAN_CARDS_WITH_POS[0];
  index: number;
  isPreviewing: boolean;
  onTap: () => void;
  photoIdx: number;
}) => {
  const photos = FAN_CARD_PHOTOS[card.id];
  const activePhoto = photoIdx % photos.length;

  return (
    <motion.button
      onClick={onTap}
      data-testid={`fan-filter-${card.id}`}
      initial={{ opacity: 0, scale: 0.78, rotate: card.rotate, x: card.tx, y: card.ty + 50 }}
      animate={isPreviewing ? {
        opacity: 1, scale: 1.06, rotate: 0, x: 0, y: -24, zIndex: 30,
      } : {
        opacity: 1, scale: 1, rotate: card.rotate, x: card.tx, y: card.ty, zIndex: index + 1,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.7, delay: isPreviewing ? 0 : index * 0.055 }}
      whileTap={{ scale: 0.97 }}
      className="absolute pointer-events-auto"
      style={{
        width: CARD_W,
        height: CARD_H,
        left: '50%',
        top: '50%',
        marginLeft: -(CARD_W / 2),
        marginTop: -(CARD_H / 2),
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: isPreviewing
          ? `0 30px 60px rgba(${card.accentRgb},0.5), 0 10px 30px rgba(0,0,0,0.55)`
          : `0 14px 36px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.25)`,
        transformOrigin: 'bottom center',
        WebkitTapHighlightColor: 'transparent',
        border: `1.5px solid rgba(${card.accentRgb},${isPreviewing ? 0.75 : 0.22})`,
      }}
    >
      {/* Photos — cinematic scale+opacity crossfade (Ken Burns breath) */}
      <div className="absolute inset-0 bg-zinc-900 overflow-hidden">
        {photos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            style={{
              opacity: i === activePhoto ? 1 : 0,
              transform: i === activePhoto ? 'scale(1.0)' : 'scale(1.07)',
              transition: 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1), transform 2.4s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'opacity, transform',
            }}
          />
        ))}
      </div>

      {/* Gradient vignette — dark at bottom for label readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.82) 100%)`,
        }}
      />

      {/* Top progress dots */}
      <div className="absolute top-3 left-0 right-0 flex justify-center gap-[3px] px-4">
        {photos.map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: 2.5,
              background: i === activePhoto
                ? `rgba(${card.accentRgb},1)`
                : 'rgba(255,255,255,0.25)',
              transition: 'background 1s ease',
            }}
          />
        ))}
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 36, height: 36,
              background: `rgba(${card.accentRgb}, 0.18)`,
              border: `1px solid rgba(${card.accentRgb}, 0.35)`,
              color: `rgba(${card.accentRgb}, 1)`,
            }}
          >
            <card.Icon />
          </div>
          <div>
            <p className="text-white font-black text-[14px] tracking-tight leading-tight">{card.label}</p>
            <p className="text-white/55 text-[11px] leading-tight">{card.description}</p>
          </div>
        </div>
      </div>

      {/* Previewing: pulsing accent ring */}
      {isPreviewing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: `inset 0 0 0 2.5px rgba(${card.accentRgb},0.85)`, borderRadius: 22 }}
        />
      )}
    </motion.button>
  );
});

FanPokerCard.displayName = 'FanPokerCard';

interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

const SwipeAllDashboard = ({ setCategories }: SwipeAllDashboardProps) => {
  // null = no card selected; string = that card is previewing (lifted)
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [photoIndices, setPhotoIndices] = useState([0, 0, 0, 0]);
  const cyclingCardRef = useRef(0);

  // Staggered cycling: one card's photo changes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const cardTurn = cyclingCardRef.current;
      setPhotoIndices(prev => {
        const next = [...prev];
        next[cardTurn] = (next[cardTurn] + 1) % 5;
        return next;
      });
      cyclingCardRef.current = (cardTurn + 1) % FAN_CARDS.length;
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTap = useCallback((id: string) => {
    triggerHaptic('light');
    if (previewCard === id) {
      // Second tap on the same previewing card → apply the filter and navigate
      triggerHaptic('medium');
      setCategories([id]);
    } else {
      // First tap (or switching to a different card) → preview it
      setPreviewCard(id);
    }
  }, [previewCard, setCategories]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="all-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-1 flex flex-col items-center justify-center"
        style={{ minHeight: 'calc(100dvh - 140px)' }}
        onClick={() => previewCard && setPreviewCard(null)}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-[0.06] blur-3xl bg-gradient-radial from-primary via-purple-500 to-transparent" />
        </div>

        {/* Fan container — stop propagation so card taps don't hit the backdrop */}
        <div
          className="relative"
          style={{ width: '100%', maxWidth: 380, height: CARD_H + 60, zIndex: 10 }}
          onClick={e => e.stopPropagation()}
        >
          {FAN_CARDS_WITH_POS.map((card, i) => (
            <FanPokerCard
              key={card.id}
              card={card}
              index={i}
              isPreviewing={previewCard === card.id}
              onTap={() => handleTap(card.id)}
              photoIdx={photoIndices[i]}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── SwipeLoadingSkeleton ─────────────────────────────────────────────────────
// GPU-accelerated skeleton shown on first load before data hydration.
const SwipeLoadingSkeleton = () => (
  <AnimatePresence mode="wait">
    <motion.div key="skeleton" variants={deckFadeVariants} initial="initial" animate="animate" exit="exit" className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3 bg-background">
      <div className="relative flex-1 w-full">
        <div className="absolute inset-0 overflow-hidden" style={{ transform: 'translateZ(0)', contain: 'paint' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 35%, #cbd5e1 65%, #94a3b8 100%)' }} />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 75%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
              transform: 'translateZ(0)',
            }}
          />
          <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={`skeleton-dot-${num}`} className="flex-1 h-1 rounded-full bg-white/30" />
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 rounded-t-[24px] p-4 pt-6">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1.5 bg-white/30 rounded-full" />
            </div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-white/20 rounded-lg" />
                <div className="h-4 w-1/2 bg-white/15 rounded-lg" />
              </div>
              <div className="text-right space-y-1">
                <div className="h-6 w-20 bg-white/20 rounded-lg" />
                <div className="h-3 w-12 bg-white/15 rounded-lg ml-auto" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-white/15 rounded-full" />
              <div className="h-4 w-12 bg-white/15 rounded-full" />
              <div className="h-4 w-16 bg-white/15 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex justify-center items-center py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
          <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
          <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
          <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

interface SwipessSwipeContainerProps {
  onListingTap: (listingId: string) => void;
  onInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
  locationFilter?: {
    latitude: number;
    longitude: number;
    city?: string;
    radius: number;
  } | null;
  filters?: ListingFilters;
}

const SwipessSwipeContainerComponent = ({ onListingTap, onInsights: _onInsights, onMessageClick: _onMessageClick, locationFilter: _locationFilter, filters }: SwipessSwipeContainerProps) => {
  const [page, setPage] = useState(0);
  const [_swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshMode, setIsRefreshMode] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [directMessageDialogOpen, setDirectMessageDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  // ── Distance filter state ─────────────────────────────────────────────────
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const setRadiusKm = useFilterStore((s) => s.setRadiusKm);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const setCategories = useFilterStore((s) => s.setCategories);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setLocationDetected(true);
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [setUserLocation]);

  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // PERF: Use selective subscriptions to prevent re-renders on unrelated store changes
  // Only subscribe to actions (stable references) - NOT to clientDeck object
  // This is the key fix for "double render" feeling when navigating back to dashboard
  const setClientDeck = useSwipeDeckStore((state) => state.setClientDeck);
  const markClientSwiped = useSwipeDeckStore((state) => state.markClientSwiped);
  const resetClientDeck = useSwipeDeckStore((state) => state.resetClientDeck);
  const isClientHydrated = useSwipeDeckStore((state) => state.isClientHydrated);
  const isClientReady = useSwipeDeckStore((state) => state.isClientReady);
  const markClientReady = useSwipeDeckStore((state) => state.markClientReady);

  // Read active category directly from filter store for guaranteed sync with quick filter UI
  // This ensures empty state messages update instantly when user clicks a quick filter
  const storeCategories = useFilterStore((state) => state.categories);
  const storeActiveCategory = storeCategories.length > 0 ? storeCategories[0] : null;

  // Local state for immediate UI updates - drives the swipe animation
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Track deck length in state to force re-render when listings are appended
  // Without this, appending to deckQueueRef doesn't trigger re-render and empty state persists
  const [_deckLength, setDeckLength] = useState(0);

  // Prevents skeleton flash when filters change — holds back skeleton for one render frame
  const [isTransitioning, setIsTransitioning] = useState(false);

  // =============================================================================
  // FIX #1: SWIPE PHASE ISOLATION - DOM moves first, React cleans up after
  // This is the key to "Tinder-level" feel: freeze React during the swipe gesture
  // =============================================================================
  interface PendingSwipe {
    listing: any;
    direction: 'left' | 'right';
    newIndex: number;
  }
  const pendingSwipeRef = useRef<PendingSwipe | null>(null);
  const isSwipeAnimatingRef = useRef(false);

  // PERF: Get initial state ONCE using getState() - no subscription
  // This is synchronous and doesn't cause re-renders when store updates
  // FIX: Don't restore from cache — always start empty and let DB query populate
  // The DB query (with refetchOnMount:'always') excludes swiped items at SQL level
  // Restoring from cache caused swiped cards to reappear across sessions/dashboard switches
  const getInitialDeck = () => {
    return [];
  };

  // CONSTANT-TIME SWIPE DECK: Use refs for queue management (no re-renders on swipe)
  // Initialize synchronously from persisted state to prevent dark/empty cards
  // PERF: Use getState() for initial values - no subscription needed
  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentIndexRef = useRef(useSwipeDeckStore.getState().clientDeck.currentIndex);
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDeck.swipedIds));
  const _initializedRef = useRef(deckQueueRef.current.length > 0);

  // Ref to trigger swipe animations from the fixed action buttons
  const cardRef = useRef<SimpleSwipeCardRef>(null);

  // Sync state with ref on mount
  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  // FILTER CHANGE DETECTION: Handled by the filterSignature-based effect below (lines ~556-578).
  // A single reset path prevents duplicate state mutations that cause React error #185.

  // PERF FIX: Track if we're returning to dashboard (has hydrated data AND is ready)
  // When true, skip initial animations to prevent "double render" feeling
  // Use isReady flag from store to determine if deck is fully initialized
  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().clientDeck.isReady
  );
  const _hasAnimatedOnceRef = useRef(isReturningRef.current);

  // PERF FIX: Eagerly preload top 5 cards' images when we have hydrated deck data
  // This runs SYNCHRONOUSLY during component initialization (before first paint)
  // The images will be in cache when TinderSwipeCard renders, preventing any flash
  // ALWAYS keep 2-3 cards preloaded to prevent swipe delays
  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;

    // Preload ALL images of current + next 4 cards for smooth swiping
    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4].forEach((offset) => {
      const card = deckQueueRef.current[currentIdx + offset];
      if (card?.images && Array.isArray(card.images)) {
        card.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
            imageCache.set(imgUrl, true);
          }
        });
      }
    });

    // Also batch preload with ImagePreloadController for decode support
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }

  // PERF: Throttled prefetch scheduler
  const prefetchSchedulerRef = useRef(new PrefetchScheduler());

  // Fetch guards
  const isFetchingMore = useRef(false);

  // Navigation guard
  const { canNavigate, startNavigation, endNavigation } = useNavigationGuard();

  // ─── PREDICTIVE CARD TRANSITIONS ─────────────────────────────────────────
  // Shared MotionValue: top card writes its X position here so the card
  // underneath can react in real-time without any React re-renders.
  const topCardX = useMotionValue(0);

  // Next card scales up and brightens as the top card is dragged away.
  // At rest (topCardX=0): scale 0.97, opacity 0.72  — the normal "peek" state.
  // At threshold (topCardX=±280): scale 1.0, opacity 0.98 — fully revealed.
  const nextCardScale = useTransform(
    topCardX,
    [-280, -60, 0, 60, 280],
    [1.0,  1.0, 0.97, 1.0, 1.0]
  );
  const nextCardOpacity = useTransform(
    topCardX,
    [-280, -60, 0, 60, 280],
    [0.98, 0.92, 0.72, 0.92, 0.98]
  );

  // Tracks whether the user has completed at least one swipe this session.
  // Used to gate the entrance spring so the very first card doesn't animate in.
  const hasSwipedRef = useRef(false);
  // ─────────────────────────────────────────────────────────────────────────

  // FIX: Hydration sync disabled — DB query is the single source of truth
  // The query with refetchOnMount:'always' ensures fresh data on every mount
  // No need to restore stale cached decks that may contain already-swiped items
  useEffect(() => {
    // Clear any stale session storage on mount
    try { sessionStorage.removeItem('swipe-deck-client-listings'); } catch (_err) { /* Ignore session storage errors */ }
  }, []);

  // PERF FIX: Removed competing filter hydration from client_filter_preferences.
  // useFilterPersistence (in PersistentDashboardLayout) is the SINGLE source of truth
  // for restoring saved filters from the database. Having two hydration paths
  // caused a race condition where both bumped filterVersion, triggering cascading
  // re-renders that led to React Error #185 (Maximum update depth exceeded).

  // Cleanup on unmount
  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  // Hooks for functionality
  const { canAccess: hasPremiumMessaging, needsUpgrade } = useCanAccessMessaging();
  const navigate = useNavigate();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing: _isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const swipeMutation = useSwipe();
  const startConversation = useStartConversation();

  // Swipe dismissal tracking
  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('listing');

  // FIX: Sync local state when undo completes successfully
  useEffect(() => {
    if (undoSuccess) {
      // Get the updated state from the store
      const storeState = useSwipeDeckStore.getState();
      const newIndex = storeState.clientDeck.currentIndex;

      // Sync local refs and state with store
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);

      // Sync the entire swipedIds set with store (source of truth)
      swipedIdsRef.current = new Set(storeState.clientDeck.swipedIds);

      // Reset undo state so this effect doesn't run again
      resetUndoState();

      logger.info('[SwipessSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
  }, [undoSuccess, resetUndoState]);
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  // PERF: Initialize swipeQueue with user ID for fire-and-forget background writes
  // This eliminates the async auth call on every swipe
  useEffect(() => {
    if (user?.id) {
      swipeQueue.setUserId(user.id);
    }
  }, [user?.id]);

  // PERF FIX: Build filters from Zustand store directly instead of props.
  // This eliminates the cascading object recreation chain:
  // MyHub → ClientDashboard → SwipessSwipeContainer
  // Each intermediary was creating new filter objects on every filterVersion bump.
  const storeFilterVersion = useFilterStore((state) => state.filterVersion);
  const stableFilters = useMemo(() => {
    const state = useFilterStore.getState();
    return state.getListingFilters() as ListingFilters;
    // Only recompute when filterVersion changes (actual filter mutation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion]);

  // PERF FIX: Create stable filter signature for deck versioning
  // This detects when filters actually changed vs just navigation return
  const filterSignature = useMemo(() => {
    return [
      stableFilters.category || '',
      stableFilters.categories?.join(',') || '',
      stableFilters.listingType || '',
      stableFilters.priceRange?.join('-') || '',
      stableFilters.bedrooms?.join(',') || '',
      stableFilters.bathrooms?.join(',') || '',
      stableFilters.amenities?.join(',') || '',
      stableFilters.propertyType?.join(',') || '',
      stableFilters.petFriendly ? '1' : '0',
      stableFilters.furnished ? '1' : '0',
      stableFilters.verified ? '1' : '0',
      stableFilters.premiumOnly ? '1' : '0',
      stableFilters.showHireServices ? '1' : '0',
      stableFilters.clientGender || '',
      stableFilters.clientType || '',
    ].join('|');
  }, [stableFilters]);

  // Track previous filter signature to detect filter changes
  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  // PERF FIX: Track previous listing IDs signature to detect actual data changes
  // Declared early so they can be used in both filter reset and data append effects
  const prevListingIdsRef = useRef<string>('');
  const hasNewListingsRef = useRef(false);

  // Detect filter changes (not navigation)
  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
  }

  // PERF FIX: Reset deck ONLY when filters actually change (not on navigation return)
  // This effect uses filterSignature as dependency to detect genuine filter changes
  useEffect(() => {
    // Skip on initial mount
    if (!filterChangedRef.current) return;

    // Reset the filter changed flag
    filterChangedRef.current = false;

    // Signal transition start — suppresses skeleton for one frame to avoid flash
    setIsTransitioning(true);

    // Clear deck for fresh results with new filters
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    setPage(0);

    // Clear persisted deck since filters changed
    resetClientDeck();

    // Force UI update
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);

    // Clear flag after one frame so skeleton can appear with a fade instead of a flash
    requestAnimationFrame(() => setIsTransitioning(false));
  }, [filterSignature, resetClientDeck]);

  // Get listings with filters - PERF: pass userId to avoid getUser() inside queryFn
  const {
    data: smartListings = [],
    isLoading: smartLoading,
    isFetching: smartFetching,
    error: smartError,
    refetch: refetchSmart
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 10, isRefreshMode);

  const isLoading = smartLoading;
  const isFetching = smartFetching;
  const error = smartError;

  // PERF FIX: Cheap signature using first ID + last ID + length (avoids expensive join)
  // This prevents unnecessary deck updates when React Query returns same data with new reference
  const listingIdsSignature = useMemo(() => {
    if (smartListings.length === 0) return '';
    return `${smartListings[0]?.id || ''}_${smartListings[smartListings.length - 1]?.id || ''}_${smartListings.length}`;
  }, [smartListings]);

  // Determine if we have genuinely new data (not just reference change)
  if (listingIdsSignature !== prevListingIdsRef.current && listingIdsSignature.length > 0) {
    const currentIds = new Set(deckQueueRef.current.map(l => l.id));
    const newIds = smartListings.filter(l => !currentIds.has(l.id) && !swipedIdsRef.current.has(l.id));
    hasNewListingsRef.current = newIds.length > 0;
    prevListingIdsRef.current = listingIdsSignature;
  }

  // Prefetch images for next cards (3 profiles ahead for smoother swiping)
  // PERF: Use currentIndex state as trigger (re-runs when index changes)
  usePrefetchImages({
    currentIndex: currentIndex,
    profiles: deckQueueRef.current,
    prefetchCount: 5,
    trigger: currentIndex
  });

  // Prefetch next batch of listings when approaching end of current batch
  // Uses requestIdleCallback internally for non-blocking prefetch
  useSwipePrefetch(
    currentIndexRef.current,
    page,
    deckQueueRef.current.length,
    stableFilters as unknown
  );

  // PERFORMANCE: Prefetch next listing details when viewing current card
  // This pre-loads the data for the insights dialog
  // PERF: Guard with route check - skip expensive work when navigated away
  // PERF: Use throttled scheduler to not compete with current image decode
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const { prefetchListingDetails } = usePrefetchManager();

  useEffect(() => {
    // Skip expensive prefetch when not on dashboard - reduces CPU during route transitions
    if (!isDashboard) return;

    const nextListing = deckQueueRef.current[currentIndex + 1];
    if (nextListing?.id) {
      // PERF: Use throttled scheduler - waits 300ms then uses requestIdleCallback
      // This ensures prefetch doesn't compete with current image decoding
      prefetchSchedulerRef.current.schedule(() => {
        prefetchListingDetails(nextListing.id);
      }, 300);
    }

    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };

  }, [currentIndex, prefetchListingDetails, isDashboard]); // currentIndex updates on each swipe, triggering reliable prefetch

  // CONSTANT-TIME: Append new unique listings to queue AND persist to store
  // PERF FIX: Only run when we have genuinely new listings (not just reference change)
  // Uses listingIdsSignature for stable dependency instead of smartListings array
  useEffect(() => {
    // Guard: Only process if we have new data and not in initial loading state
    if (!hasNewListingsRef.current || isLoading) {
      // Still reset the fetching flag when loading completes
      if (!isLoading && !isFetching) {
        isFetchingMore.current = false;
      }
      return;
    }

    // Reset the new listings flag
    hasNewListingsRef.current = false;

    const existingIds = new Set(deckQueueRef.current.map(l => l.id));
    const dismissedSet = new Set(dismissedIds);
    const newListings = smartListings.filter(l =>
      !existingIds.has(l.id) && !swipedIdsRef.current.has(l.id) && (!isRefreshMode ? !dismissedSet.has(l.id) : true)
    );

    if (newListings.length > 0) {
      deckQueueRef.current = [...deckQueueRef.current, ...newListings];
      // Cap at 50 listings
      if (deckQueueRef.current.length > 50) {
        const offset = deckQueueRef.current.length - 50;
        deckQueueRef.current = deckQueueRef.current.slice(offset);
        const newIndex = Math.max(0, currentIndexRef.current - offset);
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
      }

      // FIX: Force re-render when deck goes from empty to populated
      // Without this, the "No Listings Found" empty state persists because
      // appending to deckQueueRef alone doesn't trigger a React re-render
      setDeckLength(deckQueueRef.current.length);

      // PERSIST: Save to store and session for navigation survival
      setClientDeck(deckQueueRef.current, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current);

      // PERF: Mark deck as ready for instant return on re-navigation
      // This ensures that when user returns to dashboard, we skip all initialization
      if (!isClientReady()) {
        markClientReady();
      }
    }

    isFetchingMore.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  // Get current visible cards for 2-card stack (top + next)
  // Use currentIndex from state (already synced with currentIndexRef)
  const deckQueue = deckQueueRef.current;
  // FIX: Don't clamp the index - allow topCard to be null when all cards are swiped
  // This ensures the "All Caught Up" screen shows correctly
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const _nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

  // =============================================================================
  // FIX #1: SWIPE PHASE ISOLATION - Two-phase swipe for Tinder-level feel
  // PHASE 1 (0-200ms): DOM only - card flies away, React is frozen
  // PHASE 2 (after animation): Flush all state to React/Zustand/persistence
  // =============================================================================

  // PHASE 2: Called AFTER animation completes - flush all pending state
  const flushPendingSwipe = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending) return;

    const { listing, direction, newIndex } = pending;

    // Clear pending immediately to prevent double-flush
    pendingSwipeRef.current = null;
    isSwipeAnimatingRef.current = false;

    // Reset shared motion value BEFORE React re-render so new top card
    // mounts with x=0 (prevents stale rotation/opacity on the incoming card)
    topCardX.set(0);

    // Gate entrance animation — only spring-in for cards after the first swipe
    hasSwipedRef.current = true;

    // NOW it's safe to update React state - animation is done
    setCurrentIndex(newIndex);

    // Update local ref for swiped IDs (already done in phase 1, but ensure consistency)
    swipedIdsRef.current.add(listing.id);

    // FIX: Save to DB FIRST, then update cache only on success
    // This prevents liked listings from showing in cache if DB save fails
    if (direction === 'right') {
      // Save swipe to DB with proper error handling
      swipeMutation.mutateAsync({
        targetId: listing.id,
        direction,
        targetType: 'listing'
      }).then(() => {
        // SUCCESS: Add the liked listing to the cache AFTER DB write succeeds
        queryClient.setQueryData(['liked-properties'], (oldData: any[] | undefined) => {
          const currentListing = listing;
          if (!oldData) {
            return [currentListing];
          }
          // Check if already in the list to avoid duplicates
          const exists = oldData.some((item: any) => item.id === currentListing.id);
          if (exists) {
            return oldData;
          }
          return [currentListing, ...oldData];
        });
      }).catch((err) => {
        // ERROR: DB save failed - show error to user
        logger.error('[SwipessSwipeContainer] Failed to save like:', err);

        // Only show error for unexpected failures (not duplicates/RLS)
        const errorMessage = err?.message?.toLowerCase() || '';
        const errorCode = err?.code || '';
        const isExpectedError =
          errorMessage.includes('duplicate') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('unique constraint') ||
          errorCode === '23505' || // Unique constraint violation
          errorCode === '42501';   // RLS policy violation

        if (!isExpectedError) {
          toast.error('Failed to save like', {
            description: 'Your like was not saved. Please try again.',
          });
        }
      });
    } else {
      // For left swipes (dislikes), just save without cache update
      swipeMutation.mutateAsync({
        targetId: listing.id,
        direction,
        targetType: 'listing'
      }).catch((err) => {
        // Non-critical - dislike not saved, but user can continue swiping
        logger.error('[SwipessSwipeContainer] Failed to save dislike:', err);
      });
    }

    // Track dismissal on left swipe (dislike)
    if (direction === 'left') {
      dismissTarget(listing.id).catch(() => {
        // Non-critical error - already logged in hook
      });
    }

    // Zustand update - DEFERRED until animation complete
    markClientSwiped(listing.id);

    // Record for undo (only left swipes are saved for undo)
    recordSwipe(listing.id, 'listing', direction);

    // FIX #2: DEFERRED PERSISTENCE - use requestIdleCallback
    // This prevents sessionStorage from blocking the main thread
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, { timeout: 2000 });
    } else {
      // Fallback: defer to next frame at minimum
      setTimeout(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, 0);
    }

    // Background: Profile view recording (non-critical, fire-and-forget)
    queueMicrotask(() => {
      recordProfileView.mutateAsync({
        profileId: listing.id,
        viewType: 'listing',
        action: direction === 'right' ? 'like' : 'pass'
      }).catch(() => { /* fire-and-forget: ignore analytics errors */ });
    });

    // Clear direction for next swipe
    setSwipeDirection(null);

    // Fetch more if running low
    // FIX: Prevent pagination when deck is exhausted to avoid empty fetch errors
    // Only fetch more if we're within the deck bounds (haven't swiped past the last card)
    // AND we're approaching the end (within 3 cards of the end)
    if (
      newIndex < deckQueueRef.current.length &&
      newIndex >= deckQueueRef.current.length - 3 &&
      deckQueueRef.current.length > 0 &&
      !isFetchingMore.current &&
      !error // Don't try to fetch more if previous fetch errored
    ) {
      isFetchingMore.current = true;
      setPage(p => p + 1);
    }

    // Eagerly preload next card's image using both preloaders
    const nextNextCard = deckQueueRef.current[newIndex + 1];
    if (nextNextCard?.images?.[0]) {
      preloadImageToCache(nextNextCard.images[0]);
      // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
      imageCache.set(nextNextCard.images[0], true);
      imagePreloadController.preload(nextNextCard.images[0], 'high');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordSwipe, recordProfileView, markClientSwiped, queryClient, dismissTarget, swipeMutation, error]);

  // PHASE 1: Called when user swipes - ONLY updates refs and triggers animation
  // NO React state updates, NO Zustand updates, NO persistence
  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    // Prevent double-swipe while animation is in progress
    if (isSwipeAnimatingRef.current) return;

    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    const newIndex = currentIndexRef.current + 1;

    // PHASE 1: Only update refs and trigger animation
    // NO setCurrentIndex, NO markClientSwiped, NO persistence
    isSwipeAnimatingRef.current = true;
    pendingSwipeRef.current = { listing, direction, newIndex };

    // Update ONLY the refs (no React re-render)
    currentIndexRef.current = newIndex;
    swipedIdsRef.current.add(listing.id);

    // Trigger exit animation direction (this is the ONLY React state we touch)
    setSwipeDirection(direction);

    // SAFETY NET: If animation callback doesn't fire within 350ms, force flush
    // This prevents stuck state if onAnimationComplete fails
    setTimeout(() => {
      if (pendingSwipeRef.current?.listing.id === listing.id) {
        flushPendingSwipe();
      }
    }, 350);
  }, [flushPendingSwipe]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    // Immediate haptic feedback
    triggerHaptic(direction === 'right' ? 'success' : 'warning');

    // Play swipe sound effect
    playSwipeSound(direction);

    // INSTANT SWIPE: Always execute immediately - never block on image prefetch
    // The next card will show with skeleton placeholder until image loads
    executeSwipe(direction);

    // AGGRESSIVE PREFETCH: Preload ALL images of next 5 cards to prevent blink
    // Use BOTH preloaders for maximum cache coverage and instant display
    const imagesToPreload: string[] = [];
    [1, 2, 3, 4, 5].forEach((offset) => {
      const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
      if (futureCard?.images && Array.isArray(futureCard.images)) {
        futureCard.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
            imageCache.set(imgUrl, true);
          }
        });
      }
    });

    // Batch preload with ImagePreloadController (decodes images for instant display)
    // First 3 get high priority, rest get low priority
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }, [executeSwipe, playSwipeSound]);

  // Button-triggered swipe - animates the card via ref
  const handleButtonLike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('right');
    }
  }, []);

  const handleButtonDislike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('left');
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshMode(true);
    triggerHaptic('medium');

    // Reset local state and refs
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);

    // Reset store
    resetClientDeck();

    try {
      await refetchSmart();
      const refreshCategoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
      const refreshLabel = String(refreshCategoryInfo?.plural || 'Listings').toLowerCase();
      toast.success(`${String(refreshCategoryInfo?.plural || 'Listings')} Refreshed`, {
        description: `Showing ${refreshLabel} you passed on. Liked ones stay saved!`,
      });
    } catch (_err) {
      toast.error('Refresh Failed', {
        description: 'Please try again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInsights = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (listing?.id) {
      navigate(`/listing/${listing.id}`);
    } else {
      setInsightsModalOpen(true);
    }
    triggerHaptic('light');
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  };

  const handleMessage = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];

    if (!canNavigate()) return;

    if (!listing?.owner_id) {
      toast.error('Cannot Start Conversation', {
        description: 'Owner information not available.',
      });
      return;
    }

    // Check if this is a direct messaging category (motorcycle/bicycle)
    // These categories allow free messaging without subscription or quota checks
    const isDirectMessaging = isDirectMessagingListing(listing);

    if (isDirectMessaging) {
      // Direct messaging for motorcycles and bicycles - no subscription required
      logger.info('[SwipessSwipeContainer] Direct messaging category detected, opening direct message dialog');
      setSelectedListing(listing);
      setDirectMessageDialogOpen(true);
      triggerHaptic('light');
      return;
    }

    // Standard flow for properties and other categories - requires subscription
    if (needsUpgrade) {
      startNavigation();
      navigate('/client/settings#subscription');
      toast('Subscription Required', {
        description: 'Upgrade to message property owners.',
      });
      setTimeout(endNavigation, 500);
      return;
    }

    if (!hasPremiumMessaging) {
      startNavigation();
      navigate('/client/settings#subscription');
      setTimeout(endNavigation, 500);
      return;
    }

    // Open confirmation dialog with message quota info
    logger.info('[SwipessSwipeContainer] Message icon clicked, opening confirmation dialog');
    setSelectedListing(listing);
    setMessageDialogOpen(true);
    triggerHaptic('light');
  };

  const handleSendMessage = async (message: string) => {
    if (isCreatingConversation || !selectedListing?.owner_id) return;

    // Content moderation check
    const { validateContent: vc } = await import('@/utils/contactInfoValidation');
    const result = vc(message);
    if (!result.isClean) {
      toast.error('Content blocked', { description: result.message });
      return;
    }

    setIsCreatingConversation(true);
    startNavigation();

    try {
      toast('Creating conversation...', {
        description: 'Please wait'
      });

      const result = await startConversation.mutateAsync({
        otherUserId: selectedListing.owner_id,
        listingId: selectedListing.id,
        initialMessage: message,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Conversation created!', {
          description: 'Opening chat...'
        });
        setMessageDialogOpen(false);
        setDirectMessageDialogOpen(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        logger.error('[SwipessSwipe] Error starting conversation:', err);
      }
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Could not start conversation'
      });
    } finally {
      setIsCreatingConversation(false);
      endNavigation();
    }
  };

  // PREMIUM: Hover-based prefetch - prefetch next batch when user hovers near bottom of deck
  const handleDeckHover = useCallback(() => {
    // Only prefetch if we're running low and not already fetching
    const remainingCards = deckQueueRef.current.length - currentIndexRef.current;
    // Don't fetch if we're past the end of the deck (remainingCards <= 0)
    if (remainingCards > 0 && remainingCards <= 5 && !isFetchingMore.current) {
      isFetchingMore.current = true;
      setPage(p => p + 1);

      // Also preload next 4 card images opportunistically using BOTH preloaders
      const imagesToPreload: string[] = [];
      [1, 2, 3, 4].forEach((offset) => {
        const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
        if (futureCard?.images?.[0]) {
          imagesToPreload.push(futureCard.images[0]);
          preloadImageToCache(futureCard.images[0]);
          // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
          imageCache.set(futureCard.images[0], true);
        }
      });

      // Use ImagePreloadController for decode (ensures GPU-ready images)
      if (imagesToPreload.length > 0) {
        imagePreloadController.preloadBatch(imagesToPreload);
      }
    }
  }, []);

  const _progress = deckQueue.length > 0 ? ((currentIndex + 1) / deckQueue.length) * 100 : 0;

  // Check if we have hydrated data (from store/session) - prevents blank deck flash
  // isReady means we've fully initialized at least once - skip loading UI on return
  // CRITICAL FIX: When filters change, deck is reset, so check if we're actually loading new data
  const hasHydratedData = (isClientHydrated() || isClientReady() || deckQueue.length > 0) && !isLoading;

  // ── "ALL" DASHBOARD: Shown when no category filter is selected ──────────────
  if (storeCategories.length === 0) {
    return <SwipeAllDashboard setCategories={setCategories} />;
  }

  // STABLE LOADING SHELL: Only show full skeleton if NOT hydrated AND loading
  if (!hasHydratedData && isLoading && !isTransitioning) {
    return <SwipeLoadingSkeleton />;
  }

  // Exhausted/Empty state - dynamic based on category
  if (currentIndex > 0 && currentIndex >= deckQueue.length) {
    const categoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
    return (
      <SwipeExhaustedState
        categoryLabel={String(categoryInfo?.plural || 'listings')}
        CategoryIcon={categoryInfo?.icon || Home}
        iconColor={categoryInfo?.color || 'text-primary'}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onDetectLocation={detectLocation}
        detecting={locationDetecting}
        detected={locationDetected}
      />
    );
  }


  // Error state - ONLY show if we have NO cards at all (not when deck is exhausted)
  if (error && currentIndex === 0 && deckQueue.length === 0) {
    const categoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
    return (
      <SwipeExhaustedState
        categoryLabel={String(categoryInfo?.plural || 'listings')}
        CategoryIcon={categoryInfo?.icon || Home}
        iconColor={categoryInfo?.color || 'text-primary'}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onDetectLocation={detectLocation}
        detecting={locationDetecting}
        detected={locationDetected}
        error={error}
        isInitialLoad={true}
      />
    );
  }

  // Empty state - dynamic based on category (no cards fetched yet)
  if (deckQueue.length === 0) {
    const categoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
    return (
      <SwipeExhaustedState
        categoryLabel={String(categoryInfo?.plural || 'listings')}
        CategoryIcon={categoryInfo?.icon || Home}
        iconColor={categoryInfo?.color || 'text-primary'}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onDetectLocation={detectLocation}
        detecting={locationDetecting}
        detected={locationDetected}
      />
    );
  }

  // Get current category info for the page title
  const activeCategoryInfo = getActiveCategoryInfo(filters);
  const _activeCategoryLabel = String(activeCategoryInfo?.plural || 'Listings');
  const _ActiveCategoryIcon = activeCategoryInfo?.icon || Home;
  const _activeCategoryColor = activeCategoryInfo?.color || 'text-primary';

  // Main swipe view - FULL-BLEED edge-to-edge cards (no max-width constraint)
  return (
    <AnimatePresence mode="wait">
    <motion.div
      key="cards"
      variants={deckFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full flex flex-col"
      style={{ height: '100%', minHeight: '100%' }}
      onMouseEnter={handleDeckHover}
    >
      {/* Category title removed - clean immersive card experience */}

      <div className="relative flex-1 w-full">
        {/* NEXT CARD - Visible behind current card (Tinder-style anticipation)
            - Scale slightly smaller to create depth
            - Lower z-index so it sits behind
            - Already preloaded so transition is instant */}
        {(() => {
          const nextCard = deckQueueRef.current[currentIndexRef.current + 1];
          if (!nextCard) return null;
          return (
            <motion.div
              key={`next-${nextCard.id}`}
              className="w-full h-full absolute inset-0 gpu-layer"
              style={{
                zIndex: 5,
                scale: nextCardScale,
                opacity: nextCardOpacity,
                translateZ: 0,
                pointerEvents: 'none',
              }}
            >
              <SimpleSwipeCard
                listing={nextCard}
                onSwipe={() => { }}
                isTop={false}
              />
            </motion.div>
          );
        })()}

        {/* CURRENT CARD - Top of stack, fully interactive */}
        {topCard && (
          <motion.div
            key={topCard.id}
            className="w-full h-full absolute inset-0"
            // Spring-forward entrance: card pops from "peeked" position to full size.
            // Skipped on first card (hasSwipedRef.current=false) to avoid jarring load animation.
            initial={hasSwipedRef.current ? { scale: 0.97, opacity: 0.72 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.85 }}
            style={{ zIndex: 10 }}
          >
            <SimpleSwipeCard
              ref={cardRef}
              listing={topCard}
              onSwipe={handleSwipe}
              onTap={() => onListingTap(topCard.id)}
              onInsights={handleInsights}
              isTop={true}
              externalX={topCardX}
            />
          </motion.div>
        )}

        {/* Action buttons INSIDE card area - Tinder style overlay */}
        {topCard && !insightsModalOpen && (
          <div className="absolute left-0 right-0 flex justify-center z-[1100]" style={{ bottom: 'calc(var(--safe-bottom, 0px) + 100px)' }}>
            <SwipeActionButtonBar
              onLike={handleButtonLike}
              onDislike={handleButtonDislike}
              onShare={handleShare}
              onUndo={undoLastSwipe}
              onMessage={handleMessage}
              canUndo={canUndo}
            />
          </div>
        )}
      </div>

      {/* FIX #3: PORTAL ISOLATION - Modals render outside swipe tree
          This prevents modal state changes from causing re-renders in the swipe container
          The modal lives in a completely separate React subtree */}
      {typeof document !== 'undefined' && createPortal(
        <Suspense fallback={null}>
          {insightsModalOpen && (
            <SwipeInsightsModal
              open={insightsModalOpen}
              onOpenChange={setInsightsModalOpen}
              listing={topCard}
            />
          )}
          {shareDialogOpen && topCard && (
            <ShareDialog
              open={shareDialogOpen}
              onOpenChange={setShareDialogOpen}
              listingId={topCard.id}
              title={topCard.title || 'Check out this listing'}
              description={topCard.description}
            />
          )}
        </Suspense>,
        document.body
      )}

      {/* Message Confirmation Dialog - Shows remaining tokens */}
      <MessageConfirmationDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
      />

      {/* Direct Message Dialog - For motorcycle/bicycle listings (free messaging) */}
      <DirectMessageDialog
        open={directMessageDialogOpen}
        onOpenChange={setDirectMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
        category={selectedListing?.category}
      />
    </motion.div>
    </AnimatePresence>
  );
};

export const SwipessSwipeContainer = memo(SwipessSwipeContainerComponent);
