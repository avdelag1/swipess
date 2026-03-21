import React from 'react';
import { motion } from 'framer-motion';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import {
    Home,
    Bike,
    Briefcase,
    Search,
    Check,
} from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { CategorySwipeStack } from './CategorySwipeStack';
import { ExploreFeatureLinks } from './ExploreFeatureLinks';

const categories: { id: QuickFilterCategory; label: string; icon: any; color: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400' },
];

export function MyHubQuickFilters() {
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory } = useFilterActions();

    return (
        <div className="relative mb-8 px-4">
            {/* Label */}
            <div className="flex flex-col mb-12 px-1 text-center">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Discover Categories
                </h3>
                <p className="text-2xl font-black text-foreground drop-shadow-sm italic">
                    Swipe right to filter your deck
                </p>
            </div>

            {/* Swipeable Stack */}
            <CategorySwipeStack />

            {/* Explore Feature Links */}
            <div className="mt-8">
                <ExploreFeatureLinks />
            </div>
        </div>
    );
}
