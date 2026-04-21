import React from 'react';
import { Home, Bike, Briefcase } from 'lucide-react';
import { logger } from '@/utils/prodLogger';

// Custom motorcycle icon with configurable stroke
export const MotorcycleIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number | string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M9 17h6" />
    <path d="M19 17l-2-5h-4l-3-4H6l1 4" />
    <path d="M14 7h3l2 5" />
  </svg>
);

export interface CategoryDisplayInfo {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  plural: string;
  color: string;
}

// Category configuration for dynamic states
export const categoryConfig: Record<string, CategoryDisplayInfo> = {
  property: { icon: Home, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: Bike, label: 'Bicycle', plural: 'Bicycles', color: 'text-rose-500' },
  services: { icon: Briefcase, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: Briefcase, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
};

// Helper to get the active category display info from filters
export const getActiveCategoryInfo = (filters?: any, storeCategory?: string | null): CategoryDisplayInfo => {
  try {
    // PRIORITY 1: Direct store category
    if (storeCategory && typeof storeCategory === 'string' && categoryConfig[storeCategory]) {
      return categoryConfig[storeCategory];
    }

    // Safety: Handle null/undefined filters
    if (!filters) return categoryConfig.property;

    // Check for activeUiCategory first
    const activeUiCategory = filters.activeUiCategory;
    if (activeUiCategory && typeof activeUiCategory === 'string' && categoryConfig[activeUiCategory]) {
      return categoryConfig[activeUiCategory];
    }

    // Check for activeCategory string
    const activeCategory = filters.activeCategory;
    if (activeCategory && typeof activeCategory === 'string' && categoryConfig[activeCategory]) {
      return categoryConfig[activeCategory];
    }

    // Check for categories array
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

    // Check for single category
    const category = filters?.category;
    if (category && typeof category === 'string' && categoryConfig[category]) {
      return categoryConfig[category];
    }

    return categoryConfig.property;
  } catch (error) {
    logger.error('[CategoryHelpers] Error in getActiveCategoryInfo:', error);
    return categoryConfig.property;
  }
};


