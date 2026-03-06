-- ============================================================
-- DATABASE SCHEMA SYNC FIX (2026-03-01)
-- ============================================================
-- This script fixes the "missing column" errors by:
-- 1. Adding missing columns to 'profiles' table.
-- 2. Loosening 'likes' table constraints.
-- 3. Migrating data from deprecated 'user_visual_preferences'.
-- 4. Updating the profile creation trigger.

-- 1. FIX PROFILES TABLE
-- ------------------------------------------------------------
DO $$
BEGIN
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id uuid;
        -- Backfill user_id from id (since id matches auth.users.id)
        UPDATE public.profiles SET user_id = id;
    END IF;

    -- Add visual preference columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='radio_current_station_id') THEN
        ALTER TABLE public.profiles ADD COLUMN radio_current_station_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='swipe_sound_theme') THEN
        ALTER TABLE public.profiles ADD COLUMN swipe_sound_theme text DEFAULT 'default';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='theme_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN theme_preference text DEFAULT 'system';
    END IF;

    -- Add missing role columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text;
    END IF;

    -- Add username if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
        ALTER TABLE public.profiles ADD COLUMN username text;
    END IF;

    -- Add active_mode if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='active_mode') THEN
        ALTER TABLE public.profiles ADD COLUMN active_mode text;
    END IF;
END $$;

-- 2. MIGRATE DATA FROM user_visual_preferences (if it exists)
-- ------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_visual_preferences') THEN
        -- Link the data
        UPDATE public.profiles p
        SET 
            radio_current_station_id = uvp.radio_current_station_id,
            swipe_sound_theme = uvp.swipe_sound_theme,
            theme_preference = uvp.theme
        FROM public.user_visual_preferences uvp
        WHERE p.id = uvp.user_id;
        
        -- Optionally drop the table later after verification
        -- DROP TABLE public.user_visual_preferences CASCADE;
    END IF;
END $$;

-- 3. FIX LIKES TABLE CONSTRAINTS
-- ------------------------------------------------------------
DO $$
BEGIN
    -- Update target_type constraint
    ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_target_type_check;
    ALTER TABLE public.likes ADD CONSTRAINT likes_target_type_check 
        CHECK (target_type IN ('listing', 'profile', 'radio_station'));

    -- Update direction constraint
    ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_direction_check;
    ALTER TABLE public.likes ADD CONSTRAINT likes_direction_check 
        CHECK (direction IN ('left', 'right', 'up', 'down'));
END $$;

-- 4. UPDATE handle_new_user TRIGGER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    email,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name
  WHERE public.profiles.user_id IS NULL OR public.profiles.user_id != EXCLUDED.user_id;

  RETURN NEW;
END;
$$;

-- 5. ENSURE RLS FOR user_id COLUMN
-- ------------------------------------------------------------
-- (Supabase caches the schema, so this ensures Postgrest sees the new column)
NOTIFY pgrst, 'reload schema';
