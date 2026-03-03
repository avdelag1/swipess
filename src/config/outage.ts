// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP OUTAGE CONFIG
// Toggle IS_OUTAGE_ACTIVE to enable/disable the outage screen.
// Bypass: visit /?preview=swipess or tap the logo 7× on the outage screen.
// The bypass is stored in sessionStorage and lasts until the tab is closed.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const IS_OUTAGE_ACTIVE = true;

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
