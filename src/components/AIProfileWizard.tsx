import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Mic, Search, Sparkles, Wand2, X } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOnboardingStore } from '@/state/onboardingStore';
import { logger } from '@/utils/prodLogger';

type Step = 'compose' | 'processing';
type Mode = 'client' | 'owner';

export function AIProfileWizard() {
  const { showAIProfile, aiProfileMode, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const { isOnboardingActive, setOnboardingActive } = useOnboardingStore();
  const { openAIListing } = useModalStore();
  const mode: Mode = (aiProfileMode || 'client');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('compose');
  const [narrative, setNarrative] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const { isRecording, isTranscribing, interimTranscript, start: startVoice, stop: stopVoice } = useVoiceTranscribe({
    onStop: (text) => {
      if (text) setNarrative(prev => prev ? `${prev} ${text}` : text);
    }
  });
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
      logger.warn('[AIProfileEnhance] failed', err);
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

  // One stable preview URL per selected file — recreating it every render
  // leaks a blob URL per keystroke while the user types their narrative.
  const imagePreview = useMemo(
    () => (imageFiles[0] ? URL.createObjectURL(imageFiles[0]) : null),
    [imageFiles]
  );
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  if (!showAIProfile) return null;

  const modalBg = isLight ? 'bg-white border-black/10' : 'bg-[#0f0f13] border-white/20';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/80' : 'text-white/90';
  const inputCls = isLight
    ? 'bg-white border-2 border-black/15 focus:border-rose-500 focus:ring-0 text-black placeholder:text-black/60 font-medium'
    : 'bg-white/[0.15] border-2 border-white/30 focus:border-rose-400 focus:ring-0 text-white placeholder:text-white/70 font-medium shadow-inner';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-black/5 border border-black/20'
    : 'bg-white/10 hover:bg-white/20 border border-white/20';

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
      stopVoice();
    } else {
      const ok = await startVoice();
      if (ok) {
        triggerHaptic('light');
      } else {
        // useVoiceTranscribe sets lastError, but we want to wait for state to update, or just fire a generic toast since lastError updates asynchronously
        setTimeout(() => appToast.error('Microphone check failed. Enable permissions or try again.'), 300);
      }
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
      // Photo upload and AI extraction are independent — run them in parallel
      // so the user waits for the slower of the two, not the sum of both.
      const uploadPromise = uploadPhotoBatch(user.id, imageFiles, 'profile-images', (p) => {
        setProgressPct(10 + Math.floor(p * 0.5));
      });

      // Non-blocking extraction — falls back to the raw narrative if AI fails or stalls.
      const extractPromise: Promise<Record<string, unknown>> = (async () => {
        try {
          const aiCall = supabase.functions.invoke('ai-profile-extract', {
            body: { mode, narrative },
          });
          const aiTimeout = new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('AI extract timed out') }), 15000)
          );
          const { data: extractData, error: extractErr } = (await Promise.race([aiCall, aiTimeout])) as {
            data: unknown;
            error: unknown;
          };
          if (!extractErr) return ((extractData as any)?.profile || {}) as Record<string, unknown>;
          logger.warn('[AIProfileWizard] AI extract failed, saving with raw narrative', extractErr);
        } catch (e) {
          logger.warn('[AIProfileWizard] AI extract threw, saving with raw narrative', e);
        }
        return {};
      })();

      const [urls, draft] = await Promise.all([uploadPromise, extractPromise]);
      setProgressPct(70);

      // 3. Save profile as draft to modal store
      const payload: any = mode === 'client' ? {
        user_id: user.id,
        name: draft.name || null,
        age: draft.age || null,
        gender: draft.gender || null,
        bio: draft.bio || narrative, // Fallback to raw voice/text
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
      } : {
        user_id: user.id,
        business_name: draft.business_name || null,
        business_description: draft.business_description || narrative, // Fallback
        business_location: draft.business_location || null,
        contact_email: draft.contact_email || null,
        contact_phone: draft.contact_phone || null,
        service_offerings: draft.service_offerings || [],
        profile_images: urls,
      };

      useModalStore.setState({ aiProfileDraft: payload });
      
      // Save the profile immediately into the database
      const tableName = mode === 'client' ? 'client_profiles' : 'owner_profiles';
      const { data: existing } = await supabase.from(tableName).select('id').eq('user_id', user.id).maybeSingle();
      
      if (existing?.id) {
        const { error: dbErr } = await supabase.from(tableName).update(payload).eq('user_id', user.id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await supabase.from(tableName).insert(payload);
        if (dbErr) throw dbErr;
      }

      // Best-effort sync to public.profiles so TopBar avatar + swipe cards update too
      try {
        const profileSync: any = {
          images: urls,
          avatar_url: urls[0] || null,
          updated_at: new Date().toISOString(),
        };
        if (mode === 'client') {
          if (payload.name) profileSync.full_name = payload.name;
          if (payload.age) profileSync.age = payload.age;
          if (payload.gender) profileSync.gender = payload.gender;
          if (payload.city) profileSync.city = payload.city;
          if (payload.country) profileSync.country = payload.country;
          if (payload.nationality) profileSync.nationality = payload.nationality;
          if (payload.interests?.length) profileSync.interests = payload.interests;
          if (payload.languages?.length) profileSync.languages_spoken = payload.languages;
        } else if (payload.business_name) {
          profileSync.full_name = payload.business_name;
        }
        await supabase.from('profiles').update(profileSync).eq('user_id', user.id);
      } catch (syncErr) {
        logger.warn('[AIProfileWizard] profiles sync skipped', syncErr);
      }

      setProgressPct(100);
      triggerHaptic('success');
      appToast.success('Magic Profile Saved!');
      
      // Invalidate all profile caches so manual profile form, TopBar, etc. pick up new data
      queryClient.invalidateQueries({ queryKey: ['client-profile-own'] });
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile'] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile-own'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles_public'] });
      queryClient.invalidateQueries({ queryKey: ['profile-detail', user.id] });

      if (isOnboardingActive) {
        setModal('showAIProfile', false);
        openAIListing('property');
      } else {
        setModal('showAIProfile', false);
        // Land on the profile management page (photo, Magic AI, edit, roommates)
        // — never the public swipe-card view of yourself.
        navigate('/client/profile');
      }
    } catch (err: any) {
      logger.error('Process failed', err);
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
            "w-full max-w-2xl mx-auto h-full sm:h-[85vh] overflow-hidden sm:rounded-[3rem] border flex flex-col relative",
            isLight ? "shadow-[0_40px_100px_rgba(0,0,0,0.2)]" : "shadow-[0_40px_100px_rgba(255,255,255,0.05)] shadow-2xl",
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
              <X className={cn("w-5 h-5", isLight ? "text-black/80" : "text-white/90")} />
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
                        {imageFiles[0] && imagePreview ? (
                          <div className={cn("aspect-square rounded-3xl overflow-hidden border relative shadow-2xl", isLight ? "border-black/10" : "border-white/10")}>
                            <img src={imagePreview} className="w-full h-full object-cover" />
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
                              : "opacity-40 bg-white/5 border-white/10 text-white/70 cursor-not-allowed"
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
                                Tap the mic and describe yourself out loud. Tap again to stop.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Search className="absolute left-5 top-5 w-4 h-4 text-rose-400 opacity-90" />
                          <textarea
                            value={isRecording && interimTranscript ? (narrative ? narrative + ' ' + interimTranscript : interimTranscript) : narrative}
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