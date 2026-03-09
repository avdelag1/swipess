import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { Camera, FileCheck, Upload, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';

interface ClientVerificationFlowProps {
  onComplete?: () => void;
}

const steps = [
  { id: 'selfie', title: 'Take a Selfie', description: 'Clear photo of your face', icon: Camera },
  { id: 'document', title: 'Upload ID', description: 'Passport, driver\'s license, or national ID', icon: FileCheck },
  { id: 'review', title: 'Submit', description: 'Review and submit for verification', icon: ShieldCheck },
];

export function ClientVerificationFlow({ onComplete }: ClientVerificationFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadFile = async (file: File, type: 'selfie' | 'id_document'): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const compressed = await browserImageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    });
    const path = `${user.id}/${type}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('legal-documents').upload(path, compressed);
    if (error) throw error;

    // Also save to legal_documents table
    await supabase.from('legal_documents').insert({
      user_id: user.id,
      file_name: `${type}.jpg`,
      file_path: path,
      file_size: compressed.size,
      mime_type: 'image/jpeg',
      document_type: 'client_id_verification',
      status: 'pending',
    });

    return path;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'id_document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file, type);
      // Create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'selfie') {
          setSelfieUrl(reader.result as string);
          setStep(1);
        } else {
          setDocumentUrl(reader.result as string);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(`Failed to upload ${type === 'selfie' ? 'selfie' : 'document'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({
          identity_verified: false, // Will be true after admin review
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        notification_type: 'verification_submitted',
        title: 'Verification Submitted',
        message: 'Your identity verification is under review. We\'ll notify you when it\'s approved.',
        is_read: false,
      });

      toast.success('Verification submitted! We\'ll review it shortly.');
      onComplete?.();
    } catch (err) {
      toast.error('Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress steps */}
      <div className="flex items-center justify-between px-2">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isDone ? "bg-primary border-primary" :
                isActive ? "border-primary bg-primary/10" :
                "border-border bg-card/50"
              )}>
                {isDone ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <StepIcon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-8 sm:w-12 h-0.5", isDone ? "bg-primary" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 text-center space-y-4"
        >
          <h3 className="text-lg font-bold text-foreground">{steps[step].title}</h3>
          <p className="text-sm text-muted-foreground">{steps[step].description}</p>

          {step === 0 && (
            <div className="space-y-4">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Selfie preview" className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-primary" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted/30 border-2 border-dashed border-border mx-auto flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                <input type="file" accept="image/*" capture="user" onChange={(e) => handleFileSelect(e, 'selfie')} className="hidden" />
                {uploading ? 'Uploading...' : (selfieUrl ? 'Retake Selfie' : 'Take Selfie')}
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {documentUrl ? (
                <img src={documentUrl} alt="ID preview" className="w-48 h-32 rounded-xl object-cover mx-auto border-2 border-primary" />
              ) : (
                <div className="w-48 h-32 rounded-xl bg-muted/30 border-2 border-dashed border-border mx-auto flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'id_document')} className="hidden" />
                {uploading ? 'Uploading...' : (documentUrl ? 'Replace Document' : 'Upload ID Document')}
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                {selfieUrl && <img src={selfieUrl} alt="Selfie" className="w-16 h-16 rounded-full object-cover border border-border" />}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {documentUrl && <img src={documentUrl} alt="ID" className="w-24 h-16 rounded-lg object-cover border border-border" />}
              </div>
              <p className="text-xs text-muted-foreground">Both documents will be reviewed securely. Your data is encrypted and private.</p>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl px-8"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
