import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AITextarea } from '@/components/ui/AITextarea';
import { Checkbox } from '@/components/ui/checkbox';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import { SmartSelector } from './listing/SmartSelector';
import { FormFieldLabel, FormSection } from './listing/FormSection';
import {
  BATHROOM_COUNTS,
  BEDROOM_COUNTS,
  buildPropertyDescription,
  buildTitleFromChips,
  chipsFromString,
  MEXICO_STATES,
  PROPERTY_ADJECTIVES,
  PROPERTY_FEATURES,
  PROPERTY_INCLUDED,
  PROPERTY_RULES,
  PROPERTY_SIZE,
  PROPERTY_TYPES,
  PROPERTY_VIBE,
  RENTAL_DURATIONS,
} from '@/constants/listingTaxonomies';
import { DescriptionPreview } from './listing/DescriptionPreview';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';

interface PropertyFormData {
  title?: string;
  description?: string;
  price?: number;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
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
  adjectives?: string[];
  size?: string[];
}

const _propertyFormSchema = z.object({
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
  adjectives: z.array(z.string()).optional(),
  size: z.array(z.string()).optional(),
});

interface PropertyListingFormProps {
  onDataChange: (data: Partial<PropertyFormData>) => void;
  initialData?: Partial<PropertyFormData>;
}

