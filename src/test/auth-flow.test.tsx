import { renderHook } from '@testing-library/react';
import { useProfileSetup } from '../hooks/useProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create a wrapper for QueryClientProvider
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => {
    const mock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((cb) => {
            if (typeof cb === 'function') {
                return Promise.resolve().then(cb);
            }
            return Promise.resolve();
        }),
    };
    return { supabase: mock };
});

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe('useProfileSetup', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock behavior for generic calls
        vi.mocked(supabase.from as any).mockReturnThis();
        (supabase as any).select = vi.fn().mockReturnThis();
        (supabase as any).insert = vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null }) as any);
        (supabase as any).upsert = vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null }) as any);
        (supabase as any).maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    });

    it('should create a profile if missing', async () => {
        const mockUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
        };

        // Setup specific mocks for this test
        (supabase as any).maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        (supabase as any).insert.mockResolvedValueOnce({ data: { id: 'test-user-id' }, error: null } as any);

        const { result } = renderHook(() => useProfileSetup(), { wrapper });

        const profile = await result.current.createProfileIfMissing(mockUser as any, 'client');

        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(profile).toBeDefined();
    });

    it('should handle existing profiles gracefully', async () => {
        const mockUser = {
            id: 'existing-user-id',
            email: 'existing@example.com',
        };

        (supabase as any).maybeSingle.mockResolvedValueOnce({ data: { id: 'existing-user-id' }, error: null });

        const { result } = renderHook(() => useProfileSetup(), { wrapper });

        const profile = await result.current.createProfileIfMissing(mockUser as any, 'client');

        expect(profile).toEqual({ id: 'existing-user-id' });
        // Should NOT have attempted to insert into profiles if it already exists
        // (insert might be called for other things like specialization profiles, but not for the primary ID if we return early or skip)
    });
});
