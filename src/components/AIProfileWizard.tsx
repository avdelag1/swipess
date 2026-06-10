import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ChevronRight, Loader2, Mic, Search, Sparkles, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOnboardingStore } from '@/state/onboardingStore';

type Step = 'compose' | 'processing';
type Mode = 'client' | 'owner';

export function AIProfileWizard() {
  const { showAIProfile, aiProfileMode, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const { isOnboardingActive, setOnboardingActive } = useOnboardingStore();
  const { openAIListing } = useModalStore();
  const mode: Mode = (aiProfileMode || 'client');

  const [step, setStep] = useState<Step>('compose');
  const [narrative, setNarrative] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const { isRecording, isTranscribing, start: startVoice, stop: stopVoice } = useVoiceTranscribe();
  const { enhanceText, isEnhancing } = useAIEnhanceText();
  const [micTipOpen, setMicTipOpen] = useState(false);

  const handleEnhanceNarrative = async () => {
    const raw = narrative.trim();
    if (!raw || raw.length < 10) { appToast.error('Write a bit more first!'); return; }
    triggerHaptic('medium');
    try {
      const improved = await enhanceText(raw, 'profile');
      if (improved) {
        setNarrative(improved);
        appToast.success('✨ Description improved!');
        triggerHaptic('success');
      }
    } catch (err) {
      console.warn('[AIProfileEnhance] failed', err);
    }
  };

  const initialOpen = useRef(showAIProfile);
  useEffect(() => {
    if (showAIProfile && !initialOpen.current) {
      setStep('compose'); 
      setNarrative(''); 
      setImageFiles([]);
    }
    initialOpen.current = showAIProfile;
  }, [showAIProfile]);

  if (!showAIProfile) return null;

  const modalBg = isLight ? 'bg-white border-black/10' : 'bg-black border-white/10';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/50' : 'text-white/50';
  const inputCls = isLight
    ? 'bg-white border border-black/10 focus:border-rose-500/50 focus:ring-0 text-black placeholder:text-black/30'
    : 'bg-white/[0.08] border border-white/15 focus:border-rose-500/50 focus:ring-0 text-white placeholder:text-white/40';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-black/5 border border-black/10'
    : 'bg-white/5 hover:bg-white/10 border border-white/5';

  const handleClose = () => {
    setModal('showAIProfile', false);
    if (isOnboardingActive) setOnboardingActive(false);
    setTimeout(() => {
      setStep('compose');
      setNarrative('');
      setImageFiles([]);
      setProgressPct(0);
    }, 300);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      triggerHaptic('medium');
      const text = await stopVoice();
      if (text) setNarrative(prev => prev ? `${prev} ${text}` : text);
    } else {
      const ok = await startVoice();
      if (ok) triggerHaptic('light');
    }
  };

  const handleImageAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      setImageFiles(files.slice(0, 1));
    };
    input.click();
  };

  const handleProcess = async () => {
    if (!user) { appToast.error('Not signed in'); return; }
    if (imageFiles.length === 0) {
      appToast.error('Add one photo to continue.');
      return;
    }
    if (narrative.trim().length < 10) {
      appToast.error('Tell me a bit more about yourself first.');
      return;
    }
    
    setIsProcessing(true);
    setStep('processing');
    setProgressPct(10);
    triggerHaptic('medium');

    try {
      // 1. Upload photos
      const urls = await uploadPhotoBatch(user.id, imageFiles, 'profile-images', (p) => {
        setProgressPct(10 + Math.floor(p * 0.3));
      });
      setProgressPct(40);

      // 2. Extract profile
      const { data, error } = await supabase.functions.invoke('ai-profile-extract', {
        body: { mode, narrative },
      });
      if (error) throw error;
      const draft = (data as any)?.profile || {};
      setProgressPct(70);

      // 3. Save profile
      if (mode === 'client') {
        const payload: any = {
          user_id: user.id,
          name: draft.name || null,
          age: draft.age || null,
          gender: draft.gender || null,
          bio: draft.bio || null,
          city: draft.city || null,
          neighborhood: draft.neighborhood || null,
          country: draft.country || null,
          nationality: draft.nationality || null,
          occupation: draft.occupation || null,
          relationship_status: draft.relationship_status || null,
          smoking_habit: draft.smoking_habit || null,
          drinking_habit: draft.drinking_habit || null,
          languages: draft.languages || [],
          interests: draft.interests || [],
          intentions: draft.intentions || [],
          profile_images: urls,
          updated_at: new Date().toISOString(),
        };
        // Retry loop for client_profiles upsert to handle missing columns
        let retryCount = 0;
        let success = false;
        let lastErr: any = null;

        while (retryCount < 3 && !success) {
          const { error: upsertErr } = await supabase
            .from('client_profiles')
            .upsert(payload, { onConflict: 'user_id' });
          
          if (upsertErr) {
            lastErr = upsertErr;
            if (upsertErr.code === 'PGRST204' || upsertErr.code === '42703') {
              const match = upsertErr.message.match(/column "([^"]+)"/);
              if (match && match[1]) {
                const badCol = match[1];
                console.warn(`[AIProfileWizard] Column ${badCol} missing in client_profiles, stripping and retrying...`);
                delete payload[badCol];
                retryCount++;
                continue;
              }
            }
            throw upsertErr;
          }
          success = true;
        }

        if (!success && lastErr) throw lastErr;
        
        await supabase.from('profiles').update({
          full_name: payload.name,
          age: payload.age,
          bio: payload.bio,
          city: payload.city,
          avatar_url: urls[0] || null,
          images: urls,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      } else {
        const payload: any = {
          user_id: user.id,
          business_name: draft.business_name || null,
          business_description: draft.business_description || null,
          business_location: draft.business_location || null,
          contact_email: draft.contact_email || null,
          contact_phone: draft.contact_phone || null,
          service_offerings: draft.service_offerings || [],
          profile_images: urls,
          updated_at: new Date().toISOString(),
        };
        // Retry loop for owner_profiles upsert to handle missing columns
        let retryCount = 0;
        let success = false;
        let lastErr: any = null;

        while (retryCount < 3 && !success) {
          const { error: upsertErr } = await supabase
            .from('owner_profiles')
            .upsert(payload, { onConflict: 'user_id' });
            
          if (upsertErr) {
            lastErr = upsertErr;
            if (upsertErr.code === 'PGRST204' || upsertErr.code === '42703') {
              const match = upsertErr.message.match(/column "([^"]+)"/);
              if (match && match[1]) {
                const badCol = match[1];
                console.warn(`[AIProfileWizard] Column ${badCol} missing in owner_profiles, stripping and retrying...`);
                delete payload[badCol];
                retryCount++;
                continue;
              }
            }
            throw upsertErr;
          }
          success = true;
        }

        if (!success && lastErr) throw lastErr;
        
        await supabase.from('profiles').update({
          full_name: payload.business_name,
          bio: payload.business_description,
          avatar_url: urls[0] || null,
          images: urls,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }
      
      setProgressPct(100);
      triggerHaptic('success');
      appToast.success('Profile created successfully!');
      if (isOnboardingActive) {
        setModal('showAIProfile', false);
        openAIListing('property');
      } else {
        handleClose();
      }
    } catch (err: any) {
      console.error('Process failed', err);
      appToast.error('Could not create your profile. Try again.');
      setStep('compose');
    } finally {
      setIsProcessing(false);
    }
  };

  const placeholder = "e.g. I'm Maria, 28, designer. Looking for a 2-bedroom in Tulum under $1500. I also have a small beachfront condo I host sometimes. Pet-friendly, English & Spanish.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-600/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-600/5 blur-[120px] rounded-full" />
          </div>

          <div className={cn("shrink-0 flex items-center justify-between px-8 py-6 border-b relative z-10", isLight ? "border-black/8" : "border-white/5")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Sparkles className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h2 className={cn("text-base font-black uppercase tracking-[0.1em] italic", textPrimary)}>Magic Profile</h2>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">One-Step Setup</span>
              </div>
            </div>
            <button onClick={handleClose} className={cn("w-11 h-11 flex items-center justify-center rounded-2xl", closeBtnCls)}>
              <X className={cn("w-5 h-5", isLight ? "text-black/60" : "text-white/70")} />
            </button>
          </div>

          <ScrollArea className="flex-1 overflow-hidden relative z-10">
            <div className="px-8 pt-8 pb-32">
              <AnimatePresence mode="wait">
                {step === 'compose' && (
                  <motion.div key="compose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    
                    {/* Onboarding Banner */}
                    {isOnboardingActive && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl mb-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-rose-400 font-black uppercase tracking-widest text-xs mb-1.5 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Welcome! Let's get started.
                        </h3>
                        <p className={cn("text-xs font-bold leading-relaxed", textPrimary)}>
                          Upload a photo and tell us a bit about yourself to complete your profile. We'll set everything up for you automatically!
                        </p>
                      </div>
                    )}
                    
                    {/* Photos */}
                    <div className="space-y-4">
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>1. Photo</label>
                      <div className="grid grid-cols-2 gap-4">
                        {imageFiles[0] ? (
                          <div className={cn("aspect-square rounded-3xl overflow-hidden border relative shadow-2xl", isLight ? "border-black/10" : "border-white/10")}>
                            <img src={URL.createObjectURL(imageFiles[0])} className="w-full h-full object-cover" />
                            <button onClick={() => setImageFiles([])} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full border border-white/10">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={handleImageAdd}
                            className={cn("aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-rose-500/5 hover:border-rose-500/40 transition-all group shadow-inner", isLight ? "border-black/15" : "border-white/10")}>
                            <div className={cn("p-3 rounded-2xl border group-hover:bg-rose-500/20 group-hover:border-rose-400/30 transition-all", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5")}>
                              <Camera className="w-6 h-6 text-rose-400 opacity-70 group-hover:opacity-100" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Add Photo</span>
                          </button>
                        )}
                        <div className={cn("aspect-square rounded-[2rem] border flex items-center justify-center text-center p-4", isLight ? "border-black/8" : "border-white/8")}>
                          <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-relaxed", textMuted)}>One photo required for your profile</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>2. Description</span>
                        <button
                          type="button"
                          onClick={handleEnhanceNarrative}
                          disabled={!narrative.trim() || isEnhancing}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95",
                            narrative.trim() && !isEnhancing
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                              : "opacity-30 bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                          )}
                        >
                          {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          {isEnhancing ? 'Improving...' : '✨ Improve Description'}
                        </button>
                      </div>

                      <div className="relative group">
                        <Popover open={micTipOpen} onOpenChange={setMicTipOpen}>
                          <PopoverTrigger asChild>
                            <button
                              onClick={handleVoiceToggle}
                              className={cn(
                                "absolute right-4 top-4 w-10 h-10 z-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden",
                                isRecording ? "bg-red-500 scale-110" : "bg-rose-500 hover:scale-105"
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
                              <p className="text-[12px] leading-relaxed text-white/85">
                                Tap the mic and describe yourself out loud. Tap again to stop.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Search className="absolute left-5 top-5 w-4 h-4 text-rose-400 opacity-60" />
                          <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder={isRecording ? "Listening..." : placeholder}
                            className={cn("w-full h-44 p-5 pl-14 pr-16 rounded-[2rem] text-sm leading-relaxed resize-none italic outline-none focus:ring-1 focus:ring-rose-500/30", inputCls)}
                          />
                          {isTranscribing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2rem]">
                              <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-full border border-rose-500/30 shadow-2xl">
                                <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
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
                        disabled={!narrative.trim() || isProcessing || imageFiles.length === 0}
                        className="w-full h-16 rounded-[2.5rem] bg-rose-600 hover:brightness-110 text-white font-black uppercase tracking-[0.3em] text-[12px] shadow-[0_20px_60px_rgba(225,29,72,0.4)] disabled:opacity-20"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Wand2 className="w-5 h-5 mr-3" />}
                        Create Profile
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-12 py-20">
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
                    <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", textPrimary)}>Building your profile</h3>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}