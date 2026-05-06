
UPDATE public.subscription_packages SET price = 9.99 WHERE message_activations = 20 AND package_category IN ('client_pay_per_use','owner_pay_per_use');
UPDATE public.subscription_packages SET price = 19.99 WHERE message_activations = 50 AND package_category IN ('client_pay_per_use','owner_pay_per_use');
UPDATE public.subscription_packages SET price = 39.99 WHERE message_activations = 100 AND package_category IN ('client_pay_per_use','owner_pay_per_use');
UPDATE public.subscription_packages SET price = 49.99 WHERE message_activations = 150 AND package_category IN ('client_pay_per_use','owner_pay_per_use');
