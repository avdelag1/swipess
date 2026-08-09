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

  return (
    <div className={cn('w-full neo-naive', !isLight && 'neo-naive--dark')}>
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
                isLight ? 'neo-naive-pill' : 'neo-naive-pill--dark',
              )}
              style={{ color: isLight ? '#111' : '#fff' }}
            >
              <span className={cn('neo-naive-wash', WASH_BY_ID[filter.id])}>
                <Icon className="w-[13px] h-[13px]" strokeWidth={2.1} />
              </span>
              <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
