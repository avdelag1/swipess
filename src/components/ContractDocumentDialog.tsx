import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo, Redo, Download, Printer, FileText,
  Save, Send, Minus, Plus, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { ContractTemplate } from '@/data/contractTemplates';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { useCreateContract } from '@/hooks/useContracts';

interface ContractDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ContractTemplate;
  onBack?: () => void;
  clientId?: string;
  listingId?: string;
}

export const ContractDocumentDialog: React.FC<ContractDocumentDialogProps> = ({
  open,
  onOpenChange,
  template,
  onBack,
  clientId,
  listingId
}) => {
  const [documentTitle, setDocumentTitle] = useState(template?.name || 'New Contract');
  const [fontSize, setFontSize] = useState(14);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const createContract = useCreateContract();

  React.useEffect(() => {
    if (template) {
      setDocumentTitle(template.name);
    }
  }, [template]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentTitle}</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                padding: 40px;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
              }
              h1, h2, h3 { margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              td, th { padding: 8px; border: 1px solid #ccc; }
              ul, ol { margin-left: 20px; }
            </style>
          </head>
          <body>
            ${content}
            ${signatureData ? `<div style="margin-top: 30px;"><img src="${signatureData}" style="max-width: 200px;" /></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportPDF = () => {
    handlePrint();
    toast.success('Print dialog opened - Save as PDF');
  };

  const handleSignatureCapture = (data: string, type: 'drawn' | 'typed' | 'uploaded') => {
    setSignatureData(data);
    toast.success('Signature captured!');
  };

  const handleSaveAsFile = async () => {
    const content = editorRef.current?.innerHTML || '';

    // Create HTML file content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      padding: 40px;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { padding: 8px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  ${content}
  ${signatureData ? `<div style="margin-top: 30px;"><p><strong>Digital Signature:</strong></p><img src="${signatureData}" style="max-width: 200px;" /></div>` : ''}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document saved!');
  };

  const handleSaveToContracts = async () => {
    if (!editorRef.current) return;

    setIsSaving(true);
    try {
      const content = editorRef.current.innerHTML;

      // Create HTML file content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 8px; border: 1px solid #ccc; }
  </style>
</head>
<body>${content}</body>
</html>`;

      // Convert to PDF-like blob (HTML that can be printed as PDF)
      const blob = new Blob([htmlContent], { type: 'application/pdf' });
      const file = new File([blob], `${documentTitle}.pdf`, { type: 'application/pdf' });

      // Determine contract type from template
      let contractType: 'lease' | 'rental' | 'purchase' | 'rental_agreement' = 'rental';
      if (template?.category === 'lease' || template?.category === 'service') {
        contractType = 'lease';
      } else if (template?.category === 'purchase' || template?.category === 'promise') {
        contractType = 'purchase';
      } else if (template?.category === 'rental_agreement') {
        contractType = 'rental_agreement';
      }

      await createContract.mutateAsync({
        title: documentTitle,
        contract_type: contractType,
        file,
        client_id: clientId,
        listing_id: listingId,
        terms_and_conditions: signatureData ? 'Document signed digitally' : undefined
      });

      toast.success('Contract saved successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save contract');
    } finally {
      setIsSaving(false);
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10));

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[900px] h-[95vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-base sm:text-lg font-semibold border-none focus-visible:ring-0 p-0 h-auto flex-1"
              placeholder="Document Title"
            />
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="shrink-0 px-4 sm:px-6 pb-2 space-y-2">
          {/* Text Formatting - Scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg min-w-max">
              <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0" title="Bold">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0" title="Italic">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0" title="Underline">
                <Underline className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0">
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0">
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0">
                <AlignRight className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0">
                <ListOrdered className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={decreaseFontSize} className="h-8 w-8 p-0">
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm w-8 text-center">{fontSize}</span>
                <Button variant="ghost" size="sm" onClick={increaseFontSize} className="h-8 w-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button variant="ghost" size="sm" onClick={() => execCommand('undo')} className="h-8 w-8 p-0">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('redo')} className="h-8 w-8 p-0">
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveAsFile} className="text-xs">
              <Save className="w-3 h-3 mr-1" />
              Save File
            </Button>
          </div>
        </div>

        <Separator />

        {/* Content Area with Tabs */}
        <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 sm:mx-6 mt-2 w-auto">
            <TabsTrigger value="edit">Edit Document</TabsTrigger>
            <TabsTrigger value="sign">Sign Document</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[400px] p-4 sm:p-6 outline-none bg-white"
                style={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ __html: template.content }}
                suppressContentEditableWarning
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sign" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Add Your Signature</h3>
                  <p className="text-sm text-gray-600">
                    Draw, type, or upload your signature below
                  </p>
                </div>

                <DigitalSignaturePad
                  onSignatureCapture={handleSignatureCapture}
                  onClear={() => setSignatureData(null)}
                />

                {signatureData && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium text-center">
                      Signature captured successfully!
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveToContracts}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save to Contracts'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
