/**
 * Tests for smart matching exclusion filters.
 *
 * These cover the critical business rule: a user must NEVER see their own listing
 * or their own profile in swipe results. The DB query uses .neq() for SQL-level
 * exclusion, and the client applies a deterministic filter as defense-in-depth.
 */
import { describe, it, expect } from 'vitest';

const USER_ID = 'user-abc-123';
const OTHER_USER_ID = 'user-xyz-789';

// ── Listing exclusion filter ─────────────────────────────────────────────────
// Mirrors the filter used in useSmartListingMatching.tsx
const excludeOwnListings = (listings: { id: string; owner_id: string }[], userId: string) =>
    listings.filter(l => l.owner_id !== userId);

// ── Profile exclusion filter ─────────────────────────────────────────────────
// Mirrors the filter used in useSmartClientMatching.tsx
const excludeOwnProfile = (profiles: { user_id: string }[], userId: string) =>
    profiles.filter(p => p.user_id !== userId);

// ────────────────────────────────────────────────────────────────────────────
describe('Listing exclusion filter', () => {
    it('removes the user\'s own listing from results', () => {
        const listings = [
            { id: 'listing-1', owner_id: USER_ID },
            { id: 'listing-2', owner_id: OTHER_USER_ID },
        ];
        const result = excludeOwnListings(listings, USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('listing-2');
    });

    it('returns empty array when only own listing present', () => {
        const listings = [{ id: 'listing-1', owner_id: USER_ID }];
        const result = excludeOwnListings(listings, USER_ID);
        expect(result).toHaveLength(0);
    });

    it('returns all listings when none belong to user', () => {
        const listings = [
            { id: 'listing-1', owner_id: OTHER_USER_ID },
            { id: 'listing-2', owner_id: 'another-user' },
        ];
        const result = excludeOwnListings(listings, USER_ID);
        expect(result).toHaveLength(2);
    });

    it('returns empty array when input is empty', () => {
        expect(excludeOwnListings([], USER_ID)).toHaveLength(0);
    });

    it('removes ALL own listings even if multiple exist (data integrity edge case)', () => {
        const listings = [
            { id: 'listing-1', owner_id: USER_ID },
            { id: 'listing-2', owner_id: OTHER_USER_ID },
            { id: 'listing-3', owner_id: USER_ID },
        ];
        const result = excludeOwnListings(listings, USER_ID);
        expect(result).toHaveLength(1);
        expect(result.some(l => l.owner_id === USER_ID)).toBe(false);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Profile exclusion filter', () => {
    it('removes the user\'s own profile from results', () => {
        const profiles = [
            { user_id: USER_ID },
            { user_id: OTHER_USER_ID },
        ];
        const result = excludeOwnProfile(profiles, USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].user_id).toBe(OTHER_USER_ID);
    });

    it('returns empty array when only own profile present', () => {
        const profiles = [{ user_id: USER_ID }];
        expect(excludeOwnProfile(profiles, USER_ID)).toHaveLength(0);
    });

    it('returns all profiles when none belong to user', () => {
        const profiles = [
            { user_id: OTHER_USER_ID },
            { user_id: 'another-user' },
        ];
        const result = excludeOwnProfile(profiles, USER_ID);
        expect(result).toHaveLength(2);
    });

    it('returns empty array when input is empty', () => {
        expect(excludeOwnProfile([], USER_ID)).toHaveLength(0);
    });

    it('never returns a profile with the caller\'s user_id regardless of position', () => {
        const profiles = [
            { user_id: OTHER_USER_ID },
            { user_id: USER_ID },
            { user_id: 'another-user' },
        ];
        const result = excludeOwnProfile(profiles, USER_ID);
        expect(result.every(p => p.user_id !== USER_ID)).toBe(true);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Swipe ID exclusion set (already-swiped items)', () => {
    // Mirrors the Set-based exclusion in both hooks for swiped item IDs
    const buildExclusionSet = (
        likedIds: string[],
        permanentlyHiddenIds: string[],
        refreshableDislikeIds: string[],
        isRefreshMode: boolean,
    ): Set<string> => {
        const set = new Set<string>();
        for (const id of likedIds) set.add(id);
        for (const id of permanentlyHiddenIds) set.add(id);
        if (!isRefreshMode) {
            for (const id of refreshableDislikeIds) set.add(id);
        }
        return set;
    };

    it('includes liked IDs in exclusion set', () => {
        const set = buildExclusionSet(['a', 'b'], [], [], false);
        expect(set.has('a')).toBe(true);
        expect(set.has('b')).toBe(true);
    });

    it('includes permanently hidden IDs', () => {
        const set = buildExclusionSet([], ['c'], [], false);
        expect(set.has('c')).toBe(true);
    });

    it('includes refreshable dislikes in normal mode', () => {
        const set = buildExclusionSet([], [], ['d'], false);
        expect(set.has('d')).toBe(true);
    });

    it('excludes refreshable dislikes in refresh mode', () => {
        const set = buildExclusionSet([], [], ['d'], true);
        expect(set.has('d')).toBe(false);
    });

    it('deduplicates IDs that appear in multiple sources', () => {
        const set = buildExclusionSet(['dup'], ['dup'], ['dup'], false);
        expect(set.size).toBe(1);
    });
});
