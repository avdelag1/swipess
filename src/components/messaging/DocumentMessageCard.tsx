import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PenLine, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import {
  type DocumentAttachment,
  contractStatusLabel,
  contractStatusTone,
} from '@/utils/messageDocuments';
import { supabase } from '@/integrations/supabase/client';
import { downloadAsPDF } from '@/utils/documentExport';
import { sanitizeHTML } from '@/utils/sanitizeHTML';
import { appToast } from '@/utils/appNotification';

interface DocumentMessageCardProps {
  attachment: DocumentAttachment;
  isMyMessage: boolean;
  isThemeLight: boolean;
  currentUserRole?: 'client' | 'owner';
}

export const DocumentMessageCard = memo(({
  attachment,
  isMyMessage,
  isThemeLight,
  currentUserRole = 'client',
}: DocumentMessageCardProps) => {
  const navigate = useNavigate();
  const contractsPath = currentUserRole === 'owner' ? '/owner/contracts' : '/client/contracts';

  const handleOpen = () => {
    triggerHaptic('medium');
    navigate(`${contractsPath}?doc=${attachment.id}`);
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (attachment.type !== 'digital_contract') return;
    triggerHaptic('light');
    const { data } = await supabase
      .from('digital_contracts')
      .select('content, title')
      .eq('id', attachment.id)
      .maybeSingle();
    if (!data?.content) {
      appToast.error('Could not load document');
      return;
    }
    downloadAsPDF(sanitizeHTML(data.content), data.title || attachment.title);
    appToast.success('Downloaded — use outside the app anytime');
  };

  return (
    <motion.button
      type="button"
      onClick={handleOpen}
      className={cn(
        'w-full max-w-[260px] text-left rounded-2xl border p-4 transition-all active:scale-[0.98]',
        isMyMessage
          ? 'bg-white/10 border-white/20 text-white'
          : isThemeLight
            ? 'bg-white border-black/10 text-black shadow-sm'
            : 'bg-[#141418] border-white/12 text-white',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          attachment.status === 'signed'
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-rose-500/15 text-rose-400',
        )}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black uppercase tracking-tight truncate leading-tight">
            {attachment.title}
          </p>
          <span className={cn(
            'inline-block mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border',
            contractStatusTone(attachment.status),
          )}>
            {contractStatusLabel(attachment.status)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {attachment.type === 'digital_contract' && attachment.status === 'sent' && (
          <span className={cn(
            'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest',
            isMyMessage ? 'text-white/70' : (isThemeLight ? 'text-rose-500' : 'text-rose-400'),
          )}>
            <PenLine className="w-3 h-3" />
            {isMyMessage ? 'Awaiting signature' : 'Tap to sign'}
          </span>
        )}
        {attachment.type === 'digital_contract' && attachment.status === 'draft' && (
          <span className={cn(
            'text-[9px] font-black uppercase tracking-widest',
            isMyMessage ? 'text-white/70' : (isThemeLight ? 'text-black/40' : 'text-white/40'),
          )}>
            View document
          </span>
        )}
        {attachment.status === 'signed' && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleExport}
            onKeyDown={(e) => e.key === 'Enter' && handleExport(e as unknown as React.MouseEvent)}
            className={cn(
              'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ml-auto',
              isMyMessage ? 'text-white/70 hover:text-white' : (isThemeLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'),
            )}
          >
            <Download className="w-3 h-3" />
            Export PDF
          </span>
        )}
      </div>
    </motion.button>
  );
});

DocumentMessageCard.displayName = 'DocumentMessageCard';