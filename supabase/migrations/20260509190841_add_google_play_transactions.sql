-- Create google play transactions table
CREATE TABLE IF NOT EXISTS public.google_play_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    purchase_token TEXT NOT NULL UNIQUE,
    order_id TEXT,
    purchase_time TIMESTAMP WITH TIME ZONE NOT NULL,
    environment TEXT DEFAULT 'Production',
    raw JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.google_play_transactions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage these securely
CREATE POLICY "Service role can manage google play transactions"
    ON public.google_play_transactions
    USING (true)
    WITH CHECK (true);
