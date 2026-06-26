import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import { SmartSelector } from './listing/SmartSelector';
import { FormFieldLabel, FormSection } from './listing/FormSection';
import {
  buildYachtDescription,
  buildVehicleTitleFromChips,
  getModelsForBrand,
  YACHT_BRANDS,
  YACHT_CONDITION,
  YACHT_CONDITION_DB,
  YACHT_FEATURES,
  YACHT_FUEL,
  YACHT_INCLUDED,
  YACHT_MODELS,
  YACHT_TYPE,
  PROPERTY_ADJECTIVES,
} from '@/constants/listingTaxonomies';
import { DescriptionPreview } from './listing/DescriptionPreview';
import { PredictiveInput } from './listing/PredictiveInput';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';

export interface YachtFormData {
  id?: string;
  title?: string;
  description?: string;
  yacht_type?: string;
  mode?: 'sale' | 'rent' | 'both';
  price?: number;
  rental_rates?: {
    per_day?: number;
    per_week?: number;
  };
  brand?: string;
  model?: string;
  year?: number;
  length_m?: number;
  berths?: number;
  max_passengers?: number;
  hull_material?: string;
  engines?: string;
  fuel_type?: string;
  condition?: string;
  country?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  features?: string[];
  included?: string[];
  adjectives?: string[];
}

interface YachtListingFormProps {
  onDataChange: (data: Partial<YachtFormData>) => void;
  initialData?: Partial<YachtFormData>;
}

