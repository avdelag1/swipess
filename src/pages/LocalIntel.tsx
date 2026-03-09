import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Zap, Coffee, Shield, Utensils, Building, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: 'All', icon: Newspaper, color: 'text-foreground' },
  infrastructure: { label: 'Infrastructure', icon: Building, color: 'text-blue-400' },
  events: { label: 'Events', icon: Calendar, color: 'text-purple-400' },
  coworking: { label: 'Coworking', icon: Coffee, color: 'text-amber-400' },
  dining: { label: 'Dining', icon: Utensils, color: 'text-green-400' },
  safety: { label: 'Safety', icon: Shield, color: 'text-red-400' },
  general: { label: 'General', icon: Zap, color: 'text-muted-foreground' },
};

export default function LocalIntel() {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('local_intel_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    setPosts((data as IntelPost[]) || []);
    setIsLoading(false);
  };

  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-primary" />
          Local Intel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">What's happening in Tulum right now</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border',
              selectedCategory === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border/50 text-muted-foreground'
            )}
          >
            <config.icon className="w-3 h-3" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Newspaper className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No posts in this category yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, index) => {
            const cat = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;
            const CatIcon = cat.icon;
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="p-4 rounded-2xl bg-card border border-border/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider', cat.color)}>
                        <CatIcon className="w-3 h-3" />
                        {cat.label}
                      </span>
                      {post.neighborhood && (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-accent/50">
                          {post.neighborhood}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">{post.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{post.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                  </span>
                  {post.source_url && (
                    <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                      Source <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
