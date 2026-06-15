SELECT proname
FROM pg_proc
WHERE proname IN (
  'get_passport_map_listings',
  'get_passport_map_profiles',
  'rpc_grant_welcome_tokens',
  'rpc_get_user_tokens',
  'get_smart_clients',
  'get_smart_listings'
)
ORDER BY proname;