import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SERVICE_CATEGORIES, SERVICE_SUBSPECIALTIES, SERVICE_GROUPS, getGroupedCategories } from '@/data/serviceCategories';

// Re-export from shared data for backward compat
export { SERVICE_CATEGORIES } from '@/data/serviceCategories';

export const PRICING_UNITS = [
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_session', label: 'Per Session' },
  { value: 'per_day', label: 'Per Day' },
  { value: 'per_week', label: 'Per Week' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'quote', label: 'Quote-Based' },
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
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
] as const;

export const TIME_SLOTS = [
  { value: 'early_morning', label: 'Early Morning (6am-9am)' },
  { value: 'morning', label: 'Morning (9am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm-5pm)' },
  { value: 'evening', label: 'Evening (5pm-9pm)' },
  { value: 'night', label: 'Night (9pm-6am)' },
  { value: 'anytime', label: 'Anytime/Flexible' },
] as const;

export const LOCATION_TYPES = [
  { value: 'on_site', label: 'On-site (Client Location)' },
  { value: 'remote', label: 'Remote (Virtual)' },
  { value: 'hybrid', label: 'Hybrid (Both)' },
  { value: 'travel_required', label: 'Travel Required' },
  { value: 'own_location', label: 'At My Location' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'expert', label: 'Expert (10+ years)' },
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
  city?: string;
  country?: string;
}

interface WorkerListingFormProps {
  onDataChange: (data: Partial<WorkerFormData>) => void;
  initialData?: Partial<WorkerFormData>;
}

export function WorkerListingForm({ onDataChange, initialData = {} }: WorkerListingFormProps) {
  const { register, control, watch, setValue } = useForm<WorkerFormData>({
    defaultValues: {
      ...initialData,
      work_type: initialData.work_type || [],
      schedule_type: initialData.schedule_type || [],
      days_available: initialData.days_available || [],
      time_slots_available: initialData.time_slots_available || [],
      location_type: initialData.location_type || [],
      skills: initialData.skills || [],
      certifications: initialData.certifications || [],
      tools_equipment: initialData.tools_equipment || [],
      languages: initialData.languages || [],
      price: initialData.price || '',
      experience_years: initialData.experience_years || '',
    }
  });

  const formData = watch();
  const watchedServiceCategory = watch('service_category');
  const watchedSkills = watch('skills') || [];

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const grouped = getGroupedCategories();
  const subspecialties = watchedServiceCategory ? SERVICE_SUBSPECIALTIES[watchedServiceCategory] : undefined;

  const toggleSkill = (skill: string) => {
    const current = watchedSkills;
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    setValue('skills', updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Service Details (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Service Category</Label>
            <Controller
              name="service_category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select service category" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {SERVICE_GROUPS.map(group => (
                      <SelectGroup key={group}>
                        <SelectLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          {group}
                        </SelectLabel>
                        {grouped[group].map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.icon} {c.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {watchedServiceCategory === 'other' && (
            <div>
              <Label>Custom Service Name</Label>
              <Input {...register('custom_service_name')} placeholder="e.g., Personal Stylist" />
            </div>
          )}

          {/* Subspecialties */}
          {subspecialties && subspecialties.length > 0 && (
            <div>
              <Label className="mb-2 block">Specialties</Label>
              <div className="grid grid-cols-2 gap-2">
                {subspecialties.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={watchedSkills.includes(spec)}
                      onCheckedChange={() => toggleSkill(spec)}
                    />
                    <label htmlFor={`spec-${spec}`} className="text-sm cursor-pointer">
                      {spec}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Service Title</Label>
            <Input {...register('title')} placeholder="e.g., Experienced Yoga Instructor" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Location (Optional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input {...register('city')} placeholder="e.g., Tulum" />
          </div>
          <div>
            <Label>Country</Label>
            <Input {...register('country')} placeholder="e.g., Mexico" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing (Optional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price (USD)</Label>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="25" />
          </div>
          <div>
            <Label>Pricing Unit</Label>
            <Controller
              name="pricing_unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {PRICING_UNITS.map(unit => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Experience (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Experience Level</Label>
            <Controller
              name="experience_level"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Years of Experience</Label>
            <Input type="number" {...register('experience_years', { valueAsNumber: true, min: 0 })} placeholder="5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
