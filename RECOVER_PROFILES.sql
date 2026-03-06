-- ======================================================
-- RECOVERY SCRIPT (V2): RESTORE PROFILES WITH NAME MAPPING
-- ======================================================
-- Use this if your login says "Hi, User" instead of your name.

-- 1. First, clear any "User" placeholder profiles to allow a clean re-insert
DELETE FROM public.profiles WHERE name = 'User';

-- 2. Insert profiles by mapping Email to Name/Role
-- This is the most reliable way since raw_user_meta_data might be empty.
INSERT INTO public.profiles (id, username, name, role)
SELECT 
  id, 
  SPLIT_PART(email, '@', 1) as username, 
  INITCAP(SPLIT_PART(email, '@', 1)) as name,
  CASE 
    WHEN LOWER(email) LIKE 'francis%' THEN 'Admin'
    WHEN LOWER(email) LIKE 'admin%' THEN 'Admin'
    WHEN LOWER(email) LIKE 'topman%' THEN 'Admin'
    ELSE 'Boarder' 
  END as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 3. Verification
SELECT id, email, (SELECT name FROM public.profiles p WHERE p.id = u.id) as profile_name, (SELECT role FROM public.profiles p WHERE p.id = u.id) as profile_role
FROM auth.users u;

-- ======================================================
-- INSTRUCTIONS:
-- 1. Run this in Supabase SQL Editor.
-- 2. LOG OUT and LOG BACK IN on your website to refresh the cache.
-- ======================================================
