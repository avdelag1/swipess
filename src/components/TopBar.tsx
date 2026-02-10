import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

import { QuickFilterDropdown } from './QuickFilterDropdown';
import { ModeSwitcher } from './ModeSwitcher';
import { useScrollDirection } from '@/hooks/useScrollDirection';

// DARK MODE: White text on dark background
const MessageActivationText = () => (
  <>
    <span className="hidden sm:inline font-bold text-sm tracking-tight text-white whitespace-nowrap">
      Message Activation
    </span>
    <Zap className="sm:hidden h-5 w-5 text-white" />
  </>
);

interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  className?: string;
  showFilters?: boolean;
  userRole?: 'client' | 'owner';
  transparent?: boolean;
  hideOnScroll?: boolean;
  title?: string;
}

function TopBarComponent({
  onNotificationsClick,
  onMessageActivationsClick,
  className,
  showFilters,
  userRole,
  transparent = false,
  hideOnScroll = false,
  title,
}: TopBarProps) {
  const { isVisible } = useScrollDirection({ 
    threshold: 15, 
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
  });
  const { unreadCount: notificationCount } = useUnreadNotifications();
  const navigate = useNavigate();

  const shouldHide = hideOnScroll && !isVisible;

  return (
    <header
      className={cn(
        'app-header',
        // Transparent - no background, no blur, no border
        transparent ? 'bg-transparent border-transparent backdrop-blur-none' : 'bg-[#1C1C1E] border-transparent',
        shouldHide && 'header-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between h-12 max-w-screen-xl mx-auto gap-2">
        {/* Left section: Title + Mode switcher + filters */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Title on the left - NEW */}
          {title && (
            <div className="hidden sm:block flex-shrink-0 font-bold text-sm sm:text-base text-white whitespace-nowrap">
              {title}
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <ModeSwitcher variant="pill" size="sm" className="md:hidden" />
            <ModeSwitcher variant="pill" size="md" className="hidden md:flex" />
          </div>

          {showFilters && userRole && (
            <div className="flex-shrink-0">
              <QuickFilterDropdown userRole={userRole} />
            </div>
          )}
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
          {/* DARK MODE: Dark backgrounds with light icons */}
          <Button
            variant="ghost"
            className={cn(
              "relative h-9 sm:h-10 md:h-11 px-2 sm:px-3 md:px-4 rounded-xl transition-all duration-100 ease-out",
              "active:scale-[0.95]",
              "hover:bg-white/10",
              "touch-manipulation",
              "-webkit-tap-highlight-color-transparent",
              "flex items-center"
            )}
            onClick={onMessageActivationsClick}
            aria-label="Message activations"
          >
            <MessageActivationText />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl transition-all duration-100 ease-out",
              "active:scale-[0.95]",
              "hover:bg-white/10",
              "group flex-shrink-0",
              "touch-manipulation",
              "-webkit-tap-highlight-color-transparent"
            )}
            onClick={onNotificationsClick}
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          >
            <div className="relative">
              {/* DARK MODE: White icon colors */}
              <Bell
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-150",
                  notificationCount > 0
                    ? "text-white group-hover:text-white/80"
                    : "text-white/90 group-hover:text-white"
                )}
              />
              <AnimatePresence>
                {notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-orange-500"
                  />
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              {notificationCount > 0 && (
                <motion.span
                  key="notification-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] flex items-center justify-center ring-2 ring-[#1C1C1E]"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </header>
  );
}

export const TopBar = memo(TopBarComponent);
