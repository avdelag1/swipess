

# Build Plan: 5 Features (Excluding Admin Dashboard)

## Features to Build

### 1. Maintenance Request System
**New table:** `maintenance_requests` with columns: `id`, `contract_id`, `listing_id`, `tenant_id`, `owner_id`, `title`, `description`, `category` (plumbing/electrical/AC/appliance/structural/other), `photo_urls` jsonb, `status` (submitted/in_progress/resolved/closed), `priority` (low/medium/high/urgent), `created_at`, `updated_at`, `resolved_at`.

**RLS:** Tenant can insert (own), both tenant + owner can view/update their own requests.

**New files:**
- `src/pages/MaintenanceRequests.tsx` — list view with status filters + submit form
- `src/components/MaintenanceRequestForm.tsx` — category picker, photo upload, description

**Photos** upload to existing `listing-images` bucket (public). Status timeline shows submitted → in progress → resolved.

---

### 2. Multi-Language Support (i18n)
**No DB changes needed.**

**Approach:** Install `react-i18next` + `i18next`. Create `src/i18n/` folder with `en.json` and `es.json` translation files. Wrap app in `I18nProvider`. Add language toggle to settings pages.

**New files:**
- `src/i18n/index.ts` — i18n config
- `src/i18n/en.json` — English translations (key UI strings: nav, buttons, onboarding, filters)
- `src/i18n/es.json` — Spanish translations
- `src/components/LanguageToggle.tsx` — EN/ES switch component

**Integration:** Add `LanguageToggle` to both ClientSettings and OwnerSettings. Store preference in `profiles.theme_preference` field (repurpose or add `language` column). Start with ~100 key strings, not full coverage.

---

### 3. Client ID Verification (KYC-lite)
**No new tables** — uses existing `legal_documents` table + `legal-documents` bucket.

**New files:**
- `src/components/ClientVerificationFlow.tsx` — step wizard: selfie upload → ID document upload → submit
- `src/components/ClientVerifiedBadge.tsx` — badge component (similar to VerifiedOwnerBadge)

**Approach:** Client uploads selfie + government ID → stored in `legal_documents` with `document_type = 'client_id_verification'`. A `verification_status` field in `client_profiles` tracks state (add column: `identity_verified` boolean default false, `verification_submitted_at` timestamptz). Badge shows on client profile cards visible to owners.

**DB migration:** Add `identity_verified` boolean + `verification_submitted_at` timestamptz to `client_profiles`.

---

### 4. Onboarding Tour / Guided Walkthrough
**No DB changes needed.**

Existing `OnboardingFlow` component handles profile setup. This is a **separate** tooltip-based feature tour for first-time users AFTER onboarding.

**New files:**
- `src/components/GuidedTour.tsx` — overlay with spotlight highlighting + tooltip steps
- `src/hooks/useGuidedTour.ts` — manages tour state, localStorage persistence

**Steps:** 5-step tour highlighting: (1) swipe area, (2) filters button, (3) messages icon, (4) bottom nav explore, (5) settings. Uses portal-based spotlight overlay with framer-motion transitions. Stored in localStorage as `guidedTourCompleted`. "Show again" toggle in settings.

---

### 5. Stripe Payment Integration
**Approach:** Use the Lovable Stripe integration tool to enable Stripe. This will set up the infrastructure for subscription payments, replacing the current external PayPal links.

**Scope:** Connect Stripe → create products matching existing `subscription_packages` → add checkout flow → webhook for automatic subscription activation → update `user_subscriptions` on payment success.

---

## Implementation Order

1. **DB migration** — `maintenance_requests` table + `client_profiles` verification columns
2. **Maintenance Requests** — new page + form
3. **Client Verification** — flow + badge
4. **Onboarding Tour** — guided walkthrough component
5. **i18n Setup** — translations + language toggle
6. **Stripe** — enable via tool, implement checkout flow

## Navigation Integration
- Add Maintenance Requests to client settings menu
- Add Client Verification to client profile/settings
- Add Language Toggle to both settings pages
- Guided Tour auto-triggers on first dashboard visit post-onboarding

