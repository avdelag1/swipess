import { Home, Bike, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { logger } from '@/utils/prodLogger';

// Category configuration for dynamic empty states
export const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; plural: string; color: string }> = {
  property: { icon: Home, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: Bike, label: 'Bicycle', plural: 'Bicycles', color: 'text-rose-500' },
  services: { icon: Briefcase, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: Briefcase, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
};

/**
 * Helper to get the active category display info from filters.
 */
export const getActiveCategoryInfo = (filters?: ListingFilters, storeCategory?: string | null) => {
  try {
    if (storeCategory && typeof storeCategory === 'string' && categoryConfig[storeCategory]) {
      return categoryConfig[storeCategory];
    }
    if (!filters) return categoryConfig.property;

    const activeUiCategory = (filters as any).activeUiCategory;
    if (activeUiCategory && typeof activeUiCategory === 'string' && categoryConfig[activeUiCategory]) {
      return categoryConfig[activeUiCategory];
    }

    const activeCategory = (filters as any).activeCategory;
    if (activeCategory && typeof activeCategory === 'string' && categoryConfig[activeCategory]) {
      return categoryConfig[activeCategory];
    }

    const categories = filters?.categories;
    if (Array.isArray(categories) && categories.length > 0) {
      const cat = categories[0] as any;
      if (typeof cat === 'string') {
        if (categoryConfig[cat]) return categoryConfig[cat];
        if (cat === 'worker' && categoryConfig['services']) return categoryConfig['services'];
        const normalized = cat.toLowerCase().replace(/s$/, '');
        if (categoryConfig[normalized]) return categoryConfig[normalized];
        if (cat === 'services' && categoryConfig['worker']) return categoryConfig['worker'];
        if ((cat === 'moto' || cat === 'motorcycle')) return categoryConfig['motorcycle'];
      }
    }

    const category = filters?.category;
    if (category && typeof category === 'string' && categoryConfig[category]) {
      return categoryConfig[category];
    }

    return categoryConfig.property;
  } catch (error) {
    logger.error('[SwipeConstants] Error in getActiveCategoryInfo:', error);
    return categoryConfig.property;
  }
};

export const POKER_CARD_PHOTOS: Record<string, string> = {
  property:   'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=480&q=80&auto=format',
  motorcycle: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=480&q=80&auto=format',
  bicycle:    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=480&q=80&auto=format',
  services:   'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=480&q=80&auto=format',
  all:        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=480&q=80&auto=format',
};

export const POKER_CARDS = [
  { id: 'property'   as const, label: 'Properties',  description: 'Houses & apts',       accent: '#3b82f6', accentRgb: '59,130,246'  },
  { id: 'motorcycle' as const, label: 'Motorcycles', description: 'Bikes & scooters',     accent: '#f97316', accentRgb: '249,115,22'  },
  { id: 'bicycle'    as const, label: 'Bicycles',    description: 'City & mountain',      accent: '#f43f5e', accentRgb: '244,63,94'   },
  { id: 'services'   as const, label: 'Workers',     description: 'Skilled freelancers',  accent: '#a855f7', accentRgb: '168,85,247'  },
  { id: 'all'        as const, label: 'All',         description: 'Browse everything',    accent: '#06b6d4', accentRgb: '6,182,212'   },
];

export const PK_W = 270;
export const PK_H = 420;
export const FOLDER_OFFSET_X = 28;
export const FOLDER_OFFSET_Y = 0;
export const PK_DIST_THRESHOLD = 110;
export const PK_VEL_THRESHOLD  = 480;
export const PK_SPRING = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.9 };

export const deckFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' as const } },
};
