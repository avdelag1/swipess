import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Native keyboard polish.
 *
 * Exposes the live keyboard height as `--keyboard-height` and toggles a
 * `keyboard-open` class on <html>, so layout can react (e.g. hide the bottom
 * nav, lift a chat input). Also scrolls the focused field into view on open —
 * the app disables Capacitor's native scrollAssist, so we keep the caret
 * visible ourselves. Native-only; no-op on web.
 *
 * Listens to both the `will*` (iOS) and `did*` (Android) events so it works on
 * both platforms; the handlers are idempotent.
 */
export function useNativeKeyboard(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const root = document.documentElement;

    const onShow = (info: { keyboardHeight: number }) => {
      root.style.setProperty('--keyboard-height', `${info?.keyboardHeight ?? 0}px`);
      root.classList.add('keyboard-open');
      const el = document.activeElement as HTMLElement | null;
      if (el && typeof el.scrollIntoView === 'function') {
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      }
    };
    const onHide = () => {
      root.style.setProperty('--keyboard-height', '0px');
      root.classList.remove('keyboard-open');
    };

    const removers: Array<() => void> = [];
    Promise.all([
      Keyboard.addListener('keyboardWillShow', onShow),
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardWillHide', onHide),
      Keyboard.addListener('keyboardDidHide', onHide),
    ])
      .then((subs) => subs.forEach((s) => removers.push(() => s.remove())))
      .catch(() => { /* listeners unavailable — ignore */ });

    return () => {
      removers.forEach((r) => r());
      root.style.setProperty('--keyboard-height', '0px');
      root.classList.remove('keyboard-open');
    };
  }, []);
}
