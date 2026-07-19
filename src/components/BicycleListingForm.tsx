import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import { SmartSelector } from './listing/SmartSelector';
import { FormFieldLabel, FormSection } from './listing/FormSection';
import { AITextarea } from '@/components/ui/AITextarea';
import {
  BICYCLE_BRANDS,
  BICYCLE_MODELS,
  BIKE_BRAKE_TYPE,
  BIKE_CONDITION,
  BIKE_CONDITION_DB,
  BIKE_FRAME_MATERIAL,
  BIKE_FRAME_SIZE,
  BIKE_INCLUDED,
  BIKE_SUSPENSION,
  BIKE_TYPE,
  BIKE_WHEEL_SIZE,
  buildBikeDescription,
  buildVehicleTitleFromChips,
  getModelsForBrand,
  PROPERTY_ADJECTIVES,
} from '@/constants/listingTaxonomies';
import { DescriptionPreview } from './listing/DescriptionPreview';
import { PredictiveInput } from './listing/PredictiveInput';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';

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
  country?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  includes_helmet?: boolean;
  includes_lock?: boolean;
  includes_lights?: boolean;
  includes_basket?: boolean;
  includes_pump?: boolean;
  suspension_type?: string;
  adjectives?: string[];
}

interface BicycleListingFormProps {
  onDataChange: (data: Partial<BicycleFormData>) => void;
  initialData?: Partial<BicycleFormData>;
}

const INCLUDED_FIELDS: Record<string, keyof BicycleFormData> = {
  Helmet: 'includes_helmet',
  Lock: 'includes_lock',
  Lights: 'includes_lights',
  Basket: 'includes_basket',
  Pump: 'includes_pump',
};

function includedFromBooleans(data: Partial<BicycleFormData>): string[] {
  return BIKE_INCLUDED.filter((f) => {
    const key = INCLUDED_FIELDS[f];
    return key && !!data[key];
  }) as string[];
}

