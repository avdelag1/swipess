import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OwnerLocationSelector } from './location/OwnerLocationSelector';
import { ChipMultiSelect } from './listing/ChipMultiSelect';
import { SmartSelector } from './listing/SmartSelector';
import { FormFieldLabel, FormSection } from './listing/FormSection';
import { cn } from '@/lib/utils';
import { getGroupedCategories, SERVICE_GROUPS, SERVICE_SUBSPECIALTIES } from '@/data/serviceCategories';
import {
  buildWorkerDescription,
  buildWorkerTitle,
  LANGUAGES as LANGUAGE_OPTIONS,
  WORKER_AVAILABILITY,
  WORKER_TRAITS,
} from '@/constants/listingTaxonomies';
import { DescriptionPreview } from './listing/DescriptionPreview';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';

export { SERVICE_CATEGORIES } from '@/data/serviceCategories';

export const PRICING_UNITS = [
  { value: 'hourly', label: 'Per Hour' },
  { value: 'daily', label: 'Per Day' },
  { value: 'weekly', label: 'Per Week' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'project', label: 'Project-Based' },
] as const;

export type PricingUnit = typeof PRICING_UNITS[number]['value'];

export const WORK_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
] as const;

export const SCHEDULE_TYPES = [
  { value: 'fixed_hours', label: 'Fixed Hours' },
  { value: 'flexible', label: 'Flexible Schedule' },
  { value: 'on_call', label: 'On-call' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'rotating_shifts', label: 'Rotating Shifts' },
  { value: 'weekends_only', label: 'Weekends Only' },
] as const;

export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
] as const;

export const LOCATION_TYPES = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'travel_required', label: 'Travel Required' },
  { value: 'own_location', label: 'At My Location' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Entry Level (0-2 yrs)' },
  { value: 'intermediate', label: 'Mid Level (2-5 yrs)' },
  { value: 'expert', label: 'Senior (5-10 yrs)' },
  { value: 'master', label: 'Expert (10+ yrs)' },
] as const;

export type ServiceCategory = string;

export interface WorkerFormData {
  title?: string;
  description?: string;
  service_category?: ServiceCategory | '';
  custom_service_name?: string;
  price?: number | '';
  pricing_unit?: PricingUnit;
  work_type?: string[];
  schedule_type?: string[];
  days_available?: string[];
  time_slots_available?: string[];
  location_type?: string[];
  experience_level?: string;
  experience_years?: number | '';
  skills?: string[];
  certifications?: string[];
  tools_equipment?: string[];
  service_radius_km?: number;
  minimum_booking_hours?: number;
  offers_emergency_service?: boolean;
  background_check_verified?: boolean;
  insurance_verified?: boolean;
  languages?: string[];
  country?: string;
  city?: string;
  neighborhood?: string;
  traits?: string[];
}

interface WorkerListingFormProps {
  onDataChange: (data: Partial<WorkerFormData>) => void;
  initialData?: Partial<WorkerFormData>;
}

