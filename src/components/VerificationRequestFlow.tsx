import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, Upload, FileCheck, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/prodLogger';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface VerificationRequestFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: 'unverified' | 'pending' | 'verified';
}

const DOCUMENT_TYPES = [
  { id: 'ownership_deed', label: 'Escritura (Ownership Deed)', description: 'Official property deed registered with the Public Registry' },
  { id: 'fideicomiso', label: 'Fideicomiso Certificate', description: 'Bank trust certificate for foreign-owned property' },
  { id: 'rental_license', label: 'Rental License', description: 'Municipal permit to rent property' },
];

export function VerificationRequestFlow({ open, onOpenChange, currentStatus }: VerificationRequestFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('legal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('legal_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        document_type: selectedType,
        status: 'pending',
      });

      if (dbError) throw dbError;

      // Update owner profile verification status
      await supabase.from('owner_profiles').update({
        verification_submitted_at: new Date().toISOString(),
        verification_documents: [{ type: selectedType, file_path: filePath, submitted_at: new Date().toISOString() }],
      } as any).eq('user_id', user.id);

      toast.success('Verification document submitted! Review typically takes 24-48 hours.');
      setStep(2);
    } catch (err) {
      logger.error('Upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const renderStep = () => {
    if (currentStatus === 'verified') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground">You're Verified!</h3>
          <p className="text-sm text-muted-foreground text-center">Your gold badge is displayed on all your listings, building trust with potential tenants.</p>
        </div>
      );
    }

    if (currentStatus === 'pending' || step === 2) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <FileCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Under Review</h3>
          <p className="text-sm text-muted-foreground text-center">Your documents are being reviewed. This typically takes 24-48 hours. You'll be notified once verified.</p>
        </div>
      );
    }

    if (step === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">A verified badge increases your match rate by up to 3x. Tenants trust verified owners more.</p>
          </div>
          <div className="space-y-2">
            {DOCUMENT_TYPES.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setSelectedType(doc.id); setStep(1); }}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  'border-border/50 bg-card'
                )}
              >
                <p className="font-semibold text-sm text-foreground">{doc.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Upload your <strong>{DOCUMENT_TYPES.find(d => d.id === selectedType)?.label}</strong></p>
        <label className={cn(
          'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          isUploading ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
        )}>
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{isUploading ? 'Uploading...' : 'Tap to select file (PDF, JPG, PNG)'}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>
        <Button variant="ghost" className="w-full" onClick={() => setStep(0)}>← Back</Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Owner Verification
          </DialogTitle>
          <DialogDescription>Get a verified badge on your listings to build trust.</DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}


