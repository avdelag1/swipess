import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe } from '@/hooks/useSwipe';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from 'sonner';

interface SaveButtonProps {
  targetId: string;
  targetType: 'listing' | 'profile';
  className?: string;
  variant?: 'circular' | 'ghost' | 'mini';
}

export function SaveButton({ targetId, targetType, className, variant = 'circular' }: SaveButtonProps) {
  const { user } = useAuth();
  const swipeMutation = useSwipe();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial state
  useEffect(() => {
    async function checkSavedStatus() {
      if (!user?.id || !targetId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('id, direction')
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .eq('target_type', targetType)
          .maybeSingle();

        if (error) throw error;
        setIsSaved(data?.direction === 'right');
      } catch (err) {
        console.error('[SaveButton] Error checking status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkSavedStatus();
  }, [user?.id, targetId, targetType]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user?.id) {
      toast.error('Please sign in to save items');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);
    triggerHaptic(nextState ? 'medium' : 'light');

    try {
      if (nextState) {
        // Like (direction: 'right')
        await swipeMutation.mutateAsync({
          targetId,
          targetType,
          direction: 'right'
        });
        toast.success(`Saved to your favorites!`, {
            icon: <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />,
            duration: 2000
        });
      } else {
        // Dislike/Unsave (direction: 'left')
        // Note: For "Unsaving", we actually just want to delete the record, 
        // but useSwipe logic upserts. Let's manually delete for "unsave" to keep it clean.
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .eq('target_type', targetType);
          
        if (error) throw error;
        toast.info('Removed from favorites');
      }
    } catch (_err) {
      // Rollback UI
      setIsSaved(!nextState);
      toast.error('Could not update favorite');
    }
  };

  if (isLoading && variant !== 'mini') return <div className={cn("w-10 h-10 rounded-full bg-muted animate-pulse", className)} />;

  if (variant === 'mini') {
    return (
      <button
        onClick={toggleSave}
        title={isSaved ? "Remove from favorites" : "Save to favorites"}
        aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
        className={cn(
          "transition-all active:scale-90",
          isSaved ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
          className
        )}
      >
        <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        onClick={toggleSave}
        title={isSaved ? "Remove from favorites" : "Save to favorites"}
        aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 border border-transparent",
          isSaved 
            ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
            : "hover:bg-muted text-muted-foreground",
          className
        )}
      >
        <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
        <span className="text-xs font-black uppercase tracking-widest">
            {isSaved ? 'Saved' : 'Save'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleSave}
      title={isSaved ? "Remove from favorites" : "Save to favorites"}
      aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "relative w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg border backdrop-blur-md overflow-hidden",
        isSaved 
          ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-rose-500/20" 
          : "bg-white/10 dark:bg-black/20 border-white/20 text-white/70 hover:text-white",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
           key={isSaved ? 'saved' : 'unsaved'}
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0.5, opacity: 0 }}
           transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        >
          <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
        </motion.div>
      </AnimatePresence>
      
      {/* Particle effect on save */}
      {isSaved && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          className="absolute inset-0 rounded-full bg-rose-500/40 pointer-events-none"
        />
      )}
    </button>
  );
}

