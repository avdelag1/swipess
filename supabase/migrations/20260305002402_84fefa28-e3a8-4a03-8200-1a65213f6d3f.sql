-- Backfill avatar_url from client_profiles.profile_images
UPDATE profiles p
SET avatar_url = (cp.profile_images->>0)
FROM client_profiles cp
WHERE cp.user_id = p.user_id
  AND p.avatar_url IS NULL
  AND cp.profile_images IS NOT NULL
  AND jsonb_array_length(cp.profile_images) > 0;

-- Backfill avatar_url from owner_profiles.profile_images
UPDATE profiles p
SET avatar_url = (op.profile_images->>0)
FROM owner_profiles op
WHERE op.user_id = p.user_id
  AND p.avatar_url IS NULL
  AND op.profile_images IS NOT NULL
  AND jsonb_array_length(op.profile_images) > 0;