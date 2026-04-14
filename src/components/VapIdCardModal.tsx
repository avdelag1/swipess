import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Globe2, Phone, ScanLine, Palette } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CARD_THEMES } from './vap-id/cardThemes';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { user } = useAuth();
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = CARD_THEMES[themeIndex];

  const cycleTheme = () => setThemeIndex((i) => (i + 1) % CARD_THEMES.length);

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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/70 transition-colors hover:bg-black/60 hover:text-white z-20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* THE CARD */}
            <motion.div
              key={themeIndex}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="relative rounded-[20px] overflow-hidden shadow-2xl"
              style={{ background: theme.background }}
            >
              {/* Pattern overlay */}
              {theme.pattern && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: theme.pattern,
                    backgroundSize: theme.name === 'Rosa Mexicano' ? '80px 80px' : '24px 24px',
                    opacity: theme.patternOpacity,
                  }}
                />
              )}

              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ background: theme.accentBar }} />

              <div className="relative z-10 p-5">
                {/* Row 1: Badge + Name + ID number */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: theme.accentColor }} />
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.22em]"
                        style={{ color: theme.accentColor }}
                      >
                        Local Resident
                      </span>
                    </div>

                    {/* Name */}
                    <h3
                      className="text-xl font-black leading-tight tracking-tight"
                      style={{ color: theme.textPrimary }}
                    >
                      {name}
                    </h3>
                    {occupation && (
                      <p className="text-[13px] font-semibold mt-0.5" style={{ color: theme.accentColor }}>
                        {occupation}
                      </p>
                    )}

                    {/* Location & Nationality */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {location && (
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: theme.textTertiary }}>
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{location}</span>
                        </div>
                      )}
                      {nationality && (
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: theme.textTertiary }}>
                          <Globe2 className="h-3 w-3 shrink-0" />
                          <span>{nationality}</span>
                          {yearsInCity && (
                            <span style={{ color: theme.textTertiary, opacity: 0.6 }}>· {yearsInCity}yr local</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID number top-right */}
                  <div className="shrink-0 flex flex-col items-end gap-1 pt-1">
                    <span
                      className="text-[9px] font-mono font-bold tracking-widest"
                      style={{ color: theme.textTertiary }}
                    >
                      {idNumber}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {bio && (
                  <div
                    className="rounded-[10px] px-3.5 py-2.5 mb-3"
                    style={{
                      background: theme.tagBg,
                      border: `1px solid ${theme.tagBorder}`,
                    }}
                  >
                    <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: theme.textSecondary }}>
                      {bio}
                    </p>
                  </div>
                )}

                {/* Tags + Languages */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: theme.tagBg,
                            border: `1px solid ${theme.tagBorder}`,
                            color: theme.tagText,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {spokenLanguages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider"
                        style={{ color: theme.textTertiary }}
                      >
                        Speaks
                      </span>
                      {spokenLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: theme.langTagBg,
                            border: `1px solid ${theme.langTagBorder}`,
                            color: theme.langTagText,
                          }}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px mb-4" style={{ background: theme.tagBorder }} />

                {/* Bottom: Photo left, WhatsApp + QR + footer right */}
                <div className="flex items-end justify-between gap-4">
                  {/* Photo */}
                  <div
                    className="w-[80px] h-[100px] shrink-0 rounded-[14px] overflow-hidden shadow-xl"
                    style={{ boxShadow: `0 8px 30px rgba(0,0,0,0.3)`, border: `2px solid ${theme.tagBorder}` }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl font-black"
                        style={{ color: theme.accentColor, background: theme.tagBg }}
                      >
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
                        className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[11px] font-semibold transition-transform active:scale-95"
                        style={{
                          background: theme.tagBg,
                          border: `1px solid ${theme.tagBorder}`,
                          color: theme.textSecondary,
                        }}
                      >
                        <Phone className="h-3 w-3" style={{ color: '#4ade80' }} />
                        <span className="truncate max-w-[140px]">{phone}</span>
                      </a>
                    )}

                    {/* QR + verify */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1">
                          <ScanLine className="h-2.5 w-2.5" style={{ color: theme.textTertiary }} />
                          <span
                            className="text-[7px] font-bold uppercase tracking-[0.12em]"
                            style={{ color: theme.textTertiary }}
                          >
                            Scan to verify
                          </span>
                        </div>
                        <span
                          className="text-[8px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: theme.textTertiary, opacity: 0.6 }}
                        >
                          swipess.app
                        </span>
                      </div>
                      <div className="rounded-[8px] p-1 shadow-lg" style={{ background: theme.qrBg }}>
                        <QRCode value={validationUrl} size={48} level="H" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme switcher button */}
              <button
                onClick={cycleTheme}
                className="absolute bottom-3 left-3 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-transform active:scale-90 z-20"
                style={{
                  background: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  border: `1px solid ${theme.tagBorder}`,
                }}
                aria-label="Change theme"
              >
                <Palette className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
