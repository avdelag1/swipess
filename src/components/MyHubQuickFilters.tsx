import React from 'react';
import { CategorySwipeStack } from './CategorySwipeStack';
import { ExploreFeatureLinks } from './ExploreFeatureLinks';

export function MyHubQuickFilters() {

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
