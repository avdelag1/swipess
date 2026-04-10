# Pricing Packages Setup Guide

This document describes the token pricing packages for Swipess and how to set them up.

## Overview

Swipess offers 6 token packages total:
- **3 Explorer Packages** (Client-side) - For users searching for listings
- **3 Provider Packages** (Owner-side) - For users creating listings

Each package includes tokens to start new conversations, with varying validity periods and additional benefits.

## Package Tiers

### 🔍 Explorer Packages (Client Pay-Per-Use)

Explorers pay a premium for access to providers.

| Tier | Name | Tokens | Price | Validity | Legal Docs | Highlights |
|------|------|--------|-------|----------|------------|------------|
| **Starter** | Explorer Starter | 5 | 69 MXN | 90 days | 0 | Perfect for trying out |
| **Standard** ⭐ | Explorer Standard | 10 | 129 MXN | 180 days | 1 | BEST VALUE - Priority matches |
| **Premium** | Explorer Premium | 15 | 179 MXN | 365 days | 3 | VIP support, featured boost |

#### Explorer Starter (5 tokens - 69 MXN)
- Start 5 new conversations
- Unlimited messages per chat
- 90-day validity
- Secure PayPal payment
- Instant token activation
- 24/7 support access

#### Explorer Standard (10 tokens - 129 MXN) ⭐ BEST VALUE
- Start 10 new conversations
- Unlimited messages per chat
- 180-day validity
- 1 legal document included
- Priority match suggestions
- Advanced search filters
- Secure PayPal payment
- Instant token activation

#### Explorer Premium (15 tokens - 179 MXN)
- Start 15 new conversations
- Unlimited messages per chat
- 365-day validity (1 year!)
- 3 legal documents included
- Priority match suggestions
- Advanced search filters
- Early profile access
- Featured profile boost
- Secure PayPal payment
- VIP support

---

### 🏠 Provider Packages (Owner Pay-Per-Use)

Providers get discounted rates to encourage engagement with explorers.

| Tier | Name | Tokens | Price | Validity | Legal Docs | Highlights |
|------|------|--------|-------|----------|------------|------------|
| **Starter** | Provider Starter | 5 | 49 MXN | 90 days | 1 | Great for new providers |
| **Standard** ⭐ | Provider Standard | 10 | 89 MXN | 180 days | 2 | BEST VALUE - Enhanced visibility |
| **Premium** | Provider Premium | 15 | 129 MXN | 365 days | 5 | Professional with analytics |

#### Provider Starter (5 tokens - 49 MXN)
- Connect with 5 potential clients
- Unlimited messages per chat
- 90-day validity
- 1 legal document template
- Basic listing visibility
- Secure PayPal payment
- Instant token activation

#### Provider Standard (10 tokens - 89 MXN) ⭐ BEST VALUE
- Connect with 10 potential clients
- Unlimited messages per chat
- 180-day validity
- 2 legal document templates
- Enhanced listing visibility
- Priority in search results
- Response rate insights
- Secure PayPal payment
- Instant activation

#### Provider Premium (15 tokens - 129 MXN)
- Connect with 15 potential clients
- Unlimited messages per chat
- 365-day validity (1 year!)
- 5 legal document templates
- Maximum listing visibility
- Top placement in search
- Client insights & analytics
- Market demand reports
- Featured provider badge
- Priority support
- Secure PayPal payment

---

## Design Features

Each package card features:

### Visual Styling by Tier

**Starter (Slate)**
- Gradient: Gray/Slate tones
- Icon: MessageCircle
- Clean, professional entry-level look

**Standard (Primary Blue) - BEST VALUE**
- Gradient: Primary blue with glow effect
- Icon: Zap (lightning bolt)
- "⭐ BEST VALUE" badge at top
- Ring border with primary color
- Most prominent visual design

**Premium (Gold/Amber)**
- Gradient: Amber to orange
- Icon: Crown
- Luxury gold glow effect
- "Save X%" badge showing savings vs Starter

### Card Components

Each package card includes:
1. **Popular Badge** - "⭐ BEST VALUE" on Standard tier
2. **Savings Badge** - "Save X%" on Premium tier
3. **Icon** - Tier-specific icon in colored background
4. **Package Name** - Explorer/Provider + Tier name
5. **Price Display** - Large MXN price with per-token cost
6. **Token Counter** - Big number in highlighted box
7. **Features List** - Checkmarks with all benefits
8. **Buy Button** - Styled per tier with PayPal integration
9. **Trust Badges** - Secure Payment, Instant Activation, No Hidden Fees

---

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd /home/user/swipess

# Run the migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the contents of `supabase/migrations/20260216000000_add_pricing_packages_with_paypal.sql`
5. Paste into the SQL editor
6. Click **Run**

### Option 3: Manual SQL Execution

The migration file is located at:
```
supabase/migrations/20260216000000_add_pricing_packages_with_paypal.sql
```

