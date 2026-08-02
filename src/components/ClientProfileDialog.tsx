
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AITextarea } from '@/components/ui/AITextarea';
import { Label } from '@/components/ui/label';
import { SmartSelector } from '@/components/listing/SmartSelector';
import { ChipMultiSelect } from '@/components/listing/ChipMultiSelect';
import { DescriptionPreview } from '@/components/listing/DescriptionPreview';
import { PredictiveInput } from '@/components/listing/PredictiveInput';
import { usePolishedDescription } from '@/hooks/usePolishedDescription';
import {
  buildClientBioFromChips,
  CLIENT_BIO_PHRASES,
  OCCUPATION_SUGGESTIONS,
  LANGUAGES as PROFILE_LANGUAGES,
} from '@/constants/listingTaxonomies';

import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { ListingVideoUpload } from '@/components/video/ListingVideoUpload';
import { useClientProfile, useSaveClientProfile } from '@/hooks/useClientProfile';
import { appToast } from '@/utils/appNotification';
import { supabase } from '@/integrations/supabase/client';
import { useModalStore } from '@/state/modalStore';
import { Camera, Check, Compass, MapPin, Save, Sparkles, User, X } from 'lucide-react';
import {
  getCitiesInCountry,
  getCityByName,
  getCountriesInRegion,
  getRegions,
} from '@/data/worldLocations';

import { validateContent } from '@/utils/contactInfoValidation';
import { assertImageSafe, uploadPhoto } from '@/utils/photoUpload';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';


