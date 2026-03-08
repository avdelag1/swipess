

# The Real Picture: 6 Ghost Tables

Good news: the core communication pipeline (likes → matches → conversations → messages → notifications) is now **solid** after our last 3 rounds of fixes.

Bad news: I found **6 tables that the code queries but don't exist in the database**. Every operation against them silently fails because the code uses `(supabase as any)` to bypass TypeScript (which would have caught this).

## Missing Tables

| Table | Used For | Impact |
|-------|----------|--------|
| `tokens` | Message activations, quotas, referral rewards, welcome bonuses | Monetization is broken — users get unlimited messaging |
| `user_blocks` | Blocking users | Safety feature doesn't work |
| `user_reports` | Reporting users | Safety feature doesn't work |
| `user_radio_playlists` | Radio/music playlists | Feature doesn't work |
| `deal_status_tracking` | Contract deal status | Contracts partially broken |
| `contract_signatures` | Contract signing records | Contract signing doesn't work |

## What This Means

- **Monetization**: Token/activation system is completely non-functional. Users appear to have unlimited access.
- **Safety**: Users cannot block or report other users. Every attempt silently fails.
- **Contracts**: The digital contracts table exists, but its supporting tables (signatures, deal tracking) don't.
- **Radio**: The playlist feature is entirely broken.

## Recommended Fix

**Create all 6 missing tables** with proper schemas, RLS policies, and indexes in a single migration. The code already expects these tables with specific column structures — I can infer the correct schemas from the existing code.

### Priority Order
1. **`tokens`** — Core to monetization (message activations, quotas)
2. **`user_blocks`** — Core safety feature
3. **`user_reports`** — Core safety feature
4. **`contract_signatures`** + **`deal_status_tracking`** — Contract workflow completion
5. **`user_radio_playlists`** — Nice-to-have feature

### Technical Approach
- One database migration creating all 6 tables
- RLS policies for each (user can only see/modify own data, blocks prevent visibility)
- No code changes needed — the frontend code already expects these tables with the right columns

## After This

Once these tables exist, the app will be **fully operational** for day-to-day use. The remaining items from the audit (test coverage, logger consolidation, ESLint tightening) are code quality improvements, not functional blockers.