const CheckboxRow = ({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-3 p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-colors cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-lg border-2 border-foreground/40" />
    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground/80">{label}</Label>
  </div>
);

export function WorkerListingForm({ onDataChange, initialData = {} }: WorkerListingFormProps) {
  const { register, watch, setValue, getValues } = useForm<WorkerFormData>({
    defaultValues: {
      ...initialData,
      work_type: initialData.work_type || [],
      schedule_type: initialData.schedule_type || [],
      days_available: initialData.days_available || [],
      time_slots_available: initialData.time_slots_available || [],
      location_type: initialData.location_type || [],
      skills: initialData.skills || [],
      languages: initialData.languages || [],
      traits: initialData.traits || [],
      price: initialData.price || '',
      experience_years: initialData.experience_years || '',
    },
  });

  const snapshot = watch();
  const polishResetKey = JSON.stringify({
    service_category: snapshot.service_category,
    custom_service_name: snapshot.custom_service_name,
    title: snapshot.title,
    traits: snapshot.traits,
    work_type: snapshot.work_type,
    time_slots_available: snapshot.time_slots_available,
    languages: snapshot.languages,
    experience_level: snapshot.experience_level,
    price: snapshot.price,
    pricing_unit: snapshot.pricing_unit,
    city: snapshot.city,
  });
  const { polishedDescription, setPolishedDescription } = usePolishedDescription(polishResetKey);

  useEffect(() => {
    const subscription = watch((value) => {
      const autoTitle = buildWorkerTitle({
        serviceCategory: value.service_category,
        customServiceName: value.custom_service_name,
        traits: value.traits,
        experienceLevel: value.experience_level,
        city: value.city,
      });
      const autoDescription = buildWorkerDescription({
        serviceCategory: value.service_category,
        customServiceName: value.custom_service_name,
        title: value.title || autoTitle,
        traits: value.traits,
        workType: value.work_type,
        timeSlots: value.time_slots_available,
        languages: value.languages,
        experienceLevel: value.experience_level,
        price: value.price,
        pricingUnit: value.pricing_unit,
        city: value.city,
      });
      onDataChange({
        ...value,
        title: value.title || autoTitle,
        description: polishedDescription ?? (value.description?.trim() || autoDescription),
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, polishedDescription]);

  const serviceGroups = useMemo(() => {
    const grouped = getGroupedCategories();
    return SERVICE_GROUPS.map((group) => ({
      label: group,
      options: grouped[group].map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` })),
    }));
  }, []);

  const watchedServiceCategory = watch('service_category');
  const subspecialties = watchedServiceCategory ? SERVICE_SUBSPECIALTIES[watchedServiceCategory] : undefined;

  const toggleArrayField = (field: keyof WorkerFormData, value: string) => {
    const current = (getValues(field) as string[]) || [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setValue(field, updated);
  };

  const serviceCategory = watchedServiceCategory ? [watchedServiceCategory] : [];
  const pricingUnit = watch('pricing_unit') ? [watch('pricing_unit')!] : [];
  const experienceLevel = watch('experience_level') ? [watch('experience_level')!] : [];
  const workType = watch('work_type') || [];
  const scheduleType = watch('schedule_type') || [];
  const daysAvailable = watch('days_available') || [];
  const timeSlots = watch('time_slots_available') || [];
  const locationType = watch('location_type') || [];
  const watchedSkills = watch('skills') || [];
  const watchedLanguages = watch('languages') || [];
  const traits = watch('traits') || [];

  return (
    <div className="space-y-5">
      <FormSection title="Service Details" accent="amber">
        <SmartSelector
          label="Service Category"
          accent="amber"
          single
          forceSheet
          groups={serviceGroups}
          value={serviceCategory}
          onChange={(v) => setValue('service_category', v[0] ?? '')}
          placeholder="Search professions…"
          searchPlaceholder="Electrician, plumber, yoga…"
        />

        {watchedServiceCategory === 'other' && (
          <div>
            <FormFieldLabel>Custom Service Name</FormFieldLabel>
            <Input {...register('custom_service_name')} placeholder="e.g., Personal Stylist" />
          </div>
        )}

        {subspecialties && subspecialties.length > 0 && (
          <ChipMultiSelect
            label="Specialties"
            accent="amber"
            options={subspecialties}
            value={watchedSkills.filter((s) => subspecialties.includes(s))}
            onChange={(selected) => {
              const other = watchedSkills.filter((s) => !subspecialties.includes(s));
              setValue('skills', [...other, ...selected]);
            }}
          />
        )}

        <div>
          <FormFieldLabel>Service Title</FormFieldLabel>
          <Input
            {...register('title')}
            placeholder={buildWorkerTitle({
              serviceCategory: watchedServiceCategory,
              customServiceName: watch('custom_service_name'),
              traits,
              experienceLevel: experienceLevel[0],
              city: watch('city'),
            }) || 'e.g., Experienced Yoga Instructor'}
          />
        </div>
      </FormSection>

      <div className="rounded-3xl shadow-md overflow-hidden bg-card border border-border">
        <OwnerLocationSelector
          country={watch('country')}
          city={watch('city')}
          neighborhood={watch('neighborhood')}
          onCountryChange={(c) => setValue('country', c)}
          onCityChange={(c) => setValue('city', c)}
          onNeighborhoodChange={(n) => setValue('neighborhood', n)}
        />
      </div>

      <FormSection title="Pricing" accent="amber">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Price (USD)</FormFieldLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="25" />
          </div>
          <div>
            <SmartSelector
              label="Pricing Unit"
              accent="amber"
              single
              options={[...PRICING_UNITS]}
              value={pricingUnit}
              onChange={(v) => setValue('pricing_unit', (v[0] as PricingUnit) ?? undefined)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Work Preferences" accent="amber">
        <SmartSelector
          label="Work Type"
          accent="amber"
          options={[...WORK_TYPES]}
          value={workType}
          onChange={(v) => setValue('work_type', v)}
        />
        <SmartSelector
          label="Schedule Type"
          accent="amber"
          options={[...SCHEDULE_TYPES]}
          value={scheduleType}
          onChange={(v) => setValue('schedule_type', v)}
        />
      </FormSection>

      <FormSection title="Availability" accent="amber">
        <FormFieldLabel>Days Available</FormFieldLabel>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const active = daysAvailable.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleArrayField('days_available', day.value)}
                className={cn(
                  'w-12 h-10 rounded-2xl text-xs font-bold border transition-colors duration-200',
                  active
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40 ring-1 ring-amber-500/30'
                    : 'bg-secondary/50 border-border text-foreground hover:bg-secondary',
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <ChipMultiSelect
          label="When You Work"
          accent="amber"
          options={[...WORKER_AVAILABILITY]}
          value={timeSlots}
          onChange={(v) => setValue('time_slots_available', v)}
        />
      </FormSection>

      <FormSection title="Service Location" accent="amber">
        <SmartSelector
          label="Location Type"
          accent="amber"
          options={[...LOCATION_TYPES]}
          value={locationType}
          onChange={(v) => setValue('location_type', v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel>Service Radius (km)</FormFieldLabel>
            <Input type="number" {...register('service_radius_km', { valueAsNumber: true })} placeholder="25" />
          </div>
          <div>
            <FormFieldLabel>Min Booking (hours)</FormFieldLabel>
            <Input type="number" {...register('minimum_booking_hours', { valueAsNumber: true })} placeholder="2" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Experience" accent="amber">
        <SmartSelector
          label="Experience Level"
          accent="amber"
          single
          options={[...EXPERIENCE_LEVELS]}
          value={experienceLevel}
          onChange={(v) => setValue('experience_level', v[0] ?? '')}
        />
        <div>
          <FormFieldLabel>Years of Experience</FormFieldLabel>
          <Input type="number" {...register('experience_years', { valueAsNumber: true, min: 0 })} placeholder="5" />
        </div>
      </FormSection>

      <FormSection title="Traits" accent="amber">
        <ChipMultiSelect accent="amber" options={[...WORKER_TRAITS]} value={traits} onChange={(v) => setValue('traits', v)} />
      </FormSection>

      <FormSection title="Languages" accent="amber">
        <ChipMultiSelect accent="amber" options={[...LANGUAGE_OPTIONS]} value={watchedLanguages} onChange={(v) => setValue('languages', v)} />
      </FormSection>

      <FormSection title="Verification & Trust" accent="amber">
        <div className="space-y-2">
          <CheckboxRow id="emergency" checked={!!watch('offers_emergency_service')} onCheckedChange={(v) => setValue('offers_emergency_service', v)} label="I offer emergency / urgent service" />
          <CheckboxRow id="bgcheck" checked={!!watch('background_check_verified')} onCheckedChange={(v) => setValue('background_check_verified', v)} label="Background check verified" />
          <CheckboxRow id="insurance" checked={!!watch('insurance_verified')} onCheckedChange={(v) => setValue('insurance_verified', v)} label="Insurance verified" />
        </div>
      </FormSection>

      <DescriptionPreview
        accent="amber"
        title={watch('title') || buildWorkerTitle({
          serviceCategory: watchedServiceCategory,
          customServiceName: watch('custom_service_name'),
          traits,
          experienceLevel: experienceLevel[0],
          city: watch('city'),
        })}
        description={buildWorkerDescription({
          serviceCategory: watchedServiceCategory,
          customServiceName: watch('custom_service_name'),
          title: watch('title') || buildWorkerTitle({
            serviceCategory: watchedServiceCategory,
            customServiceName: watch('custom_service_name'),
            traits,
            experienceLevel: experienceLevel[0],
            city: watch('city'),
          }),
          traits,
          workType,
          timeSlots,
          languages: watchedLanguages,
          experienceLevel: experienceLevel[0],
          price: watch('price'),
          pricingUnit: pricingUnit[0],
          city: watch('city'),
        })}
        polishedDescription={polishedDescription}
        onPolished={setPolishedDescription}
        placeholder="Selections above auto-build your service title and description."
      />
    </div>
  );
}