const CheckboxRow = ({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-3 p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-colors cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-lg border-2 border-foreground/40" />
    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground/80">{label}</Label>
  </div>
);

function normalizeInitialData(raw: any): Partial<PropertyFormData> {
  if (!raw || typeof raw !== 'object') return {};
  const num = (v: any) => {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    title: typeof raw.title === 'string' ? raw.title : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    price: num(raw.price),
    country: raw.country ?? undefined,
    state: raw.state ?? undefined,
    city: raw.city ?? undefined,
    neighborhood: raw.neighborhood ?? undefined,
    address: raw.address ?? undefined,
    latitude: num(raw.latitude) ?? undefined,
    longitude: num(raw.longitude) ?? undefined,
    property_type: raw.property_type ?? undefined,
    beds: num(raw.beds),
    baths: num(raw.baths),
    square_footage: num(raw.square_footage),
    furnished: !!raw.furnished,
    pet_friendly: !!raw.pet_friendly,
    amenities: chipsFromString(raw.amenities).filter((v): v is string => !!v),
    services_included: chipsFromString(raw.services_included).filter((v): v is string => !!v),
    rental_duration_type: raw.rental_duration_type ?? undefined,
    house_rules: chipsFromString(raw.house_rules).filter((v): v is string => !!v),
    vibe: chipsFromString(raw.vibe).filter((v): v is string => !!v),
    adjectives: chipsFromString(raw.adjectives).filter((v): v is string => !!v),
    size: chipsFromString(raw.size).filter((v): v is string => !!v),
  };
}

export function PropertyListingForm({ onDataChange, initialData = {} }: PropertyListingFormProps) {
  const safeInitialData = normalizeInitialData(initialData);

  const { register, watch, setValue } = useForm<PropertyFormData>({
    defaultValues: {
      adjectives: [],
      size: [],
      amenities: [],
      services_included: [],
      house_rules: [],
      vibe: [],
      furnished: false,
      pet_friendly: false,
      ...safeInitialData,
    },
  });

  const snapshot = watch();
  const polishResetKey = JSON.stringify({
    adjectives: snapshot.adjectives,
    size: snapshot.size,
    vibe: snapshot.vibe,
    amenities: snapshot.amenities,
    services_included: snapshot.services_included,
    house_rules: snapshot.house_rules,
    property_type: snapshot.property_type,
    beds: snapshot.beds,
    baths: snapshot.baths,
    city: snapshot.city,
    neighborhood: snapshot.neighborhood,
    furnished: snapshot.furnished,
    pet_friendly: snapshot.pet_friendly,
  });
  const { polishedDescription, setPolishedDescription } = usePolishedDescription(polishResetKey);

  useEffect(() => {
    const subscription = watch((value) => {
      const autoTitle = buildTitleFromChips({
        adjective: value.adjectives?.[0],
        size: value.size?.[0],
        beds: value.beds as any,
        propertyType: value.property_type,
        city: value.city,
      });
      const autoDescription = buildPropertyDescription({
        adjectives: value.adjectives,
        size: value.size,
        vibe: value.vibe,
        amenities: value.amenities,
        servicesIncluded: value.services_included,
        houseRules: value.house_rules,
        city: value.city,
        neighborhood: value.neighborhood,
        beds: value.beds ?? null,
        baths: value.baths ?? null,
        furnished: value.furnished,
        petFriendly: value.pet_friendly,
      });
      onDataChange({
        ...value,
        title: value.title || autoTitle,
        description: polishedDescription ?? (value.description?.trim() || autoDescription),
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, polishedDescription]);

  const adjectives = watch('adjectives') || [];
  const size = watch('size') || [];
  const beds = watch('beds');
  const baths = watch('baths');
  const propertyType = watch('property_type');
  const city = watch('city') || '';
  const state = watch('state') || '';
  const neighborhood = watch('neighborhood') || '';
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const vibe = watch('vibe') || [];
  const amenities = watch('amenities') || [];
  const servicesIncluded = watch('services_included') || [];
  const houseRules = watch('house_rules') || [];
  const rentalDuration = watch('rental_duration_type') ? [watch('rental_duration_type')!] : [];

  const setArr = (
    field: 'amenities' | 'services_included' | 'house_rules' | 'vibe' | 'adjectives' | 'size',
    next: string[],
  ) => {
    setValue(field, next);
  };

  const titleValue = watch('title') ?? '';
  const descValue = watch('description') ?? '';
  const autoTitle = buildTitleFromChips({
    adjective: adjectives?.[0],
    size: size?.[0],
    beds: beds as any,
    propertyType: propertyType,
    city: city,
  });

  return (
    <div className="space-y-5">
      <FormSection title="Your Listing" accent="rose">
        <FormFieldLabel>Title</FormFieldLabel>
        <Input
          {...register('title')}
          placeholder={autoTitle || 'e.g. Bright 2-bedroom loft in Tulum…'}
          className="h-12 text-base"
        />
        <p className="text-[10px] text-muted-foreground/50 -mt-1 ml-1">Leave blank to auto-generate from your chips below.</p>

        <FormFieldLabel className="mt-3">Description override (optional)</FormFieldLabel>
        <AITextarea
          value={descValue}
          onChange={(v) => setValue('description', v)}
          enhanceType="listing"
          placeholder="Optional — chips below build a description automatically."
          maxLength={800}
          rows={4}
        />
      </FormSection>

      <FormSection title="Describe Your Place" accent="rose">
        <FormFieldLabel>Pick a vibe word</FormFieldLabel>
        <ChipMultiSelect
          accent="rose"
          single
          options={PROPERTY_ADJECTIVES}
          value={adjectives}
          onChange={(v) => setArr('adjectives', v)}
        />
        <FormFieldLabel>Size</FormFieldLabel>
        <ChipMultiSelect
          accent="rose"
          single
          options={PROPERTY_SIZE}
          value={size}
          onChange={(v) => setArr('size', v)}
        />
      </FormSection>

      <FormSection title="Pricing" accent="rose">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Price ($/month)</FormFieldLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="2500" />
          </div>
          <div>
            <SmartSelector
              label="Minimum Stay"
              accent="rose"
              single
              options={[...RENTAL_DURATIONS]}
              value={rentalDuration}
              onChange={(v) => setValue('rental_duration_type', v[0] ?? '')}
            />
          </div>
        </div>
      </FormSection>

      <OwnerLocationSelector
        accent="emerald"
        country={watch('country')}
        onCountryChange={(c) => setValue('country', c)}
        city={city}
        onCityChange={(nextCity) => setValue('city', nextCity)}
        neighborhood={neighborhood}
        onNeighborhoodChange={(nextNeighborhood) => setValue('neighborhood', nextNeighborhood)}
        latitude={latitude ?? undefined}
        longitude={longitude ?? undefined}
        onCoordinatesChange={(lat, lng) => {
          setValue('latitude', lat);
          setValue('longitude', lng);
        }}
      />

      <FormSection title="State / Region" accent="rose">
        <SmartSelector
          label="State (Mexico)"
          accent="rose"
          single
          forceSheet
          options={[...MEXICO_STATES]}
          value={state ? [state] : []}
          onChange={(v) => setValue('state', v[0] ?? '')}
          placeholder="Search state…"
          searchPlaceholder="Quintana Roo, Jalisco…"
        />
      </FormSection>

      <FormSection title="Property Details" accent="rose">
        <SmartSelector
          label="Property Type"
          accent="rose"
          single
          forceSheet
          options={[...PROPERTY_TYPES]}
          value={propertyType ? [propertyType] : []}
          onChange={(v) => setValue('property_type', v[0] ?? '')}
          placeholder="Search type…"
          searchPlaceholder="Apartment, penthouse, studio…"
        />

        <FormFieldLabel>Bedrooms</FormFieldLabel>
        <ChipMultiSelect
          accent="rose"
          single
          options={BEDROOM_COUNTS}
          value={
            beds === undefined || beds === null
              ? []
              : [String(beds) === '0' ? 'Studio' : String(beds)]
          }
          onChange={(v) => {
            const pick = v[0];
            if (!pick) return setValue('beds', undefined as any);
            if (pick === 'Studio') return setValue('beds', 0);
            if (pick === '6+') return setValue('beds', 6);
            setValue('beds', Number(pick));
          }}
        />

        <FormFieldLabel>Bathrooms</FormFieldLabel>
        <ChipMultiSelect
          accent="rose"
          single
          options={BATHROOM_COUNTS}
          value={
            baths === undefined || baths === null
              ? []
              : [String(baths)]
          }
          onChange={(v) => {
            const pick = v[0];
            if (!pick) return setValue('baths', undefined as any);
            if (pick === '4+') return setValue('baths', 4);
            setValue('baths', Number(pick));
          }}
        />

        <div>
          <FormFieldLabel>Sq. Ft. (optional)</FormFieldLabel>
          <Input type="number" {...register('square_footage', { valueAsNumber: true })} placeholder="1200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CheckboxRow id="furnished" checked={!!watch('furnished')} onCheckedChange={(v) => setValue('furnished', v)} label="Furnished" />
          <CheckboxRow id="pet_friendly" checked={!!watch('pet_friendly')} onCheckedChange={(v) => setValue('pet_friendly', v)} label="Pet Friendly" />
        </div>
      </FormSection>

      <FormSection title="Vibe" accent="rose">
        <ChipMultiSelect accent="rose" options={PROPERTY_VIBE} value={vibe} onChange={(v) => setArr('vibe', v)} />
      </FormSection>

      <FormSection title="Amenities" accent="rose">
        <SmartSelector
          accent="rose"
          options={[...PROPERTY_FEATURES]}
          value={amenities}
          onChange={(v) => setArr('amenities', v)}
          searchPlaceholder="Pool, WiFi, ocean view…"
        />
      </FormSection>

      <FormSection title="Services Included" accent="rose">
        <ChipMultiSelect accent="rose" options={PROPERTY_INCLUDED} value={servicesIncluded} onChange={(v) => setArr('services_included', v)} />
      </FormSection>

      <FormSection title="House Rules" accent="rose">
        <ChipMultiSelect accent="rose" options={PROPERTY_RULES} value={houseRules} onChange={(v) => setArr('house_rules', v)} />
      </FormSection>

      <DescriptionPreview
        accent="rose"
        title={titleValue || autoTitle}
        description={descValue || buildPropertyDescription({
          adjectives,
          size,
          vibe,
          amenities,
          servicesIncluded,
          houseRules,
          city,
          neighborhood,
          beds: beds ?? null,
          baths: baths ?? null,
          furnished: watch('furnished'),
          petFriendly: watch('pet_friendly'),
        })}
        polishedDescription={polishedDescription}
        onPolished={setPolishedDescription}
      />
    </div>
  );
}