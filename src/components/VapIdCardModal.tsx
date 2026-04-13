import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, ScanLine, Globe, Calendar, Languages, Upload, FileText, CheckCircle2, Loader2, Pencil } from 'lucide-react';
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
  { key: 'government_id', label: 'Government ID' },
  { key: 'drivers_license', label: "Driver's License" },
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
        .select('bio, nationality, city')
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
  const avatarUrl = profile?.avatar_url || '';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const languages = Array.isArray(profile?.languages_spoken)
    ? (profile.languages_spoken as string[]).join(', ')
    : profile?.language || '';

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

        toast.success('Document uploaded for verification');
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className={cn(
              "relative w-full max-w-sm max-h-[85vh] rounded-[32px] overflow-y-auto overscroll-y-contain pointer-events-auto shadow-2xl",
              isLight ? "bg-white border border-black/5" : "bg-zinc-900 border border-white/10"
            )}>

              {/* Header */}
              <div className={cn(
                "w-full px-6 py-4 flex items-center justify-between sticky top-0 z-10",
                isLight ? "bg-white/90 backdrop-blur-lg border-b border-black/5" : "bg-zinc-900/90 backdrop-blur-lg border-b border-white/5"
              )}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("w-5 h-5", isLight ? "text-primary" : "text-white")} />
                  <span className={cn("text-xs font-bold tracking-widest uppercase", isLight ? "text-primary" : "text-white")}>
                    Virtual Resident
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className={cn("w-5 h-5", isLight ? "text-black/40" : "text-white/40")} />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* User Info */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
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
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl" />
                  </div>

                  <div className="flex-1 pt-1">
                    <h2 className={cn("text-xl font-bold tracking-tight mb-1", isLight ? "text-zinc-900" : "text-white")}>
                      {name}
                    </h2>
                    {nationality && (
                      <p className={cn("text-sm", isLight ? "text-zinc-500" : "text-zinc-400")}>
                        {nationality}
                      </p>
                    )}
                    <div className={cn(
                      "inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium",
                      isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                    )}>
                      <MapPin className="w-3.5 h-3.5" />
                      {city}
                    </div>
                  </div>
                </div>

                {/* Bio — editable */}
                <div className={cn("p-4 rounded-2xl mb-6 relative", isLight ? "bg-zinc-50" : "bg-white/5")}>
                  {editingBio ? (
                    <div className="space-y-2">
                      <textarea
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value)}
                        placeholder="Tell the community about yourself..."
                        className={cn(
                          "w-full resize-none rounded-xl p-3 text-sm bg-transparent border focus:outline-none focus:ring-1",
                          isLight ? "border-black/10 focus:ring-primary" : "border-white/10 focus:ring-white/30 text-white"
                        )}
                        rows={3}
                        maxLength={200}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingBio(false)} className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground">Cancel</button>
                        <button onClick={handleSaveBio} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className={cn("text-sm leading-relaxed italic flex-1", isLight ? "text-zinc-600" : "text-zinc-300")}>
                        {bio ? `"${bio}"` : 'Tap to add a bio...'}
                      </p>
                      <button
                        onClick={() => { setBioValue(bio); setEditingBio(true); }}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center pt-2 mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 ring-4 ring-black/5 dark:ring-white/5 relative">
                    <QRCode value={validationUrl} size={140} level="H" className="rounded-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm">
                      <ScanLine className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className={cn("text-sm font-semibold tracking-wide uppercase", isLight ? "text-zinc-800" : "text-white")}>
                      Verified Member
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className={cn("text-xs mt-1 text-center", isLight ? "text-zinc-400" : "text-zinc-500")}>
                    Scan to verify Local Resident benefits
                  </p>
                </div>

                {/* Additional Info */}
                <div className="space-y-3 mb-6">
                  {memberSince && (
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isLight ? "bg-zinc-50" : "bg-white/5")}>
                      <Calendar className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-zinc-400" : "text-zinc-500")} />
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Member since</p>
                        <p className="text-sm font-medium text-foreground">{memberSince}</p>
                      </div>
                    </div>
                  )}
                  {languages && (
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isLight ? "bg-zinc-50" : "bg-white/5")}>
                      <Languages className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-zinc-400" : "text-zinc-500")} />
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Languages</p>
                        <p className="text-sm font-medium text-foreground">{languages}</p>
                      </div>
                    </div>
                  )}
                  {nationality && (
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", isLight ? "bg-zinc-50" : "bg-white/5")}>
                      <Globe className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-zinc-400" : "text-zinc-500")} />
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Nationality</p>
                        <p className="text-sm font-medium text-foreground">{nationality}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Document Verification Section ── */}
                <div className="space-y-3">
                  <h3 className={cn("text-xs font-bold uppercase tracking-widest", isLight ? "text-zinc-500" : "text-zinc-400")}>
                    Identity Documents
                  </h3>
                  {DOC_TYPES.map(({ key, label }) => {
                    const status = getDocStatus(key);
                    return (
                      <button
                        key={key}
                        onClick={() => status === 'none' ? handleDocUpload(key) : undefined}
                        disabled={uploading === key || status === 'verified'}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          status === 'none' && "cursor-pointer active:scale-[0.98]",
                          isLight ? "bg-zinc-50 hover:bg-zinc-100" : "bg-white/5 hover:bg-white/[0.08]",
                          status === 'verified' && "opacity-80 cursor-default"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          status === 'verified'
                            ? "bg-emerald-500/15 text-emerald-500"
                            : status === 'pending'
                            ? "bg-amber-500/15 text-amber-500"
                            : isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                        )}>
                          {uploading === key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : status === 'verified' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : status === 'pending' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {status === 'verified' ? 'Verified ✓' : status === 'pending' ? 'Under review' : 'Tap to upload'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="h-6" />
              </div>

              {/* Decorative glow */}
              <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                style={{
                  background: isLight
                    ? 'radial-gradient(circle at 100% 0%, rgba(var(--primary), 0.4) 0%, transparent 40%)'
                    : 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 40%)'
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
