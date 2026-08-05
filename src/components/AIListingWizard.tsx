import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Anchor, AudioLines, Bike, Briefcase, Building2,
  Camera, Mic, Search, Sparkles, Wand2, X, Zap
} from 'lucide-react';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appToast } from '@/utils/appNotification';
import { assertImageSafe, uploadPhotoBatch } from '@/utils/photoUpload';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useQueryClient } from '@tanstack/react-query';
import { saveListingWithSchemaRetry } from '@/utils/listingSave';
import { QuickCityPicker } from '@/components/location/QuickCityPicker';
import { resolveListingCoordinates } from '@/utils/listingLocation';
import { logger } from '@/utils/prodLogger';
import { useTranslation } from 'react-i18next';
import { validateImageFile } from '@/utils/fileValidation';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';
import { WizardWelcomeScreen } from './WizardWelcomeScreen';
import { DraggablePhotoGrid } from './DraggablePhotoGrid';

const AI_MAX_PHOTOS: Record<string, number> = {
  property: 30,
  motorcycle: 5,
  bicycle: 5,
  yacht: 12,
  worker: 3,
};

function _photoFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

type WizardStep = 'welcome' | 'compose' | 'processing';
type ProgressPhase = 'upload' | 'optimize' | 'publish' | 'redirect';

