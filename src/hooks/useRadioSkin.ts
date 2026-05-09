import { useEffect, useState, useCallback } from 'react';

export type RadioSkin = 'cheetah' | 'theme';

const STORAGE_KEY = 'swipess.radio.skin';
const EVENT = 'swipess-radio-skin-change';

function readInitial(): RadioSkin {
  if (typeof window === 'undefined') return 'cheetah';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'theme' ? 'theme' : 'cheetah';
}

export function useRadioSkin() {
  const [skin, setSkinState] = useState<RadioSkin>(readInitial);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<RadioSkin>).detail;
      if (detail === 'cheetah' || detail === 'theme') setSkinState(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setSkin = useCallback((next: RadioSkin) => {
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    setSkinState(next);
  }, []);

  const toggle = useCallback(() => {
    setSkin(skin === 'cheetah' ? 'theme' : 'cheetah');
  }, [skin, setSkin]);

  return { skin, setSkin, toggle };
}
