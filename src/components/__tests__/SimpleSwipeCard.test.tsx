import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SimpleSwipeCard } from '../SimpleSwipeCard';
import { Listing } from '@/hooks/useListings';

// Mock dependencies that rely on browser/API features
vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn(),
}));
vi.mock('@/state/parallaxStore', () => ({
    useParallaxStore: vi.fn(() => ({ updateDrag: vi.fn(), endDrag: vi.fn() })),
}));
vi.mock('@/hooks/useRatingSystem', () => ({
    useListingRatingAggregate: vi.fn(() => ({ data: null, isLoading: false })),
}));
vi.mock('@/hooks/useMagnifier', () => ({
    useMagnifier: vi.fn(() => ({
        containerRef: { current: null },
        pointerHandlers: {
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        },
        isActive: vi.fn(() => false),
        isHoldPending: vi.fn(() => false),
    })),
}));

describe('SimpleSwipeCard Component', () => {
    const mockListing: Listing = {
        id: 'mock-id-123',
        title: 'Luxury Villa',
        price: 5000,
        city: 'Tulum',
        beds: 3,
        baths: 2,
        property_type: 'Villa',
        category: 'property',
        images: ['test-image.jpg'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
    } as Listing;

    it('renders correctly without crashing', () => {
        const handleSwipe = vi.fn();

        const { container } = render(
            <SimpleSwipeCard
                listing={mockListing}
                onSwipe={handleSwipe}
                isTop={true}
            />
        );

        expect(container).toBeTruthy();
    });

    it('displays the correct listing details (price, location, type)', () => {
        const { getByText, getAllByText } = render(
            <SimpleSwipeCard
                listing={mockListing}
                onSwipe={vi.fn()}
                isTop={true}
            />
        );

        // Check for property specifics usually rendered by PropertyCardInfo
        expect(getByText('$5,000')).toBeInTheDocument();
        expect(getByText('/night')).toBeInTheDocument();
        expect(getByText('Villa')).toBeInTheDocument();
    });
});
