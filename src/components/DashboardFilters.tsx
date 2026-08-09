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
      <div className="grid grid-cols-3 gap-2 w-full">
        {filters.map((filter, index) => {
          const Icon = filter.icon;
          return (
            <motion.button
              key={filter.id}
              type="button"
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
                'flex items-center justify-center gap-1.5 h-[40px] rounded-full px-1',
                isLight ? 'neo-naive-pill' : 'neo-naive-pill--dark',
              )}
              style={{
                color: isLight ? '#111' : '#fff',
                // Inline belt-and-suspenders so theme remaps can’t wash out the ink frame
                border: isLight
                  ? '2.5px solid #141414'
                  : '2.5px solid rgba(255,255,255,0.95)',
                background: isLight
                  ? 'rgba(255,255,255,0.98)'
                  : 'rgba(14,14,20,0.96)',
                boxShadow: isLight
                  ? '1.5px 1.5px 0 #141414, 0 4px 12px rgba(20,20,20,0.07)'
                  : '1.5px 1.5px 0 rgba(255,255,255,0.45), 0 0 16px rgba(255,255,255,0.14)',
              }}
            >
              <span className={cn('neo-naive-wash', WASH_BY_ID[filter.id])}>
                <Icon className="w-[14px] h-[14px]" strokeWidth={2.35} />
              </span>
              <span className="text-[12px] font-bold tracking-tight whitespace-nowrap">{filter.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
