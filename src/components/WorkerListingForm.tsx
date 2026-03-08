import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState, KeyboardEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
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
  { value: 'early_morning', label: 'Early Morning (6-9am)' },
  { value: 'morning', label: 'Morning (9am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12-5pm)' },
  { value: 'evening', label: 'Evening (5-9pm)' },
  { value: 'night', label: 'Night (9pm-6am)' },
  { value: 'anytime', label: 'Anytime' },
] as const;

export const LOCATION_TYPES = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
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

// Reusable tag input component
function TagInput({ tags, onAdd, onRemove, placeholder }: { tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onAdd(input.trim());
      setInput('');
    }
  };
  return (
    <div className="space-y-2">
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={placeholder} />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable pill toggle
function PillToggle({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const active = selected.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-[0.96] border ${
              active
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-card/60 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
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
  const watchedWorkType = watch('work_type') || [];
  const watchedScheduleType = watch('schedule_type') || [];
  const watchedDays = watch('days_available') || [];
  const watchedTimeSlots = watch('time_slots_available') || [];
  const watchedLocationType = watch('location_type') || [];
  const watchedCertifications = watch('certifications') || [];
  const watchedToolsEquipment = watch('tools_equipment') || [];
  const watchedLanguages = watch('languages') || [];

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const grouped = getGroupedCategories();
  const subspecialties = watchedServiceCategory ? SERVICE_SUBSPECIALTIES[watchedServiceCategory] : undefined;

  const toggleArrayField = (field: keyof WorkerFormData, value: string) => {
    const current = (watch(field) as string[]) || [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setValue(field, updated);
  };

  const addToArray = (field: keyof WorkerFormData, value: string) => {
    const current = (watch(field) as string[]) || [];
    if (!current.includes(value)) setValue(field, [...current, value]);
  };

  const removeFromArray = (field: keyof WorkerFormData, value: string) => {
    const current = (watch(field) as string[]) || [];
    setValue(field, current.filter(v => v !== value));
  };

  return (
    <div className="space-y-6">
      {/* Service Details */}
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

          {subspecialties && subspecialties.length > 0 && (
            <div>
              <Label className="mb-2 block">Specialties</Label>
              <div className="grid grid-cols-2 gap-2">
                {subspecialties.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={watchedSkills.includes(spec)}
                      onCheckedChange={() => toggleArrayField('skills', spec)}
                    />
                    <label htmlFor={`spec-${spec}`} className="text-sm cursor-pointer">{spec}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Service Title</Label>
            <Input {...register('title')} placeholder="e.g., Experienced Yoga Instructor" />
          </div>

          <div>
            <Label>About This Service</Label>
            <Textarea {...register('description')} placeholder="Describe your service, what makes you stand out, and what clients can expect..." rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
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

      {/* Pricing */}
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

      {/* Work Preferences */}
      <Card>
        <CardHeader><CardTitle>Work Preferences (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Work Type</Label>
            <PillToggle items={[...WORK_TYPES]} selected={watchedWorkType} onToggle={v => toggleArrayField('work_type', v)} />
          </div>
          <div>
            <Label className="mb-2 block">Schedule Type</Label>
            <PillToggle items={[...SCHEDULE_TYPES]} selected={watchedScheduleType} onToggle={v => toggleArrayField('schedule_type', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader><CardTitle>Availability (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Days Available</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const active = watchedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleArrayField('days_available', day.value)}
                    className={`w-11 h-11 rounded-lg text-xs font-semibold transition-all active:scale-[0.94] border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                        : 'bg-card/60 text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Time Slots</Label>
            <PillToggle items={[...TIME_SLOTS]} selected={watchedTimeSlots} onToggle={v => toggleArrayField('time_slots_available', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Service Location */}
      <Card>
        <CardHeader><CardTitle>Service Location (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Location Type</Label>
            <PillToggle items={[...LOCATION_TYPES]} selected={watchedLocationType} onToggle={v => toggleArrayField('location_type', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Radius (km)</Label>
              <Input type="number" {...register('service_radius_km', { valueAsNumber: true })} placeholder="e.g., 25" />
            </div>
            <div>
              <Label>Min Booking (hours)</Label>
              <Input type="number" {...register('minimum_booking_hours', { valueAsNumber: true })} placeholder="e.g., 2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
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

      {/* Skills & Qualifications */}
      <Card>
        <CardHeader><CardTitle>Skills & Qualifications (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1 block">Skills (type + Enter)</Label>
            <TagInput tags={watchedSkills} onAdd={v => addToArray('skills', v)} onRemove={v => removeFromArray('skills', v)} placeholder="e.g., Deep Tissue Massage" />
          </div>
          <div>
            <Label className="mb-1 block">Certifications (type + Enter)</Label>
            <TagInput tags={watchedCertifications} onAdd={v => addToArray('certifications', v)} onRemove={v => removeFromArray('certifications', v)} placeholder="e.g., CPR Certified" />
          </div>
          <div>
            <Label className="mb-1 block">Tools & Equipment (type + Enter)</Label>
            <TagInput tags={watchedToolsEquipment} onAdd={v => addToArray('tools_equipment', v)} onRemove={v => removeFromArray('tools_equipment', v)} placeholder="e.g., Massage Table" />
          </div>
          <div>
            <Label className="mb-1 block">Languages (type + Enter)</Label>
            <TagInput tags={watchedLanguages} onAdd={v => addToArray('languages', v)} onRemove={v => removeFromArray('languages', v)} placeholder="e.g., English, Spanish" />
          </div>
        </CardContent>
      </Card>

      {/* Verification & Trust */}
      <Card>
        <CardHeader><CardTitle>Verification & Trust (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Controller name="offers_emergency_service" control={control} render={({ field }) => <Checkbox id="emergency" checked={!!field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="emergency">I offer emergency / urgent service</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="background_check_verified" control={control} render={({ field }) => <Checkbox id="bgcheck" checked={!!field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="bgcheck">Background check verified</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="insurance_verified" control={control} render={({ field }) => <Checkbox id="insurance" checked={!!field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="insurance">Insurance verified</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
