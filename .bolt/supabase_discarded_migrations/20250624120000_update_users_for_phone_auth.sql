/*
  # Update Users Table for Email OTP Authentication

  1. Changes
    - Ensure email column exists and is properly indexed
    - Remove phone authentication setup (keeping it null for future use)
    - Update indexes and constraints for email-based auth

  2. Security
    - Maintain existing RLS policies
    - Update policies to work with email authentication
*/

-- Ensure email column exists and is properly configured
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Add phone column for future use but keep it nullable
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone text UNIQUE,
ADD COLUMN IF NOT EXISTS phone_confirmed_at timestamptz;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update the trigger function to handle email-based auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, email_confirmed_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(EXCLUDED.full_name, users.full_name),
    avatar_url = coalesce(EXCLUDED.avatar_url, users.avatar_url),
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update RLS policies to work with email
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Update user_sessions table to work with phone authentication
-- No changes needed as it references user_id

-- Update existing RLS policies if needed
-- The existing policies should work fine with phone authentication

-- Add a function to get user by phone
CREATE OR REPLACE FUNCTION get_user_by_phone(user_phone text)
RETURNS TABLE(
  id uuid,
  phone text,
  full_name text,
  avatar_url text,
  phone_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.phone,
    u.full_name,
    u.avatar_url,
    u.phone_confirmed_at,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.phone = user_phone
  AND u.deleted_at IS NULL;
$$;

-- Add a comment explaining the schema change
COMMENT ON TABLE users IS 'User profiles with phone-based authentication';
COMMENT ON COLUMN users.phone IS 'User phone number for OTP authentication';
COMMENT ON COLUMN users.phone_confirmed_at IS 'Timestamp when phone was verified';
COMMENT ON COLUMN users.email IS 'Optional email address (nullable after phone auth migration)'; 