import {
  CLEANLINESS_OPTIONS,
  DRINKING_HABIT_OPTIONS,
  CLIENT_INTENTION_OPTIONS as INTENTION_OPTIONS,
  INTEREST_OPTIONS,
  PERSONALITY_OPTIONS,
  SMOKING_HABIT_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '@/constants/profileConstants';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const STEPS = [
  { id: 1, label: 'Photos', icon: Camera },
  { id: 2, label: 'About', icon: User },
  { id: 3, label: 'Location', icon: MapPin },
  { id: 4, label: 'Lifestyle', icon: Sparkles },
] as const;

const GENDER_PROFILE_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

function ClientProfileDialogComponent({ open, onOpenChange }: Props) {
  const { isLight } = useAppTheme();
  const { data } = useClientProfile();
  const saveMutation = useSaveClientProfile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDir, setStepDir] = useState(1);

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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

  // Client intentions
  const [intentions, setIntentions] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>('');
  const [yearsInCity, setYearsInCity] = useState<number | ''>('');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [bioPhrases, setBioPhrases] = useState<string[]>([]);

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    const regions = getRegions();
    for (const region of regions) {
      const regionCountries = getCountriesInRegion(region);
      regionCountries.forEach(c => countries.add(c));
    }
    return Array.from(countries).sort();
  }, []);

  const availableCities = useMemo(() => {
    if (!country || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, country);
  }, [country, selectedRegion]);

  const cityOptions = useMemo(
    () => availableCities.map((c) => c.name),
    [availableCities],
  );

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
    setCity('');
    setNeighborhood('');
    setLatitude(null);
    setLongitude(null);
    const region = findRegionForCountry(newCountry);
    setSelectedRegion(region);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setNeighborhood('');
    const cityData = getCityByName(newCity);
    if (cityData?.city.coordinates) {
      setLatitude(cityData.city.coordinates.lat);
      setLongitude(cityData.city.coordinates.lng);
    }
  };

  const autoBio = buildClientBioFromChips({
    phrases: bioPhrases,
    interests,
    personality: personalityTraits,
    intentions: intentions.map((id) => INTENTION_OPTIONS.find((o) => o.id === id)?.label ?? id),
    occupation,
    city,
    customBio: bio,
  });
  const bioPolishResetKey = JSON.stringify({ bioPhrases, interests, personalityTraits, intentions, occupation, city, bio });
  const { polishedDescription: polishedBio, setPolishedDescription: setPolishedBio } = usePolishedDescription(bioPolishResetKey);

  const aiProfileDraft = useModalStore(s => s.aiProfileDraft);

  useEffect(() => {
    if (!data && !aiProfileDraft) return;
    const merged: any = { ...(data || {}), ...(aiProfileDraft || {}) };
    
    setName(merged.name ?? '');
    setAge(merged.age ?? '');
    setGender(merged.gender ?? '');
    setBio(merged.bio ?? '');
    setInterests(merged.interests ?? []);
    setActivities(merged.preferred_activities ?? []);
    setProfileImages(merged.profile_images ?? []);
    setVideoUrl(merged.video_url ?? null);
    setNationality(merged.nationality ?? '');
    setLanguages(merged.languages ?? []);
    setRelationshipStatus(merged.relationship_status ?? '');
    setHasChildren(merged.has_children ?? false);
    setSmokingHabit(merged.smoking_habit ?? 'never');
    setDrinkingHabit(merged.drinking_habit ?? 'never');
    setCleanlinessLevel(merged.cleanliness_level ?? 'medium');
    setNoiseTolerance(merged.noise_tolerance ?? 'medium');
    setWorkSchedule(merged.work_schedule ?? '');
    const loadedCountry = merged.country ?? '';
    const loadedCity = merged.city ?? '';
    setCountry(loadedCountry);
    setCity(loadedCity);
    setNeighborhood(merged.neighborhood ?? '');
    setLatitude(merged.latitude ?? null);
    setLongitude(merged.longitude ?? null);
    setIntentions(merged.intentions ?? []);
    setOccupation(merged.occupation ?? '');
    setYearsInCity(merged.years_in_city ?? '');
    setPersonalityTraits(merged.personality_traits ?? []);
    if (loadedCountry) setSelectedRegion(findRegionForCountry(loadedCountry));
  }, [data, aiProfileDraft]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { publicUrl, path } = await uploadPhoto({
      userId: user.data.user.id,
      blob: file,
      bucket: 'profile-images',
    });

    try {
      await assertImageSafe(publicUrl);
    } catch (e) {
      // Reject + remove the unsafe photo so it never becomes a public profile pic.
      await supabase.storage.from('profile-images').remove([path]).catch(() => {});
      if ((e as Error & { moderationBlocked?: boolean })?.moderationBlocked) {
        appToast.error('Photo rejected', (e as Error).message);
      }
      throw e;
    }
    return publicUrl;
  };

  const handleSave = async () => {
    triggerHaptic('medium');
    if (name && !validateContent(name).isClean) {
      appToast.error('Content Blocked');
      return;
    }
    const bioToSave = polishedBio ?? (bio.trim() || autoBio || null);
    if (bioToSave && !validateContent(bioToSave).isClean) {
      appToast.error('Content Blocked');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        name, age: age === '' ? null : Number(age), gender,
        interests, preferred_activities: activities, profile_images: profileImages,
        video_url: videoUrl,
        nationality, languages, relationship_status: relationshipStatus, has_children: hasChildren,
        smoking_habit: smokingHabit, drinking_habit: drinkingHabit, cleanliness_level: cleanlinessLevel,
        noise_tolerance: noiseTolerance, work_schedule: workSchedule,
        country, city, neighborhood, latitude, longitude,
        intentions, occupation, years_in_city: yearsInCity === '' ? null : Number(yearsInCity),
        personality_traits: personalityTraits,
        bio: bioToSave,
      });
      appToast.success('Identity Updated');
      onOpenChange(false);
    } catch (_error) {
       appToast.error('Sync Error');
    }
  };

  const toggleIntention = (intentionId: string) => {
    triggerHaptic('light');
    if (intentions.includes(intentionId)) setIntentions(intentions.filter(i => i !== intentionId));
    else setIntentions([...intentions, intentionId]);
  };

  const goNext = useCallback(() => {
    triggerHaptic('light');
    setStepDir(1);
    setCurrentStep(s => Math.min(s + 1, STEPS.length));
  }, []);

  const goBack = useCallback(() => {
    triggerHaptic('light');
    setStepDir(-1);
    setCurrentStep(s => Math.max(s - 1, 1));
  }, []);

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v && scrollContainerRef.current) {
      savedScrollRef.current = scrollContainerRef.current.scrollTop;
    }
    if (!v) setCurrentStep(1);
    triggerHaptic('light');
    onOpenChange(v);
  }, [onOpenChange]);

  useEffect(() => {
    if (open && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      requestAnimationFrame(() => { el.scrollTop = 0; });
    }
  }, [open, currentStep]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton className={cn("client-profile-dialog sm:max-w-3xl h-[92dvh] max-h-[92dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem]", isLight ? "light-profile-dialog border-border/50 bg-background text-foreground shadow-[0_30px_90px_hsl(var(--foreground)/0.16)]" : "border-white/10 bg-background text-foreground shadow-[0_0_80px_rgba(0,0,0,0.95)]")}>
        
        <div
          aria-hidden
          className={cn(
            'ambient-page-bg pointer-events-none absolute inset-0 opacity-50',
            isLight ? 'ambient-page-bg--light' : 'ambient-page-bg--dark',
          )}
        />

        {/* Header with step indicator */}
        <div className={cn("relative px-6 pt-6 pb-4 border-b z-10 shrink-0", isLight ? "border-border/50 bg-white/40 backdrop-blur-xl" : "border-white/10 bg-black/40 backdrop-blur-xl")}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </p>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground mt-0.5">
                {STEPS[currentStep - 1].label}
              </h2>
            </div>
            <button
              onClick={() => handleOpenChange(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground transition-all active:scale-90 hover:bg-foreground/8"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-2">
            {STEPS.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => { setStepDir(step.id > currentStep ? 1 : -1); setCurrentStep(step.id); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
                    active
                      ? "bg-primary text-white border-primary shadow-[0_4px_12px_rgba(from_var(--primary)_r_g_b_/_0.35)]"
                      : done
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-foreground/5 text-muted-foreground border-border/50",
                  )}
                >
                  {done ? <Check className="w-2.5 h-2.5" /> : <step.icon className="w-2.5 h-2.5" />}
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-0.5 w-full bg-foreground/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#EB4898] to-[#FF4D00]"
              initial={false}
              animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              transition={{ type: 'spring', damping: 24, stiffness: 200 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain relative z-10"
          style={{ WebkitOverflowScrolling: 'touch' as any }}
        >
          <AnimatePresence mode="sync" custom={stepDir}>
            <motion.div
              key={currentStep}
              custom={stepDir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 py-6 space-y-6 pb-28"
            >

              {/* Step 1: Photos */}
              {currentStep === 1 && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Portrait photos (vertical) look best on mobile. Add up to 6 — your first photo is your cover.
                  </p>
                  <PhotoUploadManager
                    maxPhotos={6}
                    currentPhotos={profileImages}
                    onPhotosChange={setProfileImages}
                    uploadType="profile"
                    onUpload={handleImageUpload}
                    showCameraButton={true}
                    replaceOnFull={false}
                  />
                  {data?.user_id && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Optional — 10s video loop
                      </Label>
                      <p className="text-xs text-muted-foreground/60 ml-1 mb-3">Plays silently on your swipe card before photos.</p>
                      <ListingVideoUpload
                        userId={data.user_id}
                        videoUrl={videoUrl}
                        onUploadSuccess={setVideoUrl}
                        onRemove={() => setVideoUrl(null)}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Step 2: About You */}
              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>Your name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>Age</Label>
                        <Input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                          placeholder="25"
                          className="text-center"
                        />
                      </div>
                      <SmartSelector
                        label="Gender"
                        accent="rose"
                        single
                        options={GENDER_PROFILE_OPTIONS}
                        value={gender ? [gender] : []}
                        onChange={(v) => setGender(v[0] ?? '')}
                        placeholder="Select"
                      />
                    </div>
                  </div>

                  <ChipMultiSelect
                    label="Bio phrases"
                    accent="rose"
                    options={CLIENT_BIO_PHRASES}
                    value={bioPhrases}
                    onChange={setBioPhrases}
                  />

                  <PredictiveInput
                    label="Occupation"
                    value={occupation}
                    onChange={setOccupation}
                    suggestions={OCCUPATION_SUGGESTIONS}
                    placeholder="Designer, Developer…"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>Years in this city</Label>
                      <Input type="number" value={yearsInCity} onChange={(e) => setYearsInCity(e.target.value ? Number(e.target.value) : '')} placeholder="2" />
                    </div>
                  </div>

                  <ChipMultiSelect label="Interests" accent="rose" options={INTEREST_OPTIONS} value={interests} onChange={setInterests} />
                  <ChipMultiSelect label="Personality" accent="rose" options={PERSONALITY_OPTIONS} value={personalityTraits} onChange={setPersonalityTraits} />
                  <ChipMultiSelect label="Languages" accent="rose" options={PROFILE_LANGUAGES} value={languages} onChange={setLanguages} />

                  <div className="space-y-2">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>
                      Custom bio (optional)
                    </Label>
                    <AITextarea
                      value={bio}
                      onChange={setBio}
                      enhanceType="profile"
                      placeholder="Override or add a personal line…"
                      maxLength={500}
                      rows={4}
                    />
                  </div>

                  <DescriptionPreview
                    accent="rose"
                    enhanceType="profile"
                    description={autoBio}
                    polishedDescription={polishedBio}
                    onPolished={setPolishedBio}
                    placeholder="Phrases and selections above build your swipe-card bio."
                  />
                </>
              )}

              {/* Step 3: Location & Intentions */}
              {currentStep === 3 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SmartSelector
                      label="Country"
                      accent="rose"
                      single
                      forceSheet
                      options={allCountries}
                      value={country ? [country] : []}
                      onChange={(v) => handleCountryChange(v[0] ?? '')}
                      placeholder="Select country"
                      searchPlaceholder="Search countries…"
                    />
                    <SmartSelector
                      label="City"
                      accent="rose"
                      single
                      forceSheet
                      options={cityOptions}
                      value={city ? [city] : []}
                      onChange={(v) => handleCityChange(v[0] ?? '')}
                      disabled={!country}
                      placeholder={country ? 'Select city' : 'Pick country first'}
                      searchPlaceholder="Search cities…"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>
                      What are you looking for?
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {INTENTION_OPTIONS.map((opt) => {
                        const active = intentions.includes(opt.id);
                        return (
                          <motion.button
                            key={opt.id}
                            onClick={() => toggleIntention(opt.id)}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                              active
                                ? "bg-[#FF4D00]/10 border-[#FF4D00]/60 shadow-[0_4px_16px_rgba(255,77,0,0.08)]"
                                : cn("border-border/60 hover:border-border", isLight ? "bg-muted/30" : "bg-white/[0.02]"),
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", active ? "bg-[#FF4D00] text-white" : "bg-foreground/8 text-foreground/40")}>
                              <Compass className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-bold text-sm", active ? "text-[#FF4D00]" : "text-foreground")}>{opt.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", active ? "border-[#FF4D00] bg-[#FF4D00]" : "border-border/50")}>
                              {active && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Lifestyle */}
              {currentStep === 4 && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Owners use these to match you with the right space. Honest answers get better matches.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SmartSelector
                      label="Smoking"
                      accent="rose"
                      single
                      options={SMOKING_HABIT_OPTIONS}
                      value={smokingHabit ? [smokingHabit] : []}
                      onChange={(v) => setSmokingHabit(v[0] ?? 'never')}
                    />
                    <SmartSelector
                      label="Drinking"
                      accent="rose"
                      single
                      options={DRINKING_HABIT_OPTIONS}
                      value={drinkingHabit ? [drinkingHabit] : []}
                      onChange={(v) => setDrinkingHabit(v[0] ?? 'never')}
                    />
                    <SmartSelector
                      label="Cleanliness"
                      accent="rose"
                      single
                      options={CLEANLINESS_OPTIONS}
                      value={cleanlinessLevel ? [cleanlinessLevel] : []}
                      onChange={(v) => setCleanlinessLevel(v[0] ?? 'medium')}
                    />
                  </div>

                  <div className="space-y-4">
                    <SmartSelector
                      label="Work schedule"
                      accent="rose"
                      single
                      options={WORK_SCHEDULE_OPTIONS}
                      value={workSchedule ? [workSchedule] : []}
                      onChange={(v) => setWorkSchedule(v[0] ?? '')}
                      placeholder="Select schedule"
                    />
                    <div className="space-y-2">
                      <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isLight ? "text-slate-700" : "text-white/70")}>Noise tolerance</Label>
                      <div className="flex gap-2">
                        {['quiet', 'medium', 'lively'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setNoiseTolerance(level)}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize",
                              noiseTolerance === level
                                ? "bg-primary text-white border-primary"
                                : "border-border/50 text-muted-foreground hover:border-border",
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — step navigation */}
        <div className={cn("px-6 py-4 border-t flex items-center justify-between gap-3 z-10 relative shrink-0", isLight ? "border-border/50 bg-white/60 backdrop-blur-2xl" : "border-white/10 bg-black/60 backdrop-blur-2xl")}>
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? () => handleOpenChange(false) : goBack}
            className="h-12 px-6 rounded-2xl font-bold text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          >
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={goNext}
              className="h-12 px-8 rounded-2xl font-black uppercase tracking-wider text-white border-none"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)' }}
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="keep-white h-12 px-8 rounded-2xl font-black uppercase tracking-wider text-white border-none"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)' }}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ClientProfileDialog = memo(ClientProfileDialogComponent);
