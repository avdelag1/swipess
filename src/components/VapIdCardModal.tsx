import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, ScanLine, Globe, Calendar, Languages } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();

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

                {/* Bio */}
                {bio && (
                  <div className={cn("p-4 rounded-2xl mb-6", isLight ? "bg-zinc-50" : "bg-white/5")}>
                    <p className={cn("text-sm leading-relaxed italic", isLight ? "text-zinc-600" : "text-zinc-300")}>
                      "{bio}"
                    </p>
                  </div>
                )}

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
                <div className="space-y-3">
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
