import { render } from '@testing-library/react';
import Index from '@/pages/Index';
import { vi } from 'vitest';

// mock hooks used inside Index
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// mock react-router-dom helpers
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

describe('Index page navigation logic', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, initialized: true });
    vi.mocked(useQuery).mockReturnValue({ data: null, isLoading: false, isFetching: false, error: null });
  });

  it('renders landing page when there is no authenticated user', () => {
    const { getByAltText } = render(<Index />);
    // LegendaryLandingPage renders the Swipess logo with an alt attribute
    expect(getByAltText(/Swipess/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('redirects newly registered client immediately using metadata role', () => {
    const user = {
      id: 'u1',
      created_at: new Date().toISOString(),
      user_metadata: { role: 'client' },
    };
    vi.mocked(useAuth).mockReturnValue({ user, loading: false, initialized: true });

    render(<Index />);
    expect(navigateMock).toHaveBeenCalledWith('/client/dashboard', { replace: true });
  });

  it('redirects existing owner based on DB role', () => {
    const user = {
      id: 'u2',
      created_at: '2020-01-01T00:00:00Z',
      user_metadata: {},
    };
    vi.mocked(useAuth).mockReturnValue({ user, loading: false, initialized: true });
    vi.mocked(useQuery).mockReturnValue({ data: 'owner', isLoading: false, isFetching: false, error: null });

    render(<Index />);
    expect(navigateMock).toHaveBeenCalledWith('/owner/dashboard', { replace: true });
  });
});
