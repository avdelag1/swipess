import { useState, useCallback } from 'react';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic } from '@/utils/haptics';

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);

  const checkSupport = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsSupported(false);
      return false;
    }
    
    try {
      const result = await NativeBiometric.isAvailable();
      setIsSupported(result.isAvailable);
      setBiometryType(result.biometryType || null);
      return result.isAvailable;
    } catch (e) {
      console.log('Biometrics not available:', e);
      setIsSupported(false);
      return false;
    }
  }, []);

  const authenticate = useCallback(async (reason: string = 'Please authenticate to proceed') => {
    if (!Capacitor.isNativePlatform()) return true; // Bypass on web
    
    triggerHaptic('medium');
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Authentication Required',
        subtitle: 'Verify your identity',
        description: reason,
      });
      triggerHaptic('success');
      return true;
    } catch (error) {
      console.log('Authentication failed:', error);
      triggerHaptic('error');
      return false;
    }
  }, []);

  return {
    checkSupport,
    authenticate,
    isSupported,
    biometryType,
    isFaceId: biometryType === BiometryType.FACE_ID,
    isTouchId: biometryType === BiometryType.TOUCH_ID || biometryType === BiometryType.FINGERPRINT,
  };
}
