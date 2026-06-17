/**
 * Hierarchical ("up") navigation map.
 *
 * The back button and Android hardware back should walk UP the app hierarchy,
 * not blindly through history — so a user deep inside a section gets:
 *
 *   sub-page  →  section home  →  dashboard  →  (exit)
 *
 * instead of having to tap back several times through every screen they passed
 * through. Re-tapping a bottom-nav button does the same: it returns to that
 * section's home page (and resets any in-page sub-views via a reset event).
 *
 * Everything falls back safely to the dashboard, so an unmapped route can never
 * trap the user.
 */

export const DASHBOARD_ROOT = '/client/dashboard';

// Top-level screens the user lands on after leaving the dashboard. Order does
// not matter — lookup picks the LONGEST matching prefix so '/radio/directory'
// resolves to the '/radio' section, '/explore/events/:id' to '/explore/events',
// etc.
const SECTION_ROOTS: string[] = [
  '/client/dashboard',
  '/owner/dashboard',
  '/client/liked-properties',
  '/client/who-liked-you',
  '/client/saved-searches',
  '/client/services',
  '/client/legal-services',
  '/client/legal',
  '/client/contracts',
  '/client/settings',
  '/client/security',
  '/client/profile',
  '/client/filters',
  '/client/perks',
  '/client/advertise',
  '/owner/properties',
  '/owner/settings',
  '/owner/contracts',
  '/messages',
  '/notifications',
  '/radio',
  '/subscription/packages',
  '/documents',
  '/escrow',
  '/explore/events',
  '/explore/roommates',
  '/explore/prices',
  '/explore/tours',
  '/explore/intel',
];

const DASHBOARD_ROOTS = new Set(['/client/dashboard', '/owner/dashboard', '/']);

function normalize(pathname: string): string {
  if (!pathname) return '/';
  // Drop a trailing slash (except for the bare root) so '/radio/' === '/radio'.
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * The section root that a path belongs to, or null if the path is not under any
 * known section. Picks the most specific (longest) matching root.
 */
export function getSectionRoot(pathname: string): string | null {
  const path = normalize(pathname);
  let best: string | null = null;
  for (const root of SECTION_ROOTS) {
    if (path === root || path.startsWith(root + '/')) {
      if (!best || root.length > best.length) best = root;
    }
  }
  return best;
}

/**
 * The route to navigate to when going "up" one level from `pathname`.
 *   • dashboard / root            → null  (caller decides: exit the app, or stay)
 *   • a section's own home page   → the dashboard
 *   • a page inside a section     → that section's home page
 *   • anything unmapped           → the dashboard (safe fallback)
 */
export function getParentRoute(pathname: string): string | null {
  const path = normalize(pathname);

  if (DASHBOARD_ROOTS.has(path)) return null;

  const section = getSectionRoot(path);
  if (!section) return DASHBOARD_ROOT;

  // On the section's own home page → up to the dashboard.
  if (path === section) {
    return DASHBOARD_ROOTS.has(section) ? null : DASHBOARD_ROOT;
  }

  // Inside the section → up to the section home.
  return section;
}

/** Event a bottom-nav re-tap broadcasts so in-page sub-views (e.g. the Legal
 *  hub's browse/editor/signing screens) reset back to their home view. */
export const SECTION_RESET_EVENT = 'swipess-section-reset';

export function broadcastSectionReset(sectionRoot: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(SECTION_RESET_EVENT, { detail: { sectionRoot } }));
  } catch {
    /* CustomEvent unsupported — navigation still happened */
  }
}
