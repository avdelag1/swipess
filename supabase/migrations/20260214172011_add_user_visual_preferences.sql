-- Migration: Add User Visual Preferences
-- Description: Adds animation and visual preference settings for premium UX customization
-- Created: 2026-02-14

-- Create user_visual_preferences table
create table if not exists public.user_visual_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Animation settings
  animation_level text not null default 'premium' check (animation_level in ('minimal', 'standard', 'premium', 'cinematic')),

  -- Visual mode (future expansion for different visual themes)
  visual_mode text default 'luxury' check (visual_mode in ('minimal', 'premium', 'luxury', 'cinematic')),

  -- Reduce motion preference (accessibility)
  reduce_motion boolean default false,

  -- Background effects
  enable_background_effects boolean default true,

  -- Haptic feedback (for mobile)
  enable_haptics boolean default true,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Unique constraint: one preference row per user
  unique(user_id)
);

-- Add comment to table
comment on table public.user_visual_preferences is 'Stores user preferences for animations, visual effects, and motion settings';

-- Add comments to columns
comment on column public.user_visual_preferences.animation_level is 'Animation intensity level: minimal (no animations), standard (subtle), premium (default), cinematic (dramatic)';
comment on column public.user_visual_preferences.visual_mode is 'Overall visual theme mode';
comment on column public.user_visual_preferences.reduce_motion is 'Accessibility setting to reduce motion for users with vestibular disorders';
comment on column public.user_visual_preferences.enable_background_effects is 'Enable/disable animated background visual effects';
comment on column public.user_visual_preferences.enable_haptics is 'Enable/disable haptic feedback on mobile devices';

-- Create index for faster user lookups
create index if not exists idx_user_visual_preferences_user_id
  on public.user_visual_preferences(user_id);

-- Enable Row Level Security (RLS)
alter table public.user_visual_preferences enable row level security;

-- RLS Policy: Users can view their own preferences
create policy "Users can view their own visual preferences"
  on public.user_visual_preferences
  for select
  using (auth.uid() = user_id);

-- RLS Policy: Users can insert their own preferences
create policy "Users can insert their own visual preferences"
  on public.user_visual_preferences
  for insert
  with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own preferences
create policy "Users can update their own visual preferences"
  on public.user_visual_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Users can delete their own preferences
create policy "Users can delete their own visual preferences"
  on public.user_visual_preferences
  for delete
  using (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at on row modification
create trigger set_user_visual_preferences_updated_at
  before update on public.user_visual_preferences
  for each row
  execute function public.handle_updated_at();

-- Function to create default preferences when a new user signs up
create or replace function public.create_default_visual_preferences()
returns trigger as $$
begin
  insert into public.user_visual_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create default preferences on user creation
-- Note: This assumes the auth.users table is accessible
-- If using Supabase Auth, this will run when a new user signs up
create trigger on_auth_user_created_visual_prefs
  after insert on auth.users
  for each row
  execute function public.create_default_visual_preferences();
