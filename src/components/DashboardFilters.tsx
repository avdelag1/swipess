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
      ? 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)' 
      : 'linear-gradient(145deg, rgba(15,15,20,0.6) 0%, rgba(15,15,20,0.3) 100%)',
    border: isLight ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: isLight
      ? '0 10px 30px rgba(0, 0, 0, 0.08), inset 0 2px 10px rgba(255,255,255,0.7)'
      : '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    color: isLight ? '#000' : '#fff',
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
