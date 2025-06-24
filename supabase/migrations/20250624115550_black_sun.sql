/*
  # Storage Configuration for Wardrobe Images

  1. New Buckets
    - Creates a storage bucket for wardrobe images with appropriate settings
  
  2. Security
    - Uses direct SQL statements to configure the bucket and policies
    - Avoids using storage API functions that may not be available
*/

-- Create storage bucket for wardrobe images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'wardrobe-images',
    'wardrobe-images',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(
  policy_name text,
  table_name text,
  schema_name text DEFAULT 'storage'
) RETURNS boolean AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE policyname = policy_name
    AND tablename = table_name
    AND schemaname = schema_name;
  
  RETURN policy_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for storage.objects
DO $$
BEGIN
  -- Enable RLS on storage.objects if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Policy: Users can upload images to their own folder
  IF NOT policy_exists('Users can upload own images', 'objects') THEN
    EXECUTE 'CREATE POLICY "Users can upload own images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = ''wardrobe-images'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;

  -- Policy: Users can view their own images
  IF NOT policy_exists('Users can view own images', 'objects') THEN
    EXECUTE 'CREATE POLICY "Users can view own images"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = ''wardrobe-images'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;

  -- Policy: Public read access for image display
  IF NOT policy_exists('Public read access for images', 'objects') THEN
    EXECUTE 'CREATE POLICY "Public read access for images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = ''wardrobe-images'')';
  END IF;

  -- Policy: Users can update their own images
  IF NOT policy_exists('Users can update own images', 'objects') THEN
    EXECUTE 'CREATE POLICY "Users can update own images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = ''wardrobe-images'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = ''wardrobe-images'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;

  -- Policy: Users can delete their own images
  IF NOT policy_exists('Users can delete own images', 'objects') THEN
    EXECUTE 'CREATE POLICY "Users can delete own images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = ''wardrobe-images'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;
END $$;

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS policy_exists(text, text, text);