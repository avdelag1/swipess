import { useLocation } from 'react-router-dom';
import { type CSSProperties, memo, type ReactNode } from 'react';
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
  isDashboardPath,
} from '@/utils/chromeStyles';

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

const HEADER_ICON = 'w-[24px] h-[24px]';

/** Liquid Glass / Neo-Naïve pill wrapper — chrome-icon-btn forces transparent, so chrome lives here. */
function GlassPill({
  children,
  style,
  className,
  wide,
  neoNaive,
}: {
  children: ReactNode;
  style: CSSProperties;
  className?: string;
  wide?: boolean;
  neoNaive?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 rounded-full',
        wide ? 'h-9 px-2.5 gap-1' : 'h-9 w-9',
        neoNaive && 'neo-naive',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

function HeaderIconSlot({
  children,
  badge,
  wash,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
  wash?: 'coral' | 'sky' | 'lemon' | 'mint';
}) {
  return (
    <span
      className={cn(
        'relative flex items-center justify-center w-6 h-6 shrink-0',
        wash && `neo-naive-header-icon neo-naive-header-icon--${wash}`,
      )}
    >
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
  const openPassportMap = useModalStore(s => s.openPassportMap);
  const { tokens } = useTokens();
  const { t } = useTranslation();

  const isDashboard = isDashboardPath(location.pathname);
  const { iconColor, pillStyle } = getTopBarChrome(isLight, isDashboard);

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

  const clearIcon: CSSProperties = {
    WebkitTapHighlightColor: 'transparent',
    background: 'transparent',
    boxShadow: 'none',
    border: 'none',
  };

  return (
    <header
      data-skip-press-engine
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] pointer-events-none",
        className
      )}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        height: 'calc(var(--top-bar-height) + env(safe-area-inset-top, 0px) - 6px)',
        background: 'transparent',
        border: 'none',
        viewTransitionName: 'swipess-header',
      }}
    >
      <div className="h-full w-full px-3 flex items-center justify-between relative">

        {/* LEFT: profile/back and AI */}
        <div className={cn('flex items-center gap-2 pointer-events-auto neo-naive', !isLight && 'neo-naive--dark')}>
          {onBack && !isSwipeDeck ? (
            <GlassPill style={pillStyle} neoNaive>
              <button
                type="button"
                onClick={() => { haptics.tap(); onBack(); }}
                className="chrome-icon-btn flex items-center justify-center h-8 w-8 rounded-full transition-all group"
                style={clearIcon}
                aria-label="Back"
              >
                <HeaderIconSlot wash="sky">
                  <ChevronLeft
                    className={cn(HEADER_ICON, "group-active:stroke-[2px] transition-all duration-150")}
                    strokeWidth={2.25}
                    style={{ color: iconColor, filter: 'none' }}
                  />
                </HeaderIconSlot>
              </button>
            </GlassPill>
          ) : (
            user && (
              <GlassPill style={pillStyle} wide neoNaive>
                <button
                  type="button"
                  className="chrome-icon-btn flex items-center gap-1.5 transition-all group rounded-full"
                  onClick={() => { haptics.tap(); navigate('/client/profile'); }}
                  aria-label="Open profile"
                  style={clearIcon}
                >
                  <span
                    className="flex items-center justify-center h-7 w-7 rounded-full overflow-hidden shrink-0 shadow-sm shadow-black/10"
                  >
                      {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                        <img
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                          alt=""
                          loading="eager"
                          decoding="async"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        initials === '?' ? <UserRound className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} /> : (
                          <span className="w-full h-full bg-white/20 flex items-center justify-center rounded-full">
                            <span className="text-[10px] font-black drop-shadow-sm" style={{ color: iconColor }}>
                              {initials}
                            </span>
                          </span>
                        )
                      )}
                  </span>
                  <span className="flex items-center gap-1 select-none" style={{ color: iconColor }}>
                    <span className="text-[12px] font-bold leading-none tracking-tight">
                      {profile?.first_name || profile?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || ''}
                    </span>
                  </span>
                </button>
              </GlassPill>
            )
          )}

          {!minimal && (
            <GlassPill style={pillStyle} neoNaive>
              <button
                type="button"
                onClick={() => { haptics.tap(); useModalStore.getState().openAddListing(); }}
                className="chrome-icon-btn flex items-center justify-center h-8 w-8 rounded-full transition-all group shrink-0"
                style={clearIcon}
                aria-label="AI Listing"
              >
                <HeaderIconSlot wash="mint">
                  <Sparkles
                    className={cn(HEADER_ICON, "group-active:fill-current transition-all duration-150")}
                    style={{
                      color: iconColor,
                      filter: 'none',
                    }}
                    strokeWidth={2.25}
                  />
                </HeaderIconSlot>
              </button>
            </GlassPill>
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* RIGHT: Tokens, map, theme, notifications */}
        {!minimal && (
          <div className={cn('flex items-center gap-2 pointer-events-auto shrink-0 z-50 neo-naive', !isLight && 'neo-naive--dark')}>
            <GlassPill style={pillStyle} neoNaive>
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  useModalStore.getState().setModal('showTokensModal', true);
                }}
                className="chrome-icon-btn flex items-center justify-center h-8 w-8 rounded-full transition-all group"
                style={clearIcon}
                aria-label="Tokens"
              >
                <HeaderIconSlot
                  wash="lemon"
                  badge={
                    tokensLow && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-black/20"></span>
                      </span>
                    )
                  }
                >
                  <Crown
                    className={cn(HEADER_ICON, "group-active:fill-current transition-all duration-150")}
                    style={{
                      color: iconColor,
                      filter: 'none',
                    }}
                    strokeWidth={2.25}
                  />
                </HeaderIconSlot>
              </button>
            </GlassPill>

            <GlassPill style={pillStyle} neoNaive>
              <button
                type="button"
                onClick={() => { haptics.tap(); openPassportMap({ showCities: true }); }}
                className="chrome-icon-btn flex items-center justify-center h-8 w-8 rounded-full transition-all group"
                style={clearIcon}
                aria-label={t('map.liveMap')}
              >
                <HeaderIconSlot wash="sky">
                  <Globe
                    className={cn(HEADER_ICON, "group-active:fill-current transition-all duration-150")}
                    style={{
                      color: iconColor,
                      filter: 'none',
                    }}
                    strokeWidth={2.25}
                  />
                </HeaderIconSlot>
              </button>
            </GlassPill>

            <GlassPill style={pillStyle} neoNaive>
              <ThemeToggle glassPillStyle={clearIcon} className="chrome-icon-btn rounded-full h-8 w-8" />
            </GlassPill>

            <GlassPill style={pillStyle} neoNaive>
              <NotificationPopover glassPillStyle={clearIcon} pillClassName="chrome-icon-btn rounded-full h-8 w-8" />
            </GlassPill>
          </div>
        )}
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