This migration will:
1. Add the `paypal_link` column to `subscription_packages` table
2. Update all 6 token packages with:
   - Enhanced package names (Explorer/Provider + Tier)
   - Detailed feature lists (JSON array)
   - PayPal payment links
   - Legal document counts
   - Extended validity periods
   - Proper pricing structure

---

## PayPal Integration

All packages use the PayPal payment link: `https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC`

**Note:** This is currently a placeholder link. You should:
1. Create individual PayPal payment buttons/links for each package
2. Update the `paypal_link` values in the database with real payment links
3. Set up proper PayPal webhooks for payment confirmation

### Payment Flow

1. User clicks "Buy Now" button on package card
2. Package details stored in localStorage for post-payment processing
3. PayPal link opens in new tab
4. User completes payment
5. PayPal webhook triggers token activation
6. User redirected back to dashboard with tokens added

---

## Component Structure

The pricing packages are displayed using:

**Component:** `/src/components/MessageActivationPackages.tsx`

**Features:**
- Automatic package fetching from Supabase
- Role-based filtering (client vs owner packages)
- Responsive 3-column grid layout
- Animated card entrance with Framer Motion
- Tier-based styling and gradients
- Dynamic savings calculation
- PayPal integration with toast notifications
- Loading states with skeleton screens
- "No packages" fallback message

**Usage:**
```tsx
import { MessageActivationPackages } from '@/components/MessageActivationPackages';

// As modal
<MessageActivationPackages
  isOpen={true}
  onClose={() => setIsOpen(false)}
  userRole="client" // or "owner"
/>

// As page section
<MessageActivationPackages
  showAsPage={true}
  userRole="owner"
/>
```

---

## Database Schema

### subscription_packages Table

```sql
CREATE TABLE public.subscription_packages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MXN',
  tier text CHECK (tier IN ('basic', 'premium', 'unlimited', 'pay_per_use')),
  package_category text CHECK (package_category IN (
    'client_monthly', 'owner_monthly',
    'client_pay_per_use', 'owner_pay_per_use'
  )),
  duration_days integer DEFAULT 30,
  tokens integer DEFAULT 0,
  legal_documents_included integer DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  paypal_link text,  -- NEW COLUMN
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

---

## TypeScript Types

The TypeScript types have been updated in:
`/src/integrations/supabase/types.ts`

Added `paypal_link: string | null` to:
- `subscription_packages.Row`
- `subscription_packages.Insert`
- `subscription_packages.Update`

---

## Testing

After applying the migration, test the packages by:

1. **View as Client:**
   - Log in as a client/explorer user
   - Navigate to token packages modal
   - Verify 3 packages appear: Explorer Starter, Standard, Premium
   - Check prices: 69, 129, 179 MXN
   - Verify features list displays correctly

2. **View as Owner:**
   - Log in as an owner/provider user
   - Navigate to token packages modal
   - Verify 3 packages appear: Provider Starter, Standard, Premium
   - Check prices: 49, 89, 129 MXN
   - Verify features list displays correctly

3. **Test Styling:**
   - Verify "⭐ BEST VALUE" badge on Standard tier
   - Check "Save X%" badge on Premium tier
   - Confirm color gradients: Gray (Starter), Blue (Standard), Gold (Premium)
   - Test responsive layout on mobile, tablet, desktop

4. **Test PayPal Flow:**
   - Click "Buy Now" on each package
   - Verify PayPal link opens in new tab
   - Check localStorage for pending package data
   - Verify toast notification appears

---

## Customization

To customize packages further:

### Update Prices
```sql
UPDATE subscription_packages SET price = 99
WHERE package_category = 'client_pay_per_use' AND tokens = 5;
```

### Change Features
```sql
UPDATE subscription_packages SET
  features = '["New feature 1", "New feature 2"]'::jsonb
WHERE id = 1;
```

### Update PayPal Links
```sql
UPDATE subscription_packages SET
  paypal_link = 'https://www.paypal.com/your-custom-link'
WHERE package_category = 'client_pay_per_use' AND tokens = 10;
```

### Add More Legal Documents
```sql
UPDATE subscription_packages SET
  legal_documents_included = 5
WHERE package_category = 'owner_pay_per_use' AND tokens = 15;
```

---

## Pricing Strategy

The current pricing follows a strategic model:

### Price Discrimination
- **Explorers pay more** (higher purchasing power, seeking service)
- **Providers pay less** (need to attract, create supply)

### Savings Incentive
- Starter: Baseline price per token
- Standard: ~10-15% better value (Best Value badge)
- Premium: ~20-25% better value + extended validity

### Validity Periods
- Starter: 90 days (3 months)
- Standard: 180 days (6 months)
- Premium: 365 days (1 year)

This encourages bulk purchases while providing flexibility for different user needs.

---

## Support

For questions about pricing packages:
- Check component: `/src/components/MessageActivationPackages.tsx`
- Database schema: `CLEAN_DATABASE_SCHEMA.sql`
- Migration: `supabase/migrations/20260216000000_add_pricing_packages_with_paypal.sql`
- Types: `/src/integrations/supabase/types.ts`
