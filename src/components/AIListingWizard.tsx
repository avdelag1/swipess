import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bike, Briefcase, Building2, Camera,
  Mic, Search, Sparkles, Wand2, X, Zap
} from 'lucide-react';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appToast } from '@/utils/appNotification';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useQueryClient } from '@tanstack/react-query';
import { saveListingWithSchemaRetry } from '@/utils/listingSave';
import { logger } from '@/utils/prodLogger';

type WizardStep = 'compose' | 'processing';
type ProgressPhase = 'upload' | 'optimize' | 'publish' | 'redirect';

const CATEGORIES = [
  { id: 'property', label: 'Property', icon: Building2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'motorcycle', label: 'Motorcycle', icon: MotorcycleIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'text-purple-400', bg: 'bg-purple-400/10' },
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
  if (cat === 'motorcycle' || cat === 'bicycle') {
    const brand = (extras.brand as string) || '';
    const year = (extras.year as string) || '';
    const label = cat === 'motorcycle' ? 'Motorcycle' : 'Bicycle';
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
  if (cat === 'motorcycle' || cat === 'bicycle') {
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

  const modalBg = isLight 
    ? 'bg-white/90 backdrop-blur-3xl saturate-150 border-black/10' 
    : 'bg-[#050505]/70 backdrop-blur-[40px] saturate-150 border-t-white/30 border-l-white/20 border-r-white/5 border-b-black';
  const headerBorder = isLight ? 'border-black/10' : 'border-white/10';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/80' : 'text-white/80';
  const inputCls = isLight
    ? 'bg-white/80 backdrop-blur-md border-2 border-black/15 focus:border-rose-500 focus:ring-0 text-black placeholder:text-black/50 font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    : 'bg-black/40 backdrop-blur-md border border-t-white/20 border-l-white/10 border-r-white/5 border-b-transparent focus:border-rose-400 focus:ring-0 text-white placeholder:text-white/50 font-medium shadow-inner';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-black/5 rounded-2xl transition-all border border-black/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
    : 'bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-t-white/30 border-l-white/20 border-r-white/5 border-b-transparent shadow-lg';
  
  const [step, setStep] = useState<WizardStep>('compose');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id'] | null>('property');
  const [prompt, setPrompt] = useState('');
  const [price, setPrice] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extras, setExtras] = useState<Record<string, unknown>>({});
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>('upload');
  const [progressPct, setProgressPct] = useState(0);
  const { isRecording, isTranscribing, interimTranscript, start: startVoice, stop: stopVoice } = useVoiceTranscribe({
    onStop: (text) => {
      if (text) setPrompt(prev => prev ? `${prev} ${text}` : text);
    }
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
      setImageFiles([]);
      setExtras({});
      setProgressPct(0);
      setProgressPhase('upload');
    }, 300);
  };

  const handleImageAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      setImageFiles(prev => [...prev, ...files]);
    };
    input.click();
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
      setProgressPhase('optimize');
      setProgressPct(72);

      setProgressPhase('publish');
      // Trust the AI-detected category when valid — the user may describe a
      // motorcycle while the default "property" chip is still selected.
      const validCats = ['property', 'motorcycle', 'bicycle', 'worker'] as const;
      const detected = parsed.category as typeof CATEGORIES[number]['id'];
      const cat = validCats.includes(detected) ? detected : category;
      const numericPrice = (parsed.price as number) || Number(price) || 0;
      const finalCity = (parsed.city as string) || cityLocation || 'Unknown';
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
        country: 'Mexico',
        state: finalCity,
        city: finalCity,
        location: finalCity,
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
      if (cat === 'motorcycle' || cat === 'bicycle') {
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
        setTimeout(() => navigate('/owner/properties', { replace: true }), 50);
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

  if (!showAIListing) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[2147483000] backdrop-blur-2xl flex items-start sm:items-center justify-center p-0 sm:p-6",
            isLight ? "bg-white/40" : "bg-black/50"
          )}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className={cn(
              "w-full max-w-2xl mx-auto h-[100dvh] sm:h-[90vh] overflow-hidden rounded-none sm:rounded-[3rem] border-0 sm:border flex flex-col relative",
            isLight ? "shadow-[0_40px_100px_rgba(0,0,0,0.2)]" : "shadow-[0_40px_100px_rgba(255,255,255,0.05)] shadow-2xl",
            modalBg
            )}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-600/5 blur-[150px] rounded-full" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-600/5 blur-[120px] rounded-full" />
            </div>

            <div className={cn("shrink-0 flex items-center justify-between px-8 py-6 border-b relative z-10", headerBorder)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
                  <Sparkles className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h2 className={cn("text-base font-black uppercase tracking-[0.1em] italic", textPrimary)}>Magic AI Creation</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none">One-Step Builder</span>
                    <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className={cn("w-11 h-11 flex items-center justify-center", closeBtnCls)}
              >
                <X className={cn("w-5 h-5", isLight ? "text-black/80" : "text-white/90")} />
              </button>
            </div>

            <ScrollArea className="flex-1 overflow-hidden relative z-10">
              <div className="px-8 pt-8 pb-32">
                <AnimatePresence mode="wait">
                  {step === 'compose' && (
                    <motion.div 
                      key="step-compose"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      {/* Onboarding Banner */}
                      {isOnboardingActive && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl mb-6 shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none" />
                          <h3 className="text-rose-400 font-black uppercase tracking-widest text-xs mb-1.5 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
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
                                  ? "bg-gradient-to-br from-[#FF4D00] to-[#EB4898] text-white border-transparent shadow-[0_4px_25px_rgba(255,77,0,0.4)] ring-1 ring-white/20"
                                  : isLight ? "bg-black/5 border-black/10 hover:border-rose-500/30" : "bg-white/5 border border-t-white/30 border-l-white/10 border-r-white/5 border-b-transparent hover:border-white/40 shadow-inner"
                              )}
                            >
                              <cat.icon className={cn("w-6 h-6", category === cat.id ? "text-white" : textMuted)} />
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider text-center", category === cat.id ? "text-white" : textPrimary)}>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>2. Photos</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <AnimatePresence>
                            {imageFiles.map((_file, i) => (
                              <motion.div
                                key={`file-${i}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn("aspect-square rounded-3xl overflow-hidden border relative group shadow-2xl", isLight ? "border-black/10" : "border-white/10")}
                              >
                                <img src={previewUrls[i]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <button 
                                  onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <button
                            onClick={handleImageAdd}
                            className={cn("aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-rose-500/5 hover:border-rose-500/40 transition-all group shadow-inner", isLight ? "border-black/15 bg-black/5" : "border-white/20 bg-white/5")}
                          >
                            <div className={cn("p-3 rounded-2xl border group-hover:bg-rose-500/20 group-hover:border-rose-400/30 transition-all", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5")}>
                              <Camera className="w-6 h-6 text-rose-400 opacity-70 group-hover:opacity-100" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Add Photos</span>
                          </button>
                        </div>
                      </div>


                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-2">
                           <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>3. Description</label>
                           <button
                             type="button"
                             onClick={handleEnhance}
                             disabled={!prompt.trim() || isEnhancing}
                             className={cn(
                               "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95",
                               prompt.trim() && !isEnhancing
                                 ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                                 : "opacity-40 bg-white/5 border-white/10 text-white/70 cursor-not-allowed"
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
                              <button
                                onClick={handleVoiceToggle}
                                className={cn(
                                  "absolute right-4 top-4 w-10 h-10 z-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl overflow-hidden",
                                  isRecording 
                                    ? "bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-110 animate-pulse" 
                                    : "bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-105"
                                )}
                              >
                                {isRecording ? (
                                  <motion.div 
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                <Mic className={cn("w-5 h-5 relative z-10", isRecording ? "text-white animate-pulse" : "text-white")} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              sideOffset={12}
                              className="w-72 p-4 rounded-2xl border border-rose-500/30 bg-black/95 text-white shadow-2xl backdrop-blur-xl"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Mic className="w-4 h-4 text-rose-400" />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">Voice to Text</span>
                                </div>
                                <p className="text-[12px] leading-relaxed text-white">
                                  Tap the mic and describe your listing out loud. Tap again to stop.
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <div className="relative">
                            <Search className="absolute left-5 top-5 w-4 h-4 text-rose-400 opacity-90" />
                            <textarea
                              value={isRecording && interimTranscript ? (prompt ? prompt + ' ' + interimTranscript : interimTranscript) : prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder={isRecording ? "Listening..." : "Describe your listing or just tap publish. E.g. 'Stunning ocean view property with private pool'..."}
                              className={cn("w-full h-32 p-5 pl-14 pr-16 rounded-[2rem] transition-all text-sm leading-relaxed resize-none italic outline-none focus:ring-1 focus:ring-rose-500/30", inputCls)}
                            />
                            {isTranscribing && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2rem]">
                                <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-full border border-rose-500/30 shadow-2xl">
                                  <PremiumSpinner className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Transcribing...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 px-1 pb-10">
                        <Button
                          onClick={handleProcess}
                          disabled={isProcessing || imageFiles.length === 0}
                          className="w-full h-16 rounded-[2.5rem] bg-gradient-to-br from-[#FF4D00] to-[#EB4898] text-white hover:brightness-110 font-black uppercase tracking-[0.3em] text-[12px] transition-all shadow-[0_20px_60px_rgba(255,77,0,0.3)] disabled:opacity-30"
                        >
                          {isProcessing ? (
                            <>
                              <PremiumSpinner className="w-5 h-5 mr-4" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-4 active:scale-125 transition-transform" />
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
                            stroke="#e11d48" strokeWidth="6" fill="none"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 44}
                            initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - progressPct / 100) }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn("text-3xl font-black tabular-nums", textPrimary)}>{Math.round(progressPct)}%</span>
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
                                  ? 'bg-rose-600 text-white border-transparent'
                                  : isLight ? 'border-black/10 text-black/60' : 'border-white/10 text-white/80'
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
      </AnimatePresence>
    </>
  );
}
