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
  getHeaderChrome,
  getHeaderIconFilter,
  HEADER_PILL_BASE,
  isDashboardPath,
} from '@/utils/headerChrome';
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
  const { useLightIcons, iconColor, pillStyle: glassPillStyle, iconShadow } = getHeaderChrome(isLight, isDashboard);

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

        {/* LEFT: profile/back and AI — separate pills with breathing room */}
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-auto">
          {onBack && !isSwipeDeck ? (
            <button
              type="button"
              onClick={() => { haptics.tap(); onBack(); }}
              className={cn(HEADER_PILL_BASE, "group")}
              style={glassPillStyle}
              aria-label="Back"
            >
              <HeaderIconSlot>
                <ChevronLeft
                  className={cn(HEADER_ICON, "group-active:stroke-[3px] transition-all duration-150")}
                  strokeWidth={2.2}
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
                className="group relative flex items-center justify-center shrink-0 pointer-events-auto w-[26px] h-[26px] rounded-full overflow-hidden group-active:scale-[0.92] transition-transform duration-150"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  boxShadow: useLightIcons
                    ? '0 0 0 1px rgba(255,255,255,0.2) inset, 0 4px 12px rgba(0,0,0,0.35)'
                    : '0 0 0 1px rgba(255,255,255,0.2) inset, 0 2px 6px rgba(0,0,0,0.15)',
                }}
                aria-label="Open profile"
              >
                  {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt="Profile"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover"
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
              className={cn(HEADER_PILL_BASE, "group")}
              style={glassPillStyle}
              aria-label="AI Listing"
            >
              <HeaderIconSlot>
                <Sparkles
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'sparkles'),
                  }}
                  strokeWidth={1.9}
                />
              </HeaderIconSlot>
            </button>
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* RIGHT: each action in its own pill — 44px targets, gap between */}
        {!minimal && (
          <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); haptics.tap(); setModal('showTokensModal', true); }}
              onPointerDown={(e) => { e.stopPropagation(); }}
              className={cn(HEADER_PILL_BASE, "group")}
              style={glassPillStyle}
              aria-label={`Tokens${tokensLow ? ' — running low' : ''}`}
            >
              <HeaderIconSlot
                badge={(
                  <span
                    className={cn(
                      'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background/80',
                      tokensLow
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-brand-primary',
                    )}
                    aria-hidden
                  />
                )}
              >
                <Crown
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'crown'),
                  }}
                  strokeWidth={1.9}
                />
              </HeaderIconSlot>
            </button>

            <button
              type="button"
              onClick={() => { haptics.tap(); openPassportMap({ showCities: true }); }}
              className={cn(HEADER_PILL_BASE, "group")}
              style={glassPillStyle}
              aria-label={t('map.liveMap')}
            >
              <HeaderIconSlot>
                <Globe
                  className={cn(HEADER_ICON, "group-active:fill-current group-active:scale-[0.92] transition-all duration-150")}
                  style={{
                    color: iconColor,
                    filter: getHeaderIconFilter(iconShadow, useLightIcons, 'globe'),
                  }}
                  strokeWidth={1.9}
                />
              </HeaderIconSlot>
            </button>

            <ThemeToggle glassPillStyle={glassPillStyle} className={HEADER_PILL_BASE} />

            <NotificationPopover glassPillStyle={glassPillStyle} pillClassName={HEADER_PILL_BASE} />
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