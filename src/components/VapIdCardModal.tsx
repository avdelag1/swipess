import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Globe2, Briefcase, Phone, ScanLine } from 'lucide-react';
import QRCode from 'react-qr-code';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { user } = useAuth();

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
        .select('bio, nationality, city, occupation, years_in_city, interests, languages, personality_traits, preferred_activities')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Resident';
  const nationality = clientProfile?.nationality || profile?.nationality || '';
  const city = clientProfile?.city || profile?.city || '';
  const country = profile?.country || '';
  const bio = clientProfile?.bio || '';
  const occupation = (clientProfile as any)?.occupation || '';
  const avatarUrl = profile?.avatar_url || '';
  const phone = profile?.phone || '';
  const yearsInCity = clientProfile?.years_in_city;

  const spokenLanguages = useMemo(() => {
    // Try client_profiles languages first, then profiles
    const clientLangs = clientProfile?.languages;
    if (Array.isArray(clientLangs) && clientLangs.length > 0) {
      return clientLangs.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    }
    const raw = profile?.languages_spoken;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
    if (profile?.language) return [profile.language];
    return [];
  }, [clientProfile?.languages, profile?.languages_spoken, profile?.language]);

  const interests = useMemo(() => {
    const raw = clientProfile?.interests;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    return [];
  }, [clientProfile?.interests]);

  const personalityTraits = useMemo(() => {
    const raw = clientProfile?.personality_traits;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    return [];
  }, [clientProfile?.personality_traits]);

  const activities = useMemo(() => {
    const raw = clientProfile?.preferred_activities;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    return [];
  }, [clientProfile?.preferred_activities]);

  // Combine all tags
  const allTags = useMemo(() => {
    const tags: string[] = [];
    tags.push(...interests);
    tags.push(...personalityTraits);
    tags.push(...activities);
    return [...new Set(tags)].slice(0, 8); // max 8 tags
  }, [interests, personalityTraits, activities]);

  const validationUrl = `https://swipess.lovable.app/vap-validate/${user?.id || 'unknown'}`;
  const idNumber = `SW-${(user?.id || 'resident').slice(0, 8).toUpperCase()}`;
  const location = [city, country].filter(Boolean).join(', ');

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[340px] max-w-[92vw] mx-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white z-20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* === THE CARD === */}
            <div className="relative rounded-[24px] overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
              }}
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Top accent line */}
              <div className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #e94560, #f5a623, #e94560)' }}
              />

              <div className="relative z-10 p-5">
                {/* Header: Badge + ID */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
                      Local Resident
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-white/40">
                    {idNumber}
                  </span>
                </div>

                {/* Photo + Name + Occupation */}
                <div className="flex gap-4 items-start">
                  <div className="w-[82px] h-[102px] shrink-0 rounded-[16px] overflow-hidden shadow-xl ring-2 ring-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-cyan-400 bg-white/5">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-lg font-black text-white leading-tight tracking-tight">
                      {name}
                    </h3>
                    {occupation && (
                      <p className="text-[13px] font-semibold text-cyan-300/80 mt-0.5">
                        {occupation}
                      </p>
                    )}
                    {location && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-white/50">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    )}
                    {nationality && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-white/50">
                        <Globe2 className="h-3 w-3" />
                        <span>{nationality}</span>
                        {yearsInCity && <span className="text-white/30">· {yearsInCity}yr local</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {bio && (
                  <div className="mt-4 rounded-[12px] bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5">
                    <p className="text-[11px] leading-relaxed text-white/60 line-clamp-3">
                      {bio}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {allTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.08] border border-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Languages */}
                {spokenLanguages.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30">Speaks</span>
                    {spokenLanguages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full bg-cyan-500/10 border border-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300/70"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="my-4 h-px bg-white/[0.08]" />

                {/* Bottom: Phone + QR */}
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-1 space-y-2 min-w-0">
                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[11px] font-semibold text-white/70 transition-transform active:scale-95"
                      >
                        <Phone className="h-3 w-3 text-green-400/80" />
                        <span className="truncate">{phone}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-1.5">
                      <ScanLine className="h-3 w-3 text-white/30" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Scan to verify
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="rounded-[12px] bg-white p-1.5 shadow-lg">
                    <QRCode value={validationUrl} size={64} level="H" />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">
                    swipess.app
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
