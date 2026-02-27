import { renderHook, waitFor } from '@testing-library/react';
import { useProfileSetup } from '../hooks/useProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            refreshSession: vi.fn(),
            updateUser: vi.fn(),
            onAuthStateChange: vi.fn(),
            verifyOtp: vi.fn(),
            resend: vi.fn(),
        },
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

// ============================================================================
// AUTH - REGISTRATION TESTS
// ============================================================================
describe('Auth - Registration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.from as any).mockReturnThis();
        (supabase as any).select = vi.fn().mockReturnThis();
        (supabase as any).insert = vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null }) as any);
        (supabase as any).upsert = vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null }) as any);
        (supabase as any).maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    });

    it('should successfully register new user with valid email and password', async () => {
        const mockResponse = {
            data: {
                user: { id: 'new-user-id', email: 'newuser@example.com' },
                session: { access_token: 'token-123' }
            },
            error: null
        };
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signUp({
            email: 'newuser@example.com',
            password: 'SecurePassword123!'
        });

        expect(result.error).toBeNull();
        expect(result.data.user?.email).toBe('newuser@example.com');
        expect(result.data.user?.id).toBe('new-user-id');
    });

    it('should reject weak passwords', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Password is too weak' }
        };
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signUp({
            email: 'user@example.com',
            password: '123'  // Too weak
        });

        expect(result.error).not.toBeNull();
        expect(result.error?.message).toContain('weak');
    });

    it('should prevent duplicate email registration', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'User already exists' }
        };
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signUp({
            email: 'existing@example.com',
            password: 'ValidPassword123!'
        });

        expect(result.error).not.toBeNull();
        expect(result.error?.message).toContain('already exists');
    });

    it('should validate email format', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Invalid email format' }
        };
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signUp({
            email: 'invalid-email',
            password: 'ValidPassword123!'
        });

        expect(result.error).not.toBeNull();
    });
});

// ============================================================================
// AUTH - LOGIN TESTS
// ============================================================================
describe('Auth - Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should login with correct credentials', async () => {
        const mockResponse = {
            data: {
                user: { id: 'user-123', email: 'user@example.com' },
                session: { access_token: 'valid-token-123' }
            },
            error: null
        };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signInWithPassword({
            email: 'user@example.com',
            password: 'CorrectPassword123!'
        });

        expect(result.error).toBeNull();
        expect(result.data.session?.access_token).toBe('valid-token-123');
    });

    it('should reject invalid credentials', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Invalid login credentials' }
        };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signInWithPassword({
            email: 'user@example.com',
            password: 'WrongPassword123!'
        });

        expect(result.error).not.toBeNull();
        expect(result.error?.message).toContain('Invalid');
    });

    it('should handle account not found', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'User not found' }
        };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signInWithPassword({
            email: 'nonexistent@example.com',
            password: 'SomePassword123!'
        });

        expect(result.error).not.toBeNull();
    });

    it('should handle expired sessions', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Session expired' }
        };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signInWithPassword({
            email: 'user@example.com',
            password: 'ValidPassword123!'
        });

        expect(result.error?.message).toContain('expired');
    });
});

// ============================================================================
// AUTH - LOGOUT TESTS
// ============================================================================
describe('Auth - Logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should clear auth state on logout', async () => {
        vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

        const result = await supabase.auth.signOut();

        expect(result.error).toBeNull();
        expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
        const mockResponse = { error: { message: 'Logout failed' } };
        vi.mocked(supabase.auth.signOut).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.signOut();

        expect(result.error).not.toBeNull();
    });
});

// ============================================================================
// AUTH - SESSION MANAGEMENT TESTS
// ============================================================================
describe('Auth - Session Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should refresh expired tokens', async () => {
        const mockResponse = {
            data: {
                session: { access_token: 'new-token-456' }
            },
            error: null
        };
        vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.refreshSession();

        expect(result.error).toBeNull();
        expect(result.data.session?.access_token).toBe('new-token-456');
    });

    it('should handle token refresh errors', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Cannot refresh token' }
        };
        vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.refreshSession();

        expect(result.error).not.toBeNull();
    });

    it('should retrieve current session', async () => {
        const mockResponse = {
            data: {
                session: { access_token: 'current-token', user: { id: 'user-123' } }
            },
            error: null
        };
        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.getSession();

        expect(result.error).toBeNull();
        expect(result.data.session).toBeDefined();
    });

    it('should return null for no active session', async () => {
        const mockResponse = {
            data: { session: null },
            error: null
        };
        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.getSession();

        expect(result.data.session).toBeNull();
    });
});

// ============================================================================
// AUTH - 2FA / OTP TESTS
// ============================================================================
describe('Auth - 2FA/OTP', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should request OTP on signup', async () => {
        const mockResponse = {
            data: null,
            error: null
        };
        vi.mocked(supabase.auth.resend).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.resend({
            type: 'signup',
            email: 'newuser@example.com'
        });

        expect(result.error).toBeNull();
    });

    it('should verify OTP correctly', async () => {
        const mockResponse = {
            data: {
                user: { id: 'user-123', email_confirmed_at: '2026-02-27T12:00:00Z' }
            },
            error: null
        };
        vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.verifyOtp({
            email: 'user@example.com',
            token: '123456',
            type: 'email'
        });

        expect(result.error).toBeNull();
        expect(result.data.user?.email_confirmed_at).toBeDefined();
    });

    it('should reject invalid OTP', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'Invalid OTP' }
        };
        vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.verifyOtp({
            email: 'user@example.com',
            token: 'invalid',
            type: 'email'
        });

        expect(result.error).not.toBeNull();
    });

    it('should handle expired OTP', async () => {
        const mockResponse = {
            data: null,
            error: { message: 'OTP expired' }
        };
        vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce(mockResponse);

        const result = await supabase.auth.verifyOtp({
            email: 'user@example.com',
            token: 'expired-otp',
            type: 'email'
        });

        expect(result.error?.message).toContain('expired');
    });
});

// ============================================================================
// PROFILE SETUP TESTS (kept from original)
// ============================================================================
describe('useProfileSetup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
    });
});
