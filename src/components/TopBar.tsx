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
  activeTab?: 'explore' | 'manage';
  onTabChange?: (tab: 'explore' | 'manage') => void;
}

function TopBarComponent({
  onFilterClick: _onFilterClick,
  onBack,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
  activeTab,
  onTabChange,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { theme, isLight, isDark } = useTheme();

  const isOwner = userRole === 'owner';

  const glassSurfaceStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 1)',
    backdropFilter: 'blur(60px) saturate(240%)',
    WebkitBackdropFilter: 'blur(60px) saturate(240%)',
    borderRadius: '1.8rem',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)',
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
              className={cn("flex items-center gap-1.5 pointer-events-auto transition-all duration-500 px-3.5 py-2")} 
              style={glassSurfaceStyle}
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
                  className="w-12 h-12 flex items-center justify-center p-0"
                >
                  <ChevronLeft className={cn("w-7 h-7", isLight ? "text-foreground" : "text-white")} />
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
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10",
                      isLight ? "text-black/90" : "text-white/90"
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

        {/* CENTER: Mode Tabs (EXPLORE | MANAGE) */}
        {!minimal && (
          <div className="flex-1 flex justify-center pointer-events-none">
            <div 
              className="flex rounded-full p-1.5 shadow-md pointer-events-auto stagger-enter"
              style={glassSurfaceStyle}
            >
              <button
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  if (onTabChange) onTabChange('explore');
                }}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === 'explore' 
                    ? "bg-black text-white shadow-lg" 
                    : "text-black/40 hover:text-black/60"
                )}
              >
                Explore
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  if (onTabChange) onTabChange('manage');
                }}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === 'manage' 
                    ? "bg-black text-white shadow-lg" 
                    : "text-black/40 hover:text-black/60"
                )}
              >
                Manage
              </button>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* RIGHT CLUSTER: Actions (Unified Pill) */}
        <div className="flex-shrink-0 flex items-center pointer-events-none">
          {!minimal && (
            <div 
              className={cn("flex items-center gap-2 pointer-events-auto transition-all duration-500 px-3.5 py-2")} 
              style={glassSurfaceStyle}
            >
               <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
                className="w-12 h-12 flex items-center justify-center p-0"
                title="Radio"
              >
                <Radio 
                  className={cn("w-6 h-6", isLight ? "text-brand-primary" : "text-brand-primary")} 
                  strokeWidth={2.5} 
                />
              </motion.button>

              <div className="flex items-center px-0.5">
                <ThemeToggle />
              </div>
              
              <div className="flex items-center gap-1.5">
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


