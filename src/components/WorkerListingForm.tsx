import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SERVICE_SUBSPECIALTIES, SERVICE_GROUPS, getGroupedCategories } from '@/data/serviceCategories';

// Re-export from shared data for backward compat
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
  { value: 'beginner', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Mid Level (2-5 years)' },
  { value: 'expert', label: 'Senior Level (5-10 years)' },
  { value: 'master', label: 'Expert (10+ years)' },
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

const springTap = { type: "spring" as const, stiffness: 500, damping: 30 };

// Premium section wrapper — amber theme
const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-xl overflow-hidden", className)}>
    <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full bg-amber-500" />
      <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-5 pb-5 space-y-4">{children}</div>
  </div>
);

const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-semibold text-foreground/80 mb-1.5 block">{children}</Label>
);

const CheckboxRow = ({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-lg" />
    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground/80">{label}</Label>
  </div>
);

// Themed tag input
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
            <Badge key={tag} className="gap-1 pr-1 bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="ml-0.5 rounded-full hover:bg-amber-500/30 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Themed pill toggle
function PillToggle({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const active = selected.includes(item.value);
        return (
          <motion.button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            whileTap={{ scale: 0.94 }}
            transition={springTap}
            className={cn(
              "px-3.5 py-2 rounded-full text-sm font-semibold transition-all border",
              active
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:border-amber-500/30 hover:text-foreground hover:bg-white/[0.07]'
            )}
          >
            {item.label}
          </motion.button>
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
    <div className="space-y-5">
      <Section title="Service Details">
        <div>
          <FormLabel>Service Category</FormLabel>
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
            <FormLabel>Custom Service Name</FormLabel>
            <Input {...register('custom_service_name')} placeholder="e.g., Personal Stylist" />
          </div>
        )}

        {subspecialties && subspecialties.length > 0 && (
          <div>
            <FormLabel>Specialties</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {subspecialties.map(spec => (
                <CheckboxRow
                  key={spec}
                  id={`spec-${spec}`}
                  checked={watchedSkills.includes(spec)}
                  onCheckedChange={() => toggleArrayField('skills', spec)}
                  label={spec}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <FormLabel>Service Title</FormLabel>
          <Input {...register('title')} placeholder="e.g., Experienced Yoga Instructor" />
        </div>
      </Section>

      <Section title="Location">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>City</FormLabel>
            <Input {...register('city')} placeholder="e.g., Your City" />
          </div>
          <div>
            <FormLabel>Country</FormLabel>
            <Input {...register('country')} placeholder="e.g., Mexico" />
          </div>
        </div>
      </Section>

      <Section title="Pricing">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Price (USD)</FormLabel>
            <Input type="number" {...register('price', { valueAsNumber: true })} placeholder="25" />
          </div>
          <div>
            <FormLabel>Pricing Unit</FormLabel>
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
        </div>
      </Section>

      <Section title="Work Preferences">
        <div>
          <FormLabel>Work Type</FormLabel>
          <PillToggle items={[...WORK_TYPES]} selected={watchedWorkType} onToggle={v => toggleArrayField('work_type', v)} />
        </div>
        <div>
          <FormLabel>Schedule Type</FormLabel>
          <PillToggle items={[...SCHEDULE_TYPES]} selected={watchedScheduleType} onToggle={v => toggleArrayField('schedule_type', v)} />
        </div>
      </Section>

      <Section title="Availability">
        <div>
          <FormLabel>Days Available</FormLabel>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const active = watchedDays.includes(day.value);
              return (
                <motion.button
                  key={day.value}
                  type="button"
                  onClick={() => toggleArrayField('days_available', day.value)}
                  whileTap={{ scale: 0.92 }}
                  transition={springTap}
                  className={cn(
                    "w-12 h-12 rounded-xl text-xs font-bold transition-all border",
                    active
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-md shadow-amber-500/10'
                      : 'bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:border-amber-500/30 hover:bg-white/[0.07]'
                  )}
                >
                  {day.short}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div>
          <FormLabel>Time Slots</FormLabel>
          <PillToggle items={[...TIME_SLOTS]} selected={watchedTimeSlots} onToggle={v => toggleArrayField('time_slots_available', v)} />
        </div>
      </Section>

      <Section title="Service Location">
        <div>
          <FormLabel>Location Type</FormLabel>
          <PillToggle items={[...LOCATION_TYPES]} selected={watchedLocationType} onToggle={v => toggleArrayField('location_type', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Service Radius (km)</FormLabel>
            <Input type="number" {...register('service_radius_km', { valueAsNumber: true })} placeholder="e.g., 25" />
          </div>
          <div>
            <FormLabel>Min Booking (hours)</FormLabel>
            <Input type="number" {...register('minimum_booking_hours', { valueAsNumber: true })} placeholder="e.g., 2" />
          </div>
        </div>
      </Section>

      <Section title="Experience">
        <div>
          <FormLabel>Experience Level</FormLabel>
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
          <FormLabel>Years of Experience</FormLabel>
          <Input type="number" {...register('experience_years', { valueAsNumber: true, min: 0 })} placeholder="5" />
        </div>
      </Section>

      <Section title="Skills & Qualifications">
        <div>
          <FormLabel>Skills (type + Enter)</FormLabel>
          <TagInput tags={watchedSkills} onAdd={v => addToArray('skills', v)} onRemove={v => removeFromArray('skills', v)} placeholder="e.g., Deep Tissue Massage" />
        </div>
        <div>
          <FormLabel>Certifications (type + Enter)</FormLabel>
          <TagInput tags={watchedCertifications} onAdd={v => addToArray('certifications', v)} onRemove={v => removeFromArray('certifications', v)} placeholder="e.g., CPR Certified" />
        </div>
        <div>
          <FormLabel>Tools & Equipment (type + Enter)</FormLabel>
          <TagInput tags={watchedToolsEquipment} onAdd={v => addToArray('tools_equipment', v)} onRemove={v => removeFromArray('tools_equipment', v)} placeholder="e.g., Massage Table" />
        </div>
        <div>
          <FormLabel>Languages (type + Enter)</FormLabel>
          <TagInput tags={watchedLanguages} onAdd={v => addToArray('languages', v)} onRemove={v => removeFromArray('languages', v)} placeholder="e.g., English, Spanish" />
        </div>
      </Section>

      <Section title="Verification & Trust">
        <div className="space-y-2">
          <Controller name="offers_emergency_service" control={control} render={({ field }) => (
            <CheckboxRow id="emergency" checked={!!field.value} onCheckedChange={field.onChange} label="I offer emergency / urgent service" />
          )} />
          <Controller name="background_check_verified" control={control} render={({ field }) => (
            <CheckboxRow id="bgcheck" checked={!!field.value} onCheckedChange={field.onChange} label="Background check verified" />
          )} />
          <Controller name="insurance_verified" control={control} render={({ field }) => (
            <CheckboxRow id="insurance" checked={!!field.value} onCheckedChange={field.onChange} label="Insurance verified" />
          )} />
        </div>
      </Section>
    </div>
  );
}


