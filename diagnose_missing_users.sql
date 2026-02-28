-- ============================================================
-- DIAGNOSTIC QUERIES TO FIND MISSING USERS
-- ============================================================
-- This script helps identify users that appear in the app
-- but are not visible in the Supabase Auth dashboard

-- Query 1: Count users in each table
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'client_profiles' as table_name, COUNT(*) as count FROM public.client_profiles
UNION ALL
SELECT 'owner_profiles' as table_name, COUNT(*) as count FROM public.owner_profiles
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as count FROM public.user_roles;

-- Query 2: Find profiles WITHOUT corresponding auth.users
-- (These are "orphaned" profiles that shouldn't exist)
SELECT
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    'Profile exists but auth user is missing' as issue
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL
ORDER BY p.created_at DESC;

-- Query 3: Find client_profiles WITHOUT corresponding auth.users
SELECT
    cp.id,
    cp.user_id,
    cp.name,
    cp.created_at,
    'Client profile exists but auth user is missing' as issue
FROM public.client_profiles cp
LEFT JOIN auth.users au ON cp.user_id = au.id
WHERE au.id IS NULL
ORDER BY cp.created_at DESC;

-- Query 4: Find owner_profiles WITHOUT corresponding auth.users
SELECT
    op.id,
    op.user_id,
    op.business_name,
    op.created_at,
    'Owner profile exists but auth user is missing' as issue
FROM public.owner_profiles op
LEFT JOIN auth.users au ON op.user_id = au.id
WHERE au.id IS NULL
ORDER BY op.created_at DESC;

-- Query 5: Find user_roles WITHOUT corresponding auth.users
SELECT
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    'User role exists but auth user is missing' as issue
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.id IS NULL
ORDER BY ur.created_at DESC;

-- Query 6: Find auth.users WITHOUT corresponding profiles
-- (These users signed up but profile creation failed)
SELECT
    au.id,
    au.email,
    au.created_at,
    'Auth user exists but profile is missing' as issue
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Query 7: List ALL profiles with their auth status (most recent first)
SELECT
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    CASE
        WHEN au.id IS NOT NULL THEN 'Has auth user'
        ELSE 'NO AUTH USER (orphaned)'
    END as auth_status,
    CASE
        WHEN cp.user_id IS NOT NULL THEN 'Has client_profile'
        WHEN op.user_id IS NOT NULL THEN 'Has owner_profile'
        ELSE 'No specialized profile'
    END as profile_type
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN public.client_profiles cp ON p.id = cp.user_id
LEFT JOIN public.owner_profiles op ON p.id = op.user_id
ORDER BY p.created_at DESC
LIMIT 20;
