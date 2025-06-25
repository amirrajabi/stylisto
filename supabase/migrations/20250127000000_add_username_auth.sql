/*
  # Add Username Support for Authentication

  1. Changes
    - Add username column to users table
    - Add unique constraint for username
    - Update indexes for username search
    - Create function to find user by username or email

  2. Security
    - Maintain existing RLS policies
    - Username should be unique and searchable
*/

-- Add username column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add first_name and last_name columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Update the handle_new_user function to include first_name and last_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, first_name, last_name, avatar_url, email_confirmed_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = coalesce(EXCLUDED.username, users.username),
    first_name = coalesce(EXCLUDED.first_name, users.first_name),
    last_name = coalesce(EXCLUDED.last_name, users.last_name),
    avatar_url = coalesce(EXCLUDED.avatar_url, users.avatar_url),
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Function to get user by username or email
CREATE OR REPLACE FUNCTION get_user_by_identifier(identifier text)
RETURNS TABLE(
  id uuid,
  email text,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE (u.email = identifier OR u.username = identifier)
  AND u.deleted_at IS NULL;
$$;

-- Add comment explaining username field
COMMENT ON COLUMN users.username IS 'Unique username for login (optional alternative to email)'; 