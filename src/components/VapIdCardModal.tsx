import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, ScanLine, Upload, FileText, CheckCircle2, Loader2, Pencil, Briefcase } from 'lucide-react';
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
                "relative w-full max-w-[420px] rounded-[28px] pointer-events-auto shadow-2xl overflow-hidden",
                isLight ? "bg-white border border-black/5" : "bg-zinc-900 border border-white/10"
              )}
            >
              {/* ── Header ── */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3",
                isLight ? "border-b border-black/5" : "border-b border-white/5"
              )}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">
                    Resident Card
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
                >
                  <X className={cn("w-4 h-4", isLight ? "text-black/40" : "text-white/40")} />
                </button>
              </div>

              {/* ── Card Content — single-screen, no scroll ── */}
              <div className="p-5 space-y-4">

                {/* User row */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn(
                        "w-full h-full flex items-center justify-center text-base font-black",
                        isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                      )}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-foreground truncate">{name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {nationality && (
                        <span className="text-[11px] text-muted-foreground">{nationality}</span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                      )}>
                        <MapPin className="w-2.5 h-2.5" />
                        {city}
                      </span>
                    </div>
                  </div>

                  {/* QR — small, inline */}
                  <div className="shrink-0 p-1.5 bg-white rounded-xl shadow-sm border border-black/5 relative">
                    <QRCode value={validationUrl} size={56} level="H" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white p-0.5 rounded-full">
                        <ScanLine className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification bar */}
                <div className={cn("px-3 py-2 rounded-xl", isLight ? "bg-zinc-50" : "bg-white/5")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Verification
                    </span>
                    <span className={cn("text-[11px] font-black",
                      verificationScore >= 75 ? "text-emerald-500" : verificationScore >= 40 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {verificationScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500",
                        verificationScore >= 75 ? "bg-emerald-500" : verificationScore >= 40 ? "bg-amber-500" : "bg-muted-foreground"
                      )}
                      style={{ width: `${verificationScore}%` }}
                    />
                  </div>
                </div>

                {/* Info chips row */}
                <div className="flex gap-2">
                  {occupation && (
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-1 min-w-0", isLight ? "bg-zinc-50" : "bg-white/5")}>
                      <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground truncate">{occupation}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0", isLight ? "bg-zinc-50" : "bg-white/5")}>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] font-medium text-foreground">{memberSince}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className={cn("px-3 py-2 rounded-xl relative", isLight ? "bg-zinc-50" : "bg-white/5")}>
                  {editingBio ? (
                    <div className="space-y-1.5">
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
                        <button onClick={() => setEditingBio(false)} className="text-[10px] px-2 py-1 rounded-lg text-muted-foreground">Cancel</button>
                        <button onClick={handleSaveBio} className="text-[10px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-bold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[11px] leading-relaxed italic flex-1 truncate", isLight ? "text-zinc-600" : "text-zinc-300")}>
                        {bio ? `"${bio}"` : 'Tap to add bio...'}
                      </p>
                      <button
                        onClick={() => { setBioValue(bio); setEditingBio(true); }}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0 touch-manipulation"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Document uploads — compact row */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                    Documents
                  </span>
                  <div className="flex gap-2">
                    {DOC_TYPES.map(({ key, label }) => {
                      const status = getDocStatus(key);
                      return (
                        <button
                          key={key}
                          onClick={() => status === 'none' ? handleDocUpload(key) : undefined}
                          disabled={uploading === key || status === 'verified'}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all touch-manipulation",
                            status === 'none' && "active:scale-95",
                            isLight ? "bg-zinc-50 hover:bg-zinc-100" : "bg-white/5 hover:bg-white/[0.08]",
                            status === 'verified' && "opacity-80"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center",
                            status === 'verified' ? "bg-emerald-500/15 text-emerald-500"
                              : status === 'pending' ? "bg-amber-500/15 text-amber-500"
                              : isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                          )}>
                            {uploading === key ? <Loader2 className="w-4 h-4 animate-spin" />
                              : status === 'verified' ? <CheckCircle2 className="w-4 h-4" />
                              : status === 'pending' ? <FileText className="w-4 h-4" />
                              : <Upload className="w-4 h-4" />}
                          </div>
                          <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

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
