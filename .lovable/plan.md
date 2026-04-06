

# Fix Dashboard Layout, Action Buttons, Radio Visibility + Full Page Directory

## Issues Identified

1. **Only 3 action buttons showing** — `SwipessSwipeContainer` passes `onLike`, `onDislike`, and `onUndo` to `SwipeActionButtonBar` but does NOT pass `onShare` or `onMessage`. Since the bar conditionally renders those buttons only when their callbacks are provided, they never appear. The handlers `handleShare` and `handleMessage` exist in the component but are not wired to the bar.

2. **Dashboard layout compression** — The distance slider + "Searching" badge + card area still feel cramped. The Tinder reference screenshot shows a clean layout: card area gets most of the space, controls are minimal and well-spaced, and the action buttons sit at the bottom with breathing room.

3. **Radio page not showing controls/skin** — The radio page (`DJTurntableRadio.tsx`) uses `fixed inset-0 z-[9999]` which should overlay everything. The code looks correct with turntable, controls, and volume bar all rendering. The runtime error `Cannot read properties of null (reading 'useState')` in `useConnectionHealth.ts` (called by `ConnectionGuard`) may be crashing the entire app tree before the radio page can mount. This needs to be fixed first.

4. **Runtime crash** — `ConnectionGuard` in `RootProviders.tsx` wraps the entire app. If `useConnectionHealth` crashes (React context issue), nothing renders — including the radio page.

---

## Plan

### 1. Fix Runtime Crash (ConnectionGuard)
**File**: `src/providers/RootProviders.tsx`

Wrap `ConnectionGuard` in an error boundary or make `useConnectionHealth` defensive so a null React internals issue doesn't crash the entire app tree. Add a try-catch or move `ConnectionGuard` inside the provider tree where React context is fully available.

### 2. Wire All 5 Action Buttons
**File**: `src/components/SwipessSwipeContainer.tsx`

Pass the missing `onShare` and `onMessage` handlers to `SwipeActionButtonBar`:

```tsx
<SwipeActionButtonBar
  onLike={handleButtonLike}
  onDislike={handleButtonDislike}
  onUndo={undoLastSwipe}
  onShare={handleShare}       // ← ADD
  onMessage={handleMessage}   // ← ADD
  canUndo={canUndo}
/>
```

This immediately enables all 5 buttons: Undo, Dislike, Share, Like, Message.

### 3. Improve Dashboard Card Area Layout
**File**: `src/components/SwipessSwipeContainer.tsx`

Inspired by the Tinder reference (not copying, just the spacing philosophy):
- Reduce the top controls area padding so the card gets more vertical space
- Give the action buttons proper bottom spacing with safe-area awareness
- Ensure the card area uses `flex-1 min-h-0` to fill available space without compression

### 4. Verify Radio Page Renders
After fixing the runtime crash in step 1, the radio page should render correctly since the component code (`DJTurntableRadio.tsx`) is complete with turntable, controls, volume bar, and station drawer. If additional issues remain, we'll debug the radio context initialization.

---

## All Pages Directory

Here is every page in the app and what it does:

### Public Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Index | Landing/signup page |
| `/reset-password` | ResetPassword | Password recovery |
| `/privacy-policy` | PrivacyPolicy | Privacy policy |
| `/terms-of-service` | TermsOfService | Terms of service |
| `/legal` | LegalPage | Legal information |
| `/agl` | AGLPage | AGL legal page |
| `/about` | AboutPage | About the platform |
| `/faq/client` | FAQClientPage | FAQ for clients |
| `/faq/owner` | FAQOwnerPage | FAQ for owners |
| `/profile/:id` | PublicProfilePreview | Public user profile view |
| `/listing/:id` | PublicListingPreview | Public listing preview |

