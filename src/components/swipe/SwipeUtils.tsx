import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Utility to get information about the active category
 */
export function getActiveCategoryInfo(filters: any, activeCategory: any) {
    const cat = filters?.category || activeCategory || 'property';

    const configs: Record<string, any> = {
        property: { singular: 'Property', plural: 'Properties' },
        worker: { singular: 'Worker', plural: 'Workers' },
        motorcycle: { singular: 'Motorcycle', plural: 'Motorcycles' },
        bicycle: { singular: 'Bicycle', plural: 'Bicycles' },
        client: { singular: 'Client', plural: 'Clients' },
    };

    return configs[cat] || { singular: 'Listing', plural: 'Listings' };
}

/**
 * Standard debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
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
