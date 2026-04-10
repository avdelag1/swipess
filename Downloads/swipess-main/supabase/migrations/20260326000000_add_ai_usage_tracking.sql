-- Create AI Usage tracking for rate limiting/cooldowns
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_type TEXT NOT NULL,
    last_request_at TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 1,
    UNIQUE(user_id, task_type)
);

-- RLS Policies
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
    ON public.ai_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Grant access to service role for Edge Functions
GRANT ALL ON public.ai_usage TO service_role;
GRANT ALL ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO anon;
