import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Plus, Image, ChevronRight, 
  Check, Loader2, Wand2, ArrowLeft, Camera,
  Building2, Bike, Briefcase, Zap, DollarSign, MapPin, Search, Mic
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
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { refineWithKimi } from '@/lib/kimi';
import { UnifiedListingForm } from './UnifiedListingForm';

type WizardStep = 'category' | 'photos' | 'details' | 'processing' | 'review';

const CATEGORIES = [
  { id: 'property', label: 'Property', icon: Building2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'motorcycle', label: 'Motorcycle', icon: MotorcycleIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'worker', label: 'Job / Service', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/10' },
] as const;


export function AIListingWizard() {
  const { showAIListing, aiListingCategory, aiListingDraft, setModal } = useModalStore();
  const { theme, isLight } = useAppTheme();
  const isSwipess = theme === 'Swipess-style';
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Theme-aware class helpers
  const modalBg = isLight ? 'bg-white border-black/10' : 'bg-black border-white/10';
  const headerBorder = isLight ? 'border-black/8' : 'border-white/5';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/50' : 'text-white/50';
  const textSubtle = isLight ? 'text-black/30' : 'text-white/30';
  const inputCls = isLight
    ? 'bg-black/5 border border-black/10 focus:border-cyan-500/50 focus:ring-0 text-black placeholder:text-black/20'
    : 'bg-white/5 border border-white/5 focus:border-cyan-500/50 focus:ring-0 text-white placeholder:text-white/10';
  const cardCls = isLight
    ? 'bg-black/5 border-black/10 hover:border-cyan-500/30 hover:bg-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
    : 'bg-black/40 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]';
  const reviewCardCls = isLight ? 'border-black/8 bg-black/5 backdrop-blur-xl' : 'border-white/5 bg-white/5 backdrop-blur-xl';
  const closeBtnCls = isLight
    ? 'bg-black/5 hover:bg-black/10 rounded-2xl transition-all border border-black/8'
    : 'bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5';
  const dividerCls = isLight ? 'bg-black/10' : 'bg-white/10';
  
  const [step, setStep] = useState<WizardStep>('category');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id'] | null>(null);
  const [prompt, setPrompt] = useState('');
  const [price, setPrice] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const { isRecording, isTranscribing, start: startVoice, stop: stopVoice } = useVoiceTranscribe();
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (aiListingDraft) {
      setAiResult(aiListingDraft);
      if (aiListingDraft.category) setCategory(aiListingDraft.category);
      // If we have a draft, we skip details and go straight to review
      // but we might need photos first if they aren't provided
      setStep(imageFiles.length > 0 || aiListingDraft.images?.length > 0 ? 'review' : 'photos');
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
      setImages([]);
      setImageFiles([]);
      setAiResult(null);
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

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    triggerHaptic('medium');
    try {
      // Priority: Use Kimi if key is available, otherwise fallback to existing AI URL
      const refined = await refineWithKimi(prompt);
      
      if (refined !== prompt) {
        setPrompt(refined);
        toast.success('Intel Refined', { description: 'Description optimized by Kimi Intelligence.' });
      } else {
        // Fallback to existing AI logic if Kimi failed or no key
        const AI_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co/functions/v1/ai-concierge';
        const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y2d1eHVqeHdyZ2d1eHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI5MDIsImV4cCI6MjA2MzU3ODkwMn0.-TzSQ-nDho4J6TftVF4RNjbhr5cKbknQxxUT-AaSIJU';
        
        const resp = await fetch(AI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { 
                role: 'system', 
                content: 'You are a professional listing copywriter. Rewrite the following raw spoken input into a professional, high-converting listing description. Keep it concise but persuasive. Do not add placeholders, keep the facts.' 
              },
              { role: 'user', content: prompt }
            ],
          }),
        });

        const data = await resp.json();
        const fallbackRefined = data.choices?.[0]?.message?.content || data.reply || prompt;
        setPrompt(fallbackRefined);
        toast.success('Intel Refined', { description: 'Description optimized by flagship intelligence.' });
      }
      triggerHaptic('success');
    } catch (error) {
      console.error('Refinement Error:', error);
      toast.error('Could not refine text at this moment.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleProcess = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you are listing');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    triggerHaptic('medium');

    try {
      let uploadedUrls: string[] = [];
      if (imageFiles.length > 0 && user) {
        uploadedUrls = await uploadPhotoBatch(user.id, imageFiles, 'listing-images');
      }

      const AI_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co/functions/v1/ai-concierge';
      const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y2d1eHVqeHdyZ2d1eHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI5MDIsImV4cCI6MjA2MzU3ODkwMn0.-TzSQ-nDho4J6TftVF4RNjbhr5cKbknQxxUT-AaSIJU';

      const systemPrompt = `You are an expert real estate and marketplace listing optimizer for Swipess.
      Your goal is to parse user input and create a structured JSON for a listing.
      Category: ${category}
      Base Information: 
      - Price: ${price}
      - Location: ${cityLocation}
      - Narrative: ${prompt}
      
      Return ONLY a JSON object with the following structure (do not include markdown):
      {
        "title": "A catchy title",
        "price": number,
        "description": "Full optimized description",
        "city": "Detected city",
        "category": "${category}",
        ...other category specific fields like beds, baths, year, model
      }`;

      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
        }),
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || data.reply || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiResult({
          ...parsed,
          category,
          images: uploadedUrls,
          price: parsed.price || Number(price) || 0,
          city: parsed.city || cityLocation || 'Tulum'
        });
        setStep('review');
        triggerHaptic('success');
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('AI Processing Error:', error);
      toast.error('Something went wrong with the AI processing.');
      setStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunchForm = () => {
    setShowFinalForm(true);
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
            "fixed inset-0 z-[10000] backdrop-blur-2xl flex items-start sm:items-center justify-center p-0 sm:p-6",
            isLight ? "bg-black/30" : "bg-black/80",
            showFinalForm && "pointer-events-none opacity-0"
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
                            <Mic className={cn("w-10 h-10 text-black relative z-10", isRecording && "animate-pulse")} />
                          </button>
                          
                          <div className="text-center space-y-1">
                            <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", isRecording ? "text-red-400" : "text-cyan-400")}>
                              {isRecording ? "TRANSMITTING INTEL..." : "TAP TO DESCRIBE"}
                            </p>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-40", textPrimary)}>
                              {isRecording ? "TALK NATURALLY NOW" : "VOICE-TO-LISTING ACTIVE"}
                            </p>
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
                                       onChange={(e) => setAiResult((prev: any) => ({ ...prev, beds: Number(e.target.value) }))}
                                       placeholder="2"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Bathrooms</label>
                                    <input
                                       type="number"
                                       onChange={(e) => setAiResult((prev: any) => ({ ...prev, baths: Number(e.target.value) }))}
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
                                       onChange={(e) => setAiResult((prev: any) => ({ ...prev, brand: e.target.value }))}
                                       placeholder="Honda / BMW"
                                       className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>Model Year</label>
                                    <input
                                       type="text"
                                       onChange={(e) => setAiResult((prev: any) => ({ ...prev, year: e.target.value }))}
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
                                    onChange={(e) => setAiResult((prev: any) => ({ ...prev, service_category: e.target.value }))}
                                    placeholder="Web Dev / Electrician / Designer..."
                                    className={cn("w-full h-12 px-6 rounded-xl text-sm font-bold transition-all uppercase", inputCls)}
                                 />
                              </div>
                           )}
                        </div>

                          <div className="flex items-center justify-between ml-2">
                             <label className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>Manual Override / Refinement</label>
                             <div className="flex gap-2">
                               {prompt.trim().length > 10 && (
                                 <button 
                                   onClick={handleRefinePrompt}
                                   disabled={isRefining}
                                   className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                 >
                                   {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                   Refine Intel
                                 </button>
                               )}
                             </div>
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
                          className="w-full h-18 rounded-[2.5rem] bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.3em] text-[12px] transition-all shadow-[0_20px_60px_rgba(34,211,238,0.4)] disabled:opacity-20"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-4 animate-spin" />
                              Synchronizing Array...
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-4 active:scale-125 transition-transform" />
                              Initialize Optimization
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
                      className="h-full flex flex-col items-center justify-center space-y-16 py-20"
                    >
                      <div className="relative scale-125">
                        <motion.div 
                           className="absolute inset-[-40px] border border-cyan-500/20 rounded-[4rem]" 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div 
                           className="absolute inset-[-20px] border border-indigo-500/20 rounded-[3rem]" 
                           animate={{ rotate: -360 }}
                           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="w-32 h-32 rounded-[3.5rem] border-2 border-cyan-500/40 flex items-center justify-center relative bg-black shadow-[0_0_80px_rgba(34,211,238,0.2)]">
                          <Wand2 className="w-12 h-12 text-cyan-400" />
                          <motion.div 
                             className="absolute inset-0 border-2 border-cyan-400 rounded-[3.5rem]" 
                             animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                             transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-4">
                         <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", textPrimary)}>Manifesting Intel</h3>
                         <div className="flex flex-col gap-2 items-center">
                            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em]">Neural Synthesis Active</span>
                            <div className="flex items-center gap-4">
                               <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-white/10" />
                               <span className={cn("text-[9px] font-bold uppercase tracking-[0.4em]", textSubtle)}>Flagship Intelligence</span>
                               <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-white/10" />
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'review' && (
                    <motion.div 
                      key="step-review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="space-y-3">
                        <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>Target Manifested</h3>
                        <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em]", textMuted)}>Autonomous refinement complete. Validate the synthesized data before final deployment.</p>
                      </div>

                      <div className={cn(
                        "p-8 rounded-[3rem] border relative group overflow-hidden shadow-2xl",
                        reviewCardCls,
                      )}>
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                           <Check className="w-10 h-10 text-cyan-400" />
                        </div>

                        <div className="space-y-6 relative z-10">
                           <div className="space-y-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Optimized Title</span>
                             <p className={cn("text-xl font-black italic leading-tight", textPrimary)}>{aiResult?.title}</p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-1">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Price Node</span>
                                 <p className={cn("text-2xl font-black italic", textPrimary)}>${aiResult?.price?.toLocaleString()}</p>
                               </div>
                               <div className="space-y-1 text-right">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Geo Location</span>
                                 <p className={cn("text-base font-bold uppercase italic", textPrimary)}>{aiResult?.city || 'Tulum'}</p>
                               </div>
                           </div>

                           <div className={cn("h-px", dividerCls)} />

                           <div className="space-y-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Syndicated Narrative</span>
                             <div className="max-h-32 overflow-y-auto Swipess-scroll pr-2">
                                <p className={cn("text-xs leading-relaxed italic", textMuted)}>{aiResult?.description}</p>
                             </div>
                           </div>
                        </div>
                        
                        {/* Status Bar */}
                        <div className={cn("mt-8 pt-6 border-t flex items-center justify-between", headerBorder)}>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", textMuted)}>Market Ready</span>
                           </div>
                           <span className={cn("text-[9px] font-black uppercase tracking-widest", textMuted)}>v4.0.0 Sentinel</span>
                        </div>
                      </div>

                      <div className="pt-4 space-y-4">
                        <Button
                          onClick={handleLaunchForm}
                          className="w-full h-20 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] text-[13px] transition-all shadow-[0_30px_70px_rgba(79,70,229,0.45)] group"
                        >
                          Deploy to Swipess
                          <ChevronRight className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <button 
                           onClick={() => setStep('details')}
                           className={cn("w-full py-4 text-[10px] font-black uppercase tracking-widest hover:text-cyan-400 transition-all italic", textSubtle)}
                        >
                           Recalibrate Intelligence
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showFinalForm && aiResult && (
        <UnifiedListingForm
          isOpen={showFinalForm}
          onClose={() => {
            setShowFinalForm(false);
            handleClose();
          }}
          editingProperty={{
            ...aiResult,
            mode: 'rent'
          }}
        />
      )}
    </>
  );
}
