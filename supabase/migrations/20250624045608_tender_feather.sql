/*
  # Storage Configuration for Wardrobe Images

  1. Storage Buckets
    - Create `wardrobe-images` bucket for all user images
    - Configure public access with proper security policies

  2. Security Policies
    - Users can only upload to their own folders
    - Users can only view/delete their own images
    - Public read access for image display

  3. Storage Structure
    - /{user_id}/clothing/{item_id}_{timestamp}.{ext}
    - /{user_id}/outfit/{outfit_id}_{timestamp}.{ext}
    - /{user_id}/profile/{timestamp}.{ext}
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

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'wardrobe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'wardrobe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Public read access for image display
CREATE POLICY "Public read access for images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'wardrobe-images');

-- Policy: Users can update their own images
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

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wardrobe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create function to clean up orphaned storage files
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files(user_uuid uuid)
RETURNS TABLE(deleted_path text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  storage_file RECORD;
  referenced_paths text[];
  file_path text;
BEGIN
  -- Get all referenced image paths for the user
  SELECT ARRAY(
    SELECT DISTINCT 
      CASE 
        WHEN image_url IS NOT NULL AND image_url LIKE '%/storage/v1/object/public/wardrobe-images/%'
        THEN substring(image_url from '/wardrobe-images/(.+)')
        ELSE NULL
      END
    FROM (
      SELECT image_url FROM clothing_items 
      WHERE user_id = user_uuid AND deleted_at IS NULL
      UNION ALL
      SELECT image_url FROM saved_outfits 
      WHERE user_id = user_uuid AND deleted_at IS NULL
      UNION ALL
      SELECT avatar_url as image_url FROM users 
      WHERE id = user_uuid AND deleted_at IS NULL
    ) AS all_images
    WHERE image_url IS NOT NULL
  ) INTO referenced_paths;

  -- Iterate through storage files for this user
  FOR storage_file IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'wardrobe-images' 
    AND (storage.foldername(name))[1] = user_uuid::text
  LOOP
    file_path := storage_file.name;
    
    -- Check if file is referenced
    IF NOT file_path = ANY(referenced_paths) THEN
      -- Delete the file
      BEGIN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'wardrobe-images' AND name = file_path;
        
        deleted_path := file_path;
        error_message := NULL;
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        deleted_path := file_path;
        error_message := SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create function to get storage usage stats
CREATE OR REPLACE FUNCTION get_storage_usage_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH user_files AS (
    SELECT 
      name,
      metadata->>'size' as file_size,
      CASE
        WHEN name LIKE '%/clothing/%' THEN 'clothing'
        WHEN name LIKE '%/outfit/%' THEN 'outfit'
        WHEN name LIKE '%/profile/%' THEN 'profile'
        ELSE 'other'
      END as file_type
    FROM storage.objects
    WHERE bucket_id = 'wardrobe-images'
    AND (storage.foldername(name))[1] = user_uuid::text
  )
  SELECT json_build_object(
    'total_files', COUNT(*),
    'total_size', SUM(COALESCE(file_size::bigint, 0)),
    'files_by_type', json_object_agg(file_type, file_count),
    'size_by_type', json_object_agg(file_type, type_size)
  ) INTO result
  FROM (
    SELECT 
      file_type,
      COUNT(*) as file_count,
      SUM(COALESCE(file_size::bigint, 0)) as type_size
    FROM user_files
    GROUP BY file_type
  ) stats;
  
  RETURN result;
END;
$$;