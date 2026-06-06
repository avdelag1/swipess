import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, Crown, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';
import { useModalStore } from '@/state/modalStore';
import { TAP_SPRING } from './BottomNavigation';

interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  onAISearchClick?: () => void;
  onFilterClick?: (e?: React.PointerEvent | React.MouseEvent) => void;
  onBack?: () => void;
  onCenterTap?: () => void;
  className?: string;
  showFilters?: boolean;
  userRole?: 'client' | 'owner' | 'admin';
  transparent?: boolean;
  hideOnScroll?: boolean;
  title?: string;
  showBack?: boolean;
  minimal?: boolean;
}

function TopBarComponent({
  _onFilterClick,
  onBack: propOnBack,
  _onMessageActivationsClick,
  className,
  _userRole,
  transparent: _transparent = false,
  minimal = false,
  showBack,
  onCenterTap,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const setModal = useModalStore(s => s.setModal);
  const location = useLocation();
  const isDashboard = /^\/(client|owner|admin)\/dashboard\/?/.test(location.pathname);

  // Always visible on every page — no chrome-reveal hiding
  const isActuallyVisible = true;
  // Color rule: follow theme regardless of dashboard to fix invisible icons
  const iconColor = !isLight ? '#FFFFFF' : '#0A0A0A';

  // Note: when an activeCategory is set on the dashboard, the SwipeDeckBackButton
  // already provides the persistent back arrow. Don't render a duplicate here.
  const onBack = propOnBack || (showBack
    ? () => window.history.length > 2 ? navigate(-1) : navigate('/client/dashboard')
    : undefined);

  const clusterPillStyle: React.CSSProperties = { overflow: 'visible' };

  // Frameless inner buttons — the cluster pill provides the visible
  // frame so each icon button itself is transparent.
  const glassPillStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  };


  const { data: profile } = useQuery({
    queryKey: ['topbar-user-profile', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const [clientResult, ownerResult] = await Promise.all([
        supabase.from('client_profiles').select('name, profile_images').eq('user_id', user?.id).maybeSingle(),
        supabase.from('owner_profiles').select('business_name, profile_images').eq('user_id', user?.id).maybeSingle()
      ]);
      
      const isClient = !!clientResult.data;
      const data = isClient ? clientResult.data : ownerResult.data;
      
      return data ? {
        full_name: isClient ? (data as any).name : (data as any).business_name,
        avatar_url: (data as any).profile_images?.[0]
      } : null;
    },
  });

  const initials = (profile?.full_name || user?.email || '?')
    .split(/[\s@.]/)
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 pointer-events-none",
        !isActuallyVisible && "opacity-0 -translate-y-full",
        className
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        paddingTop: 'calc(var(--safe-top, 0px) + 6px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px))',
        background: isDashboard ? '#000000' : 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-2 flex items-center justify-between relative">

        {/* LEFT: avatar + name only */}
        <div
          className="flex min-w-0 items-center pointer-events-auto glass-pill px-1.5 h-[38px]"
          style={clusterPillStyle}
        >
          {onBack ? (
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.94 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="flex shrink-0 items-center justify-center rounded-full h-[32px] w-[32px]"
              style={glassPillStyle}
              aria-label="Back"
            >
              <ChevronLeft
                className="w-[20px] h-[20px]"
                strokeWidth={2.2}
                style={{
                  color: iconColor,
                  filter: isLight
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))'
                    : 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
                }}
              />
            </motion.button>
          ) : (
            user && (
              <motion.button
                transition={TAP_SPRING}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptics.tap();
                  navigate('/client/profile');
                }}
                className="flex shrink-0 items-center gap-2 rounded-full pl-0.5 pr-2.5 h-[32px] group"
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-[28px] h-[28px] rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 14px hsl(var(--primary) / 0.35)',
                  }}
                >
                  {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials === '?' ? <UserRound className="h-4 w-4 text-primary-foreground" strokeWidth={2.4} /> : (
                      <span className="text-[11px] font-black text-primary-foreground drop-shadow-sm">
                        {initials}
                      </span>
                    )
                  )}
                </div>
                <span
                  className="truncate max-w-[64px] text-[11px] font-black uppercase tracking-wider"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: iconColor,
                  }}
                >
                  {(profile?.full_name?.split(' ')[0]) || (user?.email?.split('@')[0]) || 'USER'}
                </span>
              </motion.button>
            )
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* RIGHT: tokens + theme + notifications — tight cluster */}
        {!minimal && (
          <div
            className="flex items-center pointer-events-auto glass-pill px-1 h-[38px] shrink-0"
            style={clusterPillStyle}
          >
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.92 }}
              onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
              className="flex shrink-0 items-center justify-center rounded-full relative h-[32px] w-[32px]"
              style={glassPillStyle}
              aria-label="Tokens"
            >
              <Crown
                className="w-[18px] h-[18px]"
                style={{
                  color: iconColor,
                  filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(228,0,124,0.65))',
                }}
                strokeWidth={1.9}
              />
            </motion.button>

            <ThemeToggle glassPillStyle={glassPillStyle} />

            <NotificationPopover glassPillStyle={glassPillStyle} />
          </div>
        )}

        {/* Center tap zone — a premium completely invisible tap target to go home */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center pointer-events-auto z-50 cursor-pointer"
          style={{ background: 'transparent', WebkitTapHighlightColor: 'transparent' }}
          onClick={() => {
            haptics.tap();
            if (onCenterTap) {
              onCenterTap();
            } else {
              navigate('/client/dashboard');
            }
          }}
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
        />
      </div>

      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="nav-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="var(--color-brand-accent)" offset="0%" />
            <stop stopColor="var(--color-brand-primary)" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </header>
  );
}

export const TopBar = memo(TopBarComponent);
