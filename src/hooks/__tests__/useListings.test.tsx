import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListings } from '../useListings';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useListings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should fetch listings without budget filtering if no preferences exist', async () => {
        const mockUser = { user: { id: 'user-123' } };
        (supabase.auth.getUser as any).mockResolvedValue({ data: mockUser });
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'client_filter_preferences') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: vi.fn().mockResolvedValue({ data: [{ id: 'listing-1', title: 'Test' }], error: null }),
            };
        });

        const { result } = renderHook(() => useListings(), { wrapper });

        await act(async () => {
          await new Promise(r => setTimeout(r, 100));
        });
        expect(supabase.from).toHaveBeenCalledWith('listings');
    });

    it('should apply min_price and max_price filters when preferences exist', async () => {
        const mockUser = { user: { id: 'user-123' } };
        const mockPreferences = {
            min_price: 1000,
            max_price: 5000,
            preferred_listing_types: ['rent'],
        };

        (supabase.auth.getUser as any).mockResolvedValue({ data: mockUser });

        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'client_filter_preferences') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
                };
            }
            return mockQuery;
        });

        const { result } = renderHook(() => useListings(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockQuery.gte).toHaveBeenCalledWith('price', 1000);
        expect(mockQuery.lte).toHaveBeenCalledWith('price', 5000);
    });
});
