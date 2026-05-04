import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
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
import { useFilterStore, useFilterActions } from '@/state/filterStore';
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
  const setModal = useModalStore(s => s.setModal);

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();

  const isOwner = userRole === 'owner';

  const onBack = propOnBack || (showBack ? () => window.history.length > 2 ? navigate(-1) : navigate(`/${isOwner ? 'owner' : 'client'}/dashboard`) : (activeCategory ? () => setActiveCategory(null) : undefined));

  // Frameless icon buttons — the page already provides a glass surface,
  // so each control sits as a clean floating icon without a second pill.
  const glassPillStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    borderRadius: '9999px',
    pointerEvents: 'auto',
    color: 'hsl(var(--foreground))',
    height: '36px',
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
        "relative w-full transition-all duration-500 pointer-events-none",
        className
      )}
      style={{
        paddingTop: 'calc(var(--safe-top, 0px) + 6px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px))',
        background: 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-4 flex items-center justify-between relative">
        
        <div className="flex min-w-0 items-center gap-2 pointer-events-auto">
          {onBack ? (
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.94 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="flex shrink-0 items-center justify-center rounded-[1rem]"
              style={{ ...glassPillStyle, width: '36px' }}
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.4} style={{ color: isLight ? '#000000' : 'var(--hud-text)' }} />
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
                className="flex shrink-0 items-center gap-1.5 rounded-full pl-1 pr-2 group"
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{
                    background: isOwner
                      ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                      : 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
                    boxShadow: isOwner
                      ? '0 0 0 1px hsl(var(--foreground) / 0.16) inset, 0 0 18px hsl(var(--primary) / 0.38)'
                      : '0 0 0 1px hsl(var(--foreground) / 0.16) inset, 0 0 18px hsl(var(--accent) / 0.38)',
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
                      <span className="text-[10px] font-black text-primary-foreground drop-shadow-sm">
                        {initials}
                      </span>
                    )
                  )}
                </div>
                {profile?.full_name && (
                  <span
                    className="hidden max-w-[74px] truncate sm:inline-block text-[10px] font-black uppercase tracking-[0.08em] text-foreground/80"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
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

        {onCenterTap ? (
          <motion.button
            className="flex-1 h-full pointer-events-auto"
            whileTap={{ opacity: 0.7 }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); haptics.tap(); onCenterTap(); }}
            aria-label="Go to dashboard"
          />
        ) : (
          <div className="flex-1" />
        )}

        {/* RIGHT CLUSTER: Individual Action Pills */}
          <div className="flex shrink-0 items-center gap-2 pointer-events-auto">
          {!minimal && (
            <>
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
                  className="flex shrink-0 items-center justify-center rounded-full relative overflow-hidden"
                  style={{
                    ...glassPillStyle,
                    width: '36px',
                  }}
                  aria-label="Tokens"
                >
                  <Crown
                    className="w-4 h-4"
                    style={{
                      color: 'hsl(var(--primary))',
                      filter: isLight ? 'none' : 'drop-shadow(0 0 8px hsl(var(--primary) / 0.55))',
                    }}
                    strokeWidth={2.2}
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
