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

  // Cluster pill: shared glass frame for the left/right icon groups.
  // Transparent frozen-liquid glass — a translucent tint that always
  // reads as a pill against whatever's behind it (dark photo, black
  // theme, or light theme). Visible border so the pill edge is always
  // clear. Mirrors the BottomNavigation pill for visual consistency.
  const clusterPillStyle: React.CSSProperties = {
    background: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.22)',
    boxShadow: isLight
      ? '0 10px 30px -8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.85)'
      : '0 10px 30px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
    overflow: 'visible',
  };

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
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none",
        !isActuallyVisible && "opacity-0 -translate-y-full",
        className
      )}
      style={{
        paddingTop: 'calc(var(--safe-top, 0px) + 6px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px))',
        background: 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-3 flex items-center justify-between relative">

        <div
          className="flex min-w-0 items-center gap-1 pointer-events-auto rounded-full px-2 py-1.5"
          style={clusterPillStyle}
        >
          {onBack ? (
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.94 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="flex shrink-0 items-center justify-center rounded-full h-9 w-9"
              style={glassPillStyle}
              aria-label="Back"
            >
              <ChevronLeft
                className="w-[18px] h-[18px]"
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
                className="flex shrink-0 items-center gap-2 rounded-full pl-1 pr-2.5 h-9 group"
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
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
                {profile?.full_name && (
                  <span
                    className="hidden max-w-[74px] truncate sm:inline-block text-[10px] font-black uppercase tracking-[0.08em]"
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

        {/* Center tap zone — a premium near-invisible glass circle button to go home */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-50">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              haptics.tap();
              if (onCenterTap) {
                onCenterTap();
              } else {
                navigate(isOwner ? '/owner/dashboard' : '/client/dashboard');
              }
            }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              "bg-white/[0.03] dark:bg-white/[0.01] border border-white/[0.06] shadow-sm",
              "hover:bg-white/[0.08] hover:border-white/[0.12] active:bg-white/[0.15]",
              "backdrop-blur-md"
            )}
            title="Go to Dashboard"
            aria-label="Go to Dashboard"
          >
            {/* Extremely subtle center dot to hint at interaction without looking like a button */}
            <div className="w-1.5 h-1.5 rounded-full bg-white/25 dark:bg-white/10" />
          </motion.button>
        </div>

        {/* RIGHT CLUSTER: single glass pill wrapping all action buttons */}
          <div
            className="flex shrink-0 items-center gap-1 pointer-events-auto rounded-full px-2 py-1.5"
            style={clusterPillStyle}
          >
          {!minimal && (
            <>
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
                  className="flex shrink-0 items-center justify-center rounded-full relative h-9 w-9"
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
