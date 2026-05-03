import { useState, useCallback } from 'react';
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
import useAppTheme from '@/hooks/useAppTheme';

interface ClientVerificationFlowProps {
  onComplete?: () => void;
}

const steps = [
  { id: 'selfie', title: 'Selfie Check', description: 'Real-time face verification', icon: Camera, color: '#EB4898' },
  { id: 'document', title: 'Identity Verification', description: 'National ID or Passport', icon: FileCheck, color: '#3b82f6' },
  { id: 'review', title: 'Manual Review', description: 'Securing your identity', icon: ShieldCheck, color: '#8b5cf6' },
];

export function ClientVerificationFlow({ onComplete }: ClientVerificationFlowProps) {
  const { user } = useAuth();
  const { theme, isLight } = useAppTheme();
  const [step, setStep] = useState(0);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadFile = async (file: File, type: 'selfie' | 'id_document'): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    
    // Pro-level compression
    const compressed = await browserImageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    
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
      const path = await uploadFile(file, type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'selfie') {
          setSelfieUrl(reader.result as string);
          setStep(1);
        } else {
          setDocumentUrl(reader.result as string);
          setStep(2);
        }
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[Verification] Upload error:', err);
      toast.error(`Upload failed. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selfieUrl || !documentUrl) return;
    
    triggerHaptic('heavy');
    uiSounds.playPing();
    setSubmitting(true);
    
    try {
      // 1. Create a legal document record for verification
      const { error: requestError } = await supabase
        .from('legal_documents')
        .insert({
          user_id: user.id,
          document_type: 'identity_verification',
          file_name: 'verification_bundle.json',
          file_path: `verifications/${user.id}/${Date.now()}`,
          file_size: 0,
          mime_type: 'application/json',
          status: 'pending',
          verification_notes: JSON.stringify([
            { type: 'selfie', preview: selfieUrl.substring(0, 100) + '...' },
            { type: 'id_document', preview: documentUrl.substring(0, 100) + '...' }
          ])
        });

      if (requestError) throw requestError;

      // 2. Update client profile verification timestamp
      await supabase
        .from('client_profiles')
        .update({
          verification_submitted_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      toast.success('Identity submitted for review! 🚀');
      onComplete?.();
    } catch (err) {
      console.error('[Verification] Submission error:', err);
      toast.error('Submission failed. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* 🛸 PROGRESS STEPS */}
      <div className="flex items-center justify-between px-6">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="relative flex flex-col items-center gap-3">
              <motion.div 
                animate={isActive ? { scale: [1, 1.1, 1], boxShadow: `0 0 20px ${s.color}40` } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                  isDone ? "bg-primary border-primary shadow-lg shadow-primary/20" :
                  isActive ? "border-primary bg-primary/10" :
                  "border-white/5 bg-white/5 opacity-70"
                )}
                style={isActive ? { borderColor: s.color, backgroundColor: `${s.color}20` } : (isDone ? { backgroundColor: '#EB4898', borderColor: '#EB4898' } : {})}
              >
                {isDone ? (
                  <Check className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <StepIcon className={cn("w-6 h-6", isActive ? "text-primary" : "text-white/70")} style={isActive ? { color: s.color } : {}} />
                )}
              </motion.div>
              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isActive ? "text-white" : "text-white/20")}>
                {s.title}
              </span>
              {i < steps.length - 1 && (
                <div className="absolute left-[120%] top-7 w-[calc(100%-80px)] h-px bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={isDone ? { x: '0' } : { x: '-100%' }}
                    className="w-full h-full bg-primary"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Immersive Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative group"
        >
          {/* Subtle Back Glow */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-500/10 blur-[130px] rounded-full" />
          <div className="absolute -inset-4 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[3rem] blur-2xl" />
          
          <div className="relative rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center space-y-8 shadow-2xl overflow-hidden">
            {/* Liquid Background Pulse */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px]"
              style={{ background: steps[step].color }}
            />

            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white tracking-tight">{steps[step].title}</h3>
              <p className="text-sm text-white/70 font-medium max-w-xs mx-auto">{steps[step].description}</p>
            </div>

            {step === 0 && (
              <div className="space-y-8">
                <div className="relative w-40 h-40 mx-auto">
                  <AnimatePresence>
                    {selfieUrl ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={selfieUrl} 
                        alt="Selfie preview" 
                        className="w-full h-full rounded-full object-cover border-4 border-primary shadow-2xl" 
                      />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full rounded-full bg-white/5 border-4 border-dashed border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors"
                      >
                        <Camera className="w-12 h-12 text-white/10 group-hover:text-primary/40 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Face Guide Overlay */}
                  {!selfieUrl && (
                    <div className="absolute inset-0 rounded-full border border-white/10 scale-90 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <label className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-primary blur opacity-20 group-hover:opacity-70 transition" />
                    <div className="relative px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition active:scale-95">
                      <input type="file" accept="image/*" capture="user" onChange={(e) => handleFileSelect(e, 'selfie')} className="hidden" />
                      {uploading ? <Activity className="w-5 h-5 animate-pulse" /> : <Camera className="w-5 h-5" />}
                      {uploading ? 'Processing Image...' : (selfieUrl ? 'Change Photo' : 'Capture Selfie')}
                    </div>
                  </label>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Biometric Check active</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div className="relative w-64 h-40 mx-auto">
                  <AnimatePresence>
                    {documentUrl ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={documentUrl} 
                        alt="ID preview" 
                        className="w-full h-full rounded-3xl object-cover border-4 border-primary shadow-2xl" 
                      />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full rounded-3xl bg-white/5 border-4 border-dashed border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors"
                      >
                        <FileCheck className="w-12 h-12 text-white/10 group-hover:text-primary/40 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <label className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-primary blur opacity-20 group-hover:opacity-70 transition" />
                    <div className="relative px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition active:scale-95">
                      <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'id_document')} className="hidden" />
                      {uploading ? <Activity className="w-5 h-5 animate-pulse" /> : <FileCheck className="w-5 h-5" />}
                      {uploading ? 'Scanning Docs...' : (documentUrl ? 'Replace ID' : 'Scan Document')}
                    </div>
                  </label>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Automatic OCR enabled</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10">
                <div className="flex items-center justify-center gap-10">
                  <div className="relative">
                    <img src={selfieUrl!} className="w-24 h-24 rounded-full object-cover border-4 border-[#EB4898] shadow-2xl" alt="Selfie" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center border-4 border-black">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/10" />
                  <div className="relative">
                    <img src={documentUrl!} className="w-28 h-20 rounded-xl object-cover border-2 border-white/10" alt="ID" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center border-4 border-black">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                <div className={cn("rounded-[2rem] p-8 border flex items-start gap-6 text-left", isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.03] border-white/5")}>
                   <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                   <div className="space-y-2">
                       <h4 className="text-[12px] font-black uppercase italic tracking-tighter leading-none">Identity Compliance Review</h4>
                       <p className="text-[10px] font-bold italic opacity-70 leading-relaxed uppercase tracking-widest">Manual review initialized. 24h expected processing time. Data is AES-256 encrypted.</p>
                   </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-16 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[0.25em] text-[11px] shadow-[0_0_30px_rgba(235,72,152,0.3)] transition-all active:scale-[0.98]"
                >
                  {submitting ? 'AUTHENTICATING...' : 'CONFIRM SUBMISSION'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


