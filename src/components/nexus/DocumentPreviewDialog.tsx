import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, FileText, Lock, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/utils/haptics';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';

export type VapDocumentPreview = {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  file_path?: string | null;
  mime_type?: string | null;
  created_at?: string;
};

const DOC_LABELS: Record<string, string> = {
  passport: 'Passport',
  government_id: 'Government ID',
  drivers_license: "Driver's License",
  six_month_lease: '6-Month Lease',
  recommendation: 'Recommendation',
};

interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  document: VapDocumentPreview | null;
}

export const DocumentPreviewDialog = memo(({ open, onClose, document }: DocumentPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !document?.file_path) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.storage
          .from('legal-documents')
          .createSignedUrl(document.file_path!, 120);
        if (!cancelled && !error && data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        }
      } catch {
        if (!cancelled) setPreviewUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, document?.file_path]);

  const label = document ? (DOC_LABELS[document.document_type] || document.document_type) : '';
  const isImage = document?.mime_type?.startsWith('image/') ?? /\.(jpe?g|png|webp|gif)$/i.test(document?.file_name || '');
  const isVerified = document?.status === 'verified';
  const isPending = document?.status === 'pending';

  return createPortal(
    <AnimatePresence>
      {open && document && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}
          onClick={() => { triggerHaptic('light'); onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0c0c12]/95 shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
          >
            <div
              className="px-5 py-4 flex items-start justify-between gap-3 border-b border-white/[0.06]"
              style={{ background: NEXUS_GRADIENTS.cta }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-white/90 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                    Authorized Preview
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-white truncate">
                  {label}
                </h3>
                <p className="text-[11px] text-white/70 truncate mt-0.5">{document.file_name}</p>
              </div>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); onClose(); }}
                className="shrink-0 w-10 h-10 rounded-full bg-black/25 border border-white/20 flex items-center justify-center text-white active:scale-95"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className={cn(
                  'relative rounded-2xl overflow-hidden border border-white/10 bg-black/40',
                  isImage ? 'aspect-[4/3]' : 'py-12',
                )}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] animate-spin" />
                  </div>
                )}
                {!loading && isImage && previewUrl && (
                  <>
                    <img
                      src={previewUrl}
                      alt=""
                      className="w-full h-full object-cover scale-105 blur-md select-none pointer-events-none"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <Lock className="w-8 h-8 text-[#8B5CF6]" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                        Verification Preview
                      </p>
                      <p className="text-[10px] text-white/55 leading-relaxed max-w-[220px]">
                        Blurred for privacy. Full document is reviewed by Swipess verification only.
                      </p>
                    </div>
                  </>
                )}
                {!loading && (!isImage || !previewUrl) && (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/25 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-[#8B5CF6]" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                      Secure document on file
                    </p>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      PDF and sensitive files are never shown in full on the card. Tap is recorded for your vault.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isPending ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-white/40" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/80">
                    {isVerified ? 'Verified' : isPending ? 'Pending review' : document.status}
                  </span>
                </div>
                {document.created_at && (
                  <span className="text-[9px] font-bold text-white/35 uppercase tracking-widest">
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
});

DocumentPreviewDialog.displayName = 'DocumentPreviewDialog';