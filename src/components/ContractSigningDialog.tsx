import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DigitalSignaturePad } from '@/components/DigitalSignaturePad';
import { useSignContract } from '@/hooks/useContracts';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, Download, FileText, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface ContractSigningDialogProps {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAVED_SIG_KEY = (userId: string) => `swipess_signature_${userId}`;

export const ContractSigningDialog: React.FC<ContractSigningDialogProps> = ({
  contractId,
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed' | 'uploaded'>('drawn');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [saveForReuse, setSaveForReuse] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSaved, setUsingSaved] = useState(false);

  const signContract = useSignContract();

  // Load any previously saved signature from localStorage
  useEffect(() => {
    if (!open || !user?.id) return;
    try {
      const stored = localStorage.getItem(SAVED_SIG_KEY(user.id));
      if (stored) setSavedSignature(stored);
    } catch (_) {}
  }, [open, user?.id]);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_contracts')
        .select('*')
        .eq('id', contractId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!contractId
  });

  const handleSignatureCapture = (data: string, type: 'drawn' | 'typed' | 'uploaded') => {
    setSignatureData(data);
    setSignatureType(type);
    setUsingSaved(false);
  };

  const handleUseSaved = () => {
    if (!savedSignature) return;
    setSignatureData(savedSignature);
    setSignatureType('drawn');
    setUsingSaved(true);
    setShowSignaturePad(true);
  };

  const handleClearSaved = () => {
    if (!user?.id) return;
    try { localStorage.removeItem(SAVED_SIG_KEY(user.id)); } catch (_) {}
    setSavedSignature(null);
    setUsingSaved(false);
    setSignatureData(null);
    toast.success('Saved signature cleared');
  };

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature first');
      return;
    }

    if (saveForReuse && user?.id && !usingSaved) {
      try { localStorage.setItem(SAVED_SIG_KEY(user.id), signatureData); } catch (_) {}
      setSavedSignature(signatureData);
      toast.success('Signature saved for future documents');
    }

    try {
      await signContract.mutateAsync({ contractId, signatureData, signatureType });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error signing contract:', error);
    }
  };

  const downloadContract = async () => {
    if (!contract) return;
    try {
      const { data, error } = await supabase.storage
        .from('contracts')
        .download((contract as any).file_path ?? contract.id);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = (contract as any).file_name ?? `contract-${contract.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading contract:', error);
      toast.error('Failed to download contract');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading contract...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b">
          <DialogTitle>Sign Contract: {contract.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Contract Details */}
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-[#EB4898]" />
                <div>
                  <h3 className="font-semibold text-foreground">{contract.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(contract.template_type || 'contract').replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadContract}>
                <Download className="w-4 h-4 mr-2" />
                Download & Review Contract
              </Button>
              {contract.content && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-foreground">Additional Terms:</h4>
                  <p className="text-sm text-muted-foreground bg-card p-3 rounded border border-border">{contract.content}</p>
                </div>
              )}
            </div>

            {/* Signature Section */}
            {!showSignaturePad ? (
              <div className="text-center py-8 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Ready to Sign?</h3>
                <p className="text-muted-foreground text-sm">Please review the contract carefully before proceeding.</p>

                {/* Saved signature offer */}
                {savedSignature && (
                  <div className={cn('rounded-2xl border p-4 text-left space-y-3', isLight ? 'bg-[#EB4898]/5 border-[#EB4898]/20' : 'bg-[#EB4898]/10 border-[#EB4898]/20')}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#EB4898]">Saved Signature Found</span>
                      <button onClick={handleClearSaved} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-bold uppercase tracking-wider">
                        Clear
                      </button>
                    </div>
                    <img src={savedSignature} alt="Saved signature" className="max-h-16 max-w-[200px] object-contain" />
                    <div className="flex gap-2">
                      <Button onClick={handleUseSaved} size="sm" className="flex-1 bg-[#EB4898] hover:bg-[#d63c85] text-white rounded-xl text-xs font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Use Saved Signature
                      </Button>
                      <Button onClick={() => setShowSignaturePad(true)} variant="outline" size="sm" className="flex-1 rounded-xl text-xs font-black uppercase tracking-wider">
                        Draw New
                      </Button>
                    </div>
                  </div>
                )}

                {!savedSignature && (
                  <Button onClick={() => setShowSignaturePad(true)} className="bg-[#EB4898] hover:bg-[#d63c85] text-white">
                    Start Signing Process
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Your Digital Signature</h3>
                  {usingSaved && (
                    <button
                      onClick={() => { setUsingSaved(false); setSignatureData(null); }}
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Draw New
                    </button>
                  )}
                </div>

                {usingSaved && savedSignature ? (
                  <div className={cn('rounded-[2rem] border p-6 flex items-center justify-center', isLight ? 'bg-black/[0.04] border-black/5' : 'bg-white/[0.04] border-white/10')}>
                    <img src={savedSignature} alt="Saved signature" className="max-h-24 object-contain" />
                  </div>
                ) : (
                  <DigitalSignaturePad onSignatureCapture={handleSignatureCapture} onClear={() => setSignatureData(null)} />
                )}

                <AnimatePresence>
                  {signatureData && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn('p-4 rounded-2xl border', isLight ? 'bg-[#EB4898]/5 border-[#EB4898]/20' : 'bg-[#EB4898]/10 border-[#EB4898]/20')}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-[#EB4898]" />
                        <p className="text-[#EB4898] font-black text-sm uppercase tracking-wider">Signature Ready</p>
                      </div>

                      {/* Save for reuse toggle — only show if not already using saved */}
                      {!usingSaved && (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div
                            onClick={() => setSaveForReuse(v => !v)}
                            className={cn(
                              'w-10 h-6 rounded-full transition-colors relative flex-shrink-0',
                              saveForReuse ? 'bg-[#EB4898]' : isLight ? 'bg-black/20' : 'bg-white/20'
                            )}
                          >
                            <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', saveForReuse ? 'translate-x-5' : 'translate-x-1')} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground flex items-center gap-1">
                              <Save className="w-3.5 h-3.5" />
                              Save signature for reuse
                            </p>
                            <p className="text-[10px] text-muted-foreground">Reuse on future documents without redrawing</p>
                          </div>
                        </label>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 flex justify-between px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {signatureData && (
            <Button onClick={handleSign} disabled={signContract.isPending} className="bg-[#EB4898] hover:bg-[#d63c85] text-white">
              {signContract.isPending ? 'Signing...' : 'Sign Contract'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
