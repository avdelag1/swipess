import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
    const { register, control, watch } = useForm<WorkerFormData>({
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
                                    <SelectContent>
                                        {SERVICE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
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
