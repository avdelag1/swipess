import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Droplets, ScanLine, Pencil, Phone, Languages } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import useAppTheme from '@/hooks/useAppTheme';
import { CARD_THEMES } from './vap-id/cardThemes';
import { VapIdEditModal } from './VapIdEditModal';
import { useEffect } from 'react';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VapIdCardModal({ isOpen, onClose }: VapIdProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [themeIndex, setThemeIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const theme = CARD_THEMES[themeIndex];

  const cycleTheme = () => setThemeIndex((i) => (i + 1) % CARD_THEMES.length);

  const { data: profile } = useQuery({
    queryKey: ['vap-id-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 0,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, nationality, city, country, languages_spoken, phone, occupation')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['vap-id-client-profile', user?.id],
    enabled: !!user?.id && isOpen,
    staleTime: 0,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('client_profiles')
        .select('bio, occupation, nationality, city, years_in_city, languages, interests, personality_traits, preferred_activities')

        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // REALTIME: live-refresh the card whenever either profile row changes
  useEffect(() => {
    if (!user?.id || !isOpen) return;
    const channel = supabase
      .channel(`vap-id-card-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['vap-id-profile', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_profiles', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user.id] });
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user?.id, isOpen, queryClient]);

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Resident';
  const nationality = clientProfile?.nationality || profile?.nationality || '';
  const city = clientProfile?.city || profile?.city || '';
  const country = profile?.country || '';
  const bio = clientProfile?.bio || '';
  const occupation = (clientProfile as any)?.occupation || '';
  const avatarUrl = profile?.avatar_url || '';
  const phone = profile?.phone || '';

  const spokenLanguages = useMemo(() => {
    // Prefer client_profiles.languages (what the Edit modal writes); fall back to profiles.languages_spoken
    const clientLangs = (clientProfile as any)?.languages;
    const raw = Array.isArray(clientLangs) && clientLangs.length > 0
      ? clientLangs
      : profile?.languages_spoken;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
    return [];
  }, [clientProfile, profile?.languages_spoken]);

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
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[98vw] max-w-none h-[98dvh] max-h-[98dvh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 px-1 gap-2">
              <button
                onClick={cycleTheme}
                aria-label="Change card color"
                className="h-11 w-11 flex items-center justify-center rounded-full bg-white border border-black/10 shadow-lg active:scale-95 transition"
              >
                <Droplets className="h-5 w-5 text-black" strokeWidth={2.6} />
              </button>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 flex-1 text-center truncate">{theme.name}</span>
              <button
                onClick={() => setEditOpen(true)}
                aria-label="Edit identity"
                className="h-11 w-11 flex items-center justify-center rounded-full bg-white border border-black/10 shadow-lg active:scale-95 transition"
              >
                <Pencil className="h-5 w-5 text-black" strokeWidth={2.6} />
              </button>
              <button
                onClick={onClose}
                aria-label="Close card"
                className="h-11 w-11 flex items-center justify-center rounded-full bg-white border border-black/10 shadow-lg active:scale-95 transition"
              >
                <X className="h-5 w-5 text-black" strokeWidth={2.8} />
              </button>
            </div>

            <motion.div
              key={themeIndex}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex-1 flex flex-col"
              style={{ background: theme.background }}
            >
              <div className="relative z-10 p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex gap-6 mb-8">
                  <div className="relative shrink-0">
                    <div className="w-[160px] h-[200px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/10">
                      {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black" style={{ color: theme.accentColor, background: theme.tagBg }}>{name.charAt(0)}</div>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-2 space-y-5">
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center gap-2">
                          <ShieldCheck size={22} style={{ color: theme.accentColor }} />
                          <span className="text-[12px] font-black uppercase tracking-[0.4em] italic" style={{ color: theme.accentColor }}>Authorized Resident</span>
                       </div>
                       <h3 className="text-4xl font-black leading-none tracking-tighter italic uppercase" style={{ color: theme.textPrimary }}>{name}</h3>
                    </div>
                    <div className="space-y-4">
                       {occupation && <span className="text-[14px] font-black uppercase tracking-widest italic" style={{ color: theme.accentColor }}>{occupation}</span>}
                       <div className="flex flex-col gap-2 opacity-60">
                          {location && <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}><MapPin size={16} /><span>{location}</span></div>}
                          <span className="text-[11px] font-mono tracking-widest" style={{ color: theme.textTertiary }}>TXID: {idNumber}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {bio && <div className="rounded-[1.5rem] p-6 mb-8 border" style={{ background: `${theme.tagBg}44`, border: `1px solid ${theme.tagBorder}` }}><p className="text-[14px] leading-relaxed italic font-medium" style={{ color: theme.textSecondary }}>{bio}</p></div>}

                <div className="space-y-6 flex-1 flex flex-col">
                  {(spokenLanguages.length > 0 || phone) && (
                    <div className="flex flex-col gap-2">
                      {spokenLanguages.length > 0 && (
                        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
                          <Languages size={16} />
                          <span className="truncate">{spokenLanguages.join(' · ')}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
                          <Phone size={16} />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => <span key={tag} className="rounded-full px-5 py-2 text-[11px] font-black uppercase italic tracking-widest border" style={{ background: theme.tagBg, border: `1px solid ${theme.tagBorder}`, color: theme.tagText }}>{tag}</span>)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t mt-auto" style={{ borderTopColor: theme.tagBorder }}>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70" style={{ color: theme.textTertiary }}>Identity Protocol</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.15em] opacity-50" style={{ color: theme.textTertiary }}>swipess.com</span>
                     </div>
                     <div className="rounded-xl p-3 bg-white shadow-2xl">
                        <QRCode value={validationUrl} size={70} level="H" />
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <VapIdEditModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </>,
    document.body
  );
}
