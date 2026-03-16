import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, Clock, MessageCircle, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

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
      toast({ title: 'Sign in to save events', variant: 'destructive' });
      return;
    }
    if (isFavorited) {
      await supabase.from('event_favorites').delete().eq('user_id', user.id).eq('event_id', id!);
      setIsFavorited(false);
      toast({ title: 'Removed from favorites' });
    } else {
      await supabase.from('event_favorites').insert({ user_id: user.id, event_id: id! });
      setIsFavorited(true);
      toast({ title: 'Saved to favorites ❤️' });
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
      toast({ title: 'Link copied!' });
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
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero image */}
      <div className="relative h-[50vh]">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

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
              Free Entry
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
            <h3 className="text-sm font-semibold text-foreground mb-1.5">About</h3>
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
              <p className="text-sm font-semibold text-foreground">Organized by</p>
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
            Chatea por WhatsApp
          </motion.button>
        )}
      </div>
    </div>
  );
}
