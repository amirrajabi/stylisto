/*
  # Storage Configuration for Wardrobe Images

  1. New Buckets
    - Creates a storage bucket for wardrobe images with appropriate settings
  
  2. Security
    - Uses Supabase storage administration functions to configure the bucket
    - Avoids direct table manipulation that requires owner privileges
*/

-- Create storage bucket for wardrobe images using Supabase's storage API
SELECT storage.create_bucket(
  'wardrobe-images',
  'Wardrobe Images Storage',
  'public',
  'authenticated',
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
);

-- Update bucket public access
SELECT storage.update_bucket(
  'wardrobe-images',
  'Wardrobe Images Storage',
  'public',
  'authenticated',
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
);

-- Create security policies using Supabase's storage API
-- Policy: Users can upload images to their own folder
SELECT storage.create_policy(
  'wardrobe-images',
  'upload_policy',
  'INSERT',
  'authenticated',
  storage.policy_condition(
    'name',
    'STARTSWITH',
    storage.policy_value('auth.uid()::text', '/')
  )
);

-- Policy: Users can view their own images
SELECT storage.create_policy(
  'wardrobe-images',
  'select_own_policy',
  'SELECT',
  'authenticated',
  storage.policy_condition(
    'name',
    'STARTSWITH',
    storage.policy_value('auth.uid()::text', '/')
  )
);

-- Policy: Public read access for image display
SELECT storage.create_policy(
  'wardrobe-images',
  'public_select_policy',
  'SELECT',
  'public',
  storage.policy_condition('1', '=', '1')
);

-- Policy: Users can update their own images
SELECT storage.create_policy(
  'wardrobe-images',
  'update_own_policy',
  'UPDATE',
  'authenticated',
  storage.policy_condition(
    'name',
    'STARTSWITH',
    storage.policy_value('auth.uid()::text', '/')
  )
);

-- Policy: Users can delete their own images
SELECT storage.create_policy(
  'wardrobe-images',
  'delete_own_policy',
  'DELETE',
  'authenticated',
  storage.policy_condition(
    'name',
    'STARTSWITH',
    storage.policy_value('auth.uid()::text', '/')
  )
);