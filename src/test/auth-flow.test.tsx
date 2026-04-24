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
        like: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
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

        // Create a chainable mock for supabase queries
        const chainableMock = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn().mockImplementation((cb) => {
                if (typeof cb === 'function') {
                    return Promise.resolve().then(cb);
                }
                return Promise.resolve();
            }),
        };

        // Make from() return the chainable mock
        (supabase as any).from = vi.fn().mockReturnValue(chainableMock);
        Object.assign(supabase, chainableMock);
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

    it.skip('should handle existing profiles gracefully', async () => {
        const mockUser = {
            id: 'existing-user-id',
            email: 'existing@example.com',
        };

        // Reset mocks for this specific test
        vi.clearAllMocks();

        // Create a chainable mock object
        const chain: any = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.like = vi.fn().mockReturnValue(chain);
        chain.insert = vi.fn().mockReturnValue(chain);
        chain.upsert = vi.fn().mockReturnValue(chain);
        chain.update = vi.fn().mockReturnValue(chain);
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null });
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null });
        chain.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.then = vi.fn();

        vi.mocked(supabase.from).mockReturnValue(chain as any);

        const { result } = renderHook(() => useProfileSetup(), { wrapper });

        const profile = await result.current.createProfileIfMissing(mockUser as any, 'client');

        expect(profile).toBeDefined();
        expect(profile).toHaveProperty('id', 'existing-user-id');
    });
});


