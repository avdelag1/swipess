## What I'll do

### 1. Premium prices → end in .99 (Apple tier requirement)
Update everywhere in the app + DB so they match what you'll set in App Store Connect:

| Plan | Product ID | New price |
|---|---|---|
| Swipess Plus Monthly | `Swipess.plus.monthly.v1` | **$29.99** |
| Swipess Plus 6 Months | `Swipess.plus.semestral.v1` | **$111.99** |
| Swipess Plus Yearly | `Swipess.plus.annual.v1` | **$149.99** (also normalize to .99) |

Files: `src/components/SubscriptionPackages.tsx`, `src/pages/SubscriptionPackagesPage.tsx`, `src/components/TokensModal.tsx`, plus a SQL migration on `subscription_packages`.

### 2. Tokens — only 4 packs + real Apple buy button
- `TokensModal` already maps 4 packs; I'll audit and remove any leftover 5th/legacy item if present.
- Wire each "Buy" button to `NativeBridge.purchaseProduct(productId)` using IDs `Swipess.tokens.20 / 50 / 100 / 150`. On web (non-iOS) the button shows "Available in iOS app" instead of failing silently.
- Same wiring on the 3 Premium buttons in `SubscriptionPackagesPage`.

### 3. Premium "bottom section" page — adapt to Swipess Plus
Update the marketing/feature copy on `SubscriptionPackagesPage` so the bullets, names, and prices reflect **Swipess Plus** (Monthly / 6 Months / Yearly) with the new .99 prices and the descriptions we agreed on previously.

### 4. Radio: stop the spam "Station unavailable, tuning to next frequency"
In `RadioContext` / radio player, the auto-skip toast fires on every failed station. I'll:
- Throttle the notification (max one every ~5s) and dedupe identical messages.
- Cap auto-skip retries (e.g. 5 stations) before stopping with a single "No stations reachable right now" notification instead of a loop.
- Silence the toast entirely when the mini-player is collapsed; only log to console.

### 5. Dashboard bottom nav — icons outside the frame
On `/client/profile` (and other pages) the bottom nav icons overflow the rounded surface at small viewports. I'll:
- Reduce icon size from current ~26–28px to **22px**, label to 10px.
- Reduce nav bar internal padding so all 5 items fit inside the rounded frame at 360–414px widths.
- Tighten spacing and add `min-w-0` + `truncate` on labels so nothing pokes outside.
- File: `src/components/Layout/BottomNav` (or equivalent in `src/components/`).

### 6. NEW — Event Promotion packages (submit → approve → pay)

**Flow**
```
User taps "Promote your event"
        │
        ▼
  Submission form  (event name, date, city, photo, link, budget choice)
        │  insert into event_promotion_requests (status='pending')
        ▼
   Admin reviews in /admin/eventos → approves or rejects
        │  status='approved' → user gets notification
        ▼
  User opens approved request → Promotion Packages page
        │  3 Apple IAP buttons (Week / Month / 3 Months)
        ▼
   Apple StoreKit purchase → edge function validates →
   event_promotions row created with active=true and end_date
```

**Apple products to create in App Store Connect** (consumable, non-renewing — you only pay once per promotion run):

| Tier | Product ID | Duration | Price | Reference Name | Display Name | Description |
|---|---|---|---|---|---|---|
| Spark | `Swipess.promo.event.week.v1` | 7 days | **$19.99** | Swipess Event Promo Week | Event Boost — 1 Week | Promote your event for 7 days across the Swipess Eventos feed. Priority placement and push to nearby users. |
| Pulse | `Swipess.promo.event.month.v1` | 30 days | **$59.99** | Swipess Event Promo Month | Event Boost — 1 Month | Keep your event in the spotlight for 30 days with featured cards, push notifications, and AI Concierge mentions. |
| Wave | `Swipess.promo.event.quarter.v1` | 90 days | **$149.99** | Swipess Event Promo 3 Months | Event Boost — 3 Months | Maximum visibility for 90 days: top of Eventos feed, AI recommendations, weekly push to matching users, performance dashboard. |

(All end in .99, fit standard Apple pricing tiers, follow the same naming pattern as your existing IDs.)

**New code/DB**
- Tables: `event_promotion_requests` (id, user_id, event_name, event_date, city, photo_url, link, requested_tier, status, created_at, reviewed_at, reviewed_by) and `event_promotions` (id, request_id, user_id, product_id, started_at, ends_at, active) — both with strict RLS.
- Pages: `src/pages/PromoteEventRequest.tsx` (form) and `src/pages/PromoteEventPackages.tsx` (3-tier picker, gated on `status='approved'`).
- Admin row in existing `AdminEventos` page to approve/reject.
- Edge function `validate-apple-receipt` extended with the 3 new product IDs to insert into `event_promotions`.

### Files touched (summary)
- `src/config/iapProducts.ts` (+3 promo IDs)
- `src/components/SubscriptionPackages.tsx`, `src/pages/SubscriptionPackagesPage.tsx`, `src/components/TokensModal.tsx` (prices + Apple buy wiring)
- `src/components/Layout/BottomNav*` (icon sizing fix)
- `src/contexts/RadioContext.tsx` (throttle + retry cap)
- `src/pages/PromoteEventRequest.tsx`, `src/pages/PromoteEventPackages.tsx` (new)
- `src/pages/AdminEventos.tsx` (approval UI)
- `supabase/functions/validate-apple-receipt/index.ts` (handle promo IDs)
- New SQL migration: price updates + 2 new tables + RLS

### What you'll need to do in App Store Connect
1. Edit existing **Swipess Plus Monthly** → price $29.99; **Swipess Plus 6 Months** → $111.99; **Swipess Plus Yearly** → $149.99.
2. Create the **3 new consumables** above for event promotion using the IDs/copy in the table.
3. Upload 1024×1024 review screenshots (I'll generate them in `/mnt/documents/iap/`).
4. Mark all as Ready to Submit.

Approve and I'll implement.