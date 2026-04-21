import { useState, useEffect, type ComponentType } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Zap, Coffee, Shield, Utensils, Building, Calendar, ExternalLink, ChevronLeft, MapPin, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { logger } from '@/utils/prodLogger';

interface IntelPost {
  id: string;
  title: string;
  content: string;
  category: string;
  neighborhood: string | null;
  image_url: string | null;
  source_url: string | null;
  published_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: ComponentType<{ className?: string }>; color: string; bg: string }> = {
  all: { label: 'Latest', icon: Newspaper, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  infrastructure: { label: 'Urban', icon: Building, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  events: { label: 'Social', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  coworking: { label: 'Work', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  dining: { label: 'Gastro', icon: Utensils, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  safety: { label: 'Safety', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
  general: { label: 'General', icon: Zap, color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

export default function LocalIntel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await supabase
        .from('local_intel_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      setPosts((data as IntelPost[]) || []);
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 pb-28 max-w-2xl mx-auto">
      {/* ── HEADER ── */}
      <div className="mb-8 pt-[var(--safe-top)]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-white" />
            </motion.button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight leading-none uppercase">
                Tulum Intel
              </h1>
              <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mt-1">
                Verified Local Updates
              </p>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Category horizontal scroller */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); setSelectedCategory(key); }}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border',
                selectedCategory === key
                  ? 'bg-primary text-white border-primary shadow-[0_8px_20px_rgba(249,115,22,0.3)]'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40'
              )}
            >
              <config.icon className={cn("w-3.5 h-3.5", selectedCategory === key ? "text-white" : config.color)} />
              {config.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── FEED SECTION ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
          <Newspaper className="w-16 h-16 text-slate-400" strokeWidth={1} />
          <p className="text-[10px] font-black uppercase tracking-widest">No Intelligence Found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, index) => {
              const cat = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;
              const CatIcon = cat.icon;
              return (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                  className="group relative bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-6 shadow-xl shadow-black/5 dark:shadow-none overflow-hidden backdrop-blur-xl"
                >
                  {/* Decorative Gradient */}
                  <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-opacity group-hover:opacity-20", cat.bg)} />

                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-xl", cat.bg)}>
                          <CatIcon className={cn("w-3.5 h-3.5", cat.color)} />
                        </div>
                        <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', cat.color)}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-tighter">
                          {post.neighborhood || 'Tulum'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight italic tracking-tight uppercase">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-white/60 font-medium leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                         </span>
                      </div>
                      {post.source_url && (
                        <motion.a 
                          whileHover={{ x: 3 }}
                          href={post.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
                        >
                          Verify Source <ExternalLink className="w-3 h-3" />
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Intelligence Updates</span>
         </div>
      </div>
    </div>
  );
}


