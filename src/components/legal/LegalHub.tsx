import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ChevronDown, ChevronRight, ChevronUp, Clock,
  Download, FileDown, FileText, PenLine, PenTool, Plus, Printer,
  Save, Send, ShieldCheck, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientTemplates, ContractTemplate, getTemplateById, LEASE_TEMPLATES, ownerTemplates } from '@/data/contractTemplates';
import { DocumentEditorToolbar, type DocumentFontId, getFontCss } from '@/components/legal/DocumentEditorToolbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DigitalSignaturePad } from '@/components/DigitalSignaturePad';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { appToast } from '@/utils/appNotification';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeHTML } from '@/utils/sanitizeHTML';
import { SECTION_RESET_EVENT } from '@/utils/sectionNavigation';
import { downloadAsPDF, downloadAsWord } from '@/utils/documentExport';
import { applyVariablesToContent, getVariablesForTemplate } from '@/utils/contractUtils';
import {
  computeContractStatus,
  notifyContractEvent,
  resolveCounterpartyId,
  userNeedsSignature,
} from '@/utils/contractSigning';

// Plain text → simple, safe HTML paragraphs (used when the AI returns cleaned
// plain text that we drop back into the contentEditable document).
function textToHtml(text: string): string {
  const escape = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escape(para).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

type HubView = 'dashboard' | 'browse' | 'editor' | 'signing';

function Badge({ children, className, variant = "secondary" }: { children: React.ReactNode, className?: string, variant?: "secondary" | "primary" }) {
  const { isLight } = useAppTheme();
  return (
    <span className={cn(
      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-colors",
      variant === "secondary" ? (isLight ? "bg-black/5 text-black/70" : "bg-white/5 text-white/70") : "bg-primary/20 text-primary border border-primary/20",
      className
    )}>
      {children}
    </span>
  );
}

export function ContractsVault() {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<HubView>('dashboard');
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [activeContract, setActiveContract] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftEffectiveDate, setDraftEffectiveDate] = useState('');
  const [draftMonthlyValue, setDraftMonthlyValue] = useState('');
  const [draftCounterparty, setDraftCounterparty] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [quickFillValues, setQuickFillValues] = useState<Record<string, string>>({});
  const [quickFillOpen, setQuickFillOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState<DocumentFontId>('times');
  const docRef = useRef<HTMLDivElement>(null);
  const { enhanceText, isEnhancing } = useAIEnhanceText();

  const allTemplates = [...ownerTemplates, ...clientTemplates];
  const otherTemplates = allTemplates.filter(
    (t) => !LEASE_TEMPLATES.some((lt) => lt.id === t.id),
  );

  useEffect(() => {
    if (!user) return;
    fetchContracts();
  }, [user]);

  useEffect(() => {
    const docId = searchParams.get('doc');
    if (!docId || contracts.length === 0) return;
    const match = contracts.find((c) => c.id === docId);
    if (!match) return;
    handleOpenContract(match);
    const next = new URLSearchParams(searchParams);
    next.delete('doc');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, contracts.length]);

  // Re-tapping the Legal nav button (bottom bar) returns the hub to its home
  // view instead of leaving the user stranded in the editor/signing screens.
  useEffect(() => {
    const handleReset = () => setView('dashboard');
    window.addEventListener(SECTION_RESET_EVENT, handleReset);
    return () => window.removeEventListener(SECTION_RESET_EVENT, handleReset);
  }, []);

  // Seed the editable document once when the editor opens for a template.
  useEffect(() => {
    if (view === 'editor' && docRef.current) {
      docRef.current.innerHTML = sanitizeHTML(draftContent || selectedTemplate?.content || '');
    }
    // Only re-seed when entering the editor or switching template — NOT on each
    // keystroke (that would reset the caret).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedTemplate?.id, activeContract?.id]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('digital_contracts')
      .select('*')
      .or(`owner_id.eq.${user?.id},client_id.eq.${user?.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('[ContractsVault] fetch failed:', error);
      appToast.error('Could not load contracts', 'Pull to refresh or try again later.');
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    triggerHaptic('medium');
    setView('browse');
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    triggerHaptic('heavy');
    setActiveContract(null);
    setSelectedTemplate(template);
    setDraftTitle(template.name);
    setDraftEffectiveDate('');
    setDraftMonthlyValue('');
    setDraftCounterparty('');
    setDraftContent(template.content);
    setQuickFillValues({});
    setQuickFillOpen(true);
    setView('editor');
  };

  const resolveTemplateFromContract = (contract: any): ContractTemplate => {
    const known = contract.template_type ? getTemplateById(contract.template_type) : undefined;
    if (known) return known;
    return {
      id: contract.template_type || 'saved-contract',
      name: contract.title || 'Saved Document',
      description: 'Saved document',
      category: (contract.metadata?.template_category as ContractTemplate['category']) || 'lease',
      forRole: 'both',
      content: contract.content || '',
    };
  };

  const handleOpenContract = (contract: any) => {
    triggerHaptic('medium');
    if (contract.status === 'signed' || (user && userNeedsSignature(contract, user.id))) {
      setActiveContract(contract);
      setView('signing');
      return;
    }
    const template = resolveTemplateFromContract(contract);
    setActiveContract(contract);
    setSelectedTemplate(template);
    setDraftTitle(contract.title || template.name);
    setDraftContent(contract.content || template.content);
    setDraftEffectiveDate(contract.metadata?.effective_date || '');
    setDraftMonthlyValue(contract.metadata?.monthly_value || '');
    setDraftCounterparty(contract.metadata?.counterparty || '');
    setQuickFillValues({});
    setQuickFillOpen(false);
    setView('editor');
  };

  // Apply Quick Fill values into the live document (replaces matching blank fields)
  const handleApplyQuickFill = useCallback(() => {
    const el = docRef.current;
    if (!el || !selectedTemplate) return;
    const filled = applyVariablesToContent(selectedTemplate.content, quickFillValues);
    const safe = sanitizeHTML(filled);
    el.innerHTML = safe;
    setDraftContent(safe);
    triggerHaptic('success');
    appToast.success('Fields applied to document', 'Review the document and make any final edits.');
  }, [quickFillValues, selectedTemplate]);

  // Return the current document HTML (prefer live DOM content)
  const getDocHTML = useCallback(() => {
    return docRef.current?.innerHTML || draftContent || selectedTemplate?.content || '';
  }, [draftContent, selectedTemplate]);

  const handleDownloadPDF = useCallback(() => {
    triggerHaptic('medium');
    downloadAsPDF(sanitizeHTML(getDocHTML()), draftTitle || selectedTemplate?.name || 'Contract');
  }, [getDocHTML, draftTitle, selectedTemplate]);

  const handleDownloadWord = useCallback(() => {
    triggerHaptic('medium');
    downloadAsWord(sanitizeHTML(getDocHTML()), draftTitle || selectedTemplate?.name || 'Contract');
  }, [getDocHTML, draftTitle, selectedTemplate]);

  const handleDownloadContractPDF = useCallback((contract: any) => {
    triggerHaptic('light');
    downloadAsPDF(sanitizeHTML(contract.content || ''), contract.title || 'Contract');
  }, []);

  const handleDownloadContractWord = useCallback((contract: any) => {
    triggerHaptic('light');
    downloadAsWord(sanitizeHTML(contract.content || ''), contract.title || 'Contract');
  }, []);

  const applyFormat = useCallback((command: string, value?: string) => {
    triggerHaptic('light');
    docRef.current?.focus();
    try { document.execCommand(command, false, value); } catch { /* not supported */ }
  }, []);

  const handleImproveWithAI = useCallback(async () => {
    const el = docRef.current;
    if (!el) return;
    const plain = (el.innerText || '').trim();
    if (plain.length < 20) {
      appToast.error('Add a bit more text before improving.');
      return;
    }
    const improved = await enhanceText(plain, 'legal');
    if (improved) {
      const html = textToHtml(improved);
      el.innerHTML = html;
      setDraftContent(html);
      triggerHaptic('success');
      appToast.success('Document polished', 'Review the cleaned-up wording, then save.');
    }
  }, [enhanceText]);

  const handleStartSigning = (contract: any) => {
    triggerHaptic('medium');
    setActiveContract(contract);
    setView('signing');
  };

  const handleClose = () => {
    setView('dashboard');
    setSelectedTemplate(null);
    setActiveContract(null);
    setDraftContent('');
  };

  const handleSaveDraft = async (thenSign = false) => {
    if (!user || !selectedTemplate || isSavingDraft) return;
    setIsSavingDraft(true);
    try {
      const editedContent = sanitizeHTML(docRef.current?.innerHTML || draftContent || selectedTemplate.content);
      const metadata = {
        effective_date: draftEffectiveDate || null,
        monthly_value: draftMonthlyValue || null,
        counterparty: draftCounterparty.trim() || null,
        template_category: selectedTemplate.category,
      };

      let saved = activeContract;

      if (activeContract?.id) {
        const { data, error } = await supabase
          .from('digital_contracts')
          .update({
            title: draftTitle.trim() || selectedTemplate.name,
            content: editedContent,
            metadata,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', activeContract.id)
          .select('*')
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from('digital_contracts').insert({
          title: draftTitle.trim() || selectedTemplate.name,
          template_type: selectedTemplate.id,
          content: editedContent,
          owner_id: user.id,
          client_id: user.id,
          status: 'draft',
          metadata,
        } as any).select('*').single();
        if (error) throw error;
        saved = data;
      }

      triggerHaptic('success');
      await fetchContracts();

      if (thenSign && saved) {
        appToast.success('Lease saved', 'Add your signature to finalize.');
        setActiveContract(saved);
        setView('signing');
      } else {
        appToast.success(
          activeContract?.id ? 'Document updated' : 'Lease saved to your vault',
          'Open it any time to edit or sign.',
        );
        handleClose();
      }
    } catch (err) {
      logger.error('[ContractsVault] draft save failed:', err);
      appToast.error('Could not save lease', 'Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!user || !selectedTemplate || isSending) return;
    if (!draftCounterparty.trim()) {
      appToast.error('Add tenant email', 'Enter the other party\'s email in Document Details.');
      return;
    }
    setIsSending(true);
    try {
      const party = await resolveCounterpartyId(draftCounterparty);
      if (!party) {
        appToast.error('User not found', 'No Swipess account matches that email or name.');
        return;
      }
      if (party.id === user.id) {
        appToast.error('Choose your tenant', 'Send the lease to the other party, not yourself.');
        return;
      }

      const editedContent = sanitizeHTML(docRef.current?.innerHTML || draftContent || selectedTemplate.content);
      const metadata = {
        effective_date: draftEffectiveDate || null,
        monthly_value: draftMonthlyValue || null,
        counterparty: party.name,
        counterparty_email: draftCounterparty.trim(),
        template_category: selectedTemplate.category,
      };

      let saved = activeContract;
      if (activeContract?.id) {
        const { data, error } = await supabase
          .from('digital_contracts')
          .update({
            title: draftTitle.trim() || selectedTemplate.name,
            content: editedContent,
            client_id: party.id,
            status: 'sent',
            metadata,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', activeContract.id)
          .select('*')
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from('digital_contracts').insert({
          title: draftTitle.trim() || selectedTemplate.name,
          template_type: selectedTemplate.id,
          content: editedContent,
          owner_id: user.id,
          client_id: party.id,
          status: 'sent',
          metadata,
        } as any).select('*').single();
        if (error) throw error;
        saved = data;
      }

      await notifyContractEvent({
        recipientId: party.id,
        senderId: user.id,
        contractId: saved.id,
        title: 'Lease Ready to Sign',
        type: 'contract_pending',
        linkPath: '/client/contracts',
        message: `"${draftTitle.trim() || selectedTemplate.name}" is waiting for your signature.`,
      });

      triggerHaptic('success');
      appToast.success('Sent for signature', `${party.name} will be notified in the app.`);
      await fetchContracts();
      handleClose();
    } catch (err) {
      logger.error('[ContractsVault] send failed:', err);
      appToast.error('Could not send lease', 'Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSignatureCapture = async (sig: string, signatureType: 'drawn' | 'typed' | 'uploaded' = 'drawn') => {
    if (!user || !activeContract || isSavingSignature) return;
    setIsSavingSignature(true);
    let signatureId: string | null = null;
    try {
      const { data: sigData, error: sigError } = await supabase.from('contract_signatures').insert({
        contract_id: activeContract.id,
        signer_id: user.id,
        signature_data: sig,
        signature_type: signatureType,
        user_agent: navigator.userAgent,
      }).select('id').single();
      if (sigError) throw sigError;
      signatureId = sigData?.id ?? null;

      const isOwner = activeContract.owner_id === user.id;
      const isClient = activeContract.client_id === user.id;
      if (!isOwner && !isClient) throw new Error('Not authorized to sign this contract');

      const signatureUpdate: Record<string, unknown> = isOwner
        ? { owner_signature: sig, owner_signed_at: new Date().toISOString() }
        : { client_signature: sig, client_signed_at: new Date().toISOString() };

      const nextStatus = computeContractStatus({
        ...activeContract,
        ...signatureUpdate,
      });
      signatureUpdate.status = nextStatus;

      const { error: updateError } = await supabase
        .from('digital_contracts')
        .update(signatureUpdate as any)
        .eq('id', activeContract.id);
      if (updateError) throw updateError;

      const otherPartyId = isOwner ? activeContract.client_id : activeContract.owner_id;
      const contractTitle = activeContract.title || 'Lease';
      if (nextStatus === 'signed' && otherPartyId && otherPartyId !== user.id) {
        await notifyContractEvent({
          recipientId: otherPartyId,
          senderId: user.id,
          contractId: activeContract.id,
          title: 'Lease Fully Signed',
          type: 'contract_signed',
          linkPath: isOwner ? '/client/contracts' : '/owner/contracts',
          message: `"${contractTitle}" is now fully executed.`,
        });
      } else if (nextStatus === 'sent' && isOwner && otherPartyId && otherPartyId !== user.id) {
        await notifyContractEvent({
          recipientId: otherPartyId,
          senderId: user.id,
          contractId: activeContract.id,
          title: 'Your Turn to Sign',
          type: 'contract_pending',
          linkPath: '/client/contracts',
          message: `Landlord signed "${contractTitle}" — add your signature to complete.`,
        });
      }

      triggerHaptic('success');
      appToast.success(
        nextStatus === 'signed' ? 'Lease fully signed' : 'Signature saved',
        nextStatus === 'signed' ? 'Both parties are on record.' : 'Waiting for the other party to sign.',
      );
      await fetchContracts();
      handleClose();
    } catch (err) {
      logger.error('[ContractsVault] signature save failed:', err);
      // Clean up orphaned signature if contract update failed
      if (signatureId) {
        const { error: cleanupErr } = await supabase.from('contract_signatures').delete().eq('id', signatureId);
        if (cleanupErr) logger.warn('[LegalHub] orphaned signature cleanup failed:', cleanupErr);
      }
      appToast.error('Could not save signature', 'Please try again.');
    } finally {
      setIsSavingSignature(false);
    }
  };

  return (
    <div className={cn(
      "relative w-full backdrop-blur-3xl rounded-[3rem] border shadow-2xl transition-colors duration-500",
      isLight ? "bg-white/80 border-slate-200" : "bg-black/50 border-white/10"
    )}>
      {/* 🛸 BACKGROUND DECOR */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* 🛸 HEADER */}
      <div className={cn("relative z-10 p-8 flex items-center justify-between border-b", isLight ? "border-slate-200" : "border-white/5")}>
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center", isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10")}>
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className={cn("text-xl font-black tracking-tight uppercase italic", isLight ? "text-black" : "text-white")}>Contracts Vault</h2>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-20", isLight ? "text-black" : "text-white")}>Secured Digital Protocols v2.0</p>
          </div>
        </div>
        
        {view !== 'dashboard' && (
          <Button variant="ghost" onClick={handleClose} className={cn("rounded-full w-10 h-10 p-0", isLight ? "hover:bg-slate-100" : "hover:bg-white/5")}>
            <X className={cn("w-5 h-5", isLight ? "text-black/70" : "text-white/70")} />
          </Button>
        )}
      </div>

      <div className="relative z-10 p-8">
        <AnimatePresence mode="sync">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* 🛸 QUICK ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Button 
                  onClick={handleCreateNew}
                  className="h-44 rounded-[2.5rem] bg-primary hover:bg-primary/90 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">New Lease / Contract</span>
                </Button>

                <div className={cn("p-10 rounded-[2.5rem] border flex flex-col justify-between", isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10")}>
                  <div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-widest opacity-70 mb-2", isLight ? "text-black" : "text-white")}>Awaiting Signature</h4>
                    <p className={cn("text-5xl font-black italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                      {user ? contracts.filter(c => userNeedsSignature(c, user.id)).length : 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary italic mt-6">
                    <Clock className="w-3 h-3" />
                    <span>Live updates</span>
                  </div>
                </div>
              </div>

              {/* 🛸 VAULT LIST */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-70", isLight ? "text-black" : "text-white")}>Active Vault</h3>
                  <Download className={cn("w-4 h-4 opacity-20", isLight ? "text-black" : "text-white")} />
                </div>

                {loading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className={cn("h-28 w-full rounded-[2.2rem]", isLight ? "bg-slate-100" : "bg-white/5")} />)
                ) : contracts.length === 0 ? (
                  <div className={cn("p-16 text-center rounded-[3rem] border border-dashed", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/10")}>
                    <FileText className={cn("w-12 h-12 mx-auto mb-6 opacity-10", isLight ? "text-black" : "text-white")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-20", isLight ? "text-black" : "text-white")}>No legal records found</p>
                  </div>
                ) : (
                  contracts.map((contract, i) => (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "group p-6 rounded-[2.5rem] border transition-all flex items-center justify-between",
                        isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/[0.03] border-white/5 hover:border-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn("w-16 h-16 rounded-[1.2rem] border flex items-center justify-center transition-colors", isLight ? "bg-black/5 border-slate-200 group-hover:bg-primary/10 group-hover:border-primary/20" : "bg-white/5 border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20")}>
                          <FileText className={cn("w-7 h-7 group-hover:text-primary transition-colors", isLight ? "text-black/40" : "text-white/70")} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className={cn("text-base font-black tracking-tighter uppercase italic transition-colors", isLight ? "text-black group-hover:text-primary" : "text-white group-hover:text-primary")}>{contract.title}</h4>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                              contract.status === 'signed' ? "bg-primary/10 border-primary/20 text-primary" :
                              contract.status === 'sent' ? "bg-violet-500/10 border-violet-500/20 text-violet-500" :
                              isLight ? "bg-black/5 border-black/10 text-black/70" : "bg-white/5 border-white/10 text-white/70"
                            )}>
                              {contract.status}
                            </span>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-20", isLight ? "text-black" : "text-white")}>{new Date(contract.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadContractPDF(contract)}
                          title="Download PDF"
                          className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors active:scale-95", isLight ? "bg-slate-50 border-slate-200 text-black/50 hover:text-primary hover:border-primary/30" : "bg-white/5 border-white/10 text-white/50 hover:text-primary hover:border-primary/30")}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadContractWord(contract)}
                          title="Download Word"
                          className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors active:scale-95", isLight ? "bg-slate-50 border-slate-200 text-black/50 hover:text-primary hover:border-primary/30" : "bg-white/5 border-white/10 text-white/50 hover:text-primary hover:border-primary/30")}
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenContract(contract)}
                          className={cn("h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic", isLight ? "bg-black text-white hover:bg-black/80" : "bg-white text-black hover:bg-white/80")}
                        >
                          {contract.status === 'signed' ? 'View' : contract.status === 'draft' ? 'Edit' : 'Sign'}
                          <ChevronRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'browse' && (
            <motion.div 
              key="browse"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className={cn("text-xl font-black uppercase tracking-tighter italic", isLight ? "text-black" : "text-white")}>Document Templates</h3>
                <Badge variant="primary">{LEASE_TEMPLATES.length} Lease Templates</Badge>
              </div>

              <p className={cn("text-[11px] font-bold italic opacity-60 px-2", isLight ? "text-black" : "text-white")}>
                Word-style editor — change fonts &amp; sizes, fill every section, sign with your finger, export PDF or Word.
              </p>

              <div className="space-y-3 px-2">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.35em] opacity-50 italic", isLight ? "text-black" : "text-white")}>Lease agreements</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {LEASE_TEMPLATES.map((template, i) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "group relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden active:scale-[0.98]",
                      isLight ? "bg-primary/[0.04] border-primary/20 hover:border-primary/50" : "bg-primary/[0.08] border-primary/25 hover:border-primary/50",
                    )}
                  >
                    <div className="relative flex items-center gap-6">
                      <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform", isLight ? "bg-primary/10 border-primary/20" : "bg-primary/15 border-primary/30")}>
                        <FileText className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className={cn("text-base font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>{template.name}</h4>
                        <p className={cn("text-[11px] font-bold italic opacity-70 leading-relaxed", isLight ? "text-black" : "text-white")}>{template.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {otherTemplates.length > 0 && (
                <>
                  <div className="space-y-3 px-2 pt-4">
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.35em] opacity-50 italic", isLight ? "text-black" : "text-white")}>Other contracts</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {otherTemplates.map((template, i) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => handleSelectTemplate(template)}
                        className={cn(
                          "group relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden active:scale-[0.98]",
                          isLight ? "bg-slate-50 border-slate-200 hover:border-primary/40" : "bg-white/[0.03] border-white/5 hover:border-primary/40",
                        )}
                      >
                        <div className="relative flex items-center gap-6">
                          <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform", isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10")}>
                            <PenTool className={cn("w-7 h-7 group-hover:text-primary transition-colors", isLight ? "text-black/10" : "text-white/20")} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className={cn("text-base font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>{template.name}</h4>
                            <p className={cn("text-[11px] font-bold italic opacity-70 leading-relaxed", isLight ? "text-black" : "text-white")}>{template.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Document meta */}
              <div className={cn("p-8 rounded-[2.5rem] border space-y-8", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/5")}>
                <div className="flex items-center gap-3">
                  <PenLine className="w-5 h-5 text-primary" />
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic", isLight ? "text-black" : "text-white")}>Document Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 col-span-full">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Document Title</label>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className={cn("w-full h-14 rounded-2xl border px-6 text-sm outline-none transition-all font-black uppercase tracking-widest", isLight ? "bg-slate-50 border-slate-200 text-black focus:border-primary" : "bg-white/5 border-white/10 text-white focus:border-primary")}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Effective Date</label>
                    <input type="date" value={draftEffectiveDate} onChange={(e) => setDraftEffectiveDate(e.target.value)} className={cn("w-full h-14 rounded-2xl border px-6 text-sm outline-none", isLight ? "bg-slate-50 border-slate-200 text-black" : "bg-white/5 border-white/10 text-white")} />
                  </div>

                  {selectedTemplate?.category === 'lease' && (
                    <div className="space-y-3">
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Monthly Value</label>
                      <input type="number" placeholder="$0.00" value={draftMonthlyValue} onChange={(e) => setDraftMonthlyValue(e.target.value)} className={cn("w-full h-14 rounded-2xl border px-6 text-sm outline-none", isLight ? "bg-slate-50 border-slate-200 text-black" : "bg-white/5 border-white/10 text-white")} />
                    </div>
                  )}

                  <div className="space-y-3 col-span-full">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Other Party — name or email <span className="opacity-50">(optional)</span></label>
                    <input type="text" placeholder="e.g. Jane Doe or jane@email.com" value={draftCounterparty} onChange={(e) => setDraftCounterparty(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} className={cn("w-full h-14 rounded-2xl border px-6 text-sm outline-none", isLight ? "bg-slate-50 border-slate-200 text-black focus:border-primary" : "bg-white/5 border-white/10 text-white focus:border-primary")} />
                  </div>
                </div>

                <div className={cn("p-6 rounded-2xl border flex items-start gap-4", isLight ? "bg-primary/5 border-primary/20" : "bg-primary/10 border-primary/20")}>
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className={cn("text-[11px] leading-relaxed font-black uppercase italic tracking-wider", isLight ? "text-primary/80" : "text-primary/90")}>
                    Swipess Legal Trust v2.0 — this document is securely recorded once signed with a digital timestamp.
                  </p>
                </div>
              </div>

              {/* Quick Fill — pre-populate document blanks */}
              <div className={cn("rounded-[2.5rem] border overflow-hidden", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/5")}>
                <button
                  type="button"
                  onClick={() => setQuickFillOpen(o => !o)}
                  className={cn("w-full flex items-center justify-between px-8 py-5 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]")}
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-primary" />
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black" : "text-white")}>Quick Fill — Pre-populate Blanks</span>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", isLight ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/10 border-primary/20 text-primary")}>Auto-fill</span>
                  </div>
                  {quickFillOpen
                    ? <ChevronUp className={cn("w-4 h-4 opacity-40", isLight ? "text-black" : "text-white")} />
                    : <ChevronDown className={cn("w-4 h-4 opacity-40", isLight ? "text-black" : "text-white")} />
                  }
                </button>

                <AnimatePresence>
                  {quickFillOpen && selectedTemplate && (
                    <motion.div
                      key="qf"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("px-8 pb-8 space-y-6 border-t", isLight ? "border-slate-200" : "border-white/5")}>
                        <p className={cn("text-[10px] font-bold italic opacity-50 pt-5", isLight ? "text-black" : "text-white")}>
                          Fill the fields below then tap "Apply to Document" — blanks in the template will be populated automatically. You can still edit freely afterward.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {getVariablesForTemplate(selectedTemplate.id).map((variable) => (
                            <div key={variable.key} className={cn("space-y-2", variable.key === 'property_address' && "col-span-full")}>
                              <label className={cn("text-[9px] font-black uppercase tracking-[0.2em] ml-1 opacity-60", isLight ? "text-black" : "text-white")}>{variable.label}</label>
                              <input
                                type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'text' : 'text'}
                                placeholder={variable.placeholder}
                                value={quickFillValues[variable.key] ?? ''}
                                onChange={(e) => setQuickFillValues(prev => ({ ...prev, [variable.key]: e.target.value }))}
                                className={cn("w-full h-12 rounded-xl border px-4 text-sm outline-none transition-all", isLight ? "bg-slate-50 border-slate-200 text-black placeholder:opacity-30 focus:border-primary" : "bg-white/5 border-white/10 text-white placeholder:opacity-30 focus:border-primary")}
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyQuickFill}
                          className="w-full h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                          <Download className="w-4 h-4" />
                          Apply to Document
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Editable document */}
              <div className={cn("rounded-[2.5rem] border overflow-hidden", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/5")}>
                {/* Toolbar row 1: formatting */}
                <div className={cn("px-5 py-3.5 border-b space-y-3", isLight ? "border-slate-200" : "border-white/5")}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.25em] opacity-70", isLight ? "text-black" : "text-white")}>Document editor — tap anywhere to edit</span>
                  </div>
                  <DocumentEditorToolbar
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    onFontSizeChange={setFontSize}
                    onFontFamilyChange={setFontFamily}
                    onFormat={applyFormat}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadWord={handleDownloadWord}
                    onImproveAI={handleImproveWithAI}
                    isEnhancing={isEnhancing}
                  />
                </div>

                <div
                  ref={docRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Document editor"
                  spellCheck
                  className={cn(
                    "prose max-w-none px-7 py-6 min-h-[480px] max-h-[65vh] overflow-y-auto outline-none leading-relaxed focus:ring-0",
                    "[&_h1]:text-lg [&_h2]:text-base [&_u]:underline",
                    isLight ? "prose-slate text-black/90 bg-white/40" : "prose-invert text-white/90 bg-black/20",
                  )}
                  style={{
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                    touchAction: 'auto',
                    fontFamily: getFontCss(fontFamily),
                    fontSize: `${fontSize}px`,
                  }}
                />
              </div>

              {/* Save / Send / Sign actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleSaveDraft(false)}
                  disabled={isSavingDraft || isSending}
                  variant="ghost"
                  className={cn("h-14 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] italic border transition-all disabled:opacity-60", isLight ? "bg-slate-50 border-slate-200 text-black hover:bg-slate-100" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                >
                  <Save className="w-4 h-4 mr-3" />
                  {isSavingDraft ? 'Saving…' : activeContract?.id ? 'Update Vault' : 'Save to Vault'}
                </Button>
                <Button
                  onClick={handleSendForSignature}
                  disabled={isSavingDraft || isSending}
                  variant="ghost"
                  className={cn("h-14 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] italic border transition-all disabled:opacity-60", isLight ? "bg-violet-500/10 border-violet-500/25 text-violet-700 hover:bg-violet-500/15" : "bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/20")}
                >
                  <Send className="w-4 h-4 mr-3" />
                  {isSending ? 'Sending…' : 'Send to Tenant'}
                </Button>
                <Button
                  onClick={() => handleSaveDraft(true)}
                  disabled={isSavingDraft || isSending}
                  className="h-14 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[11px] italic shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] disabled:opacity-60"
                >
                  {isSavingDraft ? 'Saving…' : 'Sign Now'}
                  <PenTool className="w-4 h-4 ml-3" />
                </Button>
              </div>

              {/* Download row */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className={cn("h-12 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic transition-all active:scale-[0.98]", isLight ? "bg-slate-50 border-slate-200 text-black/60 hover:border-primary/30 hover:text-primary" : "bg-white/[0.03] border-white/5 text-white/60 hover:border-primary/30 hover:text-primary")}
                >
                  <Printer className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className={cn("h-12 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic transition-all active:scale-[0.98]", isLight ? "bg-slate-50 border-slate-200 text-black/60 hover:border-primary/30 hover:text-primary" : "bg-white/[0.03] border-white/5 text-white/60 hover:border-primary/30 hover:text-primary")}
                >
                  <FileDown className="w-4 h-4" />
                  Download Word
                </button>
              </div>
            </motion.div>
          )}

          {view === 'signing' && (
            <motion.div
              key="signing"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              {/* Document preview */}
              <div className={cn("relative p-10 rounded-[3rem] border shadow-inner h-[360px] overflow-y-auto no-scrollbar pointer-events-none opacity-80 blur-[0.5px] grayscale", isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10")}>
                <div className={cn("prose max-w-none font-medium italic text-[13px] leading-relaxed", isLight ? "prose-slate" : "prose-invert")}>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(activeContract?.content || selectedTemplate?.content || '') }} />
                </div>
                <div className={cn("absolute inset-0 pointer-events-none bg-gradient-to-t via-transparent to-transparent", isLight ? "from-white" : "from-black")} />
              </div>

              {/* Download before signing */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const content = activeContract?.content || selectedTemplate?.content || '';
                    const title = activeContract?.title || draftTitle || 'Contract';
                    downloadAsPDF(sanitizeHTML(content), title);
                    triggerHaptic('light');
                  }}
                  className={cn("h-11 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-[0.97]", isLight ? "bg-slate-50 border-slate-200 text-black/50 hover:text-primary hover:border-primary/30" : "bg-white/[0.03] border-white/5 text-white/50 hover:text-primary hover:border-primary/30")}
                >
                  <Printer className="w-3.5 h-3.5" />Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const content = activeContract?.content || selectedTemplate?.content || '';
                    const title = activeContract?.title || draftTitle || 'Contract';
                    downloadAsWord(sanitizeHTML(content), title);
                    triggerHaptic('light');
                  }}
                  className={cn("h-11 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-[0.97]", isLight ? "bg-slate-50 border-slate-200 text-black/50 hover:text-primary hover:border-primary/30" : "bg-white/[0.03] border-white/5 text-white/50 hover:text-primary hover:border-primary/30")}
                >
                  <FileDown className="w-3.5 h-3.5" />Download Word
                </button>
              </div>

              <div className="text-center space-y-3 px-6">
                <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>Signature Protocol</h3>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] opacity-70 italic", isLight ? "text-black" : "text-white")}>
                  {activeContract?.status === 'signed' ? 'Fully executed' : 'Secure digital signature'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 px-2">
                <div className={cn("p-4 rounded-2xl border text-center", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/5")}>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-50 mb-1", isLight ? "text-black" : "text-white")}>Landlord</p>
                  <p className={cn("text-xs font-bold", activeContract?.owner_signature ? "text-primary" : "opacity-40", isLight ? "text-black" : "text-white")}>
                    {activeContract?.owner_signature ? 'Signed ✓' : 'Pending'}
                  </p>
                </div>
                <div className={cn("p-4 rounded-2xl border text-center", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/5")}>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-50 mb-1", isLight ? "text-black" : "text-white")}>Tenant</p>
                  <p className={cn("text-xs font-bold", activeContract?.client_signature ? "text-primary" : "opacity-40", isLight ? "text-black" : "text-white")}>
                    {activeContract?.client_signature ? 'Signed ✓' : 'Pending'}
                  </p>
                </div>
              </div>

              {user && activeContract && userNeedsSignature(activeContract, user.id) ? (
                <DigitalSignaturePad onSignatureCapture={handleSignatureCapture} />
              ) : (
                <div className={cn("p-8 rounded-[2rem] border text-center", isLight ? "bg-primary/5 border-primary/20" : "bg-primary/10 border-primary/25")}>
                  <p className={cn("text-sm font-bold", isLight ? "text-black/70" : "text-white/80")}>
                    {activeContract?.status === 'signed'
                      ? 'This lease is fully signed by both parties.'
                      : 'You\'ve already signed — waiting for the other party.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛸 FOOTER BRANDING */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
        <span className={cn("text-[9px] font-black uppercase tracking-[0.5em] italic", isLight ? "text-black" : "text-white")}>Swipess Legal Trust Foundation</span>
      </div>
    </div>
  );
}
