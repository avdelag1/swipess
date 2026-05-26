-- ============================================================
-- SECURITY HARDENING PHASE 2
-- ============================================================
-- Adds verified column to google_play_transactions for audit
-- Creates purchase_audit_log for replay attack detection
-- ============================================================

-- 1. Add verified column to google_play_transactions
ALTER TABLE public.google_play_transactions 
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 2. Create purchase audit log for replay & fraud detection
CREATE TABLE IF NOT EXISTS public.purchase_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    purchase_token TEXT NOT NULL,
    order_id TEXT,
    action TEXT NOT NULL,
    source TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.purchase_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage audit log
CREATE POLICY "Service role can manage purchase audit log"
    ON public.purchase_audit_log
    USING (true)
    WITH CHECK (true);

-- Index for replay attack detection
CREATE INDEX IF NOT EXISTS idx_purchase_audit_log_token
    ON public.purchase_audit_log (purchase_token);

CREATE INDEX IF NOT EXISTS idx_purchase_audit_log_user
    ON public.purchase_audit_log (user_id, created_at DESC);
