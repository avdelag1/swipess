import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';

/**
 * Privacy / Screenshot protection utility.
 * Blocks screen recordings + screenshots on sensitive flows (VAP ID, document vault, etc.)
 * Only active on native. Uses @capacitor-community/privacy-screen.
 * Call enable() when entering a protected screen, disable() on exit.
 */
const isNative = () => Capacitor.isNativePlatform();

let isEnabled = false;

export async function enablePrivacyScreen(reason = 'sensitive-screen'): Promise<void> {
  if (!isNative() || isEnabled) return;
  try {
    await PrivacyScreen.enable();
    isEnabled = true;
    logger.info(`[Privacy] Screenshot protection enabled (${reason})`);
  } catch (e) {
    logger.warn('[Privacy] enable failed (plugin may require Cap 8 or permissions)', e);
  }
}

export async function disablePrivacyScreen(reason = 'exit-sensitive'): Promise<void> {
  if (!isNative() || !isEnabled) return;
  try {
    await PrivacyScreen.disable();
    isEnabled = false;
    logger.info(`[Privacy] Screenshot protection disabled (${reason})`);
  } catch (e) {
    logger.warn('[Privacy] disable failed', e);
  }
}

/**
 * Optional: auto-enable on app background if any sensitive state is active.
 * For now we call explicitly from the components.
 */
export async function initPrivacyScreen(): Promise<void> {
  // Can be called from NativeProvider on mount
  // No global enable by default — targeted protection is better UX
  logger.info('[Privacy] Privacy screen util ready (targeted mode)');
}
