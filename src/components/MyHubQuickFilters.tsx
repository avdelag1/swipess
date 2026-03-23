import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { CategorySwipeStack } from './CategorySwipeStack';
import { ExploreFeatureLinks } from './ExploreFeatureLinks';

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
