-- Migration to add PayPal links and enhance token packages with better features

-- 1. Add paypal_link column to subscription_packages
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS paypal_link text;

-- 2. Update Client Pay-Per-Use Packages (Explorer Packages)
-- These are more expensive as clients have higher purchasing power

-- Client Starter Package (5 tokens)
UPDATE public.subscription_packages SET
  name = 'Explorer Starter',
  description = 'Perfect for trying out connections',
  price = 69,
  tokens = 5,
  duration_days = 90,
  legal_documents_included = 0,
  features = '[
    "Start 5 new conversations",
    "Unlimited messages per chat",
    "90-day validity",
    "Secure PayPal payment",
    "Instant token activation",
    "24/7 support access"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'client_pay_per_use' AND tokens = 5;

-- Client Standard Package (10 tokens) - BEST VALUE
UPDATE public.subscription_packages SET
  name = 'Explorer Standard',
  description = 'Most popular choice for active explorers',
  price = 129,
  tokens = 10,
  duration_days = 180,
  legal_documents_included = 1,
  features = '[
    "Start 10 new conversations",
    "Unlimited messages per chat",
    "180-day validity",
    "1 legal document included",
    "Priority match suggestions",
    "Advanced search filters",
    "Secure PayPal payment",
    "Instant token activation"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'client_pay_per_use' AND tokens = 10;

-- Client Premium Package (15 tokens)
UPDATE public.subscription_packages SET
  name = 'Explorer Premium',
  description = 'Maximum connections for serious explorers',
  price = 179,
  tokens = 15,
  duration_days = 365,
  legal_documents_included = 3,
  features = '[
    "Start 15 new conversations",
    "Unlimited messages per chat",
    "365-day validity (1 year!)",
    "3 legal documents included",
    "Priority match suggestions",
    "Advanced search filters",
    "Early profile access",
    "Featured profile boost",
    "Secure PayPal payment",
    "VIP support"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'client_pay_per_use' AND tokens = 15;

-- 3. Update Owner Pay-Per-Use Packages (Provider Packages)
-- These are cheaper to encourage providers to engage with explorers

-- Owner Starter Package (5 tokens)
UPDATE public.subscription_packages SET
  name = 'Provider Starter',
  description = 'Great for new providers getting started',
  price = 49,
  tokens = 5,
  duration_days = 90,
  legal_documents_included = 1,
  features = '[
    "Connect with 5 potential clients",
    "Unlimited messages per chat",
    "90-day validity",
    "1 legal document template",
    "Basic listing visibility",
    "Secure PayPal payment",
    "Instant token activation"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'owner_pay_per_use' AND tokens = 5;

-- Owner Standard Package (10 tokens) - BEST VALUE
UPDATE public.subscription_packages SET
  name = 'Provider Standard',
  description = 'Best value for active providers',
  price = 89,
  tokens = 10,
  duration_days = 180,
  legal_documents_included = 2,
  features = '[
    "Connect with 10 potential clients",
    "Unlimited messages per chat",
    "180-day validity",
    "2 legal document templates",
    "Enhanced listing visibility",
    "Priority in search results",
    "Response rate insights",
    "Secure PayPal payment",
    "Instant activation"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'owner_pay_per_use' AND tokens = 10;

-- Owner Premium Package (15 tokens)
UPDATE public.subscription_packages SET
  name = 'Provider Premium',
  description = 'Professional package for serious providers',
  price = 129,
  tokens = 15,
  duration_days = 365,
  legal_documents_included = 5,
  features = '[
    "Connect with 15 potential clients",
    "Unlimited messages per chat",
    "365-day validity (1 year!)",
    "5 legal document templates",
    "Maximum listing visibility",
    "Top placement in search",
    "Client insights & analytics",
    "Market demand reports",
    "Featured provider badge",
    "Priority support",
    "Secure PayPal payment"
  ]'::jsonb,
  paypal_link = 'https://www.paypal.com/ncp/payment/ZRHYLZC9N4PHC',
  is_active = true
WHERE package_category = 'owner_pay_per_use' AND tokens = 15;

-- 4. Add comment
COMMENT ON COLUMN public.subscription_packages.paypal_link IS 'PayPal payment link for purchasing this package';
