/** Vertical Reels-style events feed — same page for nav bar + dashboard quick filter. */
export const EVENTS_FEED_PATH = '/explore/events';

/** Open the main Events feed already positioned on a specific event (never Insights). */
export function eventsFeedPathFor(eventId: string): string {
  const id = (eventId || '').trim();
  if (!id) return EVENTS_FEED_PATH;
  return `${EVENTS_FEED_PATH}?eventId=${encodeURIComponent(id)}`;
}
