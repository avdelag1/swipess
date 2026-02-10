import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface BicycleFormData {
  id?: string;
  title?: string;
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
  motor_power?: string;
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

const BICYCLE_TYPES = ['Road Bike', 'Mountain Bike', 'Hybrid', 'City/Commuter', 'Electric (E-Bike)', 'Cruiser', 'BMX', 'Folding', 'Cargo', 'Gravel', 'Other'];
const FRAME_SIZES = ['XS (< 5\'2")', 'S (5\'2" - 5\'6")', 'M (5\'6" - 5\'10")', 'L (5\'10" - 6\'2")', 'XL (> 6\'2")'];
const FRAME_MATERIALS = ['Aluminum', 'Carbon Fiber', 'Steel', 'Titanium', 'Chromoly'];
const WHEEL_SIZES = ['20"', '24"', '26"', '27.5"', '29"', '700c'];
const BRAKE_TYPES = ['Disc (Hydraulic)', 'Disc (Mechanical)', 'Rim Brakes', 'Coaster Brake'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Needs Work'];
const SUSPENSION_TYPES = ['None (Rigid)', 'Front Only (Hardtail)', 'Full Suspension'];

export function BicycleListingForm({ onDataChange, initialData }: BicycleListingFormProps) {
  const { register, control, watch } = useForm<BicycleFormData>({
    defaultValues: initialData || { mode: 'rent', electric_assist: false }
  });

  const formData = watch();
  const isElectric = watch('electric_assist');

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Listing Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., 2022 Specialized Turbo Levo"
            />
          </div>

          <div>
            <Label htmlFor="bicycle_type">Bicycle Type</Label>
            <Controller
              name="bicycle_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="bicycle_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BICYCLE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="city">Location / City</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="e.g., Tulum, Playa del Carmen"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bicycle Specifications (Optional)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} placeholder="Specialized, Trek, Giant..." />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" {...register('model')} placeholder="Turbo Levo" />
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" {...register('year', { valueAsNumber: true })} placeholder="2022" />
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

          <div>
            <Label htmlFor="frame_size">Frame Size</Label>
            <Controller
              name="frame_size"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="frame_size"><SelectValue placeholder="Select frame size" /></SelectTrigger>
                  <SelectContent>
                    {FRAME_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="frame_material">Frame Material</Label>
            <Controller
              name="frame_material"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="frame_material"><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {FRAME_MATERIALS.map(mat => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="wheel_size">Wheel Size</Label>
            <Controller
              name="wheel_size"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="wheel_size"><SelectValue placeholder="Select wheel size" /></SelectTrigger>
                  <SelectContent>
                    {WHEEL_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="brake_type">Brake Type</Label>
            <Controller
              name="brake_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="brake_type"><SelectValue placeholder="Select brake type" /></SelectTrigger>
                  <SelectContent>
                    {BRAKE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="number_of_gears">Number of Gears</Label>
            <Input id="number_of_gears" type="number" {...register('number_of_gears', { valueAsNumber: true })} placeholder="21" />
          </div>

          <div>
            <Label htmlFor="suspension_type">Suspension</Label>
            <Controller
              name="suspension_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="suspension_type"><SelectValue placeholder="Select suspension" /></SelectTrigger>
                  <SelectContent>
                    {SUSPENSION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Electric Features (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller name="electric_assist" control={control} render={({ field }) => <Checkbox id="electric_assist" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="electric_assist">Electric Assist (E-Bike)</Label>
          </div>

          {isElectric && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="battery_range">Battery Range (km)</Label>
                <Input id="battery_range" type="number" {...register('battery_range', { valueAsNumber: true })} placeholder="80" />
              </div>
              <div>
                <Label htmlFor="motor_power">Motor Power</Label>
                <Input id="motor_power" {...register('motor_power')} placeholder="250W, 500W, etc." />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Included Accessories (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2">
            <Controller name="includes_helmet" control={control} render={({ field }) => <Checkbox id="includes_helmet" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_helmet">Helmet Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_lock" control={control} render={({ field }) => <Checkbox id="includes_lock" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_lock">Lock Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_lights" control={control} render={({ field }) => <Checkbox id="includes_lights" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_lights">Lights Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_basket" control={control} render={({ field }) => <Checkbox id="includes_basket" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_basket">Basket/Rack Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="includes_pump" control={control} render={({ field }) => <Checkbox id="includes_pump" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="includes_pump">Pump Included</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
