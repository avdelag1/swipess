import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, ScanLine, Upload, FileText, CheckCircle2, Loader2, Pencil, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [showDocs, setShowDocs] = useState(false);

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
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

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

  const validationUrl = `https://swipess.app/vap-validate/${user?.id || 'unknown'}`;

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={cn(
                "relative w-full max-w-[380px] rounded-[24px] pointer-events-auto shadow-2xl overflow-hidden",
                isLight ? "bg-white border border-black/5" : "bg-zinc-900 border border-white/10"
              )}
            >
              {/* ── Close button ── */}
              <button
                onClick={onClose}
                className={cn(
                  "absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center",
                  "transition-colors touch-manipulation",
                  isLight ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/15"
                )}
              >
                <X className={cn("w-4 h-4", isLight ? "text-black/50" : "text-white/50")} />
              </button>

              {/* ══════ PAGE 1: ID CARD ══════ */}
              <div className="px-5 pt-5 pb-4">

                {/* Top band */}
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">
                    Resident Card
                  </span>
                </div>

                {/* ID layout: photo left, info right */}
                <div className="flex gap-4">
                  {/* Photo */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-20 h-24 rounded-xl overflow-hidden shadow-lg",
                      "border-2",
                      isLight ? "border-black/5" : "border-white/10"
                    )}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-2xl font-black",
                          isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                        )}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Score badge under photo */}
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      verificationScore >= 75 ? "bg-emerald-500/15 text-emerald-500"
                        : verificationScore >= 40 ? "bg-amber-500/15 text-amber-500"
                        : isLight ? "bg-zinc-100 text-muted-foreground" : "bg-white/5 text-muted-foreground"
                    )}>
                      {verificationScore}% verified
                    </div>
                  </div>

                  {/* Info fields */}
                  <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Full Name</span>
                      <h2 className="text-base font-bold text-foreground truncate leading-tight">{name}</h2>
                    </div>

                    {nationality && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Nationality</span>
                        <p className="text-sm font-medium text-foreground leading-tight">{nationality}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">City</span>
                        <p className="text-sm font-medium text-foreground leading-tight flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{city}</span>
                        </p>
                      </div>
                      {occupation && (
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Occupation</span>
                          <p className="text-sm font-medium text-foreground leading-tight flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{occupation}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {memberSince && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Member Since</span>
                        <p className="text-xs font-medium text-foreground leading-tight flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          {memberSince}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification bar */}
                <div className="mt-4">
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${verificationScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn("h-full rounded-full",
                        verificationScore >= 75 ? "bg-emerald-500" : verificationScore >= 40 ? "bg-amber-500" : "bg-muted-foreground"
                      )}
                    />
                  </div>
                </div>

                {/* Bio section */}
                <div className={cn("mt-3 px-3 py-2.5 rounded-xl relative", isLight ? "bg-zinc-50" : "bg-white/5")}>
                  {editingBio ? (
                    <div className="space-y-2">
                      <textarea
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value)}
                        placeholder="Tell the community about yourself..."
                        className={cn(
                          "w-full resize-none rounded-lg p-2 text-xs bg-transparent border focus:outline-none focus:ring-1",
                          isLight ? "border-black/10 focus:ring-primary" : "border-white/10 focus:ring-white/30 text-white"
                        )}
                        rows={2}
                        maxLength={150}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingBio(false)} className="text-[11px] px-3 py-1 rounded-lg text-muted-foreground touch-manipulation">Cancel</button>
                        <button onClick={handleSaveBio} className="text-[11px] px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold touch-manipulation">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={cn("text-xs leading-relaxed italic flex-1", isLight ? "text-zinc-600" : "text-zinc-300")}>
                        {bio ? `"${bio}"` : 'Tap to add bio...'}
                      </p>
                      <button
                        onClick={() => { setBioValue(bio); setEditingBio(true); }}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 touch-manipulation",
                          isLight ? "hover:bg-black/5" : "hover:bg-white/10"
                        )}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                {/* QR code row */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="p-1.5 bg-white rounded-xl shadow-sm border border-black/5 relative">
                    <QRCode value={validationUrl} size={52} level="H" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white p-0.5 rounded-full">
                        <ScanLine className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground max-w-[160px] text-right leading-tight">
                    Scan to validate this resident's identity
                  </span>
                </div>
              </div>

              {/* ── Expand to Documents ── */}
              <button
                onClick={() => setShowDocs(!showDocs)}
                className={cn(
                  "w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest touch-manipulation transition-colors",
                  isLight ? "bg-zinc-50 text-muted-foreground hover:bg-zinc-100 border-t border-black/5"
                    : "bg-white/5 text-muted-foreground hover:bg-white/[0.08] border-t border-white/5"
                )}
              >
                {showDocs ? 'Hide' : 'Documents & Verification'}
                {showDocs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* ══════ PAGE 2: DOCUMENTS ══════ */}
              <AnimatePresence>
                {showDocs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-3 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Upload Documents
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        {DOC_TYPES.map(({ key, label }) => {
                          const status = getDocStatus(key);
                          return (
                            <button
                              key={key}
                              onClick={() => status === 'none' ? handleDocUpload(key) : undefined}
                              disabled={uploading === key || status === 'verified'}
                              className={cn(
                                "flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-all touch-manipulation",
                                status === 'none' && "active:scale-95",
                                isLight ? "bg-zinc-50 hover:bg-zinc-100" : "bg-white/5 hover:bg-white/[0.08]",
                                status === 'verified' && "opacity-80"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                status === 'verified' ? "bg-emerald-500/15 text-emerald-500"
                                  : status === 'pending' ? "bg-amber-500/15 text-amber-500"
                                  : isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                              )}>
                                {uploading === key ? <Loader2 className="w-5 h-5 animate-spin" />
                                  : status === 'verified' ? <CheckCircle2 className="w-5 h-5" />
                                  : status === 'pending' ? <FileText className="w-5 h-5" />
                                  : <Upload className="w-5 h-5" />}
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                              {status !== 'none' && (
                                <span className={cn("text-[9px] font-bold uppercase",
                                  status === 'verified' ? "text-emerald-500" : "text-amber-500"
                                )}>
                                  {status}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Decorative glow */}
              <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
                style={{
                  background: isLight
                    ? 'radial-gradient(circle at 100% 0%, hsl(var(--primary) / 0.4) 0%, transparent 40%)'
                    : 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.3) 0%, transparent 40%)'
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
