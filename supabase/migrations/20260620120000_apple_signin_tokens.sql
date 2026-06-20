-- Stores the Sign in with Apple refresh token per user so account deletion can
-- revoke the Apple grant via Apple's REST API (App Store Review Guideline
-- 5.1.1(v)). Written by the apple-link-token edge function (service role) and
-- read/deleted by delete-user (service role).
CREATE TABLE IF NOT EXISTS public.apple_signin_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS on with no policies: the service_role used by the edge functions bypasses
-- RLS, while anon/authenticated clients get no access to these sensitive tokens.
ALTER TABLE public.apple_signin_tokens ENABLE ROW LEVEL SECURITY;
