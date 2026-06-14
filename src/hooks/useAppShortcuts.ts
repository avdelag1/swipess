import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';

/**
 * App icon shortcuts (long-press home screen icon quick actions).
 * - New Listing, Messages, AI Concierge, Events.
 * Android: uses capacitor-android-shortcuts plugin (dynamic).
 * iOS: static shortcuts best configured in Xcode / Info.plist (or future full plugin).
 * Call once early in app lifecycle (RootProviders).
 */
export async function registerAppShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (Capacitor.getPlatform() === 'android') {
      // Dynamic import so web / iOS build doesn't choke if plugin not present everywhere
      const { AppShortcuts } = await import('capacitor-android-shortcuts');
      
      await AppShortcuts.setShortcuts({
        shortcuts: [
          {
            id: 'new-listing',
            shortLabel: 'New Listing',
            longLabel: 'Create a new listing',
            // icon can be resource or base64; use a simple one or omit for default
          },
          {
            id: 'messages',
            shortLabel: 'Messages',
            longLabel: 'Open your conversations',
          },
          {
            id: 'ai-concierge',
            shortLabel: 'AI Concierge',
            longLabel: 'Talk to the AI assistant',
          },
          {
            id: 'events',
            shortLabel: 'Events',
            longLabel: 'Discover experiences & events',
          },
        ],
      });

      logger.info('[Shortcuts] Android app shortcuts registered');
    } else if (Capacitor.getPlatform() === 'ios') {
      // iOS quick actions are primarily static (Info.plist + AppDelegate) or require a dedicated plugin.
      // For a full dynamic solution on iOS with Cap 7, add a plugin like a community iOS shortcuts one
      // and call similar registration. For now we log so the hook is ready.
      logger.info('[Shortcuts] iOS: register static shortcuts in Xcode project (Info.plist / AppDelegate.swift) for best results. Dynamic JS support limited without extra native code.');
    }
  } catch (e) {
    logger.warn('[Shortcuts] Could not register app shortcuts (plugin may need cap sync or platform specific setup)', e);
  }
}
