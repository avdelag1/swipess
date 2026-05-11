import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export interface NativeState {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
}

export const useNativeBridge = () => {
  const [nativeState, setNativeState] = useState<NativeState>({
    isNative: Capacitor.isNativePlatform(),
    platform: (Capacitor.getPlatform() as 'ios' | 'android' | 'web') || 'web',
    appVersion: '1.0.0',
  });

  useEffect(() => {
    if (nativeState.isNative) {
      App.getInfo().then(info => {
        setNativeState(prev => ({ ...prev, appVersion: info.version }));
      });
    }
  }, [nativeState.isNative]);

  return nativeState;
};
