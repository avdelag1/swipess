import { logger } from '@/utils/prodLogger';
import type { PassportAction } from '@/utils/passportLocation';

export function formatConvoDate(date: Date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const NAV_PATTERN = /\[NAV:(\/[^\]]+)\]/g;

export const NAV_LABELS: Record<string, string> = {
  '/client/filters': 'Open Filters',
  '/radio': 'Open Radio',
  '/client/profile': 'My Profile',
  '/client/settings': 'Settings',
  '/subscription/packages': 'View Packages',
  '/client/liked': 'Liked Listings',
  '/owner/listings': 'My Listings',
  '/owner/properties': 'My Listings',
  '/legal': 'Legal Section',
  '/explore/events': 'Browse Events',
  '/client/dashboard': 'Swipe Deck',
  '/owner/dashboard': 'Owner Deck',
};

export const PASSPORT_PATTERN = /\[PASSPORT:(\{[\s\S]*?\})\]/g;

export function parseNavActions(content: string): {
  cleanContent: string;
  navPaths: string[];
  draftActions: { category: string; data: any }[];
  filterAction: any | null;
  passportAction: PassportAction | null;
  listings: any[];
  profiles: any[];
} {
  const navPaths: string[] = [];
  const draftActions: { category: string; data: any }[] = [];
  let filterAction = null;
  let passportAction: PassportAction | null = null;
  let listings: any[] = [];
  let profiles: any[] = [];

  let cleanContent = content.replace(NAV_PATTERN, (_, path) => {
    navPaths.push(path);
    return '';
  });

  const DRAFT_PATTERN = /\[DRAFT:([^:]+):(\{[\s\S]*?\})\]/g;
  cleanContent = cleanContent.replace(DRAFT_PATTERN, (_, category, jsonData) => {
    try {
      draftActions.push({ category, data: JSON.parse(jsonData) });
    } catch (e) {
      logger.error('Failed to parse draft JSON:', e);
    }
    return '';
  });

  const FILTER_PATTERN = /\[FILTER:(\{[\s\S]*?\})\]/g;
  cleanContent = cleanContent.replace(FILTER_PATTERN, (_, jsonData) => {
    try {
      filterAction = JSON.parse(jsonData);
    } catch (e) {
      logger.error('Failed to parse filter JSON:', e);
    }
    return '';
  });

  cleanContent = cleanContent.replace(PASSPORT_PATTERN, (_, jsonData) => {
    try {
      passportAction = JSON.parse(jsonData);
    } catch (e) {
      logger.error('Failed to parse passport JSON:', e);
    }
    return '';
  });

  const LISTINGS_PATTERN = /\[LISTINGS:(\[[\s\S]*?\])\]/g;
  cleanContent = cleanContent.replace(LISTINGS_PATTERN, (_, jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) listings = parsed;
    } catch (e) {
      logger.error('Failed to parse listings JSON:', e);
    }
    return '';
  });

  const PROFILES_PATTERN = /\[PROFILES:(\[[\s\S]*?\])\]/g;
  cleanContent = cleanContent.replace(PROFILES_PATTERN, (_, jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) profiles = parsed;
    } catch (e) {
      logger.error('Failed to parse profiles JSON:', e);
    }
    return '';
  });

  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanContent, navPaths, draftActions, filterAction, passportAction, listings, profiles };
}
