-- 20260614171000_sync_iap_product_ids.sql
-- Sync database apple_product_ids with iapProducts.ts constants

-- 1. Sync Subscriptions (v3)
UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.plus.monthly.v3',
  google_product_id = 'Swipess.plus.monthly.v3'
WHERE name = '1 Month Access';

UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.plus.semestral.v3',
  google_product_id = 'Swipess.plus.semestral.v3'
WHERE name = '6 Months Access';

UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.plus.annual.v3',
  google_product_id = 'Swipess.plus.annual.v3'
WHERE name = '1 Year Access';

-- 2. Sync Tokens (v2)
UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.tokens.20.v2',
  google_product_id = 'Swipess.tokens.20.v2'
WHERE tokens = 20 AND package_category IN ('client_pay_per_use', 'owner_pay_per_use');

UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.tokens.50.v2',
  google_product_id = 'Swipess.tokens.50.v2'
WHERE tokens = 50 AND package_category IN ('client_pay_per_use', 'owner_pay_per_use');

UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.tokens.100.v2',
  google_product_id = 'Swipess.tokens.100.v2'
WHERE tokens = 100 AND package_category IN ('client_pay_per_use', 'owner_pay_per_use');

UPDATE public.subscription_packages SET
  apple_product_id = 'Swipess.tokens.150.v2',
  google_product_id = 'Swipess.tokens.150.v2'
WHERE tokens = 150 AND package_category IN ('client_pay_per_use', 'owner_pay_per_use');
