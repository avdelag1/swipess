import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateContract } from '@/hooks/useContracts';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';
import { logger } from '@/utils/prodLogger';

interface ContractUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractUploadDialog: React.FC<ContractUploadDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<'lease' | 'rental' | 'purchase' | 'rental_agreement'>('rental');
  const [file, setFile] = useState<File | null>(null);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  
  const createContract = useCreateContract();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "File size must be less than 10MB. Please compress your PDF and try again.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a contract title.",
        variant: "destructive"
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Missing file",
        description: "Please upload a contract PDF file.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createContract.mutateAsync({
        title: title.trim(),
        contract_type: contractType,
        file,
        terms_and_conditions: termsAndConditions.trim() || undefined
      });
      
      // Reset form
      setTitle('');
      setContractType('rental');
      setFile(null);
      setTermsAndConditions('');
      onOpenChange(false);
      
      toast({
        title: "Contract created",
        description: "Your contract has been created successfully.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error creating contract:', error);
      }
      toast({
        title: "Failed to create contract",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="contract-title">Contract Title *</Label>
            <Input
              id="contract-title"
              placeholder="e.g., Monthly Rental Agreement - Villa Sunset"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contract-type">Contract Type *</Label>
            <Select value={contractType} onValueChange={(value: any) => setContractType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rental">Rental Agreement</SelectItem>
                <SelectItem value="lease">Lease Agreement</SelectItem>
                <SelectItem value="purchase">Purchase Contract</SelectItem>
                <SelectItem value="rental_agreement">Monthly Rental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contract-file">Contract File (PDF) *</Label>
            <div className="mt-2">
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <Label htmlFor="contract-file" className="cursor-pointer">
                      <span className="text-lg font-medium">Upload Contract PDF</span>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF files up to 10MB
                      </p>
                    </Label>
                    <Input
                      id="contract-file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-600" />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="terms">Additional Terms & Conditions</Label>
            <Textarea
              id="terms"
              placeholder="Add any additional terms or special conditions..."
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createContract.isPending || !title.trim() || !file}
            >
              {createContract.isPending ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};