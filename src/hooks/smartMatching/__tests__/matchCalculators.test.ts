import { describe, it, expect } from 'vitest';
import { calculateListingMatch, calculateClientMatch } from '../matchCalculators';
import { ClientFilterPreferences } from '../../useClientFilterPreferences';
import { Listing } from '../../useListings';

describe('Match Calculators', () => {
    describe('calculateListingMatch', () => {
        it('returns 0% when preferred listing types do not match', () => {
            const preferences = { preferred_listing_types: ['sale'] } as ClientFilterPreferences;
            const listing = { listing_type: 'rent' } as Listing;

            const result = calculateListingMatch(preferences, listing);

            expect(result.percentage).toBe(0);
            expect(result.incompatible).toContain('Looking for sale but this is for rent');
        });

        it('calculates a high match percentage for strongly matching criteria', () => {
            const preferences = {
                min_price: 1000,
                max_price: 2000,
                min_bedrooms: 2,
                max_bedrooms: 3,
                property_types: ['Apartment'],
                pet_friendly_required: true,
            } as ClientFilterPreferences;

            const listing = {
                price: 1500,
                beds: 2,
                property_type: 'Apartment',
                pet_friendly: true,
            } as Listing;

            const result = calculateListingMatch(preferences, listing);

            // Should be very high or 100% since all criteria are met
            expect(result.percentage).toBeGreaterThan(90);
            expect(result.reasons).toContain('Price $1500 within flexible budget');
            expect(result.reasons).toContain('2 beds matches requirement (2-3)');
            expect(result.reasons).toContain('Property type Apartment matches preferences');
            expect(result.reasons).toContain('Pet-friendly property');
        });

        it('handles flexible budget limits with 20% margin', () => {
            const preferences = { min_price: 1000, max_price: 2000 } as ClientFilterPreferences;

            // Within 20% margin
            const listingInRange = { price: 2300 } as Listing;
            const resultInRange = calculateListingMatch(preferences, listingInRange);
            expect(resultInRange.reasons.some(r => r.includes('Price $2300 within flexible budget'))).toBe(true);

            // Outside 20% margin (2401)
            const listingOutRange = { price: 2500 } as Listing;
            const resultOutRange = calculateListingMatch(preferences, listingOutRange);
            expect(resultOutRange.incompatible.some(r => r.includes('Price $2500 outside flexible budget range'))).toBe(true);
        });
    });

    describe('calculateClientMatch', () => {
        it('returns a good match when budget and gender match', () => {
            const ownerPrefs = {
                min_budget: 1000,
                selected_genders: ['Female'],
            };

            const profile = {
                budget_max: 1500,
                gender: 'Female',
                verified: true,
            };

            const result = calculateClientMatch(ownerPrefs, profile);
            expect(result.percentage).toBeGreaterThan(80);
            expect(result.reasons).toContain('Budget $1500 in range');
            expect(result.reasons).toContain('Gender Female matches preferences');
            expect(result.reasons).toContain('Verified profile');
        });

        it('deducts points or adds incompatibilities when criteria are missed', () => {
            const ownerPrefs = {
                allows_children: false,
                smoking_habit: 'Non-Smoker',
            };

            const profile = {
                has_children: true,
                smoking_habit: 'Smoker',
            };

            const result = calculateClientMatch(ownerPrefs, profile);
            expect(result.incompatible).toContain('Has children but not allowed');
            expect(result.incompatible).toContain('Smoking habits incompatible');
            expect(result.percentage).toBeLessThan(100);
        });
    });
});
