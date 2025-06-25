-- Simple script to create users table to fix foreign key constraint
-- Run this in Supabase SQL Editor

-- Create users table with minimal required fields
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
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
    WHERE policyname = 'Users can insert own profile' 
    AND tablename = 'users'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id)';
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
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); 