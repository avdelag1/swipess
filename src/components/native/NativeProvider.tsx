import React, { useState, useEffect } from 'react';
import { LegendaryOnboarding } from './LegendaryOnboarding';
import { BiometricGate } from './BiometricGate';
import { useNativeBridge } from '@/hooks/useNativeBridge';

export const NativeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isNative } = useNativeBridge();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding on native platforms if not seen before
    if (isNative) {
      const hasSeen = localStorage.getItem('swipess_onboarding_seen') === 'true';
      if (!hasSeen) {
        setShowOnboarding(true);
      }
    }
  }, [isNative]);

  const finishOnboarding = () => {
    localStorage.setItem('swipess_onboarding_seen', 'true');
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
