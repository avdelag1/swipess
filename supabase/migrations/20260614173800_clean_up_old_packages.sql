-- 20260614173800_clean_up_old_packages.sql
-- Remove all obsolete or deprecated subscription packages from the database.
-- Only the newest .v2 and .v3 product IDs that match App Store Connect will remain.

DELETE FROM public.subscription_packages
WHERE apple_product_id NOT IN (
  -- Premium Subscriptions
  'Swipess.plus.annual.v3',
  'Swipess.plus.semestral.v3',
  'Swipess.plus.monthly.v3',
  
  -- Tokens
  'Swipess.tokens.150.v2',
  'Swipess.tokens.100.v2',
  'Swipess.tokens.50.v2',
  'Swipess.tokens.20.v2',
  
  -- Event Promos
  'Swipess.promo.event.quarter.v3',
  'Swipess.promo.event.month.v3',
  'Swipess.promo.event.week.v3'
);
