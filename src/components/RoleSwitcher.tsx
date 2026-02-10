import { motion } from 'framer-motion';
import { Search, Briefcase, ArrowLeftRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { Card, CardContent } from '@/components/ui/card';

interface RoleSwitcherProps {
  /** Show as compact toggle (for nav) or full card (for settings) */
  variant?: 'compact' | 'card';
  /** Additional class names */
  className?: string;
}

/**
 * Role Switcher Component
 *
 * Allows users to switch between:
 * - "I'm a Client" mode: Browse and discover deals, services, properties
 * - "I Own / I Can Do" mode: Share services and manage listings
 *
 * One account, two modes - like Uber driver/rider toggle.
 */
export function RoleSwitcher({ variant = 'card', className }: RoleSwitcherProps) {
  const { activeMode, switchMode, isLoading } = useActiveMode();

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={() => switchMode(activeMode === 'client' ? 'owner' : 'client')}
        disabled={isLoading}
        className={cn(
          "relative flex items-center gap-2 px-3 py-2 rounded-full",
          "bg-white/10 hover:bg-white/20 transition-colors border border-white/20",
          "text-sm font-bold text-white",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowLeftRight className="w-4 h-4" />
        )}
        <span>
          {activeMode === 'client' ? 'Switch to I own' : 'Switch to I Do'}
        </span>
      </motion.button>
    );
  }

  return (
    <Card className={cn("bg-gray-900/90 border-white/20 overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white">Account Mode</h3>
            <p className="text-sm text-gray-300">
              Switch between browsing and offering
            </p>
          </div>
          {isLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          )}
        </div>

        {/* Toggle Options */}
        <div className="grid grid-cols-2 gap-3">
          <ModeOption
            mode="client"
            icon={Search}
            label="I Do"
            description="Browse & discover"
            isActive={activeMode === 'client'}
            onClick={() => switchMode('client')}
            disabled={isLoading}
          />
          <ModeOption
            mode="owner"
            icon={Briefcase}
            label="I own"
            description="Share & manage"
            isActive={activeMode === 'owner'}
            onClick={() => switchMode('owner')}
            disabled={isLoading}
          />
        </div>

        {/* Current Mode Indicator */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-lg",
              activeMode === 'client' ? "bg-blue-400 shadow-blue-400/50" : "bg-orange-400 shadow-orange-400/50"
            )} />
            <span className="text-gray-300">
              Currently in{' '}
              <span className="font-bold text-white">
                {activeMode === 'client' ? 'I Do' : 'I own'}
              </span>
              {' '}mode
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModeOptionProps {
  mode: ActiveMode;
  icon: React.ElementType;
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ModeOption({
  mode,
  icon: Icon,
  label,
  description,
  isActive,
  onClick,
  disabled
}: ModeOptionProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isActive}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl border",
        "transition-all duration-200",
        isActive
          ? mode === 'client'
            ? "bg-blue-500/20 border-blue-500/30"
            : "bg-orange-500/20 border-orange-500/30"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
        (disabled && !isActive) && "opacity-50 cursor-not-allowed"
      )}
      whileTap={!disabled && !isActive ? { scale: 0.98 } : undefined}
    >
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="active-mode-indicator"
          className={cn(
            "absolute top-2 right-2 w-2 h-2 rounded-full shadow-lg shadow-blue-500/30",
            mode === 'client' ? "bg-blue-400" : "bg-orange-400"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon */}
      <div className={cn(
        "p-3 rounded-full shadow-lg",
        isActive
          ? mode === 'client'
            ? "bg-blue-500/25 text-blue-400"
            : "bg-orange-500/25 text-orange-400"
          : "bg-white/10 text-white"
      )}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={cn(
          "font-bold",
          isActive ? "text-white" : "text-gray-300"
        )}>
          {label}
        </div>
        <div className="text-xs text-gray-400">
          {description}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Compact role indicator for navigation/headers
 */
export function RoleIndicator({ className }: { className?: string }) {
  const { activeMode } = useActiveMode();

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold",
      activeMode === 'client'
        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        : "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      className
    )}>
      {activeMode === 'client' ? (
        <>
          <Search className="w-3 h-3" />
          <span>I Do</span>
        </>
      ) : (
        <>
          <Briefcase className="w-3 h-3" />
          <span>I own</span>
        </>
      )}
    </div>
  );
}
