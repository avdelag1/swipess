import { PremiumLoader } from '../PremiumLoader';
import { DashboardSkeleton, ProfileSkeleton, MessageSkeleton } from './LayoutSkeletons';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

// Global flag so we only show full loader on true cold start
let _hasCompletedFirstRender = false;

if (typeof window !== 'undefined') {
  setTimeout(() => { _hasCompletedFirstRender = true; }, 2000);
  window.addEventListener('app-rendered', () => {
    _hasCompletedFirstRender = true;
  });
}

/**
 * 🚀 PRODUCTION-READY ZENITH SKELETON
 * 
 * Instead of a generic loader, we show a context-aware skeleton
 * that matches the layout of the page the user is navigating to.
 * This gives an 'instant' feel as if the app is already loaded.
 */
export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // 1. Dashboard Routes
  if (pathname.includes('/dashboard')) {
    return <DashboardSkeleton />;
  }
  
  // 2. Profile Routes
  if (pathname.includes('/profile') || pathname.includes('/settings')) {
    return <ProfileSkeleton />;
  }
  
  // 3. Messaging Routes
  if (pathname.includes('/messages')) {
    return <MessageSkeleton />;
  }
  
  // 4. Discovery/Filter Routes
  if (pathname.includes('/filters') || pathname.includes('/clients/') || pathname.includes('/worker/')) {
    return (
      <div className="p-4 overflow-hidden h-full">
        <DashboardSkeleton />
      </div>
    );
  }

  // FALLBACK: Generic PremiumLoader for cold starts or unknown routes
  // ALWAYS return the PremiumLoader centered for consistent 'alive' feel
  // If not minimal, make it full-screen fixed to match splash perfectly
  return <PremiumLoader size="lg" full={!minimal} className={className} />;
}

export default SuspenseFallback;
