import { memo } from 'react';
import type { QuickFilterCategory } from '@/types/filters';
import BentoCategoryGrid from './BentoCategoryGrid';

export interface SwipeAllDashboardProps {
  setCategories: (category: QuickFilterCategory) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  return <BentoCategoryGrid setCategories={setCategories} />;
});

SwipeAllDashboard.displayName = 'SwipeAllDashboard';

export default SwipeAllDashboard;


