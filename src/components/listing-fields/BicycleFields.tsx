import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BicycleFieldsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

const BICYCLE_TYPES = ['Road', 'Mountain', 'Hybrid', 'Electric', 'Cruiser', 'Folding', 'BMX', 'Gravel', 'Touring'];
const FRAME_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FRAME_MATERIALS = ['Carbon Fiber', 'Aluminum', 'Steel', 'Titanium', 'Chromoly'];
const SUSPENSION_TYPES = ['Front', 'Full', 'Rigid'];
const BRAKE_TYPES = ['Disc', 'Rim', 'Hydraulic Disc', 'Mechanical Disc', 'V-Brake'];
const WHEEL_SIZES = ['20"', '24"', '26"', '27.5"', '29"', '700c', '650b'];

export function BicycleFields({ register, setValue, watch }: BicycleFieldsProps) {
  // Watch select field values
  const bicycleType = watch('bicycle_type');
  const frameSize = watch('frame_size');
  const frameMaterial = watch('frame_material');
  const wheelSize = watch('wheel_size');
  const suspensionType = watch('suspension_type');
  const brakeType = watch('brake_type');
  const vehicleCondition = watch('vehicle_condition');

  // Watch checkbox values
  const isElectricBike = watch('is_electric_bike');
  const includesLock = watch('includes_lock');
  const includesLights = watch('includes_lights');
  const includesBasket = watch('includes_basket');
  const includesPump = watch('includes_pump');

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Brand</Label>
              <Input
                {...register('vehicle_brand')}
                placeholder="e.g., Trek, Giant, Specialized"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Model</Label>
              <Input
                {...register('vehicle_model')}
                placeholder="e.g., FX 3"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Year</Label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                {...register('vehicle_year', { valueAsNumber: true })}
                placeholder="2023"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Color</Label>
              <Input
                {...register('vehicle_color')}
                placeholder="e.g., Blue"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Condition</Label>
              <Select value={vehicleCondition} onValueChange={(value) => setValue('vehicle_condition', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="new" className="text-foreground">New</SelectItem>
                  <SelectItem value="like_new" className="text-foreground">Like New</SelectItem>
                  <SelectItem value="excellent" className="text-foreground">Excellent</SelectItem>
                  <SelectItem value="good" className="text-foreground">Good</SelectItem>
                  <SelectItem value="fair" className="text-foreground">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Bicycle Type *</Label>
              <Select value={bicycleType} onValueChange={(value) => setValue('bicycle_type', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {BICYCLE_TYPES.map(type => (
                    <SelectItem key={type} value={type.toLowerCase()} className="text-foreground">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Frame Size</Label>
              <Select value={frameSize} onValueChange={(value) => setValue('frame_size', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {FRAME_SIZES.map(size => (
                    <SelectItem key={size} value={size} className="text-foreground">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Frame Material</Label>
              <Select value={frameMaterial} onValueChange={(value) => setValue('frame_material', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {FRAME_MATERIALS.map(material => (
                    <SelectItem key={material} value={material.toLowerCase().replace(' ', '_')} className="text-foreground">
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Number of Gears</Label>
              <Input
                type="number"
                min="1"
                max="30"
                {...register('number_of_gears', { valueAsNumber: true })}
                placeholder="21"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Wheel Size</Label>
              <Select value={wheelSize} onValueChange={(value) => setValue('wheel_size', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {WHEEL_SIZES.map(size => (
                    <SelectItem key={size} value={size} className="text-foreground">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Suspension Type</Label>
              <Select value={suspensionType} onValueChange={(value) => setValue('suspension_type', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SUSPENSION_TYPES.map(type => (
                    <SelectItem key={type} value={type.toLowerCase()} className="text-foreground">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Brake Type</Label>
              <Select value={brakeType} onValueChange={(value) => setValue('brake_type', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {BRAKE_TYPES.map(type => (
                    <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')} className="text-foreground">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Electric Bike & Accessories */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Electric & Accessories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_electric_bike"
              checked={isElectricBike}
              onCheckedChange={(checked) => setValue('is_electric_bike', checked)}
              className="border-border"
            />
            <Label htmlFor="is_electric_bike" className="text-foreground cursor-pointer">
              Electric Bike (E-Bike)
            </Label>
          </div>

          {isElectricBike && (
            <div className="space-y-2">
              <Label className="text-foreground">Battery Range (km)</Label>
              <Input
                type="number"
                min="0"
                {...register('battery_range', { valueAsNumber: true })}
                placeholder="50"
                className="bg-background border-border text-foreground"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includes_lock"
                checked={includesLock}
                onCheckedChange={(checked) => setValue('includes_lock', checked)}
                className="border-border"
              />
              <Label htmlFor="includes_lock" className="text-foreground cursor-pointer">
                Includes Lock
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includes_lights"
                checked={includesLights}
                onCheckedChange={(checked) => setValue('includes_lights', checked)}
                className="border-border"
              />
              <Label htmlFor="includes_lights" className="text-foreground cursor-pointer">
                Includes Lights
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includes_basket"
                checked={includesBasket}
                onCheckedChange={(checked) => setValue('includes_basket', checked)}
                className="border-border"
              />
              <Label htmlFor="includes_basket" className="text-foreground cursor-pointer">
                Includes Basket
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includes_pump"
                checked={includesPump}
                onCheckedChange={(checked) => setValue('includes_pump', checked)}
                className="border-border"
              />
              <Label htmlFor="includes_pump" className="text-foreground cursor-pointer">
                Includes Pump
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
