import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, Radio, Ghost } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore, useFilterActions } from '@/state/filterStore';

interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  onAISearchClick?: () => void;
  onFilterClick?: (e?: React.PointerEvent | React.MouseEvent) => void;
  onBack?: () => void;
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
  onFilterClick: _onFilterClick,
  onBack: propOnBack,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { theme, isLight } = useTheme();
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();

  const isOwner = userRole === 'owner';
  
  // HUD Master Back Logic: Combine prop onBack with Map Back
  const onBack = propOnBack || (activeCategory ? () => setActiveCategory(null) : undefined);

  // 💎 THE "WHITE FILTER" HUD STYLE 
  // Enforces a premium, high-opacity frosted glass look as requested.
  const glassPillStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(40px) saturate(210%) brightness(1.05)',
    WebkitBackdropFilter: 'blur(40px) saturate(210%) brightness(1.05)',
    borderRadius: '1.25rem',
    border: '1px solid rgba(255, 255, 255, 1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 1)',
    pointerEvents: 'auto',
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

  return (
    <header 
      className={cn(
        "absolute top-0 left-0 right-0 z-[10005] transition-all duration-700 pointer-events-none",
        _transparent ? "h-24" : "h-20",
        className
      )}
      style={{
        paddingTop: 'var(--safe-top)',
        height: 'calc(var(--top-bar-height) + var(--safe-top))'
      }}
    >
      <div className="h-full w-full max-w-screen-xl mx-auto px-4 flex items-center justify-between relative">
        
        {/* LEFT CLUSTER: Profile Pill */}
        <div className="flex items-center gap-2">
          {onBack ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); haptics.tap(); onBack(); }}
              className="w-12 h-12 flex items-center justify-center"
              style={glassPillStyle}
            >
              <ChevronLeft className="w-7 h-7 text-black" />
            </motion.button>
          ) : (
            user && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate(isOwner ? '/owner/profile' : '/client/profile');
                }}
                className="flex items-center gap-2.5 px-3 py-1.5"
                style={glassPillStyle}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0 shadow-md">
                   <span className="text-orange-500 font-black text-lg italic">S</span>
                </div>
                {profile?.full_name && (
                  <span className="text-[12px] font-black uppercase tracking-widest text-black mr-1">
                    {profile.full_name.split(' ')[0]}
                  </span>
                )}
              </motion.button>
            )
          )}

          {/* Mode Switcher Pill */}
          {!minimal && (
            <div className="h-11 flex items-center px-4" style={glassPillStyle}>
              <ModeSwitcher variant="icon" size="sm" />
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* RIGHT CLUSTER: Individual Action Pills */}
        <div className="flex items-center gap-3">
          {!minimal && (
            <>
               <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
                className="w-12 h-12 flex items-center justify-center p-0"
                style={glassPillStyle}
                title="Radio"
              >
                <Radio 
                  className="w-6 h-6 text-orange-500" 
                  strokeWidth={2.5} 
                />
              </motion.button>

              <div className="w-12 h-12 flex items-center justify-center" style={glassPillStyle}>
                <ThemeToggle />
              </div>
              
              <div className="w-12 h-12 flex items-center justify-center" style={glassPillStyle}>
                <NotificationPopover />
              </div>
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


