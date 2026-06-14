import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/prodLogger';
import { motion } from 'framer-motion';
import { Fingerprint, Lock } from 'lucide-react';
import { haptics } from '@/utils/microPolish';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { nativeStore } from '@/lib/nativeStore';

export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const [isLocked, setIsLocked] = useState(false);

  // Async read from reliable native prefs (with localStorage fallback during migration)
  useEffect(() => {
    (async () => {
      const enabled = (await nativeStore.get('swipess_biometric_enabled')) === 'true';
      setIsLocked(enabled);
    })();
  }, []);
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsLocked(false);
      return;
    }

    setIsVerifying(true);
    haptics.impact('medium');

    try {
      // Real biometric auth: Face ID / Touch ID / fingerprint, with the device
      // passcode allowed as a fallback.
      const { isAvailable, deviceIsSecure } = await BiometricAuth.checkBiometry();

      // No biometry AND no passcode set — there's nothing to authenticate
      // against, so don't trap the user out of their own account.
      if (!isAvailable && !deviceIsSecure) {
        setIsLocked(false);
        return;
      }

      await BiometricAuth.authenticate({
        reason: 'Authenticate to access Swipess',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Secure Access',
        androidSubtitle: 'Unlock your Swipess vault',
        androidConfirmationRequired: false,
      });

      haptics.notification('success');
      setIsLocked(false);
    } catch (err) {
      // Cancelled or failed — stay locked; the user can tap "Try Again".
      logger.error('[BiometricGate] Auth failed:', err);
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
