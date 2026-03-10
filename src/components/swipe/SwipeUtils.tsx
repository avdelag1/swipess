import React from 'react';
import { Home, Bike, Briefcase } from 'lucide-react';
import { ListingFilters } from '@/hooks/useSmartMatching';

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

export interface CategoryInfo {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
    label: string;
    plural: string;
    color: string;
}

// Category configuration for dynamic empty states
export const categoryConfig: Record<string, CategoryInfo> = {
    property: { icon: Home, label: 'Property', plural: 'Properties', color: 'text-primary' },
    moto: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
    motorcycle: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
    bicycle: { icon: Bike, label: 'Bicycle', plural: 'Bicycles', color: 'text-emerald-500' },
    services: { icon: Briefcase, label: 'Service', plural: 'Services', color: 'text-purple-500' },
    worker: { icon: Briefcase, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
};

/**
 * Helper to get the active category display info from filters
 * Accepts optional storeCategory (directly from Zustand) for guaranteed sync with quick filters
 */
export const getActiveCategoryInfo = (filters?: ListingFilters, storeCategory?: string | null): CategoryInfo => {
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
            }
        }

        return categoryConfig.property;
    } catch (err) {
        return categoryConfig.property;
    }
};

/**
 * Debounce utility for preventing rapid-fire actions
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const callbackRef = React.useRef(callback);

    React.useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return React.useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]) as T;
}

/**
 * Navigation guard to prevent double-taps
 */
export function useNavigationGuard() {
    const isNavigatingRef = React.useRef(false);
    const lastNavigationRef = React.useRef(0);

    const canNavigate = React.useCallback(() => {
        const now = Date.now();
        if (isNavigatingRef.current || now - lastNavigationRef.current < 300) {
            return false;
        }
        return true;
    }, []);

    const startNavigation = React.useCallback(() => {
        isNavigatingRef.current = true;
        lastNavigationRef.current = Date.now();
    }, []);

    const endNavigation = React.useCallback(() => {
        isNavigatingRef.current = false;
    }, []);

    return { canNavigate, startNavigation, endNavigation };
}

/**
 * Throttled prefetch scheduler - prevents competing with current decode
 */
export class PrefetchScheduler {
    private scheduled = false;
    private callback: (() => void) | null = null;
    private idleHandle: number | null = null;

    schedule(callback: () => void, delayMs = 300): void {
        this.cancel();
        this.callback = callback;
        this.scheduled = true;

        setTimeout(() => {
            if (!this.scheduled || !this.callback) return;

            if ('requestIdleCallback' in window) {
                this.idleHandle = (window as any).requestIdleCallback(() => {
                    if (this.callback) this.callback();
                    this.scheduled = false;
                }, { timeout: 2000 });
            } else {
                this.callback();
                this.scheduled = false;
            }
        }, delayMs);
    }

    cancel(): void {
        this.scheduled = false;
        this.callback = null;
        if (this.idleHandle !== null && 'cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(this.idleHandle);
            this.idleHandle = null;
        }
    }
}
