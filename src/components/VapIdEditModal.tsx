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
import useAppTheme from '@/hooks/useAppTheme';

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
  const { isLight } = useAppTheme();
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
    setOccupation(clientProfile.occupation || '');
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
      const payload: any = {
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
          className={cn(
            "fixed inset-0 z-[10001] flex flex-col overflow-hidden",
            isLight ? "bg-white" : "bg-[#0a0a0b]"
          )}
        >
          <div className={cn(
            "flex items-center justify-between border-b px-5 py-4 shrink-0",
            isLight ? "border-black/10 bg-white" : "border-white/10 bg-[#0a0a0b]"
          )}>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF4D00]">Edit</p>
              <h2 className={cn("mt-0.5 text-base font-black tracking-tight", isLight ? "text-black" : "text-white")}>Resident Card Settings</h2>
            </div>
            <button onClick={onClose} className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border active:scale-95 transition",
              isLight ? "border-black/10 bg-gray-100 text-black" : "border-white/10 bg-white/5 text-white"
            )} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-36 pt-5 scroll-smooth">
            {/* About / Bio */}
            <section className={cn(
              "rounded-[24px] border p-4 shadow-lg",
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-white/[0.03]"
            )}>
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF4D00]">About Me</p>
                <h3 className={cn("mt-1 text-sm font-black", isLight ? "text-black" : "text-white")}>Card description</h3>
                <p className={cn("mt-1 text-[11px]", isLight ? "text-gray-500" : "text-white/50")}>A short bio shown on the front of your card.</p>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I work as... I own a business called... I love..."
                rows={3}
                maxLength={240}
                className="min-h-[90px] text-sm"
              />
              <p className={cn("mt-1 text-[10px] text-right", isLight ? "text-gray-400" : "text-white/30")}>{bio.length}/240</p>
            </section>

            {/* Details */}
            <section className={cn(
              "mt-5 rounded-[24px] border p-4 shadow-lg",
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-white/[0.03]"
            )}>
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF4D00]">Details</p>
                <h3 className={cn("mt-1 text-sm font-black", isLight ? "text-black" : "text-white")}>Personal info</h3>
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
            <section className={cn(
              "mt-5 rounded-[24px] border p-4 shadow-lg",
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-white/[0.03]"
            )}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF4D00]">Documents</p>
                  <h3 className={cn("mt-1 text-sm font-black", isLight ? "text-black" : "text-white")}>Verification files</h3>
                </div>
                <div className={cn(
                  "rounded-xl border px-3 py-1.5 text-right",
                  isLight ? "border-black/10 bg-gray-50" : "border-white/10 bg-white/[0.04]"
                )}>
                  <p className={cn("text-xs font-black", isLight ? "text-black" : "text-white")}>{documentSummary.verified}✓ · {documentSummary.pending} pending</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {DOC_TYPES.map(({ key, label }) => {
                  const status = getDocStatus(key);
                  const doc = getDocMeta(key);
                  return (
                    <div key={key} className={cn(
                      "flex items-center gap-3 rounded-[18px] border p-3",
                      isLight ? "border-black/10 bg-gray-50" : "border-white/10 bg-white/[0.04]"
                    )}>
                      <div className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                        status === 'verified' ? 'border-[#FF4D00]/20 bg-[#FF4D00]/10 text-[#FF4D00]'
                          : status === 'pending' ? (isLight ? 'border-black/10 bg-gray-100 text-black' : 'border-white/10 bg-white/10 text-white')
                          : (isLight ? 'border-black/10 bg-gray-100 text-gray-400' : 'border-white/10 bg-white/5 text-white/40')
                      )}>
                        {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" />
                          : status === 'verified' ? <CheckCircle2 className="h-4 w-4" />
                          : status === 'pending' ? <FileText className="h-4 w-4" />
                          : <Upload className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-black", isLight ? "text-black" : "text-white")}>{label}</p>
                        <p className={cn("mt-0.5 truncate text-xs", isLight ? "text-gray-500" : "text-white/50")}>{doc?.file_name || 'Not uploaded'}</p>
                      </div>
                      <button
                        onClick={() => status !== 'verified' && handleDocUpload(key)}
                        disabled={uploading === key || status === 'verified'}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-[11px] font-black active:scale-95',
                          status === 'verified' 
                            ? (isLight ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-white/5 text-white/30 cursor-default')
                            : 'bg-[#FF4D00] text-white'
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
          <div className={cn(
            "sticky bottom-0 border-t px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.25)]",
            isLight ? "border-black/10 bg-white" : "border-white/10 bg-[#0a0a0b]"
          )}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-white text-sm font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
              }}
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
        <label className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</label>
        {hint && <span className="text-[9px] font-medium text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}


