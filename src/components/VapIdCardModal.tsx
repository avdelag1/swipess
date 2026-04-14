import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Globe2, Phone, ScanLine } from 'lucide-react';
import QRCode from 'react-qr-code';
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
    const clientLangs = clientProfile?.languages;
    if (Array.isArray(clientLangs) && clientLangs.length > 0)
      return clientLangs.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    const raw = profile?.languages_spoken;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
    if (profile?.language) return [profile.language];
    return [];
  }, [clientProfile?.languages, profile?.languages_spoken, profile?.language]);

  const allTags = useMemo(() => {
    const tags: string[] = [];
    const add = (arr: unknown) => {
      if (Array.isArray(arr)) tags.push(...arr.filter((v): v is string => typeof v === 'string'));
    };
    add(clientProfile?.interests);
    add(clientProfile?.personality_traits);
    add(clientProfile?.preferred_activities);
    return [...new Set(tags)].slice(0, 8);
  }, [clientProfile?.interests, clientProfile?.personality_traits, clientProfile?.preferred_activities]);

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
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[92vw] max-w-[560px] max-h-[85vh] overflow-y-auto overscroll-contain"
          >
            {/* Close button — inside card */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/70 transition-colors hover:bg-black/60 hover:text-white z-20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* === THE CARD === */}
            <div
              className="relative rounded-[20px] overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
              }}
            >
              {/* Dot pattern */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Top accent bar */}
              <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #e94560, #f5a623, #e94560)' }}
              />

              <div className="relative z-10 p-5">
                {/* Row 1: Badge + ID + QR */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
                        Local Resident
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight">
                      {name}
                    </h3>
                    {occupation && (
                      <p className="text-[13px] font-semibold text-cyan-300/80 mt-0.5">{occupation}</p>
                    )}

                    {/* Location & Nationality */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {location && (
                        <div className="flex items-center gap-1 text-[11px] text-white/50">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{location}</span>
                        </div>
                      )}
                      {nationality && (
                        <div className="flex items-center gap-1 text-[11px] text-white/50">
                          <Globe2 className="h-3 w-3 shrink-0" />
                          <span>{nationality}</span>
                          {yearsInCity && <span className="text-white/30">· {yearsInCity}yr local</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR + ID number */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-white/40">
                      {idNumber}
                    </span>
                    <div className="rounded-[10px] bg-white p-1.5 shadow-lg">
                      <QRCode value={validationUrl} size={68} level="H" />
                    </div>
                    <div className="flex items-center gap-1">
                      <ScanLine className="h-2.5 w-2.5 text-white/30" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/30">
                        Scan to verify
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {bio && (
                  <div className="rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5 mb-3">
                    <p className="text-[11px] leading-relaxed text-white/60 line-clamp-3">{bio}</p>
                  </div>
                )}

                {/* Tags + Languages row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.08] border border-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {spokenLanguages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.08] mb-4" />

                {/* Bottom: Photo left, WhatsApp + footer right */}
                <div className="flex items-end justify-between gap-4">
                  {/* Photo */}
                  <div className="w-[80px] h-[100px] shrink-0 rounded-[14px] overflow-hidden shadow-xl ring-2 ring-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-cyan-400 bg-white/5">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex-1 flex flex-col items-end gap-2">
                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[11px] font-semibold text-white/70 transition-transform active:scale-95"
                      >
                        <Phone className="h-3 w-3 text-green-400/80" />
                        <span className="truncate max-w-[140px]">{phone}</span>
                      </a>
                    )}
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">
                      swipess.app
                    </span>
                  </div>
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
