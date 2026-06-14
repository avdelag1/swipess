import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
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

    // Request/create the calendar event via native plugin
    // The plugin will handle permission prompt + native UI on iOS/Android.
    await CapacitorCalendar.createEvent({
      title: event.title,
      startDate: new Date(event.event_date).getTime(),
      endDate: event.event_end_date 
        ? new Date(event.event_end_date).getTime() 
        : new Date(new Date(event.event_date).getTime() + 2 * 60 * 60 * 1000).getTime(), // default 2h
      location: event.location_detail || event.location || undefined,
      notes: event.description 
        ? `${event.description}\n\nAdded from Swipess — https://swipess.com`
        : 'Added from Swipess — https://swipess.com',
      // Optional: allDay false, etc. Plugin supports more fields.
    });

    appToast.success('Added to Calendar', `${event.title} is now in your native calendar.`);
    triggerHaptic('medium');
    return true;
  } catch (err: any) {
    logger.error('[Calendar] Failed to add event', err);

    // Common errors: permission denied, calendar not available, plugin init issue
    if (err?.message?.includes('permission') || err?.message?.includes('denied')) {
      appToast.error('Calendar Permission Needed', 'Please allow calendar access in Settings to add events.');
    } else {
      appToast.error('Could not add to calendar', 'Try again or add manually.');
    }
    return false;
  }
}

/**
 * Optional helper: check if calendar is available (for conditional UI).
 */
export async function isCalendarAvailable(): Promise<boolean> {
  try {
    // The plugin doesn't export a direct "isAvailable", but create will fail gracefully.
    // For now we always offer the button on native; web no-op is fine.
    return true; // plugin handles gracefully
  } catch {
    return false;
  }
}