export function YachtListingForm({ onDataChange, initialData }: YachtListingFormProps) {
  const { register, watch, setValue } = useForm<YachtFormData>({
    defaultValues: {
      mode: 'rent',
      adjectives: [],
      features: [],
      included: [],
      ...initialData,
      condition: initialData?.condition
        ? (Object.entries(YACHT_CONDITION_DB).find(([, v]) => v === initialData.condition)?.[0] ?? initialData.condition)
        : undefined,
    },
  });

  const formSnapshot = watch();
  const features = formSnapshot.features || [];
  const included = formSnapshot.included || [];
  const polishResetKey = JSON.stringify({
    adjectives: formSnapshot.adjectives,
    yacht_type: formSnapshot.yacht_type,
    condition: formSnapshot.condition,
    fuel_type: formSnapshot.fuel_type,
    brand: formSnapshot.brand,
    model: formSnapshot.model,
    length_m: formSnapshot.length_m,
    berths: formSnapshot.berths,
    max_passengers: formSnapshot.max_passengers,
    city: formSnapshot.city,
    features,
    included,
  });
  const { polishedDescription, setPolishedDescription } = usePolishedDescription(polishResetKey);

  useEffect(() => {
    const subscription = watch((value) => {
      const dbCondition = value.condition
        ? (YACHT_CONDITION_DB[value.condition] ?? value.condition.toLowerCase())
        : undefined;
      const autoTitle = buildVehicleTitleFromChips({
        adjective: value.adjectives?.[0],
        type: value.yacht_type,
        brand: value.brand,
        model: value.model,
        year: value.year,
        city: value.city,
      });
      const autoDescription = buildYachtDescription({
        adjectives: value.adjectives as string[] | undefined,
        yachtType: value.yacht_type,
        condition: value.condition,
        fuel: value.fuel_type ? YACHT_FUEL.find((f) => f.value === value.fuel_type)?.label : undefined,
        lengthM: value.length_m,
        berths: value.berths,
        maxPassengers: value.max_passengers,
        features: value.features as string[] | undefined,
        included: value.included as string[] | undefined,
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
  const yachtType = watch('yacht_type') ? [watch('yacht_type')!] : [];
  const condition = watch('condition') ? [watch('condition')!] : [];
  const fuel = watch('fuel_type') ? [watch('fuel_type')!] : [];

  return (
    <div className="space-y-5">
      <FormSection title="Describe Your Vessel" accent="orange">
        <FormFieldLabel>Pick a vibe word</FormFieldLabel>
        <ChipMultiSelect
          accent="orange"
          single
          options={PROPERTY_ADJECTIVES}
          value={adjectives}
          onChange={(v) => setValue('adjectives', v)}
        />
        <SmartSelector
          label="Yacht Type"
          accent="orange"
          single
          options={[...YACHT_TYPE]}
          value={yachtType}
          onChange={(v) => setValue('yacht_type', v[0] ?? '')}
        />
        <SmartSelector
          label="Condition"
          accent="orange"
          single
          options={[...YACHT_CONDITION]}
          value={condition}
          onChange={(v) => setValue('condition', v[0] ?? '')}
        />
      </FormSection>

      <FormSection title="Pricing" accent="orange">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Sale Price (USD)</FormFieldLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="120000" />
          </div>
          <div>
            <FormFieldLabel>Daily Charter (USD)</FormFieldLabel>
            <Input
              type="number"
              {...register('rental_rates.per_day', { valueAsNumber: true })}
              placeholder="900"
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
              label="Builder / Brand"
              value={watch('brand') || ''}
              onChange={(v) => setValue('brand', v)}
              suggestions={YACHT_BRANDS}
              placeholder="Start typing: Ben…"
            />
          </div>
          <div>
            <PredictiveInput
              label="Model"
              value={watch('model') || ''}
              onChange={(v) => setValue('model', v)}
              suggestions={getModelsForBrand(watch('brand'), YACHT_MODELS)}
              placeholder={watch('brand') ? 'Pick or type a model' : 'Select brand first'}
            />
          </div>
          <div>
            <FormFieldLabel>Year</FormFieldLabel>
            <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2020" />
          </div>
          <div>
            <FormFieldLabel>Length (m)</FormFieldLabel>
            <Input type="number" step="0.1" {...register('length_m', { valueAsNumber: true })} placeholder="14.5" />
          </div>
          <div>
            <FormFieldLabel>Berths (sleeps)</FormFieldLabel>
            <Input type="number" {...register('berths', { valueAsNumber: true })} placeholder="6" />
          </div>
          <div>
            <FormFieldLabel>Max Passengers</FormFieldLabel>
            <Input type="number" {...register('max_passengers', { valueAsNumber: true })} placeholder="12" />
          </div>
          <div>
            <FormFieldLabel>Hull Material</FormFieldLabel>
            <Input {...register('hull_material')} placeholder="Fiberglass, aluminum…" />
          </div>
          <div>
            <FormFieldLabel>Engines</FormFieldLabel>
            <Input {...register('engines')} placeholder="2× 320HP Volvo" />
          </div>
        </div>
        <SmartSelector
          label="Fuel / Power"
          accent="orange"
          single
          options={[...YACHT_FUEL]}
          value={fuel}
          onChange={(v) => setValue('fuel_type', v[0] ?? '')}
        />
      </FormSection>

      <FormSection title="Features" accent="orange">
        <ChipMultiSelect
          accent="orange"
          options={[...YACHT_FEATURES]}
          value={features}
          onChange={(v) => setValue('features', v)}
        />
      </FormSection>

      <FormSection title="Included" accent="orange">
        <ChipMultiSelect
          accent="orange"
          options={[...YACHT_INCLUDED]}
          value={included}
          onChange={(v) => setValue('included', v)}
        />
      </FormSection>

      <DescriptionPreview
        accent="orange"
        title={buildVehicleTitleFromChips({
          adjective: adjectives[0],
          type: yachtType[0],
          brand: watch('brand'),
          model: watch('model'),
          year: watch('year'),
          city: watch('city'),
        })}
        description={buildYachtDescription({
          adjectives,
          yachtType: yachtType[0],
          condition: condition[0],
          fuel: fuel[0] ? YACHT_FUEL.find((f) => f.value === fuel[0])?.label : undefined,
          lengthM: watch('length_m'),
          berths: watch('berths'),
          maxPassengers: watch('max_passengers'),
          features,
          included,
          city: watch('city'),
        })}
        polishedDescription={polishedDescription}
        onPolished={setPolishedDescription}
      />
    </div>
  );
}
