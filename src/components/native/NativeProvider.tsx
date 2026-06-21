import React, { useEffect, useState } from 'react';
import { LegendaryOnboarding } from './LegendaryOnboarding';
import { BiometricGate } from './BiometricGate';
import { useNativeBridge } from '@/hooks/useNativeBridge';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import useAppTheme from '@/hooks/useAppTheme';
import { useNavigate } from 'react-router-dom';

export const NativeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isNative } = useNativeBridge();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isLight, _theme } = useAppTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Only show onboarding on native platforms if not seen before
    if (isNative) {
      const hasSeen = localStorage.getItem('swipess_onboarding_seen') === 'true';
      if (!hasSeen) {
        setShowOnboarding(true);
      }
    }
  }, [isNative]);

  // Setup Global Native Hardware Constraints
  useEffect(() => {
    if (!isNative) return;

    // 1. Hardware Back Button (Android)
    const backSub = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        App.exitApp();
      }
    });

    // 2. Keyboard Adjustments (Prevent pushing UI off screen improperly)
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
    Keyboard.setScroll({ isDisabled: false }).catch(() => {});

    return () => {
      backSub.then(sub => sub.remove());
    };
  }, [isNative, navigate]);

  // Sync Status Bar to Theme
  useEffect(() => {
    if (!isNative) return;
    const updateStatusBar = async () => {
      try {
        if (_theme === 'cheers') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a100c' });
        } else if (isLight) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        } else {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
        }
      } catch (e) {
        // Plugin might not be available
      }
    };
    updateStatusBar();
  }, [isNative, isLight, _theme]);

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