export function BicycleListingForm({ onDataChange, initialData }: BicycleListingFormProps) {
  const { register, watch, setValue } = useForm<BicycleFormData>({
    defaultValues: {
      mode: 'rent',
      electric_assist: false,
      adjectives: [],
      ...initialData,
      condition: initialData?.condition
        ? (Object.entries(BIKE_CONDITION_DB).find(([, v]) => v === initialData.condition)?.[0] ?? initialData.condition)
        : undefined,
      bicycle_type: initialData?.bicycle_type
        ? (BIKE_TYPE.find((t) => t.toLowerCase() === initialData.bicycle_type) ?? initialData.bicycle_type)
        : undefined,
    },
  });

  const formSnapshot = watch();
  const included = includedFromBooleans(formSnapshot);
  const polishResetKey = JSON.stringify({
    adjectives: formSnapshot.adjectives,
    bicycle_type: formSnapshot.bicycle_type,
    condition: formSnapshot.condition,
    frame_size: formSnapshot.frame_size,
    frame_material: formSnapshot.frame_material,
    wheel_size: formSnapshot.wheel_size,
    brand: formSnapshot.brand,
    model: formSnapshot.model,
    electric_assist: formSnapshot.electric_assist,
    battery_range: formSnapshot.battery_range,
    city: formSnapshot.city,
    included,
  });
  const { polishedDescription, setPolishedDescription } = usePolishedDescription(polishResetKey);

  useEffect(() => {
    const subscription = watch((value) => {
      const dbCondition = value.condition
        ? (BIKE_CONDITION_DB[value.condition] ?? value.condition.toLowerCase())
        : undefined;
      const autoTitle = buildVehicleTitleFromChips({
        adjective: value.adjectives?.[0],
        type: value.bicycle_type,
        brand: value.brand,
        model: value.model,
        year: value.year,
        city: value.city,
      });
      const autoDescription = buildBikeDescription({
        adjectives: value.adjectives,
        bicycleType: value.bicycle_type,
        condition: value.condition,
        frameSize: value.frame_size,
        frameMaterial: value.frame_material,
        wheelSize: value.wheel_size,
        electric: value.electric_assist,
        batteryRange: value.battery_range,
        included: includedFromBooleans(value),
        city: value.city,
      });
      onDataChange({
        ...value,
        condition: dbCondition,
        bicycle_type: value.bicycle_type?.toLowerCase(),
        title: value.title || autoTitle,
        description: polishedDescription ?? (value.description?.trim() || autoDescription),
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, polishedDescription]);

  const adjectives = watch('adjectives') || [];
  const bikeType = watch('bicycle_type') ? [watch('bicycle_type')!] : [];
  const condition = watch('condition') ? [watch('condition')!] : [];
  const frameSize = watch('frame_size') ? [watch('frame_size')!] : [];
  const frameMaterial = watch('frame_material') ? [watch('frame_material')!] : [];
  const wheelSize = watch('wheel_size') ? [watch('wheel_size')!] : [];
  const brakeType = watch('brake_type') ? [watch('brake_type')!] : [];
  const suspension = watch('suspension_type') ? [watch('suspension_type')!] : [];
  const isElectric = watch('electric_assist');
  const descValue = watch('description') || '';

  const syncIncluded = (selected: string[]) => {
    for (const [label, key] of Object.entries(INCLUDED_FIELDS)) {
      setValue(key, selected.includes(label));
    }
  };

  return (
    <div className="space-y-5">
      <FormSection title="Listing Title & AI Description" accent="purple">
        <FormFieldLabel>Title</FormFieldLabel>
        <Input
          {...register('title')}
          placeholder={buildVehicleTitleFromChips({
            adjective: watch('adjectives')?.[0],
            type: watch('bicycle_type'),
            brand: watch('brand'),
            model: watch('model'),
            year: watch('year'),
            city: watch('city'),
          }) || 'e.g. 2023 Specialized Tarmac in Paris…'}
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

      <FormSection title="Describe Your Bike" accent="purple">
        <FormFieldLabel>Pick a vibe word</FormFieldLabel>
        <ChipMultiSelect
          accent="purple"
          single
          options={PROPERTY_ADJECTIVES}
          value={adjectives}
          onChange={(v) => setValue('adjectives', v)}
        />
        <SmartSelector
          label="Bicycle Type"
          accent="purple"
          single
          options={[...BIKE_TYPE]}
          value={bikeType}
          onChange={(v) => setValue('bicycle_type', v[0] ?? '')}
        />
        <SmartSelector
          label="Condition"
          accent="purple"
          single
          options={[...BIKE_CONDITION]}
          value={condition}
          onChange={(v) => setValue('condition', v[0] ?? '')}
        />
      </FormSection>

      <FormSection title="Pricing" accent="purple">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Sale Price (USD)</FormFieldLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="1200" />
          </div>
          <div>
            <FormFieldLabel>Daily Rental (USD)</FormFieldLabel>
            <Input
              type="number"
              {...register('rental_rates.per_day', { valueAsNumber: true })}
              placeholder="15"
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

      <FormSection title="Specifications" accent="purple">
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
              suggestions={BICYCLE_BRANDS}
              placeholder="Start typing: Spec…"
            />
          </div>
          <div>
            <PredictiveInput
              label="Model"
              value={watch('model') || ''}
              onChange={(v) => setValue('model', v)}
              suggestions={getModelsForBrand(watch('brand'), BICYCLE_MODELS)}
              placeholder={watch('brand') ? 'Pick or type a model' : 'Select brand first'}
            />
          </div>
          <div>
            <FormFieldLabel>Year</FormFieldLabel>
            <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2022" />
          </div>
          <div>
            <FormFieldLabel>Number of Gears</FormFieldLabel>
            <Input type="number" {...register('number_of_gears', { valueAsNumber: true })} placeholder="21" />
          </div>
        </div>
        <SmartSelector label="Frame Size" accent="purple" single options={[...BIKE_FRAME_SIZE]} value={frameSize} onChange={(v) => setValue('frame_size', v[0] ?? '')} />
        <SmartSelector label="Frame Material" accent="purple" single options={[...BIKE_FRAME_MATERIAL]} value={frameMaterial} onChange={(v) => setValue('frame_material', v[0] ?? '')} />
        <SmartSelector label="Wheel Size" accent="purple" single options={[...BIKE_WHEEL_SIZE]} value={wheelSize} onChange={(v) => setValue('wheel_size', v[0] ?? '')} />
        <SmartSelector label="Brake Type" accent="purple" single options={[...BIKE_BRAKE_TYPE]} value={brakeType} onChange={(v) => setValue('brake_type', v[0] ?? '')} />
        <SmartSelector label="Suspension" accent="purple" single options={[...BIKE_SUSPENSION]} value={suspension} onChange={(v) => setValue('suspension_type', v[0] ?? '')} />
      </FormSection>

      <FormSection title="Electric" accent="purple">
        <ChipMultiSelect
          accent="purple"
          single
          options={['Electric assist (E-Bike)']}
          value={isElectric ? ['Electric assist (E-Bike)'] : []}
          onChange={(v) => setValue('electric_assist', v.includes('Electric assist (E-Bike)'))}
        />
        {isElectric && (
          <div>
            <FormFieldLabel>Battery Range (km)</FormFieldLabel>
            <Input type="number" {...register('battery_range', { valueAsNumber: true })} placeholder="80" />
          </div>
        )}
      </FormSection>

      <FormSection title="Included Accessories" accent="purple">
        <ChipMultiSelect accent="purple" options={[...BIKE_INCLUDED]} value={included} onChange={syncIncluded} />
      </FormSection>

      <DescriptionPreview
        accent="purple"
        title={buildVehicleTitleFromChips({
          adjective: adjectives[0],
          type: bikeType[0],
          brand: watch('brand'),
          model: watch('model'),
          year: watch('year'),
          city: watch('city'),
        })}
        description={buildBikeDescription({
          adjectives,
          bicycleType: bikeType[0],
          condition: condition[0],
          frameSize: frameSize[0],
          frameMaterial: frameMaterial[0],
          wheelSize: wheelSize[0],
          electric: isElectric,
          batteryRange: watch('battery_range'),
          included,
          city: watch('city'),
        })}
        polishedDescription={polishedDescription}
        onPolished={setPolishedDescription}
      />
    </div>
  );
}