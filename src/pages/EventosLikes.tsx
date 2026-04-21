import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ArrowLeft, Calendar, 
  Sparkles, Trash2, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useVisualTheme } from '@/contexts/VisualThemeContext';
import CardImage from '@/components/CardImage';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { CATEGORIES } from '@/data/eventsData';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  price_text: string | null;
  organizer_whatsapp: string | null;
}

export default function EventosLikes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { setAmbientColor } = useVisualTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const color = CATEGORIES.find(c => c.key === selectedCategory)?.color || '#f97316';
    setAmbientColor(color);
  }, [selectedCategory, setAmbientColor]);

  const { data: likedEvents, isLoading } = useQuery({
    queryKey: ['event-likes-detailed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: likes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'event');
      
      if (!likes?.length) return [];
      
      const ids = likes.map(l => l.target_id);
      
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('id', ids);
      
      if (error) throw error;
      return (events || []) as EventItem[];
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) return;
      await supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', id).eq('target_type', 'event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-likes-detailed', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event-likes', user?.id] });
      toast.success("Removed from favorites");
      triggerHaptic('medium');
    }
  });

  const filtered = (likedEvents || []).filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (ev.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Adaptive primary color for the ambient glow and active states
  const activeColor = CATEGORIES.find(c => c.key === selectedCategory)?.color || '#f97316';

  return (
    <div className={cn(
      "min-h-[101dvh] pb-24 transition-colors duration-700 relative overflow-x-hidden touch-pan-y",
      isLight ? "bg-white text-zinc-900" : "bg-[#0a0a0b] text-white"
    )} data-no-swipe-nav="true">
      {/* 🏎️ Adaptive Ambient Background: Shifts color based on filter */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[400px] blur-[120px] opacity-[0.12] pointer-events-none transition-colors duration-1000 z-0"
        style={{ background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)` }}
      />

      {/* 📱 Flagship Header */}
      <div className={cn(
        "sticky top-0 z-50 backdrop-blur-2xl pt-[var(--safe-top)] px-4 pb-1 transition-all duration-500 border-b",
        isLight ? "bg-white/80 border-black/[0.03]" : "bg-black/60 border-white/[0.03]"
      )}>
        <div className="flex items-center gap-4 py-4 px-2">
          <div className="flex-1">
            <h1 className="text-xl font-black font-brand tracking-tight leading-tight">My Favorites</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: activeColor }} />
               <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-40")}>
                {likedEvents?.length || 0} Saved Events
               </p>
            </div>
          </div>
          <div className="flex -space-x-2">
             <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center backdrop-blur-md relative z-10">
                <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />
             </div>
          </div>
        </div>

        {/* 🏷️ Smart Category Filters: High-density horizontal pills */}
        <div className="flex gap-2.5 pb-4 px-2 overflow-x-auto no-scrollbar scroll-smooth">
          {CATEGORIES.filter(c => c.key !== 'likes').map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.key;
            const catColor = cat.color || '#f97316';
            
            return (
              <button
                key={cat.key}
                onClick={() => { triggerHaptic('light'); setSelectedCategory(cat.key); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 transition-all duration-300 border backdrop-blur-md relative overflow-hidden",
                  active ? "shadow-md scale-105" : "opacity-60 hover:opacity-100"
                )}
                style={{
                  backgroundColor: active ? `${catColor}15` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                  borderColor: active ? `${catColor}40` : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "" : "text-zinc-500")} style={{ color: active ? catColor : undefined }} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "" : "text-zinc-500")} style={{ color: active ? catColor : undefined }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 🔍 Dynamic Filter Bar */}
        <div className="px-2 pb-3">
          <div className="relative group">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", isLight ? "text-zinc-300 group-focus-within:text-orange-500" : "text-zinc-600 group-focus-within:text-orange-400")} />
            <input 
              type="text" 
              placeholder="Search your vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:outline-none transition-all border",
                isLight 
                  ? "bg-zinc-50/50 border-black/[0.03] text-black placeholder:text-zinc-300" 
                  : "bg-zinc-900/40 border-white/[0.03] text-white placeholder:text-zinc-600"
              )}
            />
          </div>
        </div>
      </div>

      {/* 🖼️ Grid Content */}
      <div className="p-4 pt-6 relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <DiscoverySkeleton count={6} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode='popLayout'>
              {filtered.map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    "group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border transition-all duration-500 shadow-sm active:scale-[0.98]",
                    isLight ? "bg-zinc-100 border-black/[0.04]" : "bg-zinc-900 border-white/[0.04]"
                  )}
                  onClick={() => navigate(`/explore/eventos/${ev.id}`, { state: { eventData: ev } })}
                >
                  {/* Image */}
                  <CardImage 
                    src={ev.image_url || ''} 
                    alt={ev.title} 
                  />
                  
                  {/* Overlays */}
                  <div className={cn(
                    "absolute inset-0 opacity-80 transition-opacity duration-700",
                    isLight ? "bg-gradient-to-t from-white via-white/20 to-transparent" : "bg-gradient-to-t from-black via-black/20 to-transparent"
                  )} />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[7px] font-black text-white uppercase tracking-widest border border-white/10">
                      {ev.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLikeMutation.mutate(ev.id);
                    }}
                    aria-label={`Remove ${ev.title} from favorites`}
                    className={cn(
                      "absolute top-4 right-4 w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90",
                      isLight ? "bg-white/40 border-black/10" : "bg-black/40 border-white/10"
                    )}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>

                  {/* Info */}
                  <div className="absolute bottom-5 left-5 right-5 space-y-1">
                    <h3 className={cn("font-black text-xs line-clamp-2 leading-tight drop-shadow-md", isLight ? "text-zinc-900" : "text-white")}>
                      {ev.title}
                    </h3>
                    <div className={cn("flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest italic opacity-50")}>
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{ev.event_date ? new Date(ev.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBA'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className={cn(
              "w-24 h-24 rounded-[2.5rem] border flex items-center justify-center mb-8 relative",
              isLight ? "bg-zinc-50 border-black/[0.04]" : "bg-zinc-900/40 border-white/[0.04]"
            )}>
              <div className="absolute inset-0 blur-2xl bg-orange-500/10 rounded-full" />
              <Sparkles className={cn("w-10 h-10 relative z-10", isLight ? "text-zinc-200" : "text-zinc-800")} />
            </div>
            <h3 className={cn("text-2xl font-black mb-3 italic tracking-tighter uppercase", isLight ? "text-black" : "text-white")}>Empty Vault.</h3>
            <p className={cn("text-xs leading-relaxed mb-10 opacity-40 font-medium px-6")}>
              Your favorite experiences are waiting. Start swiping to curate your ultimate social calendar.
            </p>
            <button 
              onClick={() => navigate('/explore/eventos')}
              className="px-10 py-4 rounded-2xl bg-orange-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/40 active:scale-95 transition-all"
            >
              Explore Events
            </button>
          </div>
        )}
      </div>
      

    </div>
  );
}

