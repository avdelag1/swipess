import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

export function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isLight } = useAppTheme();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Error', { description: 'You must be logged in to delete your account.' });
        return;
      }

      const { data: _data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success('Account Deleted', { description: 'Your account has been permanently deleted.' });

      if (signOut) {
        await signOut();
      } else {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
      }
    } catch (error: unknown) {
      logger.error('Delete account error:', error);
      toast.error('Error', { description: error instanceof Error ? error.message : 'Failed to delete account. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "space-y-8 p-8 rounded-[2.5rem] backdrop-blur-3xl transition-all duration-700",
      isLight ? "bg-white/40" : "bg-black/40"
    )}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-destructive italic">Account Termination</span>
        </div>
        <h2 className={cn("text-3xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Delete Swipess Identity</h2>
        <p className="text-sm font-medium opacity-40 leading-relaxed">
          Deleting your account is permanent. All property data, matches, and configurations will be scrubbed from our ecosystem.
        </p>
      </div>

      {!showConfirm ? (
        <Button
          variant="destructive"
          onClick={() => setShowConfirm(true)}
          className="w-full h-16 rounded-[1.8rem] text-[15px] font-black uppercase tracking-widest italic shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Initiate Deletion
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20">
            <p className="text-[11px] font-bold uppercase tracking-widest text-destructive leading-normal">
              Final confirmation required. This action cannot be undone. Type 'DELETE' to proceed.
            </p>
          </div>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="TYPE DELETE"
            className="h-16 rounded-[1.2rem] bg-white/5 border-white/10 text-center font-black uppercase tracking-[0.3em] placeholder:opacity-20"
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="h-14 rounded-[1.2rem] font-bold uppercase tracking-widest opacity-60"
            >
              Abord
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE' || isDeleting}
              onClick={handleDelete}
              className="h-14 rounded-[1.2rem] font-black uppercase tracking-widest italic shadow-xl"
            >
              {isDeleting ? 'Scrubbing...' : 'Scrub Account'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
