import React from 'react';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import {
    Home,
    Bike,
    Briefcase,
} from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { QuickFilterCategory } from '@/types/filters';
import { CategorySwipeStack } from './CategorySwipeStack';
import { ExploreFeatureLinks } from './ExploreFeatureLinks';

const _categories: { id: QuickFilterCategory; label: string; icon: any; color: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400' },
];

export function MyHubQuickFilters() {
    const _activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory: _setActiveCategory } = useFilterActions();

    return (
        <div className="relative mb-8 px-4">
            {/* Swipeable Stack */}
            <div className="pt-8">
                <CategorySwipeStack />
            </div>

            {/* Explore Feature Links */}
            <div className="mt-8">
                <ExploreFeatureLinks />
            </div>
        </div>
    );
}
