import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { useModalStore } from '@/state/modalStore';

interface DashboardFiltersProps {
  isLight: boolean;
}

const WASH_BY_ID: Record<string, string> = {
  location: 'neo-naive-wash--coral',
  date: 'neo-naive-wash--sky',
  guests: 'neo-naive-wash--lemon',
};

export function DashboardFilters({ isLight }: DashboardFiltersProps) {
  const filters = [
    { id: 'location', label: 'Tulum, Mexico', icon: MapPin },
    { id: 'date', label: 'Any date', icon: Calendar },
    { id: 'guests', label: '2 guests', icon: Users },
  ];

  const setModal = useModalStore(state => state.setModal);
  const openPassportMap = useModalStore(state => state.openPassportMap);

  // Light = neo-naïve ink pills; dark keeps liquid glass
  const glassStyle = isLight
    ? { color: '#111' }
    : {
        background: 'linear-gradient(145deg, rgba(28,28,36,0.55) 0%, rgba(16,16,22,0.35) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderTop: '1px solid rgba(255, 255, 255, 0.20)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        color: '#fff',
      };

  return (
    <div className={cn('w-full', isLight && 'neo-naive')}>
      <div className="grid grid-cols-3 gap-1.5 w-full">
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
              className={cn(
                'flex items-center justify-center gap-1 h-[34px] rounded-full',
                isLight ? 'neo-naive-pill' : 'shadow-sm',
              )}
              style={glassStyle}
            >
              {isLight ? (
                <span className={cn('neo-naive-wash', WASH_BY_ID[filter.id])}>
                  <Icon className="w-[13px] h-[13px]" strokeWidth={2.1} />
                </span>
              ) : (
                <Icon className="w-[13px] h-[13px]" strokeWidth={1.5} />
              )}
              <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
