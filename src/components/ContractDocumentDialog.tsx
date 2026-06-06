import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, ChevronDown, ChevronUp,
  Download, FileText, Italic, List, ListOrdered, Minus, Plus, Printer,
  Redo, Save, Underline, Undo, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ContractTemplate } from '@/data/contractTemplates';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { useCreateContract } from '@/hooks/useContracts';
import { escapeHTML, sanitizeHTML } from '@/utils/sanitizeHTML';
import { getVariablesForTemplate, applyVariablesToContent } from '@/utils/contractUtils';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

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
  const { isLight } = useAppTheme();
  const [documentTitle, setDocumentTitle] = useState(template?.name || 'New Contract');
  const [fontSize, setFontSize] = useState(14);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showVars, setShowVars] = useState(true);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const createContract = useCreateContract();
  const safeContent = useMemo(() => sanitizeHTML(template?.content || ''), [template?.content]);
  const variables = useMemo(() => getVariablesForTemplate(template?.id || ''), [template?.id]);

  React.useEffect(() => {
    if (template) {
      setDocumentTitle(template.name);
      setVarValues({});
    }
  }, [template]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleApplyVariables = useCallback(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const applied = applyVariablesToContent(currentHtml, varValues);
    editorRef.current.innerHTML = applied;
    toast.success('Variables applied to document');
  }, [varValues]);

  const isValidSignatureDataUrl = (data: string | null): boolean => {
    if (!data) return false;
    return /^data:image\/(png|jpeg|svg\+xml);base64,/.test(data);
  };

  const handlePrint = () => {
    const content = sanitizeHTML(editorRef.current?.innerHTML || '');
    const safeTitle = escapeHTML(documentTitle);
    const safeSignature = isValidSignatureDataUrl(signatureData) ? signatureData : null;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${safeTitle}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              h1, h2, h3 { margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              td, th { padding: 8px; border: 1px solid #ccc; }
              ul, ol { margin-left: 20px; }
            </style>
          </head>
          <body>
            ${content}
            ${safeSignature ? `<div style="margin-top: 30px;"><img src="${safeSignature}" style="max-width: 200px;" /></div>` : ''}
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

  const handleSignatureCapture = (data: string, _type: 'drawn' | 'typed' | 'uploaded') => {
    setSignatureData(data);
    toast.success('Signature captured!');
  };

  const handleSaveAsFile = async () => {
    const content = sanitizeHTML(editorRef.current?.innerHTML || '');
    const safeTitle = escapeHTML(documentTitle);
    const safeSignature = isValidSignatureDataUrl(signatureData) ? signatureData : null;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeTitle}</title>
<style>body{font-family:'Times New Roman',serif;padding:40px;line-height:1.6;max-width:800px;margin:0 auto;}h1,h2,h3{margin-top:20px;}table{width:100%;border-collapse:collapse;}td,th{padding:8px;border:1px solid #ccc;}</style>
</head><body>${content}${safeSignature ? `<div style="margin-top:30px;"><p><strong>Digital Signature:</strong></p><img src="${safeSignature}" style="max-width:200px;"/></div>` : ''}</body></html>`;
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
      const content = sanitizeHTML(editorRef.current.innerHTML);
      const safeTitle = escapeHTML(documentTitle);
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeTitle}</title>
<style>body{font-family:'Times New Roman',serif;padding:40px;line-height:1.6;}</style>
</head><body>${content}</body></html>`;
      const blob = new Blob([htmlContent], { type: 'application/pdf' });
      const file = new File([blob], `${documentTitle}.pdf`, { type: 'application/pdf' });

      let contractType: 'lease' | 'rental' | 'purchase' | 'rental_agreement' = 'rental';
      if (template?.category === 'lease' || template?.category === 'service') contractType = 'lease';
      else if (template?.category === 'purchase' || template?.category === 'promise') contractType = 'purchase';
      else if (template?.category === 'rental_agreement') contractType = 'rental_agreement';

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
    } catch (_error) {
      toast.error('Failed to save contract');
    } finally {
      setIsSaving(false);
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10));

  if (!template) return null;

  const filledCount = Object.values(varValues).filter(v => v.trim()).length;

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
            <FileText className="w-5 h-5 text-[#EB4898] shrink-0" />
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
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg min-w-max">
              <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0"><Bold className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0"><Italic className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0"><Underline className="w-4 h-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0"><AlignLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0"><AlignCenter className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0"><AlignRight className="w-4 h-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0"><List className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0"><ListOrdered className="w-4 h-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={decreaseFontSize} className="h-8 w-8 p-0"><Minus className="w-4 h-4" /></Button>
                <span className="text-sm w-8 text-center">{fontSize}</span>
                <Button variant="ghost" size="sm" onClick={increaseFontSize} className="h-8 w-8 p-0"><Plus className="w-4 h-4" /></Button>
              </div>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => execCommand('undo')} className="h-8 w-8 p-0"><Undo className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => execCommand('redo')} className="h-8 w-8 p-0"><Redo className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs"><Printer className="w-3 h-3 mr-1" />Print</Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs"><Download className="w-3 h-3 mr-1" />PDF</Button>
            <Button variant="outline" size="sm" onClick={handleSaveAsFile} className="text-xs"><Save className="w-3 h-3 mr-1" />Save File</Button>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 sm:mx-6 mt-2 w-auto">
            <TabsTrigger value="edit">Edit Document</TabsTrigger>
            <TabsTrigger value="sign">Sign Document</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
            {/* Variables Panel */}
            {variables.length > 0 && (
              <div className={cn('mx-4 sm:mx-6 mt-3 rounded-2xl border overflow-hidden', isLight ? 'bg-[#EB4898]/5 border-[#EB4898]/20' : 'bg-[#EB4898]/10 border-[#EB4898]/20')}>
                <button
                  onClick={() => setShowVars(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-[#EB4898]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#EB4898]">
                      Auto-Fill Variables
                    </span>
                    {filledCount > 0 && (
                      <span className="text-[10px] font-bold bg-[#EB4898] text-white rounded-full px-2 py-0.5">
                        {filledCount}/{variables.length}
                      </span>
                    )}
                  </div>
                  {showVars ? <ChevronUp className="w-4 h-4 text-[#EB4898]" /> : <ChevronDown className="w-4 h-4 text-[#EB4898]" />}
                </button>

                <AnimatePresence>
                  {showVars && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {variables.map(variable => (
                            <div key={variable.key} className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {variable.label}
                              </Label>
                              <Input
                                type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'text' : 'text'}
                                placeholder={variable.placeholder}
                                value={varValues[variable.key] || ''}
                                onChange={e => setVarValues(prev => ({ ...prev, [variable.key]: e.target.value }))}
                                className="h-9 text-sm rounded-xl border-[#EB4898]/30 focus-visible:ring-[#EB4898]/40"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleApplyVariables}
                          disabled={filledCount === 0}
                          className="w-full h-10 rounded-xl font-black text-xs uppercase tracking-wider text-white disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #be185d, #EB4898)' }}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply to Document
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Pink <span style={{ color: '#EB4898', fontStyle: 'italic' }}>{{fields}}</span> in the document will be replaced with your values
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <ScrollArea className="flex-1 mt-3">
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[400px] p-4 sm:p-6 outline-none bg-white text-black"
                style={{ fontFamily: "'Times New Roman', serif", fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: safeContent }}
                suppressContentEditableWarning
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sign" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Add Your Signature</h3>
                  <p className="text-sm text-muted-foreground">Draw your signature below</p>
                </div>
                <DigitalSignaturePad onSignatureCapture={handleSignatureCapture} onClear={() => setSignatureData(null)} />
                {signatureData && (
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-rose-800 font-medium text-center">Signature captured successfully!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 p-4 border-t bg-muted/30">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <div className="flex gap-2">
              <Button onClick={handleSaveToContracts} disabled={isSaving} className="bg-[#EB4898] hover:bg-[#d63c85] flex-1 sm:flex-none">
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
