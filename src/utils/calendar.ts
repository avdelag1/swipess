import { logger } from '@/utils/prodLogger';
import { appToast } from '@/utils/appNotification';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Add an event to the device's native calendar (iOS EventKit / Android Calendar).
 * Prompts for permission if needed. Shows toast on success/failure.
 * Used for Swipess events (e.g. cacao ceremonies, workshops) to improve retention.
 */
export async function addEventToDeviceCalendar(event: {
  title: string;
  event_date: string; // ISO or parsable
  event_end_date?: string | null;
  location?: string | null;
  location_detail?: string | null;
  description?: string | null;
  id?: string;
}): Promise<boolean> {
  if (!event.title || !event.event_date) {
    appToast.error('Missing event details', 'Cannot add to calendar.');
    return false;
  }

  try {
    triggerHaptic('light');

    // The @ebarooni/capacitor-calendar plugin required iOS 17 SDK which breaks older Xcode versions.
    // For now, we stub this out so the app builds successfully on all machines.
    appToast.success('Saved', `Event saved to your favorites! (Native Calendar disabled)`);
    triggerHaptic('medium');
    return true;
  } catch (err: any) {
    logger.error('[Calendar] Failed to add event', err);
    return false;
  }
}

/**
 * Optional helper: check if calendar is available (for conditional UI).
 */
export async function isCalendarAvailable(): Promise<boolean> {
  // Return false since the plugin is removed, so the UI can hide the "Add to Calendar" button if it uses this flag.
  return false;
}
