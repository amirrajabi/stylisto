-- ================================
-- Test Queries for Users Table
-- Run these after updating the users table
-- ================================

-- 1. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY indexname;

-- 3. Check RLS policies
SELECT 
  policyname, 
  cmd, 
  permissive, 
  roles, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 4. Check triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 5. Sample insert test (for testing profile completion trigger)
-- WARNING: This will create a test user! Run only if needed
-- INSERT INTO users (
--   id, 
--   email, 
--   first_name, 
--   last_name, 
--   gender, 
--   date_of_birth, 
--   country
-- ) VALUES (
--   gen_random_uuid(), 
--   'test@example.com', 
--   'Test', 
--   'User', 
--   'prefer-not-to-say', 
--   '1990-01-01', 
--   'Australia'
-- );

-- 6. Check if profile completion works
-- SELECT id, email, first_name, last_name, profile_completed 
-- FROM users 
-- WHERE email = 'test@example.com';

-- 7. Test JSON fields defaults
SELECT 
  id,
  email,
  style_preferences,
  budget_range,
  privacy_settings,
  notification_settings,
  social_links
FROM users 
LIMIT 1;

-- 8. Count users by subscription tier
SELECT 
  subscription_tier, 
  COUNT(*) as user_count 
FROM users 
GROUP BY subscription_tier;

-- 9. Count users by profile completion status
SELECT 
  profile_completed, 
  COUNT(*) as user_count 
FROM users 
GROUP BY profile_completed;

-- 10. Show users with missing profile information
SELECT 
  id,
  email,
  first_name,
  last_name,
  gender,
  date_of_birth,
  country,
  profile_completed
FROM users 
WHERE 
  first_name IS NULL OR 
  last_name IS NULL OR 
  gender IS NULL OR 
  date_of_birth IS NULL OR 
  country IS NULL
LIMIT 5; 