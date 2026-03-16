

## Plan: Add Listings + AI Buttons to Bottom Nav (Both Sides)

### Problem
The owner bottom nav has no "Listings" button — owners can't access their listings. The AI search button is missing from both client and owner bottom navigation bars.

### Changes

#### 1. `src/components/BottomNavigation.tsx` — Fix owner nav + add AI to both

**Owner nav items** (5 items):
| # | Icon | Label | Path |
|---|------|-------|------|
| 1 | `Compass` | Explore | `/owner/dashboard` |
| 2 | `User` | Profile | `/owner/profile` |
| 3 | `Sparkles` | AI | calls `onAISearchClick` |
| 4 | `MessageCircle` | Messages | `/messages` |
| 5 | `Building2` | Listings | `/owner/properties` |

**Client nav items** (5 items):
| # | Icon | Label | Path |
|---|------|-------|------|
| 1 | `Compass` | Explore | `/client/dashboard` |
| 2 | `User` | Profile | `/client/profile` |
| 3 | `Sparkles` | AI | calls `onAISearchClick` |
| 4 | `MessageCircle` | Messages | `/messages` |
| 5 | `Search` | Filters | `/client/filters` |

The AI button replaces `Flame` (Likes) from position 3. Users can still access Likes from their profile page. The AI button calls `onAISearchClick` prop (already wired in parent layouts).

### Files (1)

| File | Change |
|------|--------|
| `src/components/BottomNavigation.tsx` | Update both `clientNavItems` and `ownerNavItems` arrays — add AI center button, add Listings for owner, use Compass for owner dashboard |

