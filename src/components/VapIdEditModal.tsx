import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, CheckCircle2, Loader2, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_TYPES = [
  { key: 'passport', label: 'Passport' },
  { key: 'government_id', label: 'Gov. ID' },
  { key: 'drivers_license', label: 'License' },
] as const;

const csvToArray = (csv: string) =>
  csv.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

const arrayToCsv = (arr: unknown): string => {
  if (!Array.isArray(arr)) return '';
  return arr.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).join(', ');
};

export function VapIdEditModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [nationality, setNationality] = useState('');
  const [yearsInCity, setYearsInCity] = useState<string>('');
  const [languages, setLanguages] = useState('');
  const [interests, setInterests] = useState('');

  const { data: clientProfile, refetch } = useQuery({
    queryKey: ['vap-id-client-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('bio, occupation, city, nationality, years_in_city, languages, interests, personality_traits, preferred_activities')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!clientProfile) return;
    setBio(clientProfile.bio || '');
    setOccupation((clientProfile as any).occupation || '');
    setCity(clientProfile.city || '');
    setNationality(clientProfile.nationality || '');
    setYearsInCity(clientProfile.years_in_city != null ? String(clientProfile.years_in_city) : '');
    setLanguages(arrayToCsv(clientProfile.languages));
    setInterests(arrayToCsv(clientProfile.interests));
  }, [clientProfile]);

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

  const handleSave = useCallback(async () => {
    if (!user?.id) { toast.error('Not signed in'); return; }
    setSaving(true);
    try {
      const yearsNum = yearsInCity.trim() === '' ? null : Number(yearsInCity);
      const payload: Record<string, any> = {
        user_id: user.id,
        bio: bio.trim() || null,
        occupation: occupation.trim() || null,
        city: city.trim() || null,
        nationality: nationality.trim() || null,
        years_in_city: Number.isFinite(yearsNum as number) ? yearsNum : null,
        languages: csvToArray(languages),
        interests: csvToArray(interests),
      };

      const { data: existing, error: selectErr } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (selectErr) throw selectErr;

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from('client_profiles')
          .update(payload)
          .eq('user_id', user.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('client_profiles')
          .insert(payload as any);
        if (insertErr) throw insertErr;
      }

      await queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['vap-id-profile', user.id] });
      await refetch();
      toast.success('Card saved');
    } catch (err: any) {
      console.error('[VapIdEdit] save failed', err);
      toast.error(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [user?.id, bio, occupation, city, nationality, yearsInCity, languages, interests, queryClient, refetch]);

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

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-5 scroll-smooth">
            {/* About / Bio */}
            <section className="rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">About Me</p>
                <h3 className="mt-1 text-sm font-black text-foreground">Card description</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">A short bio shown on the front of your card.</p>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I work as... I own a business called... I love..."
                rows={3}
                maxLength={240}
                className="min-h-[90px] text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground text-right">{bio.length}/240</p>
            </section>

            {/* Details */}
            <section className="mt-5 rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Details</p>
                <h3 className="mt-1 text-sm font-black text-foreground">Personal info</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledField label="Occupation">
                  <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Barista, Landlord, Dev…" maxLength={60} />
                </LabeledField>
                <LabeledField label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tulum" maxLength={60} />
                </LabeledField>
                <LabeledField label="Nationality">
                  <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Mexican" maxLength={40} />
                </LabeledField>
                <LabeledField label="Years in city">
                  <Input value={yearsInCity} inputMode="numeric" pattern="[0-9]*" onChange={(e) => setYearsInCity(e.target.value.replace(/[^0-9]/g, ''))} placeholder="3" maxLength={2} />
                </LabeledField>
                <LabeledField label="Languages" hint="Comma separated" className="sm:col-span-2">
                  <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Spanish, French" />
                </LabeledField>
                <LabeledField label="Interests" hint="Comma separated" className="sm:col-span-2">
                  <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Surf, Yoga, Coffee" />
                </LabeledField>
              </div>
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

          {/* Sticky save bar */}
          <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_hsl(var(--foreground)/0.08)]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save card'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function LabeledField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
        {hint && <span className="text-[9px] font-medium text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

