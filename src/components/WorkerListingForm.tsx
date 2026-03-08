import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SERVICE_CATEGORIES = [
    { value: 'nanny', label: 'Nanny / Childcare', icon: '👶' },
    { value: 'baby_sitting', label: 'Baby Sitting', icon: '👶' },
    { value: 'chef', label: 'Private Chef', icon: '👨‍🍳' },
    { value: 'home_cook', label: 'Home Cook / Meal Prep', icon: '🍲' },
    { value: 'cleaning', label: 'Cleaning Service', icon: '🧹' },
    { value: 'massage', label: 'Massage Therapist', icon: '💆' },
    { value: 'english_teacher', label: 'English Teacher', icon: '📚' },
    { value: 'spanish_teacher', label: 'Spanish Teacher', icon: '🇲🇽' },
    { value: 'yoga', label: 'Yoga Instructor', icon: '🧘' },
    { value: 'personal_trainer', label: 'Personal Trainer', icon: '💪' },
    { value: 'handyman', label: 'Handyman', icon: '🔧' },
    { value: 'gardener', label: 'Gardener', icon: '🌱' },
    { value: 'pool_maintenance', label: 'Pool Maintenance', icon: '🏊' },
    { value: 'driver', label: 'Private Driver', icon: '🚗' },
    { value: 'security', label: 'Security Guard', icon: '🛡️' },
    { value: 'broker', label: 'Real Estate Broker', icon: '🏠' },
    { value: 'tour_guide', label: 'Tour Guide', icon: '🗺️' },
    { value: 'photographer', label: 'Photographer', icon: '📷' },
    { value: 'pet_care', label: 'Pet Care / Dog Walker', icon: '🐕' },
    { value: 'pet_sitting', label: 'Pet Sitting', icon: '🐾' },
    { value: 'music_teacher', label: 'Music Teacher', icon: '🎵' },
    { value: 'beauty', label: 'Beauty / Hair Stylist', icon: '💇' },
    { value: 'other', label: 'Other Service', icon: '✨' },
  ] as const;

  export type ServiceCategory = typeof SERVICE_CATEGORIES[number]['value'];

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
    { value: 'flexible', label: 'Flexible' },
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
    { value: 'early_morning', label: 'Early Morning (6am–9am)' },
    { value: 'morning', label: 'Morning (9am–12pm)' },
    { value: 'afternoon', label: 'Afternoon (12pm–5pm)' },
    { value: 'evening', label: 'Evening (5pm–9pm)' },
    { value: 'night', label: 'Night (9pm–6am)' },
    { value: 'anytime', label: 'Anytime / Flexible' },
  ] as const;

  export const LOCATION_TYPES = [
    { value: 'on_site', label: 'On-site (Client Location)' },
    { value: 'remote', label: 'Remote / Virtual' },
    { value: 'hybrid', label: 'Hybrid (Both)' },
    { value: 'travel_required', label: 'Travel Required' },
    { value: 'own_location', label: 'At My Location' },
  ] as const;

  export const EXPERIENCE_LEVELS = [
    { value: 'entry', label: 'Entry Level (0–2 years)' },
    { value: 'mid', label: 'Mid Level (2–5 years)' },
    { value: 'senior', label: 'Senior Level (5–10 years)' },
    { value: 'expert', label: 'Expert (10+ years)' },
  ] as const;

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

