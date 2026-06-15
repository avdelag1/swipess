SELECT proname
FROM pg_proc
WHERE proname IN ('get_passport_map_listings', 'get_passport_map_profiles');