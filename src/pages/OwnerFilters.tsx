// OwnerFilters page stub for route prefetcher compatibility
import { useState } from 'react';
import { NewOwnerFilters } from '@/components/filters/NewOwnerFilters';

export default function OwnerFilters() {
  const [open, setOpen] = useState(true);

  return (
    <NewOwnerFilters
      open={open}
      onClose={() => setOpen(false)}
      onApply={() => {}}
    />
  );
}
