
import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { useClientProfile, useSaveClientProfile } from '@/hooks/useClientProfile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Check, MapPin, Search, User, Compass, Target, LifeBuoy, Sparkles, X, Save } from 'lucide-react';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
  getCityByName,
} from '@/data/worldLocations';
import { logger } from '@/utils/prodLogger';
import { validateContent } from '@/utils/contactInfoValidation';
import { triggerHaptic } from '@/utils/haptics';

import {
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  SMOKING_HABIT_OPTIONS,
  DRINKING_HABIT_OPTIONS,
  CLEANLINESS_OPTIONS,
  NOISE_TOLERANCE_OPTIONS,
  CLIENT_INTENTION_OPTIONS as INTENTION_OPTIONS
} from '@/constants/profileConstants';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function ClientProfileDialogComponent({ open, onOpenChange }: Props) {
  const { data } = useClientProfile();
  const saveMutation = useSaveClientProfile();

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [profileImages, setProfileImages] = useState<string[]>([]);

  // New demographic fields
  const [nationality, setNationality] = useState<string>('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<string>('');
  const [hasChildren, setHasChildren] = useState<boolean>(false);

  // Lifestyle habit fields
  const [smokingHabit, setSmokingHabit] = useState<string>('never');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('never');
  const [cleanlinessLevel, setCleanlinessLevel] = useState<string>('medium');
  const [noiseTolerance, setNoiseTolerance] = useState<string>('medium');
  const [workSchedule, setWorkSchedule] = useState<string>('');

  // Location fields
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Client intentions
  const [intentions, setIntentions] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>('');
  const [yearsInCity, setYearsInCity] = useState<number | ''>('');

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    const regions = getRegions();
    for (const region of regions) {
      const regionCountries = getCountriesInRegion(region);
      regionCountries.forEach(c => countries.add(c));
    }
    return Array.from(countries).sort();
  }, []);

  const filteredCountries = useMemo(() =>
    allCountries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [allCountries, countrySearch]
  );

  const availableCities = useMemo(() => {
    if (!country || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, country);
  }, [country, selectedRegion]);

  const filteredCities = useMemo(() =>
    availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
    [availableCities, citySearch]
  );

  const availableNeighborhoods = useMemo(() => {
    if (!city) return [];
    const cityData = getCityByName(city);
    return cityData?.city.neighborhoods || [];
  }, [city]);

  const findRegionForCountry = (countryName: string): string => {
    const regions = getRegions();
    for (const region of regions) {
      const countriesInRegion = getCountriesInRegion(region);
      if (countriesInRegion.includes(countryName)) return region;
    }
    return '';
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCountrySearch('');
    setCity('');
    setNeighborhood('');
    setCitySearch('');
    setLatitude(null);
    setLongitude(null);
    const region = findRegionForCountry(newCountry);
    setSelectedRegion(region);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setCitySearch('');
    setNeighborhood('');
    const cityData = getCityByName(newCity);
    if (cityData?.city.coordinates) {
      setLatitude(cityData.city.coordinates.lat);
      setLongitude(cityData.city.coordinates.lng);
    }
  };

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setAge(data.age ?? '');
    setGender(data.gender ?? '');
    setInterests(data.interests ?? []);
    setActivities(data.preferred_activities ?? []);
    setProfileImages(data.profile_images ?? []);
    setNationality((data as any).nationality ?? '');
    setLanguages((data as any).languages ?? []);
    setRelationshipStatus((data as any).relationship_status ?? '');
    setHasChildren((data as any).has_children ?? false);
    setSmokingHabit((data as any).smoking_habit ?? 'never');
    setDrinkingHabit((data as any).drinking_habit ?? 'never');
    setCleanlinessLevel((data as any).cleanliness_level ?? 'medium');
    setNoiseTolerance((data as any).noise_tolerance ?? 'medium');
    setWorkSchedule((data as any).work_schedule ?? '');
    const loadedCountry = (data as any).country ?? '';
    const loadedCity = (data as any).city ?? '';
    setCountry(loadedCountry);
    setCity(loadedCity);
    setNeighborhood((data as any).neighborhood ?? '');
    setLatitude((data as any).latitude ?? null);
    setLongitude((data as any).longitude ?? null);
    setIntentions((data as any).intentions ?? []);
    setOccupation((data as any).occupation ?? '');
    setYearsInCity((data as any).years_in_city ?? '');
    if (loadedCountry) setSelectedRegion(findRegionForCountry(loadedCountry));
  }, [data]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.data.user.id}/${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from('profile-images').upload(filePath, file);
    if (error) throw error;
    return supabase.storage.from('profile-images').getPublicUrl(filePath).data.publicUrl;
  };

  const handleSave = async () => {
    triggerHaptic('medium');
    if (name && !validateContent(name).isClean) {
      toast.error('Content Blocked', { description: 'Please check your Station ID.' });
      return;
    }
    try {
      await saveMutation.mutateAsync({
        name, age: age === '' ? null : Number(age), gender,
        interests, preferred_activities: activities, profile_images: profileImages,
        nationality, languages, relationship_status: relationshipStatus, has_children: hasChildren,
        smoking_habit: smokingHabit, drinking_habit: drinkingHabit, cleanliness_level: cleanlinessLevel,
        noise_tolerance: noiseTolerance, work_schedule: workSchedule,
        country, city, neighborhood, latitude, longitude,
        intentions, occupation, years_in_city: yearsInCity === '' ? null : Number(yearsInCity),
      });
      toast.success('Identity Updated', { description: 'Your profile has been updated.' });
      onOpenChange(false);
    } catch (error) {
       toast.error('Sync Error');
    }
  };

  const toggleIntention = (intentionId: string) => {
    triggerHaptic('light');
    if (intentions.includes(intentionId)) setIntentions(intentions.filter(i => i !== intentionId));
    else setIntentions([...intentions, intentionId]);
  };

  const completionPercentage = Math.round(
    ((name ? 20 : 0) + (age ? 10 : 0) + (profileImages.length > 0 ? 30 : 0) + (intentions.length > 0 ? 20 : 0) + (city ? 20 : 0))
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { triggerHaptic('light'); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 border border-white/5 bg-[#0a0a0c] overflow-hidden rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        
        {/* 🛸 NEXUS HEADER */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#EB4898]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Identity Terminal</span>
                 </div>
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Edit Profile</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#EB4898] to-[#ff5bb0]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                    />
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#EB4898] italic">{completionPercentage}% Parity</span>
              </div>
           </div>
           
           <button onClick={() => { triggerHaptic('light'); onOpenChange(false); }} className="absolute -top-2 -right-2 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 touch-pan-y overscroll-contain">
          <div className="space-y-12 pb-12">
            
            {/* 📸 ASSET REPOSITORY */}
            <section className="space-y-6">
               <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white/90">Visual Assets</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 italic">High-fidelity primary and lifestyle imagery</p>
               </div>
               <PhotoUploadManager
                 maxPhotos={6}
                 currentPhotos={profileImages}
                 onPhotosChange={setProfileImages}
                 uploadType="profile"
                 onUpload={handleImageUpload}
                 showCameraButton={true}
                 replaceOnFull={false}
               />
            </section>

            {/* 👤 IDENTITY CORE */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                      <User className="w-4 h-4" />
                   </div>
                   <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Identity Core</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Station ID (Name)</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all px-6" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Cycle (Age)</Label>
                        <Input type="number" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all px-6 text-center" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Spectrum</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all px-6">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d0d0f] border-white/10 text-white">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Spectrum</SelectItem>
                            <SelectItem value="prefer-not-to-say">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                   </div>
                </div>
            </section>

            {/* 🎯 OBJECTIVE TERMINAL */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                     <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Objective Terminal</h3>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                 {INTENTION_OPTIONS.map((opt) => {
                   const active = intentions.includes(opt.id);
                   return (
                     <motion.button
                       key={opt.id}
                       onClick={() => toggleIntention(opt.id)}
                       whileTap={{ scale: 0.98 }}
                       className={cn(
                         "flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all text-left group",
                         active ? "bg-[#EB4898]/10 border-[#EB4898] shadow-[0_10px_30px_rgba(235,72,152,0.1)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", active ? "bg-[#EB4898] text-white" : "bg-white/5 text-white/40")}>
                           <Compass className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <span className="font-black italic uppercase tracking-tighter text-white group-hover:text-[#EB4898] transition-colors">{opt.label}</span>
                              {active && <Badge className="bg-[#EB4898] text-white text-[8px] font-black uppercase italic">Active</Badge>}
                           </div>
                           <p className="text-[10px] font-medium uppercase tracking-widest text-white/30 italic">{opt.description}</p>
                        </div>
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", active ? "border-[#EB4898] bg-[#EB4898]" : "border-white/20")}>
                           {active && <Check className="w-3 h-3 text-white" />}
                        </div>
                     </motion.button>
                   )
                 })}
               </div>
            </section>

            {/* 📍 GEOLOCATION SYNC */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                     <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Geolocation Sync</h3>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Region Control</Label>
                     <Select value={country} onValueChange={handleCountryChange}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic px-6 uppercase tracking-widest">
                           <SelectValue placeholder="Station Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d0f] border-white/10 text-white max-h-72">
                           <div className="p-3 border-b border-white/5">
                              <Input placeholder="Filter..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="bg-white/5 border-white/10 h-10" />
                           </div>
                           {filteredCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Sector (City)</Label>
                     <Select value={city} onValueChange={handleCityChange} disabled={!country}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic px-6 uppercase tracking-widest">
                           <SelectValue placeholder="City ID" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d0f] border-white/10 text-white max-h-72">
                           {filteredCities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </section>

            {/* 🏠 HABIT PARITY */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                     <LifeBuoy className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Habit Parity</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Smke', val: smokingHabit, set: setSmokingHabit, opts: SMOKING_HABIT_OPTIONS },
                    { label: 'Drnk', val: drinkingHabit, set: setDrinkingHabit, opts: DRINKING_HABIT_OPTIONS },
                    { label: 'Clen', val: cleanlinessLevel, set: setCleanlinessLevel, opts: CLEANLINESS_OPTIONS }
                  ].map((group) => (
                    <div key={group.label} className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">{group.label}</Label>
                       <Select value={group.val} onValueChange={group.set}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic px-4 uppercase tracking-tighter">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d0d0f] border-white/10 text-white">
                             {group.opts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                  ))}
               </div>
            </section>

          </div>
        </div>

        {/* 🛸 NEXUS FOOTER ACTIONS */}
        <div className="px-8 py-6 border-t border-white/5 bg-gradient-to-t from-white/[0.03] to-transparent flex items-center justify-between gap-4">
           <Button 
             variant="ghost" 
             onClick={() => onOpenChange(false)}
             className="h-14 px-8 rounded-2xl font-black italic uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5"
           >
              Cancel
           </Button>
           
           <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="h-14 pl-8 pr-10 rounded-2xl bg-white text-black font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all group border-none"
           >
              <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform !text-black" />
              <span className="!text-black">{saveMutation.isPending ? 'Syncing...' : 'Commit Changes'}</span>
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ClientProfileDialog = memo(ClientProfileDialogComponent);
