import React, { useEffect, useState } from 'react';
import { LegendaryOnboarding } from './LegendaryOnboarding';
import { BiometricGate } from './BiometricGate';
import { useNativeBridge } from '@/hooks/useNativeBridge';
import { initPrivacyScreen } from '@/utils/privacyScreen';
import { migrateCriticalLocalStorageToPreferences, nativeStore } from '@/lib/nativeStore';

export const NativeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isNative } = useNativeBridge();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isNative) {
      // Privacy screen util (screenshot block for sensitive flows)
      void initPrivacyScreen();

      // Migrate critical keys once (onboarding, biometric flags, etc.) then read from reliable store
      void migrateCriticalLocalStorageToPreferences([
        'swipess_onboarding_seen',
        'biometric_enabled',
        'biometric_setup_complete',
        // add other session / flag keys as needed
      ]);

      // Only show onboarding on native platforms if not seen before (now via nativeStore)
      (async () => {
        const hasSeen = (await nativeStore.get('swipess_onboarding_seen')) === 'true';
        if (!hasSeen) {
          setShowOnboarding(true);
        }
      })();
    }
  }, [isNative]);

  const finishOnboarding = () => {
    void nativeStore.set('swipess_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding ? (
        <LegendaryOnboarding onFinish={finishOnboarding} />
      ) : (
        <BiometricGate>
          {children}
        </BiometricGate>
      )}
    </>
  );
};
