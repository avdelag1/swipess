import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface AvailabilityCalendarProps {
  availableFrom?: Date | null;
  availableTo?: Date | null;
  onDateChange: (from: Date | null, to: Date | null) => void;
  mode?: 'owner' | 'filter';
}

export function AvailabilityCalendar({ availableFrom, availableTo, onDateChange, mode = 'owner' }: AvailabilityCalendarProps) {
  const [range, setRange] = useState<DateRange | undefined>(
    availableFrom ? { from: availableFrom, to: availableTo || undefined } : undefined
  );

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onDateChange(newRange?.from || null, newRange?.to || null);
  };

  const clearDates = () => {
    setRange(undefined);
    onDateChange(null, null);
  };

  const label = mode === 'owner' ? 'Set Availability' : 'Move-in Date';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn(
            'w-full justify-start text-left font-normal gap-2',
            !range?.from && 'text-muted-foreground'
          )}>
            <CalendarIcon className="w-4 h-4" />
            {range?.from ? (
              range.to ? (
                `${format(range.from, 'MMM d')} — ${format(range.to, 'MMM d, yyyy')}`
              ) : format(range.from, 'MMM d, yyyy')
            ) : (
              <span>Select dates</span>
            )}
            {range?.from && (
              <X className="w-3.5 h-3.5 ml-auto text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); clearDates(); }} />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={(date) => date < new Date()}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {mode === 'filter' && range?.from && (
        <p className="text-xs text-muted-foreground">Showing listings available during this period</p>
      )}
    </div>
  );
}

