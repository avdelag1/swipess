import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, MapPin, Calendar, MessageCircle, Sparkles, User, Users, ChevronLeft, Zap, Info, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { useAppNavigate } from '@/hooks/useAppNavigate';

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

/**
 * BRAND ADVERTISING COMPONENT
 * Shows benefits for brands to advertise in NEXUS DISCOVERY.
 */
function BrandBenefitsSection() {
  const { navigate } = useAppNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-8 rounded-[3rem] bg-indigo-600 dark:bg-indigo-600/30 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20 my-10"
    >
       {/* Background Decoration */}
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400 blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity" />
       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
       
       <div className="relative z-10 space-y-7">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
             <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="space-y-3">
             <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.85]">Elevate Your <br/> Brand <br/> Presence</h3>
             <p className="text-sm font-medium text-white/70 italic tracking-tight leading-relaxed max-w-[85%]">Promote your business to the most elite, high-intent audience in the Riviera Maya.</p>
          </div>
          
          <div className="space-y-4 pt-2">
             <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                   <Zap className="w-4 h-4 text-indigo-200" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Direct WA Connection</span>
                   <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Instant lead generation</span>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                   <Users className="w-4 h-4 text-indigo-200" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Elite Targeted Traffic</span>
                   <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">15k+ Monthly active neighbors</span>
                </div>
             </div>
          </div>
          
          <div className="pt-4">
             <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full py-4.5 h-14 rounded-2xl bg-white text-indigo-600 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                onClick={() => {
                   triggerHaptic('medium');
                   navigate('/client/advertise');
                }}
             >
                Submit Your Brand <ArrowUpRight className="w-4 h-4" />
             </motion.button>
          </div>
       </div>
    </motion.div>
  );
}

