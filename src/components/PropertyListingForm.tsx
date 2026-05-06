import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import {
  PROPERTY_VIBE,
  PROPERTY_FEATURES,
  PROPERTY_INCLUDED,
  PROPERTY_RULES,
} from '@/constants/listingTaxonomies';
import { cn } from '@/lib/utils';

interface PropertyFormData {
  title?: string;
  description?: string;
  price?: number;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  property_type?: string;
  beds?: number;
  baths?: number;
  square_footage?: number;
  furnished?: boolean;
  pet_friendly?: boolean;
  amenities?: string[];
  services_included?: string[];
  rental_duration_type?: string;
  house_rules?: string[];
  vibe?: string[];
}

const propertyFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional().nullable().transform(v => v ?? undefined),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  property_type: z.string().optional(),
  beds: z.number().optional().nullable().transform(v => v ?? undefined),
  baths: z.number().optional().nullable().transform(v => v ?? undefined),
  square_footage: z.number().optional().nullable().transform(v => v ?? undefined),
  furnished: z.boolean().optional(),
  pet_friendly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  services_included: z.array(z.string()).optional(),
  rental_duration_type: z.string().optional(),
  house_rules: z.array(z.string()).optional(),
  vibe: z.array(z.string()).optional(),
});

interface PropertyListingFormProps {
  onDataChange: (data: Partial<PropertyFormData>) => void;
  initialData?: Partial<PropertyFormData>;
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'room', label: 'Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'commercial', label: 'Commercial' },
];
const RENTAL_DURATIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
const STATES = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Mexico City', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico State', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

// Premium section wrapper
const Section = ({ title, accent = 'emerald', children, className }: { title: string; accent?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl bg-card border border-border shadow-md overflow-hidden", className)}>
    <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
      <div className={cn("w-2 h-2 rounded-full", accent === 'emerald' ? 'bg-rose-500' : 'bg-primary')} />
      <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-5 pb-5 space-y-4">{children}</div>
  </div>
);

const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-semibold text-foreground/80 mb-1.5 block">{children}</Label>
);

const CheckboxRow = ({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-3 p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-colors cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-lg border-2 border-foreground/40" />
    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground/80">{label}</Label>
  </div>
);

export function PropertyListingForm({ onDataChange, initialData = {} }: PropertyListingFormProps) {
  const parsedResult = propertyFormSchema.safeParse(initialData);
  const safeInitialData = parsedResult.success ? parsedResult.data : {};

  const { register, control, watch, setValue } = useForm<PropertyFormData>({
    defaultValues: {
      amenities: [],
      services_included: [],
      house_rules: [],
      vibe: [],
      furnished: false,
      pet_friendly: false,
      ...safeInitialData
    },
  });

  const formData = watch();

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const setArr = (field: 'amenities' | 'services_included' | 'house_rules' | 'vibe', next: string[]) => {
    setValue(field, next);
  };

  return (
    <div className="space-y-5">
      <Section title="Basic Information" accent="emerald">
        <div>
          <FormLabel>Title</FormLabel>
          <Input {...register('title')} placeholder="Beautiful 2BR Apartment" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Price ($/month)</FormLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="2500" />
          </div>
          <div>
            <FormLabel>Minimum Stay</FormLabel>
            <Controller
              name="rental_duration_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    {RENTAL_DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div>
          <FormLabel>Address</FormLabel>
          <Input {...register('address')} placeholder="123 Main Street" />
        </div>
      </Section>

      <Section title="Location" accent="emerald">
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <OwnerLocationSelector
              country={field.value}
              onCountryChange={field.onChange}
              city={watch('city')}
              onCityChange={(city) => setValue('city', city)}
              neighborhood={watch('neighborhood')}
              onNeighborhoodChange={(neighborhood) => setValue('neighborhood', neighborhood)}
            />
          )}
        />
        <div>
          <FormLabel>State</FormLabel>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Section>

      <Section title="Property Details" accent="emerald">
        <div>
          <FormLabel>Property Type</FormLabel>
          <Controller
            name="property_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <FormLabel>Bedrooms</FormLabel>
            <Input type="number" {...register('beds', { valueAsNumber: true, min: 0 })} placeholder="2" />
          </div>
          <div>
            <FormLabel>Bathrooms</FormLabel>
            <Input type="number" step="0.5" {...register('baths', { valueAsNumber: true, min: 0 })} placeholder="2" />
          </div>
          <div>
            <FormLabel>Sq. Ft.</FormLabel>
            <Input type="number" {...register('square_footage', { valueAsNumber: true })} placeholder="1200" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller name="furnished" control={control} render={({ field }) => (
            <CheckboxRow id="furnished" checked={!!field.value} onCheckedChange={field.onChange} label="Furnished" />
          )} />
          <Controller name="pet_friendly" control={control} render={({ field }) => (
            <CheckboxRow id="pet_friendly" checked={!!field.value} onCheckedChange={field.onChange} label="Pet Friendly" />
          )} />
        </div>
      </Section>

      <Section title="Vibe" accent="emerald">
        <ChipMultiSelect accent="rose" options={PROPERTY_VIBE} value={watch('vibe') || []} onChange={(v) => setArr('vibe', v)} />
      </Section>

      <Section title="Amenities" accent="emerald">
        <ChipMultiSelect accent="rose" options={PROPERTY_FEATURES} value={watch('amenities') || []} onChange={(v) => setArr('amenities', v)} />
      </Section>

      <Section title="Services Included" accent="emerald">
        <ChipMultiSelect accent="rose" options={PROPERTY_INCLUDED} value={watch('services_included') || []} onChange={(v) => setArr('services_included', v)} />
      </Section>

      <Section title="House Rules" accent="emerald">
        <ChipMultiSelect accent="rose" options={PROPERTY_RULES} value={watch('house_rules') || []} onChange={(v) => setArr('house_rules', v)} />
      </Section>
    </div>
  );
}


