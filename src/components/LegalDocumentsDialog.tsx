import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, File, Trash2, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { validateDocumentFile, formatFileSize, FILE_SIZE_LIMITS } from '@/utils/fileValidation';

interface LegalDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  created_at: string;
}

interface LegalDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentTypes = [
  // Property documents
  { value: 'ownership_deed', label: 'Property Ownership Deed', categories: ['property'] },
  { value: 'tax_certificate', label: 'Property Tax Certificate', categories: ['property'] },
  { value: 'rental_license', label: 'Rental License', categories: ['property'] },
  
  // Yacht documents
  { value: 'yacht_registration', label: 'Yacht Registration Certificate', categories: ['yacht'] },
  { value: 'yacht_insurance', label: 'Yacht Insurance Policy', categories: ['yacht'] },
  { value: 'coast_guard_certificate', label: 'Coast Guard Certificate', categories: ['yacht'] },
  { value: 'marine_survey', label: 'Marine Survey Report', categories: ['yacht'] },
  
  // Motorcycle documents
  { value: 'vehicle_title', label: 'Vehicle Title/Ownership', categories: ['motorcycle'] },
  { value: 'registration_card', label: 'Registration Card', categories: ['motorcycle'] },
  { value: 'insurance_policy', label: 'Insurance Policy', categories: ['motorcycle'] },
  { value: 'purchase_receipt', label: 'Purchase Receipt/Invoice', categories: ['motorcycle', 'bicycle'] },
  
  // Bicycle documents (optional)
  { value: 'bicycle_registration', label: 'Bicycle Registration (if applicable)', categories: ['bicycle'] },
  
  // Universal documents
  { value: 'id_document', label: 'Government ID Document', categories: ['property', 'yacht', 'motorcycle', 'bicycle'] },
  { value: 'utility_bill', label: 'Proof of Address (Utility Bill)', categories: ['property', 'yacht', 'motorcycle', 'bicycle'] },
  { value: 'other', label: 'Other Legal Document', categories: ['property', 'yacht', 'motorcycle', 'bicycle'] }
];

export function LegalDocumentsDialog({ open, onOpenChange }: LegalDocumentsDialogProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch user's legal documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('legal_documents' as any)
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as unknown) as LegalDocument[];
    },
    enabled: open
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'pdf';
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user.user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('legal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { data, error: dbError } = await supabase
        .from('legal_documents' as any)
        .insert({
          user_id: user.user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your legal document has been uploaded successfully and is pending verification.",
      });
      setSelectedDocumentType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('legal-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('legal_documents' as any)
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "The document has been removed successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Use centralized validation
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if (!selectedDocumentType) {
      toast({
        title: "Select Document Type",
        description: "Please select the type of document you're uploading.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(
      { file, documentType: selectedDocumentType },
      {
        onSettled: () => setIsUploading(false)
      }
    );
  }, [selectedDocumentType, uploadMutation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-gray-800 border border-gray-700 text-white">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            Legal Documents
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload legal documents to verify your property ownership and build trust with potential tenants.
            Supported formats: PDF, images (JPG, PNG, WebP), Word documents. Maximum size: {formatFileSize(FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE)} per file.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="bg-gray-700/50 border-gray-600/50">
            <CardHeader>
              <CardTitle className="text-white text-lg">Upload New Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type" className="text-white">Document Type</Label>
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-white">Choose File</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      onChange={handleFileSelect}
                      disabled={isUploading || !selectedDocumentType}
                      className="bg-gray-700/50 border-gray-600 text-white file:bg-gray-600 file:border-0 file:text-white"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || !selectedDocumentType}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading document...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="bg-gray-700/50 border-gray-600/50">
            <CardHeader>
              <CardTitle className="text-white text-lg">Your Documents ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm">Upload your first legal document to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-600/30 rounded-xl border border-gray-600/50">
                      <div className="flex items-center gap-4 flex-1">
                        <File className="w-8 h-8 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{documentTypes.find(t => t.value === doc.document_type)?.label}</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                          {doc.verification_notes && (
                            <p className="text-sm text-gray-400 mt-1">{doc.verification_notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.status)}
                        <Button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-500/50 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm font-bold">i</span>
                </div>
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Document Verification Process</p>
                  <ul className="space-y-1 text-blue-200/80">
                    <li>• Documents are reviewed within 24-48 hours</li>
                    <li>• Verified documents increase tenant trust and booking rates</li>
                    <li>• Keep documents current - update if they expire</li>
                    <li>• All documents are stored securely and privately</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}