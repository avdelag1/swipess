-- Migration to finalize Apple IAP Compliance
-- Enforce global pricing consistency with .99 endings
-- Standardize versioned IDs (v1 for consumables, v2 for subscriptions)

-- 1. Add IAP columns to subscription_packages
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS apple_product_id text;
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS google_product_id text;

-- 2. Update Token Packages (Consumables - v1)
-- Explorer Packages (Client)
UPDATE public.subscription_packages SET
  price = 69.99,
  apple_product_id = 'swipess_explorer_starter_v1',
  google_product_id = 'swipess_explorer_starter_v1',
  features = jsonb_set(features, '{3}', '"Secure In-App Purchase"')
WHERE name = 'Explorer Starter';

UPDATE public.subscription_packages SET
  price = 129.99,
  apple_product_id = 'swipess_explorer_standard_v1',
  google_product_id = 'swipess_explorer_standard_v1',
  features = jsonb_set(features, '{6}', '"Secure In-App Purchase"')
WHERE name = 'Explorer Standard';

UPDATE public.subscription_packages SET
  price = 179.99,
  apple_product_id = 'swipess_explorer_premium_v1',
  google_product_id = 'swipess_explorer_premium_v1',
  features = jsonb_set(features, '{8}', '"Secure In-App Purchase"')
WHERE name = 'Explorer Premium';

-- Provider Packages (Owner)
UPDATE public.subscription_packages SET
  price = 49.99,
  apple_product_id = 'swipess_provider_starter_v1',
  google_product_id = 'swipess_provider_starter_v1',
  features = jsonb_set(features, '{5}', '"Secure In-App Purchase"')
WHERE name = 'Provider Starter';

UPDATE public.subscription_packages SET
  price = 89.99,
  apple_product_id = 'swipess_provider_standard_v1',
  google_product_id = 'swipess_provider_standard_v1',
  features = jsonb_set(features, '{7}', '"Secure In-App Purchase"')
WHERE name = 'Provider Standard';

UPDATE public.subscription_packages SET
  price = 129.99,
  apple_product_id = 'swipess_provider_premium_v1',
  google_product_id = 'swipess_provider_premium_v1',
  features = jsonb_set(features, '{10}', '"Secure In-App Purchase"')
WHERE name = 'Provider Premium';

-- 3. Update Access Plans (Subscriptions - v2)
UPDATE public.subscription_packages SET
  price = 39.99,
  apple_product_id = 'swipess_1month_v2',
  google_product_id = 'swipess_1month_v2'
WHERE name = '1 Month Access';

UPDATE public.subscription_packages SET
  price = 119.99,
  apple_product_id = 'swipess_6months_v2',
  google_product_id = 'swipess_6months_v2'
WHERE name = '6 Months Access';

UPDATE public.subscription_packages SET
  price = 299.99,
  apple_product_id = 'swipess_1year_v2',
  google_product_id = 'swipess_1year_v2'
WHERE name = '1 Year Access';

-- 4. Clean up PayPal mentions in features for all packages on iOS compliance
-- (This is usually handled in the UI, but updating DB descriptions is good practice)
UPDATE public.subscription_packages 
SET features = (
  SELECT jsonb_agg(
    CASE 
      WHEN element::text ILIKE '%PayPal%' THEN '"Secure In-App Purchase"'::jsonb
      ELSE element
    END
  )
  FROM jsonb_array_elements(features) AS element
)
WHERE features @> '[{"text": "PayPal"}]' OR EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(features) f WHERE f ILIKE '%PayPal%'
);

-- 5. Add comments for clarity
COMMENT ON COLUMN public.subscription_packages.apple_product_id IS 'Standardized Apple IAP Product ID (v1=consumable, v2=subscription)';
COMMENT ON COLUMN public.subscription_packages.google_product_id IS 'Standardized Google Play Product ID';
