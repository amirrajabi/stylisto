/*
  # Storage Buckets for Wardrobe Images

  1. Changes
    - Create storage bucket for wardrobe images
    - Set up RLS policies for storage objects
  
  2. Security
    - Enable RLS on storage.objects
    - Add policies for user data isolation
    - Allow public read access for image display
*/

-- Create storage bucket for wardrobe images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wardrobe-images',
  'wardrobe-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policy: Users can upload images to their own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload own images'
  ) THEN
    CREATE POLICY "Users can upload own images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Policy: Users can view their own images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can view own images'
  ) THEN
    CREATE POLICY "Users can view own images"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Policy: Public read access for image display
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public read access for images'
  ) THEN
    CREATE POLICY "Public read access for images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'wardrobe-images');
  END IF;

  -- Policy: Users can update their own images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update own images'
  ) THEN
    CREATE POLICY "Users can update own images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Policy: Users can delete their own images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete own images'
  ) THEN
    CREATE POLICY "Users can delete own images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;