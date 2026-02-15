-- Migration to rename message_activations to tokens and add third package

-- 1. Rename message_activations table to tokens
ALTER TABLE public.message_activations RENAME TO tokens;

-- 2. Rename the column in subscription_packages
ALTER TABLE public.subscription_packages RENAME COLUMN message_activations TO tokens;

-- 3. Update existing package names and descriptions
UPDATE public.subscription_packages SET
  name = 'Basic Client',
  description = 'Basic monthly plan for clients'
WHERE name = 'Basic Client' AND package_category = 'client_monthly';

UPDATE public.subscription_packages SET
  name = 'Premium Client',
  description = 'Premium monthly plan for clients'
WHERE name = 'Premium Client' AND package_category = 'client_monthly';

UPDATE public.subscription_packages SET
  name = 'Unlimited Client',
  description = 'Unlimited monthly plan for clients'
WHERE name = 'Unlimited Client' AND package_category = 'client_monthly';

UPDATE public.subscription_packages SET
  name = 'Basic Owner',
  description = 'Basic monthly plan for owners'
WHERE name = 'Basic Owner' AND package_category = 'owner_monthly';

UPDATE public.subscription_packages SET
  name = 'Premium Owner',
  description = 'Premium monthly plan for owners'
WHERE name = 'Premium Owner' AND package_category = 'owner_monthly';

UPDATE public.subscription_packages SET
  name = 'Unlimited Owner',
  description = 'Unlimited monthly plan for owners'
WHERE name = 'Unlimited Owner' AND package_category = 'owner_monthly';

-- 4. Update client pay-per-use packages (make them more expensive than owner packages)
UPDATE public.subscription_packages SET
  name = '5 Token Pack',
  description = '5 tokens for new conversations',
  price = 69
WHERE name = '5 Message Pack' AND package_category = 'client_pay_per_use';

UPDATE public.subscription_packages SET
  name = '10 Token Pack',
  description = '10 tokens for new conversations',
  price = 129
WHERE name = '10 Message Pack' AND package_category = 'client_pay_per_use';

-- 5. Update owner pay-per-use packages
UPDATE public.subscription_packages SET
  name = '5 Token Pack',
  description = '5 tokens for new conversations',
  price = 49
WHERE name = '5 Owner Message Pack' AND package_category = 'owner_pay_per_use';

UPDATE public.subscription_packages SET
  name = '10 Token Pack',
  description = '10 tokens for new conversations',
  price = 89
WHERE name = '10 Owner Message Pack' AND package_category = 'owner_pay_per_use';

-- 6. Add third token package for clients (most expensive)
INSERT INTO public.subscription_packages (name, description, price, tier, package_category, duration_days, tokens, max_listings, features) VALUES
('15 Token Pack', '15 tokens for new conversations', 179, 'pay_per_use', 'client_pay_per_use', 365, 15, 0, '[]');

-- 7. Add third token package for owners
INSERT INTO public.subscription_packages (name, description, price, tier, package_category, duration_days, tokens, max_listings, features) VALUES
('15 Token Pack', '15 tokens for new conversations', 129, 'pay_per_use', 'owner_pay_per_use', 365, 15, 0, '[]');

-- 8. Update RLS policies for renamed tokens table
DROP POLICY IF EXISTS "Users can view their own activations" ON public.tokens;
DROP POLICY IF EXISTS "Users can insert their own activations" ON public.tokens;
DROP POLICY IF EXISTS "Users can update their own activations" ON public.tokens;

CREATE POLICY "Users can view their own tokens" ON public.tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON public.tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens" ON public.tokens FOR UPDATE USING (auth.uid() = user_id);

-- 9. Rename trigger
DROP TRIGGER IF EXISTS update_message_activations_updated_at ON public.tokens;
CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Add comment to tokens table
COMMENT ON TABLE public.tokens IS 'Stores user token balances for pay-per-use messaging';
COMMENT ON COLUMN public.tokens.activations_remaining IS 'Number of tokens remaining (renamed from activations_remaining for backward compatibility)';
