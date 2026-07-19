import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, FileText, FolderLock, Plus, ScrollText, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useUserVaultDocuments } from '@/hooks/useMessageDocuments';
import {
  contractDisplayStatus,
  contractStatusLabel,
  contractStatusTone,
  isVaultDraft,
} from '@/utils/messageDocuments';
import { downloadAsPDF, downloadAsWord } from '@/utils/documentExport';
import { sanitizeHTML } from '@/utils/sanitizeHTML';
import { appToast } from '@/utils/appNotification';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

type LibraryFilter = 'all' | 'signed' | 'drafts';

export const MessagesDocumentsLibrary = memo(() => {
  const { isLight } = useAppTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.id);
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const { data, isLoading } = useUserVaultDocuments();
  const contracts = useMemo(() => data?.contracts || [], [data?.contracts]);

  const contractsPath = role === 'owner' ? '/owner/contracts' : '/client/contracts';

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const status = contractDisplayStatus(c);
      if (filter === 'signed') return status === 'signed';
      if (filter === 'drafts') return isVaultDraft(c) || status === 'draft';
      return true;
    });
  }, [contracts, filter]);

  const signedCount = contracts.filter((c) => contractDisplayStatus(c) === 'signed').length;

  const handleExport = (content: string | null | undefined, title: string, format: 'pdf' | 'word') => {
    triggerHaptic('light');
    if (!content) {
      appToast.error('No content to export');
      return;
    }
    const html = sanitizeHTML(content);
    if (format === 'pdf') downloadAsPDF(html, title);
    else downloadAsWord(html, title);
    appToast.success('Saved — use outside Swipess for any business');
  };

  const filters: { id: LibraryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'signed', label: `Signed (${signedCount})` },
    { id: 'drafts', label: 'Templates' },
  ];

  return (
    <div className="space-y-5">
      <div className={cn(
        'rounded-[2rem] border p-6 relative overflow-hidden',
        isLight ? 'surface-3' : 'bg-[#141418] border-white/10',
      )}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0">
            <FolderLock className="w-7 h-7 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-rose-400 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Business vault
            </p>
            <h2 className={cn('text-xl font-black uppercase italic tracking-tight mt-1', isLight ? 'text-black' : 'text-white')}>
              Your leases & documents
            </h2>
            <p className={cn('text-[12px] font-medium mt-2 leading-relaxed', isLight ? 'text-black/55' : 'text-white/50')}>
              Completed leases, templates, and vault files. Export PDF or Word and use them outside the app — or send straight from any chat.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { triggerHaptic('medium'); navigate(contractsPath); }}
          className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#EB4898] text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <Plus className="w-4 h-4" />
          New lease from template
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setFilter(f.id); triggerHaptic('light'); }}
            className={cn(
              'px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 border transition-all',
              filter === f.id
                ? 'bg-gradient-to-r from-[#FF4D00] to-[#EB4898] text-white border-transparent'
                : 'surface-2 text-foreground/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <PremiumSpinner className="w-8 h-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <FileText className={cn('w-12 h-12 mx-auto mb-4 opacity-15', isLight ? 'text-black' : 'text-white')} />
          <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-35', isLight ? 'text-black' : 'text-white')}>
            {filter === 'signed' ? 'No signed leases yet' : 'No documents in vault'}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {filtered.map((contract) => {
            const status = contractDisplayStatus(contract);
            return (
              <motion.div
                key={contract.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-[1.8rem] border p-5 flex flex-col gap-4',
                  isLight ? 'surface-row' : 'bg-[#141418] border-white/10',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <ScrollText className="w-6 h-6 text-rose-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[15px] font-black uppercase italic truncate', isLight ? 'text-black' : 'text-white')}>
                      {contract.title}
                    </p>
                    <span className={cn(
                      'inline-block mt-2 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border',
                      contractStatusTone(status),
                    )}>
                      {isVaultDraft(contract) ? 'Template' : contractStatusLabel(status)}
                    </span>
                    {contract.metadata?.counterparty && (
                      <p className={cn('text-[10px] font-bold mt-2 opacity-40 uppercase tracking-widest', isLight ? 'text-black' : 'text-white')}>
                        With {String(contract.metadata.counterparty)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport(contract.content, contract.title, 'pdf')}
                    className={cn(
                      'flex-1 h-11 rounded-xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest',
                      isLight ? 'border-slate-200 text-black/70 hover:border-rose-500/30' : 'border-white/10 text-white/70 hover:border-rose-500/30',
                    )}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(contract.content, contract.title, 'word')}
                    className={cn(
                      'flex-1 h-11 rounded-xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest',
                      isLight ? 'border-slate-200 text-black/70 hover:border-rose-500/30' : 'border-white/10 text-white/70 hover:border-rose-500/30',
                    )}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Word
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`${contractsPath}?doc=${contract.id}`)}
                    className="flex-1 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center text-[9px] font-black uppercase tracking-widest"
                  >
                    Open
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
});

MessagesDocumentsLibrary.displayName = 'MessagesDocumentsLibrary';