-- Ensure user_sessions foreign key integrity
-- Fix any inconsistencies and ensure proper user profile creation

-- Ensure users table has proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE,
  first_name text,
  last_name text,
  full_name text,
  avatar_url text,
  email_confirmed_at timestamptz,
  phone text UNIQUE,
  phone_confirmed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the user creation function to handle all cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name,
    full_name,
    avatar_url,
    email_confirmed_at,
    phone,
    phone_confirmed_at
  )
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name',
      CONCAT_WS(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at,
    new.phone,
    new.phone_confirmed_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    email_confirmed_at = COALESCE(EXCLUDED.email_confirmed_at, users.email_confirmed_at),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    phone_confirmed_at = COALESCE(EXCLUDED.phone_confirmed_at, users.phone_confirmed_at),
    updated_at = now();
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing users from auth.users who might not have profiles
INSERT INTO public.users (id, email, first_name, last_name, full_name, avatar_url, email_confirmed_at, phone, phone_confirmed_at)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name',
    CONCAT_WS(' ', au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'last_name')
  ),
  au.raw_user_meta_data->>'avatar_url',
  au.email_confirmed_at,
  au.phone,
  au.phone_confirmed_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Clean up any orphaned user_sessions
DELETE FROM user_sessions 
WHERE user_id NOT IN (SELECT id FROM users);

-- Ensure user_sessions table has proper foreign key constraint
ALTER TABLE user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

ALTER TABLE user_sessions 
ADD CONSTRAINT user_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create a function to safely record user sessions
CREATE OR REPLACE FUNCTION public.safe_record_user_session(
  p_user_id uuid,
  p_platform text DEFAULT 'unknown',
  p_app_version text DEFAULT '1.0.0'
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Ensure user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User % does not exist in users table', p_user_id;
  END IF;
  
  -- Insert session
  INSERT INTO user_sessions (user_id, platform, app_version)
  VALUES (p_user_id, p_platform, p_app_version)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ language plpgsql security definer; 