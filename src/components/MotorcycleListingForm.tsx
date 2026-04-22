import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MotorcycleFormData {
  id?: string;
  title?: string;
  description?: string;
  motorcycle_type?: string;
  mode?: 'sale' | 'rent' | 'both';
  price?: number;
  rental_rates?: {
    per_day?: number;
    per_week?: number;
  };
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  engine_cc?: number;
  transmission?: string;
  fuel_type?: string;
  condition?: string;
  city?: string;
  has_abs?: boolean;
  has_traction_control?: boolean;
  has_heated_grips?: boolean;
  has_esc?: boolean;
  has_luggage_rack?: boolean;
  includes_helmet?: boolean;
  includes_gear?: boolean;
}

interface MotorcycleListingFormProps {
  onDataChange: (data: Partial<MotorcycleFormData>) => void;
  initialData?: Partial<MotorcycleFormData>;
}

const MOTORCYCLE_TYPES = ['Sport Bike', 'Cruiser', 'Touring', 'Adventure', 'Dual-Sport', 'Dirt Bike', 'Standard', 'Cafe Racer', 'Chopper', 'Scooter', 'Electric', 'Other'];
const TRANSMISSIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'semi-automatic', label: 'Semi-Auto' },
];
const FUEL_TYPES = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];
const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs Work' },
];

// Premium section wrapper
const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-xl overflow-hidden", className)}>
    <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full bg-orange-500" />
      <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-5 pb-5 space-y-4">{children}</div>
  </div>
);

const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-semibold text-foreground/80 mb-1.5 block">{children}</Label>
);

const CheckboxRow = ({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-lg" />
    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground/80">{label}</Label>
  </div>
);

export function MotorcycleListingForm({ onDataChange, initialData }: MotorcycleListingFormProps) {
  const { register, control, watch } = useForm<MotorcycleFormData>({
    defaultValues: initialData || { mode: 'rent' }
  });

  const formData = watch();

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  return (
    <div className="space-y-5">
      <Section title="Basic Information">
        <div>
          <FormLabel>Listing Title</FormLabel>
          <Input id="title" {...register('title')} placeholder="e.g., 2021 Yamaha MT-07" />
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <Textarea id="description" {...register('description')} placeholder="Describe the motorcycle, its condition, and what's included..." rows={3} />
        </div>
        <div>
          <FormLabel>Motorcycle Type</FormLabel>
          <Controller
            name="motorcycle_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {MOTORCYCLE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <FormLabel>Location / City</FormLabel>
          <Input id="city" {...register('city')} placeholder="e.g., Tulum, Playa del Carmen" />
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Brand</FormLabel>
            <Input {...register('brand')} placeholder="Yamaha, Honda, KTM..." />
          </div>
          <div>
            <FormLabel>Model</FormLabel>
            <Input {...register('model')} placeholder="MT-07" />
          </div>
          <div>
            <FormLabel>Year</FormLabel>
            <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2021" />
          </div>
          <div>
            <FormLabel>Mileage (km)</FormLabel>
            <Input type="number" {...register('mileage', { valueAsNumber: true })} placeholder="e.g., 12,000" />
          </div>
          <div>
            <FormLabel>Engine (cc)</FormLabel>
            <Input type="number" {...register('engine_cc', { valueAsNumber: true })} placeholder="689" />
          </div>
          <div>
            <FormLabel>Transmission</FormLabel>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger>
                  <SelectContent>
                    {TRANSMISSIONS.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <FormLabel>Fuel Type</FormLabel>
            <Controller
              name="fuel_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <FormLabel>Condition</FormLabel>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(cond => <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </Section>

      <Section title="Features">
        <div className="grid grid-cols-2 gap-2">
          <Controller name="has_abs" control={control} render={({ field }) => (
            <CheckboxRow id="has_abs" checked={!!field.value} onCheckedChange={field.onChange} label="ABS" />
          )} />
          <Controller name="has_traction_control" control={control} render={({ field }) => (
            <CheckboxRow id="has_traction_control" checked={!!field.value} onCheckedChange={field.onChange} label="Traction Control" />
          )} />
          <Controller name="has_esc" control={control} render={({ field }) => (
            <CheckboxRow id="has_esc" checked={!!field.value} onCheckedChange={field.onChange} label="Electronic Stability" />
          )} />
          <Controller name="has_heated_grips" control={control} render={({ field }) => (
            <CheckboxRow id="has_heated_grips" checked={!!field.value} onCheckedChange={field.onChange} label="Heated Grips" />
          )} />
          <Controller name="has_luggage_rack" control={control} render={({ field }) => (
            <CheckboxRow id="has_luggage_rack" checked={!!field.value} onCheckedChange={field.onChange} label="Luggage Rack" />
          )} />
          <Controller name="includes_helmet" control={control} render={({ field }) => (
            <CheckboxRow id="includes_helmet" checked={!!field.value} onCheckedChange={field.onChange} label="Helmet Included" />
          )} />
          <Controller name="includes_gear" control={control} render={({ field }) => (
            <CheckboxRow id="includes_gear" checked={!!field.value} onCheckedChange={field.onChange} label="Riding Gear Included" />
          )} />
        </div>
      </Section>
    </div>
  );
}


