import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DigitalSignaturePad } from '@/components/DigitalSignaturePad';
import { useSignContract } from '@/hooks/useContracts';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

interface ContractSigningDialogProps {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractSigningDialog: React.FC<ContractSigningDialogProps> = ({
  contractId,
  open,
  onOpenChange
}) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed' | 'uploaded'>('drawn');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const signContract = useSignContract();

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
  };

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature first');
      return;
    }

    try {
      await signContract.mutateAsync({
        contractId,
        signatureData,
        signatureType
      });
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
        .download(contract.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.file_name;
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contract...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b">
          <DialogTitle>Sign Contract: {contract.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Contract Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">{contract.title}</h3>
                <p className="text-sm text-gray-600">
                  {contract.contract_type.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={downloadContract}>
                <Download className="w-4 h-4 mr-2" />
                Download & Review Contract
              </Button>
            </div>

            {contract.terms_and_conditions && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Additional Terms:</h4>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {contract.terms_and_conditions}
                </p>
              </div>
            )}
          </div>

          {/* Signature Section */}
          {!showSignaturePad ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Ready to Sign?</h3>
              <p className="text-gray-600 mb-6">
                Please review the contract carefully before proceeding with your digital signature.
              </p>
              <Button 
                onClick={() => setShowSignaturePad(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Signing Process
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Digital Signature</h3>
              <DigitalSignaturePad
                onSignatureCapture={handleSignatureCapture}
                onClear={() => setSignatureData(null)}
              />
              
              {signatureData && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">Signature Captured!</p>
                  <p className="text-sm text-green-700">
                    Your {signatureType} signature has been captured successfully.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
        </ScrollArea>

          {/* Action Buttons */}
          <div className="shrink-0 flex justify-between px-6 py-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            {signatureData && (
              <Button 
                onClick={handleSign}
                disabled={signContract.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {signContract.isPending ? 'Signing...' : 'Sign Contract'}
              </Button>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
};