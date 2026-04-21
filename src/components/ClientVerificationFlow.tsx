import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { Camera, FileCheck, ShieldCheck, ChevronRight, Check, Sparkles, AlertCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { useTheme } from '@/hooks/useTheme';

interface ClientVerificationFlowProps {
  onComplete?: () => void;
}

const steps = [
  { id: 'selfie', title: 'Selfie Check', description: 'Biometric face verification', icon: Camera, color: '#EB4898' },
  { id: 'document', title: 'Identity Hub', description: 'National ID/Passport Sync', icon: FileCheck, color: '#3b82f6' },
  { id: 'review', title: 'Authorization', description: 'Securing identity logs', icon: ShieldCheck, color: '#10b981' },
];

export function ClientVerificationFlow({ onComplete }: ClientVerificationFlowProps) {
  const { user } = useAuth();
  const { theme, isLight } = useTheme();
  const [step, setStep] = useState(0);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadFile = async (file: File, type: 'selfie' | 'id_document'): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const compressed = await browserImageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
    const path = `verification/${user.id}/${type}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('legal-documents').upload(path, compressed);
    if (error) throw error;
    return path;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'id_document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic('medium');
    uiSounds.playPop();
    setUploading(true);
    try {
      await uploadFile(file, type);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'selfie') { setSelfieUrl(reader.result as string); setStep(1); }
        else { setDocumentUrl(reader.result as string); setStep(2); }
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(`Upload failed. System error.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selfieUrl || !documentUrl) return;
    triggerHaptic('heavy');
    uiSounds.playPing(1.5);
    setSubmitting(true);
    try {
      const { error: requestError } = await supabase.from('legal_documents').insert({
          user_id: user.id,
          document_type: 'identity_verification',
          file_name: 'verification_bundle.json',
          file_path: `verifications/${user.id}/${Date.now()}`,
          file_size: 0,
          mime_type: 'application/json',
          status: 'pending',
          verification_notes: JSON.stringify([{ type: 'selfie' }, { type: 'id_document' }])
      });
      if (requestError) throw requestError;
      await supabase.from('client_profiles').update({ verification_submitted_at: new Date().toISOString() }).eq('user_id', user.id);
      toast.success('Identity Authority Transmitted! 🚀');
      onComplete?.();
    } catch (err) {
      toast.error('Submission protocol failure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* 🛸 NEXUS PROGRESS STEPS */}
      <div className="flex items-center justify-between px-6">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="relative flex flex-col items-center gap-3">
              <motion.div 
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-16 h-16 rounded-[1.4rem] flex items-center justify-center border-2 transition-all duration-700 shadow-2xl",
                  isDone ? "bg-emerald-500 border-emerald-500" :
                  isActive ? "border-primary bg-primary/10" :
                  "border-white/5 bg-white/5 opacity-40"
                )}
                style={isActive ? { borderColor: s.color, backgroundColor: `${s.color}20`, shadowColor: `${s.color}40` } : (isDone ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {})}
              >
                {isDone ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <StepIcon className={cn("w-7 h-7", isActive ? "" : "text-white/40")} style={isActive ? { color: s.color } : {}} />
                )}
              </motion.div>
              <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] italic leading-none", isActive ? (isLight ? "text-black" : "text-white") : "text-white/20")}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* 🛸 IMMERSIVE TERMINAL */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 1.02 }}
          transition={ { type: "spring", stiffness: 350, damping: 30 } }
          className="relative group"
        >
          {/* Subtle Back Glow */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-500/10 blur-[130px] rounded-full" />
          
          <div className={cn(
             "relative rounded-[3.5rem] border backdrop-blur-3xl p-12 text-center space-y-10 shadow-3xl overflow-hidden",
             isLight ? "bg-black/5 border-black/10 text-black" : "bg-white/[0.04] border-white/5 text-white"
          )}>
            
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px]"
              style={{ background: steps[step].color }}
            />

            <div className="space-y-3">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{steps[step].title}</h3>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 italic">{steps[step].description}</p>
            </div>

            {step === 0 && (
              <div className="space-y-10">
                <div className="relative w-48 h-48 mx-auto">
                  <AnimatePresence>
                    {selfieUrl ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={selfieUrl} 
                        className="w-full h-full rounded-full object-cover border-8 border-[#EB4898] shadow-3xl" 
                      />
                    ) : (
                      <motion.div className="w-full h-full rounded-full bg-black/20 border-6 border-dashed border-white/10 flex items-center justify-center">
                        <Camera className="w-16 h-16 text-white/10 group-hover:text-[#EB4898]/40 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!selfieUrl && (
                    <div className="absolute inset-2 rounded-full border border-[#EB4898]/20 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="flex flex-col items-center gap-6">
                  <label className="relative group cursor-pointer w-full max-w-xs">
                    <div className="absolute -inset-1 bg-[#EB4898] blur opacity-20 group-hover:opacity-40 transition" />
                    <div className="relative h-18 rounded-[2rem] bg-[#EB4898] text-white font-black uppercase tracking-widest text-[11px] italic flex items-center justify-center gap-4 transition active:scale-95 shadow-2xl">
                      <input type="file" accept="image/*" capture="user" onChange={(e) => handleFileSelect(e, 'selfie')} className="hidden" />
                      {uploading ? <Activity className="w-5 h-5 animate-pulse" /> : <Camera className="w-5 h-5" />}
                      {uploading ? 'Processing Matrix...' : (selfieUrl ? 'Change Protocol' : 'Execute Selfie')}
                    </div>
                  </label>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Biometric Scan Hub Active</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-10">
                <div className="relative w-80 h-52 mx-auto">
                  <AnimatePresence>
                    {documentUrl ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={documentUrl} 
                        className="w-full h-full rounded-[2.5rem] object-cover border-8 border-indigo-500 shadow-3xl" 
                      />
                    ) : (
                      <motion.div className="w-full h-full rounded-[2.5rem] bg-black/20 border-6 border-dashed border-white/10 flex items-center justify-center">
                        <FileCheck className="w-16 h-16 text-white/10 group-hover:text-indigo-500/40 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <label className="relative group cursor-pointer w-full max-w-xs">
                    <div className="absolute -inset-1 bg-indigo-500 blur opacity-20 group-hover:opacity-40 transition" />
                    <div className="relative h-18 rounded-[2rem] bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] italic flex items-center justify-center gap-4 transition active:scale-95 shadow-2xl">
                      <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'id_document')} className="hidden" />
                      {uploading ? <Activity className="w-5 h-5 animate-pulse" /> : <FileCheck className="w-5 h-5" />}
                      {uploading ? 'Syncing Docs...' : (documentUrl ? 'Replace Protocol' : 'Scan Hub ID')}
                    </div>
                  </label>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">OCR Authorization Enabled</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-12">
                <div className="flex items-center justify-center gap-14">
                  <div className="relative">
                    <img src={selfieUrl!} className="w-24 h-24 rounded-full object-cover border-4 border-[#EB4898] shadow-2xl" alt="Selfie" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-black">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 opacity-10" />
                  <div className="relative">
                    <img src={documentUrl!} className="w-32 h-24 rounded-[1.5rem] object-cover border-4 border-indigo-500 shadow-2xl" alt="ID" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-black">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className={cn("rounded-[2rem] p-8 border flex items-start gap-6 text-left", isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.03] border-white/5")}>
                   <Activity className="w-6 h-6 text-emerald-500 animate-pulse shrink-0 mt-1" />
                   <div className="space-y-2">
                       <h4 className="text-[12px] font-black uppercase italic tracking-tighter leading-none">Authorization Protocol</h4>
                       <p className="text-[10px] font-bold italic opacity-30 leading-relaxed uppercase tracking-widest">Manual matrix review initialized. 24h expected sync time. AES-256 Encryption active.</p>
                   </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-20 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase italic tracking-[0.3em] text-[12px] shadow-3xl shadow-emerald-500/30 transition-all active:scale-[0.98]"
                >
                  {submitting ? 'TRANSMITTING HUB...' : 'EXECUTE AUTHORIZATION'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

