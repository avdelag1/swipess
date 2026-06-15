-- 20260614172000_sync_token_prices.sql
-- Sync database token prices with the App Store Connect values

UPDATE public.subscription_packages SET
  price = 9.99
WHERE apple_product_id = 'Swipess.tokens.20.v2';

UPDATE public.subscription_packages SET
  price = 19.99
WHERE apple_product_id = 'Swipess.tokens.50.v2';

UPDATE public.subscription_packages SET
  price = 39.99
WHERE apple_product_id = 'Swipess.tokens.100.v2';

UPDATE public.subscription_packages SET
  price = 49.99
WHERE apple_product_id = 'Swipess.tokens.150.v2';
