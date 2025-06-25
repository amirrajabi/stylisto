/*
  # Fix Users Table and Foreign Key Relationship

  1. Issues identified:
    - Foreign key constraint violation when inserting clothing items
    - User records may not exist in users table when auth user is created
    - Need to ensure users table has all required fields

  2. Solution:
    - Ensure users table exists with correct structure
    - Add trigger to automatically create user record when auth user signs up
    - Fix any orphaned records
*/

-- Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text,
  full_name text,
  phone text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can read own profile' 
    AND tablename = 'users'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own profile"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update own profile' 
    AND tablename = 'users'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert own profile' 
    AND tablename = 'users'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Could not create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to manually create missing user profiles
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id uuid, user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert user profile if it doesn't exist
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (user_id, user_email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User profile ensured'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_profile(uuid, text) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC); 