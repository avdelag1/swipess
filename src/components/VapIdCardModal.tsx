import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Droplets, ScanLine } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import useAppTheme from '@/hooks/useAppTheme';
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, nationality, city, country, languages_spoken, phone')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['vap-id-client-profile', user?.id],
    enabled: !!user?.id && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('bio, nationality, city, occupation, interests, personality_traits, preferred_activities')
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

  const spokenLanguages = useMemo(() => {
    const raw = profile?.languages_spoken;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    return [];
  }, [profile?.languages_spoken]);

  const allTags = useMemo(() => {
    const tags: string[] = [];
    const add = (arr: any) => { if (Array.isArray(arr)) tags.push(...arr.filter(v => typeof v === 'string')); };
    add(clientProfile?.interests);
    add(clientProfile?.personality_traits);
    return [...new Set(tags)].slice(0, 8);
  }, [clientProfile]);

  const validationUrl = "https://swipess.com/vap-validate/" + (user?.id || 'unknown');
  const idNumber = "NX-" + (user?.id || 'resident').slice(0, 8).toUpperCase();
  const location = [city, country].filter(Boolean).join(', ');

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[92vw] max-w-[560px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <button onClick={cycleTheme} className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 border border-white/15">
                <Droplets className="h-4 w-4 text-white/80" />
              </button>
              <span className="text-[10px] font-medium text-white/40">{theme.name}</span>
              <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 border border-white/15">
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            <motion.div
              key={themeIndex}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
              style={{ background: theme.background }}
            >
              <div className="relative z-10 p-8 sm:p-10">
                <div className="flex gap-8 mb-10">
                  <div className="relative shrink-0">
                    <div className="w-[120px] h-[150px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/10">
                      {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black" style={{ color: theme.accentColor, background: theme.tagBg }}>{name.charAt(0)}</div>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-2 space-y-5">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2">
                          <ShieldCheck size={18} style={{ color: theme.accentColor }} />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] italic" style={{ color: theme.accentColor }}>Authorized Resident</span>
                       </div>
                       <h3 className="text-3xl font-black leading-none tracking-tighter italic uppercase" style={{ color: theme.textPrimary }}>{name}</h3>
                    </div>
                    <div className="space-y-3">
                       {occupation && <span className="text-[12px] font-black uppercase tracking-widest italic" style={{ color: theme.accentColor }}>{occupation}</span>}
                       <div className="flex flex-col gap-2 opacity-60">
                          {location && <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}><MapPin size={14} /><span>{location}</span></div>}
                          <span className="text-[9px] font-mono tracking-widest" style={{ color: theme.textTertiary }}>TXID: {idNumber}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {bio && <div className="rounded-[1.5rem] p-6 mb-8 border" style={{ background: `${theme.tagBg}44`, border: `1px solid ${theme.tagBorder}` }}><p className="text-[13px] leading-relaxed italic font-medium" style={{ color: theme.textSecondary }}>{bio}</p></div>}

                <div className="space-y-6">
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => <span key={tag} className="rounded-full px-4 py-2 text-[10px] font-black uppercase italic tracking-widest border" style={{ background: theme.tagBg, border: `1px solid ${theme.tagBorder}`, color: theme.tagText }}>{tag}</span>)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t" style={{ borderTopColor: theme.tagBorder }}>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: theme.textTertiary }}>Identity Protocol</span>
                        <span className="text-[7px] font-bold uppercase tracking-[0.15em] opacity-50" style={{ color: theme.textTertiary }}>swipess.com</span>
                     </div>
                     <div className="rounded-xl p-2 bg-white shadow-2xl">
                        <QRCode value={validationUrl} size={50} level="H" />
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
