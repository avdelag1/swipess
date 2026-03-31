import { useState } from 'react';
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
import CardImage from '@/components/CardImage';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';

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
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: likedEvents, isLoading } = useQuery({
    queryKey: ['event-likes-detailed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get liked IDs first
      const { data: likes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'event');
      
      if (!likes?.length) return [];
      
      const ids = likes.map(l => l.target_id);
      
      // Fetch full event details
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

  const categories = ['all', ...new Set((likedEvents || []).map(e => e.category))];

  return (
    <div className={cn(
      "min-h-screen pb-24 transition-colors duration-500",
      isLight ? "bg-white text-black" : "bg-[#0a0a0b] text-white"
    )}>
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-50 backdrop-blur-xl pt-[var(--safe-top)] px-4 pb-4 border-b transition-colors duration-500",
        isLight ? "bg-white/80 border-black/5" : "bg-black/60 border-white/5"
      )}>
        <div className="flex items-center gap-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            title="Go back"
            aria-label="Go back"
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all",
              isLight ? "bg-black/5 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={cn("text-xl font-black font-brand tracking-tight", isLight ? "text-black" : "text-white")}>Saved Events</h1>
            <p className={cn("text-[10px] uppercase font-bold tracking-widest", isLight ? "text-black/40" : "text-white/40")}>
              {likedEvents?.length || 0} Events in your vault
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
             <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />
             </div>
          </div>
        </div>

        {/* Search & Simple Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-black/30" : "text-white/30")} />
            <input 
              type="text" 
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500/50 transition-colors",
                isLight ? "bg-black/5 border-black/10 text-black placeholder:text-black/30" : "bg-white/5 border-white/10 text-white placeholder:text-white/30"
              )}
            />
          </div>
        </div>
        
        {/* Categories */}
        {categories.length > 2 && (
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { triggerHaptic('light'); setSelectedCategory(cat); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  selectedCategory === cat 
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                    : (isLight ? "bg-black/5 text-black/40 border border-black/5" : "bg-white/5 text-white/40 border border-white/5")
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="p-4 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoverySkeleton count={4} />
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
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    "group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border transition-colors duration-500",
                    isLight ? "bg-zinc-100 border-black/5" : "bg-zinc-900 border-white/5"
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
                    <span className="px-2 py-1 rounded-lg bg-orange-600/80 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest">
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
                  <div className="absolute bottom-5 left-5 right-5 space-y-2">
                    <h3 className={cn("font-black text-sm line-clamp-2 leading-tight drop-shadow-lg", isLight ? "text-black" : "text-white")}>
                      {ev.title}
                    </h3>
                    <div className={cn("flex items-center gap-1.5 text-[9px] font-medium", isLight ? "text-black/60" : "text-white/60")}>
                      <Calendar className="w-3 h-3 text-orange-400" />
                      <span>{ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBA'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] border flex items-center justify-center mb-6",
              isLight ? "bg-zinc-100 border-black/5" : "bg-zinc-900 border-white/5"
            )}>
              <Sparkles className={cn("w-8 h-8", isLight ? "text-black/10" : "text-white/10")} />
            </div>
            <h3 className={cn("text-xl font-black mb-2", isLight ? "text-black" : "text-white")}>Pure Potential.</h3>
            <p className={cn("text-sm leading-relaxed mb-8", isLight ? "text-black/40" : "text-white/40")}>
              Your favorite events will appear here. Start swiping to fill your social calendar.
            </p>
            <button 
              onClick={() => navigate('/explore/eventos')}
              className="px-8 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
            >
              Explore Events
            </button>
          </div>
        )}
      </div>
      
      {/* Promotional Footer */}
      {filtered.length > 0 && (
        <div className="p-4 pt-10">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/client/advertise')}
            className="p-6 rounded-[2.5rem] bg-indigo-600 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">For Businesses</p>
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Promote Your Brand</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
