-- 20260614171800_sync_subscription_prices.sql
-- Sync database prices with the App Store Connect values

UPDATE public.subscription_packages SET
  price = 39.99
WHERE apple_product_id = 'Swipess.plus.monthly.v3';

UPDATE public.subscription_packages SET
  price = 119.99
WHERE apple_product_id = 'Swipess.plus.semestral.v3';

UPDATE public.subscription_packages SET
  price = 299.99
WHERE apple_product_id = 'Swipess.plus.annual.v3';
