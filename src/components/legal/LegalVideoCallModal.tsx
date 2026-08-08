import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, PhoneOff, Scale, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/utils/haptics';
import { appToast } from '@/utils/appNotification';
import {
  LegalVideoCall,
  legalVideoRoomUrl,
  startLegalVideoCall,
  updateLegalVideoCallStatus,
} from '@/lib/legalVideoCalls';

const RING_TIMEOUT_MS = 60_000;

type Phase = 'idle' | 'connecting' | 'ringing' | 'live' | 'ended';

export function LegalVideoCallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [call, setCall] = useState<LegalVideoCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const displayName = useMemo(() => {
    return (
      (user?.user_metadata as any)?.full_name ||
      (user?.user_metadata as any)?.name ||
      user?.email?.split('@')[0] ||
      'Client'
    );
  }, [user]);

  // Start call when opened
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setPhase('idle');
      setCall(null);
      setError(null);
      return;
    }
    if (!user?.id || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      setPhase('connecting');
      setError(null);
      try {
        const created = await startLegalVideoCall({
          clientUserId: user.id,
          clientName: displayName,
          clientEmail: user.email,
          topic: 'Legal video consultation',
        });
        if (cancelled) {
          await updateLegalVideoCallStatus(created.id, 'cancelled').catch(() => {});
          return;
        }
        setCall(created);
        setPhase('ringing');
        triggerHaptic('success');
      } catch (e: any) {
        if (cancelled) return;
        const msg =
          e?.message === 'NO_LAWYERS_AVAILABLE'
            ? 'No lawyers are available right now. Ask them to turn on Available in the Legal Portal, then try again.'
            : e?.message || 'Could not start the video call.';
        setError(msg);
        setPhase('ended');
        appToast.warning('Video call', msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, user?.email, displayName]);

  // Subscribe to call status + ring timeout
  useEffect(() => {
    if (!call?.id || phase === 'ended') return;

    const channel = supabase
      .channel(`legal-video-call-client-${call.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'legal_video_calls',
          filter: `id=eq.${call.id}`,
        },
        (payload) => {
          const next = payload.new as LegalVideoCall;
          setCall(next);
          if (next.status === 'accepted') {
            setPhase('live');
            triggerHaptic('success');
            appToast.success('Lawyer connected', 'Your video consultation is starting.');
          } else if (['ended', 'declined', 'missed', 'cancelled'].includes(next.status)) {
            setPhase('ended');
          }
        },
      )
      .subscribe();

    const timer = window.setTimeout(async () => {
      setCall((current) => {
        if (current?.status === 'ringing') {
          updateLegalVideoCallStatus(current.id, 'missed').catch(() => {});
          setPhase('ended');
          setError('No lawyer picked up. Try again when someone is available.');
          appToast.info('Missed call', 'No lawyer answered in time.');
        }
        return current;
      });
    }, RING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [call?.id, phase]);

  const hangUp = async () => {
    triggerHaptic('light');
    if (call?.id && (call.status === 'ringing' || call.status === 'accepted')) {
      const next = call.status === 'ringing' ? 'cancelled' : 'ended';
      await updateLegalVideoCallStatus(call.id, next).catch(() => {});
    }
    setPhase('ended');
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[12000] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={cn(
            'relative w-full sm:max-w-3xl h-[92dvh] sm:h-[85vh] overflow-hidden flex flex-col',
            'rounded-t-[2rem] sm:rounded-[2rem] border shadow-2xl',
            isLight ? 'bg-white border-black/10' : 'bg-neutral-950 border-white/10',
          )}
        >
          <div className={cn(
            'flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0',
            isLight ? 'border-black/5' : 'border-white/10',
          )}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
                {phase === 'live' ? <Video className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-black uppercase italic tracking-tight truncate', isLight ? 'text-black' : 'text-white')}>
                  {phase === 'live' ? 'Live with lawyer' : 'Legal video call'}
                </p>
                <p className={cn('text-[11px] font-semibold opacity-50 truncate', isLight ? 'text-black' : 'text-white')}>
                  {phase === 'connecting' && 'Connecting…'}
                  {phase === 'ringing' && 'Ringing available lawyers…'}
                  {phase === 'live' && 'Secure consultation room'}
                  {phase === 'ended' && (error || 'Call ended')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={hangUp}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white',
              )}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative min-h-0 bg-black">
            {phase === 'live' && call ? (
              <iframe
                title="Legal video consultation"
                src={legalVideoRoomUrl(call.room_id, displayName)}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                {(phase === 'connecting' || phase === 'ringing') && (
                  <>
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-300 animate-spin" />
                      </div>
                      {phase === 'ringing' && (
                        <span className="absolute inset-0 rounded-full border-2 border-indigo-400/40 animate-ping" />
                      )}
                    </div>
                    <p className="text-white font-black uppercase italic tracking-tight text-xl">
                      {phase === 'connecting' ? 'Starting call' : 'Calling lawyers'}
                    </p>
                    <p className="text-white/55 text-sm max-w-sm font-medium">
                      Available lawyers on the Legal Portal get a live ring. Stay on this screen until someone accepts.
                    </p>
                  </>
                )}
                {phase === 'ended' && (
                  <>
                    <PhoneOff className="w-12 h-12 text-white/50" />
                    <p className="text-white font-black uppercase italic tracking-tight text-xl">Call ended</p>
                    <p className="text-white/55 text-sm max-w-sm font-medium">{error || 'You can start a new video call anytime.'}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={cn(
            'shrink-0 p-4 border-t flex items-center justify-center',
            isLight ? 'border-black/5 bg-white' : 'border-white/10 bg-neutral-950',
          )}>
            <button
              type="button"
              onClick={hangUp}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-500 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-500/30 active:scale-95 transition"
            >
              <PhoneOff className="w-4 h-4" />
              {phase === 'live' ? 'End call' : 'Cancel'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
