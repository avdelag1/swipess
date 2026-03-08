import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

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
  has_esc?: boolean;
  has_traction_control?: boolean;
  has_heated_grips?: boolean;
  has_luggage_rack?: boolean;
  includes_helmet?: boolean;
  includes_gear?: boolean;
}

interface MotorcycleListingFormProps {
  onDataChange: (data: Partial<MotorcycleFormData>) => void;
  initialData?: Partial<MotorcycleFormData>;
}

const MOTORCYCLE_TYPES = ['Sport Bike', 'Cruiser', 'Touring', 'Adventure', 'Dual-Sport', 'Dirt Bike', 'Standard', 'Cafe Racer', 'Chopper', 'Scooter', 'Electric', 'Other'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Auto'];
const FUEL_TYPES = ['Gasoline', 'Electric', 'Hybrid'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Needs Work'];

export function MotorcycleListingForm({ onDataChange, initialData }: MotorcycleListingFormProps) {
  const { register, control, watch } = useForm<MotorcycleFormData>({
    defaultValues: initialData || { mode: 'rent' }
  });

  const formData = watch();

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Listing Title</Label>
            <Input id="title" {...register('title')} placeholder="e.g., 2021 Yamaha MT-07" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the motorcycle's condition, history, and any notable features..."
              className="min-h-[100px] mt-1 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="motorcycle_type">Motorcycle Type</Label>
            <Controller
              name="motorcycle_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="motorcycle_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {MOTORCYCLE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="city">Location / City</Label>
            <Input id="city" {...register('city')} placeholder="e.g., Tulum, Playa del Carmen" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Motorcycle Specifications</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} placeholder="Yamaha, Honda, KTM..." />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" {...register('model')} placeholder="MT-07" />
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" {...register('year', { valueAsNumber: true })} placeholder="2021" />
          </div>

          <div>
            <Label htmlFor="mileage">Mileage (km)</Label>
            <Input id="mileage" type="number" {...register('mileage', { valueAsNumber: true })} placeholder="e.g., 12,000" />
          </div>

          <div>
            <Label htmlFor="engine_cc">Engine (cc)</Label>
            <Input id="engine_cc" type="number" {...register('engine_cc', { valueAsNumber: true })} placeholder="689" />
          </div>

          <div>
            <Label htmlFor="transmission">Transmission</Label>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="transmission"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                  <SelectContent>
                    {TRANSMISSIONS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Controller
              name="fuel_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="fuel_type"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(cond => <SelectItem key={cond} value={cond}>{cond}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features & Included</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Controller name="has_abs" control={control} render={({ field }) => <Checkbox id="has_abs" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="has_abs">ABS (Anti-lock Brakes)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="has_esc" control={control} render={({ field }) => <Checkbox id="has_esc" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="has_esc">ESC (Electronic Stability)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="has_traction_control" control={control} render={({ field }) => <Checkbox id="has_traction_control" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="has_traction_control">Traction Control</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="has_heated_grips" control={control} render={({ field }) => <Checkbox id="has_heated_grips" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="has_heated_grips">Heated Grips</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="has_luggage_rack" control={control} render={({ field }) => <Checkbox id="has_luggage_rack" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="has_luggage_rack">Luggage Rack</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_helmet" control={control} render={({ field }) => <Checkbox id="includes_helmet" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_helmet">Helmet Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_gear" control={control} render={({ field }) => <Checkbox id="includes_gear" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_gear">Riding Gear Included</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
