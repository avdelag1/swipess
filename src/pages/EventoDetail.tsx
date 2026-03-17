import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, MessageCircle, Sparkles, User, ChevronLeft, ChevronRight, Zap, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  image_urls: any[];
  event_date: string | null;
  event_end_date: string | null;
  location: string | null;
  location_detail: string | null;
  organizer_name: string | null;
  organizer_photo_url: string | null;
  organizer_whatsapp: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
}

export default function EventoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchEvent();
    if (user) checkFavorite();
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id!)
        .single();
      setEvent(data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('event_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', id!)
      .maybeSingle();
    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    triggerHaptic('medium');
    if (!user) {
      toast({ title: t('eventos.signInToSave'), variant: 'destructive' });
      return;
    }
    if (isFavorited) {
      await supabase.from('event_favorites').delete().eq('user_id', user.id).eq('event_id', id!);
      setIsFavorited(false);
      toast({ title: t('eventos.removedFavorite') });
    } else {
      await supabase.from('event_favorites').insert({ user_id: user.id, event_id: id! });
      setIsFavorited(true);
      toast({ title: t('eventos.savedFavorite') });
    }
  };

  const handleShare = async () => {
    triggerHaptic('light');
    if (navigator.share && event) {
      await navigator.share({
        title: event.title,
        text: `Check out ${event.title} on Swipess!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t('eventos.linkCopied') });
    }
  };

  const handleWhatsApp = () => {
    triggerHaptic('medium');
    if (!event?.organizer_whatsapp) return;
    const phone = event.organizer_whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola, vi tu evento "${event.title}" en Swipess 🔥`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black">
        <div className="h-[60vh] bg-slate-200 dark:bg-zinc-900 animate-pulse" />
        <div className="p-8 space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-zinc-900 animate-pulse rounded-2xl w-3/4" />
          <div className="h-6 bg-slate-200 dark:bg-zinc-900 animate-pulse rounded-2xl w-1/2" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <Info className="w-12 h-12 text-slate-300" strokeWidth={1} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.noResults')}</p>
        <button onClick={() => navigate(-1)} className="text-primary font-black uppercase tracking-widest text-[10px]">Go Back</button>
      </div>
    );
  }

  const imageGallery: string[] = [];
  if (event.image_url) imageGallery.push(event.image_url);
  if (Array.isArray(event.image_urls)) {
    event.image_urls.forEach((u: any) => {
      const url = typeof u === 'string' ? u : u?.url;
      if (url && url !== event.image_url) imageGallery.push(url);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pb-32">
      {/* ── HERO GALLERY ── */}
      <div className="relative h-[65dvh] overflow-hidden">
        <AnimatePresence mode="wait">
          {imageGallery.length > 0 ? (
            <motion.img
              key={activeImageIndex}
              src={imageGallery[activeImageIndex]}
              alt={event.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-slate-300 dark:text-white/10" />
            </div>
          )}
        </AnimatePresence>
        
        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-50 dark:from-black via-slate-50/40 dark:via-black/40 to-transparent" />

        {/* Floating Controls */}
        <div className="absolute top-[var(--safe-top)] left-4 right-4 flex justify-between items-center z-50 py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-11 h-11 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleFavorite}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              className="w-11 h-11 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <Heart className={cn("w-5 h-5 transition-colors", isFavorited ? "fill-rose-500 text-rose-500" : "text-white")} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              aria-label="Share event"
              className="w-11 h-11 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Gallery Indicator */}
        {imageGallery.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 z-20">
            {imageGallery.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveImageIndex(i); triggerHaptic('light'); }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeImageIndex ? "w-6 h-1 bg-white shadow-lg" : "w-1 h-1 bg-white/40"
                )}
              />
            ))}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-10 left-6 z-20">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/20 backdrop-blur-xl border border-primary/30">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{event.category}</span>
           </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="px-6 -mt-4 relative z-30 space-y-8">
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-none italic tracking-tighter uppercase">
            {event.title}
          </h1>
          {event.promo_text && (
            <p className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
               <Sparkles className="w-3 h-3" /> {event.promo_text}
            </p>
          )}
        </div>

        {/* Core Info Cards */}
        <div className="grid grid-cols-1 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-5 rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">When & Time</p>
              <h4 className="text-base font-black text-slate-900 dark:text-white italic uppercase leading-none">
                {formatDate(event.event_date)}
              </h4>
              <p className="text-xs font-bold text-slate-500 dark:text-white/40 mt-1 uppercase">
                {formatTime(event.event_date)} {event.event_end_date && ` — ${formatTime(event.event_end_date)}`}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-5 rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">The Location</p>
              <h4 className="text-base font-black text-slate-900 dark:text-white italic uppercase leading-none">
                {event.location}
              </h4>
              <p className="text-xs font-bold text-slate-500 dark:text-white/40 mt-1 uppercase line-clamp-1">
                {event.location_detail || 'Verified Destination'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em]">The Experience</h3>
            <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-white/60 leading-relaxed italic">
            {event.description || 'Join us for an unforgettable experience in the heart of the Riviera Maya.'}
          </p>
        </div>

        {/* Admission / Ticket Info */}
        <div className="p-6 rounded-[2.5rem] bg-slate-900 dark:bg-white/5 border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
           <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Access Pass</p>
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  {event.is_free ? 'FREE ACCESS' : (event.price_text || 'Premium')}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
           </div>
        </div>

        {/* Organizer info */}
        {event.organizer_name && (
          <div className="flex items-center justify-between py-6 border-y border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
                 <div className="w-full h-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    {event.organizer_photo_url ? (
                      <img src={event.organizer_photo_url} alt={event.organizer_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                 </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Host Organizers</p>
                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{event.organizer_name}</h5>
              </div>
            </div>
            
            <div className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 shadow-sm">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Host</span>
            </div>
          </div>
        )}

      </div>

      {/* ── STICKY FOOTER CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-8 bg-gradient-to-t from-slate-50 dark:from-black via-slate-50 dark:via-black to-transparent z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          {event.organizer_whatsapp && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-white uppercase tracking-[0.15em] text-[11px] shadow-2xl shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            >
              <MessageCircle className="w-5 h-5" />
              Secure My Spot
            </motion.button>
          )}
          
          <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={handleShare}
             aria-label="Share event"
             className="w-16 h-full aspect-square rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-lg"
          >
             <Share2 className="w-5 h-5 text-slate-600 dark:text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
