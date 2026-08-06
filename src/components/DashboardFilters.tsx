import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface DashboardFiltersProps {
  isLight: boolean;
}

export function DashboardFilters({ isLight }: DashboardFiltersProps) {
  const haptics = useHaptics();

  const filters = [
    { id: 'location', label: 'Tulum, Mexico', icon: MapPin },
    { id: 'date', label: 'Any date', icon: Calendar },
    { id: 'guests', label: '2 guests', icon: Users },
  ];

  const pillStyle = {
    background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
    border: isLight ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    color: isLight ? '#000' : '#fff',
  };

  return (
    <div className="w-full overflow-x-auto hide-scrollbar mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex items-center gap-2 px-1 min-w-max">
        {filters.map((filter, index) => {
          const Icon = filter.icon;
          return (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptics.tap();
                // We will connect this to real state later
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full shadow-sm"
              style={pillStyle}
            >
              <Icon className="w-3.5 h-3.5 opacity-70" />
              <span className="text-[13px] font-medium whitespace-nowrap">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
