// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 THE MASTER SWITCH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Change this to 'MAINTENANCE' to hide the site.
// Change this to 'ONLINE' to go live.
export const APP_STATUS: 'ONLINE' | 'MAINTENANCE' = 'MAINTENANCE';

// Secret bypass for you: visit yoursite.com/?preview=swipess
export const OUTAGE_BYPASS_PARAM = 'preview';
export const OUTAGE_BYPASS_VALUE = 'swipess';
export const OUTAGE_BYPASS_KEY = 'swipess_outage_bypass';

/** Returns true if the user has bypass access (URL param or session flag). */
export function hasOutageBypass(): boolean {
  // Check URL param first
  const params = new URLSearchParams(window.location.search);
  if (params.get(OUTAGE_BYPASS_PARAM) === OUTAGE_BYPASS_VALUE) {
    sessionStorage.setItem(OUTAGE_BYPASS_KEY, '1');
    return true;
  }
  // Check session flag
  return sessionStorage.getItem(OUTAGE_BYPASS_KEY) === '1';
}
