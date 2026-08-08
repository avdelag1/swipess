import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { haptics } from '@/utils/microPolish';
import { useModalStore } from '@/state/modalStore';

interface DashboardFiltersProps {
  isLight: boolean;
}

export function DashboardFilters({ isLight }: DashboardFiltersProps) {
  const filters = [
    { id: 'location', label: 'Tulum, Mexico', icon: MapPin },
    { id: 'date', label: 'Any date', icon: Calendar },
    { id: 'guests', label: '2 guests', icon: Users },
  ];
  
  const setModal = useModalStore(state => state.setModal);
  const openPassportMap = useModalStore(state => state.openPassportMap);

  // True iOS Liquid Glass styles for Filters
  const glassStyle = {
    background: isLight
      ? 'linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 100%)'
      : 'linear-gradient(145deg, rgba(28,28,36,0.55) 0%, rgba(16,16,22,0.35) 100%)',
    border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.10)',
    borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.20)',
    boxShadow: isLight
      ? '0 6px 18px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.85)'
      : '0 8px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    color: isLight ? '#111' : '#fff',
  };

  return (
    <div className="w-full mb-3">
      <div className="grid grid-cols-3 gap-2 w-full">
        {filters.map((filter, index) => {
          const Icon = filter.icon;
          return (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptics.tap();
                if (filter.id === 'location') {
                  openPassportMap({ showCities: true });
                } else if (filter.id === 'date') {
                  setModal('showDatesModal', true);
                } else if (filter.id === 'guests') {
                  setModal('showGuestsModal', true);
                }
              }}
              className="flex items-center justify-center gap-1 h-[36px] rounded-full shadow-sm"
              style={glassStyle}
            >
              <Icon className="w-[13px] h-[13px]" strokeWidth={1.5} />
              <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
