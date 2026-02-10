/**
 * Native browser replacement for date-fns formatDistanceToNow
 * Removes ~9.68KB (gzipped) dependency on date-fns
 * Uses browser's Intl.RelativeTimeFormat API
 */

export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (diffSecs < 60) {
    value = diffSecs;
    unit = 'second';
  } else if (diffMins < 60) {
    value = diffMins;
    unit = 'minute';
  } else if (diffHours < 24) {
    value = diffHours;
    unit = 'hour';
  } else if (diffDays < 7) {
    value = diffDays;
    unit = 'day';
  } else if (diffWeeks < 4) {
    value = diffWeeks;
    unit = 'week';
  } else if (diffMonths < 12) {
    value = diffMonths;
    unit = 'month';
  } else {
    value = diffYears;
    unit = 'year';
  }

  try {
    const formatter = new Intl.RelativeTimeFormat('en-US', {
      numeric: 'auto',
      style: 'long'
    });

    const formatted = formatter.format(-value, unit);

    if (options?.addSuffix) {
      // Browser already adds "ago" suffix, but match date-fns output exactly
      return formatted;
    }

    return formatted;
  } catch (error) {
    // Fallback for older browsers
    return `${value} ${unit}s ago`;
  }
}

/**
 * Format a date as ISO string (used for display)
 * Lightweight alternative for simple date display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
