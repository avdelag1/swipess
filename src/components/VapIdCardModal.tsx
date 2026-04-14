import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Phone,
  Palette,
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

type CardSkin = 'glassmorphic' | 'cheetah' | 'tuluminati' | 'tropical';

const CARD_SKINS: { id: CardSkin; label: string; emoji: string }[] = [
  { id: 'glassmorphic', label: 'Glass', emoji: '💎' },
  { id: 'cheetah', label: 'Cheetah', emoji: '🐆' },
  { id: 'tuluminati', label: 'Tuluminati', emoji: '👁️' },
  { id: 'tropical', label: 'Tropical', emoji: '🌴' },
];

function getCardSkinStyles(skin: CardSkin) {
  switch (skin) {
    case 'glassmorphic':
      return {
        bg: 'bg-white/10 dark:bg-white/5',
        border: 'border-white/30 dark:border-white/10',
        overlay: 'backdrop-blur-2xl',
        text: 'text-foreground',
        subtext: 'text-foreground/70',
        accent: 'text-primary',
        qrBg: 'bg-white',
        gradient: 'from-white/20 via-white/5 to-transparent dark:from-white/10 dark:via-white/3 dark:to-transparent',
        innerCard: 'bg-white/15 dark:bg-white/8 border-white/20 dark:border-white/10',
      };
    case 'cheetah':
      return {
        bg: 'bg-amber-950',
        border: 'border-amber-700/50',
        overlay: '',
        text: 'text-amber-50',
        subtext: 'text-amber-200/70',
        accent: 'text-amber-400',
        qrBg: 'bg-amber-50',
        gradient: 'from-amber-900/80 via-amber-950 to-black/60',
        innerCard: 'bg-amber-900/50 border-amber-700/30',
      };
    case 'tuluminati':
      return {
        bg: 'bg-slate-950',
        border: 'border-emerald-500/30',
        overlay: '',
        text: 'text-emerald-50',
        subtext: 'text-emerald-300/60',
        accent: 'text-emerald-400',
        qrBg: 'bg-emerald-50',
        gradient: 'from-emerald-900/40 via-slate-950 to-purple-950/40',
        innerCard: 'bg-emerald-950/50 border-emerald-500/20',
      };
    case 'tropical':
      return {
        bg: 'bg-sky-950',
        border: 'border-cyan-400/30',
        overlay: '',
        text: 'text-cyan-50',
        subtext: 'text-cyan-200/60',
        accent: 'text-cyan-300',
        qrBg: 'bg-white',
        gradient: 'from-cyan-600/30 via-sky-900/60 to-emerald-900/40',
        innerCard: 'bg-sky-900/40 border-cyan-400/20',
      };
  }
}

function CheetahPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (i * 47) % 380 + 10;
        const y = (i * 31) % 230 + 10;
        const rx = 6 + (i % 4) * 3;
        const ry = 4 + (i % 3) * 2;
        const rot = (i * 23) % 180;
        return <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#000" transform={`rotate(${rot} ${x} ${y})`} />;
      })}
    </svg>
  );
}

function TuluminatiPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.08]">
      {/* Sacred geometry - all-seeing eye triangle */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]" viewBox="0 0 200 200">
        <polygon points="100,10 190,180 10,180" fill="none" stroke="#10b981" strokeWidth="0.8" />
        <polygon points="100,40 170,165 30,165" fill="none" stroke="#10b981" strokeWidth="0.5" />
        <circle cx="100" cy="110" r="25" fill="none" stroke="#10b981" strokeWidth="0.6" />
        <circle cx="100" cy="110" r="12" fill="none" stroke="#10b981" strokeWidth="0.4" />
        <circle cx="100" cy="110" r="5" fill="#10b981" opacity="0.3" />
        {/* Rays */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 30;
          const y1 = 110 + Math.sin(angle) * 30;
          const x2 = 100 + Math.cos(angle) * 90;
          const y2 = 110 + Math.sin(angle) * 90;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="0.3" />;
        })}
      </svg>
    </div>
  );
}

function TropicalPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.1]">
      <svg className="absolute -right-8 -top-8 w-[200px] h-[200px]" viewBox="0 0 100 100">
        {/* Palm leaf */}
        <path d="M50 90 Q30 60 10 30 Q35 45 50 50 Q65 45 90 30 Q70 60 50 90Z" fill="none" stroke="#06b6d4" strokeWidth="0.8" />
        <path d="M50 90 Q40 65 25 40 Q42 50 50 55 Q58 50 75 40 Q60 65 50 90Z" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
      </svg>
      <svg className="absolute -left-6 bottom-4 w-[160px] h-[160px] rotate-45" viewBox="0 0 100 100">
        <path d="M50 90 Q30 60 10 30 Q35 45 50 50 Q65 45 90 30 Q70 60 50 90Z" fill="none" stroke="#06b6d4" strokeWidth="0.8" />
      </svg>
      {/* Small wave lines */}
      <svg className="absolute bottom-0 left-0 w-full h-[40px]" viewBox="0 0 400 40" preserveAspectRatio="none">
        <path d="M0 20 Q50 5 100 20 Q150 35 200 20 Q250 5 300 20 Q350 35 400 20" fill="none" stroke="#06b6d4" strokeWidth="1" />
        <path d="M0 30 Q50 15 100 30 Q150 45 200 30 Q250 15 300 30 Q350 45 400 30" fill="none" stroke="#06b6d4" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [activeSkin, setActiveSkin] = useState<CardSkin>('glassmorphic');

  const { data: profile } = useQuery({
    queryKey: ['vap-id-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, nationality, city, country, language, languages_spoken, created_at, phone')
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
  const country = profile?.country || '';
  const bio = clientProfile?.bio || '';
  const occupation = (clientProfile as any)?.occupation || '';
  const avatarUrl = profile?.avatar_url || '';
  const yearsInCity = clientProfile?.years_in_city;
  const phone = profile?.phone || '';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const spokenLanguages = useMemo(() => {
    const raw = profile?.languages_spoken;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
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
    const verified = documents?.filter(d => d.status === 'verified').length || 0;
    const pending = documents?.filter(d => d.status === 'pending').length || 0;
    return { verified, pending, total: documents?.length || 0 };
  }, [documents]);

  const validationUrl = `https://swipess.lovable.app/vap-validate/${user?.id || 'unknown'}`;
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
  const getDocMeta = (docType: string) => documents?.find(d => d.document_type === docType);

  const skin = getCardSkinStyles(activeSkin);

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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Virtual ID</p>
              <h2 className="mt-0.5 text-base font-black tracking-tight text-foreground">Local Resident Card</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close resident ID"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-5 scroll-smooth">

            {/* ====== SKIN SELECTOR ====== */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
              {CARD_SKINS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSkin(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shrink-0',
                    activeSkin === s.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted/60 text-muted-foreground border border-border hover:bg-muted'
                  )}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* ====== THE ID CARD ====== */}
            <section className={cn(
              'relative rounded-[24px] border-2 p-5 shadow-2xl overflow-hidden transition-all duration-500',
              skin.bg, skin.border, skin.overlay
            )}>
              {/* Background gradient */}
              <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', skin.gradient)} />

              {/* Skin-specific patterns */}
              {activeSkin === 'cheetah' && <CheetahPattern />}
              {activeSkin === 'tuluminati' && <TuluminatiPattern />}
              {activeSkin === 'tropical' && <TropicalPattern />}

              {/* Card content */}
              <div className="relative z-10">
                {/* Top row: badge + ID number */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={cn('h-4 w-4', skin.accent)} />
                    <span className={cn('text-[10px] font-black uppercase tracking-[0.22em]', skin.accent)}>
                      Verified Local
                    </span>
                  </div>
                  <span className={cn('text-[10px] font-mono font-bold tracking-wider', skin.subtext)}>
                    {idNumber}
                  </span>
                </div>

                {/* Avatar + Name + Occupation */}
                <div className="flex gap-4 items-start">
                  <div className="w-[88px] h-[110px] shrink-0 rounded-[18px] overflow-hidden border-2 shadow-xl"
                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn('w-full h-full flex items-center justify-center text-3xl font-black', skin.accent)}
                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className={cn('text-xl font-black tracking-tight leading-tight', skin.text)}>
                      {name}
                    </h3>
                    {occupation && (
                      <p className={cn('text-sm font-semibold mt-1', skin.accent)}>
                        {occupation}
                      </p>
                    )}
                    <div className={cn('flex items-center gap-1.5 mt-2 text-xs', skin.subtext)}>
                      <MapPin className="h-3 w-3" />
                      <span>{[city, country].filter(Boolean).join(', ') || 'Location not set'}</span>
                    </div>
                    {nationality && (
                      <div className={cn('flex items-center gap-1.5 mt-1 text-xs', skin.subtext)}>
                        <Globe2 className="h-3 w-3" />
                        <span>{nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio / About line */}
                {bio && (
                  <div className={cn(
                    'mt-4 rounded-[14px] border px-3 py-2.5',
                    skin.innerCard
                  )}>
                    <p className={cn('text-xs leading-relaxed line-clamp-3', skin.subtext)}>
                      "{bio}"
                    </p>
                  </div>
                )}

                {/* Bottom row: WhatsApp + QR + Trust Score */}
                <div className="mt-4 flex items-end gap-3">
                  {/* WhatsApp */}
                  <div className="flex-1 space-y-2">
                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-2 rounded-[12px] border px-3 py-2 text-xs font-semibold transition-transform active:scale-95',
                          skin.innerCard, skin.text
                        )}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{phone}</span>
                      </a>
                    )}
                    <div className={cn(
                      'flex items-center gap-2 rounded-[12px] border px-3 py-2',
                      skin.innerCard
                    )}>
                      <span className={cn('text-[10px] font-black uppercase tracking-wider', skin.subtext)}>Trust</span>
                      <span className={cn('text-sm font-black', skin.text)}>{verificationScore}%</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className={cn('rounded-[14px] p-2 shadow-lg', skin.qrBg)}>
                    <QRCode value={validationUrl} size={68} level="H" />
                  </div>
                </div>

                {/* Scan label */}
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <ScanLine className={cn('h-3 w-3', skin.accent)} />
                  <span className={cn('text-[10px] font-bold uppercase tracking-[0.18em]', skin.subtext)}>
                    Scan to verify • swipess.app
                  </span>
                </div>
              </div>
            </section>

            {/* ====== BIO EDIT SECTION ====== */}
            <section className="mt-5 rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">About Me</p>
                  <h3 className="mt-1 text-sm font-black text-foreground">Card description</h3>
                </div>
                {!editingBio && (
                  <button
                    onClick={() => { setBioValue(bio); setEditingBio(true); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Edit bio"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {editingBio ? (
                <div className="space-y-3">
                  <Textarea value={bioValue} onChange={(e) => setBioValue(e.target.value)} placeholder="I work as... I own a business called... I'm passionate about..." rows={3} maxLength={180} className="min-h-[90px] text-sm" />
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

            {/* ====== LEGAL DOCUMENTS ====== */}
            <section className="mt-5 rounded-[24px] border border-border bg-card p-4 shadow-lg">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Documents</p>
                  <h3 className="mt-1 text-sm font-black text-foreground">Verification files</h3>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                  <p className="text-xs font-black text-foreground">
                    {documentSummary.verified}✓ · {documentSummary.pending} pending
                  </p>
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
                          'rounded-xl px-3 py-1.5 text-[11px] font-black transition-transform active:scale-95',
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
