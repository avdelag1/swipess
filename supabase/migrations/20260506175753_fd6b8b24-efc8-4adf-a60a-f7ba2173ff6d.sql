
-- Retire legacy token packs (don't delete, keep history for past purchases)
UPDATE public.subscription_packages
SET is_active = false
WHERE package_category IN ('client_pay_per_use','owner_pay_per_use')
  AND message_activations IN (3, 5, 10, 15);

-- Upsert the 4 new Apple-aligned token packs (client side; same lineup is shown to owners via shared modal)
INSERT INTO public.subscription_packages
  (name, description, price, currency, tier, package_category, duration_days, message_activations, legal_documents_included, features, is_active)
VALUES
  ('Starter Pack — 20 Tokens',  '20 tokens to unlock actions inside Swipess. Use them to send messages, boost listings, or activate premium features. Tokens never expire.', 4.99,  'USD', 'pay_per_use', 'client_pay_per_use', 3650,  20, 0, '["20 conversation tokens","Tokens never expire","Instant activation"]'::jsonb, true),
  ('Plus Pack — 50 Tokens',     '50 tokens for more freedom inside Swipess. Send messages, promote your listings, and access premium actions whenever you need them.',          9.99,  'USD', 'pay_per_use', 'client_pay_per_use', 3650,  50, 1, '["50 conversation tokens","Better value per token","Tokens never expire"]'::jsonb, true),
  ('Power Pack — 100 Tokens',   '100 tokens for power users. Get more reach, more conversations, and more visibility across the Swipess platform.',                          17.99, 'USD', 'pay_per_use', 'client_pay_per_use', 3650, 100, 2, '["100 conversation tokens","Great for power users","Tokens never expire"]'::jsonb, true),
  ('Mega Pack — 150 Tokens',    '150 tokens — the best value pack. Maximum actions, maximum reach. Perfect for active users who want to get the most out of Swipess.',       24.99, 'USD', 'pay_per_use', 'client_pay_per_use', 3650, 150, 3, '["150 conversation tokens","Best value per token","Tokens never expire"]'::jsonb, true);

-- Mirror the same packs for owners (so owner UI fetches from owner_pay_per_use)
INSERT INTO public.subscription_packages
  (name, description, price, currency, tier, package_category, duration_days, message_activations, legal_documents_included, features, is_active)
VALUES
  ('Starter Pack — 20 Tokens',  '20 tokens to unlock actions inside Swipess.', 4.99,  'USD', 'pay_per_use', 'owner_pay_per_use', 3650,  20, 0, '["20 conversation tokens","Tokens never expire"]'::jsonb, true),
  ('Plus Pack — 50 Tokens',     '50 tokens for active providers.',             9.99,  'USD', 'pay_per_use', 'owner_pay_per_use', 3650,  50, 1, '["50 conversation tokens","Better value"]'::jsonb, true),
  ('Power Pack — 100 Tokens',   '100 tokens for power providers.',             17.99, 'USD', 'pay_per_use', 'owner_pay_per_use', 3650, 100, 2, '["100 conversation tokens","Great for power users"]'::jsonb, true),
  ('Mega Pack — 150 Tokens',    '150 tokens — the best value pack.',           24.99, 'USD', 'pay_per_use', 'owner_pay_per_use', 3650, 150, 3, '["150 conversation tokens","Best value"]'::jsonb, true);
