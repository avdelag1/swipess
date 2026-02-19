
# Profile & Settings Reorganization — Remove Duplication, Clean Architecture

## The Problem: What's Duplicated Right Now

Looking at both pages:

**Client Profile page currently has:**
- Your Likes / Who Liked You cards
- Filter Colors (Theme selector)
- Radio Player link
- My Contracts link
- Legal Services link
- Share Profile link
- Subscription link
- Settings link (just a link to settings)

**Client Settings page currently has:**
- Security
- Preferences (sounds)
- Contracts (duplicate)
- Legal Services (duplicate)
- FAQ & Help
- About Swipess
- Legal

**Contracts** and **Legal Services** exist in BOTH pages — that is the direct duplication the user is referring to. Same pattern on Owner side.

---

## The New Architecture

### Profile Page — "Your Identity & Quick Actions"
The profile page should be about YOU as a person/business and your most personal quick-access actions. It stays light and personal:

**Client Profile:**
- Edit Profile button (hero)
- Profile completion bar (if incomplete)
- Your Likes / Who Liked You (personal activity)
- Share Profile + earn messages (SharedProfileSection)
- Filter Colors / Theme (visual personalization — stays here, close to identity)
- Subscription / Crown upgrade (stays here — tied to your account)
- Sign Out button

**Owner Profile:**
- Edit Profile button (hero)
- Your Liked Clients / Who Liked You counts
- Share Profile (SharedProfileSection)
- Filter Colors / Theme
- Subscription / Crown upgrade
- Sign Out button

**Removed from Profile:** Radio Player, Contracts, Legal Services, the Settings link row (redundant since Settings is in bottom nav)

---

### Settings Page — "App Configuration & Support"
Settings becomes the comprehensive app-configuration hub. Everything that is a tool, configuration, or support resource lives here:

**Client Settings:**
- Security (password, 2FA)
- Preferences (sounds, swipe behavior)
- Radio Player (app tool)
- My Contracts (document management tool)
- Legal Services (support resource)
- FAQ & Help
- About Swipess
- Legal (terms/privacy)

**Owner Settings:**
- Security (password, 2FA)
- Preferences (sounds)
- Manage Listings (owner tool — currently only in profile)
- Contract Management (document tool)
- Legal Services (support resource)
- FAQ & Help
- About Swipess
- Legal (terms/privacy)

**Key change:** Contracts and Legal Services move exclusively to Settings. They are removed from Profile. The Settings page is now the single authoritative place for all tool and support links.

---

## Visual Design Upgrade

Both pages get the new premium aesthetic matching the filter page redesign already done:

### Profile Page Visual Upgrades:
- Profile header: larger avatar (96px), gradient ring, name in `text-2xl font-bold`
- Edit Profile button: full brand gradient pill (`from-[#ec4899] to-[#f97316]`) with glow shadow
- Likes/Who Liked You: Redesigned as **horizontal 2-card row** with gradient icon backgrounds (orange flame / pink heart) — not two separate stacked cards
- Theme selector: stays as inline compact widget
- Subscription button: amber/gold gradient pill with crown icon
- Sign Out: red outline pill — `border-red-500/50 text-red-400` with logout icon
- SharedProfileSection stays as-is (functional, works well)

### Settings Page Visual Upgrades:
- Each settings row: glass-pill style with colored icon badge (rounded square, not just bare icon)
- Section grouping: split into two visual groups — "App & Account" and "Support & Legal" with pill-shaped section labels
- Row items: `py-4 px-5` with icon in a `w-9 h-9 rounded-xl` colored background (like iOS settings rows)
- Active press: `active:bg-white/5 scale-[0.99]`
- No chevrons on items that expand in-page (Security/Preferences) — chevron only on navigate-away items

---

## Files to Change

### 1. `src/pages/ClientProfileNew.tsx`
- **Remove** the Quick Links card block (Radio Player, My Contracts, Legal Services, Share Profile, Subscription, Settings)
- **Keep**: Edit Profile button, completion bar, Likes/WhoLikedYou, SharedProfileSection, ThemeSelector, Sign Out
- **Add**: Subscription pill button (standalone, not in a card list)
- **Redesign**: Likes & Who Liked You as horizontal 2-col row instead of stacked cards
- **Redesign**: Sign Out as a red outlined pill with premium style

### 2. `src/pages/OwnerProfileNew.tsx`
- **Remove** the Quick Links card block (Manage Listings, Contract Management, Legal Services, Subscription, Settings)
- **Keep**: Edit Profile button, Liked Clients count, Who Liked You count, SharedProfileSection, ThemeSelector, Sign Out
- **Add**: Subscription pill button (standalone)
- **Redesign**: Same horizontal 2-col row for likes stats

### 3. `src/pages/ClientSettingsNew.tsx`
- **Add** Radio Player item (new — moved from Profile)
- **Keep** all existing items: Security, Preferences, Contracts, Legal Services, FAQ, About, Legal
- **Redesign**: iOS-style icon badge rows — each icon in a colored `rounded-xl` square background (48x48 equivalent), white icon inside
- **Add**: Group separator pill labels — "Account" group, "Tools" group, "Support" group
- **Sign Out** button is NOT here (it belongs on Profile page only)

### 4. `src/pages/OwnerSettingsNew.tsx`
- **Add** Radio Player item (moved from Profile)
- **Add** Manage Listings item (moved from Profile — owner-specific tool)
- **Keep**: Security, Preferences, Contracts, Legal Services, FAQ, About, Legal
- **Redesign**: Same iOS-style icon badge rows with group labels

---

## Item Distribution Matrix

| Item | Client Profile | Client Settings | Owner Profile | Owner Settings |
|---|---|---|---|---|
| Edit Profile | YES | — | YES | — |
| Profile Completion | YES | — | — | — |
| Your Likes / Who Liked You | YES | — | YES | — |
| Share Profile | YES | — | YES | — |
| Filter Colors (Theme) | YES | — | YES | — |
| Subscription | YES | — | YES | — |
| Sign Out | YES | — | YES | — |
| Radio Player | — | YES | — | YES |
| Contracts | — | YES | — | YES |
| Legal Services | — | YES | — | YES |
| Manage Listings | — | — | — | YES |
| Security | — | YES | — | YES |
| Preferences (Sounds) | — | YES | — | YES |
| FAQ & Help | — | YES | — | YES |
| About Swipess | — | YES | — | YES |
| Legal (terms) | — | YES | — | YES |

Zero duplication. Every item lives in exactly one place.

---

## Technical Notes
- Zero backend changes — this is purely UI restructuring
- No routing changes — URLs stay the same
- `SharedProfileSection` component stays unchanged — just moved within the profile layout
- The Settings page's in-page Security/Preferences sections stay intact — only adding new items and restyling rows
- The `ThemeSelector` stays on Profile pages (it is a visual personalization feature, belongs with identity)
- Both pages use framer-motion stagger animation — keeping that pattern
- No new dependencies needed
