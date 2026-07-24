-- Create the user_daily_quests table
CREATE TABLE IF NOT EXISTS public.user_daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL,
    quests JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, quest_date)
);

-- Add quest_points to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quest_points INTEGER NOT NULL DEFAULT 0;

-- RLS Policies for user_daily_quests
ALTER TABLE public.user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quests"
    ON public.user_daily_quests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests"
    ON public.user_daily_quests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
    ON public.user_daily_quests
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RPC: get_or_create_daily_quests
CREATE OR REPLACE FUNCTION rpc_get_or_create_daily_quests(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := current_date;
    v_quests JSONB;
BEGIN
    -- Check if quests exist for today
    SELECT quests INTO v_quests
    FROM public.user_daily_quests
    WHERE user_id = p_user_id AND quest_date = v_today;

    IF v_quests IS NULL THEN
        -- Generate new quests
        v_quests := '[
            {"id": "login", "title": "Daily Login", "goal": 1, "progress": 1, "points": 1, "claimed": false},
            {"id": "swipe", "title": "The Explorer", "goal": 10, "progress": 0, "points": 2, "claimed": false},
            {"id": "message", "title": "The Networker", "goal": 1, "progress": 0, "points": 2, "claimed": false}
        ]'::jsonb;
        
        INSERT INTO public.user_daily_quests (user_id, quest_date, quests)
        VALUES (p_user_id, v_today, v_quests);
    END IF;

    RETURN v_quests;
END;
$$;

-- RPC: increment_quest_progress
CREATE OR REPLACE FUNCTION rpc_increment_quest_progress(p_user_id UUID, p_quest_id TEXT, p_amount INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := current_date;
    v_quests JSONB;
    v_quest JSONB;
    v_new_quests JSONB := '[]'::jsonb;
    v_found BOOLEAN := false;
BEGIN
    SELECT quests INTO v_quests
    FROM public.user_daily_quests
    WHERE user_id = p_user_id AND quest_date = v_today;

    IF v_quests IS NULL THEN
        RETURN NULL;
    END IF;

    FOR v_quest IN SELECT * FROM jsonb_array_elements(v_quests)
    LOOP
        IF v_quest->>'id' = p_quest_id AND NOT (v_quest->>'claimed')::boolean THEN
            v_quest := jsonb_set(
                v_quest, 
                '{progress}', 
                to_jsonb(LEAST((v_quest->>'goal')::int, (v_quest->>'progress')::int + p_amount))
            );
            v_found := true;
        END IF;
        v_new_quests := v_new_quests || v_quest;
    END LOOP;

    IF v_found THEN
        UPDATE public.user_daily_quests
        SET quests = v_new_quests, updated_at = NOW()
        WHERE user_id = p_user_id AND quest_date = v_today;
    END IF;

    RETURN v_new_quests;
END;
$$;

-- RPC: claim_quest_reward
CREATE OR REPLACE FUNCTION rpc_claim_quest_reward(p_user_id UUID, p_quest_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := current_date;
    v_quests JSONB;
    v_quest JSONB;
    v_new_quests JSONB := '[]'::jsonb;
    v_points_to_add INT := 0;
    v_current_points INT;
    v_new_points INT;
BEGIN
    SELECT quests INTO v_quests
    FROM public.user_daily_quests
    WHERE user_id = p_user_id AND quest_date = v_today;

    IF v_quests IS NULL THEN
        RAISE EXCEPTION 'No quests found for today';
    END IF;

    -- Find the quest and mark as claimed if it met the goal
    FOR v_quest IN SELECT * FROM jsonb_array_elements(v_quests)
    LOOP
        IF v_quest->>'id' = p_quest_id THEN
            IF (v_quest->>'claimed')::boolean THEN
                RAISE EXCEPTION 'Quest already claimed';
            END IF;
            IF (v_quest->>'progress')::int < (v_quest->>'goal')::int THEN
                RAISE EXCEPTION 'Quest goal not reached yet';
            END IF;
            
            v_quest := jsonb_set(v_quest, '{claimed}', 'true'::jsonb);
            v_points_to_add := (v_quest->>'points')::int;
        END IF;
        v_new_quests := v_new_quests || v_quest;
    END LOOP;

    IF v_points_to_add > 0 THEN
        -- Update the quest status
        UPDATE public.user_daily_quests
        SET quests = v_new_quests, updated_at = NOW()
        WHERE user_id = p_user_id AND quest_date = v_today;

        -- Add points to profile
        SELECT quest_points INTO v_current_points FROM public.profiles WHERE id = p_user_id;
        v_new_points := COALESCE(v_current_points, 0) + v_points_to_add;

        IF v_new_points >= 10 THEN
            -- Grant token and reset points
            v_new_points := v_new_points - 10;
            
            INSERT INTO public.tokens (user_id, token_type, source, amount, token)
            VALUES (p_user_id, 'reward', 'daily_quest', 1, 'qst_' || encode(gen_random_bytes(6), 'hex'));
        END IF;

        UPDATE public.profiles
        SET quest_points = v_new_points
        WHERE id = p_user_id;
    END IF;

    RETURN v_new_quests;
END;
$$;