function toggleArrayValue(current: string[], val: string): string[] {
  return current.includes(val) ? current.filter(v => v !== val) : [...current, val];
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(toggleArrayValue(value, opt.value))}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
              active
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  tags,
  onTagsChange,
  placeholder,
}: {
  tags: string[];
  onTagsChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/10"
            >
              {tag}
              <button
                type="button"
                onClick={() => onTagsChange(tags.filter(t => t !== tag))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          Add
        </Button>
      </div>
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

    useEffect(() => {
        onDataChange(formData);
    }, [formData, onDataChange]);

    const watchedServiceCategory = watch('service_category');
    const watchedWorkType = watch('work_type') || [];
    const watchedScheduleType = watch('schedule_type') || [];
    const watchedDaysAvailable = watch('days_available') || [];
    const watchedTimeSlots = watch('time_slots_available') || [];
    const watchedLocationType = watch('location_type') || [];
    const watchedSkills = watch('skills') || [];
    const watchedCertifications = watch('certifications') || [];
    const watchedTools = watch('tools_equipment') || [];
    const watchedLanguages = watch('languages') || [];

    return (
        <div className="space-y-6">
            {/* Service Details */}
            <Card>
                <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Service Category</Label>
                        <Controller
                            name="service_category"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <SelectTrigger><SelectValue placeholder="Select service category" /></SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_CATEGORIES.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
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

                    <div>
                        <Label>Service Title</Label>
                        <Input {...register('title')} placeholder="e.g., Experienced Yoga Instructor" />
                    </div>
                </CardContent>
            </Card>

            {/* About This Service */}
            <Card>
                <CardHeader><CardTitle>About This Service</CardTitle></CardHeader>
                <CardContent>
                    <Label>Description</Label>
                    <Textarea
                        {...register('description')}
                        placeholder="Describe your experience, what you offer, and why clients should choose you..."
                        className="min-h-[120px] mt-1.5 resize-none"
                    />
                </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader><CardTitle>Location</CardTitle></CardHeader>
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
                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
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
                                        {PRICING_UNITS.map(unit => (
                                            <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Experience */}
            <Card>
                <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
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
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                        ))}
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

            {/* Work Preferences */}
            <Card>
                <CardHeader><CardTitle>Work Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Work Type</Label>
                        <ChipGroup
                            options={WORK_TYPES}
                            value={watchedWorkType}
                            onChange={val => setValue('work_type', val)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Schedule</Label>
                        <ChipGroup
                            options={SCHEDULE_TYPES}
                            value={watchedScheduleType}
                            onChange={val => setValue('schedule_type', val)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Availability */}
            <Card>
                <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Days Available</Label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map(day => {
                                const active = watchedDaysAvailable.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => setValue('days_available', toggleArrayValue(watchedDaysAvailable, day.value))}
                                        className={cn(
                                            'w-12 h-12 rounded-2xl text-xs font-bold transition-all border',
                                            active
                                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
                                        )}
                                    >
                                        {day.short}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Time Availability</Label>
                        <ChipGroup
                            options={TIME_SLOTS}
                            value={watchedTimeSlots}
                            onChange={val => setValue('time_slots_available', val)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Service Location */}
            <Card>
                <CardHeader><CardTitle>Service Location</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <ChipGroup
                        options={LOCATION_TYPES}
                        value={watchedLocationType}
                        onChange={val => setValue('location_type', val)}
                    />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <Label>Service Radius (km)</Label>
                            <Input
                                type="number"
                                {...register('service_radius_km', { valueAsNumber: true, min: 0 })}
                                placeholder="e.g., 20"
                            />
                        </div>
                        <div>
                            <Label>Min. Booking Hours</Label>
                            <Input
                                type="number"
                                {...register('minimum_booking_hours', { valueAsNumber: true, min: 0 })}
                                placeholder="e.g., 2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills & Qualifications */}
            <Card>
                <CardHeader><CardTitle>Skills & Qualifications</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Skills</Label>
                        <TagInput
                            tags={watchedSkills}
                            onTagsChange={val => setValue('skills', val)}
                            placeholder="e.g., CPR Certified — press Enter to add"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Certifications</Label>
                        <TagInput
                            tags={watchedCertifications}
                            onTagsChange={val => setValue('certifications', val)}
                            placeholder="e.g., Yoga Alliance 200hr — press Enter to add"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Tools & Equipment</Label>
                        <TagInput
                            tags={watchedTools}
                            onTagsChange={val => setValue('tools_equipment', val)}
                            placeholder="e.g., Massage table, Yoga mat — press Enter to add"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Languages Spoken</Label>
                        <TagInput
                            tags={watchedLanguages}
                            onTagsChange={val => setValue('languages', val)}
                            placeholder="e.g., English, Spanish — press Enter to add"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Verification & Trust */}
            <Card>
                <CardHeader><CardTitle>Verification & Trust</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Controller
                            name="offers_emergency_service"
                            control={control}
                            render={({ field }) => (
                                <Checkbox id="offers_emergency_service" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                        />
                        <div>
                            <Label htmlFor="offers_emergency_service" className="font-medium cursor-pointer">Emergency / Same-Day Service</Label>
                            <p className="text-xs text-muted-foreground">Available for urgent bookings</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Controller
                            name="background_check_verified"
                            control={control}
                            render={({ field }) => (
                                <Checkbox id="background_check_verified" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                        />
                        <div>
                            <Label htmlFor="background_check_verified" className="font-medium cursor-pointer">Background Check Verified</Label>
                            <p className="text-xs text-muted-foreground">I have a verified background check</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Controller
                            name="insurance_verified"
                            control={control}
                            render={({ field }) => (
                                <Checkbox id="insurance_verified" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                        />
                        <div>
                            <Label htmlFor="insurance_verified" className="font-medium cursor-pointer">Insured</Label>
                            <p className="text-xs text-muted-foreground">I carry professional liability insurance</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
