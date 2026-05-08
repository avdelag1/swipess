import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, ChevronRight, 
  Check, Loader2, Wand2, ArrowLeft, Camera,
  Building2, Bike, Briefcase, Zap, DollarSign, MapPin, Search, Mic, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type WizardStep = 'category' | 'photos' | 'details' | 'processing';
type ProgressPhase = 'upload' | 'optimize' | 'publish' | 'redirect';

const CATEGORIES = [
  { id: 'property', label: 'Property', icon: Building2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'motorcycle', label: 'Motorcycle', icon: MotorcycleIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'worker', label: 'Job / Service', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/10' },
] as const;


export function AIListingWizard() {
  const { showAIListing, aiListingCategory, aiListingDraft, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Theme-aware class helpers
  const modalBg = isLight ? 'bg-white border-black/10' : 'bg-black border-white/10';
  const headerBorder = isLight ? 'border-black/8' : 'border-white/5';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/50' : 'text-white/50';
  const textSubtle = isLight ? 'text-black/30' : 'text-white/30';
  const inputCls = isLight
    ? 'bg-white border border-black/10 focus:border-cyan-500/50 focus:ring-0 text-black placeholder:text-black/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    : 'bg-white/5 border border-white/5 focus:border-cyan-500/50 focus:ring-0 text-white placeholder:text-white/10';
  const cardCls = isLight
    ? 'bg-white border-black/8 hover:border-cyan-500/40 hover:bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
    : 'bg-black/40 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]';
  const reviewCardCls = isLight ? 'border-black/8 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]' : 'border-white/5 bg-white/5 backdrop-blur-xl';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-black/5 rounded-2xl transition-all border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
    : 'bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5';
  const dividerCls = isLight ? 'bg-black/10' : 'bg-white/10';
  
  const [step, setStep] = useState<WizardStep>('category');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id'] | null>(null);
  const [prompt, setPrompt] = useState('');
  const [price, setPrice] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extras, setExtras] = useState<Record<string, unknown>>({});
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>('upload');
  const [progressPct, setProgressPct] = useState(0);
  const { isRecording, isTranscribing, start: startVoice, stop: stopVoice } = useVoiceTranscribe();
  const [micTipOpen, setMicTipOpen] = useState(false);

  // Auto-open mic instructions the first time a user hits the details step
  useEffect(() => {
    if (step !== 'details') return;
    try {
      const seen = localStorage.getItem('swipess.aiListing.micTip.v1');
      if (!seen) {
        setMicTipOpen(true);
        localStorage.setItem('swipess.aiListing.micTip.v1', '1');
      }
    } catch {
      // ignore
    }
  }, [step]);

  useEffect(() => {
    if (aiListingDraft) {
      setExtras(aiListingDraft);
      if (aiListingDraft.category) setCategory(aiListingDraft.category);
      setStep('photos');
    } else if (aiListingCategory) {
      setCategory(aiListingCategory);
      setStep('photos');
    }
  }, [aiListingCategory, aiListingDraft]);

  // Close modal automatically when user navigates to another page (skip initial mount)
  const initialPathRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== initialPathRef.current && showAIListing) {
      setModal('showAIListing', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleClose = () => {
    setModal('showAIListing', false);
    setTimeout(() => {
      setStep('category');
      setCategory(null);
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
      const text = await stopVoice();
      if (text) {
        setPrompt(prev => prev ? `${prev} ${text}` : text);
        toast.success('Intel Received', { description: 'Speech synthesized to text.' });
      }
    } else {
      const success = await startVoice();
      if (success) triggerHaptic('light');
    }
  };

  const handleProcess = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you are listing');
      return;
    }
    if (!user) {
      toast.error('Please sign in to publish a listing.');
      return;
    }
    if (imageFiles.length === 0) {
      toast.error('At least 1 photo is required');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProgressPhase('upload');
    setProgressPct(8);
    triggerHaptic('medium');

    try {
      // Phase 1 — Upload photos
      const uploadedUrls = await uploadPhotoBatch(user.id, imageFiles, 'listing-images');
      setProgressPct(40);

      // Phase 2 — AI extract + polish
      setProgressPhase('optimize');
      const { data, error } = await supabase.functions.invoke('ai-listing-extract', {
        body: {
          task: 'extract',
          category,
          price,
          city: cityLocation,
          prompt,
        },
      });
      if (error) throw error;
      const payload = data as { data?: Record<string, unknown>; error?: string };
      if (payload?.error) throw new Error(payload.error);
      const parsed = payload?.data;
      if (!parsed) throw new Error('AI returned no data');
      setProgressPct(72);

      // Phase 3 — Publish to DB
      setProgressPhase('publish');
      const cat = category || 'property';
      const numericPrice = (parsed.price as number) || Number(price) || 0;
      const finalCity = (parsed.city as string) || cityLocation || 'Unknown';
      const listingPayload: Record<string, unknown> = {
        owner_id: user.id,
        category: cat,
        listing_type: cat === 'worker' ? 'service' : 'rent',
        mode: cat === 'worker' ? 'service' : 'rent',
        status: 'active',
        is_active: true,
        title: (parsed.title as string) || `New ${cat}`,
        description: (parsed.description as string) || prompt,
        price: numericPrice,
        currency: 'USD',
        country: 'Mexico',
        state: finalCity,
        city: finalCity,
        images: uploadedUrls,
      };
      if (cat === 'property') {
        const beds = (extras.beds as number) ?? (parsed.beds as number);
        const baths = (extras.baths as number) ?? (parsed.baths as number);
        if (beds) listingPayload.beds = beds;
        if (baths) listingPayload.baths = baths;
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
      }
      if (cat === 'worker') {
        const sc = (extras.service_category as string) || '';
        if (sc) listingPayload.service_category = sc;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('listings')
        .insert(listingPayload as never)
        .select()
        .single();
      if (insertErr) throw insertErr;
      setProgressPct(95);

      // Phase 4 — Redirect
      setProgressPhase('redirect');
      setProgressPct(100);
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      triggerHaptic('success');
      toast.success('Listing published');
      const newId = (inserted as { id?: string } | null)?.id;
      handleClose();
      if (newId) {
        setTimeout(() => navigate(`/listing/${newId}`), 150);
      } else {
        setTimeout(() => navigate('/owner/properties'), 150);
      }
    } catch (error) {
      console.error('AI Listing Publish Error:', error);
      const msg = error instanceof Error ? error.message : 'Something went wrong publishing your listing.';
      toast.error(msg);
      setStep('details');
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
            isLight ? "bg-white/40" : "bg-black/80"
          )}
          style={{ paddingBottom: 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px))' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className={cn(
              "w-full max-w-2xl h-full sm:h-[85vh] overflow-hidden sm:rounded-[3rem] border flex flex-col relative",
              isLight ? "shadow-[0_40px_100px_rgba(0,0,0,0.2)]" : "shadow-[0_40px_100px_rgba(0,0,0,1)]",
              modalBg
            )}
          >
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-600/5 blur-[150px] rounded-full" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className={cn("shrink-0 flex items-center justify-between px-8 py-6 border-b relative z-10", headerBorder)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-inner">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className={cn("text-base font-black uppercase tracking-[0.1em] italic", textPrimary)}>Swipess {t('topbar.intelligence')}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none">{t('topbar.autonomousLayer')}</span>
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className={cn("w-11 h-11 flex items-center justify-center", closeBtnCls)}
              >
                <X className={cn("w-5 h-5", isLight ? "text-black/60" : "text-white/70")} />
              </button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 overflow-hidden relative z-10">
              <div className="px-8 pt-8 pb-32">
                <AnimatePresence mode="wait">
                  {step === 'category' && (
                    <motion.div 
                      key="step-category"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="space-y-3">
                        <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>{t('topbar.targetPlatform')}</h3>
                        <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em] max-w-sm", textMuted)}>Select the deployment sector for your new Swipess artifact. flagship intelligence will optimize for the target audience.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setCategory(cat.id);
                              setStep('photos');
                              triggerHaptic('light');
                            }}
                            className={cn(
                              "flex items-center gap-5 p-6 rounded-[2rem] border transition-all active:scale-[0.98] text-left group relative overflow-hidden",
                              cardCls
                            )}
                          >
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner transition-all group-hover:scale-110", cat.bg, isLight ? "border-black/5" : "border-white/5")}>
                              <cat.icon className={cn("w-8 h-8", cat.id === 'motorcycle' ? '' : cat.color)} />
                            </div>
                            <div>
                                <span className={cn("text-base font-black uppercase tracking-wider group-hover:text-cyan-400 transition-colors italic", textPrimary)}>{cat.label}</span>
                                <p className="text-[10px] opacity-50 font-bold uppercase tracking-[0.1em] mt-1">{t('topbar.deployProtocol')}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 'photos' && (
                    <motion.div 
                      key="step-photos"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <button 
                        onClick={() => setStep('category')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Re-target Platform
                      </button>

                      <div className="space-y-4">
                        <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>Visual Proof</h3>
                        <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em]", textMuted)}>Upload high-fidelity imagery of the asset. swipess.appputer vision will extract secondary attributes.</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <AnimatePresence>
                              {imageFiles.map((file, i) => (
                                <motion.div 
                                  key={`file-${i}`}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={cn("aspect-square rounded-3xl overflow-hidden border relative group shadow-2xl", isLight ? "border-black/10" : "border-white/10")}
                                >
                                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                              className={cn("aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-cyan-500/5 hover:border-cyan-500/40 transition-all group shadow-inner", isLight ? "border-black/15" : "border-white/10")}
                            >
                              <div className={cn("p-3 rounded-2xl border group-hover:bg-cyan-500/20 group-hover:border-cyan-400/30 transition-all", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5")}>
                                <Camera className="w-6 h-6 text-cyan-400 opacity-70 group-hover:opacity-100" />
                              </div>
                              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Add Intel</span>
                            </button>
                      </div>

                      <div className="pt-8">
                         <Button
                            onClick={() => { setStep('details'); triggerHaptic('medium'); }}
                            disabled={imageFiles.length === 0}
                            className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl disabled:opacity-20"
                         >
                            Proceed to Intelligence
                            <ChevronRight className="w-4 h-4 ml-3" />
                         </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'details' && (
                    <motion.div 
                      key="step-details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <button 
                        onClick={() => setStep('photos')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Modify Visual Proof
                      </button>

                       <div className="space-y-4">
                        <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>Intel Stream</h3>
                        <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em]", textMuted)}>Describe your listing naturally. Our flagship intelligence will categorize, price, and optimize the narrative automatically.</p>
                      </div>

                      {/* Primary Voice Hub */}
                      <div className="relative group">
                        <div className={cn(
                          "p-8 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all duration-500",
                          isRecording 
                            ? "bg-red-500/10 border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]" 
                            : "bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40"
                        )}>
                          <Popover open={micTipOpen} onOpenChange={setMicTipOpen}>
                            <PopoverTrigger asChild>
                              <button
                                onClick={handleVoiceToggle}
                                className={cn(
                                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative overflow-hidden group",
                                  isRecording ? "bg-red-500 scale-110" : "bg-cyan-500 hover:scale-105"
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
                                <Mic className={cn("w-10 h-10 relative z-10", isRecording ? "text-white animate-pulse" : "text-black")} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              sideOffset={12}
                              className="w-72 p-4 rounded-2xl border border-cyan-500/30 bg-black/95 text-white shadow-2xl backdrop-blur-xl"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Mic className="w-4 h-4 text-cyan-400" />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">How to use</span>
                                </div>
                                <p className="text-[12px] leading-relaxed text-white/85">
                                  Tap the mic and describe your listing out loud — bedrooms, location, price, anything that matters. Tap again to stop and we transcribe instantly. Then hit the wand to polish it, or Initialize Optimization to generate.
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          <div className="text-center space-y-1">
                            <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", isRecording ? "text-red-400" : "text-cyan-400")}>
                              {isRecording ? "TRANSMITTING INTEL..." : "TAP TO DESCRIBE"}
                            </p>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-40", textPrimary)}>
                              {isRecording ? "TALK NATURALLY NOW" : "VOICE-TO-LISTING ACTIVE"}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setMicTipOpen(true); }}
                              className="mx-auto mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all"
                            >
                              <HelpCircle className="w-3 h-3" />
                              How it works
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Market Price</label>
                              <div className="relative">
                                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 opacity-70" />
                                 <input
                                    type="text"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="2,500"
                                    className={cn("w-full h-14 pl-12 pr-6 rounded-2xl text-sm font-bold transition-all uppercase", inputCls)}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>City Node</label>
                              <div className="relative">
                                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 opacity-70" />
                                 <input
                                    type="text"
                                    value={cityLocation}
                                    onChange={(e) => setCityLocation(e.target.value)}
                                    placeholder="Tulum, MX"
                                    className={cn("w-full h-14 pl-12 pr-6 rounded-2xl text-sm font-bold transition-all uppercase", inputCls)}
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Survey Questions (Dynamic) */}
                        <div className="grid grid-cols-2 gap-4">
                           {category === 'property' && (
                              <>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Total Beds</label>
                                    <input
                                       type="number"
                                       onChange={(e) => setExtras((prev) => ({ ...prev, beds: Number(e.target.value) }))}
                                       placeholder="2"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Bathrooms</label>
                                    <input
                                       type="number"
                                       onChange={(e) => setExtras((prev) => ({ ...prev, baths: Number(e.target.value) }))}
                                       placeholder="1"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                              </>
                           )}
                           {(category === 'motorcycle' || category === 'bicycle') && (
                              <>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Brand / Maker</label>
                                    <input
                                       type="text"
                                       onChange={(e) => setExtras((prev) => ({ ...prev, brand: e.target.value }))}
                                       placeholder="Honda / BMW"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Model Year</label>
                                    <input
                                       type="text"
                                       onChange={(e) => setExtras((prev) => ({ ...prev, year: e.target.value }))}
                                       placeholder="2023"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                              </>
                           )}
                           {category === 'worker' && (
                              <div className="col-span-2 space-y-3">
                                 <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Service Field</label>
                                 <input
                                    type="text"
                                    onChange={(e) => setExtras((prev) => ({ ...prev, service_category: e.target.value }))}
                                    placeholder="Web Dev / Electrician / Designer..."
                                    className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                 />
                              </div>
                           )}
                        </div>

                          <div className="flex items-center justify-between ml-2">
                             <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>Manual Override</label>
                          </div>
                          <div className="relative">
                             <Search className="absolute left-5 top-5 w-4 h-4 text-cyan-400 opacity-60" />
                             <textarea
                               value={prompt}
                               onChange={(e) => setPrompt(e.target.value)}
                               placeholder={isRecording ? "Listening to your intel..." : "Voice your description... E.g. 'Stunning ocean view property with private pool'..."}
                               className={cn("w-full h-40 p-5 pl-14 rounded-[2rem] transition-all text-sm leading-relaxed resize-none italic outline-none focus:ring-1 focus:ring-cyan-500/30", inputCls)}
                             />
                             {isTranscribing && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2rem]">
                                 <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-full border border-cyan-500/30 shadow-2xl">
                                   <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Synthesizing...</span>
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>

                      <div className="pt-4 px-1 pb-10">
                        <Button
                          onClick={handleProcess}
                          disabled={!prompt.trim() || isProcessing}
                          className="w-full h-16 rounded-[2.5rem] bg-primary text-primary-foreground hover:brightness-110 font-black uppercase tracking-[0.3em] text-[12px] transition-all shadow-[0_20px_60px_hsl(var(--primary)/0.4)] disabled:opacity-30"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-4 animate-spin" />
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
                      {/* Circular progress */}
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className={cn(isLight ? "text-black/10" : "text-white/10")} />
                          <motion.circle
                            cx="50" cy="50" r="44"
                            stroke="hsl(var(--primary))" strokeWidth="6" fill="none"
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
                                  ? 'bg-primary text-primary-foreground border-transparent'
                                  : isLight ? 'border-black/10 text-black/40' : 'border-white/10 text-white/40'
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
