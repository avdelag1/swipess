import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, SlidersHorizontal, Radio, Ghost, Sparkles } from 'lucide-react';
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
  onBack,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { theme, isLight, isDark } = useTheme();

  const isOwner = userRole === 'owner';

  const glassSurfaceStyle: React.CSSProperties = {
    background: _transparent ? 'transparent' : 'var(--nav-bg)',
    backdropFilter: theme === 'ivanna-style' ? 'none' : 'blur(64px) saturate(280%) contrast(1.1)',
    WebkitBackdropFilter: theme === 'ivanna-style' ? 'none' : 'blur(64px) saturate(280%) contrast(1.1)',
    borderRadius: '1.8rem',
    boxShadow: theme === 'ivanna-style' 
      ? '0 20px 50px -10px rgba(100,160,230,0.25), inset 0 0 20px rgba(255,255,255,0.4)'
      : (isLight 
         ? '0 20px 50px -10px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4)' 
         : '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.2)'),
    border: _transparent ? 'none' : (isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.15)'),
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
        "absolute top-0 left-0 right-0 z-[100] transition-all duration-700 pointer-events-none",
        _transparent ? "h-20" : "h-16",
        className
      )}
      style={{
        paddingTop: 'var(--safe-top)',
        height: _transparent ? 'auto' : 'calc(var(--top-bar-height) + var(--safe-top))'
      }}
    >
      <div className="h-full w-full max-w-screen-xl mx-auto px-4 flex items-center justify-between relative">
        
        {/* LEFT CLUSTER: Profile, Back & Mode Switching (Unified Pill) */}
        <div className="flex-shrink-0 flex items-center pointer-events-none">
          {(!minimal || onBack) && (
            <div 
              className={cn("flex items-center gap-1.5 pointer-events-auto transition-all duration-300")} 
            >
              {onBack && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptics.tap();
                    onBack();
                  }}
                  className="w-10 h-10 flex items-center justify-center p-0"
                >
                  <ChevronLeft className={cn("w-6 h-6", isLight ? "text-foreground" : "text-white")} />
                </motion.button>
              )}
              
              {user && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptics.tap();
                    navigate(isOwner ? '/owner/profile' : '/client/profile');
                  }}
                  className="flex items-center gap-2 pr-2 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-primary/40 ml-0.5">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Ghost className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                  </div>
                  {profile?.full_name && (
                    <span className={cn(
                      "text-[11px] font-black uppercase italic tracking-tight whitespace-nowrap flex-shrink-0 max-w-[9ch] truncate",
                      isLight ? "text-foreground" : "text-white/90"
                    )}>
                      {profile.full_name.split(' ')[0]}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Mode Switcher Integrated into Left Unified Pill */}
              <div className="flex items-center h-6 ml-0.5">
                <ModeSwitcher variant="icon" size="sm" />
              </div>
            </div>
          )}
        </div>

        {/* CENTER: PURGED PER USER REQUEST */}
        <div className="flex-1" />

        {/* RIGHT CLUSTER: Actions (Unified Pill) */}
        <div className="flex-shrink-0 flex items-center pointer-events-none">
          {!minimal && (
               <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  onFilterClick?.();
                }}
                className="w-10 h-10 flex items-center justify-center p-0 group relative"
                title="Filters"
              >
                <SlidersHorizontal className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </motion.button>

               <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
                className="w-10 h-10 flex items-center justify-center p-0"
                title="Radio"
              >
                <Radio 
                  className={cn("w-5 h-5", isLight ? "text-brand-primary" : "text-brand-primary")} 
                  strokeWidth={2.5} 
                />
              </motion.button>

              {isOwner && (
                 <motion.button
                  whileTap={{ scale: 0.85 }}
                  onPointerDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    haptics.success();
                    useModalStore.getState().openAIListing();
                  }}
                  className="w-10 h-10 flex items-center justify-center p-0 relative"
                  title="AI Listing Wizard"
                >
                  <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                  <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                </motion.button>
              )}


              <div className="flex items-center px-0.5">
                <ThemeToggle />
              </div>
              
              <div className="flex items-center px-0.5">
                <NotificationPopover />
              </div>
            </div>
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


