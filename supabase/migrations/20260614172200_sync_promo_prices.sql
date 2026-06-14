-- 20260614172200_sync_promo_prices.sql
-- Sync database promo prices with the App Store Connect values

UPDATE public.subscription_packages SET
  price = 4.99
WHERE apple_product_id = 'Swipess.promo.event.week.v3';

UPDATE public.subscription_packages SET
  price = 49.99
WHERE apple_product_id = 'Swipess.promo.event.month.v3';

UPDATE public.subscription_packages SET
  price = 99.99
WHERE apple_product_id = 'Swipess.promo.event.quarter.v3';
