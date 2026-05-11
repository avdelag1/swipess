import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import { haptics } from '@/utils/microPolish';
import { Capacitor } from '@capacitor/core';

export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('swipess_biometric_enabled') === 'true';
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsLocked(false);
      return;
    }

    setIsVerifying(true);
    haptics.impact('medium');

    try {
      // Logic for Native Biometric Bridge
      const bridge = (window as any).WebToNative;
      if (bridge?.authenticate) {
        const result = await bridge.authenticate({
          reason: 'Authenticate to access Swipess',
          title: 'Secure Access'
        });
        if (result.success) {
          haptics.notification('success');
          setIsLocked(false);
        }
      } else {
        // Fallback for development/web
        setTimeout(() => setIsLocked(false), 1000);
      }
    } catch (err) {
      console.error('[BiometricGate] Auth failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (isLocked) {
      verify();
    }
  }, [isLocked]);

  if (!isLocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
          <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Secure Vault</h2>
          <p className="text-sm text-white/40 font-bold max-w-[200px]">Authentication required to access your premium dashboard.</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={verify}
          disabled={isVerifying}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-2xl"
        >
          {isVerifying ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              Try Again
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};
