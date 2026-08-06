import { useLocation } from 'react-router-dom';
import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { ChevronLeft, Crown, Globe, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';
import { useModalStore } from '@/state/modalStore';
import { useTokens } from '@/hooks/useTokens';
import { PREMIUM_FOR_EVERYONE } from '@/utils/messagingEntitlements';
import { useFilterStore } from '@/state/filterStore';
import { getParentRoute } from '@/utils/sectionNavigation';
import {
  getTopBarChrome,
  getHeaderIconFilter,
  HEADER_PILL_BASE,
  isDashboardPath,
} from '@/utils/chromeStyles';
// AIIcon removed

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

const HEADER_ICON = 'w-[20px] h-[20px]';

function HeaderIconSlot({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
      {children}
      {badge}
    </span>
  );
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
  onCenterTap: _onCenterTap,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { isLight } = useAppTheme();
  const setModal = useModalStore(s => s.setModal);
  const openPassportMap = useModalStore(s => s.openPassportMap);
  const { tokens } = useTokens();
  const { t } = useTranslation();

  const isActuallyVisible = true;
  const isDashboard = isDashboardPath(location.pathname);
  const { useLightIcons, iconColor, pillStyle: glassPillStyle, iconShadow } = getTopBarChrome(isLight, isDashboard);

  const activeCategory = useFilterStore((s) => s.activeCategory);
  const isSwipeDeck = isDashboard && activeCategory && activeCategory !== 'all';

  const onBack = propOnBack || (
    isSwipeDeck
      ? () => { useFilterStore.getState().setActiveCategory(null as any); navigate('/client/dashboard'); }
      : (showBack ? () => navigate(getParentRoute(location.pathname) ?? '/client/dashboard') : undefined)
  );

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

  // Everyone is premium right now, so never surface a "running low" warning.
  const tokensLow = !PREMIUM_FOR_EVERYONE && tokens < 10;

  return (
    <header
      data-skip-press-engine
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-[transform,opacity] duration-200 pointer-events-none",
        !isActuallyVisible && "opacity-0 -translate-y-full",
        className
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        paddingTop: 'calc(var(--safe-top, 0px) + 6px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px) - 2px)',
        background: 'transparent',
        border: 'none',
        viewTransitionName: 'swipess-header',
      }}
    >
      <div className="h-full w-full px-3 flex items-center justify-between relative">

        {/* LEFT: profile/back and AI — Grouped in a single pill */}
        <div className="flex items-center px-1 py-1 rounded-full pointer-events-auto shadow-sm" style={glassPillStyle}>
          {onBack && !isSwipeDeck ? (
            <button
              type="button"
              onClick={() => { haptics.tap(); onBack(); }}
              className="flex items-center justify-center h-8 w-8 rounded-full transition-all group glass-bubble-hover"
              aria-label="Back"
            >
              <HeaderIconSlot>
                <ChevronLeft
                  className={cn(HEADER_ICON, "group-active:stroke-[3px] transition-all duration-150")}
                  strokeWidth={2.5}
                  style={{ color: iconColor, filter: iconShadow }}
                />
              </HeaderIconSlot>
            </button>
          ) : (
            user && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  navigate('/client/profile');
                }}
                className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden transition-all group glass-bubble-hover"
                aria-label="Open profile"
              >
                  {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt="Profile"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    initials === '?' ? <UserRound className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} /> : (
                      <span className="text-[12px] font-black text-primary-foreground drop-shadow-sm">
                        {initials}
                      </span>
                    )
                  )}
              </button>
            )
          )}

          {!minimal && (
            <button
              type="button"
              onClick={() => { haptics.tap(); useModalStore.getState().openAddListing(); }}
              className="flex items-center justify-center h-8 w-8 rounded-full transition-all group glass-bubble-hover"
              aria-label="AI Listing"
            >
              <HeaderIconSlot>
                <Sparkles
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'sparkles'),
                  }}
                  strokeWidth={2.5}
                />
              </HeaderIconSlot>
            </button>
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* RIGHT: Notifications, map, tokens, theme toggles */}
        {!minimal && (
          <div className="flex items-center px-1 py-1 rounded-full pointer-events-auto shadow-sm shrink-0 z-50" style={glassPillStyle}>
            {/* Tokens/Premium removed for now, or keep Crown */}
            <button
              type="button"
              onClick={() => { haptics.tap(); navigate('/premium'); }}
              className="flex items-center justify-center h-8 w-8 rounded-full transition-all group glass-bubble-hover"
              aria-label="Premium"
            >
              <HeaderIconSlot
                badge={
                  tokensLow && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )
                }
              >
                <Crown
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'crown'),
                  }}
                  strokeWidth={2.5}
                />
              </HeaderIconSlot>
            </button>

            <button
              type="button"
              onClick={() => { haptics.tap(); openPassportMap({ showCities: true }); }}
              className="flex items-center justify-center h-8 w-8 rounded-full transition-all group glass-bubble-hover"
              aria-label={t('map.liveMap')}
            >
              <HeaderIconSlot>
                <Globe
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'globe'),
                  }}
                  strokeWidth={2.5}
                />
              </HeaderIconSlot>
            </button>

            <ThemeToggle glassPillStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} className="rounded-full h-8 w-8 glass-bubble-hover" />

            <NotificationPopover glassPillStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} pillClassName="rounded-full h-8 w-8 glass-bubble-hover" />
          </div>
        )}

        {/* Center logo tap zone removed — its absolute 64×64 hit area overlapped the
            Tokens pill on narrow devices and intercepted the click, so the Tokens
            modal silently failed to open. Users still reach the dashboard via the
            bottom-nav Dashboard tile. */}
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