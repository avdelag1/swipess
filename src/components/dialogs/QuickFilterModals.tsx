import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Users, Plus, Minus } from 'lucide-react';
import { haptics } from '@/utils/microPolish';

export function DatesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const handleApply = () => {
    haptics.notification('success');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl border-border/10 p-6 rounded-[2rem] shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">When are you going?</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center mb-6">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            className="rounded-xl border border-border/5 bg-black/5 dark:bg-white/5 p-3"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 rounded-full" onClick={() => { haptics.tap(); setRange(undefined); }}>Clear</Button>
          <Button 
            className="flex-1 rounded-full bg-gradient-to-r from-[#FF3366] to-[#FF4D00] text-white shadow-lg border-0" 
            onClick={handleApply}
          >
            Apply Dates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GuestsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [guests, setGuests] = useState(2);

  const handleApply = () => {
    haptics.notification('success');
    onClose();
  };

  const updateGuests = (delta: number) => {
    haptics.tap();
    setGuests(prev => Math.max(1, Math.min(16, prev + delta)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl border-border/10 p-6 rounded-[2rem] shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-bold tracking-tight">Who's coming?</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-6 px-4 mb-6 bg-black/5 dark:bg-white/5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <Users className="w-6 h-6 opacity-70" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">Guests</span>
              <span className="text-sm opacity-60">Ages 13 or above</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => updateGuests(-1)}
              disabled={guests <= 1}
              className="w-10 h-10 rounded-full border border-border/10 flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-bold w-4 text-center">{guests}</span>
            <button 
              onClick={() => updateGuests(1)}
              className="w-10 h-10 rounded-full border border-border/10 flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Button 
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#FF3366] to-[#FF4D00] text-white shadow-lg border-0 text-lg font-bold" 
          onClick={handleApply}
        >
          Confirm Guests
        </Button>
      </DialogContent>
    </Dialog>
  );
}
