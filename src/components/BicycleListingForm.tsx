import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface BicycleFormData {
  id?: string;
  title?: string;
  description?: string;
  mode?: 'sale' | 'rent' | 'both';
  price?: number;
  rental_rates?: {
    per_hour?: number;
    per_day?: number;
    per_week?: number;
  };
  bicycle_type?: string;
  brand?: string;
  model?: string;
  year?: number;
  frame_size?: string;
  frame_material?: string;
  wheel_size?: string;
  brake_type?: string;
  number_of_gears?: number;
  electric_assist?: boolean;
  battery_range?: number;
  condition?: string;
  city?: string;
  neighborhood?: string;
  includes_helmet?: boolean;
  includes_lock?: boolean;
  includes_lights?: boolean;
  includes_basket?: boolean;
  includes_pump?: boolean;
  suspension_type?: string;
}

interface BicycleListingFormProps {
  onDataChange: (data: Partial<BicycleFormData>) => void;
  initialData?: Partial<BicycleFormData>;
}

const BICYCLE_TYPES = [
  { value: 'road', label: 'Road Bike' },
  { value: 'mountain', label: 'Mountain Bike' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric (E-Bike)' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'bmx', label: 'BMX' },
];
const FRAME_SIZES = ['XS (< 5\'2")', 'S (5\'2" - 5\'6")', 'M (5\'6" - 5\'10")', 'L (5\'10" - 6\'2")', 'XL (> 6\'2")'];
const FRAME_MATERIALS = ['Aluminum', 'Carbon Fiber', 'Steel', 'Titanium', 'Chromoly'];
const WHEEL_SIZES = ['20"', '24"', '26"', '27.5"', '29"', '700c'];
const BRAKE_TYPES = [
  { value: 'hydraulic', label: 'Disc (Hydraulic)' },
  { value: 'disc', label: 'Disc (Mechanical)' },
  { value: 'rim', label: 'Rim Brakes' },
  { value: 'v-brake', label: 'V-Brake' },
];
const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs Work' },
];
const SUSPENSION_TYPES = [
  { value: 'none', label: 'None (Rigid)' },
  { value: 'front', label: 'Front Only (Hardtail)' },
  { value: 'full', label: 'Full Suspension' },
  { value: 'rear', label: 'Rear Suspension' },
];

const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-xl overflow-hidden", className)}>
    <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full bg-purple-500" />
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

export function BicycleListingForm({ onDataChange, initialData }: BicycleListingFormProps) {
  const { register, control, watch, setValue } = useForm<BicycleFormData>({
    defaultValues: initialData || { mode: 'rent', electric_assist: false }
  });

  const formData = watch();
  const isElectric = watch('electric_assist');

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleElectricToggle = (v: boolean) => {
    setValue('electric_assist', v);
  };

  return (
    <div className="space-y-5">
      <Section title="Basic Information">
        <div>
          <FormLabel>Listing Title</FormLabel>
          <Input {...register('title')} placeholder="e.g., 2022 Specialized Turbo Levo" />
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <Textarea {...register('description')} placeholder="Describe the bicycle, its condition, accessories, and riding experience..." rows={3} />
        </div>
        <div>
          <FormLabel>Bicycle Type</FormLabel>
          <Controller
            name="bicycle_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BICYCLE_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <FormLabel>Location / City</FormLabel>
          <Input {...register('city')} placeholder="e.g., Tulum, Playa del Carmen" />
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Brand</FormLabel>
            <Input {...register('brand')} placeholder="Specialized, Trek, Giant..." />
          </div>
          <div>
            <FormLabel>Model</FormLabel>
            <Input {...register('model')} placeholder="Turbo Levo" />
          </div>
          <div>
            <FormLabel>Year</FormLabel>
            <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2022" />
          </div>
          <div>
            <FormLabel>Condition</FormLabel>
            <Controller name="condition" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <FormLabel>Frame Size</FormLabel>
            <Controller name="frame_size" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select frame size" /></SelectTrigger>
                <SelectContent>{FRAME_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <FormLabel>Frame Material</FormLabel>
            <Controller name="frame_material" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>{FRAME_MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <FormLabel>Wheel Size</FormLabel>
            <Controller name="wheel_size" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select wheel size" /></SelectTrigger>
                <SelectContent>{WHEEL_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <FormLabel>Brake Type</FormLabel>
            <Controller name="brake_type" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select brake type" /></SelectTrigger>
                <SelectContent>{BRAKE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <FormLabel>Number of Gears</FormLabel>
            <Input type="number" {...register('number_of_gears', { valueAsNumber: true })} placeholder="21" />
          </div>
          <div>
            <FormLabel>Suspension</FormLabel>
            <Controller name="suspension_type" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select suspension" /></SelectTrigger>
                <SelectContent>{SUSPENSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </Section>

      <Section title="Electric Features">
        <CheckboxRow
          id="electric_assist"
          checked={!!isElectric}
          onCheckedChange={handleElectricToggle}
          label="Electric Assist (E-Bike)"
        />
        {isElectric && (
          <div>
            <FormLabel>Battery Range (km)</FormLabel>
            <Input type="number" {...register('battery_range', { valueAsNumber: true })} placeholder="80" />
          </div>
        )}
      </Section>

      <Section title="Included Accessories">
        <div className="grid grid-cols-2 gap-2">
          <Controller name="includes_helmet" control={control} render={({ field }) => (
            <CheckboxRow id="includes_helmet" checked={!!field.value} onCheckedChange={field.onChange} label="Helmet" />
          )} />
          <Controller name="includes_lock" control={control} render={({ field }) => (
            <CheckboxRow id="includes_lock" checked={!!field.value} onCheckedChange={field.onChange} label="Lock" />
          )} />
          <Controller name="includes_lights" control={control} render={({ field }) => (
            <CheckboxRow id="includes_lights" checked={!!field.value} onCheckedChange={field.onChange} label="Lights" />
          )} />
          <Controller name="includes_basket" control={control} render={({ field }) => (
            <CheckboxRow id="includes_basket" checked={!!field.value} onCheckedChange={field.onChange} label="Basket/Rack" />
          )} />
          <Controller name="includes_pump" control={control} render={({ field }) => (
            <CheckboxRow id="includes_pump" checked={!!field.value} onCheckedChange={field.onChange} label="Pump" />
          )} />
        </div>
      </Section>
    </div>
  );
}


