import { useLocation } from 'react-router-dom';
import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { ChevronLeft, Crown, Sparkles, UserRound, Globe2 } from 'lucide-react';
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
import { useFilterStore } from '@/state/filterStore';
import { getParentRoute } from '@/utils/sectionNavigation';

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

const HEADER_PILL =
  'tap-css-only flex shrink-0 items-center justify-center rounded-full glass-pill chrome-solid pointer-events-auto';
const HEADER_BTN_SIZE = 'h-[44px] w-[44px]';
const HEADER_ICON = 'w-[20px] h-[20px]';

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
  const location = useLocation();
  const { isLight } = useAppTheme();
  const setModal = useModalStore(s => s.setModal);
  const openPassport = useModalStore(s => s.openPassport);
  const openPassportMap = useModalStore(s => s.openPassportMap);
  const { tokens } = useTokens();
  const { t } = useTranslation();

  const isActuallyVisible = true;
  const isDashboard = location.pathname.includes('/dashboard');
  const useLightIcons = isDashboard || !isLight;
  const iconColor = useLightIcons ? '#FFFFFF' : '#0A0A0A';

  const activeCategory = useFilterStore((s) => s.activeCategory);
  const isSwipeDeck = isDashboard && activeCategory && activeCategory !== 'all';

  const onBack = propOnBack || (
    isSwipeDeck
      ? () => { useFilterStore.getState().setActiveCategory(null as any); navigate('/client/dashboard'); }
      : (showBack ? () => navigate(getParentRoute(location.pathname) ?? '/client/dashboard') : undefined)
  );

  const glassPillStyle: React.CSSProperties = {
    background: isLight ? (isDashboard ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)') : 'transparent',
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
    transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
    overflow: 'visible',
  };

  const iconShadow = useLightIcons
    ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))'
    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))';

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

  const tokensLow = tokens < 10;

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
        paddingTop: 'calc(var(--safe-top, 0px) + 16px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px) + 10px)',
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
              className={cn(HEADER_PILL, HEADER_BTN_SIZE)}
              style={glassPillStyle}
              aria-label="Back"
            >
              <ChevronLeft
                className={HEADER_ICON}
                strokeWidth={2.2}
                style={{ color: iconColor, filter: iconShadow }}
              />
            </button>
          ) : (
            user && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  navigate('/client/profile');
                }}
                className={cn(HEADER_PILL, HEADER_BTN_SIZE)}
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 14px hsl(var(--primary) / 0.35)',
                  }}
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
                </div>
              </button>
            )
          )}

          {!minimal && (
            <button
              type="button"
              onClick={() => { haptics.tap(); setModal('showAIListing', true); }}
              className={cn(HEADER_PILL, HEADER_BTN_SIZE, 'relative')}
              style={glassPillStyle}
              aria-label="AI Listing"
            >
              <Sparkles
                className={HEADER_ICON}
                style={{
                  color: iconColor,
                  filter: useLightIcons ? 'drop-shadow(0 0 8px rgba(168,85,247,0.65))' : 'none',
                }}
                strokeWidth={1.9}
              />
            </button>
          )}
        </div>

        <div className="flex-grow flex-1" />

        {/* RIGHT: each action in its own pill — 44px targets, gap between */}
        {!minimal && (
          <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
            <button
              type="button"
              onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
              className={cn(HEADER_PILL, HEADER_BTN_SIZE, 'relative')}
              style={glassPillStyle}
              aria-label={`Tokens${tokensLow ? ' — running low' : ''}`}
            >
              <Crown
                className={HEADER_ICON}
                style={{
                  color: iconColor,
                  filter: useLightIcons ? 'drop-shadow(0 0 8px rgba(228,0,124,0.65))' : 'none',
                }}
                strokeWidth={1.9}
              />
              <span
                className={cn(
                  'absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-background/80',
                  tokensLow
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-brand-primary',
                )}
                aria-hidden
              />
            </button>

            <button
              type="button"
              onClick={() => { haptics.tap(); openPassportMap({ showCities: true }); }}
              className={cn(HEADER_PILL, HEADER_BTN_SIZE, 'relative')}
              style={glassPillStyle}
              aria-label="Global Passport"
            >
              <Globe
                className={HEADER_ICON}
                style={{
                  color: iconColor,
                  filter: useLightIcons ? 'drop-shadow(0 0 8px rgba(59,130,246,0.65))' : 'none',
                }}
                strokeWidth={1.9}
              />
            </button>

            <div className={cn(HEADER_PILL, HEADER_BTN_SIZE)}>
              <ThemeToggle glassPillStyle={glassPillStyle} />
            </div>

            <div className={cn(HEADER_PILL, HEADER_BTN_SIZE)}>
              <NotificationPopover glassPillStyle={glassPillStyle} />
            </div>
          </div>
        )}

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