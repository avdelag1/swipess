/**
 * IN-APP REVIEW PROMPT — Smart timing review request
 * 
 * Shows a native-styled review prompt at optimal moments.
 * Follows Apple guidelines: don't show on first launch, don't show after
 * user actions, show after successful task completion.
 */

const REVIEW_STORAGE_KEY = 'swipess_review_state';
const MIN_SESSIONS = 5;           // Minimum app sessions before showing
const MIN_DAYS = 3;               // Minimum days since install
const MIN_ACTIONS = 10;           // Minimum positive actions (swipes, messages)
const COOLDOWN_DAYS = 90;         // Don't show again for 90 days after dismissal
const MAX_PROMPTS = 3;            // Maximum total prompts ever

interface ReviewState {
  sessionCount: number;
  firstSeenAt: number;       // timestamp
  positiveActions: number;
  lastPromptAt: number | null;
  promptCount: number;
  hasRated: boolean;
}

function getReviewState(): ReviewState {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  return {
    sessionCount: 0,
    firstSeenAt: Date.now(),
    positiveActions: 0,
    lastPromptAt: null,
    promptCount: 0,
    hasRated: false,
  };
}

function saveReviewState(state: ReviewState) {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Track a new app session. Call on app mount.
 */
export function trackReviewSession() {
  const state = getReviewState();
  state.sessionCount++;
  saveReviewState(state);
}

/**
 * Track a positive user action (swipe right, send message, etc.)
 */
export function trackPositiveAction() {
  const state = getReviewState();
  state.positiveActions++;
  saveReviewState(state);
}

/**
 * Mark that the user has rated the app (stop showing prompts)
 */
export function markAsRated() {
  const state = getReviewState();
  state.hasRated = true;
  saveReviewState(state);
}

/**
 * Mark that the prompt was shown (for cooldown tracking)
 */
export function markPromptShown() {
  const state = getReviewState();
  state.promptCount++;
  state.lastPromptAt = Date.now();
  saveReviewState(state);
}

/**
 * Check if we should show the review prompt.
 * Returns true only when ALL conditions are met.
 */
export function shouldShowReviewPrompt(): boolean {
  const state = getReviewState();

  // Never show if user already rated
  if (state.hasRated) return false;

  // Max prompts reached
  if (state.promptCount >= MAX_PROMPTS) return false;

  // Not enough sessions
  if (state.sessionCount < MIN_SESSIONS) return false;

  // Not enough positive actions
  if (state.positiveActions < MIN_ACTIONS) return false;

  // Too soon since install
  const daysSinceInstall = (Date.now() - state.firstSeenAt) / (1000 * 60 * 60 * 24);
  if (daysSinceInstall < MIN_DAYS) return false;

  // Cooldown period after last prompt
  if (state.lastPromptAt) {
    const daysSinceLastPrompt = (Date.now() - state.lastPromptAt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPrompt < COOLDOWN_DAYS) return false;
  }

  return true;
}
