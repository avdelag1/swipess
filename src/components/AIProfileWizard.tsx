import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Mic, Sparkles, Wand2, X, AlertCircle, ArrowRight, Wallet, Key, Users } from 'lucide-react';
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
import { assertImageSafe, uploadPhotoBatch } from '@/utils/photoUpload';
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
import { WizardWelcomeScreen } from './WizardWelcomeScreen';

type Step = 'welcome' | 'compose' | 'processing';
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
  const { isRecording, isTranscribing, interimTranscript, start: startVoice, stop: stopVoice } = useVoiceTranscribe({
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
      const hasSeen = localStorage.getItem('hasSeenProfileWelcome');
      setStep(hasSeen ? 'compose' : 'welcome');
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


  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/80' : 'text-white/90';
  const inputCls = isLight
    ? 'bg-white shadow-sm border-transparent focus:ring-2 focus:ring-[#8B5CF6] text-black placeholder:text-black/50 font-medium text-lg px-5 py-4 rounded-2xl'
    : 'bg-[#1c1c22] shadow-md border-transparent focus:ring-2 focus:ring-[#8B5CF6] text-white placeholder:text-white/45 font-medium text-lg px-5 py-4 rounded-2xl';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-slate-50 border-transparent shadow-sm'
    : 'bg-[#1c1c22] hover:bg-[#26262e] border-transparent shadow-md';

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

      // Block objectionable profile photos before saving (Apple Guideline 1.2).
      // assertImageSafe fails OPEN on infra errors and only throws for genuinely
      // unsafe content.
      let photoRejected: Error | null = null;
      try {
        await Promise.all(urls.map((url) => assertImageSafe(url)));
      } catch (e) {
        photoRejected = e as Error;
      }
      if (photoRejected) {
        const paths = urls.map((u) => u.split('/profile-images/')[1]).filter(Boolean) as string[];
        if (paths.length) {
          await supabase.storage.from('profile-images').remove(paths).catch(() => {});
        }
        appToast.error('Photo rejected', photoRejected.message);
        setStep('compose');
        return;
      }
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
      
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => handleClose(), 600);

    } catch (err) {
      logger.error('Profile creation failed:', err);
      appToast.error('Failed to create profile. Try again.');
      setStep('compose');
      setIsProcessing(false);
    }
  };

  const placeholder = mode === 'client' 
    ? "e.g. I'm Alex, a software engineer moving to Miami next month. Looking for a modern 2-bed apartment near the beach. I love surfing and need high-speed internet." 
    : "e.g. I'm Sarah, I own a beautiful renovated villa in Tuscany with 4 bedrooms, a pool, and stunning vineyard views. Perfect for families.";

  return (
    <AnimatePresence>
      {showAIProfile && (
        <motion.div
          key="ai-profile-wizard"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "fixed inset-0 z-[2147483000] modal-scrim flex items-start sm:items-center justify-center p-4 sm:p-6 modal-scrim--dark"
          )}
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "w-full max-w-2xl mx-auto h-full sm:h-[85vh] overflow-hidden rounded-[2.5rem] flex flex-col relative",
              "bg-[#0a0a0f]/80"
            )}
            style={{
              backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderTop: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tr from-violet-600/20 to-[#EB4898]/20 blur-[120px] rounded-full mix-blend-screen" />
          </div>
          
          <AnimatePresence>
            {step === 'welcome' && (
              <WizardWelcomeScreen
                title="AI Profile Builder"
                description="Just talk or type naturally. Our AI will instantly create a high-converting profile for you."
                onContinue={() => {
                  localStorage.setItem('hasSeenProfileWelcome', 'true');
                  setStep('compose');
                }}
                onSkip={handleClose}
              />
            )}
          </AnimatePresence>

          <div
            className="shrink-0 flex items-center justify-between px-8 pb-4 pt-6 border-b border-white/10 relative z-10 bg-white/5"
            style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center border border-[#8B5CF6]/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <MotionIcon id="ai-sparkle" loop={isProcessing}>
                  <Sparkles className="w-7 h-7 text-[#A5B4FC]" />
                </MotionIcon>
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-[0.1em] italic bg-clip-text text-transparent" style={{ backgroundImage: NEXUS_GRADIENTS.ai }}>Magic Profile</h2>
                <span className="text-[11px] opacity-80 font-bold uppercase tracking-widest text-[#A5B4FC]">One-Step AI Setup</span>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 group",
                closeBtnCls
              )}
            >
              <X className="w-6 h-6 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>

          <ScrollArea className="flex-1 overflow-hidden relative z-10">
            <div className="px-6 sm:px-10 pt-8 pb-32">
              <AnimatePresence mode="sync">
                {step === 'compose' && (
                  <motion.div key="compose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                    
                    {isOnboardingActive && (
                      <div className="bg-gradient-to-br from-[#6366F1]/20 to-purple-600/10 border border-[#8B5CF6]/30 p-6 rounded-[2rem] shadow-[inset_0_0_40px_rgba(99,102,241,0.1)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8B5CF6]/30 blur-[60px] rounded-full pointer-events-none" />
                        <h3 className="text-[#A5B4FC] font-black uppercase tracking-[0.15em] text-sm mb-2 flex items-center gap-2">
                          <MotionIcon id="ai-sparkle" loop>
                            <Sparkles className="w-5 h-5" />
                          </MotionIcon>
                          Welcome to the Future
                        </h3>
                        <p className={cn("text-sm font-medium leading-relaxed opacity-90", textPrimary)}>
                          Upload a photo and tell us a bit about yourself. Our AI will analyze your inputs and set up your entire profile automatically!
                        </p>
                      </div>
                    )}

                    {mode === 'client' && (
                      <div className="space-y-5">
                        <label className={cn("text-[11px] font-black uppercase tracking-[0.25em] ml-2 text-[#A5B4FC]")}>
                          1. Your Intention
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                          {CLIENT_TYPE_OPTIONS.map((option) => {
                            const active = selectedClientType === option.id;
                            
                            // Map to sleek Lucide icons instead of emojis
                            let IconComponent = Wallet;
                            if (option.id === 'renter') IconComponent = Key;
                            else if (option.id === 'hire') IconComponent = Users;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  setSelectedClientType(option.id);
                                }}
                                className={cn(
                                  'flex items-center gap-5 p-6 rounded-[2rem] border transition-all duration-300 active:scale-[0.98] group relative overflow-hidden',
                                  active
                                    ? 'bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 border-[#8B5CF6]/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                                    : 'bg-[#13131a] border-white/5 hover:border-white/20 hover:bg-[#1a1a24]',
                                )}
                              >
                                {active && (
                                  <motion.div layoutId="client-active-glow" className="absolute inset-0 bg-[#8B5CF6]/10 mix-blend-screen pointer-events-none" />
                                )}
                                <div className={cn("p-4 rounded-2xl transition-all z-10", active ? "bg-[#8B5CF6]/20 text-[#A5B4FC]" : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/80")}>
                                  <IconComponent className="w-8 h-8" />
                                </div>
                                <div className="min-w-0 text-left relative z-10">
                                  <p className={cn('text-lg font-black tracking-tight', active ? 'text-white' : 'text-white/90')}>{option.label}</p>
                                  <p className={cn('text-xs font-medium mt-1 leading-relaxed', active ? 'text-[#A5B4FC]' : 'text-white/50 group-hover:text-white/70 transition-colors')}>{option.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-5">
                      <label className={cn("text-[11px] font-black uppercase tracking-[0.25em] ml-2 text-[#A5B4FC]")}>
                        {mode === 'client' ? '2. Photo' : '1. Photo'}
                      </label>
                      <div className="grid grid-cols-2 gap-5">
                        {imageFiles[0] && imagePreview ? (
                          <div className={cn("aspect-square rounded-[2rem] overflow-hidden border-2 relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-white/20")}>
                            <img src={imagePreview} alt="Profile photo preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            <button onClick={() => setImageFiles([])} className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-90">
                              <X className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={handleImageAdd}
                            className={cn("aspect-square rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 hover:bg-[#6366F1]/10 hover:border-[#8B5CF6]/50 transition-all group shadow-inner border-white/15 bg-[#13131a]")}>
                            <div className={cn("p-4 rounded-[1.5rem] border group-hover:bg-[#6366F1]/30 group-hover:border-[#8B5CF6]/50 group-hover:scale-110 transition-all duration-300 bg-white/5 border-white/10")}>
                              <Camera className="w-8 h-8 text-[#A5B4FC] opacity-70 group-hover:opacity-100" />
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-opacity", textPrimary)}>Upload Photo</span>
                          </button>
                        )}
                        <div className={cn("aspect-square rounded-[2.5rem] border flex items-center justify-center text-center p-6 border-white/5 bg-[#13131a]/50")}>
                          <p className={cn("text-xs font-bold uppercase tracking-widest leading-loose", textMuted)}>We just need one great photo of you to get started.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between ml-2">
                        <span className={cn("text-[11px] font-black uppercase tracking-[0.25em] text-[#A5B4FC]")}>
                          {mode === 'client' ? '3. Tell us about you' : '2. Tell us about you'}
                        </span>
                        <button
                          type="button"
                          onClick={handleEnhanceNarrative}
                          disabled={!narrative.trim() || isEnhancing}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95",
                            narrative.trim() && !isEnhancing
                              ? "bg-gradient-to-r from-[#6366F1]/20 to-purple-500/20 border-[#8B5CF6]/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:border-white/50"
                              : "opacity-40 bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                          )}
                        >
                          {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          {isEnhancing ? 'Improving...' : 'AI Enhance'}
                        </button>
                      </div>

                      <div className="relative group">
                        <Popover open={micTipOpen} onOpenChange={setMicTipOpen}>
                          <PopoverTrigger asChild>
                            <div className="absolute right-5 top-5 z-10 flex items-center justify-center">
                              {isRecording && (
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] blur-xl pointer-events-none"
                                  animate={{ 
                                    scale: 1 + (micVolume / 255) * 2,
                                    opacity: 0.5 + (micVolume / 255) * 0.5 
                                  }}
                                  transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                                />
                              )}
                              <button
                                onClick={handleVoiceToggle}
                                className={cn(
                                  "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl overflow-hidden",
                                  isRecording 
                                    ? "text-white shadow-[0_0_40px_rgba(99,102,241,0.8)] scale-110" 
                                    : "bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-110"
                                )}
                                style={isRecording ? { background: NEXUS_GRADIENTS.ai } : undefined}
                              >
                                {!isRecording && (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                {isRecording ? (
                                  <Mic className="w-6 h-6 relative z-10 text-white animate-pulse" />
                                ) : (
                                  <Mic className="w-6 h-6 relative z-10 text-white" />
                                )}
                              </button>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            sideOffset={16}
                            className="w-72 p-5 rounded-3xl border border-[#8B5CF6]/40 bg-[#13131a]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <AudioLines className="w-5 h-5 text-[#A5B4FC]" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#A5B4FC]">Voice to Text</span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed text-white/90">
                                Tap the mic to describe yourself out loud. Our AI will transcribe your voice into the perfect profile description!
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Search className="absolute left-6 top-6 w-5 h-5 text-[#A5B4FC] opacity-70" />
                          <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder={placeholder}
                            className={cn("w-full h-56 p-6 pl-14 pr-20 resize-none italic outline-none", inputCls)}
                          />
                          {isRecording && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-lg rounded-[2rem] border border-[#8B5CF6]/50 z-20 overflow-hidden">
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/30 to-[#8B5CF6]/30 mix-blend-screen"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                              <div className="flex items-center gap-3 mb-4 relative z-10">
                                <Mic className="w-8 h-8 text-white animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                <span className="text-base font-black uppercase tracking-[0.2em] text-white drop-shadow-md">Listening...</span>
                              </div>
                              <div className="flex gap-1.5 items-end h-10 relative z-10">
                                {[...Array(16)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-2 bg-gradient-to-t from-[#06B6D4] to-[#8B5CF6] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                                    animate={{
                                      height: isRecording ? Math.max(6, (micVolume / 255) * 40 * (Math.random() * 0.6 + 0.4)) : 6
                                    }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                                  />
                                ))}
                              </div>
                              {interimTranscript ? (
                                <p className="mt-5 px-8 max-h-24 overflow-hidden text-center text-sm font-bold text-white leading-relaxed relative z-10 line-clamp-3 drop-shadow-md">
                                  "{interimTranscript}"
                                </p>
                              ) : (
                                <p className="mt-5 text-[11px] font-black text-white/50 uppercase tracking-[0.2em] relative z-10">Speak your thoughts loud & clear</p>
                              )}
                            </div>
                          )}
                          {isTranscribing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-[2rem]">
                              <div className="flex items-center gap-4 px-6 py-4 bg-[#13131a] rounded-full border border-[#8B5CF6]/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                <Loader2 className="w-5 h-5 text-[#A5B4FC] animate-spin" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A5B4FC]">Processing Audio...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 px-2 pb-10 space-y-6">
                      <p className={cn("text-[10px] font-bold text-center uppercase tracking-widest opacity-40 px-6", textPrimary)}>
                        Your data is securely processed by OpenAI to generate your premium profile.
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleProcess}
                        disabled={!narrative.trim() || isProcessing || imageFiles.length === 0}
                        className={cn(
                          "w-full h-20 rounded-[2.5rem] flex items-center justify-center gap-4 text-white font-black uppercase tracking-[0.2em] text-base shadow-[0_15px_40px_rgba(99,102,241,0.4)] border border-white/20 relative overflow-hidden transition-all duration-300",
                          (!narrative.trim() || isProcessing || imageFiles.length === 0) ? "opacity-30 saturate-0 shadow-none cursor-not-allowed border-white/5" : "hover:shadow-[0_20px_50px_rgba(99,102,241,0.6)] hover:scale-[1.02]"
                        )}
                        style={{ background: 'linear-gradient(135deg, #06B6D4, #6366F1, #8B5CF6)' }}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />
                        {isProcessing ? (
                          <MotionIcon id="ai-sparkle" loop className="relative z-10">
                            <PremiumSpinner className="w-6 h-6" />
                          </MotionIcon>
                        ) : (
                          <MotionIcon id="ai-sparkle" className="relative z-10">
                            <Wand2 className="w-6 h-6" />
                          </MotionIcon>
                        )}
                        <span className="relative z-10 drop-shadow-md">Generate AI Profile</span>
                      </motion.button>
                      
                      {isOnboardingActive && (
                        <div className="pt-2">
                          <button
                            onClick={handleClose}
                            className="w-full text-center text-sm font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest py-3"
                          >
                            Skip for now
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                    className="h-full flex flex-col items-center justify-center space-y-16 py-24">
                    <div className="relative w-48 h-48">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/10" />
                          <motion.circle
                            cx="50" cy="50" r="44"
                            stroke="url(#ai-gradient)" strokeWidth="6" fill="none"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 44}
                            initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - progressPct / 100) }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                          <defs>
                            <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06B6D4" />
                              <stop offset="50%" stopColor="#6366F1" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <MotionIcon id="ai-sparkle" loop>
                             <Sparkles className="w-8 h-8 text-[#A5B4FC] mb-2" />
                          </MotionIcon>
                          <span className="text-4xl font-black tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{Math.round(progressPct)}%</span>
                        </div>
                      </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-white drop-shadow-md">Crafting Persona</h3>
                      <p className="text-sm font-bold text-[#A5B4FC] uppercase tracking-widest">Please wait a moment...</p>
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