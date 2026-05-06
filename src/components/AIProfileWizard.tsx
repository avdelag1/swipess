import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Loader2, Sparkles, Wand2, ChevronRight, ArrowLeft, Camera, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { appToast } from '@/utils/appNotification';

type Step = 'speak' | 'processing' | 'review';
type Mode = 'client' | 'owner';

export function AIProfileWizard() {
  const { showAIProfile, aiProfileMode, setModal } = useModalStore();
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const mode: Mode = (aiProfileMode || 'client');

  const [step, setStep] = useState<Step>('speak');
  const [narrative, setNarrative] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isRecording, isTranscribing, start: startVoice, stop: stopVoice } = useVoiceTranscribe();

  const initialOpen = useRef(showAIProfile);
  useEffect(() => {
    if (showAIProfile && !initialOpen.current) {
      setStep('speak'); setNarrative(''); setImageFiles([]); setDraft(null);
    }
    initialOpen.current = showAIProfile;
  }, [showAIProfile]);

  if (!showAIProfile) return null;

  const modalBg = isLight ? 'bg-white border-black/10' : 'bg-black border-white/10';
  const textPrimary = isLight ? 'text-black' : 'text-white';
  const textMuted = isLight ? 'text-black/50' : 'text-white/50';
  const inputCls = isLight
    ? 'bg-white border border-black/10 text-black placeholder:text-black/30'
    : 'bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40';
  const closeBtnCls = isLight
    ? 'bg-white hover:bg-black/5 border border-black/10'
    : 'bg-white/5 hover:bg-white/10 border border-white/5';

  const handleClose = () => setModal('showAIProfile', false);

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

  const handleExtract = async () => {
    if (narrative.trim().length < 10) {
      toast.error('Tell me a bit more about yourself first.');
      return;
    }
    setIsExtracting(true);
    setStep('processing');
    triggerHaptic('medium');
    try {
      const { data, error } = await supabase.functions.invoke('ai-profile-extract', {
        body: { mode, narrative },
      });
      if (error) throw error;
      const profile = (data as any)?.profile || {};
      setDraft(profile);
      setStep('review');
      triggerHaptic('success');
    } catch (err: any) {
      console.error('extract failed', err);
      toast.error('Could not build your profile. Try again.');
      setStep('speak');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error('Not signed in'); return; }
    if (imageFiles.length === 0) {
      toast.error('Add one photo to continue.');
      return;
    }
    setIsSaving(true);
    try {
      const urls = await uploadPhotoBatch(user.id, imageFiles, 'profile-images');
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
        const { error } = await supabase
          .from('client_profiles')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        // Sync minimal fields to public.profiles
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
        const { error } = await supabase
          .from('owner_profiles')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        await supabase.from('profiles').update({
          full_name: payload.business_name,
          bio: payload.business_description,
          avatar_url: urls[0] || null,
          images: urls,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }
      triggerHaptic('success');
      appToast.success('Profile saved successfully', 'Your profile is up to date.');
      handleClose();
    } catch (err: any) {
      console.error('save failed', err);
      appToast.error('Could not save profile', err?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const placeholder = mode === 'client'
    ? "e.g. I'm Maria, 28, designer from Italy. Looking for a 2-bedroom in Tulum under $1500. Pet-friendly, non-smoker, English & Spanish."
    : "e.g. We're Casa Luna, hosting beachfront condos in Playa del Carmen. 8 years experience, English/Spanish, pet-friendly stays.";

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
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-600/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[120px] rounded-full" />
          </div>

          {/* Header */}
          <div className={cn("shrink-0 flex items-center justify-between px-8 py-6 border-b relative z-10", isLight ? "border-black/8" : "border-white/5")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className={cn("text-base font-black uppercase tracking-[0.1em] italic", textPrimary)}>Magic AI Profile</h2>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{mode === 'owner' ? 'Owner / Host' : 'Client'}</span>
              </div>
            </div>
            <button onClick={handleClose} className={cn("w-11 h-11 flex items-center justify-center rounded-2xl", closeBtnCls)}>
              <X className={cn("w-5 h-5", isLight ? "text-black/60" : "text-white/70")} />
            </button>
          </div>

          <ScrollArea className="flex-1 overflow-hidden relative z-10">
            <div className="px-8 pt-8 pb-32">
              <AnimatePresence mode="wait">
                {step === 'speak' && (
                  <motion.div key="speak" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="space-y-3">
                      <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>Tell us who you are</h3>
                      <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em]", textMuted)}>Just speak naturally. AI will build your profile for you.</p>
                    </div>

                    {/* Mic hub */}
                    <div className={cn(
                      "p-8 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all duration-500",
                      isRecording ? "bg-red-500/10 border-red-500/40" : "bg-cyan-500/5 border-cyan-500/20"
                    )}>
                      <button
                        onClick={handleVoiceToggle}
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative overflow-hidden",
                          isRecording ? "bg-red-500 scale-110" : "bg-cyan-500 hover:scale-105"
                        )}
                      >
                        {isRecording && (
                          <motion.div className="absolute inset-0 bg-white/20"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }} />
                        )}
                        <Mic className={cn("w-10 h-10 text-black relative z-10", isRecording && "animate-pulse")} />
                      </button>
                      <div className="text-center space-y-1">
                        <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", isRecording ? "text-red-400" : "text-cyan-400")}>
                          {isRecording ? "LISTENING..." : "TAP TO SPEAK"}
                        </p>
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-50", textPrimary)}>
                          Or type below
                        </p>
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="grid grid-cols-2 gap-4">
                      {imageFiles[0] ? (
                        <div className={cn("aspect-square rounded-3xl overflow-hidden border relative", isLight ? "border-black/10" : "border-white/10")}>
                          <img src={URL.createObjectURL(imageFiles[0])} className="w-full h-full object-cover" />
                          <button onClick={() => setImageFiles([])} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full border border-white/10">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={handleImageAdd}
                          className={cn("aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-2", isLight ? "border-black/15" : "border-white/10")}>
                          <Camera className="w-6 h-6 text-cyan-400" />
                          <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", textPrimary)}>Add Photo</span>
                        </button>
                      )}
                      <div className={cn("aspect-square rounded-[2rem] border flex items-center justify-center text-center p-4", isLight ? "border-black/8" : "border-white/8")}>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-relaxed", textMuted)}>One photo required for your profile</p>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-5 top-5 w-4 h-4 text-cyan-400 opacity-60" />
                      <textarea
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder={isRecording ? "Listening..." : placeholder}
                        className={cn("w-full h-44 p-5 pl-14 rounded-[2rem] text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-cyan-500/30", inputCls)}
                      />
                      {isTranscribing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2rem]">
                          <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-full border border-cyan-500/30">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Transcribing</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleExtract}
                      disabled={!narrative.trim() || isExtracting}
                      className="w-full h-16 rounded-[2.5rem] bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.3em] text-[12px] shadow-[0_20px_60px_rgba(34,211,238,0.4)] disabled:opacity-20"
                    >
                      <Wand2 className="w-5 h-5 mr-3" />
                      Build my profile
                    </Button>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-12 py-20">
                    <div className="relative">
                      <motion.div className="absolute inset-[-30px] border border-cyan-500/20 rounded-[3rem]"
                        animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
                      <div className="w-28 h-28 rounded-[2.5rem] border-2 border-cyan-500/40 flex items-center justify-center bg-black shadow-[0_0_80px_rgba(34,211,238,0.2)]">
                        <Wand2 className="w-12 h-12 text-cyan-400" />
                      </div>
                    </div>
                    <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", textPrimary)}>Building your profile</h3>
                  </motion.div>
                )}

                {step === 'review' && draft && (
                  <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <button onClick={() => setStep('speak')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-70 hover:opacity-100">
                      <ArrowLeft className="w-4 h-4" /> Edit narrative
                    </button>
                    <div className="space-y-3">
                      <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", textPrimary)}>Review & save</h3>
                      <p className={cn("text-[11px] leading-relaxed uppercase tracking-[0.2em]", textMuted)}>Edit anything before saving.</p>
                    </div>

                    {mode === 'client' ? (
                      <div className="space-y-4">
                        <Field label="Name" value={draft.name || ''} onChange={(v) => setDraft({...draft, name: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Age" type="number" value={draft.age || ''} onChange={(v) => setDraft({...draft, age: Number(v) || null})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Bio" multiline value={draft.bio || ''} onChange={(v) => setDraft({...draft, bio: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="City" value={draft.city || ''} onChange={(v) => setDraft({...draft, city: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Occupation" value={draft.occupation || ''} onChange={(v) => setDraft({...draft, occupation: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Languages (comma separated)" value={(draft.languages||[]).join(', ')} onChange={(v) => setDraft({...draft, languages: v.split(',').map((s:string)=>s.trim()).filter(Boolean)})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Interests (comma separated)" value={(draft.interests||[]).join(', ')} onChange={(v) => setDraft({...draft, interests: v.split(',').map((s:string)=>s.trim()).filter(Boolean)})} inputCls={inputCls} textMuted={textMuted} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Field label="Business Name" value={draft.business_name || ''} onChange={(v) => setDraft({...draft, business_name: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Description" multiline value={draft.business_description || ''} onChange={(v) => setDraft({...draft, business_description: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Location" value={draft.business_location || ''} onChange={(v) => setDraft({...draft, business_location: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Contact Email" value={draft.contact_email || ''} onChange={(v) => setDraft({...draft, contact_email: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Contact Phone" value={draft.contact_phone || ''} onChange={(v) => setDraft({...draft, contact_phone: v})} inputCls={inputCls} textMuted={textMuted} />
                        <Field label="Services (comma separated)" value={(draft.service_offerings||[]).join(', ')} onChange={(v) => setDraft({...draft, service_offerings: v.split(',').map((s:string)=>s.trim()).filter(Boolean)})} inputCls={inputCls} textMuted={textMuted} />
                      </div>
                    )}

                    <Button
                      onClick={handleSave}
                      disabled={isSaving || imageFiles.length === 0}
                      className="w-full h-16 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] text-[12px] shadow-[0_20px_60px_rgba(79,70,229,0.4)] disabled:opacity-30"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Check className="w-5 h-5 mr-3" />}
                      Save profile
                      <ChevronRight className="w-4 h-4 ml-3" />
                    </Button>
                    {imageFiles.length === 0 && (
                      <p className="text-center text-[10px] font-black uppercase tracking-widest text-red-400">Add 1 photo to save</p>
                    )}
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

function Field({
  label, value, onChange, multiline, type, inputCls, textMuted,
}: { label: string; value: any; onChange: (v: string) => void; multiline?: boolean; type?: string; inputCls: string; textMuted: string }) {
  return (
    <div className="space-y-2">
      <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2", textMuted)}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full min-h-[100px] p-4 rounded-2xl text-sm leading-relaxed outline-none focus:ring-1 focus:ring-cyan-500/30", inputCls)} />
      ) : (
        <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)}
          className={cn("w-full h-12 px-5 rounded-2xl text-sm font-medium outline-none focus:ring-1 focus:ring-cyan-500/30", inputCls)} />
      )}
    </div>
  );
}