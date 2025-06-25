/*
  Combined SQL Script to Fix Clothing Items Delete Permission Issue
  
  This script combines the RLS policy fixes and the database function
  to resolve the "Permission denied: You can only delete your own items" error.
  
  Apply this script to your Supabase database via the SQL editor.
*/

-- Part 1: Fix RLS Policy for Soft Delete Operations
-- Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;
DROP POLICY IF EXISTS "Users can soft delete own clothing items" ON clothing_items;

-- Create a single, comprehensive UPDATE policy that allows soft delete
CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure we still have a SELECT policy that only shows non-deleted items
DROP POLICY IF EXISTS "Users can read own clothing items" ON clothing_items;

CREATE POLICY "Users can read own clothing items"
  ON clothing_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Part 2: Add Soft Delete Function as Fallback
-- Create a function to safely soft delete clothing items
CREATE OR REPLACE FUNCTION soft_delete_clothing_item(item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  item_record record;
  result jsonb;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get the item and verify ownership
  SELECT * INTO item_record
  FROM clothing_items
  WHERE id = item_id;

  -- Check if item exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found'
    );
  END IF;

  -- Check ownership
  IF item_record.user_id != current_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You do not have permission to delete this item'
    );
  END IF;

  -- Check if already deleted
  IF item_record.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item is already deleted'
    );
  END IF;

  -- Perform the soft delete
  UPDATE clothing_items
  SET 
    deleted_at = now(),
    updated_at = now()
  WHERE id = item_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item successfully deleted'
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
GRANT EXECUTE ON FUNCTION soft_delete_clothing_item(uuid) TO authenticated;

-- Part 3: Fix Users Table and Foreign Key Relationship
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_user_profile(uuid, text) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC); 