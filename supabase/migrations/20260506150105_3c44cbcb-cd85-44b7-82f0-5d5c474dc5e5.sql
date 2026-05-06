CREATE TABLE IF NOT EXISTS public.apple_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  transaction_id text,
  original_transaction_id text NOT NULL UNIQUE,
  purchase_date timestamptz NOT NULL,
  expires_date timestamptz,
  environment text NOT NULL DEFAULT 'Production',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apple_transactions_user ON public.apple_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_transactions_product ON public.apple_transactions(product_id);

ALTER TABLE public.apple_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own apple transactions"
ON public.apple_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_apple_transactions_updated_at
BEFORE UPDATE ON public.apple_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();