import { memo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

interface ThemeToggleProps {
    className?: string;
}

const THEMES = [
  { id: 'light',        Icon: Sun,       label: 'Light mode',   iconClass: 'text-amber-500' },
  { id: 'dark',         Icon: Moon,      label: 'Dark mode',    iconClass: 'text-white/70' },
  { id: 'ivanna-style', Icon: Sparkles,  label: 'Ivanna style', iconClass: 'text-pink-400' },
] as const;

type ThemeId = typeof THEMES[number]['id'];

function ThemeToggleComponent({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const handleSelect = (id: ThemeId, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        setTheme(id, { x: e.clientX, y: e.clientY });
    };

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {THEMES.map(({ id, Icon, label, iconClass }) => {
                const active = theme === id;
                return (
                    <button
                        key={id}
                        onClick={(e) => handleSelect(id, e)}
                        onPointerDown={(e) => e.stopPropagation()}
                        aria-label={label}
                        title={label}
                        className={cn(
                            'relative flex items-center justify-center rounded-xl',
                            'transition-all duration-100 ease-out active:scale-[0.9]',
                            'touch-manipulation h-9 w-9 flex-shrink-0',
                            active ? 'bg-white/10' : 'bg-transparent',
                        )}
                        style={{ border: 'none', boxShadow: 'none' }}
                    >
                        <motion.div
                            animate={{ scale: active ? 1.15 : 0.9, opacity: active ? 1 : 0.45 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Icon strokeWidth={1.5} className={cn('h-4 w-4 sm:h-5 sm:w-5', iconClass)} />
                        </motion.div>
                    </button>
                );
            })}
        </div>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);
