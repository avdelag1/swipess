-- Migration: Add new subscription packages for the updated subscription page
-- These correspond to the 3 plans on SubscriptionPackagesPage.tsx

INSERT INTO public.subscription_packages (
  name, description, price, currency, tier, package_category,
  duration_days, tokens, max_listings, features, is_active
) VALUES
  (
    '1 Month Access',
    'Full access to all marketplace features for 1 month',
    39, 'MXN', 'premium', 'client_monthly', 30, 0, 10,
    '[
      "Communicate with listings and members",
      "Post properties for rent or sale",
      "Post services (chef, driver, cleaning, etc.)",
      "Post motorcycles or bicycles for rent or sale",
      "Save favorite listings",
      "Discover opportunities",
      "AI assistant to create listings & discover the city"
    ]'::jsonb,
    true
  ),
  (
    '6 Months Access',
    'Full access to all marketplace features for 6 months',
    119, 'MXN', 'premium', 'client_monthly', 180, 0, 10,
    '[
      "Communicate with listings and members",
      "Post properties for rent or sale",
      "Post services (chef, driver, cleaning, etc.)",
      "Post motorcycles or bicycles for rent or sale",
      "Save favorite listings",
      "Discover opportunities",
      "AI assistant to create listings & discover the city"
    ]'::jsonb,
    true
  ),
  (
    '1 Year Access',
    'Full access to all marketplace features for 1 year',
    299, 'MXN', 'unlimited', 'client_monthly', 365, 0, 10,
    '[
      "Communicate with listings and members",
      "Post properties for rent or sale",
      "Post services (chef, driver, cleaning, etc.)",
      "Post motorcycles or bicycles for rent or sale",
      "Save favorite listings",
      "Discover opportunities",
      "AI assistant to create listings & discover the city"
    ]'::jsonb,
    true
  );
