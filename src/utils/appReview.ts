import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { logger } from './prodLogger';

/**
 * Native in-app App Store / Play Store review prompt. No-op on web. The OS
 * heavily rate-limits this (iOS shows it at most a few times a year and may
 * silently ignore it), so it's safe to call at positive moments.
 */
export async function requestAppReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await InAppReview.requestReview();
  } catch (e) {
    logger.error('[InAppReview] error:', e);
  }
}

const REVIEW_STATE_KEY = 'swipess_review_state';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

interface ReviewState {
  matches: number;
  lastAsked: number;
}

/**
 * Ask for a review at a genuinely happy moment — a mutual match — but only once
 * the user has felt the value (2nd match) and at most once every 90 days on our
 * side (the OS throttles further). Counting happens on every call.
 */
export async function maybeRequestReviewAfterMatch(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const raw = localStorage.getItem(REVIEW_STATE_KEY);
    const state: ReviewState = raw ? JSON.parse(raw) : { matches: 0, lastAsked: 0 };
    state.matches = (state.matches || 0) + 1;

    const now = Date.now();
    const shouldAsk = state.matches >= 2 && now - (state.lastAsked || 0) > NINETY_DAYS_MS;
    if (shouldAsk) {
      state.lastAsked = now;
      await requestAppReview();
    }
    localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    logger.error('[InAppReview] gate error:', e);
  }
}
