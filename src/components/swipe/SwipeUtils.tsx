import { useState, useCallback, useRef, useEffect } from 'react';
import { Home, Wrench, Bike, PersonStanding, Users, Briefcase, type LucideIcon } from 'lucide-react';

/**
 * Category info returned by getActiveCategoryInfo
 */
export interface CategoryInfo {
    singular: string;
    plural: string;
    icon: LucideIcon;
    color: string;
}

/**
 * Utility to get information about the active category
 */
export function getActiveCategoryInfo(filters: any, activeCategory?: any): CategoryInfo {
    const cat = filters?.category || activeCategory || 'property';

    const configs: Record<string, CategoryInfo> = {
        property: { singular: 'Property', plural: 'Properties', icon: Home, color: 'text-primary' },
        worker: { singular: 'Worker', plural: 'Workers', icon: Wrench, color: 'text-amber-500' },
        motorcycle: { singular: 'Motorcycle', plural: 'Motorcycles', icon: Bike, color: 'text-red-500' },
        bicycle: { singular: 'Bicycle', plural: 'Bicycles', icon: Bike, color: 'text-green-500' },
        client: { singular: 'Client', plural: 'Clients', icon: Users, color: 'text-blue-500' },
        services: { singular: 'Service', plural: 'Services', icon: Briefcase, color: 'text-purple-500' },
    };

    return configs[cat] || { singular: 'Listing', plural: 'Listings', icon: Home, color: 'text-primary' };
}

/**
 * Standard debounce hook for values
 */
export function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounce utility for preventing rapid-fire actions (callback version)
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]) as T;
}

/**
 * Guard to prevent navigation during sensitive actions (e.g. swiping)
 */
export function useNavigationGuard() {
    const [canNavigate, setCanNavigate] = useState(true);

    const startNavigation = useCallback(() => setCanNavigate(false), []);
    const endNavigation = useCallback(() => setCanNavigate(true), []);

    return { canNavigate, startNavigation, endNavigation };
}

/**
 * Scheduler for non-critical prefetch operations
 */
export class PrefetchScheduler {
    private timer: any = null;

    schedule(fn: () => void, delay = 300) {
        this.cancel();
        this.timer = setTimeout(() => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(fn, { timeout: 2000 });
            } else {
                fn();
            }
        }, delay);
    }

    cancel() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