const CATEGORIES = [
  { id: 'property', label: 'Property', icon: Building2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'motorcycle', label: 'Motorcycle', icon: MotorcycleIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'yacht', label: 'Yacht', icon: Anchor, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { id: 'worker', label: 'Job / Service', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/10' },
] as const;

interface FallbackContext {
  category: typeof CATEGORIES[number]['id'] | null;
  cityLocation: string;
  price: string;
  extras: Record<string, unknown>;
}

const buildFallbackTitle = ({ category, cityLocation, extras }: Omit<FallbackContext, 'price'>) => {
  const cat = category || 'listing';
  const city = cityLocation?.trim();
  if (cat === 'property') {
    const beds = Number(extras.beds);
    const bedPart = Number.isFinite(beds) && beds > 0 ? `${beds}-bedroom ` : '';
    return `${bedPart}home${city ? ` in ${city}` : ''}`.replace(/^./, (c) => c.toUpperCase());
  }
  if (cat === 'motorcycle' || cat === 'bicycle' || cat === 'yacht') {
    const brand = (extras.brand as string) || '';
    const year = (extras.year as string) || '';
    const label = cat === 'motorcycle' ? 'Motorcycle' : cat === 'bicycle' ? 'Bicycle' : 'Yacht';
    return [year, brand, label].filter(Boolean).join(' ') || `${label}${city ? ` — ${city}` : ''}`;
  }
  if (cat === 'worker') {
    const service = (extras.service_category as string) || 'Professional service';
    return `${service}${city ? ` — ${city}` : ''}`;
  }
  return `New ${cat}`;
};

const buildFallbackPrompt = ({ category, cityLocation, price, extras }: FallbackContext) => {
  const cat = category || 'listing';
  const city = cityLocation?.trim();
  const priceNum = Number(price);
  const parts: string[] = [];
  parts.push(`New ${cat} listing`);
  if (city) parts.push(`located in ${city}`);
  if (Number.isFinite(priceNum) && priceNum > 0) {
    parts.push(`available for ${Math.round(priceNum).toLocaleString('en-US')} USD`);
  }
  if (cat === 'property') {
    const beds = Number(extras.beds);
    const baths = Number(extras.baths);
    if (beds > 0) parts.push(`${beds} bedroom${beds === 1 ? '' : 's'}`);
    if (baths > 0) parts.push(`${baths} bathroom${baths === 1 ? '' : 's'}`);
  }
  if (cat === 'motorcycle' || cat === 'bicycle' || cat === 'yacht') {
    if (extras.brand) parts.push(`brand ${extras.brand}`);
    if (extras.year) parts.push(`year ${extras.year}`);
  }
  if (cat === 'worker' && extras.service_category) {
    parts.push(`service ${extras.service_category}`);
  }
  return parts.join(', ') + '.';
};

export function AIListingWizard() {
  const { showAIListing, aiListingCategory, aiListingDraft, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnboardingActive, setOnboardingActive } = useOnboardingStore();
  const { t } = useTranslation();


  const headerBorder = isLight ? 'border-border' : 'border-white/12';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/80' : 'text-white/75';
  const chipIdleCls = isLight
    ? 'bg-slate-50 border-slate-200 hover:border-[#8B5CF6]/30'
    : 'bg-[#141418] border-white/12 hover:border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
  const inputCls = isLight
    ? 'surface-inset focus:border-[#8B5CF6] focus:ring-0 text-black placeholder:text-black/50 font-medium'
    : 'bg-[#141418] border border-white/12 focus:border-[#8B5CF6] focus:ring-0 text-white placeholder:text-white/45 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]';
  const closeBtnCls = isLight
    ? 'surface-3 hover:shadow-[var(--elev-4)] rounded-2xl transition-all'
    : 'bg-[#1c1c22] hover:bg-[#26262e] rounded-2xl transition-all border border-white/15 shadow-lg';
  const photoAddCls = isLight
    ? 'border-slate-300 bg-slate-50'
    : 'border-white/20 bg-[#141418]';
  const photoAddInnerCls = isLight
    ? 'bg-slate-50 border-slate-200'
    : 'bg-[#1c1c22] border-white/10';
  const enhanceDisabledCls = isLight
    ? 'opacity-50 bg-slate-50 border-slate-200 text-black/50'
    : 'opacity-60 bg-[#141418] border-white/12 text-white/70';
  
  const [step, setStep] = useState<WizardStep>('compose');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id'] | null>('property');
  const [prompt, setPrompt] = useState('');
  const [price, setPrice] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat?: number; lng?: number }>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extras, setExtras] = useState<Record<string, unknown>>({});
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>('upload');
  const [progressPct, setProgressPct] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const { isRecording, isTranscribing, interimTranscript, start: startVoice, stop: stopVoice } = useVoiceTranscribe({
    onStop: (text) => {
      if (text) setPrompt(prev => prev ? `${prev} ${text}` : text);
      setMicVolume(0);
    },
    onVolumeChange: (vol) => setMicVolume(vol)
  });
  const [micTipOpen, setMicTipOpen] = useState(false);
  const { enhanceText, isEnhancing } = useAIEnhanceText();

  // One stable preview URL per file — creating them inline in render leaks a
  // fresh blob URL for every photo on every keystroke of the description.
  const previewUrls = useMemo(() => imageFiles.map((f) => URL.createObjectURL(f)), [imageFiles]);
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);

  const handleEnhance = async () => {
    const raw = prompt.trim();
    if (!raw) { appToast.error('Type or speak something first!'); return; }
    triggerHaptic('medium');
    const improved = await enhanceText(raw, 'listing');
    if (improved) {
      setPrompt(improved);
      appToast.success('✨ Description enhanced!');
      triggerHaptic('success');
    }
  };

  useEffect(() => {
    if (step === 'compose') {
      try {
        const seen = localStorage.getItem('swipess.aiListing.micTip.v2');
        if (!seen) {
          setMicTipOpen(true);
          localStorage.setItem('swipess.aiListing.micTip.v2', '1');
        }
      } catch {
        // ignore
      }
    }
  }, [step]);

  useEffect(() => {
    if (aiListingDraft) {
      setExtras(aiListingDraft);
      if (aiListingDraft.category) setCategory(aiListingDraft.category);
      setStep('compose');
    } else if (aiListingCategory) {
      setCategory(aiListingCategory);
      setStep('compose');
    } else {
      // Show welcome screen only on first-ever open (no draft/category deep-link)
      const hasSeen = localStorage.getItem('hasSeenListingWelcome');
      if (!hasSeen) setStep('welcome');
      else setStep('compose');
    }
  }, [aiListingCategory, aiListingDraft]);

  const initialPathRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== initialPathRef.current && showAIListing) {
      setModal('showAIListing', false);
    }
  }, [location.pathname, showAIListing, setModal]);

  const handleClose = () => {
    setModal('showAIListing', false);
    if (isOnboardingActive) setOnboardingActive(false);
    setTimeout(() => {
      setStep('compose');
      setCategory('property');
      setPrompt('');
      setPrice('');
      setCityLocation('');
      setLocationCountry('');
      setLocationCoords({});
      setImageFiles([]);
      setExtras({});
      setProgressPct(0);
      setProgressPhase('upload');
    }, 300);
  };

  const maxPhotos = category ? (AI_MAX_PHOTOS[category] ?? 10) : 10;

  const handleImageAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const available = maxPhotos - imageFiles.length;
      if (available <= 0) {
        appToast.error('Maximum photos reached');
        return;
      }

      const picked = files.slice(0, available);
      const valid = picked.filter((file) => {
        const result = validateImageFile(file);
        if (!result.isValid) appToast.error('Invalid file', result.error);
        return result.isValid;
      });

      if (valid.length > 0) {
        setImageFiles(prev => [...prev, ...valid]);
        triggerHaptic('light');
      }
    };
    input.click();
  };

  const handleClearAllPhotos = () => {
    if (imageFiles.length === 0) return;
    setImageFiles([]);
    triggerHaptic('medium');
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      triggerHaptic('medium');
      stopVoice();
    } else {
      const success = await startVoice();
      if (success) {
        triggerHaptic('light');
      } else {
        setTimeout(() => appToast.error('Microphone permissions denied or device busy.'), 300);
      }
    }
  };

  const handleProcess = async () => {
    if (!user) {
      appToast.error('Please sign in to publish a listing.');
      return;
    }
    if (!category) {
      appToast.error('Please select a category.');
      return;
    }
    if (imageFiles.length === 0) {
      appToast.error('At least 1 photo is required.');
      return;
    }
    if (!cityLocation?.trim()) {
      appToast.error(t('listings.cityRequiredTitle'), t('listings.cityRequiredAi'));
      return;
    }

    const effectivePrompt = prompt.trim() || buildFallbackPrompt({
      category,
      cityLocation,
      price,
      extras,
    });

    setIsProcessing(true);
    setStep('processing');
    setProgressPhase('upload');
    setProgressPct(8);
    triggerHaptic('medium');

    try {
      // Photo upload and AI extraction are independent — run them in parallel
      // so the user waits for the slower of the two, not the sum of both.
      const uploadPromise = uploadPhotoBatch(
        user.id,
        imageFiles,
        'listing-images',
        (p) => setProgressPct(8 + Math.floor(p * 0.56)),
      );

      const extractPromise: Promise<Record<string, unknown>> = (async () => {
        try {
          const aiPromise = supabase.functions.invoke('ai-listing-extract', {
            body: { task: 'extract', category, price, city: cityLocation, prompt: effectivePrompt },
          });
          const aiTimeout = new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(
              () => resolve({ data: null, error: new Error('AI extract timed out') }),
              15000
            )
          );
          const { data, error } = (await Promise.race([aiPromise, aiTimeout])) as {
            data: unknown;
            error: unknown;
          };
          if (!error) {
            const payload = data as { data?: Record<string, unknown>; error?: string };
            if (payload?.data) return payload.data;
          } else {
            logger.warn('[AIListing] AI extract skipped:', error);
          }
        } catch (aiErr) {
          logger.warn('[AIListing] AI extract failed, publishing with raw prompt', aiErr);
        }
        return {};
      })();

      const [uploadedUrls, parsed] = await Promise.all([uploadPromise, extractPromise]);

      // Block objectionable photos before publishing (Apple Guideline 1.2).
      // assertImageSafe fails OPEN on infra errors and only throws for genuinely
      // unsafe content; the outer catch surfaces the message + returns to compose.
      try {
        await Promise.all(uploadedUrls.map((url) => assertImageSafe(url)));
      } catch (e) {
        const paths = uploadedUrls
          .map((u) => u.split('/listing-images/')[1])
          .filter(Boolean) as string[];
        if (paths.length) {
          await supabase.storage.from('listing-images').remove(paths).catch(() => {});
        }
        throw e;
      }

      setProgressPhase('optimize');
      setProgressPct(72);

      setProgressPhase('publish');

      const finalCity = (parsed.city as string) || cityLocation?.trim();
      if (!finalCity) {
        throw new Error(t('listings.cityRequiredAi'));
      }

      const mapCoords = await resolveListingCoordinates({
        city: finalCity,
        country: (parsed.country as string) || locationCountry || 'Mexico',
        latitude: locationCoords.lat,
        longitude: locationCoords.lng,
      });
      if (!mapCoords) {
        throw new Error(t('listings.locationRequired'));
      }

      // Trust the AI-detected category when valid — the user may describe a
      // motorcycle while the default "property" chip is still selected.
      const validCats = ['property', 'motorcycle', 'bicycle', 'yacht', 'worker'] as const;
      const detected = parsed.category as typeof CATEGORIES[number]['id'];
      const cat = validCats.includes(detected) ? detected : category;
      const numericPrice = (parsed.price as number) || Number(price) || 0;
      const listingPayload: Record<string, unknown> = {
        user_id: user.id,
        owner_id: user.id,
        category: cat,
        listing_type: cat === 'worker' ? 'service' : 'rent',
        // The manual form saves workers as mode 'rent' + listing_type
        // 'service' — match it so the direct insert never hits a constraint.
        mode: 'rent',
        status: 'active',
        title: (parsed.title as string) || buildFallbackTitle({ category: cat, cityLocation, extras }),
        description: (parsed.description as string) || effectivePrompt,
        price: numericPrice,
        currency: 'USD',
        country: (parsed.country as string) || locationCountry || 'Mexico',
        state: finalCity,
        city: finalCity,
        location: finalCity,
        latitude: mapCoords.latitude,
        longitude: mapCoords.longitude,
        images: uploadedUrls,
        image_url: uploadedUrls[0] || null,
      };
      if (cat === 'property') {
        const beds = (extras.beds as number) ?? (parsed.beds as number);
        const baths = (extras.baths as number) ?? (parsed.baths as number);
        const squareFootage = (extras.square_footage as number) ?? (parsed.square_footage as number);
        const propertyType = (extras.property_type as string) ?? (parsed.property_type as string);
        if (beds) listingPayload.beds = beds;
        if (baths) listingPayload.baths = baths;
        if (squareFootage) listingPayload.square_footage = squareFootage;
        if (propertyType) listingPayload.property_type = propertyType;
        if (parsed.furnished === true) listingPayload.furnished = true;
        if (parsed.pet_friendly === true) listingPayload.pet_friendly = true;
        if (Array.isArray(parsed.amenities)) listingPayload.amenities = parsed.amenities;
      }
      if (cat === 'motorcycle' || cat === 'bicycle' || cat === 'yacht') {
        listingPayload.vehicle_type = cat;
        const brand = (extras.brand as string) || (parsed.make as string);
        const model = (extras.model as string) || (parsed.model as string);
        const year = Number(extras.year) || (parsed.year as number);
        if (brand) listingPayload.vehicle_brand = brand;
        if (model) listingPayload.vehicle_model = model;
        if (year) listingPayload.year = year;
        if (parsed.mileage) listingPayload.mileage = parsed.mileage;
        if (parsed.condition) listingPayload.condition = parsed.condition;
        if (cat === 'motorcycle') {
          if (parsed.engine_cc) listingPayload.engine_cc = parsed.engine_cc;
          if (parsed.transmission) listingPayload.transmission = parsed.transmission;
          if (parsed.fuel_type) listingPayload.fuel_type = parsed.fuel_type;
        }
        if (cat === 'yacht') {
          if (parsed.fuel_type) listingPayload.fuel_type = parsed.fuel_type;
          if (parsed.length_m) listingPayload.length_m = parsed.length_m;
          if (parsed.berths) listingPayload.berths = parsed.berths;
          if (parsed.max_passengers) listingPayload.max_passengers = parsed.max_passengers;
        }
      }
      if (cat === 'worker') {
        const sc = (extras.service_category as string) || (parsed.service_category as string) || '';
        if (sc) listingPayload.service_category = sc;
        if (parsed.pricing_unit) listingPayload.pricing_unit = parsed.pricing_unit;
        if (parsed.experience_years) listingPayload.experience_years = parsed.experience_years;
        if (Array.isArray(parsed.skills) && parsed.skills.length) listingPayload.skills = parsed.skills;
      }

      setProgressPct(90);

      const catLabel = CATEGORIES.find(c => c.id === cat)?.label || cat;
      try {
        // Publish directly — the user asked the AI to BUILD the listing, so
        // save it live and show it, no manual verification detour.
        const listing = await saveListingWithSchemaRetry(listingPayload, null);

        setProgressPhase('redirect');
        setProgressPct(100);
        triggerHaptic('success');
        appToast.success(`✨ Your ${catLabel} listing is live!`, 'Opening it now…');

        if (listing?.id) {
          queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
          queryClient.invalidateQueries({ queryKey: ['listings'] });
        }

        if (isOnboardingActive) setOnboardingActive(false);
        handleClose();
        setTimeout(() => {
          navigate('/owner/properties', { replace: true });
          if (listing?.id) {
            useModalStore.getState().openPropertyDetails(listing.id);
          }
        }, 50);
      } catch (publishErr) {
        // Direct publish failed — fall back to the pre-filled manual form so
        // the user's photos and AI-extracted data aren't lost.
        logger.error('[AIListing] Direct publish failed, falling back to form', publishErr);
        try {
          sessionStorage.setItem('swipess_ai_listing_draft', JSON.stringify({ data: listingPayload, ts: Date.now() }));
        } catch { /* ignore */ }

        setProgressPhase('redirect');
        setProgressPct(100);
        appToast.info('Almost there!', 'We pre-filled your listing — review and tap publish.');
        if (isOnboardingActive) setOnboardingActive(false);
        handleClose();
        setTimeout(() => navigate(`/owner/listings/new?category=${cat}&mode=rent&fromAI=1`, { replace: true }), 50);
      }
    } catch (error) {
      logger.error('AI Listing Publish Error:', error);
      const msg = error instanceof Error ? error.message : 'Something went wrong publishing your listing.';
      appToast.error(msg);
      setStep('compose');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <AnimatePresence>
        {showAIListing && (
        <motion.div
          key="ai-listing-wizard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          className={cn(
            "fixed inset-0 z-[2147483000] modal-scrim flex items-start sm:items-center justify-center p-4 sm:p-6",
            isLight && "modal-scrim--lux"
          )}
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className={cn(
              "w-full max-w-2xl mx-auto h-full sm:h-[90vh] overflow-hidden rounded-[2rem] sm:rounded-[3rem] flex flex-col relative isolate",
              isLight ? "bg-white/70" : "bg-zinc-900/60"
            )}
            style={{
              backdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
              border: isLight ? '0.5px solid rgba(255, 255, 255, 0.6)' : '0.5px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isLight
                ? '0 10px 40px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 rgba(255, 255, 255, 0.8)'
                : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.12)',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          >

            {/* Ambient nexus orbs for depth — mirrors the Magic Profile wizard
                so both AI builders share the same premium glow. */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-[-12%] right-[-12%] w-[60%] h-[60%] bg-gradient-to-tr from-violet-500/20 to-[#6366F1]/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <AnimatePresence>
              {step === 'welcome' && (
                <WizardWelcomeScreen
                  title="AI Listing Builder"
                  description="Snap a photo, say a sentence — and our AI will craft a stunning listing that sells in seconds."
                  onContinue={() => {
                    localStorage.setItem('hasSeenListingWelcome', 'true');
                    setStep('compose');
                  }}
                  onSkip={handleClose}
                />
              )}
            </AnimatePresence>
            <div
              className={cn("shrink-0 flex items-center justify-between px-8 pb-5 border-b relative z-10", headerBorder)}
              style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/15 flex items-center justify-center border border-[#8B5CF6]/25 shadow-inner">
                  <MotionIcon id="ai-sparkle" loop={isProcessing}>
                    <Sparkles className="w-6 h-6 text-[#A5B4FC]" />
                  </MotionIcon>
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-[0.1em] italic bg-clip-text text-transparent" style={{ backgroundImage: NEXUS_GRADIENTS.ai }}>AI Listing Builder</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none", textMuted)}>One-Step Builder</span>
                    <div className="w-1 h-1 rounded-full animate-pulse bg-[#8B5CF6]" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClose}
                aria-label="Close"
                className={cn("w-11 h-11 flex items-center justify-center press-snappy", closeBtnCls)}
              >
                <X className={cn("w-5 h-5", isLight ? "text-black/80" : "text-white/90")} />
              </button>
            </div>

            <ScrollArea className="flex-1 overflow-hidden relative z-10">
              <div className="px-8 pt-8 pb-32">
                <AnimatePresence mode="sync">
                  {step === 'compose' && (
                    <motion.div 
                      key="step-compose"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.08, ease: 'easeOut' }}
                      className="space-y-10"
                    >
                      {/* Onboarding Banner */}
                      {isOnboardingActive && (
                        <div className="bg-[#6366F1]/10 border border-[#8B5CF6]/20 p-5 rounded-3xl mb-6 shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 blur-[50px] rounded-full pointer-events-none" />
                          <h3 className="text-[#A5B4FC] font-black uppercase tracking-widest text-xs mb-1.5 flex items-center gap-2">
                            <MotionIcon id="ai-sparkle" loop>
                              <Sparkles className="w-4 h-4" />
                            </MotionIcon>
                            Great! Now let's create a listing.
                          </h3>
                          <p className={cn("text-xs font-bold leading-relaxed", textPrimary)}>
                            Upload photos and describe what you are looking for or offering. We'll generate a beautiful listing for you automatically.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>1. Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => { setCategory(cat.id); triggerHaptic('light'); }}
                              className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                category === cat.id
                                  ? "bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#8B5CF6] text-white border-transparent shadow-[0_6px_26px_rgba(99,102,241,0.42)] ring-1 ring-white/20"
                                  : chipIdleCls
                              )}
                            >
                              <cat.icon className={cn("w-6 h-6", category === cat.id ? "text-white" : textMuted)} />
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider text-center", category === cat.id ? "text-white" : textPrimary)}>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-2 mr-1">
                          <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>
                            2. Photos ({imageFiles.length}/{maxPhotos})
                          </label>
                          {imageFiles.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllPhotos}
                              className="text-[9px] font-black uppercase tracking-widest text-[#A5B4FC] hover:text-[#C4B5FD] px-2 py-1 rounded-lg border border-[#8B5CF6]/25"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {imageFiles.length === 0 ? (
                          <button
                            type="button"
                            onClick={handleImageAdd}
                            className={cn("w-full aspect-[2/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-[#6366F1]/5 hover:border-[#8B5CF6]/40 transition-all group shadow-inner", photoAddCls)}
                          >
                            <div className={cn("p-3 rounded-2xl border group-hover:bg-[#6366F1]/20 group-hover:border-[#8B5CF6]/30 transition-all", photoAddInnerCls)}>
                              <Camera className="w-6 h-6 text-[#A5B4FC] opacity-70 group-hover:opacity-100" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Tap to add photos</span>
                          </button>
                        ) : (
                          <DraggablePhotoGrid
                            photos={previewUrls}
                            isLight={isLight}
                            onReorder={(newPreviewOrder) => {
                              // Map reordered preview URLs back to the corresponding File objects
                              const reordered = newPreviewOrder.map(
                                (url) => imageFiles[previewUrls.indexOf(url)]
                              ).filter(Boolean) as File[];
                              setImageFiles(reordered);
                            }}
                            onRemove={(index) => setImageFiles(prev => prev.filter((_, idx) => idx !== index))}
                            addSlot={
                              imageFiles.length < maxPhotos ? (
                                <button
                                  type="button"
                                  onClick={handleImageAdd}
                                  className={cn("w-full h-full rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-[#6366F1]/5 hover:border-[#8B5CF6]/40 transition-all group", photoAddCls)}
                                >
                                  <div className={cn("p-3 rounded-2xl border group-hover:bg-[#6366F1]/20 group-hover:border-[#8B5CF6]/30 transition-all", photoAddInnerCls)}>
                                    <Camera className="w-5 h-5 text-[#A5B4FC] opacity-70 group-hover:opacity-100" />
                                  </div>
                                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Add More</span>
                                </button>
                              ) : undefined
                            }
                          />
                        )}

                        {imageFiles.length > 0 && (
                          <p className={cn("text-[10px] font-semibold text-center", textMuted)}>
                            Hold &amp; drag any photo to reorder · First photo is the cover
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>
                          3. {t('listings.locationStep')}
                        </label>
                        <QuickCityPicker
                          value={cityLocation}
                          placeholder={t('listings.quickCitySearch')}
                          inputClassName={inputCls}
                          onSelect={({ city, country, latitude, longitude }) => {
                            setCityLocation(city);
                            setLocationCountry(country);
                            setLocationCoords({
                              lat: latitude,
                              lng: longitude,
                            });
                          }}
                        />
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest ml-2", textMuted)}>
                          {t('listings.locationHint')}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-2">
                           <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>4. Description</label>
                           <button
                             type="button"
                             onClick={handleEnhance}
                             disabled={!prompt.trim() || isEnhancing}
                             className={cn(
                               "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95",
                               prompt.trim() && !isEnhancing
                                 ? "bg-[#6366F1]/12 border-[#8B5CF6]/30 text-[#A5B4FC] hover:bg-[#6366F1]/20"
                                 : cn("cursor-not-allowed", enhanceDisabledCls)
                             )}
                           >
                             {isEnhancing ? (
                               <PremiumSpinner className="w-3 h-3" />
                             ) : (
                               <Wand2 className="w-3 h-3" />
                             )}
                             {isEnhancing ? 'Enhancing...' : '✨ Improve Description'}
                           </button>
                        </div>

                        <div className="relative group">
                          <Popover open={micTipOpen} onOpenChange={setMicTipOpen}>
                            <PopoverTrigger asChild>
                              <div className="absolute right-4 top-4 z-10 flex items-center justify-center">
                                {isRecording && (
                                  <motion.div
                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] blur-md pointer-events-none"
                                    animate={{
                                      scale: 1 + (micVolume / 255) * 1.5,
                                      opacity: 0.4 + (micVolume / 255) * 0.6
                                    }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                                  />
                                )}
                                <button
                                  onClick={handleVoiceToggle}
                                  className={cn(
                                    "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl overflow-hidden",
                                    isRecording
                                      ? "bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_30px_rgba(139,92,246,0.55)] scale-110"
                                      : isLight
                                        ? "bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:scale-105"
                                        : "bg-[#1c1c22] hover:bg-[#26262e] border border-white/15 hover:scale-105"
                                  )}
                                >
                                  {!isRecording && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  {isRecording ? (
                                    <Mic className="w-5 h-5 relative z-10 text-white animate-pulse" />
                                  ) : (
                                    <Mic className={cn("w-5 h-5 relative z-10", isLight ? "text-black/70" : "text-white")} />
                                  )}
                                </button>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              sideOffset={12}
                              className={cn(
                                "w-72 p-4 rounded-2xl border border-[#8B5CF6]/30 text-white shadow-2xl",
                                isLight ? "bg-white text-black chrome-solid border-[#8B5CF6]/20" : "bg-[#141418] border-white/12"
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AudioLines className="w-4 h-4 text-[#A5B4FC]" />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-[#A5B4FC]">Voice to Text</span>
                                </div>
                                <p className={cn("text-[12px] leading-relaxed", isLight ? "text-black/80" : "text-white/90")}>
                                  Tap to describe your listing out loud. The visualizer reacts to your voice!
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <div className="relative">
                            <Search className="absolute left-5 top-5 w-4 h-4 text-[#A5B4FC] opacity-90" />
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Describe your listing or just tap publish. E.g. 'Stunning ocean view property with private pool'..."
                              className={cn("w-full h-32 p-5 pl-14 pr-16 rounded-[2rem] transition-all text-sm leading-relaxed resize-none italic outline-none focus:ring-1 focus:ring-[#8B5CF6]/30", inputCls)}
                            />
                            {isRecording && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 rounded-[2rem] border border-[#8B5CF6]/50 z-20 overflow-hidden">
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/20 to-[#8B5CF6]/20 mix-blend-overlay"
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                                <div className="flex items-center gap-2 mb-3 relative z-10">
                                  <Mic className="w-6 h-6 text-white animate-pulse" />
                                  <span className="text-sm font-black uppercase tracking-widest text-white">Listening...</span>
                                </div>
                                <div className="flex gap-1 items-end h-8 relative z-10">
                                  {[...Array(12)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 bg-gradient-to-t from-[#06B6D4] to-[#8B5CF6] rounded-full"
                                      animate={{
                                        height: isRecording ? Math.max(4, (micVolume / 255) * 32 * (Math.random() * 0.5 + 0.5)) : 4
                                      }}
                                      transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                                    />
                                  ))}
                                </div>
                                {interimTranscript ? (
                                  <p className="mt-3 px-6 max-h-24 overflow-hidden text-center text-sm font-semibold text-white leading-snug relative z-10 line-clamp-3">
                                    {interimTranscript}
                                  </p>
                                ) : (
                                  <p className="mt-3 text-[10px] font-bold text-white/70 uppercase tracking-widest relative z-10">Speak — your words appear live</p>
                                )}
                              </div>
                            )}
                            {isTranscribing && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35 rounded-[2rem]">
                                <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-full border border-[#8B5CF6]/30 shadow-2xl">
                                  <PremiumSpinner className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A5B4FC]">Transcribing...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 px-1 pb-10 space-y-4">
                        <p className={cn("text-[10px] font-bold text-center uppercase tracking-widest opacity-50 px-4", isLight ? "text-black" : "text-white")}>
                          By continuing, your data is securely sent to OpenAI for processing to generate your listing. See our Legal Hub for privacy details.
                        </p>
                        <Button
                          onClick={handleProcess}
                          disabled={isProcessing || imageFiles.length === 0 || !cityLocation.trim()}
                          className={cn(
                            "w-full h-16 rounded-[2.5rem] bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#8B5CF6] text-white hover:brightness-110 font-black uppercase tracking-[0.3em] text-[12px] transition-all shadow-[0_20px_60px_-10px_rgba(99,102,241,0.5)]",
                            "disabled:opacity-40 disabled:saturate-50 disabled:shadow-none disabled:cursor-not-allowed"
                          )}
                        >
                          {isProcessing ? (
                            <>
                              <PremiumSpinner className="w-5 h-5 mr-4" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <MotionIcon id="ai-sparkle" className="mr-4">
                                <Zap className="w-5 h-5" />
                              </MotionIcon>
                              Create Listing
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'processing' && (
                    <motion.div 
                      key="step-processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center space-y-10 py-20"
                    >
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className={cn(isLight ? "text-black/10" : "text-white/10")} />
                          <motion.circle
                            cx="50" cy="50" r="44"
                            stroke="#6366F1" strokeWidth="6" fill="none"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 44}
                            initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - progressPct / 100) }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <MotionIcon id="ai-sparkle" loop>
                            <Sparkles className="w-8 h-8 text-[#A5B4FC]" />
                          </MotionIcon>
                          <span className={cn("text-2xl font-black tabular-nums", textPrimary)}>{Math.round(progressPct)}%</span>
                        </div>
                      </div>

                      <div className="text-center space-y-3">
                        <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", textPrimary)}>
                          {progressPhase === 'upload' && 'Uploading photos'}
                          {progressPhase === 'optimize' && 'Polishing description'}
                          {progressPhase === 'publish' && 'Publishing listing'}
                          {progressPhase === 'redirect' && 'Opening your listing'}
                        </h3>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {(['upload','optimize','publish','redirect'] as ProgressPhase[]).map((p) => (
                            <span
                              key={p}
                              className={cn(
                                'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border',
                                progressPhase === p
                                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white border-transparent'
                                  : isLight ? 'border-slate-200 text-black/60' : 'border-white/10 text-white/80'
                              )}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
  );
}
