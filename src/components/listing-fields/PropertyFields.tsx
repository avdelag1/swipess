import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PropertyFieldsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

const PROPERTY_SUBTYPES = ['Apartment', 'House', 'Studio', 'Condo', 'Villa', 'Loft', 'Penthouse', 'Townhouse'];
const VIEW_TYPES = ['Ocean', 'City', 'Garden', 'Mountain', 'Street', 'Pool', 'None'];
const ORIENTATIONS = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];

export function PropertyFields({ register, setValue, watch }: PropertyFieldsProps) {
  // Watch checkbox values
  const isFurnished = watch('is_furnished');
  const hasPetFriendly = watch('is_pet_friendly');
  const hasBalcony = watch('has_balcony');
  const hasParking = watch('has_parking');
  const hasElevator = watch('has_elevator');
  const hasSecurity = watch('has_security');

  // Watch select field values
  const propertySubtype = watch('property_subtype');
  const viewType = watch('view_type');
  const orientation = watch('orientation');

  return (
    <div className="space-y-6">
      {/* Size and Layout */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Size & Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Bedrooms *</Label>
              <Input
                type="number"
                min="0"
                {...register('bedrooms', { required: true, valueAsNumber: true })}
                placeholder="2"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Bathrooms *</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                {...register('bathrooms', { required: true, valueAsNumber: true })}
                placeholder="2.5"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Square Feet</Label>
              <Input
                type="number"
                min="0"
                {...register('square_feet', { valueAsNumber: true })}
                placeholder="1200"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Property Subtype *</Label>
              <Select value={propertySubtype} onValueChange={(value) => setValue('property_subtype', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {PROPERTY_SUBTYPES.map(type => (
                    <SelectItem key={type} value={type.toLowerCase()} className="text-foreground">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Floor Number</Label>
              <Input
                type="number"
                min="0"
                {...register('floor_number', { valueAsNumber: true })}
                placeholder="5"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Total Floors in Building</Label>
              <Input
                type="number"
                min="0"
                {...register('total_floors', { valueAsNumber: true })}
                placeholder="10"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_furnished"
                checked={isFurnished}
                onCheckedChange={(checked) => setValue('is_furnished', checked)}
                className="border-border"
              />
              <Label htmlFor="is_furnished" className="text-foreground cursor-pointer">
                Furnished
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_balcony"
                checked={hasBalcony}
                onCheckedChange={(checked) => setValue('has_balcony', checked)}
                className="border-border"
              />
              <Label htmlFor="has_balcony" className="text-foreground cursor-pointer">
                Has Balcony
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_parking"
                checked={hasParking}
                onCheckedChange={(checked) => setValue('has_parking', checked)}
                className="border-border"
              />
              <Label htmlFor="has_parking" className="text-foreground cursor-pointer">
                Parking Available
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_pet_friendly"
                checked={hasPetFriendly}
                onCheckedChange={(checked) => setValue('is_pet_friendly', checked)}
                className="border-border"
              />
              <Label htmlFor="is_pet_friendly" className="text-foreground cursor-pointer">
                Pet Friendly
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_elevator"
                checked={hasElevator}
                onCheckedChange={(checked) => setValue('has_elevator', checked)}
                className="border-border"
              />
              <Label htmlFor="has_elevator" className="text-foreground cursor-pointer">
                Elevator
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_security"
                checked={hasSecurity}
                onCheckedChange={(checked) => setValue('has_security', checked)}
                className="border-border"
              />
              <Label htmlFor="has_security" className="text-foreground cursor-pointer">
                24/7 Security
              </Label>
            </div>
          </div>

          {hasParking && (
            <div className="space-y-2">
              <Label className="text-foreground">Number of Parking Spots</Label>
              <Input
                type="number"
                min="0"
                {...register('parking_spots', { valueAsNumber: true })}
                placeholder="1"
                className="bg-background border-border text-foreground"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Views and Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Views & Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">View Type</Label>
              <Select value={viewType} onValueChange={(value) => setValue('view_type', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {VIEW_TYPES.map(view => (
                    <SelectItem key={view} value={view.toLowerCase()} className="text-foreground">
                      {view}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Orientation</Label>
              <Select value={orientation} onValueChange={(value) => setValue('orientation', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {ORIENTATIONS.map(orient => (
                    <SelectItem key={orient} value={orient.toLowerCase()} className="text-foreground">
                      {orient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Year Built</Label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                {...register('year_built', { valueAsNumber: true })}
                placeholder="2020"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Last Renovated</Label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                {...register('last_renovated', { valueAsNumber: true })}
                placeholder="2023"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