export default function EventoDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateEventData = (location.state as any)?.eventData as EventDetail | undefined;
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, [id]);


  // 🚀 SPEED OF LIGHT: Unified Event Data Query
  const { data: event, isLoading } = useQuery({
    queryKey: ['evento', id],
    queryFn: async () => {
      // 🚀 SPEED OF LIGHT: Handle mock data IDs (starting with 'm')
      if (id?.startsWith('m')) {
        if (stateEventData) return stateEventData;
        
        // Dynamic import to avoid circular dependencies or large initial bundle
        const mod = await import('./EventosFeed') as any;
        const found = mod.MOCK_EVENTS?.find((e: any) => e.id === id);
        if (found) return found;
        
        throw new Error('Mock event not found.');
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id!)
        .single();
      if (error || !data) {
        if (stateEventData) return stateEventData;
        throw error ?? new Error('Event not found');
      }
      return data as EventDetail;
    },
    enabled: !!id,
    initialData: stateEventData,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-scroll photos every 4 seconds
  useEffect(() => {
    if (!event) return;
    const gallery: string[] = [];
    if (event.image_url) gallery.push(event.image_url);
    if (Array.isArray(event.image_urls)) {
      event.image_urls.forEach((u: any) => {
        const url = typeof u === 'string' ? u : u?.url;
        if (url && url !== event.image_url) gallery.push(url);
      });
    }
    if (gallery.length <= 1) return;

    const interval = setInterval(() => {
      setActiveImageIndex(i => (i + 1) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [event]);


  const { data: isFavorited = false } = useQuery({
    queryKey: ['event-is-favorited', id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_id', id!)
        .eq('target_type', 'event')
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  // 🚀 SPEED OF LIGHT: Optimistic Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['event-is-favorited', id, user?.id] });
      const previousStatus = queryClient.getQueryData(['event-is-favorited', id, user?.id]);
      
      queryClient.setQueryData(['event-is-favorited', id, user?.id], !previousStatus);
      triggerHaptic('medium');
      
      return { previousStatus };
    },
    mutationFn: async () => {
      if (!user) throw new Error('Sign in required');
      if (isFavorited) {
        return supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', id!).eq('target_type', 'event');
      } else {
        return supabase.from('likes').insert({ user_id: user.id, target_id: id!, target_type: 'event' });
      }
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['event-is-favorited', id, user?.id], context?.previousStatus);
      toast({ title: t('eventos.error'), variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event-is-favorited', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event-favorites', user?.id] });
    }
  });

  const toggleFavorite = () => {
    if (!user) {
      toast({ title: t('eventos.signInToSave'), variant: 'destructive' });
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const handleShare = async () => {
    triggerHaptic('light');
    if (navigator.share && event) {
      await navigator.share({
        title: event.title,
        text: `Check out ${event.title} on NEXUS DISCOVERY!`,
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
    const message = encodeURIComponent(`Hola, vi tu evento "${event.title}" en NEXUS DISCOVERY 🔥`);
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
    <div className="min-h-screen bg-slate-50 dark:bg-black pb-48" style={{ contain: 'paint layout' }}>
      {/* ── HERO GALLERY ── */}
      <div className="relative h-[65dvh] overflow-hidden">
        <AnimatePresence mode="popLayout">
          {imageGallery.length > 0 ? (
            <motion.img
              key={activeImageIndex}
              src={imageGallery[activeImageIndex]}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-slate-300 dark:text-white/10" />
            </div>
          )}
        </AnimatePresence>

        {/* Story-style tap zones: tap left half → previous image, tap right half → next image */}
        {imageGallery.length > 1 && (
          <>
            <button
              aria-label="Previous image"
              className="absolute left-0 top-0 w-[40%] h-full z-10 cursor-pointer"
              onClick={() => {
                triggerHaptic('light');
                setActiveImageIndex(i => (i - 1 + imageGallery.length) % imageGallery.length);
              }}
            />
            <button
              aria-label="Next image"
              className="absolute right-0 top-0 w-[40%] h-full z-10 cursor-pointer"
              onClick={() => {
                triggerHaptic('light');
                setActiveImageIndex(i => (i + 1) % imageGallery.length);
              }}
            />
          </>
        )}

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-50 dark:from-black via-slate-50/40 dark:via-black/40 to-transparent" />

        {/* Floating Controls — Adjusted lower to clear 'S' Logo */}
        <div className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] left-4 right-4 flex justify-between items-center z-50 py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            aria-label="Go back"
            className="w-11 h-11 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
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
                aria-label={`Go to image ${i + 1}`}
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
      <div className="px-6 -mt-4 relative z-30 space-y-10">
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-[0.9] italic tracking-tighter uppercase">
            {event.title}
          </h1>
          {event.promo_text && (
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
               <Sparkles className="w-3.5 h-3.5 text-amber-500" />
               <span className="text-amber-600 dark:text-amber-400 font-black uppercase text-[10px] tracking-widest">{event.promo_text}</span>
            </div>
          )}
        </div>

        {/* Core Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-5 p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 backdrop-blur-md"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-1.5">When & Time</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white italic uppercase leading-none">
                {formatDate(event.event_date)}
              </h4>
              <p className="text-xs font-bold text-slate-500 dark:text-white/40 mt-1.5 uppercase">
                {formatTime(event.event_date)} {event.event_end_date && ` — ${formatTime(event.event_end_date)}`}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-5 p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 backdrop-blur-md"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-1.5">The Location</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white italic uppercase leading-none">
                {event.location}
              </h4>
              <p className="text-xs font-bold text-slate-500 dark:text-white/40 mt-1.5 uppercase line-clamp-1">
                {event.location_detail || 'Verified Destination'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Description Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] whitespace-nowrap">The Experience</h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-white/70 leading-relaxed italic pr-4">
            {event.description || 'Join us for an unforgettable experience in the heart of the Riviera Maya.'}
          </p>
        </div>

        {/* Admission / Ticket Info */}
        <div className="p-8 rounded-[3rem] bg-slate-900 dark:bg-zinc-900 border border-white/10 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-48 h-48 bg-primary blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity" />
           <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">Admission Pass</p>
                <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {event.is_free ? 'FREE ENTRY' : (event.price_text || 'Premium')}
                </h4>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-3">Verified Booking Required</p>
              </div>
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center shadow-inner border border-white/5">
                <ShieldCheck className="w-8 h-8 text-rose-400" />
              </div>
           </div>
        </div>

        {/* ── BRAND BENEFITS (Dynamic Ad Section) ── */}
        <BrandBenefitsSection />

        {/* Organizer info */}
        {event.organizer_name && (
          <div className="flex items-center justify-between py-10 border-y border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 p-1 bg-gradient-to-tr from-primary to-purple-500">
                 <div className="w-full h-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden ring-4 ring-white dark:ring-black">
                    {event.organizer_photo_url ? (
                      <img src={event.organizer_photo_url} alt={event.organizer_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="w-7 h-7" />
                      </div>
                    )}
                 </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-1">Elite Organizer</p>
                <h5 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{event.organizer_name}</h5>
              </div>
            </div>
            
            <div className="px-5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 shadow-xl shadow-black/5">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Verified Host</span>
            </div>
          </div>
        )}

      </div>

      {/* ── STICKY FOOTER CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-10 bg-gradient-to-t from-slate-50 dark:from-black via-slate-50 dark:via-black/95 to-transparent z-50">
        <div className="max-w-xl mx-auto flex gap-4">
          {event.organizer_whatsapp && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-3.5 py-5 rounded-[2rem] font-black text-white uppercase tracking-[0.25em] text-[12px] shadow-2xl shadow-emerald-500/40 relative overflow-hidden group active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <MessageCircle className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Secure Entry Spot</span>
            </motion.button>
          )}
          
          <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={handleShare}
             aria-label="Share event"
             className="w-20 h-full aspect-square rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-xl shadow-black/5 active:scale-90 transition-all"
          >
             <Share2 className="w-6 h-6 text-slate-700 dark:text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}


