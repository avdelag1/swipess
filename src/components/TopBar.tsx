import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, UserRound, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';
import { useModalStore } from '@/state/modalStore';
import { TAP_SPRING } from './BottomNavigation';
import { useChromeReveal } from '@/hooks/useChromeReveal';

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
  onFilterClick,
  onBack: propOnBack,
  onMessageActivationsClick,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
  showBack,
  onCenterTap,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const { isChromeVisible } = useChromeReveal();
  const setModal = useModalStore(s => s.setModal);
  const location = useLocation();
  const isDashboard = /^\/(client|owner|admin)\/dashboard\/?/.test(location.pathname);
  
  // Visibility policy: the dashboard is the navigation hub, so the
  // TopBar must stay pinned there. On every other page, the SwipessHud
  // wrapper handles scroll-direction based hide/show — this component
  // itself is always rendered.
  void isChromeVisible;
  const isActuallyVisible = true;
  // Color rule:
  //  - Dark theme (black filter): icons always WHITE.
  //  - Light theme (white filter): WHITE on dashboard (over photos),
  //    BLACK on every other page.
  const iconColor = !isLight || isDashboard ? '#FFFFFF' : '#0A0A0A';

  const isOwner = userRole === 'owner';

  // Note: when an activeCategory is set on the dashboard, the SwipeDeckBackButton
  // already provides the persistent back arrow. Don't render a duplicate here.
  const onBack = propOnBack || (showBack
    ? () => window.history.length > 2 ? navigate(-1) : navigate(`/${isOwner ? 'owner' : 'client'}/dashboard`)
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
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
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
        background: 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-3 flex items-center justify-between relative">

        <div
          className="flex min-w-0 items-center gap-0.5 pointer-events-auto glass-pill px-1 h-[34px]"
          style={clusterPillStyle}
        >
          {onBack ? (
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.94 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="flex shrink-0 items-center justify-center rounded-full h-[28px] w-[28px]"
              style={glassPillStyle}
              aria-label="Back"
            >
              <ChevronLeft
                className="w-[16px] h-[16px]"
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
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  haptics.tap();
                  navigate(isOwner ? '/owner/profile' : '/client/profile');
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full pl-0.5 pr-1.5 h-[28px] group"
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-[22px] h-[22px] rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
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
                    initials === '?' ? <UserRound className="h-3 w-3 text-primary-foreground" strokeWidth={2.4} /> : (
                      <span className="text-[9px] font-black text-primary-foreground drop-shadow-sm">
                        {initials}
                      </span>
                    )
                  )}
                </div>
                {profile?.full_name && (
                  <span
                    className="hidden max-w-[74px] truncate sm:inline-block text-[9px] font-black uppercase tracking-[0.08em]"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: iconColor,
                    }}
                  >
                    {profile.full_name.split(' ')[0]}
                  </span>
                )}
              </motion.button>
            )
          )}

          {/* Mode Switcher — Standalone buttons next to profile */}
          {!minimal && (
            <ModeSwitcher />
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* Center tap zone — a premium completely invisible tap target to go home */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center pointer-events-auto z-50 cursor-pointer"
          style={{ background: 'transparent', WebkitTapHighlightColor: 'transparent' }}
          onClick={() => {
            haptics.tap();
            if (onCenterTap) {
              onCenterTap();
            } else {
              navigate(isOwner ? '/owner/dashboard' : '/client/dashboard');
            }
          }}
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
        />

        {/* RIGHT CLUSTER: single glass pill wrapping all action buttons */}
          <div
            className="flex shrink-0 items-center gap-0.5 pointer-events-auto glass-pill px-1 h-[34px]"
            style={clusterPillStyle}
          >
          {!minimal && (
            <>
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
                  className="flex shrink-0 items-center justify-center rounded-full relative h-[28px] w-[28px]"
                  style={glassPillStyle}
                  aria-label="Tokens"
                >
                  <Crown
                    className="w-[16px] h-[16px]"
                    style={{
                      color: iconColor,
                      filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(228,0,124,0.65))',
                    }}
                    strokeWidth={1.9}
                  />
                </motion.button>

              <ThemeToggle glassPillStyle={glassPillStyle} />

              <NotificationPopover glassPillStyle={glassPillStyle} />
            </>
          )}
        </div>
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
