import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, MessageCircle, Sparkles, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

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
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id!)
      .single();
    setEvent(data as any);
    setIsLoading(false);
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
    if (!event?.organizer_whatsapp) return;
    const phone = event.organizer_whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola, vi tu evento "${event.title}" en Swipess 🔥`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[50vh] bg-card animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-card animate-pulse rounded-xl w-3/4" />
          <div className="h-4 bg-card animate-pulse rounded-xl w-1/2" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.noResults')}</p>
      </div>
    );
  }

  // Build image gallery — primary image + any extra from image_urls
  const imageGallery: string[] = [];
  if (event.image_url) imageGallery.push(event.image_url);
  if (Array.isArray(event.image_urls)) {
    event.image_urls.forEach((u: any) => {
      const url = typeof u === 'string' ? u : u?.url;
      if (url && url !== event.image_url) imageGallery.push(url);
    });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero image with gallery */}
      <div className="relative h-[50vh]">
        <AnimatePresence mode="wait">
          {imageGallery.length > 0 ? (
            <motion.img
              key={activeImageIndex}
              src={imageGallery[activeImageIndex]}
              alt={event.title}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Gallery navigation arrows */}
        {imageGallery.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex(i => (i - 1 + imageGallery.length) % imageGallery.length)}
              className="absolute left-16 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-10"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setActiveImageIndex(i => (i + 1) % imageGallery.length)}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-10"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-10">
              {imageGallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === activeImageIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleFavorite}
              className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
            >
              <Heart className={cn("w-5 h-5", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-20 left-4 flex gap-2 z-10">
          {event.discount_tag && (
            <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {event.discount_tag}
            </span>
          )}
          {event.is_free && (
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
              {t('eventos.freeEntry')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10 space-y-5">
        <h1 className="text-2xl font-bold text-foreground leading-tight">{event.title}</h1>

        {/* Date & Location */}
        <div className="space-y-2.5">
          {event.event_date && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/80 border border-border/30">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{formatDate(event.event_date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.event_date)}
                  {event.event_end_date && ` – ${formatTime(event.event_end_date)}`}
                </p>
              </div>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/80 border border-border/30">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{event.location}</p>
                {event.location_detail && (
                  <p className="text-xs text-muted-foreground">{event.location_detail}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">{t('eventos.about')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Promo highlights */}
        {event.promo_text && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-sm font-semibold text-primary">🎉 {event.promo_text}</p>
          </div>
        )}

        {/* Organizer */}
        {event.organizer_name && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/80 border border-border/30">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {event.organizer_photo_url ? (
                <img src={event.organizer_photo_url} alt={event.organizer_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('eventos.organizedBy')}</p>
              <p className="text-xs text-muted-foreground">{event.organizer_name}</p>
            </div>
          </div>
        )}

        {/* WhatsApp CTA */}
        {event.organizer_whatsapp && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
          >
            <MessageCircle className="w-5 h-5" />
            {t('eventos.chatWhatsApp')}
          </motion.button>
        )}
      </div>
    </div>
  );
}
