import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import { SmartSelector } from './listing/SmartSelector';
import { FormFieldLabel, FormSection } from './listing/FormSection';
import {
  buildMotoDescription,
  buildVehicleTitleFromChips,
  getModelsForBrand,
  MOTO_CONDITION,
  MOTO_CONDITION_DB,
  MOTO_FEATURES,
  MOTO_FUEL,
  MOTO_INCLUDED,
  MOTO_TRANSMISSION,
  MOTO_TYPE,
  MOTORCYCLE_BRANDS,
  MOTORCYCLE_MODELS,
  PROPERTY_ADJECTIVES,
} from '@/constants/listingTaxonomies';
import { DescriptionPreview } from './listing/DescriptionPreview';
import { PredictiveInput } from './listing/PredictiveInput';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';

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
  country?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  has_abs?: boolean;
  has_traction_control?: boolean;
  has_heated_grips?: boolean;
  has_esc?: boolean;
  has_luggage_rack?: boolean;
  includes_helmet?: boolean;
  includes_gear?: boolean;
  adjectives?: string[];
}

interface MotorcycleListingFormProps {
  onDataChange: (data: Partial<MotorcycleFormData>) => void;
  initialData?: Partial<MotorcycleFormData>;
}

const FEATURE_FIELDS: Record<string, keyof MotorcycleFormData> = {
  ABS: 'has_abs',
  ESC: 'has_esc',
  'Traction control': 'has_traction_control',
  'Heated grips': 'has_heated_grips',
  'Luggage rack': 'has_luggage_rack',
};

const INCLUDED_FIELDS: Record<string, keyof MotorcycleFormData> = {
  Helmet: 'includes_helmet',
  'Riding gear': 'includes_gear',
};

function featuresFromBooleans(data: Partial<MotorcycleFormData>): string[] {
  return MOTO_FEATURES.filter((f) => {
    const key = FEATURE_FIELDS[f];
    return key && !!data[key];
  }) as string[];
}

function includedFromBooleans(data: Partial<MotorcycleFormData>): string[] {
  return MOTO_INCLUDED.filter((f) => {
    const key = INCLUDED_FIELDS[f];
    return key && !!data[key];
  }) as string[];
}

