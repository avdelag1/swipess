import { memo } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, Ticket } from 'lucide-react';
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

  // Unified pill — 36px height, consistent radius, layered elevation.
  // Applied to back button, profile chip, mode switcher, and every action pill
  // so the header reads as a single, perfectly aligned glass row.
  const glassPillStyle: React.CSSProperties = {
    background: isLight
      ? 'rgba(255, 255, 255, 0.86)'
      : 'rgba(255, 255, 255, 0.045)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '1rem',
    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isLight
      ? '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
      : '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 18px rgba(0,0,0,0.35)',
    pointerEvents: 'auto',
    color: isLight ? '#000000' : 'var(--hud-text)',
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
        
        <div className="flex items-center gap-2.5 pointer-events-auto">
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
                className="flex shrink-0 items-center gap-1.5 pl-1 pr-2.5 rounded-[1rem] group"
                style={glassPillStyle}
                aria-label="Open profile"
              >
                <div
                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{
                    background: isOwner
                      ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                      : 'linear-gradient(135deg, #EB4898, #8B5CF6)',
                    boxShadow: isOwner
                      ? '0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 12px rgba(139,92,246,0.45)'
                      : '0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 12px rgba(235,72,152,0.45)',
                  }}
                >
                  {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-[10px] font-black tracking-tight text-white drop-shadow-sm"
                      style={{ letterSpacing: '0.02em' }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
                {profile?.full_name && (
                  <span
                    className="hidden sm:inline-block text-[10px] font-black uppercase tracking-[0.12em]"
                    style={{ color: isLight ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.88)', fontVariantNumeric: 'tabular-nums' }}
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
                  className="flex shrink-0 items-center justify-center rounded-[1rem] relative overflow-hidden"
                  style={{
                    ...glassPillStyle,
                    width: '36px',
                    background: isLight
                      ? 'linear-gradient(135deg, rgba(255,77,0,0.10), rgba(235,72,152,0.08))'
                      : 'linear-gradient(135deg, rgba(255,77,0,0.28), rgba(235,72,152,0.18))',
                    border: isLight ? '1px solid rgba(255,77,0,0.18)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                  aria-label="Tokens"
                >
                  {/* Top inner highlight for depth */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                  />
                  <Ticket
                    className="w-4 h-4"
                    style={{
                      color: isLight ? '#FF4D00' : '#FF6B1A',
                      filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(255, 77, 0, 0.55))',
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
