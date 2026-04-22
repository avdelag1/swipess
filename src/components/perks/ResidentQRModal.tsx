import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ResidentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResidentQRModal({ isOpen, onClose }: ResidentQRModalProps) {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(60);
  const [qrKey, setQrKey] = useState(0);
  const [redeemed, setRedeemed] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(60);
    setRedeemed(false);
    setQrKey(k => k + 1);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setQrKey(k => k + 1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Realtime listener for scan confirmation
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const channel = supabase
      .channel('qr-scan-confirm')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'discount_redemptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        setRedeemed(true);
        setTimeout(() => {
          setRedeemed(false);
        }, 4000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user?.id]);

  const qrValue = user?.id ? `Swipess-resident:${user.id}:${qrKey}` : '';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-[90vw] max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={16} className="text-muted-foreground" />
          </button>

          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Shield size={12} /> Resident Card
            </div>
            <h2 className="text-lg font-bold text-foreground">My QR Code</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Show this to any partner business</p>
          </div>

          <AnimatePresence mode="wait">
            {redeemed ? (
              <motion.div
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <CheckCircle2 size={64} className="text-emerald-500" />
                </motion.div>
                <p className="text-lg font-bold text-foreground mt-3">Discount Applied!</p>
                <p className="text-xs text-muted-foreground mt-1">Your savings have been recorded 🎉</p>
              </motion.div>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl shadow-inner">
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                {/* Countdown */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle
                        cx="20" cy="20" r="17" fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${(countdown / 60) * 106.8} 106.8`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      {countdown}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-refreshes for security</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