export function MotorcycleListingForm({ onDataChange, initialData }: MotorcycleListingFormProps) {
  const { register, watch, setValue } = useForm<MotorcycleFormData>({
    defaultValues: {
      mode: 'rent',
      adjectives: [],
      ...initialData,
      condition: initialData?.condition
        ? (Object.entries(MOTO_CONDITION_DB).find(([, v]) => v === initialData.condition)?.[0] ?? initialData.condition)
        : undefined,
    },
  });

  const formSnapshot = watch();
  const features = featuresFromBooleans(formSnapshot);
  const included = includedFromBooleans(formSnapshot);
  const polishResetKey = JSON.stringify({
    adjectives: formSnapshot.adjectives,
    motorcycle_type: formSnapshot.motorcycle_type,
    condition: formSnapshot.condition,
    transmission: formSnapshot.transmission,
    fuel_type: formSnapshot.fuel_type,
    brand: formSnapshot.brand,
    model: formSnapshot.model,
    mileage: formSnapshot.mileage,
    engine_cc: formSnapshot.engine_cc,
    city: formSnapshot.city,
    features,
    included,
  });
  const { polishedDescription, setPolishedDescription } = usePolishedDescription(polishResetKey);

  useEffect(() => {
    const subscription = watch((value) => {
      const dbCondition = value.condition
        ? (MOTO_CONDITION_DB[value.condition] ?? value.condition.toLowerCase())
        : undefined;
      const autoTitle = buildVehicleTitleFromChips({
        adjective: value.adjectives?.[0],
        type: value.motorcycle_type,
        brand: value.brand,
        model: value.model,
        year: value.year,
        city: value.city,
      });
      const autoDescription = buildMotoDescription({
        adjectives: value.adjectives,
        motorcycleType: value.motorcycle_type,
        condition: value.condition,
        transmission: value.transmission ? MOTO_TRANSMISSION.find((t) => t.value === value.transmission)?.label : undefined,
        fuel: value.fuel_type ? MOTO_FUEL.find((f) => f.value === value.fuel_type)?.label : undefined,
        features: featuresFromBooleans(value),
        included: includedFromBooleans(value),
        mileage: value.mileage,
        engineCc: value.engine_cc,
        city: value.city,
      });
      onDataChange({
        ...value,
        condition: dbCondition,
        title: value.title || autoTitle,
        description: polishedDescription ?? (value.description?.trim() || autoDescription),
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, polishedDescription]);

  const adjectives = watch('adjectives') || [];
  const motoType = watch('motorcycle_type') ? [watch('motorcycle_type')!] : [];
  const condition = watch('condition') ? [watch('condition')!] : [];
  const transmission = watch('transmission') ? [watch('transmission')!] : [];
  const fuel = watch('fuel_type') ? [watch('fuel_type')!] : [];

  const syncFeatures = (selected: string[]) => {
    for (const [label, key] of Object.entries(FEATURE_FIELDS)) {
      setValue(key, selected.includes(label));
    }
  };

  const syncIncluded = (selected: string[]) => {
    for (const [label, key] of Object.entries(INCLUDED_FIELDS)) {
      setValue(key, selected.includes(label));
    }
  };

  return (
    <div className="space-y-5">
      <FormSection title="Describe Your Ride" accent="orange">
        <FormFieldLabel>Pick a vibe word</FormFieldLabel>
        <ChipMultiSelect
          accent="orange"
          single
          options={PROPERTY_ADJECTIVES}
          value={adjectives}
          onChange={(v) => setValue('adjectives', v)}
        />
        <SmartSelector
          label="Motorcycle Type"
          accent="orange"
          single
          options={[...MOTO_TYPE]}
          value={motoType}
          onChange={(v) => setValue('motorcycle_type', v[0] ?? '')}
        />
        <SmartSelector
          label="Condition"
          accent="orange"
          single
          options={[...MOTO_CONDITION]}
          value={condition}
          onChange={(v) => setValue('condition', v[0] ?? '')}
        />
      </FormSection>

      <FormSection title="Pricing" accent="orange">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Sale Price (USD)</FormFieldLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="8500" />
          </div>
          <div>
            <FormFieldLabel>Daily Rental (USD)</FormFieldLabel>
            <Input
              type="number"
              {...register('rental_rates.per_day', { valueAsNumber: true })}
              placeholder="45"
            />
          </div>
        </div>
      </FormSection>

      <div className="rounded-3xl shadow-md overflow-hidden bg-card border border-border">
        <OwnerLocationSelector
          country={watch('country')}
          city={watch('city')}
          neighborhood={watch('neighborhood')}
          latitude={(watch('latitude') as number | undefined) ?? undefined}
          longitude={(watch('longitude') as number | undefined) ?? undefined}
          onCountryChange={(c) => setValue('country', c)}
          onCityChange={(c) => setValue('city', c)}
          onNeighborhoodChange={(n) => setValue('neighborhood', n)}
          onCoordinatesChange={(lat, lng) => {
            setValue('latitude', lat);
            setValue('longitude', lng);
          }}
        />
      </div>

      <FormSection title="Specifications" accent="orange">
        <div>
          <FormFieldLabel>Listing Title (optional)</FormFieldLabel>
          <Input {...register('title')} placeholder="Auto-built from chips above" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <PredictiveInput
              label="Brand"
              value={watch('brand') || ''}
              onChange={(v) => setValue('brand', v)}
              suggestions={MOTORCYCLE_BRANDS}
              placeholder="Start typing: Yam…"
            />
          </div>
          <div>
            <PredictiveInput
              label="Model"
              value={watch('model') || ''}
              onChange={(v) => setValue('model', v)}
              suggestions={getModelsForBrand(watch('brand'), MOTORCYCLE_MODELS)}
              placeholder={watch('brand') ? 'Pick or type a model' : 'Select brand first'}
            />
          </div>
          <div>
            <FormFieldLabel>Year</FormFieldLabel>
            <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2021" />
          </div>
          <div>
            <FormFieldLabel>Mileage (km)</FormFieldLabel>
            <Input type="number" {...register('mileage', { valueAsNumber: true })} placeholder="12000" />
          </div>
          <div>
            <FormFieldLabel>Engine (cc)</FormFieldLabel>
            <Input type="number" {...register('engine_cc', { valueAsNumber: true })} placeholder="689" />
          </div>
        </div>
        <SmartSelector
          label="Transmission"
          accent="orange"
          single
          options={[...MOTO_TRANSMISSION]}
          value={transmission}
          onChange={(v) => setValue('transmission', v[0] ?? '')}
        />
        <SmartSelector
          label="Fuel Type"
          accent="orange"
          single
          options={[...MOTO_FUEL]}
          value={fuel}
          onChange={(v) => setValue('fuel_type', v[0] ?? '')}
        />
      </FormSection>

      <FormSection title="Features" accent="orange">
        <ChipMultiSelect
          accent="orange"
          options={[...MOTO_FEATURES]}
          value={features}
          onChange={syncFeatures}
        />
      </FormSection>

      <FormSection title="Included" accent="orange">
        <ChipMultiSelect
          accent="orange"
          options={[...MOTO_INCLUDED]}
          value={included}
          onChange={syncIncluded}
        />
      </FormSection>

      <DescriptionPreview
        accent="orange"
        title={buildVehicleTitleFromChips({
          adjective: adjectives[0],
          type: motoType[0],
          brand: watch('brand'),
          model: watch('model'),
          year: watch('year'),
          city: watch('city'),
        })}
        description={buildMotoDescription({
          adjectives,
          motorcycleType: motoType[0],
          condition: condition[0],
          transmission: transmission[0] ? MOTO_TRANSMISSION.find((t) => t.value === transmission[0])?.label : undefined,
          fuel: fuel[0] ? MOTO_FUEL.find((f) => f.value === fuel[0])?.label : undefined,
          features,
          included,
          mileage: watch('mileage'),
          engineCc: watch('engine_cc'),
          city: watch('city'),
        })}
        polishedDescription={polishedDescription}
        onPolished={setPolishedDescription}
      />
    </div>
  );
}