import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AudioLines, Camera, Loader2, Search, Sparkles, Wand2, X, Mic } from 'lucide-react';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';
import { MotionIcon } from '@/components/ui/MotionIcon';
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
import {
  CLIENT_TYPE_OPTIONS,
  intentionsForClientType,
  type SeekerClientType,
} from '@/utils/clientType';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';

type Step = 'compose' | 'processing';
type Mode = 'client' | 'owner';

export function AIProfileWizard() {
  const { showAIProfile, aiProfileMode, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const { isOnboardingActive } = useOnboardingStore();
  const { openAIListing } = useModalStore();
  const mode: Mode = (aiProfileMode || 'client');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('compose');
  const [narrative, setNarrative] = useState('');
  const [selectedClientType, setSelectedClientType] = useState<SeekerClientType | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const { isRecording, isTranscribing, start: startVoice, stop: stopVoice } = useVoiceTranscribe({
    onStop: (text) => {
      if (text) setNarrative(prev => prev ? `${prev} ${text}` : text);
      setMicVolume(0);
    },
    onVolumeChange: (vol) => setMicVolume(vol)
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
      setSelectedClientType(null);
    }
    initialOpen.current = showAIProfile;
  }, [showAIProfile]);

  useEffect(() => {
    if (!showAIProfile || mode !== 'client' || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('client_profiles')
        .select('client_type')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const existing = data?.client_type as SeekerClientType | null;
      if (existing === 'buyer' || existing === 'renter' || existing === 'hire') {
        setSelectedClientType(existing);
      }
    })();
    return () => { cancelled = true; };
  }, [showAIProfile, mode, user?.id]);

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

  const modalBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-white/[0.08]';
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
    if (isOnboardingActive) {
      requestAnimationFrame(() => openAIListing('property'));
    }
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
    if (mode === 'client' && !selectedClientType) {
      appToast.error('Pick what you are looking for first.');
      return;
    }
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
      const clientIntentions = mode === 'client' && selectedClientType
        ? Array.from(new Set([
            ...intentionsForClientType(selectedClientType),
            ...((draft.intentions as string[] | undefined) || []),
          ]))
        : [];

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
        occupation: draft.occupation || selectedClientType || null,
        client_type: selectedClientType,
        relationship_status: draft.relationship_status || null,
        smoking_habit: draft.smoking_habit || null,
        drinking_habit: draft.drinking_habit || null,
        languages: draft.languages || [],
        interests: draft.interests || [],
        intentions: clientIntentions,
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
        const { error: syncError } = await supabase.from('profiles').update(profileSync).eq('user_id', user.id);
        if (syncError) logger.warn('[AIProfileWizard] profiles sync failed', syncError);
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
        if (mode === 'client') {
          navigate(`/profile/${user.id}`);
        } else {
          // owner_profiles have no public /profile/:id page
          navigate('/client/profile');
        }
      }
    } catch (err: any) {
      logger.error('Process failed', err);
      appToast.error('Could not create your profile. Try again.');
      setStep('compose');
    } finally {
      setIsProcessing(false);
    }
  };

  const placeholder = "e.g. I'm Maria, 28, designer. Looking for a 2-bedroom in Miami under $1500. I also have a small beachfront condo I host sometimes. Pet-friendly, English & Spanish.";

  return (
    <AnimatePresence>
      {showAIProfile && (
      <motion.div
        key="ai-profile-wizard"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "fixed inset-0 z-[2147483000] backdrop-blur-2xl flex items-start sm:items-center justify-center p-0 sm:p-6",
          isLight ? "bg-white/40" : "bg-black/80"
        )}
        style={{ paddingBottom: 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "w-full max-w-2xl mx-auto h-full sm:h-[85vh] overflow-hidden sm:rounded-[3rem] border flex flex-col relative",
            isLight ? "shadow-[0_40px_100px_rgba(0,0,0,0.2)]" : "shadow-[0_40px_100px_rgba(255,255,255,0.05)] shadow-2xl",
            modalBg
          )}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-violet-500/20 to-[#EB4898]/10 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <div className={cn("shrink-0 flex items-center justify-between px-8 py-6 border-b relative z-10", isLight ? "border-slate-200" : "border-white/5")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/15 flex items-center justify-center border border-[#8B5CF6]/25">
                <MotionIcon id="ai-sparkle" loop={isProcessing}>
                  <Sparkles className="w-6 h-6 text-[#A5B4FC]" />
                </MotionIcon>
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-[0.1em] italic bg-clip-text text-transparent" style={{ backgroundImage: NEXUS_GRADIENTS.ai }}>Magic Profile</h2>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest text-[#8B5CF6]">One-Step Setup</span>
              </div>
            </div>
            <button onClick={handleClose} aria-label="Close" className={cn("w-11 h-11 flex items-center justify-center rounded-2xl press-snappy", closeBtnCls)}>
              <X className={cn("w-5 h-5", isLight ? "text-black/80" : "text-white/90")} />
            </button>
          </div>

          <ScrollArea className="flex-1 overflow-hidden relative z-10">
            <div className="px-8 pt-8 pb-32">
              <AnimatePresence mode="sync">
                {step === 'compose' && (
                  <motion.div key="compose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    
                    {/* Onboarding Banner */}
                    {isOnboardingActive && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl mb-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-rose-400 font-black uppercase tracking-widest text-xs mb-1.5 flex items-center gap-2">
                          <MotionIcon id="ai-sparkle" loop>
                            <Sparkles className="w-4 h-4" />
                          </MotionIcon>
                          Welcome! Let's get started.
                        </h3>
                        <p className={cn("text-xs font-bold leading-relaxed", textPrimary)}>
                          Upload a photo and tell us a bit about yourself to complete your profile. We'll set everything up for you automatically!
                        </p>
                      </div>
                    )}

                    {mode === 'client' && (
                      <div className="space-y-4">
                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>
                          1. What are you looking for?
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {CLIENT_TYPE_OPTIONS.map((option) => {
                            const active = selectedClientType === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  setSelectedClientType(option.id);
                                }}
                                className={cn(
                                  'flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98]',
                                  active
                                    ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/10 shadow-[0_0_24px_rgba(139,92,246,0.2)]'
                                    : isLight
                                      ? 'border-black/10 bg-black/[0.02] hover:border-black/20'
                                      : 'border-white/10 bg-white/[0.03] hover:border-white/20',
                                )}
                              >
                                <span className="text-2xl">{option.emoji}</span>
                                <div className="min-w-0">
                                  <p className={cn('text-sm font-bold', textPrimary)}>{option.label}</p>
                                  <p className={cn('text-[11px] mt-0.5', textMuted)}>{option.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Photos */}
                    <div className="space-y-4">
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>
                        {mode === 'client' ? '2. Photo' : '1. Photo'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {imageFiles[0] && imagePreview ? (
                          <div className={cn("aspect-square rounded-3xl overflow-hidden border relative shadow-2xl", isLight ? "border-slate-200" : "border-white/10")}>
                            <img src={imagePreview} className="w-full h-full object-cover" />
                            <button onClick={() => setImageFiles([])} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full border border-white/10">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={handleImageAdd}
                            className={cn("aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-rose-500/5 hover:border-rose-500/40 transition-all group shadow-inner", isLight ? "border-black/15" : "border-white/10")}>
                            <div className={cn("p-3 rounded-2xl border group-hover:bg-rose-500/20 group-hover:border-rose-400/30 transition-all", isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5")}>
                              <Camera className="w-6 h-6 text-rose-400 opacity-70 group-hover:opacity-100" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-70", textPrimary)}>Add Photo</span>
                          </button>
                        )}
                        <div className={cn("aspect-square rounded-[2rem] border flex items-center justify-center text-center p-4", isLight ? "border-slate-200" : "border-white/8")}>
                          <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-relaxed", textMuted)}>One photo required for your profile</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textMuted)}>
                          {mode === 'client' ? '3. Description' : '2. Description'}
                        </span>
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
                            <div className="absolute right-4 top-4 z-10 flex items-center justify-center">
                              {isRecording && (
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 blur-md pointer-events-none"
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
                                    ? "text-white shadow-[0_0_30px_rgba(99,102,241,0.55)] scale-110" 
                                    : "bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-105"
                                )}
                                style={isRecording ? { background: NEXUS_GRADIENTS.ai } : undefined}
                              >
                                {!isRecording && (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                {isRecording ? (
                                  <Mic className="w-5 h-5 relative z-10 text-white animate-pulse" />
                                ) : (
                                  <Mic className="w-5 h-5 relative z-10 text-white" />
                                )}
                              </button>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            sideOffset={12}
                            className="w-72 p-4 rounded-2xl border border-rose-500/30 bg-black/95 text-white shadow-2xl backdrop-blur-xl"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AudioLines className="w-4 h-4 text-rose-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">Voice to Text</span>
                              </div>
                              <p className="text-[12px] leading-relaxed text-white">
                                Tap to describe yourself out loud. The visualizer reacts to your voice!
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Search className="absolute left-5 top-5 w-4 h-4 text-rose-400 opacity-90" />
                          <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder={placeholder}
                            className={cn("w-full h-44 p-5 pl-14 pr-16 rounded-[2rem] text-sm leading-relaxed resize-none italic outline-none focus:ring-1 focus:ring-rose-500/30", inputCls)}
                          />
                          {isRecording && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-[2rem] border border-rose-500/50 z-20 overflow-hidden">
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-orange-500/20 mix-blend-overlay"
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
                                    className="w-1.5 bg-gradient-to-t from-rose-500 to-orange-500 rounded-full"
                                    animate={{ 
                                      height: isRecording ? Math.max(4, (micVolume / 255) * 32 * (Math.random() * 0.5 + 0.5)) : 4 
                                    }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                                  />
                                ))}
                              </div>
                              <p className="mt-3 text-[10px] font-bold text-white/70 uppercase tracking-widest relative z-10">Speak your details aloud</p>
                            </div>
                          )}
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
                        className="w-full h-16 rounded-[2.5rem] hover:brightness-110 text-white font-black uppercase tracking-[0.3em] text-[12px] shadow-[0_20px_60px_rgba(99,102,241,0.35)] disabled:opacity-20"
                        style={{ background: NEXUS_GRADIENTS.ai }}
                      >
                        {isProcessing ? (
                          <MotionIcon id="ai-sparkle" loop className="mr-3">
                            <PremiumSpinner className="w-5 h-5" />
                          </MotionIcon>
                        ) : (
                          <MotionIcon id="ai-sparkle" className="mr-3">
                            <Wand2 className="w-5 h-5" />
                          </MotionIcon>
                        )}
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
                            stroke="#6366F1" strokeWidth="6" fill="none"
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
      )}
    </AnimatePresence>
  );
}