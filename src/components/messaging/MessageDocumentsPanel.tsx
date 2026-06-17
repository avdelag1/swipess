import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText, FolderOpen, PenLine, ScrollText, Send, X, Download, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import {
  useConversationVaultDocuments,
  useSendDocumentMessage,
  useShareVaultFileMessage,
  extractThreadDocuments,
} from '@/hooks/useMessageDocuments';
import { useConversationMessages } from '@/hooks/useConversations';
import {
  contractDisplayStatus,
  contractStatusLabel,
  contractStatusTone,
  isVaultDraft,
  type VaultContractRow,
} from '@/utils/messageDocuments';
import { downloadAsPDF } from '@/utils/documentExport';
import { sanitizeHTML } from '@/utils/sanitizeHTML';
import { appToast } from '@/utils/appNotification';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';

type PanelTab = 'vault' | 'thread' | 'completed';

interface MessageDocumentsPanelProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  otherUser: { id: string; full_name: string; role: 'client' | 'owner' };
  currentUserRole: 'client' | 'owner';
}

export const MessageDocumentsPanel = memo(({
  open,
  onClose,
  conversationId,
  otherUser,
  currentUserRole,
}: MessageDocumentsPanelProps) => {
  const { isLight } = useAppTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<PanelTab>('vault');

  const { data: messages = [] } = useConversationMessages(conversationId);
  const {
    sendable,
    withParty,
    signed,
    files,
    isLoading,
  } = useConversationVaultDocuments(otherUser.id);

  const sendDocument = useSendDocumentMessage();
  const shareFile = useShareVaultFileMessage();

  const threadDocs = useMemo(() => extractThreadDocuments(messages), [messages]);

  const contractsPath = currentUserRole === 'owner' ? '/owner/contracts' : '/client/contracts';

  const handleSendContract = async (contract: VaultContractRow) => {
    triggerHaptic('medium');
    await sendDocument.mutateAsync({
      conversationId,
      recipientId: otherUser.id,
      recipientRole: otherUser.role,
      contract,
    });
    onClose();
  };

  const handleSendFile = async (file: typeof files[number]) => {
    triggerHaptic('medium');
    await shareFile.mutateAsync({ conversationId, file });
    onClose();
  };

  const handleExport = (contract: VaultContractRow) => {
    triggerHaptic('light');
    if (!contract.content) {
      appToast.error('No content to export');
      return;
    }
    downloadAsPDF(sanitizeHTML(contract.content), contract.title || 'Lease');
    appToast.success('Saved to your device — use for any business');
  };

  const tabs: { id: PanelTab; label: string; icon: typeof FolderOpen }[] = [
    { id: 'vault', label: 'My vault', icon: FolderOpen },
    { id: 'thread', label: 'This chat', icon: ScrollText },
    { id: 'completed', label: 'Signed', icon: PenLine },
  ];

  const listForTab = () => {
    if (tab === 'vault') return sendable;
    if (tab === 'thread') {
      const ids = new Set(threadDocs.filter((d) => d.type === 'digital_contract').map((d) => d.id));
      return withParty.filter((c) => ids.has(c.id));
    }
    return signed;
  };

  const panelBg = isLight ? 'surface-5 border-border' : 'surface-5 border-white/12';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[10002] rounded-t-[2rem] border-t max-h-[82dvh] flex flex-col pb-safe',
              panelBg,
            )}
          >
            <div className="shrink-0 px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-rose-400">Documents</p>
                <h3 className={cn('text-lg font-black uppercase italic tracking-tight', isLight ? 'text-black' : 'text-white')}>
                  Send to {otherUser.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border',
                  isLight ? 'surface-3' : 'bg-[#1c1c22] border-white/12 text-white',
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTab(t.id); triggerHaptic('light'); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 border transition-all',
                    tab === t.id
                      ? 'bg-gradient-to-r from-[#FF4D00] to-[#EB4898] text-white border-transparent'
                      : isLight
                        ? 'surface-2 text-black/50'
                        : 'bg-[#141418] border-white/10 text-white/50',
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
              {tab === 'vault' && (
                <p className={cn('text-[11px] font-medium px-1 pb-1', isLight ? 'text-black/50' : 'text-white/45')}>
                  Pick a lease or template from your vault — drafts, pre-filled leases, or ones already with {otherUser.full_name}.
                </p>
              )}

              {isLoading ? (
                <div className="py-16 flex justify-center">
                  <PremiumSpinner className="w-8 h-8" />
                </div>
              ) : listForTab().length === 0 && tab !== 'vault' ? (
                <div className="py-16 text-center">
                  <FileText className={cn('w-10 h-10 mx-auto mb-3 opacity-20', isLight ? 'text-black' : 'text-white')} />
                  <p className={cn('text-[11px] font-bold uppercase tracking-widest opacity-40', isLight ? 'text-black' : 'text-white')}>
                    {tab === 'completed' ? 'No signed leases yet' : 'Nothing shared in this chat yet'}
                  </p>
                </div>
              ) : (
                listForTab().map((contract) => {
                  const status = contractDisplayStatus(contract);
                  const isDraft = isVaultDraft(contract);
                  return (
                    <div
                      key={contract.id}
                      className={cn(
                        'rounded-2xl border p-4 flex items-center gap-3',
                        isLight ? 'surface-2' : 'bg-[#141418] border-white/10',
                      )}
                    >
                      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                        <ScrollText className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-[13px] font-black truncate', isLight ? 'text-black' : 'text-white')}>
                          {contract.title}
                        </p>
                        <span className={cn(
                          'inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border',
                          contractStatusTone(status),
                        )}>
                          {isDraft ? 'Ready to send' : contractStatusLabel(status)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {tab === 'vault' && (
                          <button
                            type="button"
                            disabled={sendDocument.isPending}
                            onClick={() => handleSendContract(contract)}
                            className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#EB4898] text-white flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send
                          </button>
                        )}
                        {status === 'signed' && (
                          <button
                            type="button"
                            onClick={() => handleExport(contract)}
                            className={cn(
                              'h-8 px-3 rounded-xl border flex items-center gap-1 text-[8px] font-black uppercase tracking-widest',
                              isLight ? 'border-slate-200 text-black/60' : 'border-white/10 text-white/60',
                            )}
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {tab === 'vault' && files.length > 0 && (
                <>
                  <p className={cn('text-[9px] font-black uppercase tracking-widest px-1 pt-2 opacity-40', isLight ? 'text-black' : 'text-white')}>
                    Uploaded files
                  </p>
                  {files.slice(0, 8).map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        'rounded-2xl border p-4 flex items-center gap-3',
                        isLight ? 'surface-2' : 'bg-[#141418] border-white/10',
                      )}
                    >
                      <FileText className="w-5 h-5 text-sky-400 shrink-0" />
                      <p className={cn('text-[12px] font-bold truncate flex-1', isLight ? 'text-black' : 'text-white')}>
                        {file.file_name}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSendFile(file)}
                        className="h-8 px-3 rounded-xl border border-white/10 text-[8px] font-black uppercase text-white/70"
                      >
                        Share
                      </button>
                    </div>
                  ))}
                </>
              )}

              {tab === 'vault' && listForTab().length === 0 && !isLoading && (
                <div className="py-12 text-center space-y-4">
                  <p className={cn('text-[11px] font-bold opacity-40 uppercase tracking-widest', isLight ? 'text-black' : 'text-white')}>
                    No leases in your vault yet
                  </p>
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(contractsPath); }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus className="w-4 h-4" />
                    Build a lease
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

MessageDocumentsPanel.displayName = 'MessageDocumentsPanel';