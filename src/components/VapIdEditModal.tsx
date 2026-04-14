import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, CheckCircle2, Loader2, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_TYPES = [
  { key: 'passport', label: 'Passport' },
  { key: 'government_id', label: 'Gov. ID' },
  { key: 'drivers_license', label: 'License' },
] as const;

export function VapIdEditModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');

  const { data: clientProfile } = useQuery({
    queryKey: ['vap-id-client-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('bio, occupation')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['vap-documents', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('id, document_type, file_name, status, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const bio = clientProfile?.bio || '';

  const documentSummary = useMemo(() => {
    const verified = documents?.filter(d => d.status === 'verified').length || 0;
    const pending = documents?.filter(d => d.status === 'pending').length || 0;
    return { verified, pending };
  }, [documents]);

  const handleDocUpload = useCallback(async (docType: string) => {
    if (!user?.id) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
      setUploading(docType);
      try {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${docType}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('legal-documents').upload(path, file);
        if (uploadErr) throw uploadErr;
        const { error: insertErr } = await supabase.from('legal_documents').insert({
          user_id: user.id, document_type: docType, file_name: file.name,
          file_path: path, file_size: file.size, mime_type: file.type, status: 'pending',
        });
        if (insertErr) throw insertErr;
        toast.success('Document uploaded');
        queryClient.invalidateQueries({ queryKey: ['vap-documents', user.id] });
      } catch (err: any) { toast.error(err.message || 'Upload failed'); }
      finally { setUploading(null); }
    };
    input.click();
  }, [user?.id, queryClient]);

  const handleSaveBio = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('client_profiles')
      .upsert({ user_id: user.id, bio: bioValue }, { onConflict: 'user_id' });
    if (error) { toast.error('Failed to update bio'); }
    else {
      toast.success('Bio updated');
      queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user.id] });
      setEditingBio(false);
    }
  }, [user?.id, bioValue, queryClient]);

  const getDocStatus = (docType: string) => documents?.find(d => d.document_type === docType)?.status || 'none';
  const getDocMeta = (docType: string) => documents?.find(d => d.document_type === docType);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="fixed inset-0 z-[10001] flex flex-col bg-background overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Edit</p>
              <h2 className="mt-0.5 text-base font-black tracking-tight text-foreground">Resident Card Settings</h2>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-5 scroll-smooth">
            {/* Bio */}
            <section className="rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">About Me</p>
                  <h3 className="mt-1 text-sm font-black text-foreground">Card description</h3>
                </div>
                {!editingBio && (
                  <button onClick={() => { setBioValue(bio); setEditingBio(true); }} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {editingBio ? (
                <div className="space-y-3">
                  <Textarea value={bioValue} onChange={(e) => setBioValue(e.target.value)} placeholder="I work as... I own a business called..." rows={3} maxLength={180} className="min-h-[90px] text-sm" />
                  <p className="text-[10px] text-muted-foreground text-right">{bioValue.length}/180</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingBio(false)} className="rounded-2xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">Cancel</button>
                    <button onClick={handleSaveBio} className="rounded-2xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground active:scale-95">Save</button>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground leading-relaxed">
                  {bio || 'Tap edit to add a short description for your card.'}
                </p>
              )}
            </section>

            {/* Documents */}
            <section className="mt-5 rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Documents</p>
                  <h3 className="mt-1 text-sm font-black text-foreground">Verification files</h3>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-right">
                  <p className="text-xs font-black text-foreground">{documentSummary.verified}✓ · {documentSummary.pending} pending</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {DOC_TYPES.map(({ key, label }) => {
                  const status = getDocStatus(key);
                  const doc = getDocMeta(key);
                  return (
                    <div key={key} className="flex items-center gap-3 rounded-[18px] border border-border bg-muted/40 p-3">
                      <div className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                        status === 'verified' ? 'border-primary/20 bg-primary/10 text-primary'
                          : status === 'pending' ? 'border-border bg-secondary text-foreground'
                          : 'border-border bg-muted text-muted-foreground'
                      )}>
                        {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" />
                          : status === 'verified' ? <CheckCircle2 className="h-4 w-4" />
                          : status === 'pending' ? <FileText className="h-4 w-4" />
                          : <Upload className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-foreground">{label}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc?.file_name || 'Not uploaded'}</p>
                      </div>
                      <button
                        onClick={() => status !== 'verified' && handleDocUpload(key)}
                        disabled={uploading === key || status === 'verified'}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-[11px] font-black active:scale-95',
                          status === 'verified' ? 'bg-secondary text-muted-foreground cursor-default' : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {status === 'verified' ? 'Done' : status === 'pending' ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
