# App-Wide Polish Pass — Titles & Copy Consistency

Goal: prepare for App Store review by ensuring every page/section has a correct, well-organized title and that no screen mislabels content (e.g. a worker/vehicle/user shown as "Property" in the insights modal).

## 1. Fix the Insights Modal mislabeling

`src/components/LikedListingInsightsModal.tsx` is the offender — it hardcodes "Property" everywhere even when the liked item is a worker, vehicle, motorcycle, bicycle, or roommate profile.

Introduce a single derived `entityLabel` based on the existing category logic (`isWorker`, `isVehicle`, `isMotorcycle`, `isBicycle`, `isProperty`) and a matching plural/owner term:

| Category | Singular | Owner term |
|---|---|---|
| property / room / house | Listing | Owner |
| worker / services | Professional | Provider |
| motorcycle / bicycle / vehicle | Vehicle | Seller |
| roommate | Roommate | User |

Replace the hardcoded "Property" / "property" / "owner" strings at lines 152, 159, 253, 269, 329, 596, 656, 659, 726 and the "Message Owner" CTA (line 611) with the dynamic label. Same treatment for the `<AlertDialogTitle>` "Remove from Liked Properties".

## 2. Sweep page titles for organization

Audit and align every page so the `PageHeader title/subtitle` (and `<Helmet><title>`) reflects the actual content. Concrete targets:

- **Owner side**
  - `OwnerInterestedClients.tsx`: confirm "Interested Clients / Top Demand"
  - `OwnerLikedClients.tsx`, `OwnerProperties.tsx`, `OwnerSavedSearches.tsx`, `OwnerSecurity.tsx`, `OwnerSettings.tsx`, `OwnerContracts.tsx`, `OwnerFilters.tsx`, `OwnerNewListing.tsx`, `OwnerProfile.tsx`, `OwnerViewClientProfile.tsx` — verify each header reads naturally for an owner (no "Property" leak when viewing a person).
- **Client side**
  - `ClientLikedProperties.tsx` (rename header to "Liked Listings" since it can include workers/vehicles), `ClientWhoLikedYou.tsx`, `ClientSavedSearches.tsx`, `ClientSecurity.tsx`, `ClientSettings.tsx`, `ClientContracts.tsx`, `ClientPerks.tsx`, `ClientWorkerDiscovery.tsx`, `ClientProfile.tsx`.
- **Shared/utility**
  - `MessagingDashboard`, `NotificationsPage`, `LegalHub`, `FAQClientPage`, `FAQOwnerPage`, `AboutPage`, `SubscriptionPackagesPage`, `EventosFeed`, `EventoDetail`, `RoommateMatching`, `LocalIntel`, `PriceTracker`, `DocumentVault`, `MaintenanceRequests`, `WorldRadioDirectory`, `DJTurntableRadio`, `AdvertisePage`, `VideoTours`.
- **Document title** — add/normalize `<Helmet><title>... | Swipess</title>` per the branding rule (currently only a few pages set it).

For each page: title = what this screen *is*, subtitle = a short intent line. No emojis. Use existing `PageHeader` component and i18n strings where already present.

## 3. Quick QA pass

After edits, spot-check on `/client/dashboard`, `/owner/dashboard`, `/messages`, `/notifications`, `/client/liked`, `/owner/interested`, and the Insights modal opened from a worker card and a vehicle card to confirm labels render correctly.

## Out of scope
- No layout, color, or component restructuring.
- No new translation keys unless a string is already i18n-wired.
- No changes to swipe physics, routing, or backend.

## Technical notes
- All copy edits stay inside JSX/string literals — no schema or hook changes.
- Insights modal: derive `entityLabel` once inside the existing `propertyInsights` `useMemo` and reuse it; keep variable names (`propertyInsights`, `isProperty`) intact to avoid touching logic.
- Preserve semantic tokens; do not introduce hardcoded colors.
