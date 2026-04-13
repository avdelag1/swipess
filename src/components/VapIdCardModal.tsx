import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  MapPin,
  ScanLine,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Pencil,
  Briefcase,
  Globe2,
  CalendarDays,
  Languages,
  BadgeCheck,
  IdCard,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_TYPES = [
  { key: 'passport', label: 'Passport' },
  { key: 'government_id', label: 'Gov. ID' },
  { key: 'drivers_license', label: 'License' },
] as const;

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['vap-id-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, nationality, city, country, language, languages_spoken, created_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['vap-id-client-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('bio, nationality, city, occupation, years_in_city')
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

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Resident';
  const nationality = clientProfile?.nationality || profile?.nationality || '';
  const city = clientProfile?.city || profile?.city || 'Tulum';
  const bio = clientProfile?.bio || '';
  const occupation = (clientProfile as any)?.occupation || '';
  const avatarUrl = profile?.avatar_url || '';
  const yearsInCity = clientProfile?.years_in_city;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const spokenLanguages = useMemo(() => {
    const raw = profile?.languages_spoken;
    if (Array.isArray(raw)) {
      return raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    }
    if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
    if (profile?.language) return [profile.language];
    return [];
  }, [profile?.languages_spoken, profile?.language]);

  const verificationScore = useMemo(() => {
    let filled = 0;
    const total = 6;
    if (profile?.full_name) filled++;
    if (nationality) filled++;
    if (bio) filled++;
    if (occupation) filled++;
    const verifiedDocs = documents?.filter(d => d.status === 'verified').length || 0;
    const pendingDocs = documents?.filter(d => d.status === 'pending').length || 0;
    if (verifiedDocs > 0) filled += 2;
    else if (pendingDocs > 0) filled += 1;
    return Math.min(100, Math.round((filled / total) * 100));
  }, [profile, nationality, bio, occupation, documents]);

  const documentSummary = useMemo(() => {
    const verified = documents?.filter((doc) => doc.status === 'verified').length || 0;
    const pending = documents?.filter((doc) => doc.status === 'pending').length || 0;
    return { verified, pending, total: documents?.length || 0 };
  }, [documents]);

  const validationUrl = `https://swipess.app/vap-validate/${user?.id || 'unknown'}`;
  const idNumber = `SW-${(user?.id || 'resident').slice(0, 8).toUpperCase()}`;

  const handleDocUpload = useCallback(async (docType: string) => {
    if (!user?.id) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large (max 10MB)');
        return;
      }
      setUploading(docType);
      try {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${docType}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('legal-documents')
          .upload(path, file);
        if (uploadErr) throw uploadErr;

        const { error: insertErr } = await supabase
          .from('legal_documents')
          .insert({
            user_id: user.id,
            document_type: docType,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending',
          });
        if (insertErr) throw insertErr;

        toast.success('Document uploaded');
        queryClient.invalidateQueries({ queryKey: ['vap-documents', user.id] });
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }, [user?.id, queryClient]);

  const handleSaveBio = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('client_profiles')
      .upsert({ user_id: user.id, bio: bioValue }, { onConflict: 'user_id' });
    if (error) {
      toast.error('Failed to update bio');
    } else {
      toast.success('Bio updated');
      queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user.id] });
      setEditingBio(false);
    }
  }, [user?.id, bioValue, queryClient]);

  const getDocStatus = (docType: string) => {
    const doc = documents?.find(d => d.document_type === docType);
    if (!doc) return 'none';
    return doc.status;
  };

  const getDocMeta = (docType: string) => documents?.find((doc) => doc.document_type === docType);

  const detailItems = [
    { label: 'Location', value: [city, country].filter(Boolean).join(', ') || 'Not set', icon: MapPin },
    { label: 'Nationality', value: nationality || 'Not set', icon: Globe2 },
    { label: 'Occupation', value: occupation || 'Not set', icon: Briefcase },
    { label: 'Member Since', value: memberSince || 'Just joined', icon: CalendarDays },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative pointer-events-auto w-full max-w-[440px] max-h-[86dvh] overflow-hidden rounded-[30px] border border-border bg-background shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/92 px-5 py-4 backdrop-blur-xl">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Virtual ID</p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">Resident Identity Card</h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Close resident ID"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(86dvh-74px)] overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
                <section
                  className="relative overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-2xl"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at top right, hsl(var(--primary) / 0.18), transparent 34%), linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted) / 0.88))',
                  }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Verified Resident</p>
                        <p className="text-xs font-medium text-muted-foreground">Primary identity surface</p>
                      </div>
                    </div>
                    <div className="rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
                      {idNumber}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-[118px] shrink-0">
                      <div className="h-[154px] overflow-hidden rounded-[24px] border border-border bg-muted shadow-xl">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 rounded-[20px] border border-border bg-background/70 px-3 py-2 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Trust Score</p>
                        <p className="mt-1 text-xl font-black text-foreground">{verificationScore}%</p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resident</p>
                        <h3 className="mt-1 text-[1.55rem] font-black leading-[1.05] tracking-tight text-foreground">
                          {name}
                        </h3>
                      </div>

                      <div className="grid gap-2 text-sm">
                        {detailItems.map(({ label, value, icon: Icon }) => (
                          <div key={label} className="flex items-start gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2.5">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                              <p className="mt-0.5 truncate font-semibold text-foreground">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-[24px] border border-border bg-background/75 p-3">
                    <div className="relative rounded-[20px] border border-border bg-white p-2 shadow-sm">
                      <QRCode value={validationUrl} size={72} level="H" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-white p-1 text-primary shadow">
                          <ScanLine className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        <p className="text-sm font-black text-foreground">Live validation enabled</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Scan this code to confirm this resident card, trust score, and uploaded identity documents.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-4 rounded-[28px] border border-border bg-card p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Profile Note</p>
                      <h3 className="mt-1 text-base font-black text-foreground">About this resident</h3>
                    </div>
                    {!editingBio && (
                      <button
                        onClick={() => {
                          setBioValue(bio);
                          setEditingBio(true);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Edit bio"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {editingBio ? (
                    <div className="space-y-3">
                      <Textarea
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value)}
                        placeholder="Add a short resident summary..."
                        rows={4}
                        maxLength={220}
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingBio(false)}
                          className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveBio}
                          className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground transition-transform active:scale-95"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-[22px] border border-border bg-background/70 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                      {bio || 'Add a short note so this virtual ID feels complete and trustworthy.'}
                    </p>
                  )}
                </section>

                <section className="mt-4 rounded-[28px] border border-border bg-card p-4 shadow-lg">
                  <div className="mb-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Deep Details</p>
                    <h3 className="mt-1 text-base font-black text-foreground">Identity breakdown</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <Languages className="h-4 w-4 text-primary" />
                        <p className="text-sm font-black">Languages</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {spokenLanguages.length > 0 ? spokenLanguages.join(', ') : 'No languages added yet'}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <IdCard className="h-4 w-4 text-primary" />
                        <p className="text-sm font-black">Residency Status</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {yearsInCity ? `${yearsInCity} year${yearsInCity === 1 ? '' : 's'} in ${city}.` : `City history not added yet.`}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-4 rounded-[28px] border border-border bg-card p-4 shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Documents</p>
                      <h3 className="mt-1 text-base font-black text-foreground">Verification files</h3>
                    </div>
                    <div className="rounded-[20px] border border-border bg-background/70 px-3 py-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {documentSummary.verified} verified · {documentSummary.pending} pending
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {DOC_TYPES.map(({ key, label }) => {
                      const status = getDocStatus(key);
                      const doc = getDocMeta(key);
                      return (
                        <div key={key} className="flex items-center gap-3 rounded-[22px] border border-border bg-background/70 p-3">
                          <div className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                            status === 'verified'
                              ? 'border-primary/20 bg-primary/10 text-primary'
                              : status === 'pending'
                                ? 'border-border bg-secondary text-foreground'
                                : 'border-border bg-muted text-muted-foreground'
                          )}>
                            {uploading === key ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : status === 'verified' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : status === 'pending' ? (
                              <FileText className="h-5 w-5" />
                            ) : (
                              <Upload className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-foreground">{label}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {doc?.file_name || 'No file uploaded yet'}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className={cn(
                              'rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
                              status === 'verified'
                                ? 'border-primary/20 bg-primary/10 text-primary'
                                : status === 'pending'
                                  ? 'border-border bg-secondary text-foreground'
                                  : 'border-border bg-muted text-muted-foreground'
                            )}>
                              {status === 'none' ? 'Missing' : status}
                            </span>

                            <button
                              onClick={() => status !== 'verified' && handleDocUpload(key)}
                              disabled={uploading === key || status === 'verified'}
                              className={cn(
                                'rounded-2xl px-3 py-2 text-xs font-black transition-transform active:scale-95',
                                status === 'verified'
                                  ? 'cursor-default bg-secondary text-muted-foreground'
                                  : 'bg-primary text-primary-foreground'
                              )}
                            >
                              {status === 'verified' ? 'Locked' : status === 'pending' ? 'Replace' : 'Upload'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at top right, hsl(var(--primary) / 0.22), transparent 30%), radial-gradient(circle at bottom left, hsl(var(--primary) / 0.12), transparent 24%)',
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