### Client Pages (require login)
| Route | Page | Purpose |
|-------|------|---------|
| `/client/dashboard` | ClientDashboard | Main swipe deck for discovering listings |
| `/client/profile` | ClientProfile | Edit your client profile |
| `/client/settings` | ClientSettings | Account settings, subscription |
| `/client/liked-properties` | ClientLikedProperties | View all listings you liked |
| `/client/who-liked-you` | ClientWhoLikedYou | See which owners liked your profile |
| `/client/saved-searches` | ClientSavedSearches | Saved search filters |
| `/client/security` | ClientSecurity | Security & password settings |
| `/client/services` | ClientWorkerDiscovery | Discover workers/services |
| `/client/contracts` | ClientContracts | View contracts |
| `/client/legal-services` | ClientLawyerServices | Legal/lawyer services |
| `/client/camera` | ClientSelfieCamera | Take profile selfie |
| `/client/filters` | ClientFilters | Advanced search filters |
| `/client/maintenance` | MaintenanceRequests | Submit maintenance requests |
| `/client/advertise` | AdvertisePage | Advertise on the platform |

### Owner Pages (require login)
| Route | Page | Purpose |
|-------|------|---------|
| `/owner/dashboard` | EnhancedOwnerDashboard | Main swipe deck for discovering clients |
| `/owner/profile` | OwnerProfile | Edit owner profile |
| `/owner/settings` | OwnerSettings | Account settings |
| `/owner/properties` | OwnerProperties | Manage your listings |
| `/owner/listings/new` | OwnerNewListing | Create new listing |
| `/owner/listings/new-ai` | ConversationalListingCreator | AI-assisted listing creation |
| `/owner/liked-clients` | OwnerLikedClients | View clients you liked |
| `/owner/interested-clients` | OwnerInterestedClients | See interested clients |
| `/owner/clients/property` | OwnerPropertyClientDiscovery | Discover property clients |
| `/owner/clients/moto` | OwnerMotoClientDiscovery | Discover motorcycle clients |
| `/owner/clients/bicycle` | OwnerBicycleClientDiscovery | Discover bicycle clients |
| `/owner/view-client/:clientId` | OwnerViewClientProfile | View a specific client's profile |
| `/owner/filters-explore` | OwnerFiltersExplore | Explore filter options |
| `/owner/saved-searches` | OwnerSavedSearches | Saved search filters |
| `/owner/security` | OwnerSecurity | Security settings |
| `/owner/contracts` | OwnerContracts | View contracts |
| `/owner/legal-services` | OwnerLawyerServices | Legal services |
| `/owner/camera` | OwnerProfileCamera | Take profile photo |
| `/owner/camera/listing` | OwnerListingCamera | Take listing photos |
| `/owner/filters` | OwnerFilters | Advanced client filters |

### Shared Pages (require login)
| Route | Page | Purpose |
|-------|------|---------|
| `/messages` | MessagingDashboard | All conversations/chats |
| `/notifications` | NotificationsPage | Push/in-app notifications |
| `/subscription-packages` | SubscriptionPackagesPage | View subscription tiers |
| `/radio` | DJTurntableRadio | DJ turntable radio player |
| `/explore/eventos` | EventosFeed | Browse local events |
| `/explore/eventos/likes` | EventosLikes | Events you liked |
| `/explore/eventos/:id` | EventoDetail | Single event detail |
| `/explore/prices` | PriceTracker | Track property prices |
| `/explore/tours` | VideoTours | Video property tours |
| `/explore/intel` | LocalIntel | Local area intelligence |
| `/explore/roommates` | RoommateMatching | Find roommates |
| `/documents` | DocumentVault | Store/manage documents |
| `/escrow` | EscrowDashboard | Escrow payment management |
| `/payment/success` | PaymentSuccess | Payment confirmation |
| `/payment/cancel` | PaymentCancel | Payment cancellation |

### Admin Pages (require admin role)
| Route | Page | Purpose |
|-------|------|---------|
| `/admin/eventos` | AdminEventos | Manage events |
| `/admin/photos` | AdminPhotos | Manage photos |
| `/admin/performance` | AdminPerformanceDashboard | Performance analytics |

---

## Files Changed

| File | Change |
|------|--------|
| `src/providers/RootProviders.tsx` | Make ConnectionGuard resilient to prevent full-app crash |
| `src/components/SwipessSwipeContainer.tsx` | Wire `onShare` + `onMessage` to button bar, improve card area spacing |

